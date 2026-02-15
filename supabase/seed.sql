-- ============================================================================
-- Cluegrid: Development Seed Data
--
-- Sample puzzles for local development and testing.
-- Run AFTER migrations: supabase db reset (applies migrations + this seed)
--
-- Contains 7 puzzles (one week) with varying difficulty.
-- ============================================================================

-- Use fixed UUIDs for predictable test references
-- Puzzle 1: CRANE (easy, 3 crossers)
INSERT INTO puzzles (id, puzzle_date, main_word, main_word_row, main_word_col, grid_rows, grid_cols, status, difficulty_rating, author)
VALUES (
    '00000000-0000-0000-0000-000000000001',
    CURRENT_DATE,
    'CRANE',
    3, 0, 7, 5,
    'published', 2, 'seed'
);

INSERT INTO crossers (id, puzzle_id, word, clue, direction, start_row, start_col, intersection_index, display_order) VALUES
('00000000-0000-0000-0001-000000000001', '00000000-0000-0000-0000-000000000001', 'CRISP', 'Potato chip texture', 'down', 1, 0, 2, 1),
('00000000-0000-0000-0001-000000000002', '00000000-0000-0000-0000-000000000001', 'DREAM', 'What happens during REM sleep', 'down', 1, 2, 2, 2),
('00000000-0000-0000-0001-000000000003', '00000000-0000-0000-0000-000000000001', 'STEER', 'To guide a vehicle', 'down', 1, 4, 2, 3);

-- Puzzle 2: BLAZE (medium, 4 crossers)
INSERT INTO puzzles (id, puzzle_date, main_word, main_word_row, main_word_col, grid_rows, grid_cols, status, difficulty_rating, author)
VALUES (
    '00000000-0000-0000-0000-000000000002',
    CURRENT_DATE + INTERVAL '1 day',
    'BLAZE',
    3, 0, 7, 5,
    'published', 3, 'seed'
);

INSERT INTO crossers (id, puzzle_id, word, clue, direction, start_row, start_col, intersection_index, display_order) VALUES
('00000000-0000-0000-0002-000000000001', '00000000-0000-0000-0000-000000000002', 'CABIN', 'Rustic woodland shelter', 'down', 1, 0, 2, 1),
('00000000-0000-0000-0002-000000000002', '00000000-0000-0000-0000-000000000002', 'CLOUD', 'Fluffy thing in the sky', 'down', 1, 1, 2, 2),
('00000000-0000-0000-0002-000000000003', '00000000-0000-0000-0000-000000000002', 'PLAZA', 'Town square', 'down', 1, 2, 2, 3),
('00000000-0000-0000-0002-000000000004', '00000000-0000-0000-0000-000000000002', 'HAZEL', 'Nut-bearing shrub or eye color', 'down', 1, 4, 2, 4);

-- Puzzle 3: FROST (medium, 3 crossers)
INSERT INTO puzzles (id, puzzle_date, main_word, main_word_row, main_word_col, grid_rows, grid_cols, status, difficulty_rating, author)
VALUES (
    '00000000-0000-0000-0000-000000000003',
    CURRENT_DATE + INTERVAL '2 days',
    'FROST',
    3, 0, 7, 5,
    'published', 3, 'seed'
);

INSERT INTO crossers (id, puzzle_id, word, clue, direction, start_row, start_col, intersection_index, display_order) VALUES
('00000000-0000-0000-0003-000000000001', '00000000-0000-0000-0000-000000000003', 'OFFER', 'To present for acceptance', 'down', 1, 0, 2, 1),
('00000000-0000-0000-0003-000000000002', '00000000-0000-0000-0000-000000000003', 'BROOM', 'Sweeping tool', 'down', 1, 2, 2, 2),
('00000000-0000-0000-0003-000000000003', '00000000-0000-0000-0000-000000000003', 'BLAST', 'Explosion or a great time', 'down', 1, 4, 2, 3);

-- Puzzle 4: GLOBE (easy, 3 crossers)
INSERT INTO puzzles (id, puzzle_date, main_word, main_word_row, main_word_col, grid_rows, grid_cols, status, difficulty_rating, author)
VALUES (
    '00000000-0000-0000-0000-000000000004',
    CURRENT_DATE + INTERVAL '3 days',
    'GLOBE',
    3, 0, 7, 5,
    'published', 1, 'seed'
);

INSERT INTO crossers (id, puzzle_id, word, clue, direction, start_row, start_col, intersection_index, display_order) VALUES
('00000000-0000-0000-0004-000000000001', '00000000-0000-0000-0000-000000000004', 'MAGIC', 'Card trick art', 'down', 1, 0, 2, 1),
('00000000-0000-0000-0004-000000000002', '00000000-0000-0000-0000-000000000004', 'FLOOR', 'What you stand on', 'down', 1, 2, 2, 2),
('00000000-0000-0000-0004-000000000003', '00000000-0000-0000-0000-000000000004', 'TRIBE', 'Close-knit group', 'down', 1, 4, 2, 3);

-- Puzzle 5: SPIRE (hard, 4 crossers)
INSERT INTO puzzles (id, puzzle_date, main_word, main_word_row, main_word_col, grid_rows, grid_cols, status, difficulty_rating, author)
VALUES (
    '00000000-0000-0000-0000-000000000005',
    CURRENT_DATE + INTERVAL '4 days',
    'SPIRE',
    3, 0, 7, 5,
    'published', 4, 'seed'
);

INSERT INTO crossers (id, puzzle_id, word, clue, direction, start_row, start_col, intersection_index, display_order) VALUES
('00000000-0000-0000-0005-000000000001', '00000000-0000-0000-0000-000000000005', 'CLASH', 'Conflict or band name', 'down', 1, 0, 2, 1),
('00000000-0000-0000-0005-000000000002', '00000000-0000-0000-0000-000000000005', 'APPLE', 'Fruit or tech company', 'down', 1, 1, 2, 2),
('00000000-0000-0000-0005-000000000003', '00000000-0000-0000-0000-000000000005', 'QUIRK', 'Peculiar trait', 'down', 1, 3, 2, 3),
('00000000-0000-0000-0005-000000000004', '00000000-0000-0000-0000-000000000005', 'THREE', 'Number after two', 'down', 1, 4, 2, 4);

-- Puzzle 6: WHEAT (medium, 3 crossers)
INSERT INTO puzzles (id, puzzle_date, main_word, main_word_row, main_word_col, grid_rows, grid_cols, status, difficulty_rating, author)
VALUES (
    '00000000-0000-0000-0000-000000000006',
    CURRENT_DATE + INTERVAL '5 days',
    'WHEAT',
    3, 0, 7, 5,
    'published', 3, 'seed'
);

INSERT INTO crossers (id, puzzle_id, word, clue, direction, start_row, start_col, intersection_index, display_order) VALUES
('00000000-0000-0000-0006-000000000001', '00000000-0000-0000-0000-000000000006', 'SWAMP', 'Marshy wetland', 'down', 1, 0, 2, 1),
('00000000-0000-0000-0006-000000000002', '00000000-0000-0000-0000-000000000006', 'CHEER', 'Expression of encouragement', 'down', 1, 2, 2, 2),
('00000000-0000-0000-0006-000000000003', '00000000-0000-0000-0000-000000000006', 'TREAT', 'Special indulgence', 'down', 1, 4, 2, 3);

-- Puzzle 7: PLUMB (hard, 4 crossers)
INSERT INTO puzzles (id, puzzle_date, main_word, main_word_row, main_word_col, grid_rows, grid_cols, status, difficulty_rating, author)
VALUES (
    '00000000-0000-0000-0000-000000000007',
    CURRENT_DATE + INTERVAL '6 days',
    'PLUMB',
    3, 0, 7, 5,
    'published', 4, 'seed'
);

INSERT INTO crossers (id, puzzle_id, word, clue, direction, start_row, start_col, intersection_index, display_order) VALUES
('00000000-0000-0000-0007-000000000001', '00000000-0000-0000-0000-000000000007', 'RAPID', 'Very fast', 'down', 1, 0, 2, 1),
('00000000-0000-0000-0007-000000000002', '00000000-0000-0000-0000-000000000007', 'FLUTE', 'Woodwind instrument', 'down', 1, 1, 2, 2),
('00000000-0000-0000-0007-000000000003', '00000000-0000-0000-0000-000000000007', 'THUMB', 'Opposable digit', 'down', 1, 3, 2, 3),
('00000000-0000-0000-0007-000000000004', '00000000-0000-0000-0000-000000000007', 'CLIMB', 'Ascend upward', 'down', 1, 4, 2, 4);

-- Also create a draft puzzle for admin testing
INSERT INTO puzzles (id, puzzle_date, main_word, main_word_row, main_word_col, grid_rows, grid_cols, status, difficulty_rating, author, notes)
VALUES (
    '00000000-0000-0000-0000-000000000008',
    CURRENT_DATE + INTERVAL '14 days',
    'DRAFT',
    3, 0, 7, 5,
    'draft', 2, 'seed',
    'This is a draft puzzle for testing admin CRUD operations'
);

INSERT INTO crossers (id, puzzle_id, word, clue, direction, start_row, start_col, intersection_index, display_order) VALUES
('00000000-0000-0000-0008-000000000001', '00000000-0000-0000-0000-000000000008', 'BREAD', 'Baked staple food', 'down', 1, 0, 2, 1),
('00000000-0000-0000-0008-000000000002', '00000000-0000-0000-0000-000000000008', 'DREAM', 'Nighttime vision', 'down', 1, 2, 2, 2);


-- ============================================================================
-- Seed summary:
-- 7 published puzzles (today + 6 days ahead)
-- 1 draft puzzle (14 days ahead, for admin testing)
-- 24 crosser words total
-- Difficulty range: 1 (easy) to 4 (hard)
-- ============================================================================
