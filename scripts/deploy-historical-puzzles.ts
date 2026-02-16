#!/usr/bin/env npx ts-node

/**
 * Deploy historical puzzles to Supabase via the admin API
 *
 * Usage:
 *   npx ts-node scripts/deploy-historical-puzzles.ts
 *
 * Required environment variables:
 *   - ADMIN_USERNAME
 *   - ADMIN_PASSWORD
 *   - NEXT_PUBLIC_APP_URL (or defaults to http://localhost:3000)
 */

import * as fs from 'fs';
import * as path from 'path';

interface Crosser {
  word: string;
  clue: string;
  position: number;
  intersectionIndex: number;
}

interface Puzzle {
  date: string;
  mainWord: string;
  theme: string;
  themeHint: string;
  difficulty: number;
  crossers: Crosser[];
}

async function deployPuzzles() {
  // Load puzzles from JSON file
  const puzzlesPath = path.join(__dirname, '../content/puzzles-historical.json');
  const puzzlesData = fs.readFileSync(puzzlesPath, 'utf-8');
  const puzzles: Puzzle[] = JSON.parse(puzzlesData);

  console.log(`Found ${puzzles.length} puzzles to deploy`);

  // Get credentials from environment
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

  if (!username || !password) {
    console.error('Error: ADMIN_USERNAME and ADMIN_PASSWORD environment variables are required');
    process.exit(1);
  }

  const authHeader = 'Basic ' + Buffer.from(`${username}:${password}`).toString('base64');

  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;

  for (const puzzle of puzzles) {
    try {
      const response = await fetch(`${baseUrl}/api/admin/puzzles`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader,
        },
        body: JSON.stringify({
          puzzle: {
            date: puzzle.date,
            mainWord: puzzle.mainWord,
            theme: puzzle.theme,
            themeHint: puzzle.themeHint,
            crossers: puzzle.crossers,
          },
          status: 'published',
        }),
      });

      const result = await response.json();

      if (response.ok) {
        console.log(`✓ ${puzzle.date}: ${puzzle.mainWord} (${puzzle.theme})`);
        successCount++;
      } else if (response.status === 409) {
        console.log(`⊘ ${puzzle.date}: Already exists, skipping`);
        skipCount++;
      } else {
        console.error(`✗ ${puzzle.date}: ${result.error || 'Unknown error'}`);
        errorCount++;
      }
    } catch (error) {
      console.error(`✗ ${puzzle.date}: ${error instanceof Error ? error.message : 'Network error'}`);
      errorCount++;
    }

    // Small delay to avoid overwhelming the API
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log('\n--- Deployment Summary ---');
  console.log(`✓ Deployed: ${successCount}`);
  console.log(`⊘ Skipped (already exist): ${skipCount}`);
  console.log(`✗ Errors: ${errorCount}`);
}

deployPuzzles().catch(console.error);
