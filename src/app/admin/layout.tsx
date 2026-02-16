import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Admin | gist',
  description: 'gist puzzle administration',
  robots: 'noindex, nofollow',
};

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Admin header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-6">
              <Link
                href="/admin"
                className="text-lg font-semibold text-gray-900"
              >
                gist Admin
              </Link>
              <nav className="hidden sm:flex items-center gap-4">
                <Link
                  href="/admin/puzzles"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  New Puzzle
                </Link>
                <Link
                  href="/admin/puzzles/list"
                  className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
                >
                  All Puzzles
                </Link>
              </nav>
            </div>
            <Link
              href="/"
              className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              View Site
            </Link>
          </div>
        </div>
      </header>

      {/* Admin content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}
