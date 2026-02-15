# Cluegrid - Sample Puzzles

These 5 puzzles demonstrate the format, crossing mechanics, clue style, and difficulty range we are targeting for launch. Each puzzle includes the main word (5 letters, no clue given to the player), 2-4 crossing words with clues, and a visual grid showing how the words intersect.

---

## Puzzle 1: CRANE (Difficulty: Easy)

**Main word:** CRANE (no clue -- player must deduce this)

| Crosser | Length | Intersects at | Clue |
|---------|--------|---------------|------|
| CRISP | 5 | C (position 1 of CRANE, position 1 of CRISP) | The satisfying snap when you bite into a fresh apple. |
| ARROW | 5 | R (position 2 of CRANE, position 2 of ARROW) | What a bow launches toward a target. |
| DANCE | 5 | N (position 4 of CRANE, position 3 of DANCE) | What couples do together on a ballroom floor. |

**Grid layout:**

```
    1   2   3   4   5
    C   R   A   N   E       <- CRANE (main, horizontal)
    |   |       |
    C   A       D
    R   R       A
    I   R       N
    S   O       C
    P   W       E
```

**Why this works:**
- CRANE is a common, universally known word.
- Three crossers give generous help -- appropriate for an easy puzzle.
- Each clue is evocative and has one clear answer.
- Intersections reveal C, R, and N -- enough for most solvers to guess CRANE.

---

## Puzzle 2: BLAZE (Difficulty: Easy)

**Main word:** BLAZE (no clue)

| Crosser | Length | Intersects at | Clue |
|---------|--------|---------------|------|
| BOLD | 4 | B (position 1 of BLAZE, position 1 of BOLD) | Daring and confident, like a headline in heavy type. |
| CLIP | 4 | L (position 2 of BLAZE, position 2 of CLIP) | A short section cut from a longer video. |
| MAZE | 4 | AZE (position 3 of BLAZE, position 1 of MAZE) | A puzzle of winding paths with dead ends. |

**Grid layout:**

```
    1   2   3   4   5
    B   L   A   Z   E       <- BLAZE (main, horizontal)
    |   |   |
    B   C   M
    O   L   A
    L   I   Z
    D   P   E
```

**Why this works:**
- BLAZE is vivid and universally understood.
- MAZE shares three letters with the main word (A, Z, E), giving a big reveal when solved.
- BOLD and CLIP are everyday words with tight, specific clues.

---

## Puzzle 3: FROST (Difficulty: Medium)

**Main word:** FROST (no clue)

| Crosser | Length | Intersects at | Clue |
|---------|--------|---------------|------|
| FROWN | 5 | F (position 1 of FROST, position 1 of FROWN) | The expression your face makes when something disappoints you. |
| ORBIT | 5 | O (position 3 of FROST, position 1 of ORBIT) | The path a satellite traces around the Earth. |
| STONE | 5 | ST (position 4-5 of FROST, position 1-2 of STONE) | A small rock you might skip across a lake. |

**Grid layout:**

```
    1   2   3   4   5
    F   R   O   S   T       <- FROST (main, horizontal)
    |       |   |
    F       O   S
    R       R   T
    O       B   O
    W       I   N
    N       T   E
```

**Why this works:**
- Medium difficulty: FROST is common but not the first word most people think of.
- Only three crossers, but they reveal F, O, and S+T -- enough to solve with some thought.
- ORBIT is a slightly less obvious word; its clue is precise without being obscure.
- STONE intersects at two consecutive letters (S and T), which is a nice mechanical feature.

---

## Puzzle 4: PLUME (Difficulty: Medium)

**Main word:** PLUME (no clue)

| Crosser | Length | Intersects at | Clue |
|---------|--------|---------------|------|
| PULSE | 5 | P (position 1 of PLUME, position 1 of PULSE) | The rhythmic beat you feel when you press two fingers to your wrist. |
| FLUTE | 5 | L (position 2 of PLUME, position 2 of FLUTE) | A woodwind instrument played sideways across the lips. |
| TRUNK | 5 | U (position 3 of PLUME, position 3 of TRUNK) | The thick central stem of a tree. |
| THEME | 5 | E (position 5 of PLUME, position 3 of THEME) | The central idea that ties a story or party together. |

**Grid layout:**

```
    1   2   3   4   5
    P   L   U   M   E       <- PLUME (main, horizontal)
    |   |   |       |
    P   F   T       T
    U   L   R       H
    L   U   U       E
    S   T   N       M
    E   E   K       E
```

**Why this works:**
- PLUME is a real word most adults know, but it is not top-of-mind -- good for medium.
- Four crossers make this more forgiving despite the trickier main word.
- Each clue uses vivid, sensory language (rhythmic beat, played sideways, thick central stem).
- The clues span different domains (biology, music, nature, storytelling) -- no theme bias.

---

## Puzzle 5: GNASH (Difficulty: Hard)

**Main word:** GNASH (no clue)

| Crosser | Length | Intersects at | Clue |
|---------|--------|---------------|------|
| GLYPH | 5 | G (position 1 of GNASH, position 1 of GLYPH) | A carved symbol or character, like those found in ancient Egyptian temples. |
| SWINE | 5 | N (position 2 of GNASH, position 4 of SWINE) | Pigs, especially when you are being old-fashioned or dramatic about it. |

**Grid layout:**

```
    1   2   3   4   5
    G   N   A   S   H       <- GNASH (main, horizontal)
    |   |
    G   S
    L   W
    Y   I
    P   N
    H   E
```

**Why this works:**
- GNASH is a real English word (to gnash one's teeth) but sits at the harder end of common vocabulary.
- Only two crossers -- the player gets less help, raising difficulty.
- GLYPH is a word most adults recognize but might not think of immediately; the clue gives strong context.
- SWINE requires the solver to think beyond the modern word "pig."
- Revealing G and N still leaves A, S, H to figure out -- a genuine challenge.

---

## Format Summary

Each puzzle in the database will store:

```json
{
  "puzzle_date": "2026-03-15",
  "main_word": "CRANE",
  "difficulty": 1,
  "status": "scheduled",
  "crossers": [
    {
      "word": "CRISP",
      "clue": "The satisfying snap when you bite into a fresh apple.",
      "intersection_letter": "C",
      "main_word_position": 0,
      "crosser_position": 0,
      "direction": "down"
    },
    {
      "word": "ARROW",
      "clue": "What a bow launches toward a target.",
      "intersection_letter": "R",
      "main_word_position": 1,
      "crosser_position": 1,
      "direction": "down"
    },
    {
      "word": "DANCE",
      "clue": "What couples do together on a ballroom floor.",
      "intersection_letter": "N",
      "main_word_position": 3,
      "crosser_position": 2,
      "direction": "down"
    }
  ]
}
```

## Difficulty Distribution Plan

| Difficulty | Rating | Puzzles (of 90) | Characteristics |
|------------|--------|-----------------|-----------------|
| Easy | 1-2 | 27 (30%) | Common main word, 3-4 crossers, straightforward clues |
| Medium | 3 | 45 (50%) | Moderately common main word, 2-3 crossers, clues require a mental leap |
| Hard | 4-5 | 18 (20%) | Less common (but still fair) main word, 2 crossers, clues use misdirection |

## Next Steps

1. Curate the full answer-worthy word list (~3,000 words, 5 letters each for main words).
2. Build the crosser suggestion tool using the algorithm in CONTENT_PIPELINE.md.
3. Begin batch-creating puzzles at a rate of 10-15 per session.
4. Playtest each puzzle before scheduling -- solve it cold, time yourself, note frustration points.
5. Schedule 90 puzzles across the content calendar with the difficulty ramp described above.
