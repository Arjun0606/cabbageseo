"use client";

/**
 * Integrations Page — API keys, OpenClaw Pro setup, webhooks, badges
 *
 * Plan gating:
 * - All paid: OpenClaw setup, badge customization, command reference
 * - Command+: API keys, webhooks
 */

import { useState, useCallback } from "react";
import { useSite } from "@/context/site-context";
import Link from "next/link";
import {
  Key,
  Terminal,
  Copy,
  Check,
  Trash2,
  Plus,
  ExternalLink,
  Lock,
  ArrowRight,
  Code,
  BookOpen,
  Loader2,
  Webhook,
  Send,
  AlertCircle,
} from "lucide-react";

// ============================================
// API KEY MANAGEMENT
// ============================================

interface ApiKeyData {
  id: string;
  name: string;
  key: string;
  isActive: boolean;
  lastUsedAt: string | null;
  createdAt: string;
  hourlyLimit: number;
}

function ApiKeysSection({ plan }: { plan: string }) {
  const canCreate = plan === "command" || plan === "dominate";
  const [keys, setKeys] = useState<ApiKeyData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newKeyName, setNewKeyName] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const loadKeys = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const res = await fetch("/api/api-keys");
      if (res.ok) {
        const data = await res.json();
        setKeys(data.keys || []);
      }
    } catch { /* ignore */ }
    setLoaded(true);
    setLoading(false);
  }, [loaded]);

  // Load keys on mount
  useState(() => { loadKeys(); });

  const createKey = async () => {
    setCreating(true);
    try {
      const res = await fetch("/api/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newKeyName || "API Key" }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewlyCreatedKey(data.key);
        setShowCreateForm(false);
        setNewKeyName("");
        // Reload keys
        setLoaded(false);
        loadKeys();
      }
    } catch { /* ignore */ }
    setCreating(false);
  };

  const revokeKey = async (id: string) => {
    try {
      await fetch(`/api/api-keys/${id}`, { method: "DELETE" });
      setKeys(prev => prev.map(k => k.id === id ? { ...k, isActive: false } : k));
    } catch { /* ignore */ }
  };

  const copyKey = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!canCreate) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">API Keys</h3>
            <p className="text-zinc-500 text-sm">Available on Command and Dominate plans</p>
          </div>
        </div>
        <p className="text-zinc-400 text-sm mb-4">
          Generate API keys for programmatic scanning, higher rate limits (200-500/hr), and OpenClaw Pro commands.
        </p>
        <Link
          href="/settings/billing"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors text-sm"
        >
          Upgrade to Command
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-500/10 rounded-lg">
            <Key className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">API Keys</h3>
            <p className="text-zinc-500 text-sm">Authenticate programmatic access</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg text-sm font-medium hover:bg-emerald-500/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Create Key
        </button>
      </div>

      {/* Newly created key banner */}
      {newlyCreatedKey && (
        <div className="mb-4 p-4 bg-emerald-950/30 border border-emerald-500/20 rounded-xl">
          <p className="text-emerald-400 text-sm font-medium mb-2">
            Key created! Copy it now — you won't see it again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono break-all">
              {newlyCreatedKey}
            </code>
            <button
              onClick={() => copyKey(newlyCreatedKey)}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors shrink-0"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
            </button>
          </div>
          <button
            onClick={() => setNewlyCreatedKey(null)}
            className="text-xs text-zinc-500 mt-2 hover:text-zinc-300"
          >
            I've saved it, dismiss
          </button>
        </div>
      )}

      {/* Create key form */}
      {showCreateForm && (
        <div className="mb-4 p-4 bg-zinc-950 border border-zinc-800 rounded-xl">
          <input
            type="text"
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            placeholder="Key name (e.g., Production, CI/CD)"
            className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 mb-3 focus:outline-none focus:border-emerald-500"
          />
          <div className="flex gap-2">
            <button
              onClick={createKey}
              disabled={creating}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-500 text-black font-bold rounded-lg text-sm hover:bg-emerald-400 transition-colors disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Create
            </button>
            <button
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-1.5 text-zinc-400 text-sm hover:text-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Keys list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
        </div>
      ) : keys.length === 0 ? (
        <p className="text-zinc-500 text-sm py-4 text-center">
          No API keys yet. Create one to start using the API.
        </p>
      ) : (
        <div className="space-y-2">
          {keys.map((k) => (
            <div
              key={k.id}
              className={`flex items-center gap-3 p-3 rounded-lg border ${
                k.isActive
                  ? "bg-zinc-950 border-zinc-800"
                  : "bg-zinc-950/50 border-zinc-800/50 opacity-50"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-white font-medium">{k.name}</span>
                  {!k.isActive && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">Revoked</span>
                  )}
                </div>
                <p className="text-xs text-zinc-600 font-mono truncate">{k.key}</p>
                <p className="text-[10px] text-zinc-600 mt-0.5">
                  Created {new Date(k.createdAt).toLocaleDateString()}
                  {k.lastUsedAt && ` · Last used ${new Date(k.lastUsedAt).toLocaleDateString()}`}
                </p>
              </div>
              {k.isActive && (
                <button
                  onClick={() => revokeKey(k.id)}
                  className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                  title="Revoke key"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// WEBHOOK CONFIGURATION
// ============================================

interface WebhookData {
  id: string;
  url: string;
  events: string[];
  isActive: boolean;
  lastDeliveredAt: string | null;
  lastStatus: number | null;
  failureCount: number;
  createdAt: string;
}

const EVENT_OPTIONS = [
  { value: "scan_complete", label: "Scan Complete", desc: "When a scan finishes" },
  { value: "score_drop", label: "Score Drop", desc: "When visibility score decreases" },
  { value: "score_improve", label: "Score Improve", desc: "When visibility score increases" },
];

function WebhooksSection({ plan }: { plan: string }) {
  const canCreate = plan === "command" || plan === "dominate";
  const [hooks, setHooks] = useState<WebhookData[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUrl, setNewUrl] = useState("");
  const [newEvents, setNewEvents] = useState<string[]>(["scan_complete"]);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copiedSecret, setCopiedSecret] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; ok: boolean; msg: string } | null>(null);

  const loadHooks = useCallback(async () => {
    if (loaded) return;
    setLoading(true);
    try {
      const res = await fetch("/api/webhooks");
      if (res.ok) {
        const data = await res.json();
        setHooks(data.webhooks || []);
      }
    } catch { /* ignore */ }
    setLoaded(true);
    setLoading(false);
  }, [loaded]);

  useState(() => { loadHooks(); });

  const createHook = async () => {
    if (!newUrl) return;
    setCreating(true);
    try {
      const res = await fetch("/api/webhooks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url: newUrl, events: newEvents }),
      });
      if (res.ok) {
        const data = await res.json();
        setNewSecret(data.secret);
        setShowCreateForm(false);
        setNewUrl("");
        setNewEvents(["scan_complete"]);
        setLoaded(false);
        loadHooks();
      }
    } catch { /* ignore */ }
    setCreating(false);
  };

  const deleteHook = async (id: string) => {
    try {
      await fetch(`/api/webhooks/${id}`, { method: "DELETE" });
      setHooks(prev => prev.filter(h => h.id !== id));
    } catch { /* ignore */ }
  };

  const testHook = async (id: string) => {
    setTesting(id);
    setTestResult(null);
    try {
      const res = await fetch(`/api/webhooks/${id}/test`, { method: "POST" });
      const data = await res.json();
      setTestResult({ id, ok: data.success, msg: data.message || data.error });
    } catch {
      setTestResult({ id, ok: false, msg: "Request failed" });
    }
    setTesting(null);
  };

  const toggleEvent = (event: string) => {
    setNewEvents(prev =>
      prev.includes(event)
        ? prev.filter(e => e !== event)
        : [...prev, event]
    );
  };

  if (!canCreate) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-amber-500/10 rounded-lg">
            <Lock className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Webhooks</h3>
            <p className="text-zinc-500 text-sm">Available on Command and Dominate plans</p>
          </div>
        </div>
        <p className="text-zinc-400 text-sm mb-4">
          Get notified via HTTP POST when scans complete, scores drop, or visibility improves.
        </p>
        <Link
          href="/settings/billing"
          className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold rounded-lg transition-colors text-sm"
        >
          Upgrade to Command
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-500/10 rounded-lg">
            <Webhook className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="text-white font-bold">Webhooks</h3>
            <p className="text-zinc-500 text-sm">Receive events via HTTP POST</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 text-blue-400 rounded-lg text-sm font-medium hover:bg-blue-500/20 transition-colors"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Webhook
        </button>
      </div>

      {/* New secret banner */}
      {newSecret && (
        <div className="mb-4 p-4 bg-blue-950/30 border border-blue-500/20 rounded-xl">
          <p className="text-blue-400 text-sm font-medium mb-2">
            Webhook created! Save the signing secret — you won&apos;t see it again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-sm text-white font-mono break-all">
              {newSecret}
            </code>
            <button
              onClick={() => { navigator.clipboard.writeText(newSecret); setCopiedSecret(true); setTimeout(() => setCopiedSecret(false), 2000); }}
              className="p-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg transition-colors shrink-0"
            >
              {copiedSecret ? <Check className="w-4 h-4 text-blue-400" /> : <Copy className="w-4 h-4 text-zinc-400" />}
            </button>
          </div>
          <button onClick={() => setNewSecret(null)} className="text-xs text-zinc-500 mt-2 hover:text-zinc-300">
            I&apos;ve saved it, dismiss
          </button>
        </div>
      )}

      {/* Create form */}
      {showCreateForm && (
        <div className="mb-4 p-4 bg-zinc-950 border border-zinc-800 rounded-xl space-y-3">
          <div>
            <label className="text-xs text-zinc-500 mb-1 block">Endpoint URL</label>
            <input
              type="url"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              placeholder="https://your-server.com/webhooks/cabbageseo"
              className="w-full bg-zinc-900 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-blue-500"
            />
          </div>
          <div>
            <label className="text-xs text-zinc-500 mb-1.5 block">Events</label>
            <div className="flex flex-wrap gap-2">
              {EVENT_OPTIONS.map(({ value, label }) => (
                <button
                  key={value}
                  onClick={() => toggleEvent(value)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                    newEvents.includes(value)
                      ? "bg-blue-500/10 border-blue-500/30 text-blue-400"
                      : "bg-zinc-900 border-zinc-700 text-zinc-500 hover:border-zinc-600"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={createHook}
              disabled={creating || !newUrl || newEvents.length === 0}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-500 text-white font-bold rounded-lg text-sm hover:bg-blue-400 transition-colors disabled:opacity-50"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Create
            </button>
            <button onClick={() => setShowCreateForm(false)} className="px-3 py-1.5 text-zinc-400 text-sm hover:text-white transition-colors">
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Webhooks list */}
      {loading ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="w-5 h-5 text-zinc-500 animate-spin" />
        </div>
      ) : hooks.length === 0 ? (
        <p className="text-zinc-500 text-sm py-4 text-center">
          No webhooks configured. Add one to receive event notifications.
        </p>
      ) : (
        <div className="space-y-2">
          {hooks.map((h) => (
            <div
              key={h.id}
              className={`p-3 rounded-lg border ${
                h.isActive ? "bg-zinc-950 border-zinc-800" : "bg-zinc-950/50 border-zinc-800/50 opacity-50"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white font-mono truncate">{h.url}</p>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    {(h.events || []).map((e) => (
                      <span key={e} className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded">
                        {e}
                      </span>
                    ))}
                    {!h.isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded">Disabled</span>
                    )}
                    {h.failureCount > 0 && h.isActive && (
                      <span className="text-[10px] px-1.5 py-0.5 bg-amber-500/10 text-amber-400 rounded flex items-center gap-1">
                        <AlertCircle className="w-2.5 h-2.5" />
                        {h.failureCount} failures
                      </span>
                    )}
                  </div>
                  <p className="text-[10px] text-zinc-600 mt-1">
                    Created {new Date(h.createdAt).toLocaleDateString()}
                    {h.lastDeliveredAt && ` · Last delivery ${new Date(h.lastDeliveredAt).toLocaleDateString()}`}
                    {h.lastStatus !== null && ` (HTTP ${h.lastStatus})`}
                  </p>
                  {/* Test result */}
                  {testResult && testResult.id === h.id && (
                    <p className={`text-xs mt-1 ${testResult.ok ? "text-emerald-400" : "text-red-400"}`}>
                      {testResult.msg}
                    </p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => testHook(h.id)}
                    disabled={testing === h.id}
                    className="p-1.5 text-zinc-600 hover:text-blue-400 transition-colors"
                    title="Send test event"
                  >
                    {testing === h.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => deleteHook(h.id)}
                    className="p-1.5 text-zinc-600 hover:text-red-400 transition-colors"
                    title="Delete webhook"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ============================================
// OPENCLAW PRO SETUP
// ============================================

function OpenClawProSection() {
  const [copiedInstall, setCopiedInstall] = useState(false);

  const copyText = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-blue-500/10 rounded-lg">
          <Terminal className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-white font-bold">OpenClaw Skill</h3>
          <p className="text-zinc-500 text-sm">Scan any domain from your AI agent</p>
        </div>
      </div>

      <div className="space-y-3">
        {/* Install command */}
        <div>
          <p className="text-xs text-zinc-500 mb-1.5">Install the skill</p>
          <div className="flex items-center gap-2 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2">
            <code className="flex-1 text-sm text-emerald-400 font-mono">
              openclaw skills install cabbageseo-ai-visibility
            </code>
            <button
              onClick={() => copyText("openclaw skills install cabbageseo-ai-visibility", setCopiedInstall)}
              className="p-1 text-zinc-500 hover:text-white transition-colors shrink-0"
            >
              {copiedInstall ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Available commands */}
        <div>
          <p className="text-xs text-zinc-500 mb-1.5">Try these commands</p>
          <div className="grid gap-1.5">
            {[
              { cmd: '"scan stripe.com"', desc: "Check any domain" },
              { cmd: '"compare stripe.com vs square.com"', desc: "Head-to-head battle" },
              { cmd: '"trending"', desc: "View the leaderboard" },
              { cmd: '"badge stripe.com"', desc: "Get embeddable badge" },
              { cmd: '"monitor stripe.com"', desc: "Weekly email alerts" },
            ].map(({ cmd, desc }) => (
              <div key={cmd} className="flex items-center gap-2 text-sm">
                <code className="text-blue-400 font-mono text-xs">{cmd}</code>
                <span className="text-zinc-600">—</span>
                <span className="text-zinc-400 text-xs">{desc}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Link
        href="/openclaw"
        className="mt-4 inline-flex items-center gap-1.5 text-sm text-blue-400 hover:text-blue-300 transition-colors"
      >
        View full documentation
        <ExternalLink className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}

// ============================================
// BADGE CUSTOMIZATION
// ============================================

function BadgeSection({ domain }: { domain: string }) {
  const [copiedMd, setCopiedMd] = useState(false);
  const [copiedHtml, setCopiedHtml] = useState(false);

  const badgeUrl = `https://cabbageseo.com/api/badge/score?domain=${domain}`;
  const reportUrl = `https://cabbageseo.com/r/${domain}`;
  const mdCode = `[![AI Visibility](${badgeUrl})](${reportUrl})`;
  const htmlCode = `<a href="${reportUrl}"><img src="${badgeUrl}" alt="AI Visibility Score" /></a>`;

  const copyText = (text: string, setter: (v: boolean) => void) => {
    navigator.clipboard.writeText(text);
    setter(true);
    setTimeout(() => setter(false), 2000);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-emerald-500/10 rounded-lg">
          <Code className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <h3 className="text-white font-bold">Visibility Badge</h3>
          <p className="text-zinc-500 text-sm">Show your score on your site or README</p>
        </div>
      </div>

      {/* Preview — inline SVG so it never errors */}
      <div className="flex items-center justify-center p-4 bg-zinc-950 border border-zinc-800 rounded-xl mb-4">
        <svg xmlns="http://www.w3.org/2000/svg" width="138" height="20" role="img" aria-label="AI Visibility: score">
          <linearGradient id="s" x2="0" y2="100%">
            <stop offset="0" stopColor="#bbb" stopOpacity=".1"/>
            <stop offset="1" stopOpacity=".1"/>
          </linearGradient>
          <clipPath id="r">
            <rect width="138" height="20" rx="3" fill="#fff"/>
          </clipPath>
          <g clipPath="url(#r)">
            <rect width="90" height="20" fill="#555"/>
            <rect x="90" width="48" height="20" fill="#4c1"/>
            <rect width="138" height="20" fill="url(#s)"/>
          </g>
          <g fill="#fff" textAnchor="middle" fontFamily="Verdana,Geneva,DejaVu Sans,sans-serif" fontSize="11">
            <text x="45" y="15" fill="#010101" fillOpacity=".3">AI Visibility</text>
            <text x="45" y="14" fill="#fff">AI Visibility</text>
            <text x="114" y="15" fill="#010101" fillOpacity=".3">42/100</text>
            <text x="114" y="14" fill="#fff">42/100</text>
          </g>
        </svg>
        <span className="ml-2 text-[10px] text-zinc-600">Preview</span>
      </div>

      {/* Embed codes */}
      <div className="space-y-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-zinc-500">Markdown</p>
            <button
              onClick={() => copyText(mdCode, setCopiedMd)}
              className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white transition-colors"
            >
              {copiedMd ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedMd ? "Copied" : "Copy"}
            </button>
          </div>
          <code className="block bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] text-zinc-400 font-mono break-all">
            {mdCode}
          </code>
        </div>
        <div>
          <div className="flex items-center justify-between mb-1">
            <p className="text-xs text-zinc-500">HTML</p>
            <button
              onClick={() => copyText(htmlCode, setCopiedHtml)}
              className="flex items-center gap-1 text-[10px] text-zinc-500 hover:text-white transition-colors"
            >
              {copiedHtml ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              {copiedHtml ? "Copied" : "Copy"}
            </button>
          </div>
          <code className="block bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-[11px] text-zinc-400 font-mono break-all">
            {htmlCode}
          </code>
        </div>
      </div>
    </div>
  );
}

// ============================================
// COMMAND REFERENCE
// ============================================

function CommandReference() {
  const commands = [
    { cmd: "scan domain.com", desc: "Full AI visibility scan", plan: "Free", icon: "🔍" },
    { cmd: "compare A vs B", desc: "Head-to-head comparison", plan: "Free", icon: "⚔️" },
    { cmd: "trending", desc: "View the leaderboard", plan: "Free", icon: "🏆" },
    { cmd: "badge domain.com", desc: "Get embeddable badge", plan: "Free", icon: "🏷️" },
    { cmd: "monitor domain.com", desc: "Weekly email alerts", plan: "Free", icon: "📬" },
    { cmd: "scan --deep domain.com", desc: "Deep scan with recommendations", plan: "API Key", icon: "🔬" },
    { cmd: "gaps domain.com", desc: "Gap analysis", plan: "API Key", icon: "🎯" },
    { cmd: "history domain.com", desc: "Score history & trends", plan: "API Key", icon: "📈" },
  ];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 bg-purple-500/10 rounded-lg">
          <BookOpen className="w-5 h-5 text-purple-400" />
        </div>
        <div>
          <h3 className="text-white font-bold">Command Reference</h3>
          <p className="text-zinc-500 text-sm">All available OpenClaw commands</p>
        </div>
      </div>

      <div className="space-y-1">
        {commands.map(({ cmd, desc, plan, icon }) => (
          <div key={cmd} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-zinc-800/50 transition-colors">
            <span className="text-sm w-5 text-center">{icon}</span>
            <code className="text-sm text-white font-mono flex-1 min-w-0 truncate">{cmd}</code>
            <span className="text-xs text-zinc-500 hidden sm:block">{desc}</span>
            <span className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 ${
              plan === "Free"
                ? "bg-emerald-500/10 text-emerald-400"
                : "bg-amber-500/10 text-amber-400"
            }`}>
              {plan}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// MAIN PAGE
// ============================================

export default function IntegrationsPage() {
  const { organization, currentSite } = useSite();
  const plan = organization?.plan || "free";
  const domain = currentSite?.domain || "yourdomain.com";

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">API & OpenClaw</h1>
        <p className="text-zinc-400 text-sm mt-1">
          Manage API keys, install the OpenClaw skill, and embed your visibility badge.
        </p>
      </div>

      <div className="space-y-6">
        {/* API Keys — Command+ only */}
        <ApiKeysSection plan={plan} />

        {/* Webhooks — Command+ only */}
        <WebhooksSection plan={plan} />

        {/* OpenClaw skill setup */}
        <OpenClawProSection />

        {/* Badge embed */}
        <BadgeSection domain={domain} />

        {/* Command reference */}
        <CommandReference />
      </div>
    </div>
  );
}
