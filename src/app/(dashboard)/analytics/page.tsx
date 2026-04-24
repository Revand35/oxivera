"use client";

import { useMemo, useState } from "react";
import * as XLSX from "xlsx";
import PageHeader from "@/components/PageHeader";
import { useSensorData, HistoricalPoint } from "@/context/SensorDataContext";
import { aqiCategory } from "@/lib/mockData";
import {
  ComposedChart,
  LineChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  HiOutlineDownload,
  HiOutlineSparkles,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineClock,
} from "react-icons/hi";

const PINK = "#ff94c0";
const PINK_DARK = "#ff6ba5";
const GREEN = "#afd373";
const GREEN_DARK = "#8fb852";
const GRAD = "linear-gradient(135deg, #ff94c0 0%, #afd373 100%)";

type Range = "24h" | "7d" | "30d";
type Metric = "pm25" | "aqi";

const metricLabel: Record<Metric, string> = {
  pm25: "PM2.5 (μg/m³)",
  aqi: "AQI Index",
};

interface AggPoint {
  time: string;
  before: number;
  after: number;
  reduction: number;
  effectiveness: number;
}

/* ─────────── Aggregation helpers ─────────── */

function average<T>(arr: T[], fn: (v: T) => number) {
  if (!arr.length) return 0;
  return arr.reduce((s, v) => s + fn(v), 0) / arr.length;
}

function aggregate(history: HistoricalPoint[], range: Range, metric: Metric): AggPoint[] {
  if (!history.length) return [];
  const beforeKey = `before${metric[0].toUpperCase()}${metric.slice(1)}` as keyof HistoricalPoint;
  const afterKey = `after${metric[0].toUpperCase()}${metric.slice(1)}` as keyof HistoricalPoint;

  const toPoint = (bucket: HistoricalPoint[], label: string): AggPoint => {
    const before = Math.round(average(bucket, (p) => p[beforeKey] as number) * 10) / 10;
    const after = Math.round(average(bucket, (p) => p[afterKey] as number) * 10) / 10;
    const reduction = Math.round((before - after) * 10) / 10;
    const effectiveness = before > 0 ? Math.round(((before - after) / before) * 100) : 0;
    return { time: label, before, after, reduction, effectiveness };
  };

  if (range === "24h") {
    // One point per original minute — just map through.
    return history.slice(-120).map((p) =>
      toPoint([p], p.time),
    );
  }
  if (range === "7d") {
    // Bucket by hour — 24 buckets if we have enough data.
    const map = new Map<number, HistoricalPoint[]>();
    history.forEach((p) => {
      const k = p.hour;
      if (!map.has(k)) map.set(k, []);
      map.get(k)!.push(p);
    });
    return Array.from(map.entries())
      .sort((a, b) => a[0] - b[0])
      .map(([h, pts]) => toPoint(pts, `${String(h).padStart(2, "0")}:00`));
  }
  // 30d → bucket every ~10 samples so chart stays readable
  const step = Math.max(1, Math.round(history.length / 30));
  const out: AggPoint[] = [];
  for (let i = 0; i < history.length; i += step) {
    const chunk = history.slice(i, i + step);
    out.push(toPoint(chunk, chunk[0].time));
  }
  return out;
}

/* ─────────── Page ─────────── */

export default function AnalyticsPage() {
  const { history, before, after, effectiveness, connected } = useSensorData();
  const [range, setRange] = useState<Range>("24h");
  const [metric, setMetric] = useState<Metric>("pm25");
  const activeHistory = useMemo(() => (connected ? history : []), [connected, history]);

  const data = useMemo(() => aggregate(activeHistory, range, metric), [activeHistory, range, metric]);
  const hasData = data.length > 0;

  const avgBefore = useMemo(() => average(data, (d) => d.before), [data]);
  const avgAfter = useMemo(() => average(data, (d) => d.after), [data]);
  const avgEff = avgBefore > 0 ? Math.round(((avgBefore - avgAfter) / avgBefore) * 100) : 0;
  const totalReduction = Math.round(data.reduce((s, d) => s + d.reduction, 0));

  const aqiDistribution = useMemo(() => buildAqiDistribution(activeHistory), [activeHistory]);
  const heatmap = useMemo(() => buildHeatmap(activeHistory), [activeHistory]);

  const handleExport = () => {
    if (!history.length) return;
    const wb = XLSX.utils.book_new();
    const exportRows = history.map((row) => ({
      time: row.time,
      hour: row.hour,
      beforePm25: row.beforePm25,
      afterPm25: row.afterPm25,
      beforeAqi: row.beforeAqi,
      afterAqi: row.afterAqi,
      beforeN2o: row.beforeCo2,
      afterN2o: row.afterCo2,
      beforeTemp: row.beforeTemp,
      afterTemp: row.afterTemp,
      beforeHumidity: row.beforeHumidity,
      afterHumidity: row.afterHumidity,
    }));
    const sheet = XLSX.utils.json_to_sheet(exportRows);
    XLSX.utils.book_append_sheet(wb, sheet, "History");
    XLSX.writeFile(wb, `oxivera-analytics-${new Date().toISOString().slice(0, 10)}.xlsx`);
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <PageHeader
        title="Analytics"
        description="Analisis mendalam efektivitas filter Oxivera"
        action={
          <button
            onClick={handleExport}
            disabled={!hasData}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: GRAD }}
          >
            <HiOutlineDownload /> Export Excel
          </button>
        }
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3 mb-6">
        <Segmented
          label="Rentang"
          value={range}
          options={[
            { v: "24h", l: "24 Jam" },
            { v: "7d", l: "7 Hari" },
            { v: "30d", l: "30 Hari" },
          ]}
          onChange={(v) => setRange(v as Range)}
        />
        <Segmented
          label="Metrik"
          value={metric}
          options={[
            { v: "pm25", l: "PM2.5" },
            { v: "aqi", l: "AQI" },
          ]}
          onChange={(v) => setMetric(v as Metric)}
        />
        <div className="ml-auto flex items-center gap-1.5 text-xs text-gray-500">
          <HiOutlineClock /> {history.length} titik tersimpan
        </div>
        <div
          className="px-3 py-1.5 rounded-full text-xs font-semibold"
          style={{
            background: connected ? "#d9ebb8" : "#f3f4f6",
            color: connected ? GREEN_DARK : "#6b7280",
          }}
        >
          {connected ? "Alat Terhubung" : "Alat Belum Terhubung"}
        </div>
      </div>

      {!hasData && (
        <div className="bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3 mb-6 text-sm flex items-center gap-2">
          <HiOutlineSparkles />
          Menunggu data realtime. Grafik akan terisi saat sensor mengirim pembacaan (1 titik/menit).
        </div>
      )}

      {/* Hero row: Gauge + Stat chips */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <HeroGauge effectiveness={avgEff} liveEff={effectiveness.avg} />
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatChip
            label="Sebelum Filter (rata²)"
            value={hasData ? avgBefore.toFixed(1) : "—"}
            unit={metricLabel[metric].replace(/^[^(]+/, "").replace(/[()]/g, "")}
            color={PINK_DARK}
            trend="up"
          />
          <StatChip
            label="Sesudah Filter (rata²)"
            value={hasData ? avgAfter.toFixed(1) : "—"}
            unit={metricLabel[metric].replace(/^[^(]+/, "").replace(/[()]/g, "")}
            color={GREEN_DARK}
            trend="down"
          />
          <StatChip
            label="Total Polutan Diserap"
            value={hasData ? totalReduction.toString() : "—"}
            unit={metricLabel[metric].replace(/^[^(]+/, "").replace(/[()]/g, "")}
            gradient
          />
        </div>
      </div>

      {/* Line chart: before vs after */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between mb-5 flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900">
              Garis {metricLabel[metric]} — Sebelum vs Sesudah Filter
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Dua garis sejajar memudahkan membaca selisih
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-[3px] rounded-full" style={{ background: PINK_DARK }} />
              <span className="text-gray-500">Sebelum Filter</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="inline-block w-3 h-[3px] rounded-full" style={{ background: GREEN_DARK }} />
              <span className="text-gray-500">Sesudah Filter</span>
            </div>
          </div>
        </div>
        <ResponsiveContainer width="100%" height={300} minWidth={0} minHeight={1}>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={28}
            />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<FancyTooltip metricLabel={metricLabel[metric]} />} />
            <Line
              type="monotone"
              dataKey="before"
              name="Sebelum Filter"
              stroke={PINK_DARK}
              strokeWidth={2.5}
              dot={{ r: 3, fill: PINK_DARK, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
            <Line
              type="monotone"
              dataKey="after"
              name="Sesudah Filter"
              stroke={GREEN_DARK}
              strokeWidth={2.5}
              dot={{ r: 3, fill: GREEN_DARK, strokeWidth: 0 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Main composed chart */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 mb-6">
        <div className="flex items-start justify-between mb-5 flex-wrap gap-2">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Tren {metricLabel[metric]}</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Area = sebelum/sesudah filter · Garis = % efektivitas
            </p>
          </div>
          <LegendPill />
        </div>
        <ResponsiveContainer width="100%" height={340} minWidth={0} minHeight={1}>
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="gradBefore" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PINK} stopOpacity={0.55} />
                <stop offset="100%" stopColor={PINK} stopOpacity={0} />
              </linearGradient>
              <linearGradient id="gradAfter" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={GREEN} stopOpacity={0.55} />
                <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={28}
            />
            <YAxis
              yAxisId="left"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              domain={[0, 100]}
              unit="%"
            />
            <Tooltip content={<FancyTooltip metricLabel={metricLabel[metric]} />} />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="before"
              name="Sebelum"
              stroke={PINK_DARK}
              strokeWidth={2}
              fill="url(#gradBefore)"
            />
            <Area
              yAxisId="left"
              type="monotone"
              dataKey="after"
              name="Sesudah"
              stroke={GREEN_DARK}
              strokeWidth={2}
              fill="url(#gradAfter)"
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="effectiveness"
              name="Efektivitas"
              stroke="#7c3aed"
              strokeWidth={2}
              strokeDasharray="4 4"
              dot={false}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {/* Heatmap + Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-3 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Pola Harian AQI</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Jam (0–23) × tanggal · semakin gelap = AQI semakin buruk
              </p>
            </div>
          </div>
          <Heatmap matrix={heatmap} />
        </div>

        <div className="lg:col-span-2 bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
          <h3 className="text-lg font-bold text-gray-900">Distribusi Kategori AQI</h3>
          <p className="text-xs text-gray-500 mt-0.5 mb-2">
            Frekuensi udara (sesudah filter)
          </p>
          <AqiDonut distribution={aqiDistribution} />
        </div>
      </div>

      {/* Reduction stacked area */}
      <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-bold text-gray-900">Polutan yang Diserap</h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Selisih sebelum−sesudah ({metricLabel[metric]})
            </p>
          </div>
          <div
            className="text-xs font-semibold px-3 py-1.5 rounded-full text-white shadow-sm"
            style={{ background: GRAD }}
          >
            Total {totalReduction}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={220} minWidth={0} minHeight={1}>
          <ComposedChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
            <defs>
              <linearGradient id="gradRed" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={PINK_DARK} stopOpacity={0.4} />
                <stop offset="100%" stopColor={GREEN_DARK} stopOpacity={0.4} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              fontSize={11}
              tickLine={false}
              axisLine={false}
              minTickGap={28}
            />
            <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} axisLine={false} />
            <Tooltip content={<FancyTooltip metricLabel={metricLabel[metric]} reductionMode />} />
            <Area
              type="monotone"
              dataKey="reduction"
              stroke={PINK_DARK}
              strokeWidth={2}
              fill="url(#gradRed)"
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      {hasData && (
        <p className="text-center text-[11px] text-gray-400 mt-6">
          Live: {before.aqi} → {after.aqi} AQI · efektivitas {effectiveness.avg}% saat ini
        </p>
      )}
    </div>
  );
}

/* ─────────── Subcomponents ─────────── */

function Segmented<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: T;
  options: { v: T; l: string }[];
  onChange: (v: T) => void;
}) {
  return (
    <div>
      <label className="text-[11px] font-semibold text-gray-500 uppercase tracking-wider block mb-1.5">
        {label}
      </label>
      <div className="inline-flex bg-gray-100 rounded-xl p-1">
        {options.map((o) => {
          const active = value === o.v;
          return (
            <button
              key={o.v}
              onClick={() => onChange(o.v)}
              className="px-4 py-1.5 rounded-lg text-sm font-medium transition"
              style={
                active
                  ? { background: "white", color: "#0f172a", boxShadow: "0 1px 2px rgba(0,0,0,0.08)" }
                  : { color: "#64748b" }
              }
            >
              {o.l}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function HeroGauge({ effectiveness, liveEff }: { effectiveness: number; liveEff: number }) {
  const data = [{ name: "eff", value: effectiveness, fill: "url(#heroGrad)" }];
  return (
    <div className="relative bg-white rounded-3xl shadow-sm border border-gray-100 p-6 overflow-hidden">
      <div
        className="absolute -top-12 -right-12 w-40 h-40 rounded-full blur-2xl opacity-30"
        style={{ background: GRAD }}
      />
      <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">
        Efektivitas Filter
      </p>
      <p className="text-xs text-gray-400 mb-3">Rata-rata rentang ini</p>

      <div className="relative w-full aspect-square max-w-[200px] mx-auto">
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
          <RadialBarChart
            cx="50%"
            cy="50%"
            innerRadius="75%"
            outerRadius="100%"
            startAngle={90}
            endAngle={-270}
            data={data}
          >
            <defs>
              <linearGradient id="heroGrad" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor={PINK} />
                <stop offset="100%" stopColor={GREEN} />
              </linearGradient>
            </defs>
            <RadialBar dataKey="value" cornerRadius={999} background={{ fill: "#f1f5f9" }} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span
            className="text-4xl font-bold"
            style={{
              background: GRAD,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            {effectiveness}%
          </span>
          <span className="text-[11px] text-gray-400 mt-0.5">Live {liveEff}%</span>
        </div>
      </div>
    </div>
  );
}

function StatChip({
  label,
  value,
  unit,
  color,
  gradient,
  trend,
}: {
  label: string;
  value: string;
  unit?: string;
  color?: string;
  gradient?: boolean;
  trend?: "up" | "down";
}) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex flex-col justify-between min-h-[120px]">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">{label}</p>
        {trend === "up" && <HiOutlineArrowUp className="text-pink-500 text-lg" />}
        {trend === "down" && <HiOutlineArrowDown className="text-green-500 text-lg" />}
      </div>
      <div>
        <span
          className="text-3xl font-bold"
          style={
            gradient
              ? {
                  background: GRAD,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                }
              : { color: color || "#0f172a" }
          }
        >
          {value}
        </span>
        {unit && <span className="text-xs text-gray-400 ml-1">{unit.trim()}</span>}
      </div>
    </div>
  );
}

function LegendPill() {
  const items = [
    { color: PINK_DARK, label: "Sebelum" },
    { color: GREEN_DARK, label: "Sesudah" },
    { color: "#7c3aed", label: "Efektivitas", dashed: true },
  ];
  return (
    <div className="flex items-center gap-3 text-xs">
      {items.map((i) => (
        <div key={i.label} className="flex items-center gap-1.5">
          <span
            className="inline-block w-3 h-[3px] rounded-full"
            style={{
              background: i.dashed
                ? `repeating-linear-gradient(90deg, ${i.color} 0 4px, transparent 4px 7px)`
                : i.color,
            }}
          />
          <span className="text-gray-500">{i.label}</span>
        </div>
      ))}
    </div>
  );
}

interface TooltipPayloadItem {
  name?: string;
  dataKey?: string | number;
  value?: number;
  color?: string;
}
function FancyTooltip({
  active,
  payload,
  label,
  metricLabel,
  reductionMode,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  metricLabel: string;
  reductionMode?: boolean;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-xl border border-gray-100 bg-white shadow-lg px-3 py-2 text-xs">
      <div className="font-semibold text-gray-900 mb-1">{label}</div>
      {reductionMode ? (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ background: PINK_DARK }} />
          <span className="text-gray-600">Diserap</span>
          <span className="font-semibold text-gray-900 ml-auto">
            {payload[0].value} {metricLabel.match(/\(([^)]+)\)/)?.[1]}
          </span>
        </div>
      ) : (
        payload.map((p) => (
          <div key={p.dataKey as string} className="flex items-center gap-2 my-0.5">
            <span className="w-2 h-2 rounded-full" style={{ background: p.color }} />
            <span className="text-gray-600">{p.name}</span>
            <span className="font-semibold text-gray-900 ml-auto">
              {p.value}
              {p.dataKey === "effectiveness" ? "%" : ""}
            </span>
          </div>
        ))
      )}
    </div>
  );
}

/* ─────────── Heatmap ─────────── */

interface HeatmapCell {
  day: string;
  hour: number;
  aqi: number | null;
}
function buildHeatmap(history: HistoricalPoint[]): HeatmapCell[][] {
  if (!history.length) return [];
  const byDayHour = new Map<string, { sum: number; count: number }>();
  const days = new Set<string>();

  // Each point is 1 minute apart; derive day/hour from insertion order.
  const now = new Date();
  history.forEach((p, i) => {
    const mins = history.length - 1 - i; // minutes ago
    const ts = new Date(now.getTime() - mins * 60_000);
    const day = ts.toISOString().slice(5, 10); // MM-DD
    const hour = ts.getHours();
    days.add(day);
    const key = `${day}:${hour}`;
    const cur = byDayHour.get(key) || { sum: 0, count: 0 };
    cur.sum += p.afterAqi;
    cur.count += 1;
    byDayHour.set(key, cur);
  });

  const sortedDays = Array.from(days).sort().slice(-7);
  return sortedDays.map((day) => {
    return Array.from({ length: 24 }, (_, hour) => {
      const c = byDayHour.get(`${day}:${hour}`);
      return { day, hour, aqi: c ? Math.round(c.sum / c.count) : null };
    });
  });
}

function Heatmap({ matrix }: { matrix: HeatmapCell[][] }) {
  if (!matrix.length) {
    return (
      <div className="text-xs text-gray-400 py-10 text-center">
        Belum cukup data untuk heatmap (butuh pembacaan beberapa jam).
      </div>
    );
  }
  const maxAqi = 200;

  const colorFor = (aqi: number | null) => {
    if (aqi == null) return "#f1f5f9";
    const t = Math.min(1, aqi / maxAqi);
    // Interpolate: green (#afd373) → pink (#ff94c0) → red (#ef4444)
    if (t < 0.5) {
      const u = t / 0.5;
      return mix("#afd373", "#ff94c0", u);
    }
    const u = (t - 0.5) / 0.5;
    return mix("#ff94c0", "#ef4444", u);
  };

  return (
    <div className="w-full overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="grid gap-1" style={{ gridTemplateColumns: "52px repeat(24, 1fr)" }}>
          <div />
          {Array.from({ length: 24 }, (_, h) => (
            <div key={h} className="text-[9px] text-gray-400 text-center">
              {h % 3 === 0 ? h : ""}
            </div>
          ))}
          {matrix.flatMap((row) => [
            <div
              key={`lbl-${row[0].day}`}
              className="text-[10px] text-gray-500 flex items-center pr-2 font-medium"
            >
              {row[0].day}
            </div>,
            ...row.map((cell) => (
              <div
                key={`${cell.day}-${cell.hour}`}
                className="aspect-square rounded-md border border-white/50 transition hover:scale-110"
                style={{ background: colorFor(cell.aqi) }}
                title={`${cell.day} ${String(cell.hour).padStart(2, "0")}:00 — AQI ${cell.aqi ?? "—"}`}
              />
            )),
          ])}
        </div>
        <div className="flex items-center gap-2 mt-4 text-[10px] text-gray-500">
          <span>Bersih</span>
          <div
            className="flex-1 h-2 rounded-full"
            style={{
              background: `linear-gradient(90deg, #afd373 0%, #ff94c0 50%, #ef4444 100%)`,
            }}
          />
          <span>Buruk</span>
        </div>
      </div>
    </div>
  );
}

function mix(a: string, b: string, t: number) {
  const pa = hex(a);
  const pb = hex(b);
  const r = Math.round(pa[0] + (pb[0] - pa[0]) * t);
  const g = Math.round(pa[1] + (pb[1] - pa[1]) * t);
  const bl = Math.round(pa[2] + (pb[2] - pa[2]) * t);
  return `rgb(${r}, ${g}, ${bl})`;
}
function hex(c: string): [number, number, number] {
  const s = c.replace("#", "");
  return [
    parseInt(s.slice(0, 2), 16),
    parseInt(s.slice(2, 4), 16),
    parseInt(s.slice(4, 6), 16),
  ];
}

/* ─────────── AQI Donut ─────────── */

interface AqiBucket {
  label: string;
  color: string;
  value: number;
}
function buildAqiDistribution(history: HistoricalPoint[]): AqiBucket[] {
  const buckets: AqiBucket[] = [
    { label: "Baik", color: "#afd373", value: 0 },
    { label: "Sedang", color: "#fbbf24", value: 0 },
    { label: "Tidak Sehat", color: "#ff94c0", value: 0 },
    { label: "Buruk", color: "#ef4444", value: 0 },
  ];
  history.forEach((p) => {
    const c = aqiCategory(p.afterAqi);
    const idx = ["Baik", "Sedang", "Tidak Sehat", "Buruk"].indexOf(c.label);
    if (idx >= 0) buckets[idx].value += 1;
  });
  return buckets;
}

function AqiDonut({ distribution }: { distribution: AqiBucket[] }) {
  const total = distribution.reduce((s, b) => s + b.value, 0);
  if (!total) {
    return (
      <div className="text-xs text-gray-400 py-10 text-center">
        Belum ada data distribusi.
      </div>
    );
  }
  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={200} minWidth={0} minHeight={1}>
        <PieChart>
          <Pie
            data={distribution}
            dataKey="value"
            innerRadius={55}
            outerRadius={85}
            paddingAngle={2}
            stroke="none"
          >
            {distribution.map((b) => (
              <Cell key={b.label} fill={b.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              background: "white",
              border: "1px solid #e5e7eb",
              borderRadius: "12px",
              fontSize: "12px",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 w-full">
        {distribution.map((b) => {
          const pct = Math.round((b.value / total) * 100);
          return (
            <div key={b.label} className="flex items-center gap-2 text-xs">
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: b.color }} />
              <span className="text-gray-600 flex-1">{b.label}</span>
              <span className="font-semibold text-gray-900">{pct}%</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
