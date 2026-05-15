"use client";

import * as React from "react";
import { motion } from "framer-motion";

interface DataPoint {
  date: string;
  value: number;
}

interface MiniChartProps {
  data: DataPoint[];
  color?: string;
  height?: number;
  className?: string;
}

export function MiniChart({ data, color = "hsl(var(--primary))", height = 60, className }: MiniChartProps) {
  if (!data || data.length < 2) return null;

  const values = data.map((d) => d.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const padding = 4;
  const width = 100; // percentage-based viewBox

  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - padding - ((d.value - min) / range) * (height - padding * 2);
    return `${x},${y}`;
  });

  const pathD = `M${points.join(" L")}`;
  const areaD = `${pathD} L${width},${height} L0,${height} Z`;

  const isPositive = data[data.length - 1].value >= data[0].value;
  const strokeColor = color || (isPositive ? "oklch(0.7 0.15 145)" : "hsl(var(--destructive))");

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="w-full"
        style={{ height }}
      >
        <defs>
          <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={strokeColor} stopOpacity="0.2" />
            <stop offset="100%" stopColor={strokeColor} stopOpacity="0" />
          </linearGradient>
        </defs>
        <motion.path
          d={areaD}
          fill={`url(#gradient-${color})`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        />
        <motion.path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ pathLength: 0 }}
          animate={{ pathLength: 1 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        />
      </svg>
    </div>
  );
}

interface AllocationBarProps {
  segments: { label: string; percent: number; color: string }[];
  className?: string;
}

export function AllocationBar({ segments, className }: AllocationBarProps) {
  return (
    <div className={className}>
      <div className="flex h-2 w-full overflow-hidden rounded-full">
        {segments.map((seg, i) => (
          <motion.div
            key={seg.label}
            className="h-full"
            style={{ backgroundColor: seg.color }}
            initial={{ width: 0 }}
            animate={{ width: `${seg.percent}%` }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: "easeOut" }}
          />
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
        {segments.map((seg) => (
          <div key={seg.label} className="flex items-center gap-1.5">
            <span className="size-2 rounded-full" style={{ backgroundColor: seg.color }} />
            <span className="text-xs text-muted-foreground">
              {seg.label} ({seg.percent}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
