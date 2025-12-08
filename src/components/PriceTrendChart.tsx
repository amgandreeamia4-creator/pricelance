// src/components/PriceTrendChart.tsx
"use client";

import React from "react";
import type { ProductPriceHistoryPoint } from "@/types/product";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type Props = {
  history: ProductPriceHistoryPoint[];
};

export const PriceTrendChart: React.FC<Props> = ({ history }) => {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 text-sm shadow-sm dark:border-slate-700 dark:bg-slate-900">
      <div className="mb-1 text-sm font-semibold tracking-tight text-slate-900 dark:text-slate-50">
        Price trend (last 12 months)
      </div>
      <div className="mb-4 text-xs text-slate-700 dark:text-slate-300">
        Track price fluctuations over time to identify the best time to buy.
      </div>

      <div className="h-44 -mx-1">
        {history && history.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis
                dataKey="month"
                tickFormatter={(value) => String(value).slice(5)}
                tick={{ fontSize: 10, fill: '#94a3b8' }}
                axisLine={{ stroke: '#475569' }}
                tickLine={{ stroke: '#475569' }}
              />
              <YAxis 
                tick={{ fontSize: 10, fill: '#94a3b8' }} 
                width={40} 
                tickLine={false} 
                axisLine={{ stroke: '#475569' }}
                tickFormatter={(value) => `$${value}`}
              />
              <Tooltip />
              <Line
                type="monotone"
                dataKey="price"
                strokeWidth={2.5}
                stroke="#38bdf8"
                dot={false}
                activeDot={{ r: 4, fill: '#38bdf8', stroke: '#0ea5e9', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        ) : (
          <div className="flex h-full flex-col items-center justify-center p-4 text-center">
            <div className="mb-1 text-sm font-medium text-slate-700 dark:text-slate-200">
              No price history available
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400">
              Price tracking data will appear here once available.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PriceTrendChart;