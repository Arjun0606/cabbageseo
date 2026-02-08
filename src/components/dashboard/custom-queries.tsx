"use client";

import { useState, KeyboardEvent } from "react";
import { X, Plus, Loader2, Search } from "lucide-react";

interface CustomQueriesProps {
  siteId: string;
  queries: string[];
  maxQueries: number; // 0 = not allowed, -1 = unlimited
  onUpdate: (queries: string[]) => void;
}

export function CustomQueries({
  siteId,
  queries,
  maxQueries,
  onUpdate,
}: CustomQueriesProps) {
  const [input, setInput] = useState("");
  const [saving, setSaving] = useState(false);

  const canAdd =
    maxQueries === -1 || (maxQueries > 0 && queries.length < maxQueries);
  const limitLabel =
    maxQueries === -1
      ? `${queries.length} custom queries`
      : `${queries.length}/${maxQueries}`;

  const saveQueries = async (newQueries: string[]) => {
    setSaving(true);
    try {
      const res = await fetch("/api/sites/queries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ siteId, customQueries: newQueries }),
      });
      if (res.ok) {
        onUpdate(newQueries);
      }
    } finally {
      setSaving(false);
    }
  };

  const addQuery = async () => {
    const trimmed = input.trim();
    if (!trimmed || !canAdd) return;
    if (queries.includes(trimmed)) {
      setInput("");
      return;
    }
    const newQueries = [...queries, trimmed];
    setInput("");
    await saveQueries(newQueries);
  };

  const removeQuery = async (query: string) => {
    const newQueries = queries.filter((q) => q !== query);
    await saveQueries(newQueries);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      addQuery();
    }
  };

  if (maxQueries === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <Search className="w-5 h-5 text-zinc-500" />
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
            Track Custom Queries
          </h3>
        </div>
        <p className="text-zinc-500 text-sm">
          Upgrade to Scout to monitor your own buying queries across AI
          platforms.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Search className="w-5 h-5 text-emerald-400" />
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
            Track Custom Queries
          </h3>
        </div>
        <span className="text-xs text-zinc-500">{limitLabel}</span>
      </div>

      {/* Existing queries as chips */}
      {queries.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {queries.map((query) => (
            <span
              key={query}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-800 border border-zinc-700 rounded-full text-sm text-zinc-300"
            >
              {query}
              <button
                onClick={() => removeQuery(query)}
                disabled={saving}
                className="text-zinc-500 hover:text-red-400 transition-colors disabled:opacity-50"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Add query input */}
      {canAdd && (
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder='e.g., "best CRM for startups"'
            className="flex-1 px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            disabled={saving}
          />
          <button
            onClick={addQuery}
            disabled={!input.trim() || saving}
            className="px-3 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {saving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Plus className="w-4 h-4" />
            )}
          </button>
        </div>
      )}

      {queries.length === 0 && (
        <p className="text-zinc-500 text-xs mt-2">
          Add queries your customers ask AI. These are checked alongside
          auto-generated queries on every scan.
        </p>
      )}
    </div>
  );
}
