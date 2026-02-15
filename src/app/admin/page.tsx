import Link from 'next/link';

export default function AdminPage() {
  return (
    <div className="max-w-2xl">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">
        Puzzle Administration
      </h1>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/puzzles"
          className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Create New Puzzle
          </h2>
          <p className="text-sm text-gray-600">
            Design a new daily puzzle with main word and crossers.
          </p>
        </Link>

        <Link
          href="/admin/puzzles/list"
          className="block p-6 bg-white rounded-lg border border-gray-200 hover:border-gray-300 hover:shadow-sm transition-all"
        >
          <h2 className="text-lg font-semibold text-gray-900 mb-2">
            Manage Puzzles
          </h2>
          <p className="text-sm text-gray-600">
            View, edit, and schedule existing puzzles.
          </p>
        </Link>
      </div>
    </div>
  );
}
