'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface PuzzleSummary {
  id: string;
  date: string;
  mainWord: string;
  status: 'draft' | 'scheduled' | 'published' | 'archived';
  difficultyRating: number | null;
  author: string | null;
  crosserCount: number;
  createdAt: string;
  updatedAt: string;
}

interface PuzzlesResponse {
  puzzles: PuzzleSummary[];
  total: number;
  limit: number;
  offset: number;
}

type StatusFilter = 'all' | 'draft' | 'scheduled' | 'published' | 'archived';

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------
export default function PuzzleListPage() {
  const [puzzles, setPuzzles] = useState<PuzzleSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [offset, setOffset] = useState(0);
  const limit = 20;

  // Delete state
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const fetchPuzzles = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') {
        params.set('status', statusFilter);
      }
      params.set('limit', String(limit));
      params.set('offset', String(offset));

      const res = await fetch(`/api/admin/puzzles?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Failed to fetch puzzles');
        return;
      }

      const response = data as PuzzlesResponse;
      setPuzzles(response.puzzles);
      setTotal(response.total);
    } catch (err) {
      setError('Network error. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [statusFilter, offset]);

  useEffect(() => {
    fetchPuzzles();
  }, [fetchPuzzles]);

  const handleDelete = async (puzzle: PuzzleSummary) => {
    if (puzzle.status !== 'draft') {
      setDeleteError('Only draft puzzles can be deleted');
      return;
    }

    if (!confirm(`Delete puzzle for ${puzzle.date}? This cannot be undone.`)) {
      return;
    }

    setDeletingId(puzzle.id);
    setDeleteError(null);

    try {
      const res = await fetch(`/api/admin/puzzles/${puzzle.id}`, {
        method: 'DELETE',
      });
      const data = await res.json();

      if (!res.ok) {
        setDeleteError(data.message || 'Failed to delete puzzle');
        return;
      }

      // Refresh list
      fetchPuzzles();
    } catch (err) {
      setDeleteError('Network error. Please try again.');
      console.error(err);
    } finally {
      setDeletingId(null);
    }
  };

  const totalPages = Math.ceil(total / limit);
  const currentPage = Math.floor(offset / limit) + 1;

  const statusBadgeClass = (status: string) => {
    switch (status) {
      case 'draft':
        return 'bg-gray-100 text-gray-700';
      case 'scheduled':
        return 'bg-blue-100 text-blue-700';
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'archived':
        return 'bg-yellow-100 text-yellow-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">All Puzzles</h1>
        <Link
          href="/admin/puzzles"
          className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
        >
          Create New
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
        <div className="flex items-center gap-4">
          <label htmlFor="status" className="text-sm font-medium text-gray-700">
            Status:
          </label>
          <select
            id="status"
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as StatusFilter);
              setOffset(0);
            }}
            className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>

          <span className="text-sm text-gray-500 ml-auto">
            {total} puzzle{total !== 1 ? 's' : ''} found
          </span>
        </div>
      </div>

      {/* Error messages */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-6">
          {error}
        </div>
      )}
      {deleteError && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700 mb-6">
          {deleteError}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12 text-gray-500">Loading puzzles...</div>
      )}

      {/* Empty state */}
      {!loading && puzzles.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 mb-4">No puzzles found.</p>
          <Link
            href="/admin/puzzles"
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Create your first puzzle
          </Link>
        </div>
      )}

      {/* Puzzles table */}
      {!loading && puzzles.length > 0 && (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Main Word
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Crossers
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Difficulty
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Author
                </th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {puzzles.map((puzzle) => (
                <tr key={puzzle.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                    {puzzle.date}
                  </td>
                  <td className="px-4 py-3 text-sm font-mono text-gray-900">
                    {puzzle.mainWord}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {puzzle.crosserCount}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${statusBadgeClass(puzzle.status)}`}
                    >
                      {puzzle.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {puzzle.difficultyRating ?? '-'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {puzzle.author || '-'}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Link
                        href={`/admin/puzzles/${puzzle.id}`}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                      >
                        Edit
                      </Link>
                      {puzzle.status === 'draft' && (
                        <button
                          onClick={() => handleDelete(puzzle)}
                          disabled={deletingId === puzzle.id}
                          className="text-sm text-red-600 hover:text-red-800 font-medium disabled:opacity-50"
                        >
                          {deletingId === puzzle.id ? 'Deleting...' : 'Delete'}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setOffset(Math.max(0, offset - limit))}
                  disabled={offset === 0}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setOffset(offset + limit)}
                  disabled={offset + limit >= total}
                  className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
