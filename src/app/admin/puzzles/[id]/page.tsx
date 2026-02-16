'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { validatePuzzleIntersections } from '@/lib/puzzle';
import { useAdminAuth } from '@/hooks/useAdminAuth';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CrosserInput {
  id?: string;
  word: string;
  clue: string;
  startRow: number;
  startCol: number;
  intersectionIndex: number;
  displayOrder?: number;
}

interface PuzzleDetail {
  id: string;
  date: string;
  mainWord: string;
  mainWordRow: number;
  mainWordCol: number;
  gridRows: number;
  gridCols: number;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  difficultyRating: number | null;
  author: string | null;
  notes: string | null;
  crossers: CrosserInput[];
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
export default function EditPuzzlePage({ params }: { params: { id: string } }) {
  const puzzleId = params.id;
  const router = useRouter();
  const { authFetch } = useAdminAuth();

  // Form state
  const [date, setDate] = useState('');
  const [mainWord, setMainWord] = useState('');
  const [mainWordRow, setMainWordRow] = useState(2);
  const [mainWordCol, setMainWordCol] = useState(0);
  const [gridRows, setGridRows] = useState(5);
  const [gridCols, setGridCols] = useState(5);
  const [status, setStatus] = useState<'draft' | 'scheduled' | 'published' | 'archived'>('draft');
  const [originalStatus, setOriginalStatus] = useState<string>('');
  const [difficultyRating, setDifficultyRating] = useState<number | null>(null);
  const [author, setAuthor] = useState('');
  const [notes, setNotes] = useState('');
  const [crossers, setCrossers] = useState<CrosserInput[]>([]);

  // UI state
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isEditable, setIsEditable] = useState(true);

  // AI generation state
  const [showAIModal, setShowAIModal] = useState(false);
  const [aiDifficulty, setAIDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [aiCrosserCount, setAICrosserCount] = useState(4);
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiError, setAIError] = useState<string | null>(null);

  // Fetch puzzle data
  useEffect(() => {
    const fetchPuzzle = async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch(`/api/admin/puzzles/${puzzleId}`);
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || 'Failed to fetch puzzle');
          return;
        }

        const puzzle: PuzzleDetail = data.puzzle;

        setDate(puzzle.date);
        setMainWord(puzzle.mainWord);
        setMainWordRow(puzzle.mainWordRow);
        setMainWordCol(puzzle.mainWordCol);
        setGridRows(puzzle.gridRows);
        setGridCols(puzzle.gridCols);
        setStatus(puzzle.status);
        setOriginalStatus(puzzle.status);
        setDifficultyRating(puzzle.difficultyRating);
        setAuthor(puzzle.author || '');
        setNotes(puzzle.notes || '');
        setCrossers(
          puzzle.crossers.map((c) => ({
            id: c.id,
            word: c.word,
            clue: c.clue,
            startRow: c.startRow,
            startCol: c.startCol,
            intersectionIndex: c.intersectionIndex,
            displayOrder: c.displayOrder,
          })),
        );

        // Check if editable
        if (puzzle.status === 'published' || puzzle.status === 'archived') {
          setIsEditable(false);
        }
      } catch (err) {
        setError('Network error. Please try again.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchPuzzle();
  }, [puzzleId]);

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

  const handleAIRegenerate = async () => {
    setAIError(null);

    if (!mainWord) {
      setAIError('Main word is required to regenerate crossers');
      return;
    }

    setIsGenerating(true);

    try {
      const res = await authFetch('/api/admin/puzzles/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mode: 'crossers',
          mainWord: mainWord.toUpperCase(),
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

      setShowAIModal(false);
      setSuccess('Crossers regenerated with AI! Review and save.');
    } catch (err) {
      setAIError('Network error. Please try again.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleStatusChange = async (newStatus: 'draft' | 'published') => {
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);

    try {
      const res = await fetch(`/api/admin/puzzles/${puzzleId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to update status');
        return;
      }

      setOriginalStatus(newStatus);
      setStatus(newStatus);
      setIsEditable(newStatus === 'draft');
      setSuccess(`Puzzle ${newStatus === 'published' ? 'published' : 'unpublished'} successfully!`);
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(null);
    setSuccess(null);

    if (!isEditable) {
      setError('This puzzle cannot be edited');
      return;
    }

    if (!mainWord) {
      setError('Main word is required');
      return;
    }

    const validCrossers = crossers.filter((c) => c.word && c.clue);
    if (validCrossers.length === 0) {
      setError('At least one crosser with word and clue is required');
      return;
    }

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
          displayOrder: c.displayOrder ?? i + 1,
        })),
      };

      const res = await fetch(`/api/admin/puzzles/${puzzleId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to update puzzle');
        return;
      }

      setSuccess('Puzzle updated successfully!');
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setError(null);
    setIsDeleting(true);

    try {
      const res = await fetch(`/api/admin/puzzles/${puzzleId}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to delete puzzle');
        setShowDeleteConfirm(false);
        return;
      }

      // Redirect to list after successful deletion
      router.push('/admin/puzzles/list');
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
      setShowDeleteConfirm(false);
    } finally {
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-12 text-gray-500">Loading puzzle...</div>
    );
  }

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Puzzle</h1>
        <div className="flex items-center gap-3">
          <a
            href={`/?preview=${puzzleId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="px-4 py-2 bg-gray-100 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.64 0 8.577 3.01 9.964 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.64 0-8.577-3.01-9.964-7.178z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Preview
          </a>
          {isEditable && (
            <button
              type="button"
              onClick={() => setShowAIModal(true)}
              className="px-4 py-2 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
              </svg>
              Regenerate with AI
            </button>
          )}
          <Link
            href="/admin/puzzles/list"
            className="text-sm text-gray-600 hover:text-gray-900"
          >
            Back to List
          </Link>
        </div>
      </div>

      {!isEditable && (
        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-800 mb-6">
          This puzzle is <strong>{originalStatus}</strong> and cannot be edited directly. You can unpublish it to make changes.
        </div>
      )}

      <div className="grid lg:grid-cols-2 gap-8">
        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
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
                  disabled={!isEditable}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  disabled={!isEditable}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                disabled={!isEditable}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  disabled={!isEditable}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  disabled={!isEditable}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  max={15}
                  value={gridRows}
                  onChange={(e) => setGridRows(parseInt(e.target.value) || 5)}
                  disabled={!isEditable}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  max={15}
                  value={gridCols}
                  onChange={(e) => setGridCols(parseInt(e.target.value) || 5)}
                  disabled={!isEditable}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          {/* Crossers */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold text-gray-900">Crossers</h2>
              {isEditable && (
                <button
                  type="button"
                  onClick={addCrosser}
                  disabled={crossers.length >= 6}
                  className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Add Crosser
                </button>
              )}
            </div>

            {crossers.map((crosser, index) => (
              <div
                key={crosser.id || index}
                className="p-4 bg-gray-50 rounded-lg border border-gray-200 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    Crosser {index + 1}
                  </span>
                  {isEditable && crossers.length > 1 && (
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
                      disabled={!isEditable}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm font-mono uppercase focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      disabled={!isEditable}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      disabled={!isEditable}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      disabled={!isEditable}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                      disabled={!isEditable}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  disabled={!isEditable}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                  disabled={!isEditable}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
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
                disabled={!isEditable}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>
          </div>

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

          {/* Action Buttons */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 space-y-3">
            <h2 className="font-semibold text-gray-900 mb-4">Actions</h2>

            {isEditable && (
              <>
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="w-full py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
                {originalStatus === 'draft' && (
                  <button
                    type="button"
                    onClick={() => handleStatusChange('published')}
                    disabled={isSubmitting || !validation.valid}
                    className="w-full py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {isSubmitting ? 'Publishing...' : 'Publish Puzzle'}
                  </button>
                )}
              </>
            )}

            {!isEditable && originalStatus === 'published' && (
              <button
                type="button"
                onClick={() => handleStatusChange('draft')}
                disabled={isSubmitting}
                className="w-full py-3 bg-yellow-600 text-white font-medium rounded-lg hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Unpublishing...' : 'Unpublish (Move to Draft)'}
              </button>
            )}

            {originalStatus === 'draft' && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                disabled={isSubmitting || isDeleting}
                className="w-full py-3 bg-red-100 text-red-700 font-medium rounded-lg hover:bg-red-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors border border-red-200"
              >
                Delete Puzzle
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md mx-4 shadow-xl">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Puzzle?</h3>
            <p className="text-gray-600 mb-4">
              Are you sure you want to delete this puzzle ({mainWord})? This action cannot be undone.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isDeleting}
                className="flex-1 py-2 px-4 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 disabled:opacity-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex-1 py-2 px-4 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
              >
                {isDeleting ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI Regeneration Modal */}
      {showAIModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-lg mx-4 shadow-xl w-full">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Regenerate Crossers with AI</h3>

            {aiError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-4">
                {aiError}
              </div>
            )}

            <div className="space-y-4">
              {/* Current main word display */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <span className="text-sm text-blue-700">
                  Main word: <strong className="font-mono">{mainWord}</strong>
                </span>
                <p className="text-xs text-blue-600 mt-1">
                  AI will generate new crosser words that intersect this main word.
                </p>
              </div>

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
                onClick={handleAIRegenerate}
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
                  'Regenerate Crossers'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
