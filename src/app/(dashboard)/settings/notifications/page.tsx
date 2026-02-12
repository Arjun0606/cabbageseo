"use client";

import { useState, useEffect } from "react";
import { Bell, Mail, Check, Loader2 } from "lucide-react";

export default function NotificationsPage() {
  const [settings, setSettings] = useState({
    emailAlerts: true,
    weeklyReport: true,
    marketingEmails: false,
  });
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch("/api/notifications").catch(() => null);
        if (res?.ok) {
          const data = await res.json();
          if (data.settings) {
            setSettings({
              emailAlerts: data.settings.email_new_citation ?? true,
              weeklyReport: data.settings.email_weekly_digest ?? true,
              marketingEmails: false,
            });
          }
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
      <div className="max-w-6xl mx-auto">
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

          {/* Other Communications */}
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
