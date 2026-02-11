"use client";

import { useState, useEffect } from "react";
import { Bell, Mail, Check, Loader2, MessageSquare, ExternalLink, AlertCircle } from "lucide-react";

export default function NotificationsPage() {
  const [settings, setSettings] = useState({
    emailAlerts: true,
    weeklyReport: true,
    marketingEmails: false,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Slack state
  const [slackUrl, setSlackUrl] = useState("");
  const [slackConfigured, setSlackConfigured] = useState(false);
  const [slackSaving, setSlackSaving] = useState(false);
  const [slackTesting, setSlackTesting] = useState(false);
  const [slackTestResult, setSlackTestResult] = useState<"success" | "error" | null>(null);

  // Load notification settings + Slack config on mount
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [notifRes, slackRes] = await Promise.all([
          fetch("/api/notifications").catch(() => null),
          fetch("/api/notifications/slack").catch(() => null),
        ]);

        if (notifRes?.ok) {
          const data = await notifRes.json();
          if (data.settings) {
            setSettings({
              emailAlerts: data.settings.email_new_citation ?? true,
              weeklyReport: data.settings.email_weekly_digest ?? true,
              marketingEmails: false,
            });
          }
        }

        if (slackRes?.ok) {
          const data = await slackRes.json();
          setSlackConfigured(data.configured || false);
        }
      } catch (error) {
        console.error("Failed to load notification settings:", error);
      } finally {
        setLoading(false);
      }
    };
    loadSettings();
  }, []);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email_new_citation: settings.emailAlerts,
          email_lost_citation: settings.emailAlerts,
          email_weekly_digest: settings.weeklyReport,
        }),
      });
      
      if (response.ok) {
        setSaved(true);
        setTimeout(() => setSaved(false), 2000);
      }
    } catch (error) {
      console.error("Failed to save notification settings:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-zinc-950 p-6">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-white mb-2">Notifications</h1>
          <p className="text-zinc-400">Manage how you receive updates and alerts</p>
        </div>

        <div className="space-y-6">
          {/* Email Notifications */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Mail className="w-5 h-5 text-emerald-400" />
              Email Notifications
            </h2>
            
            <div className="space-y-4">
              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-white font-medium">Citation Alerts</p>
                  <p className="text-zinc-400 text-sm">Get notified when AI starts or stops mentioning you</p>
                </div>
                <button
                  onClick={() => handleToggle("emailAlerts")}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.emailAlerts ? "bg-emerald-500" : "bg-zinc-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.emailAlerts ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>

              <label className="flex items-center justify-between cursor-pointer">
                <div>
                  <p className="text-white font-medium">Weekly Report</p>
                  <p className="text-zinc-400 text-sm">Receive a weekly summary of your AI visibility</p>
                </div>
                <button
                  onClick={() => handleToggle("weeklyReport")}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.weeklyReport ? "bg-emerald-500" : "bg-zinc-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.weeklyReport ? "translate-x-6" : "translate-x-0.5"
                    }`}
                  />
                </button>
              </label>
            </div>
          </div>

          {/* Marketing */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <Bell className="w-5 h-5 text-zinc-400" />
              Other Communications
            </h2>
            
            <label className="flex items-center justify-between cursor-pointer">
              <div>
                <p className="text-white font-medium">Product Updates</p>
                <p className="text-zinc-400 text-sm">Hear about new features and improvements</p>
              </div>
              <button
                onClick={() => handleToggle("marketingEmails")}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings.marketingEmails ? "bg-emerald-500" : "bg-zinc-700"
                }`}
              >
                <div
                  className={`w-5 h-5 bg-white rounded-full transition-transform ${
                    settings.marketingEmails ? "translate-x-6" : "translate-x-0.5"
                  }`}
                />
              </button>
            </label>
          </div>

          {/* Slack Integration */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
              Slack Integration
              {slackConfigured && (
                <span className="ml-auto text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                  Connected
                </span>
              )}
            </h2>

            <p className="text-zinc-400 text-sm mb-4">
              Get AI visibility alerts directly in your Slack channel — check results, score drops, and weekly reports.
            </p>

            <div className="space-y-3">
              <div>
                <label className="block text-sm text-zinc-400 mb-1">Webhook URL</label>
                <input
                  type="url"
                  value={slackUrl}
                  onChange={(e) => {
                    setSlackUrl(e.target.value);
                    setSlackTestResult(null);
                  }}
                  placeholder="https://hooks.slack.com/services/T.../B.../..."
                  className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-sm text-white placeholder:text-zinc-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  onClick={async () => {
                    if (!slackUrl.startsWith("https://hooks.slack.com/")) {
                      setSlackTestResult("error");
                      return;
                    }
                    setSlackTesting(true);
                    setSlackTestResult(null);
                    try {
                      const res = await fetch("/api/notifications/slack", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ webhookUrl: slackUrl, test: true }),
                      });
                      const data = await res.json();
                      setSlackTestResult(data.success ? "success" : "error");
                    } catch {
                      setSlackTestResult("error");
                    } finally {
                      setSlackTesting(false);
                    }
                  }}
                  disabled={!slackUrl || slackTesting}
                  className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 disabled:bg-zinc-800 disabled:opacity-50 text-white text-sm rounded-lg transition-colors flex items-center gap-2"
                >
                  {slackTesting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Test Connection"
                  )}
                </button>

                <button
                  onClick={async () => {
                    if (!slackUrl.startsWith("https://hooks.slack.com/")) {
                      setSlackTestResult("error");
                      return;
                    }
                    setSlackSaving(true);
                    try {
                      const res = await fetch("/api/notifications/slack", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ webhookUrl: slackUrl }),
                      });
                      if (res.ok) {
                        setSlackConfigured(true);
                        setSlackTestResult("success");
                      }
                    } finally {
                      setSlackSaving(false);
                    }
                  }}
                  disabled={!slackUrl || slackSaving}
                  className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-zinc-700 text-white text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
                >
                  {slackSaving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    "Save Webhook"
                  )}
                </button>

                {slackConfigured && (
                  <button
                    onClick={async () => {
                      await fetch("/api/notifications/slack", { method: "DELETE" });
                      setSlackConfigured(false);
                      setSlackUrl("");
                      setSlackTestResult(null);
                    }}
                    className="px-4 py-2 text-red-400 hover:text-red-300 text-sm transition-colors"
                  >
                    Disconnect
                  </button>
                )}
              </div>

              {slackTestResult === "success" && (
                <div className="flex items-center gap-2 text-sm text-emerald-400">
                  <Check className="w-4 h-4" />
                  Connection successful — check your Slack channel
                </div>
              )}
              {slackTestResult === "error" && (
                <div className="flex items-center gap-2 text-sm text-red-400">
                  <AlertCircle className="w-4 h-4" />
                  Connection failed — check that your webhook URL is correct
                </div>
              )}

              <a
                href="https://api.slack.com/messaging/webhooks"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-400 transition-colors"
              >
                How to get a Slack webhook URL
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-500/50 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Saving...
              </>
            ) : saved ? (
              <>
                <Check className="w-5 h-5" />
                Saved!
              </>
            ) : (
              "Save Preferences"
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

