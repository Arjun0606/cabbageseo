"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from "recharts";
import { TrendingUp } from "lucide-react";

export interface Snapshot {
  date: string;
  score: number;
  queriesWon: number;
  queriesLost: number;
  totalQueries: number;
}

interface TrendChartProps {
  snapshots: Snapshot[];
  loading: boolean;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function CustomTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ payload: Snapshot }>;
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;
  return (
    <div className="bg-zinc-800 border border-zinc-700 rounded-lg p-3 shadow-lg">
      <p className="text-zinc-400 text-xs mb-1">{formatDate(data.date)}</p>
      <p className="text-white font-bold text-lg">{data.score}/100</p>
      <div className="flex gap-3 mt-1 text-xs">
        <span className="text-emerald-400">{data.queriesWon} won</span>
        <span className="text-red-400">{data.queriesLost} lost</span>
      </div>
    </div>
  );
}

export function TrendChart({ snapshots, loading }: TrendChartProps) {
  if (loading) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 w-48 bg-zinc-800 rounded" />
          <div className="h-60 bg-zinc-800/50 rounded" />
        </div>
      </div>
    );
  }

  if (snapshots.length < 2) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
        <div className="flex items-center gap-2 mb-2">
          <TrendingUp className="w-5 h-5 text-zinc-500" />
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
            AI Visibility Over Time
          </h3>
        </div>
        <p className="text-zinc-500 text-sm">
          Run more checks to see your trend line. At least 2 data points needed.
        </p>
      </div>
    );
  }

  const chartData = snapshots.map((s) => ({
    ...s,
    dateLabel: formatDate(s.date),
  }));

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <TrendingUp className="w-5 h-5 text-emerald-400" />
        <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wide">
          AI Visibility Over Time
        </h3>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" />
          <XAxis
            dataKey="dateLabel"
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            stroke="#3f3f46"
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#a1a1aa", fontSize: 12 }}
            stroke="#3f3f46"
            tickLine={false}
            width={35}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="score"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", r: 3 }}
            activeDot={{ r: 5, fill: "#10b981" }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
