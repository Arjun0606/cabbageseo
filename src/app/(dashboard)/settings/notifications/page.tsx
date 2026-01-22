"use client";

import { useState } from "react";
import { Bell, Mail, AlertTriangle, Check } from "lucide-react";

export default function NotificationsPage() {
  const [settings, setSettings] = useState({
    emailAlerts: true,
    competitorAlerts: true,
    weeklyReport: true,
    marketingEmails: false,
  });
  const [saved, setSaved] = useState(false);

  const handleToggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  };

  const handleSave = async () => {
    // TODO: Save to database
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

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
              <Mail className="w-5 h-5 text-red-400" />
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
                    settings.emailAlerts ? "bg-red-500" : "bg-zinc-700"
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
                  <p className="text-white font-medium">Competitor Alerts</p>
                  <p className="text-zinc-400 text-sm">Get notified when competitors gain or lose AI visibility</p>
                </div>
                <button
                  onClick={() => handleToggle("competitorAlerts")}
                  className={`w-12 h-6 rounded-full transition-colors ${
                    settings.competitorAlerts ? "bg-red-500" : "bg-zinc-700"
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full transition-transform ${
                      settings.competitorAlerts ? "translate-x-6" : "translate-x-0.5"
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
                    settings.weeklyReport ? "bg-red-500" : "bg-zinc-700"
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
                  settings.marketingEmails ? "bg-red-500" : "bg-zinc-700"
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
            className="w-full py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
          >
            {saved ? (
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

