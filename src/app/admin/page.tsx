"use client";

import { useState, useEffect } from "react";

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

export default function AdminPage() {
  const [theme, setTheme] = useState("");
  const [mainWord, setMainWord] = useState("");
  const [difficulty, setDifficulty] = useState("3");
  const [crosserCount, setCrosserCount] = useState("3");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [puzzle, setPuzzle] = useState<GeneratedPuzzle | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [auth, setAuth] = useState<string | null>(null);

  // Load auth from sessionStorage on mount
  useEffect(() => {
    const stored = sessionStorage.getItem("admin_auth");
    if (stored) setAuth(stored);
  }, []);

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

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">
          Cluegrid Admin - Puzzle Generator
        </h1>

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
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2 border rounded-md" />
            </div>
          </div>

          <button onClick={handleGenerate} disabled={isGenerating} className="w-full py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-blue-300 font-medium">
            {isGenerating ? "Generating with AI..." : "Generate Puzzle"}
          </button>
        </div>

        {error && <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-8">{error}</div>}
        {saveMessage && <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md mb-8">{saveMessage}</div>}

        {puzzle && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold mb-4">Generated Puzzle</h2>
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div>
                <span className="text-sm text-gray-500">Main Word</span>
                <p className="text-2xl font-bold tracking-wider">{puzzle.mainWord}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Theme</span>
                <p className="text-lg font-medium">{puzzle.theme}</p>
                {puzzle.themeHint && <p className="text-sm text-gray-600 italic">{puzzle.themeHint}</p>}
              </div>
            </div>

            <h3 className="font-semibold mb-3">Crossers</h3>
            <div className="space-y-3 mb-6">
              {puzzle.crossers.map((c, i) => (
                <div key={i} className="bg-gray-50 p-3 rounded-md">
                  <span className="font-bold text-lg">{c.word}</span>
                  <span className="text-sm text-gray-500 ml-2">pos {c.position}</span>
                  <p className="text-gray-700 mt-1">{c.clue}</p>
                </div>
              ))}
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
