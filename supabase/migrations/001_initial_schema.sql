-- ============================================================================
-- Cluegrid: Initial Database Schema
-- Migration 001
--
-- Creates: puzzles, crossers, words, puzzle_stats
-- Plus: indexes, triggers, RLS, public views, stored procedures
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 0. Extensions
-- ----------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";


-- ----------------------------------------------------------------------------
-- 1. Helper Functions
-- ----------------------------------------------------------------------------

-- Auto-update updated_at timestamp on row modification
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;


-- ----------------------------------------------------------------------------
-- 2. Tables
-- ----------------------------------------------------------------------------

-- 2a. puzzles -- one row per daily puzzle
CREATE TABLE puzzles (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    puzzle_date     DATE UNIQUE NOT NULL,
    main_word       VARCHAR(10) NOT NULL,
    main_word_row   INT NOT NULL DEFAULT 2,
    main_word_col   INT NOT NULL DEFAULT 0,
    grid_rows       INT NOT NULL DEFAULT 5,
    grid_cols       INT NOT NULL DEFAULT 5,
    status          VARCHAR(20) NOT NULL DEFAULT 'draft',
    difficulty_rating INT CHECK (difficulty_rating BETWEEN 1 AND 5),
    author          VARCHAR(100),
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at    TIMESTAMPTZ,

    CONSTRAINT valid_status CHECK (status IN ('draft', 'scheduled', 'published', 'archived')),
    CONSTRAINT main_word_uppercase CHECK (main_word = UPPER(main_word)),
    CONSTRAINT valid_grid_rows CHECK (grid_rows BETWEEN 3 AND 10),
    CONSTRAINT valid_grid_cols CHECK (grid_cols BETWEEN 3 AND 10)
);

-- 2b. crossers -- crossing words that intersect the main word
CREATE TABLE crossers (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    puzzle_id           UUID NOT NULL REFERENCES puzzles(id) ON DELETE CASCADE,
    word                VARCHAR(10) NOT NULL,
    clue                TEXT NOT NULL,
    direction           VARCHAR(10) NOT NULL,
    start_row           INT NOT NULL,
    start_col           INT NOT NULL,
    intersection_index  INT NOT NULL,  -- 0-indexed position in crosser that intersects main
    display_order       INT NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT valid_direction CHECK (direction IN ('across', 'down')),
    CONSTRAINT valid_intersection CHECK (intersection_index >= 0),
    CONSTRAINT crosser_word_uppercase CHECK (word = UPPER(word))
);

-- 2c. words -- dictionary for guess validation
CREATE TABLE words (
    word            VARCHAR(10) PRIMARY KEY,
    length          INT GENERATED ALWAYS AS (char_length(word)) STORED,
    frequency_rank  INT,                           -- Lower = more common
    is_valid_guess  BOOLEAN NOT NULL DEFAULT true,
    is_valid_answer BOOLEAN NOT NULL DEFAULT true,
    categories      TEXT[],                         -- e.g. {'common', 'obscure'}
    added_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    added_by        VARCHAR(100),

    CONSTRAINT word_uppercase CHECK (word = UPPER(word))
);

-- 2d. puzzle_stats -- aggregated play statistics per puzzle
CREATE TABLE puzzle_stats (
    puzzle_id           UUID PRIMARY KEY REFERENCES puzzles(id) ON DELETE CASCADE,
    total_plays         INT NOT NULL DEFAULT 0,
    total_completions   INT NOT NULL DEFAULT 0,
    total_wins          INT NOT NULL DEFAULT 0,
    avg_guesses         DECIMAL(4,2),
    guess_distribution  JSONB NOT NULL DEFAULT '{}',
    fastest_solve_seconds INT,
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ----------------------------------------------------------------------------
-- 3. Indexes
-- ----------------------------------------------------------------------------

-- puzzles
CREATE INDEX idx_puzzles_date      ON puzzles(puzzle_date);
CREATE INDEX idx_puzzles_status    ON puzzles(status);
CREATE INDEX idx_puzzles_published ON puzzles(status, puzzle_date) WHERE status = 'published';

-- crossers
CREATE INDEX idx_crossers_puzzle   ON crossers(puzzle_id);
CREATE INDEX idx_crossers_order    ON crossers(puzzle_id, display_order);

-- words
CREATE INDEX idx_words_length      ON words(length) WHERE is_valid_guess = true;
CREATE INDEX idx_words_answer      ON words(length) WHERE is_valid_answer = true;
CREATE INDEX idx_words_frequency   ON words(frequency_rank) WHERE frequency_rank IS NOT NULL;
CREATE INDEX idx_words_guess_lookup ON words(word) WHERE is_valid_guess = true;


-- ----------------------------------------------------------------------------
-- 4. Triggers
-- ----------------------------------------------------------------------------

CREATE TRIGGER puzzles_updated_at
    BEFORE UPDATE ON puzzles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER puzzle_stats_updated_at
    BEFORE UPDATE ON puzzle_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at();


-- ----------------------------------------------------------------------------
-- 5. Row-Level Security
-- ----------------------------------------------------------------------------
-- All access in MVP goes through Next.js API routes using service_role key
-- (which bypasses RLS). Enabling RLS with zero anon policies is defense-in-depth:
-- if the anon key leaks, attackers still get zero data.

ALTER TABLE puzzles      ENABLE ROW LEVEL SECURITY;
ALTER TABLE crossers     ENABLE ROW LEVEL SECURITY;
ALTER TABLE words        ENABLE ROW LEVEL SECURITY;
ALTER TABLE puzzle_stats ENABLE ROW LEVEL SECURITY;

-- No policies = anon role has zero access. Exactly what we want.


-- ----------------------------------------------------------------------------
-- 6. Public Views (answer-safe projections)
-- ----------------------------------------------------------------------------
-- Public-facing API routes should query these views instead of the base tables.
-- They structurally exclude answer columns, making accidental leakage impossible.

CREATE VIEW public_puzzles AS
SELECT
    p.id,
    p.puzzle_date,
    p.grid_rows,
    p.grid_cols,
    p.main_word_row,
    p.main_word_col,
    char_length(p.main_word) AS main_word_length,
    p.difficulty_rating
FROM puzzles p
WHERE p.status = 'published';

CREATE VIEW public_crossers AS
SELECT
    c.id,
    c.puzzle_id,
    c.clue,
    c.direction,
    c.start_row,
    c.start_col,
    char_length(c.word) AS word_length,
    c.intersection_index,
    c.display_order
FROM crossers c;

COMMENT ON VIEW public_puzzles IS 'Answer-safe puzzle projection. Never exposes main_word.';
COMMENT ON VIEW public_crossers IS 'Answer-safe crosser projection. Never exposes word.';


-- ----------------------------------------------------------------------------
-- 7. Stored Procedures
-- ----------------------------------------------------------------------------

-- Atomically increment puzzle stats after a game completion.
-- Uses INSERT ... ON CONFLICT for safe concurrent updates.
CREATE OR REPLACE FUNCTION increment_puzzle_stats(
    p_puzzle_id   UUID,
    p_won         BOOLEAN,
    p_guess_count INT
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO puzzle_stats (puzzle_id, total_plays, total_completions, total_wins, guess_distribution)
    VALUES (
        p_puzzle_id,
        1,
        1,
        CASE WHEN p_won THEN 1 ELSE 0 END,
        jsonb_build_object(p_guess_count::text, 1)
    )
    ON CONFLICT (puzzle_id) DO UPDATE SET
        total_plays       = puzzle_stats.total_plays + 1,
        total_completions = puzzle_stats.total_completions + 1,
        total_wins        = puzzle_stats.total_wins + CASE WHEN p_won THEN 1 ELSE 0 END,
        guess_distribution = puzzle_stats.guess_distribution ||
            jsonb_build_object(
                p_guess_count::text,
                COALESCE((puzzle_stats.guess_distribution->>p_guess_count::text)::int, 0) + 1
            ),
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- Validate that a word exists in the dictionary and is a valid guess.
-- Used by the /api/verify endpoint.
CREATE OR REPLACE FUNCTION is_valid_guess(p_word VARCHAR)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM words
        WHERE word = UPPER(p_word)
          AND is_valid_guess = true
    );
END;
$$ LANGUAGE plpgsql STABLE;

-- Fetch a puzzle's answer data for server-side guess validation.
-- Returns the main_word and all crosser words. Never call from client-facing views.
CREATE OR REPLACE FUNCTION get_puzzle_answers(p_puzzle_id UUID)
RETURNS TABLE (
    main_word       VARCHAR,
    crosser_id      UUID,
    crosser_word    VARCHAR,
    crosser_direction VARCHAR,
    crosser_start_row INT,
    crosser_start_col INT,
    crosser_intersection_index INT,
    crosser_display_order INT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.main_word,
        c.id,
        c.word,
        c.direction,
        c.start_row,
        c.start_col,
        c.intersection_index,
        c.display_order
    FROM puzzles p
    LEFT JOIN crossers c ON c.puzzle_id = p.id
    WHERE p.id = p_puzzle_id;
END;
$$ LANGUAGE plpgsql STABLE;


-- ============================================================================
-- Migration complete.
-- Next: 002_seed_words.sql
-- ============================================================================
