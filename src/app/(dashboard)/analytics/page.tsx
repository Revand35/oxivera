"use client";

import { useState, useMemo } from "react";
import PageHeader from "@/components/PageHeader";
import { useSensorData } from "@/context/SensorDataContext";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const PINK = "#ff94c0";
const GREEN = "#afd373";

type Range = "24h" | "7d" | "30d";
type Metric = "pm25" | "aqi" | "co2";

export default function AnalyticsPage() {
  const { history } = useSensorData();
  const [range, setRange] = useState<Range>("24h");
  const [metric, setMetric] = useState<Metric>("pm25");

  const data = useMemo(() => {
    const hours = range === "24h" ? 24 : range === "7d" ? 24 * 7 : 24 * 30;
    const raw = history.slice(-hours);
    if (range === "24h") return raw;
    const step = range === "7d" ? 6 : 24;
    return raw.filter((_, i) => i % step === 0);
  }, [range, history]);

  const metricKey = {
    pm25: { before: "beforePm25", after: "afterPm25", label: "PM2.5 (μg/m³)" },
    aqi: { before: "beforeAqi", after: "afterAqi", label: "AQI Index" },
    co2: { before: "beforeCo2", after: "afterCo2", label: "CO2 (ppm)" },
  }[metric];

  const hasData = data.length > 0;
  const avgBefore = hasData
    ? data.reduce((s, d) => s + (d[metricKey.before as keyof typeof d] as number), 0) / data.length
    : 0;
  const avgAfter = hasData
    ? data.reduce((s, d) => s + (d[metricKey.after as keyof typeof d] as number), 0) / data.length
    : 0;
  const effectiveness = avgBefore > 0 ? Math.round(((avgBefore - avgAfter) / avgBefore) * 100) : 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Analytics"
        description="Analisis historis kualitas udara sebelum vs sesudah filter"
      />

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 mb-6 flex flex-wrap gap-4 items-center">
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Rentang Waktu</label>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["24h", "7d", "30d"] as Range[]).map((r) => (
              <button
                key={r}
                onClick={() => setRange(r)}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition"
                style={
                  range === r
                    ? {
                        background: "linear-gradient(90deg, #ff94c0 0%, #afd373 100%)",
                        color: "white",
                      }
                    : { color: "#6b7280" }
                }
              >
                {r === "24h" ? "24 Jam" : r === "7d" ? "7 Hari" : "30 Hari"}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium text-gray-500 block mb-1">Metrik</label>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
            {(["pm25", "aqi", "co2"] as Metric[]).map((m) => (
              <button
                key={m}
                onClick={() => setMetric(m)}
                className="px-4 py-1.5 rounded-md text-sm font-medium transition"
                style={
                  metric === m
                    ? {
                        background: "linear-gradient(90deg, #ff94c0 0%, #afd373 100%)",
                        color: "white",
                      }
                    : { color: "#6b7280" }
                }
              >
                {m === "pm25" ? "PM2.5" : m === "aqi" ? "AQI" : "CO2"}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <SummaryCard label="Rata-rata Sebelum" value={hasData ? avgBefore.toFixed(1) : "—"} color={PINK} />
        <SummaryCard label="Rata-rata Sesudah" value={hasData ? avgAfter.toFixed(1) : "—"} color={GREEN} />
        <SummaryCard label="Efektivitas" value={hasData ? `${effectiveness}%` : "—"} color="#000" gradient />
      </div>

      {!hasData && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-xl px-4 py-3 mb-6 text-sm">
          Menunggu data realtime dari RTDB. Grafik akan terisi seiring waktu saat sensor mengirim pembacaan.
        </div>
      )}

      {/* Area chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Tren {metricKey.label}
        </h3>
        <ResponsiveContainer width="100%" height={320} minWidth={0}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="beforeGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PINK} stopOpacity={0.4} />
                <stop offset="100%" stopColor={PINK} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="afterGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GREEN} stopOpacity={0.4} />
                <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} />
            <YAxis stroke="#9ca3af" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Area
              type="monotone"
              dataKey={metricKey.before}
              name="Sebelum Filter"
              stroke={PINK}
              strokeWidth={2}
              fill="url(#beforeGrad)"
            />
            <Area
              type="monotone"
              dataKey={metricKey.after}
              name="Sesudah Filter"
              stroke={GREEN}
              strokeWidth={2}
              fill="url(#afterGrad)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Bar comparison */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Perbandingan Before vs After
        </h3>
        <ResponsiveContainer width="100%" height={320} minWidth={0}>
          <BarChart data={data.slice(-12)}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="time" stroke="#9ca3af" fontSize={11} />
            <YAxis stroke="#9ca3af" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Bar dataKey={metricKey.before} name="Sebelum" fill={PINK} radius={[4, 4, 0, 0]} />
            <Bar dataKey={metricKey.after} name="Sesudah" fill={GREEN} radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  color,
  gradient,
}: {
  label: string;
  value: string;
  color: string;
  gradient?: boolean;
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-5">
      <p className="text-sm text-gray-500 mb-2">{label}</p>
      <div
        className="text-3xl font-bold"
        style={
          gradient
            ? {
                background: "linear-gradient(90deg, #ff94c0 0%, #afd373 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }
            : { color }
        }
      >
        {value}
      </div>
    </div>
  );
}
