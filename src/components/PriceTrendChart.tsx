"use client";

import React from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Point = {
  date: string;
  price: number;
  currency: string;
};

type Props = {
  points: Point[];
  isLoading: boolean;
  error: string | null;
};

export default function PriceTrendChart({ points, isLoading, error }: Props) {
  const hasData = Array.isArray(points) && points.length > 0;

  return (
    <div className="rounded-2xl border border-[var(--pl-card-border)] bg-[var(--pl-card)] p-4">
      <h3 className="text-[11px] font-semibold tracking-[0.15em] uppercase text-slate-700 dark:text-slate-200 mb-1.5">
        Price trend (last 12 months)
      </h3>
      <p className="text-[11px] leading-relaxed text-slate-700 dark:text-slate-300">
        Track price fluctuations over time to identify the best time to buy.
      </p>

      <div className="mt-3 h-40 w-full rounded-xl border border-[var(--pl-card-border)] bg-[var(--pl-bg)] flex items-center justify-center overflow-hidden">
        {isLoading ? (
          <p className="text-[11px] text-[var(--pl-text-subtle)]">
            Loading history…
          </p>
        ) : error ? (
          <p className="text-[11px] text-[var(--pl-text-subtle)]">{error}</p>
        ) : !hasData ? (
          <p className="text-[11px] text-[var(--pl-text-subtle)]">
            No price history available yet for this product.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={points}
              margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" hide />
              <YAxis hide domain={["auto", "auto"]} />
              <Tooltip
                formatter={(value: any) =>
                  `${value} ${points[0]?.currency ?? ""}` 
                }
                labelFormatter={() => ""}
              />
              <Line
                type="monotone"
                dataKey="price"
                strokeWidth={2}
                dot={false}
                activeDot={{ r: 3 }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
