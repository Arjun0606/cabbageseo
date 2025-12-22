"use client";

import { useState } from "react";
import { Palette, Sun, Moon, Monitor, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Theme = "light" | "dark" | "system";

export default function AppearanceSettingsPage() {
  const [theme, setTheme] = useState<Theme>("dark");
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    // TODO: Apply theme and save to preferences
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const themes = [
    { value: "light" as Theme, label: "Light", icon: Sun, description: "Light background with dark text" },
    { value: "dark" as Theme, label: "Dark", icon: Moon, description: "Dark background with light text" },
    { value: "system" as Theme, label: "System", icon: Monitor, description: "Match your system preference" },
  ];

  return (
    <div className="space-y-6">
      {/* Theme Selection */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Palette className="w-5 h-5 text-emerald-500" />
            Theme
          </CardTitle>
          <CardDescription className="text-zinc-400">
            Choose your preferred color scheme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-3">
            {themes.map(({ value, label, icon: Icon, description }) => (
              <button
                key={value}
                onClick={() => setTheme(value)}
                className={cn(
                  "p-4 rounded-lg border-2 text-left transition-all",
                  theme === value
                    ? "border-emerald-500 bg-emerald-500/10"
                    : "border-zinc-700 hover:border-zinc-600"
                )}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className={cn(
                    "p-2 rounded-lg",
                    theme === value ? "bg-emerald-500/20" : "bg-zinc-800"
                  )}>
                    <Icon className={cn(
                      "w-5 h-5",
                      theme === value ? "text-emerald-400" : "text-zinc-400"
                    )} />
                  </div>
                  <span className={cn(
                    "font-medium",
                    theme === value ? "text-emerald-400" : "text-zinc-200"
                  )}>
                    {label}
                  </span>
                </div>
                <p className="text-xs text-zinc-500">{description}</p>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Preview */}
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="text-white">Preview</CardTitle>
          <CardDescription className="text-zinc-400">
            Currently using dark theme
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="p-4 rounded-lg bg-zinc-800 border border-zinc-700">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center">
                <Palette className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="font-medium text-white">Sample Card</p>
                <p className="text-sm text-zinc-400">This is how content appears</p>
              </div>
            </div>
            <div className="flex gap-2">
              <div className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-sm">
                Tag 1
              </div>
              <div className="px-3 py-1 rounded-full bg-zinc-700 text-zinc-300 text-sm">
                Tag 2
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Note */}
      <p className="text-sm text-zinc-500">
        Note: CabbageSEO is optimized for dark theme. Light theme is coming soon.
      </p>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button 
          onClick={handleSave}
          className="bg-emerald-600 hover:bg-emerald-500 text-white"
        >
          {saved ? (
            <>
              <CheckCircle2 className="w-4 h-4 mr-2" />
              Saved!
            </>
          ) : (
            "Save Preferences"
          )}
        </Button>
      </div>
    </div>
  );
}

