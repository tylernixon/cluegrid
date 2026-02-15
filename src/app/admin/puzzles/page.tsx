'use client';

import { useState, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { validatePuzzleIntersections } from '@/lib/puzzle';
import { useAdminAuth } from '@/hooks/useAdminAuth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CrosserInput {
  word: string;
  clue: string;
  startRow: number;
  startCol: number;
  intersectionIndex: number;
}

interface GridCell {
  letter: string;
  isMainWord: boolean;
  isCrosser: boolean;
  crosserIndex: number | null;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PuzzleEditorPage() {
  const router = useRouter();
  const { authFetch } = useAdminAuth();

  // Form state
  const [date, setDate] = useState(() => {
    // Default to tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0]!;
  });
  const [mainWord, setMainWord] = useState('');
  const [mainWordRow, setMainWordRow] = useState(2);
  const [mainWordCol, setMainWordCol] = useState(0);
  const [gridRows, setGridRows] = useState(5);
  const [gridCols, setGridCols] = useState(5);
  const [status, setStatus] = useState<'draft' | 'scheduled'>('draft');
  const [difficultyRating, setDifficultyRating] = useState<number | null>(null);
  const [author, setAuthor] = useState('');
  const [notes, setNotes] = useState('');

  const [crossers, setCrossers] = useState<CrosserInput[]>([
    { word: '', clue: '', startRow: 0, startCol: 0, intersectionIndex: 2 },
  ]);

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // AI generation state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiMode, setAIMode] = useState<'crossers' | 'full'>('full');
  const [aiTheme, setAITheme] = useState('');
  const [aiDifficulty, setAIDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiCrosserCount, setAICrosserCount] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);

  // Validation
  const validation = useMemo(() => {
    if (!mainWord || crossers.every((c) => !c.word)) {
      return { valid: false, errors: [] };
    }
    return validatePuzzleIntersections(
      mainWord.toUpperCase(),
      mainWordRow,
      mainWordCol,
      crossers.filter((c) => c.word).map((c) => ({
        word: c.word.toUpperCase(),
        startRow: c.startRow,
        startCol: c.startCol,
        intersectionIndex: c.intersectionIndex,
      })),
    );
  }, [mainWord, mainWordRow, mainWordCol, crossers]);

  // Grid preview
  const gridPreview = useMemo((): GridCell[][] => {
    // Safety check for valid dimensions
    const safeRows = Math.max(1, gridRows || 5);
    const safeCols = Math.max(1, gridCols || 5);

    const grid: GridCell[][] = Array.from({ length: safeRows }, () =>
      Array.from({ length: safeCols }, () => ({
        letter: '',
        isMainWord: false,
        isCrosser: false,
        crosserIndex: null,
      })),
    );

    // Place main word
    const upperMain = mainWord.toUpperCase();
    for (let i = 0; i < upperMain.length; i++) {
      const col = mainWordCol + i;
      if (mainWordRow >= 0 && mainWordRow < safeRows && col >= 0 && col < safeCols && grid[mainWordRow]) {
        grid[mainWordRow][col] = {
          letter: upperMain[i] ?? '',
          isMainWord: true,
          isCrosser: false,
          crosserIndex: null,
        };
      }
    }

    // Place crossers
    crossers.forEach((crosser, crosserIndex) => {
      const upperWord = crosser.word.toUpperCase();
      for (let i = 0; i < upperWord.length; i++) {
        const row = crosser.startRow + i;
        const col = crosser.startCol;
        if (row >= 0 && row < safeRows && col >= 0 && col < safeCols && grid[row]) {
          const existing = grid[row][col];
          grid[row][col] = {
            letter: upperWord[i] ?? '',
            isMainWord: existing?.isMainWord ?? false,
            isCrosser: true,
            crosserIndex,
          };
        }
      }
    });

    return grid;
  }, [mainWord, mainWordRow, mainWordCol, crossers, gridRows, gridCols]);

  // Handlers
  const addCrosser = useCallback(() => {
    if (crossers.length >= 6) return;
    setCrossers((prev) => [
      ...prev,
      { word: '', clue: '', startRow: 0, startCol: prev.length, intersectionIndex: 2 },
    ]);
  }, [crossers.length]);

  const removeCrosser = useCallback((index: number) => {
    setCrossers((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const updateCrosser = useCallback(
    (index: number, updates: Partial<CrosserInput>) => {
      setCrossers((prev) =>
        prev.map((c, i) => (i === index ? { ...c, ...updates } : c)),
      );
    },
    [],
  );

  const handleAIGenerate = async () => {
    setAIError(null);

    if (aiMode === 'crossers' && !mainWord) {
      setAIError('Enter a main word first, or switch to "Full Puzzle" mode');
      return;
    }
    if (aiMode === 'full' && !aiTheme.trim()) {
      setAIError('Enter a theme for full puzzle generation');
      return;
    }

    setIsGenerating(true);

    try {
      const res = await authFetch('/api/admin/puzzles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: aiMode,
          mainWord: aiMode === 'crossers' ? mainWord.toUpperCase() : undefined,
          theme: aiTheme || undefined,
          difficulty: aiDifficulty,
          crosserCount: aiCrosserCount,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setAIError(data.message || 'Generation failed');
        return;
      }

      const puzzle = data.puzzle;

      // Fill in the form with generated data
      if (puzzle.mainWord) setMainWord(puzzle.mainWord);
      if (puzzle.mainWordRow !== undefined) setMainWordRow(puzzle.mainWordRow);
      if (puzzle.mainWordCol !== undefined) setMainWordCol(puzzle.mainWordCol);
      if (puzzle.gridRows) setGridRows(puzzle.gridRows);
      if (puzzle.gridCols) setGridCols(puzzle.gridCols);

      if (Array.isArray(puzzle.crossers)) {
        setCrossers(
          puzzle.crossers.map((c: { word: string; clue: string; startRow: number; startCol: number; intersectionIndex: number }) => ({
            word: c.word,
            clue: c.clue,
            startRow: c.startRow,
            startCol: c.startCol,
            intersectionIndex: c.intersectionIndex,
          })),
        );
      }

      setAuthor('AI Generated');
      setShowAIModal(false);
      setSuccess('Puzzle generated with AI! Review and adjust as needed.');
    } catch (err) {
      setAIError('Network error. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    // Validate required fields
    if (!mainWord) {
      setError('Main word is required');
      return;
    }

    const validCrossers = crossers.filter((c) => c.word && c.clue);
    if (validCrossers.length === 0) {
      setError('At least one crosser with word and clue is required');
      return;
    }

    // Check intersection validation
    if (!validation.valid && validation.errors.length > 0) {
      setError(validation.errors.join('; '));
      return;
    }

    setIsSubmitting(true);

    try {
      const payload = {
        date,
        mainWord: mainWord.toUpperCase(),
        mainWordRow,
        mainWordCol,
        gridRows,
        gridCols,
        status,
        difficultyRating: difficultyRating ?? undefined,
        author: author || undefined,
        notes: notes || undefined,
        crossers: validCrossers.map((c, i) => ({
          word: c.word.toUpperCase(),
          clue: c.clue,
          direction: 'down' as const,
          startRow: c.startRow,
          startCol: c.startCol,
          intersectionIndex: c.intersectionIndex,
          displayOrder: i + 1,
        })),
      };

      const res = await authFetch('/api/admin/puzzles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to create puzzle');
        return;
      }

      setSuccess(`Puzzle created for ${date}!`);

      // Reset form after short delay
      setTimeout(() => {
        router.push('/admin/puzzles/list');
      }, 1500);
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Create New Puzzle</h1>
        <button
          type="button"
          onClick={() => setShowAIModal(true)}
          className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
          </svg>
          Generate with AI
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error/Success messages */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
              {error}
            </div>
          )}
          {success && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-sm text-green-700">
              {success}
            </div>
          )}

          {/* Basic Info */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <h2 className="font-semibold text-gray-900">Basic Information</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                  Puzzle Date
                </label>
                <input
                  id="date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  id="status"
                  value={status}
                  onChange={(e) => setStatus(e.target.value as 'draft' | 'scheduled')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                </select>
              </div>
            </div>

            <div>
              <label htmlFor="mainWord" className="block text-sm font-medium text-gray-700 mb-1">
                Main Word (answer)
              </label>
              <input
                id="mainWord"
                type="text"
                value={mainWord}
                onChange={(e) => setMainWord(e.target.value.toUpperCase().replace(/[^A-Z]/g, ''))}
                maxLength={10}
                placeholder="e.g. CRANE"
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>

            <div className="grid grid-cols-4 gap-4">
              <div>
                <label htmlFor="mainWordRow" className="block text-sm font-medium text-gray-700 mb-1">
                  Main Row
                </label>
                <input
                  id="mainWordRow"
                  type="number"
                  min={0}
                  max={gridRows - 1}
                  value={mainWordRow}
                  onChange={(e) => setMainWordRow(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="mainWordCol" className="block text-sm font-medium text-gray-700 mb-1">
                  Main Col
                </label>
                <input
                  id="mainWordCol"
                  type="number"
                  min={0}
                  value={mainWordCol}
                  onChange={(e) => setMainWordCol(parseInt(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="gridRows" className="block text-sm font-medium text-gray-700 mb-1">
                  Grid Rows
                </label>
                <input
                  id="gridRows"
                  type="number"
                  min={3}
                  max={10}
                  value={gridRows}
                  onChange={(e) => setGridRows(parseInt(e.target.value) || 5)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="gridCols" className="block text-sm font-medium text-gray-700 mb-1">
                  Grid Cols
                </label>
                <input
                  id="gridCols"
                  type="number"
                  min={3}
                  max={10}
                  value={gridCols}
                  onChange={(e) => setGridCols(parseInt(e.target.value) || 5)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Crossers */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Crossers</h2>
              <button
                type="button"
                onClick={addCrosser}
                disabled={crossers.length >= 6}
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Add Crosser
              </button>
            </div>

            {crossers.map((crosser, index) => (
              <div
                key={index}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Crosser {index + 1}
                  </span>
                  {crossers.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeCrosser(index)}
                      className="text-sm text-red-600 hover:text-red-800"
                    >
                      Remove
                    </button>
                  )}
                </div>

                <div className="grid sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Word
                    </label>
                    <input
                      type="text"
                      value={crosser.word}
                      onChange={(e) =>
                        updateCrosser(index, {
                          word: e.target.value.toUpperCase().replace(/[^A-Z]/g, ''),
                        })
                      }
                      maxLength={10}
                      placeholder="e.g. OCCUR"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Clue
                    </label>
                    <input
                      type="text"
                      value={crosser.clue}
                      onChange={(e) => updateCrosser(index, { clue: e.target.value })}
                      maxLength={500}
                      placeholder="Write a clue..."
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Start Row
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={crosser.startRow}
                      onChange={(e) =>
                        updateCrosser(index, { startRow: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Start Col
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={crosser.startCol}
                      onChange={(e) =>
                        updateCrosser(index, { startCol: parseInt(e.target.value) || 0 })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Intersect Idx
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={crosser.word.length > 0 ? crosser.word.length - 1 : 9}
                      value={crosser.intersectionIndex}
                      onChange={(e) =>
                        updateCrosser(index, {
                          intersectionIndex: parseInt(e.target.value) || 0,
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Optional Metadata */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <h2 className="font-semibold text-gray-900">Optional Metadata</h2>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="difficulty" className="block text-sm font-medium text-gray-700 mb-1">
                  Difficulty (1-5)
                </label>
                <input
                  id="difficulty"
                  type="number"
                  min={1}
                  max={5}
                  value={difficultyRating ?? ''}
                  onChange={(e) => {
                    const val = e.target.value ? parseInt(e.target.value) : null;
                    setDifficultyRating(val);
                  }}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                  Author
                </label>
                <input
                  id="author"
                  type="text"
                  value={author}
                  onChange={(e) => setAuthor(e.target.value)}
                  maxLength={100}
                  placeholder="Optional"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <div>
              <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                maxLength={2000}
                rows={3}
                placeholder="Internal notes..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
              />
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Creating...' : 'Create Puzzle'}
          </button>
        </form>

        {/* Preview */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-4">Grid Preview</h2>

            <div
              className="inline-grid gap-1"
              style={{
                gridTemplateRows: `repeat(${gridRows}, 40px)`,
                gridTemplateColumns: `repeat(${gridCols}, 40px)`,
              }}
            >
              {gridPreview.map((row, rowIndex) =>
                row.map((cell, colIndex) => (
                  <div
                    key={`${rowIndex}-${colIndex}`}
                    className={`
                      flex items-center justify-center text-sm font-mono font-bold rounded
                      ${cell.letter ? 'border-2' : 'border border-dashed'}
                      ${cell.isMainWord && cell.isCrosser
                        ? 'bg-purple-100 border-purple-400 text-purple-700'
                        : cell.isMainWord
                          ? 'bg-blue-100 border-blue-400 text-blue-700'
                          : cell.isCrosser
                            ? 'bg-green-100 border-green-400 text-green-700'
                            : 'bg-gray-50 border-gray-200 text-gray-400'
                      }
                    `}
                  >
                    {cell.letter || (
                      <span className="text-xs text-gray-300">
                        {rowIndex},{colIndex}
                      </span>
                    )}
                  </div>
                )),
              )}
            </div>

            <div className="mt-4 flex items-center gap-4 text-xs text-gray-600">
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-blue-100 border border-blue-400 rounded" />
                Main Word
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-green-100 border border-green-400 rounded" />
                Crosser
              </div>
              <div className="flex items-center gap-1">
                <div className="w-4 h-4 bg-purple-100 border border-purple-400 rounded" />
                Intersection
              </div>
            </div>
          </div>

          {/* Validation Status */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <h2 className="font-semibold text-gray-900 mb-4">Validation</h2>

            {!mainWord || crossers.every((c) => !c.word) ? (
              <p className="text-sm text-gray-500">
                Enter a main word and at least one crosser to validate.
              </p>
            ) : validation.valid ? (
              <div className="flex items-center gap-2 text-green-700">
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-sm font-medium">All intersections valid</span>
              </div>
            ) : (
              <div className="space-y-2">
                {validation.errors.map((err, i) => (
                  <div key={i} className="flex items-start gap-2 text-red-700">
                    <svg
                      className="w-5 h-5 shrink-0 mt-0.5"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                    <span className="text-sm">{err}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AI Generation Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg mx-4 shadow-xl w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Generate Puzzle with AI</h3>

            {aiError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
                {aiError}
              </div>
            )}

            <div className="space-y-4">
              {/* Mode selector */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mode</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setAIMode('full')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md border transition-colors ${
                      aiMode === 'full'
                        ? 'bg-purple-100 border-purple-400 text-purple-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Full Puzzle
                  </button>
                  <button
                    type="button"
                    onClick={() => setAIMode('crossers')}
                    className={`flex-1 py-2 px-3 text-sm font-medium rounded-md border transition-colors ${
                      aiMode === 'crossers'
                        ? 'bg-purple-100 border-purple-400 text-purple-700'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    Crossers Only
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {aiMode === 'full'
                    ? 'Generate a complete puzzle from a theme'
                    : 'Generate crosser words for the current main word'}
                </p>
              </div>

              {/* Theme input (always shown, used as context for crossers mode too) */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Theme {aiMode === 'full' ? '(required)' : '(optional)'}
                </label>
                <input
                  type="text"
                  value={aiTheme}
                  onChange={(e) => setAITheme(e.target.value)}
                  placeholder="e.g. Valentine's Day, Space Exploration, Kitchen"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                />
              </div>

              {/* Current main word display for crossers mode */}
              {aiMode === 'crossers' && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <span className="text-sm text-blue-700">
                    Main word: <strong className="font-mono">{mainWord || '(not set)'}</strong>
                  </span>
                  {!mainWord && (
                    <p className="text-xs text-blue-600 mt-1">
                      Set a main word in the form above before generating crossers.
                    </p>
                  )}
                </div>
              )}

              {/* Difficulty */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Clue Difficulty</label>
                <select
                  value={aiDifficulty}
                  onChange={(e) => setAIDifficulty(e.target.value as 'easy' | 'medium' | 'hard')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                >
                  <option value="easy">Easy - straightforward clues</option>
                  <option value="medium">Medium - clever wordplay</option>
                  <option value="hard">Hard - cryptic style</option>
                </select>
              </div>

              {/* Crosser count */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Number of Crossers
                </label>
                <input
                  type="range"
                  min={3}
                  max={5}
                  value={aiCrosserCount}
                  onChange={(e) => setAICrosserCount(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-1">
                  <span>3</span>
                  <span className="font-medium text-gray-700">{aiCrosserCount}</span>
                  <span>5</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                type="button"
                onClick={() => { setShowAIModal(false); setAIError(null); }}
                disabled={isGenerating}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleAIGenerate}
                disabled={isGenerating}
                className="flex-1 py-2 px-4 bg-purple-600 text-white rounded-md hover:bg-purple-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Generating...
                  </>
                ) : (
                  'Generate'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
