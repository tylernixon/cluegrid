-- ============================================================================
-- Cluegrid: Add Theme Support
-- Migration 003
--
-- Adds: theme and theme_hint columns to puzzles table
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Add theme columns to puzzles table
-- ----------------------------------------------------------------------------

-- theme: The name of the puzzle's theme (e.g., "At the Beach")
-- Displayed to players after completing the puzzle
ALTER TABLE puzzles
ADD COLUMN theme VARCHAR(100);

-- theme_hint: A subtle hint shown during gameplay (e.g., "Sun, sand, and surf")
-- Optional, can be used to help players identify the theme
ALTER TABLE puzzles
ADD COLUMN theme_hint VARCHAR(200);

-- Add comments for documentation
COMMENT ON COLUMN puzzles.theme IS 'Theme name revealed after puzzle completion (e.g., "At the Beach")';
COMMENT ON COLUMN puzzles.theme_hint IS 'Optional subtle hint shown during gameplay to help identify theme';


-- ----------------------------------------------------------------------------
-- 2. Update public_puzzles view to include theme_hint (but NOT theme)
-- ----------------------------------------------------------------------------
-- The theme is revealed only after completion, so we include theme_hint
-- but exclude theme from the public view.

DROP VIEW IF EXISTS public_puzzles;

CREATE VIEW public_puzzles AS
SELECT
    p.id,
    p.puzzle_date,
    p.grid_rows,
    p.grid_cols,
    p.main_word_row,
    p.main_word_col,
    char_length(p.main_word) AS main_word_length,
    p.difficulty_rating,
    p.theme_hint
FROM puzzles p
WHERE p.status = 'published';

COMMENT ON VIEW public_puzzles IS 'Answer-safe puzzle projection. Exposes theme_hint but not theme (revealed after completion).';


-- ============================================================================
-- Migration complete.
-- ============================================================================
