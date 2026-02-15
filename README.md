# Cluegrid

A daily word puzzle game that combines Wordle-style deduction with crossword clue satisfaction.

## Overview

Cluegrid is a web-first daily word game where players guess a 5-letter main word using hints from intersecting "crosser" words. Each crosser has a clue, and solving a crosser reveals its intersection with the main word.

**Key Features:**
- 🧩 Daily puzzle with crossword-style clues
- ⏱️ 3-5 minute satisfying sessions
- 📊 Streak tracking and statistics
- 📤 Shareable results
- 🌙 Dark mode support
- ♿ Accessibility-first design

## Tech Stack

- **Frontend:** Next.js 14, TypeScript, Tailwind CSS, Zustand, Framer Motion
- **Backend:** Next.js API Routes, Supabase (Postgres)
- **Deployment:** Vercel
- **Analytics:** PostHog
- **Monitoring:** Sentry

## Getting Started

```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your credentials

# Run development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to play.

## Project Structure

```
cluegrid/
├── docs/           # Planning documents
├── src/
│   ├── app/        # Next.js App Router
│   ├── components/ # React components
│   ├── hooks/      # Custom React hooks
│   ├── lib/        # Utilities and API clients
│   ├── stores/     # Zustand state stores
│   └── types/      # TypeScript types
└── public/         # Static assets
```

## Documentation

| Document | Description |
|----------|-------------|
| [PDD.md](./PDD.md) | Product Design Document |
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Technical architecture |
| [GAME_RULES.md](./GAME_RULES.md) | Game mechanics specification |
| [SPRINT_PLAN.md](./SPRINT_PLAN.md) | Development timeline |

## Contributing

This is currently a private project in development.

## License

All rights reserved.
