"use client";

import { useState, useEffect, useMemo, useRef } from "react";

interface GeneratedCrosser {
  word: string;
  clue: string;
  position: number;
  intersectionIndex: number;
}

interface GeneratedPuzzle {
  date: string;
  mainWord: string;
  difficulty: number;
  crossers: GeneratedCrosser[];
  theme: string;
  themeHint?: string;
}

interface ScheduledPuzzle {
  date: string;
  status: string;
}

export default function AdminPage() {
  const [theme, setTheme] = useState("");
  const [mainWord, setMainWord] = useState("");
  const [difficulty, setDifficulty] = useState("3");
  const [crosserCount, setCrosserCount] = useState("3");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isBustingCache, setIsBustingCache] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [puzzle, setPuzzle] = useState<GeneratedPuzzle | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [auth, setAuth] = useState<string | null>(null);
  const [scheduledDates, setScheduledDates] = useState<Map<string, string>>(new Map());
  const lastGenerateParams = useRef<{ theme: string; mainWord: string; difficulty: string; crosserCount: string } | null>(null);

  // Load auth from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("admin_auth");
    if (stored) setAuth(stored);
  }, []);

  // Fetch scheduled puzzle dates
  useEffect(() => {
    const fetchScheduledDates = async () => {
      const authHeader = sessionStorage.getItem("admin_auth");
      if (!authHeader) return;

      try {
        const response = await fetch("/api/admin/puzzles?limit=100", {
          headers: { Authorization: authHeader },
        });
        if (response.ok) {
          const data = await response.json();
          const dates = new Map<string, string>();
          (data.puzzles || []).forEach((p: ScheduledPuzzle) => {
            dates.set(p.date, p.status);
          });
          setScheduledDates(dates);
        }
      } catch (err) {
        console.error("Failed to fetch scheduled dates:", err);
      }
    };
    fetchScheduledDates();
  }, [saveMessage]); // Refetch after saving

  const getAuthHeader = () => {
    if (auth) return auth;
    const username = prompt("Admin username:");
    const password = prompt("Admin password:");
    if (!username || !password) return null;
    const header = "Basic " + btoa(`${username}:${password}`);
    setAuth(header);
    sessionStorage.setItem("admin_auth", header);
    return header;
  };

  const handleGenerate = async () => {
    if (!theme.trim()) {
      setError("Theme is required");
      return;
    }

    const authHeader = getAuthHeader();
    if (!authHeader) return;

    setIsGenerating(true);
    setError(null);
    setPuzzle(null);
    setSaveMessage(null);

    // Store params for regenerate
    lastGenerateParams.current = { theme: theme.trim(), mainWord: mainWord.trim(), difficulty, crosserCount };

    try {
      const response = await fetch("/api/admin/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({
          theme: theme.trim(),
          mainWord: mainWord.trim() || undefined,
          difficulty,
          crosserCount,
          date,
        }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Generation failed");
      setPuzzle(data.puzzle);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Generation failed");
    } finally {
      setIsGenerating(false);
    }
  };

  // Compute grid visualization for generated puzzle
  const gridVisualization = useMemo(() => {
    if (!puzzle) return null;

    const mainWordRow = 2; // Typically main word is on row 2
    const mainWordCol = 0;

    // Calculate grid dimensions
    let maxRow = mainWordRow;
    let maxCol = mainWordCol + puzzle.mainWord.length - 1;

    for (const crosser of puzzle.crossers) {
      const col = crosser.position;
      const startRow = mainWordRow - crosser.intersectionIndex;
      const endRow = startRow + crosser.word.length - 1;
      maxRow = Math.max(maxRow, endRow);
      maxCol = Math.max(maxCol, col);
    }

    const gridRows = maxRow + 1;
    const gridCols = maxCol + 1;

    // Build grid
    const grid: { letter: string; isMain: boolean; isCrosser: boolean }[][] = Array.from(
      { length: gridRows },
      () => Array.from({ length: gridCols }, () => ({ letter: "", isMain: false, isCrosser: false }))
    );

    // Place main word
    for (let i = 0; i < puzzle.mainWord.length; i++) {
      const targetRow = grid[mainWordRow];
      if (targetRow?.[mainWordCol + i]) {
        targetRow[mainWordCol + i] = { letter: puzzle.mainWord[i] ?? "", isMain: true, isCrosser: false };
      }
    }

    // Place crossers
    for (const crosser of puzzle.crossers) {
      const col = crosser.position;
      const startRow = mainWordRow - crosser.intersectionIndex;
      for (let i = 0; i < crosser.word.length; i++) {
        const row = startRow + i;
        const targetRow = grid[row];
        if (targetRow?.[col]) {
          const existing = targetRow[col];
          targetRow[col] = { letter: crosser.word[i] ?? "", isMain: existing?.isMain ?? false, isCrosser: true };
        }
      }
    }

    return { grid, gridRows, gridCols };
  }, [puzzle]);

  const handleSave = async (status: "draft" | "published") => {
    if (!puzzle) return;
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    setIsSaving(true);
    setError(null);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/admin/puzzles", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ puzzle, status }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Save failed");
      setSaveMessage(data.message);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleBustCache = async () => {
    const authHeader = getAuthHeader();
    if (!authHeader) return;

    setIsBustingCache(true);
    setError(null);
    setSaveMessage(null);

    try {
      const response = await fetch("/api/revalidate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: authHeader,
        },
        body: JSON.stringify({ date }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Cache bust failed");
      setSaveMessage(`${data.message || "Server cache cleared!"} — Open game with ?bust to bypass browser cache`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Cache bust failed");
    } finally {
      setIsBustingCache(false);
    }
  };

  const handleOpenGameFresh = () => {
    // Open the game with cache-busting and clear localStorage for today's puzzle
    const key = `cluegrid:session:`;
    // Clear all game sessions from localStorage
    if (typeof window !== "undefined") {
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith(key)) {
          localStorage.removeItem(k);
        }
      });
    }
    // Open game with bust param
    window.open(`/?t=${Date.now()}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold text-gray-900">
            gist Admin - Puzzle Generator
          </h1>
          <div className="flex gap-2">
            <button
              onClick={handleBustCache}
              disabled={isBustingCache}
              className="px-4 py-2 bg-orange-500 text-white rounded-md hover:bg-orange-600 disabled:bg-orange-300 font-medium text-sm"
            >
              {isBustingCache ? "Busting..." : "🔄 Bust Cache"}
            </button>
            <button
              onClick={handleOpenGameFresh}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 font-medium text-sm"
            >
              🎮 Test Game
            </button>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-8">
          <h2 className="text-xl font-semibold mb-4">Generate New Puzzle</h2>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Theme *</label>
              <input
                type="text"
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                placeholder="e.g., Ocean Life, Italian Food"
                className="w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Main Word (optional)</label>
              <input
                type="text"
                value={mainWord}
                onChange={(e) => setMainWord(e.target.value.toUpperCase())}
                placeholder="Leave empty for AI"
                className="w-full px-3 py-2 border rounded-md uppercase"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)} className="w-full px-3 py-2 border rounded-md">
                <option value="1">1 - Very Easy</option>
                <option value="2">2 - Easy</option>
                <option value="3">3 - Medium</option>
                <option value="4">4 - Hard</option>
                <option value="5">5 - Very Hard</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Crossers</label>
              <select value={crosserCount} onChange={(e) => setCrosserCount(e.target.value)} className="w-full px-3 py-2 border rounded-md">
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
                <option value="5">5</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={`w-full px-3 py-2 border rounded-md ${
                  scheduledDates.has(date) ? "border-yellow-400 bg-yellow-50" : ""
                }`}
              />
              {scheduledDates.has(date) && (
                <p className="text-xs text-yellow-600 mt-1">
                  ⚠️ A puzzle ({scheduledDates.get(date)}) exists for this date
                </p>
              )}
            </div>
            {/* Upcoming scheduled dates */}
            {scheduledDates.size > 0 && (
              <div className="col-span-2">
                <p className="text-xs text-gray-500 mb-1">Scheduled dates:</p>
                <div className="flex flex-wrap gap-1">
                  {Array.from(scheduledDates.entries())
                    .sort(([a], [b]) => a.localeCompare(b))
                    .slice(0, 14)
                    .map(([d, status]) => (
                      <span
                        key={d}
                        className={`text-xs px-2 py-0.5 rounded ${
                          status === "published"
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {d.slice(5)} {status === "published" ? "●" : "○"}
                      </span>
                    ))}
                </div>
              </div>
            )}
          </div>

          <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 font-medium">
            {isGenerating ? "Generating with AI..." : "Generate Puzzle"}
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-8">{error}</div>}
        {saveMessage && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-8">{saveMessage}</div>}

        {puzzle && (
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Generated Puzzle</h2>
              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-md hover:bg-purple-200 disabled:opacity-50 font-medium text-sm flex items-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                {isGenerating ? "Regenerating..." : "Regenerate"}
              </button>
            </div>

            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* Left: Info + Crossers */}
              <div>
                <div className="mb-4">
                  <span className="text-sm text-gray-500">Main Word</span>
                  <p className="text-2xl font-bold tracking-wider">{puzzle.mainWord}</p>
                </div>
                <div className="mb-4">
                  <span className="text-sm text-gray-500">Theme</span>
                  <p className="text-lg font-medium">{puzzle.theme}</p>
                  {puzzle.themeHint && <p className="text-sm text-gray-600 italic">{puzzle.themeHint}</p>}
                </div>

                <h3 className="font-semibold mb-3">Crossers</h3>
                <div className="space-y-3">
                  {puzzle.crossers.map((c, i) => (
                    <div key={i} className="bg-gray-50 p-3 rounded-md">
                      <span className="font-bold text-lg">{c.word}</span>
                      <span className="text-sm text-gray-500 ml-2">pos {c.position}</span>
                      <p className="text-gray-700 mt-1">{c.clue}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right: Grid Visualization */}
              <div>
                <h3 className="font-semibold mb-3">Grid Layout</h3>
                {gridVisualization && (
                  <div
                    className="inline-grid gap-1"
                    style={{
                      gridTemplateRows: `repeat(${gridVisualization.gridRows}, 36px)`,
                      gridTemplateColumns: `repeat(${gridVisualization.gridCols}, 36px)`,
                    }}
                  >
                    {gridVisualization.grid.map((row, rowIndex) =>
                      row.map((cell, colIndex) => (
                        <div
                          key={`${rowIndex}-${colIndex}`}
                          className={`
                            flex items-center justify-center text-xs font-mono font-bold rounded
                            ${cell.letter ? "border-2" : "border border-dashed"}
                            ${
                              cell.isMain && cell.isCrosser
                                ? "bg-purple-100 border-purple-400 text-purple-700"
                                : cell.isMain
                                  ? "bg-blue-100 border-blue-400 text-blue-700"
                                  : cell.isCrosser
                                    ? "bg-green-100 border-green-400 text-green-700"
                                    : "bg-gray-50 border-gray-200 text-gray-300"
                            }
                          `}
                        >
                          {cell.letter}
                        </div>
                      ))
                    )}
                  </div>
                )}
                <div className="mt-3 flex items-center gap-3 text-xs text-gray-600">
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-blue-100 border border-blue-400 rounded" />
                    Main
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-green-100 border border-green-400 rounded" />
                    Crosser
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-3 h-3 bg-purple-100 border border-purple-400 rounded" />
                    Intersection
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-4">
              <button onClick={() => handleSave("draft")} disabled={isSaving} className="flex-1 py-3 bg-gray-600 text-white rounded-md hover:bg-gray-700 disabled:bg-gray-300">
                Save as Draft
              </button>
              <button onClick={() => handleSave("published")} disabled={isSaving} className="flex-1 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-green-300">
                Publish
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
