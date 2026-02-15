# Cluegrid Puzzle Generator

An AI-powered tool for generating Cluegrid puzzles using the Claude API. This tool helps create engaging word puzzles by:

1. Generating or validating main words based on a theme
2. Finding thematically relevant crosser words
3. Validating letter intersections at correct positions
4. Creating clever clues that hint at both the word AND the theme

## Prerequisites

- Node.js 18 or later
- An Anthropic API key

## Installation

```bash
cd tools/puzzle-generator
npm install
```

## Environment Setup

Set your Anthropic API key:

```bash
export ANTHROPIC_API_KEY="your-api-key-here"
```

Or create a `.env` file in the project root:

```
ANTHROPIC_API_KEY=your-api-key-here
```

## Usage

### Generate a Complete Puzzle

Generate a puzzle with a specified theme and main word:

```bash
npx tsx generate-puzzle.ts --theme "Ocean Life" --main-word "WHALE"
```

Let the AI choose the main word:

```bash
npx tsx generate-puzzle.ts --theme "Italian Food" --difficulty 2
```

#### Options

| Option | Short | Description | Default |
|--------|-------|-------------|---------|
| `--theme` | `-t` | Theme/category for the puzzle (required) | - |
| `--main-word` | `-m` | Specify the main word | AI generated |
| `--difficulty` | `-d` | Difficulty rating 1-5 | 3 |
| `--crossers` | `-c` | Number of crosser words | 3 |
| `--date` | - | Scheduled date (YYYY-MM-DD) | Today |
| `--output` | `-o` | Output file path | stdout |
| `--help` | `-h` | Show help message | - |

#### Examples

```bash
# Easy puzzle with 4 crossers
npx tsx generate-puzzle.ts -t "Animals" -d 1 -c 4

# Hard puzzle with specific word
npx tsx generate-puzzle.ts -t "Science" -m "QUARK" -d 5 -c 2

# Save to file
npx tsx generate-puzzle.ts -t "Sports" -o puzzles/sports-01.json
```

### Find Crosser Words

Use the word finder to explore potential crosser words for a main word:

```bash
npx tsx word-finder.ts --main-word "WHALE" --theme "Ocean Life"
```

#### Options

| Option | Short | Description |
|--------|-------|-------------|
| `--main-word` | `-m` | The main puzzle word (required) |
| `--theme` | `-t` | Theme/category (required) |
| `--position` | `-p` | Only find words for this position |
| `--help` | `-h` | Show help message |

## Output Format

The generator outputs puzzle JSON matching the Cluegrid schema:

```json
{
  "date": "2026-02-14",
  "mainWord": "WHALE",
  "difficulty": 3,
  "crossers": [
    {
      "word": "WATER",
      "clue": "The vast blue substance that covers most of our planet.",
      "position": 0,
      "intersectionIndex": 0
    },
    {
      "word": "SHELL",
      "clue": "The hard protective covering a creature carries on its back.",
      "position": 2,
      "intersectionIndex": 2
    },
    {
      "word": "KELP",
      "clue": "Tall, swaying forests that grow beneath the waves.",
      "position": 4,
      "intersectionIndex": 1
    }
  ],
  "theme": "Ocean Life",
  "notes": "Generated with AI. Theme: Ocean Life"
}
```

## Crosser Schema

Each crosser has:

- `word`: The crosser word (uppercase)
- `clue`: A hint that evokes both the word and the theme
- `position`: Index in the main word where intersection occurs (0-indexed)
- `intersectionIndex`: Index in the crosser where intersection occurs (0-indexed)

## How It Works

### 1. Main Word Selection

If no main word is provided, the AI generates one based on:
- Theme relevance
- Difficulty level (common vs. obscure words)
- Letter variety (avoiding double letters)
- Appropriate length (5 letters preferred)

### 2. Crosser Discovery

The word finder:
- Analyzes each position in the main word
- Asks Claude for thematically relevant words
- Validates that letters actually match at intersection points
- Scores words by thematic relevance

### 3. Crosser Selection

The best crossers are selected to:
- Maximize coverage across main word positions
- Prioritize higher thematic relevance
- Avoid duplicate words

### 4. Clue Generation

Clues are crafted to:
- Point clearly to the crosser word as the answer
- Subtly evoke the overall theme
- Use vivid, sensory language
- Match the specified difficulty level

## Development

### Type Checking

```bash
npm run typecheck
```

### Project Structure

```
tools/puzzle-generator/
├── generate-puzzle.ts   # Main generator script
├── word-finder.ts       # Crosser word discovery utility
├── types.ts             # TypeScript type definitions
├── package.json         # Dependencies and scripts
├── tsconfig.json        # TypeScript configuration
└── README.md            # This file
```

## Troubleshooting

### "ANTHROPIC_API_KEY environment variable is required"

Make sure you've set your API key:

```bash
export ANTHROPIC_API_KEY="sk-ant-..."
```

### "Invalid intersection" errors

The AI occasionally suggests words that don't actually share the expected letter. The tool validates intersections and will skip invalid candidates. If you see many warnings, try:
- Using a different main word with more common letters
- Adjusting the theme to be more specific

### Rate Limiting

If you hit rate limits, wait a moment and try again. Each puzzle generation makes 2-3 API calls.

## License

MIT
