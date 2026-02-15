import type { LetterFeedback } from '@/types';

/**
 * Compute Wordle-style letter feedback for a guess against an answer.
 *
 * Algorithm:
 * 1. First pass: mark exact matches as 'correct'
 * 2. Second pass: for remaining letters, check if they exist in unmatched
 *    positions of the answer. Mark as 'present' or 'absent'.
 *
 * This handles duplicate letters correctly: a letter is only marked 'present'
 * if there are remaining unmatched occurrences in the answer.
 */
export function computeFeedback(guess: string, answer: string): LetterFeedback[] {
  const guessLetters = guess.split('');
  const answerLetters = answer.split('');
  const feedback: LetterFeedback[] = guessLetters.map((letter) => ({
    letter,
    status: 'absent' as const,
  }));

  // Track which answer positions have been "consumed"
  const consumed = new Array<boolean>(answerLetters.length).fill(false);

  // Pass 1: exact matches
  for (let i = 0; i < guessLetters.length; i++) {
    if (guessLetters[i] === answerLetters[i]) {
      feedback[i]!.status = 'correct';
      consumed[i] = true;
    }
  }

  // Pass 2: present (wrong position) or absent
  for (let i = 0; i < guessLetters.length; i++) {
    if (feedback[i]!.status === 'correct') continue;

    const letter = guessLetters[i]!;
    // Find an unconsumed occurrence in the answer
    const matchIndex = answerLetters.findIndex(
      (a, j) => a === letter && !consumed[j],
    );

    if (matchIndex !== -1) {
      feedback[i]!.status = 'present';
      consumed[matchIndex] = true;
    }
    // else: stays 'absent'
  }

  return feedback;
}
