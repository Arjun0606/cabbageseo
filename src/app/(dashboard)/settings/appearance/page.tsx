"use client";

import { Moon, CheckCircle2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function AppearanceSettingsPage() {
  return (
    <div className="space-y-6">
      <Card className="bg-zinc-900 border-zinc-800">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-white">
            <Moon className="w-5 h-5 text-emerald-500" />
            Theme
          </CardTitle>
          <CardDescription className="text-zinc-400">
            CabbageSEO uses a dark theme for optimal readability
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-4 p-4 rounded-lg border-2 border-emerald-500 bg-emerald-500/10">
            <div className="p-3 rounded-lg bg-emerald-500/20">
              <Moon className="w-6 h-6 text-emerald-400" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-white">Dark Theme</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              </div>
              <p className="text-sm text-zinc-400">
                Optimized for reduced eye strain and better focus
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
