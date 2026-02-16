import { supabase } from '@/lib/supabase';
import type { PuzzleData, CrosserData } from '@/types';

// ---------------------------------------------------------------------------
// Mock puzzle fallback -- used when no DB puzzle exists for a date
// ---------------------------------------------------------------------------
const MOCK_PUZZLE: PuzzleData = {
  id: 'mock-1',
  date: '2024-01-15',
  mainWord: { word: 'BEACH', row: 2, col: 0, length: 5 },
  crossers: [
    {
      id: 'c1',
      word: 'SHELL',
      clue: 'A hard outer covering found on the shore',
      direction: 'down',
      startRow: 0,
      startCol: 1,
      intersectionIndex: 2, // 'E' at index 2 intersects BEACH's 'E' at col 1
    },
    {
      id: 'c2',
      word: 'CRAB',
      clue: 'A crustacean that walks sideways',
      direction: 'down',
      startRow: 0,
      startCol: 2,
      intersectionIndex: 2, // 'A' at index 2 intersects BEACH's 'A' at col 2
    },
    {
      id: 'c3',
      word: 'OCEAN',
      clue: 'A vast body of salt water',
      direction: 'down',
      startRow: 1,
      startCol: 3,
      intersectionIndex: 1, // 'C' at index 1 intersects BEACH's 'C' at col 3
    },
  ],
  gridSize: { rows: 6, cols: 5 },
  theme: 'At the Beach',
  themeHint: 'Sun, sand, and surf',
};

// ---------------------------------------------------------------------------
// Database types (match Supabase schema)
// ---------------------------------------------------------------------------
interface DbPuzzle {
  id: string;
  puzzle_date: string;
  main_word: string;
  main_word_row: number;
  main_word_col: number;
  grid_rows: number;
  grid_cols: number;
  status: string;
  theme: string | null;
  theme_hint: string | null;
}

interface DbCrosser {
  id: string;
  puzzle_id: string;
  word: string;
  clue: string;
  direction: string;
  start_row: number;
  start_col: number;
  intersection_index: number;
  display_order: number;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Fetches the puzzle for a given date.
 *
 * Looks up a published puzzle in the database for the given date.
 * Falls back to mock data if no puzzle exists or if fetch fails.
 *
 * @param date - Date string in YYYY-MM-DD format
 * @returns PuzzleData with full puzzle information including answers
 */
export async function getPuzzleForDate(date: string): Promise<PuzzleData> {
  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    console.warn(`[getPuzzleForDate] Invalid date format: ${date}, returning mock puzzle`);
    return { ...MOCK_PUZZLE, date };
  }

  try {
    console.log(`[getPuzzleForDate] Fetching puzzle for date: ${date}`);

    // Fetch published puzzle for date
    const { data: puzzle, error: puzzleError } = await supabase
      .from('puzzles')
      .select('*')
      .eq('puzzle_date', date)
      .eq('status', 'published')
      .single();

    console.log(`[getPuzzleForDate] Query result:`, {
      date,
      hasData: !!puzzle,
      puzzleId: puzzle?.id,
      mainWord: puzzle?.main_word,
      error: puzzleError?.message,
    });

    if (puzzleError || !puzzle) {
      // No published puzzle for this date - return mock
      console.log(`[getPuzzleForDate] No published puzzle for ${date}, using mock BEACH`);
      return { ...MOCK_PUZZLE, date };
    }

    const dbPuzzle = puzzle as DbPuzzle;

    // Fetch crossers for puzzle
    const { data: crossers, error: crossersError } = await supabase
      .from('crossers')
      .select('*')
      .eq('puzzle_id', dbPuzzle.id)
      .order('display_order', { ascending: true });

    if (crossersError) {
      console.error(`Failed to fetch crossers for puzzle ${dbPuzzle.id}:`, crossersError);
      return { ...MOCK_PUZZLE, date };
    }

    const dbCrossers = (crossers ?? []) as DbCrosser[];

    // Transform to PuzzleData format
    const puzzleData: PuzzleData = {
      id: dbPuzzle.id,
      date: dbPuzzle.puzzle_date,
      mainWord: {
        word: dbPuzzle.main_word,
        row: dbPuzzle.main_word_row,
        col: dbPuzzle.main_word_col,
        length: dbPuzzle.main_word.length,
      },
      crossers: dbCrossers.map((c): CrosserData => ({
        id: c.id,
        word: c.word,
        clue: c.clue,
        direction: 'down', // Schema enforces this
        startRow: c.start_row,
        startCol: c.start_col,
        intersectionIndex: c.intersection_index,
      })),
      gridSize: {
        rows: dbPuzzle.grid_rows,
        cols: dbPuzzle.grid_cols,
      },
      ...(dbPuzzle.theme && { theme: dbPuzzle.theme }),
      ...(dbPuzzle.theme_hint && { themeHint: dbPuzzle.theme_hint }),
    };

    return puzzleData;
  } catch (error) {
    console.error(`Error fetching puzzle for ${date}:`, error);
    return { ...MOCK_PUZZLE, date };
  }
}

/**
 * Gets today's puzzle date in YYYY-MM-DD format.
 * Uses Pacific Time since puzzles are published in that timezone.
 */
export function getTodayDate(): string {
  const now = new Date();
  // Format in Pacific Time (handles PST/PDT automatically)
  const pacificDate = now.toLocaleDateString('en-CA', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  // en-CA locale gives YYYY-MM-DD format
  return pacificDate;
}

/**
 * Fetches today's puzzle.
 */
export async function getTodayPuzzle(): Promise<PuzzleData> {
  return getPuzzleForDate(getTodayDate());
}

/**
 * Validates that a puzzle's crossers correctly intersect the main word.
 * Used for validation in the puzzle editor.
 */
export function validatePuzzleIntersections(
  mainWord: string,
  mainWordRow: number,
  mainWordCol: number,
  crossers: Array<{
    word: string;
    startRow: number;
    startCol: number;
    intersectionIndex: number;
  }>,
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  for (let i = 0; i < crossers.length; i++) {
    const crosser = crossers[i]!;
    const crosserNum = i + 1;

    // Check that crosser column is within main word bounds
    const mainColStart = mainWordCol;
    const mainColEnd = mainWordCol + mainWord.length - 1;

    if (crosser.startCol < mainColStart || crosser.startCol > mainColEnd) {
      errors.push(
        `Crosser ${crosserNum}: Column ${crosser.startCol} is outside main word range (${mainColStart}-${mainColEnd})`,
      );
      continue;
    }

    // Check that crosser extends through main word row
    const crosserStartRow = crosser.startRow;
    const crosserEndRow = crosser.startRow + crosser.word.length - 1;

    if (mainWordRow < crosserStartRow || mainWordRow > crosserEndRow) {
      errors.push(
        `Crosser ${crosserNum}: Does not pass through main word row ${mainWordRow} (rows ${crosserStartRow}-${crosserEndRow})`,
      );
      continue;
    }

    // Check intersection index is valid
    if (crosser.intersectionIndex < 0 || crosser.intersectionIndex >= crosser.word.length) {
      errors.push(
        `Crosser ${crosserNum}: Intersection index ${crosser.intersectionIndex} is out of bounds for word "${crosser.word}"`,
      );
      continue;
    }

    // Check that letters match at intersection
    const mainWordIndex = crosser.startCol - mainWordCol;
    const mainLetter = mainWord[mainWordIndex];
    const crosserLetter = crosser.word[crosser.intersectionIndex];

    if (mainLetter !== crosserLetter) {
      errors.push(
        `Crosser ${crosserNum}: Letter mismatch at intersection. Main word has "${mainLetter}" but crosser has "${crosserLetter}"`,
      );
    }

    // Verify intersection row calculation matches
    const expectedIntersectionRow = crosser.startRow + crosser.intersectionIndex;
    if (expectedIntersectionRow !== mainWordRow) {
      errors.push(
        `Crosser ${crosserNum}: Row alignment error. Expected intersection at row ${mainWordRow} but calculated row ${expectedIntersectionRow}`,
      );
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Checks for horizontal letter sequences formed by crossers on the same row.
 * Returns warnings for rows where multiple crossers share letters (excluding main word row).
 */
export function checkHorizontalConflicts(
  mainWordRow: number,
  gridCols: number,
  crossers: Array<{
    word: string;
    startRow: number;
    startCol: number;
  }>,
): { warnings: string[] } {
  const warnings: string[] = [];

  // Build a map of row -> columns that have crosser letters
  const rowLetters = new Map<number, Map<number, string>>();

  for (const crosser of crossers) {
    for (let i = 0; i < crosser.word.length; i++) {
      const row = crosser.startRow + i;
      const col = crosser.startCol;
      const letter = crosser.word[i]!;

      if (!rowLetters.has(row)) {
        rowLetters.set(row, new Map());
      }
      rowLetters.get(row)!.set(col, letter);
    }
  }

  // Check each row (except main word row) for multiple letters
  for (const [row, colMap] of rowLetters) {
    if (row === mainWordRow) continue; // Skip main word row
    if (colMap.size < 2) continue; // Need at least 2 letters

    // Build the horizontal sequence
    const cols = Array.from(colMap.keys()).sort((a, b) => a - b);
    let sequence = '';
    let lastCol = -2;

    for (const col of cols) {
      if (col === lastCol + 1) {
        // Adjacent letter
        sequence += colMap.get(col);
      } else {
        // Gap - check previous sequence
        if (sequence.length >= 3) {
          warnings.push(
            `Row ${row}: Adjacent crosser letters form "${sequence}" - verify this isn't a confusing word`
          );
        }
        sequence = colMap.get(col)!;
      }
      lastCol = col;
    }

    // Check final sequence
    if (sequence.length >= 3) {
      warnings.push(
        `Row ${row}: Adjacent crosser letters form "${sequence}" - verify this isn't a confusing word`
      );
    } else if (colMap.size >= 2) {
      // Non-adjacent letters on same row
      const letters = cols.map(c => colMap.get(c)).join(', ');
      warnings.push(
        `Row ${row}: Multiple crosser letters (${letters}) on same row may look like a word`
      );
    }
  }

  return { warnings };
}
