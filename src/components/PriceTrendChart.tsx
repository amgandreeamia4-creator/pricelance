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
  Area,
  AreaChart,
} from "recharts";
import { format, parseISO } from "date-fns";
import { useSpring, animated } from '@react-spring/web';

type Point = {
  date: string;
  price: number;
  currency: string;
};

type Props = {
  points: Point[];
  isLoading: boolean;
  error: string | null;
  hasProductSelected: boolean;
};

export default function PriceTrendChart({ points, isLoading, error, hasProductSelected }: Props) {
  const hasData = Array.isArray(points) && points.length > 0;

  // Process data for better visualization
  const chartData = React.useMemo(() => {
    if (!hasData) return [];
    
    return points.map(point => {
      let formattedDate = point.date;
      try {
        // Try to parse and format the date
        const parsedDate = parseISO(point.date);
        if (!isNaN(parsedDate.getTime())) {
          formattedDate = format(parsedDate, "MMM yyyy");
        }
      } catch (e) {
        // Keep original date if parsing fails
      }
      
      return {
        ...point,
        formattedDate,
        displayPrice: point.price
      };
    });
  }, [points, hasData]);

  // Custom tooltip for better UX
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="rounded-lg border border-slate-200 bg-white p-2 shadow-lg">
          <p className="text-xs font-medium text-slate-900">{data.formattedDate}</p>
          <p className="text-xs text-slate-600">
            {data.displayPrice} {data.currency}
          </p>
        </div>
      );
    }
    return null;
  };

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
        ) : !hasProductSelected ? (
          <p className="text-[11px] text-[var(--pl-text-subtle)]">
            Select a product to see its price history.
          </p>
        ) : !hasData ? (
          <p className="text-[11px] text-[var(--pl-text-subtle)]">
            No price history available yet for this product.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={chartData}
              margin={{ top: 8, right: 8, left: 0, bottom: 4 }}
            >
              <defs>
                <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                </linearGradient>
              </defs>
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#e2e8f0" 
                opacity={0.5}
              />
              <XAxis 
                dataKey="formattedDate" 
                tick={{ fontSize: 10 }}
                stroke="#64748b"
                interval="preserveStartEnd"
              />
              <YAxis 
                tick={{ fontSize: 10 }}
                stroke="#64748b"
                domain={["auto", "auto"]}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="displayPrice"
                stroke="#3b82f6"
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#colorPrice)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
