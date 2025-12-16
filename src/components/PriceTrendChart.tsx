// src/components/PriceTrendChart.tsx
"use client";

import React, { type ReactNode } from "react";

type PriceTrendPoint = { date: string; price: number; currency: string };

type PriceTrendChartProps = {
  points: PriceTrendPoint[];
  isLoading?: boolean;
  error?: string | null;
};

export const PriceTrendChart: React.FC<PriceTrendChartProps> = ({
  points,
  isLoading,
  error,
}) => {
  const hasPoints = Array.isArray(points) && points.length > 0;

  const width = 100;
  const height = 80;

  let polylinePoints = "";
  const circles: ReactNode[] = [];

  if (hasPoints) {
    const prices = points.map((p) => p.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const range = maxPrice - minPrice || 1;

    const paddingTop = 6;
    const paddingBottom = 12;
    const chartHeight = height - paddingTop - paddingBottom;

    const xForIndex = (index: number) => {
      if (points.length === 1) return width / 2;
      const t = index / (points.length - 1);
      const left = 8;
      const right = width - 8;
      return left + t * (right - left);
    };

    polylinePoints = points
      .map((p, index) => {
        const x = xForIndex(index);
        const normalized = (p.price - minPrice) / range;
        const y = paddingTop + (1 - normalized) * chartHeight;
        circles.push(
          <circle
            key={index}
            cx={x}
            cy={y}
            r={1.6}
            className="fill-sky-400 stroke-sky-500"
            strokeWidth={0.4}
          />
        );
        return `${x},${y}`;
      })
      .join(" ");
  }

  return (
    <div className="rounded-2xl bg-[var(--pl-card)] border border-[var(--pl-card-border)] p-4">
      <h3 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-700 dark:text-slate-200 mb-1.5">
        Price Trend (Last 12 Months)
      </h3>
      <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300 mb-3">
        Track price fluctuations over time to identify the best time to buy.
      </p>

      {isLoading ? (
        <div className="flex items-center justify-center py-6 text-xs text-slate-700 dark:text-slate-300">
          Loading price history
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">{error}</p>
        </div>
      ) : !hasPoints ? (
        <div className="flex flex-col items-center justify-center py-4 text-center">
          <p className="text-sm font-medium text-slate-800 dark:text-slate-100 mb-0.5">
            No price history available
          </p>
          <p className="text-xs leading-relaxed text-slate-700 dark:text-slate-300">
            Price tracking data will appear here once available.
          </p>
        </div>
      ) : (
        <div className="h-24 w-full">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="h-full w-full overflow-visible text-sky-400"
          >
            <line
              x1={0}
              y1={height - 12}
              x2={width}
              y2={height - 12}
              className="stroke-slate-700/40"
              strokeWidth={0.4}
            />
            <line
              x1={0}
              y1={height / 2}
              x2={width}
              y2={height / 2}
              className="stroke-slate-700/20"
              strokeWidth={0.3}
            />
            <polyline
              points={polylinePoints}
              fill="none"
              className="stroke-sky-400"
              strokeWidth={1.6}
              strokeLinejoin="round"
              strokeLinecap="round"
            />
            {circles}
          </svg>
        </div>
      )}
    </div>
  );
};

export default PriceTrendChart;