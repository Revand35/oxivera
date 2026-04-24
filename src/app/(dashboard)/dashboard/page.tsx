"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as XLSX from "xlsx";
import {
  effectivenessPercent,
  aqiCategory,
  SensorReading,
} from "@/lib/mockData";
import { useSensorData } from "@/context/SensorDataContext";
import { useAuth } from "@/context/AuthContext";
import { db } from "@/lib/firebase";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  Timestamp,
} from "firebase/firestore";
import {
  HiOutlineCheckCircle,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineSparkles,
  HiOutlineCube,
  HiOutlineFire,
  HiOutlineRefresh,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineLightningBolt,
  HiOutlineBell,
  HiOutlineDownload,
  HiOutlineDocumentText,
  HiOutlineTrash,
  HiOutlineX,
  HiOutlineCloudUpload,
} from "react-icons/hi";
import { HiOutlineStop, HiOutlinePlayCircle } from "react-icons/hi2";
import {
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
} from "recharts";

const PINK = "#ff94c0";
const PINK_DARK = "#ff6ba5";
const PINK_LIGHT = "#ffd4e5";
const GREEN = "#afd373";
const GREEN_DARK = "#8fb852";
const GREEN_LIGHT = "#d9ebb8";
const GRADIENT = `linear-gradient(90deg, ${PINK} 0%, ${GREEN} 100%)`;

type Range = "today" | "week" | "month";

export default function DashboardPage() {
  const {
    before,
    after,
    effectiveness,
    lastUpdate,
    history,
    connected,
    raw,
    refresh,
  } = useSensorData();
  const [range, setRange] = useState<Range>("today");
  const [historyOpen, setHistoryOpen] = useState(false);
  const recorder = useRecorder({ raw, before, after });
  const activeHistory = useMemo(() => (connected ? history : []), [connected, history]);

  const historicalData = useMemo(() => {
    const hours = range === "today" ? 24 : range === "week" ? 24 * 7 : 24 * 30;
    const slice = activeHistory.slice(-hours);
    if (range === "today") return slice;
    if (range === "week") return slice.filter((_, i) => i % 6 === 0);
    return slice.filter((_, i) => i % 24 === 0);
  }, [range, activeHistory]);

  const effectivenessPm = effectiveness.pm25;
  const effectivenessCo2 = effectiveness.co2;
  const avgEffectiveness = effectiveness.avg;

  const envTrend = useMemo(() => {
    const tail = activeHistory.slice(-8);
    const pick = (fn: (p: (typeof history)[number]) => number, fallback: number) =>
      tail.length > 0 ? tail.map(fn) : [fallback];
    return {
      beforeTemp: pick((p) => p.beforeTemp, before.temperature),
      afterTemp: pick((p) => p.afterTemp, after.temperature),
      beforeHumidity: pick((p) => p.beforeHumidity, before.humidity),
      afterHumidity: pick((p) => p.afterHumidity, after.humidity),
    };
  }, [activeHistory, before.temperature, after.temperature, before.humidity, after.humidity]);

  return (
    <div className="px-4 sm:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span
              className={`w-2 h-2 rounded-full ${connected ? "animate-pulse" : ""}`}
              style={{ background: connected ? GREEN_DARK : "#9ca3af" }}
            />
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">
              {connected ? "Live" : "Menunggu data"}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-sm text-gray-500 mt-1 flex items-center gap-1.5">
            <HiOutlineClock className="text-base" />
            Terakhir diperbarui {formatTime(lastUpdate)}
          </p>
          <p className="text-xs mt-1.5" style={{ color: connected ? GREEN_DARK : "#9ca3af" }}>
            {connected
              ? "Status alat: Terhubung dan mengirim data realtime"
              : "Status alat: Tidak terhubung / data realtime belum masuk"}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <TabGroup value={range} onChange={setRange} />
          <RecordButton recorder={recorder} connected={connected} />
          <RecordingHistoryButton onClick={() => setHistoryOpen(true)} />
          <button
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
            onClick={refresh}
            title="Refresh"
          >
            <HiOutlineRefresh className="text-lg" />
          </button>
        </div>
      </div>

      {!connected && (
        <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 rounded-2xl px-4 py-3 text-sm">
          Alat belum terhubung. Data dan grafik akan berjalan otomatis setelah perangkat
          mengirim data realtime.
        </div>
      )}

      {recorder.lastSession && !recorder.recording && (
        <RecordingSummary
          session={recorder.lastSession}
          onDownload={recorder.download}
          onClear={recorder.clear}
          saveStatus={recorder.saveStatus}
        />
      )}

      {historyOpen && <RecordingHistoryModal onClose={() => setHistoryOpen(false)} />}

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <KpiCard
          icon={<HiOutlineSparkles />}
          iconBg={GRADIENT}
          label="Efektivitas Filter"
          value={`${avgEffectiveness}%`}
          change={+3.2}
          sparklineData={historicalData.slice(-8).map((d) => ({
            v: effectivenessPercent(d.beforePm25, d.afterPm25),
          }))}
          sparklineColor={GREEN}
          sparklineId="spark-eff"
        />
        <KpiCard
          icon={<HiOutlineLightningBolt />}
          iconBg={`linear-gradient(135deg, ${GREEN} 0%, ${GREEN_DARK} 100%)`}
          label="AQI Setelah Filter"
          value={`${after.aqi}`}
          badge={aqiCategory(after.aqi)}
          change={-8.4}
          positive
          sparklineData={historicalData.slice(-8).map((d) => ({ v: d.afterAqi }))}
          sparklineColor={GREEN_DARK}
          sparklineId="spark-aqi"
        />
        <KpiCard
          icon={<HiOutlineCube />}
          iconBg="linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
          label="Reading Tersimpan"
          value={`${history.length}`}
          subtext="titik histori sesi"
          sparklineData={historicalData.slice(-8).map((d) => ({ v: d.beforePm25 * 5 }))}
          sparklineColor="#f59e0b"
          sparklineId="spark-reading"
        />
      </div>

      {/* Main chart + Radial */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* Area chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <SectionHeader
            title="Tren Kualitas Udara"
            subtitle="Perbandingan AQI sebelum dan sesudah filter"
            action={
              <div className="flex items-center gap-4 text-xs">
                <LegendDot color={PINK} label="Sebelum" />
                <LegendDot color={GREEN} label="Sesudah" />
              </div>
            }
          />
          <div className="px-2 pb-4 h-72">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
              <AreaChart data={historicalData}>
                <defs>
                  <linearGradient id="beforeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={PINK} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={PINK} stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="afterGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={GREEN} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={GREEN} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
                <XAxis
                  dataKey="time"
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                  interval="preserveStartEnd"
                />
                <YAxis
                  stroke="#94a3b8"
                  tick={{ fontSize: 11 }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    background: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: 12,
                    boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                    fontSize: 12,
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="beforeAqi"
                  name="Sebelum"
                  stroke={PINK}
                  strokeWidth={2.5}
                  fill="url(#beforeGradient)"
                />
                <Area
                  type="monotone"
                  dataKey="afterAqi"
                  name="Sesudah"
                  stroke={GREEN}
                  strokeWidth={2.5}
                  fill="url(#afterGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Radial breakdown */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <SectionHeader
            title="Efektivitas per Parameter"
            subtitle="Reduksi polutan saat ini"
          />
          <div className="px-6 pb-6">
            <div className="h-44 -mx-3">
              <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
                <RadialBarChart
                  innerRadius="40%"
                  outerRadius="95%"
                  data={[
                    { name: "N2O", value: effectivenessCo2, fill: GREEN_DARK },
                    { name: "PM2.5", value: effectivenessPm, fill: PINK },
                  ]}
                  startAngle={90}
                  endAngle={-270}
                >
                  <RadialBar background={{ fill: "#f8fafc" }} dataKey="value" cornerRadius={8} />
                </RadialBarChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2 mt-2">
              <RadialLegend color={PINK} label="PM2.5" value={effectivenessPm} />
              <RadialLegend color={GREEN_DARK} label="N2O" value={effectivenessCo2} />
            </div>
          </div>
        </div>
      </div>

      {/* Before vs After (compact) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <ComparisonCard
          label="SEBELUM FILTER"
          title="Udara Masuk"
          color={PINK}
          colorDark={PINK_DARK}
          bgLight={PINK_LIGHT}
          aqi={before.aqi}
          category={aqiCategory(before.aqi)}
          reading={before}
        />
        <ComparisonCard
          label="SESUDAH FILTER"
          title="Udara Keluar"
          color={GREEN}
          colorDark={GREEN_DARK}
          bgLight={GREEN_LIGHT}
          aqi={after.aqi}
          category={aqiCategory(after.aqi)}
          reading={after}
        />
      </div>

      {/* Parameter reduction bars */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
        <SectionHeader
          title="Reduksi Polutan"
          subtitle="Seberapa banyak filter mengurangi setiap parameter"
        />
        <div className="px-6 pb-6 space-y-4">
          <ReductionBar
            icon={<HiOutlineCube />}
            label="PM2.5"
            before={before.pm25}
            after={after.pm25}
            unit="μg/m³"
            percent={effectivenessPm}
          />
          <ReductionBar
            icon={<HiOutlineFire />}
            label="N2O"
            before={before.co2}
            after={after.co2}
            unit="ppm"
            percent={effectivenessCo2}
          />
        </div>
      </div>

      {/* Line chart: Before vs After */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
        <SectionHeader
          title="Perbandingan Garis: Sebelum vs Sesudah Filter"
          subtitle="Tren AQI sepanjang waktu — garis jelas untuk membaca selisih"
          action={
            <div className="flex items-center gap-4 text-xs">
              <LegendDot color={PINK_DARK} label="Sebelum Filter" />
              <LegendDot color={GREEN_DARK} label="Sesudah Filter" />
            </div>
          }
        />
        <div className="px-2 pb-4 h-72">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
            <LineChart data={historicalData} margin={{ top: 8, right: 16, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
              <XAxis
                dataKey="time"
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                minTickGap={28}
              />
              <YAxis
                stroke="#94a3b8"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: 12,
                  boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
                  fontSize: 12,
                }}
              />
              <Line
                type="monotone"
                dataKey="beforeAqi"
                name="Sebelum Filter"
                stroke={PINK_DARK}
                strokeWidth={2.5}
                dot={{ r: 3, fill: PINK_DARK, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="afterAqi"
                name="Sesudah Filter"
                stroke={GREEN_DARK}
                strokeWidth={2.5}
                dot={{ r: 3, fill: GREEN_DARK, strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent activity */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-6">
        <SectionHeader
          title="Aktivitas Terkini"
          subtitle="Peringatan & kejadian"
        />
        <div className="divide-y divide-gray-100">
          <ActivityRow
            icon={<HiOutlineCheckCircle />}
            color={GREEN_DARK}
            bg={GREEN_LIGHT}
            title="Filter beroperasi normal"
            description={`Efektivitas ${avgEffectiveness}%`}
            time={formatTime(lastUpdate)}
          />
          <ActivityRow
            icon={<HiOutlineExclamation />}
            color="#f59e0b"
            bg="#fef3c7"
            title="AQI di atas ambang batas"
            description={`Sebelum filter ${before.aqi} (${aqiCategory(before.aqi).label})`}
            time="—"
          />
          <ActivityRow
            icon={<HiOutlineLightningBolt />}
            color={GREEN_DARK}
            bg={GREEN_LIGHT}
            title="Reading tersimpan"
            description={`${history.length} titik histori sesi`}
            time="—"
          />
          <ActivityRow
            icon={<HiOutlineBell />}
            color={PINK_DARK}
            bg={PINK_LIGHT}
            title={connected ? "Perangkat terhubung" : "Menunggu koneksi"}
            description={connected ? "RTDB live" : "Belum ada data dari sensor"}
            time={formatTime(lastUpdate)}
          />
        </div>
      </div>

      {/* Environment mini cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <EnvCard
          label="Suhu Masuk"
          value={`${before.temperature}°C`}
          color={PINK}
          trend={envTrend.beforeTemp}
        />
        <EnvCard
          label="Suhu Keluar"
          value={`${after.temperature}°C`}
          color={GREEN}
          trend={envTrend.afterTemp}
        />
        <EnvCard
          label="Kelembaban Masuk"
          value={`${before.humidity}%`}
          color={PINK}
          trend={envTrend.beforeHumidity}
        />
        <EnvCard
          label="Kelembaban Keluar"
          value={`${after.humidity}%`}
          color={GREEN}
          trend={envTrend.afterHumidity}
        />
      </div>
    </div>
  );
}

/* ───────────── SUB COMPONENTS ───────────── */

function TabGroup({ value, onChange }: { value: Range; onChange: (v: Range) => void }) {
  const tabs: { k: Range; label: string }[] = [
    { k: "today", label: "Hari Ini" },
    { k: "week", label: "Minggu" },
    { k: "month", label: "Bulan" },
  ];
  return (
    <div className="inline-flex p-1 bg-white border border-gray-200 rounded-xl">
      {tabs.map((t) => (
        <button
          key={t.k}
          onClick={() => onChange(t.k)}
          className="px-3 py-1.5 text-xs font-medium rounded-lg transition"
          style={{
            background: value === t.k ? GRADIENT : "transparent",
            color: value === t.k ? "white" : "#6b7280",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

function SectionHeader({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 px-6 pt-5 pb-4">
      <div>
        <h3 className="font-semibold text-gray-900">{title}</h3>
        {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

function LegendDot({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      <span className="text-gray-500">{label}</span>
    </div>
  );
}

function KpiCard({
  icon,
  iconBg,
  label,
  value,
  change,
  positive,
  subtext,
  badge,
  sparklineData,
  sparklineColor,
  sparklineId,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: string;
  change?: number;
  positive?: boolean;
  subtext?: string;
  badge?: { label: string; color: string };
  sparklineData: { v: number }[];
  sparklineColor: string;
  sparklineId: string;
}) {
  const isUp = positive === undefined ? (change ?? 0) > 0 : positive;
  const displayChange = change !== undefined ? Math.abs(change).toFixed(1) : null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition">
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg shadow-sm"
          style={{ background: iconBg }}
        >
          {icon}
        </div>
        {badge && (
          <span
            className="text-[10px] font-semibold px-2 py-1 rounded-full text-white"
            style={{ background: badge.color }}
          >
            {badge.label}
          </span>
        )}
      </div>
      <div className="text-xs text-gray-500 mb-1">{label}</div>
      <div className="flex items-end justify-between gap-2">
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="w-16 h-8 -mb-1">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
            <AreaChart data={sparklineData}>
              <defs>
                <linearGradient id={sparklineId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={sparklineColor} stopOpacity={0.5} />
                  <stop offset="100%" stopColor={sparklineColor} stopOpacity={0} />
                </linearGradient>
              </defs>
              <Area
                type="monotone"
                dataKey="v"
                stroke={sparklineColor}
                strokeWidth={2}
                fill={`url(#${sparklineId})`}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
      {displayChange && (
        <div className="flex items-center gap-1 mt-2 text-xs">
          <span
            className="flex items-center gap-0.5 font-semibold"
            style={{ color: isUp ? GREEN_DARK : "#ef4444" }}
          >
            {isUp ? <HiOutlineArrowUp /> : <HiOutlineArrowDown />} {displayChange}%
          </span>
          <span className="text-gray-400">vs kemarin</span>
        </div>
      )}
      {subtext && !displayChange && (
        <div className="mt-2 text-xs text-gray-400">{subtext}</div>
      )}
    </div>
  );
}

function RadialLegend({ color, label, value }: { color: string; label: string; value: number }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <div className="flex items-center gap-2">
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
        <span className="text-gray-600">{label}</span>
      </div>
      <span className="font-semibold text-gray-900">{value}%</span>
    </div>
  );
}

function ComparisonCard({
  label,
  title,
  color,
  colorDark,
  bgLight,
  aqi,
  category,
  reading,
}: {
  label: string;
  title: string;
  color: string;
  colorDark: string;
  bgLight: string;
  aqi: number;
  category: { label: string; color: string };
  reading: SensorReading;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 relative overflow-hidden">
      <div
        className="absolute -top-16 -right-16 w-40 h-40 rounded-full opacity-50"
        style={{ background: bgLight }}
      />
      <div className="relative">
        <div className="flex items-center justify-between mb-3">
          <span
            className="text-[10px] font-bold px-2.5 py-1 rounded-full text-white tracking-wider"
            style={{ background: color }}
          >
            {label}
          </span>
          <span
            className="text-[10px] font-semibold px-2.5 py-1 rounded-full text-white"
            style={{ background: category.color }}
          >
            {category.label}
          </span>
        </div>
        <h3 className="text-sm text-gray-500 mb-1">{title}</h3>
        <div className="flex items-baseline gap-2 mb-4">
          <span className="text-4xl font-bold" style={{ color: colorDark }}>
            {aqi}
          </span>
          <span className="text-xs text-gray-400">AQI Index</span>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <MiniMetric label="PM2.5" value={reading.pm25} unit="μg/m³" color={colorDark} />
          <MiniMetric label="N2O" value={reading.co2} unit="ppm" color={colorDark} />
        </div>
      </div>
    </div>
  );
}

function MiniMetric({
  label,
  value,
  unit,
  color,
}: {
  label: string;
  value: number;
  unit: string;
  color: string;
}) {
  return (
    <div className="rounded-xl p-2.5 bg-gray-50">
      <div className="text-[10px] text-gray-500 uppercase tracking-wider">{label}</div>
      <div className="font-bold text-sm mt-0.5" style={{ color }}>
        {value}
      </div>
      <div className="text-[9px] text-gray-400">{unit}</div>
    </div>
  );
}

function ReductionBar({
  icon,
  label,
  before,
  after,
  unit,
  percent,
}: {
  icon: React.ReactNode;
  label: string;
  before: number;
  after: number;
  unit: string;
  percent: number;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-sm"
            style={{ background: GRADIENT }}
          >
            {icon}
          </div>
          <div>
            <div className="text-sm font-semibold text-gray-900">{label}</div>
            <div className="text-xs text-gray-500">
              {before} → {after} {unit}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold" style={{ color: GREEN_DARK }}>
            {percent}%
          </div>
          <div className="text-[10px] text-gray-400 uppercase tracking-wider">reduksi</div>
        </div>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${percent}%`, background: GRADIENT }}
        />
      </div>
    </div>
  );
}

function ActivityRow({
  icon,
  color,
  bg,
  title,
  description,
  time,
}: {
  icon: React.ReactNode;
  color: string;
  bg: string;
  title: string;
  description: string;
  time: string;
}) {
  return (
    <div className="flex items-start gap-3 px-6 py-3.5 hover:bg-gray-50 transition">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-base"
        style={{ background: bg, color }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium text-gray-900 truncate">{title}</div>
        <div className="text-xs text-gray-500 truncate">{description}</div>
      </div>
      <div className="text-[10px] text-gray-400 shrink-0 whitespace-nowrap">{time}</div>
    </div>
  );
}

function EnvCard({
  label,
  value,
  color,
  trend,
}: {
  label: string;
  value: string;
  color: string;
  trend: number[];
}) {
  const data = trend.map((v) => ({ v }));
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
      <div className="flex items-center justify-between mb-1">
        <span className="text-xs text-gray-500">{label}</span>
        <span className="w-2 h-2 rounded-full" style={{ background: color }} />
      </div>
      <div className="flex items-end justify-between">
        <div className="text-xl font-bold text-gray-900">{value}</div>
        <div className="w-14 h-8">
          <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={1}>
            <BarChart data={data}>
              <Bar dataKey="v" fill={color} radius={[2, 2, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

/* ───────────── RECORDER ───────────── */

interface RecorderRow {
  timestamp: string;
  elapsed_s: number;
  suhu_c: number;
  kelembaban_pct: number;
  mq135_adc: number;
  mq135_volt: number;
  after_pm25: number;
  after_n2o: number;
  after_aqi: number;
  before_pm25_est: number;
  before_n2o_est: number;
  before_aqi_est: number;
}

interface RecorderSession {
  rows: RecorderRow[];
  startedAt: Date;
  endedAt: Date;
}

interface RecorderState {
  recording: boolean;
  elapsed: number;
  rowCount: number;
  lastSession: RecorderSession | null;
  saving: boolean;
  saveStatus: "idle" | "saving" | "saved" | "error" | "anonymous";
  start: () => void;
  stop: () => void;
  download: () => void;
  clear: () => void;
}

function useRecorder({
  raw,
  before,
  after,
}: {
  raw: { mq135_adc: number; mq135_volt: number } | null;
  before: SensorReading;
  after: SensorReading;
}): RecorderState {
  const { user } = useAuth();
  const [recording, setRecording] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [rowCount, setRowCount] = useState(0);
  const [lastSession, setLastSession] = useState<RecorderSession | null>(null);
  const [saveStatus, setSaveStatus] = useState<RecorderState["saveStatus"]>("idle");

  const rowsRef = useRef<RecorderRow[]>([]);
  const startedAtRef = useRef<Date | null>(null);
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const latestRef = useRef({ raw, before, after });
  const userRef = useRef(user);
  useEffect(() => {
    latestRef.current = { raw, before, after };
  }, [raw, before, after]);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const stopInternal = async () => {
    if (tickRef.current) {
      clearInterval(tickRef.current);
      tickRef.current = null;
    }
    setRecording(false);

    const startedAt = startedAtRef.current;
    const rows = rowsRef.current;
    if (!startedAt || rows.length === 0) return;

    const endedAt = new Date();
    const session: RecorderSession = { rows, startedAt, endedAt };
    setLastSession(session);

    const u = userRef.current;
    if (!u) {
      setSaveStatus("anonymous");
      return;
    }

    setSaveStatus("saving");
    try {
      const durationSec = Math.round((endedAt.getTime() - startedAt.getTime()) / 1000);
      await addDoc(collection(db, "users", u.uid, "recordings"), {
        startedAt: Timestamp.fromDate(startedAt),
        endedAt: Timestamp.fromDate(endedAt),
        durationSec,
        rowCount: rows.length,
        rows,
        createdAt: serverTimestamp(),
      });
      setSaveStatus("saved");
    } catch (err) {
      console.error("Failed to save recording", err);
      setSaveStatus("error");
    }
  };

  useEffect(() => () => {
    if (tickRef.current) clearInterval(tickRef.current);
  }, []);

  const start = () => {
    rowsRef.current = [];
    startedAtRef.current = new Date();
    setElapsed(0);
    setRowCount(0);
    setLastSession(null);
    setSaveStatus("idle");
    setRecording(true);

    const sample = () => {
      const now = new Date();
      const startedAt = startedAtRef.current!;
      const elapsedSec = Math.round((now.getTime() - startedAt.getTime()) / 1000);
      const { raw: r, before: b, after: a } = latestRef.current;
      rowsRef.current.push({
        timestamp: now.toISOString(),
        elapsed_s: elapsedSec,
        suhu_c: a.temperature,
        kelembaban_pct: a.humidity,
        mq135_adc: r?.mq135_adc ?? 0,
        mq135_volt: r?.mq135_volt ?? 0,
        after_pm25: a.pm25,
        after_n2o: a.co2,
        after_aqi: a.aqi,
        before_pm25_est: b.pm25,
        before_n2o_est: b.co2,
        before_aqi_est: b.aqi,
      });
      setElapsed(elapsedSec);
      setRowCount(rowsRef.current.length);
    };
    sample();
    tickRef.current = setInterval(sample, 1000);
  };

  const stop = () => {
    void stopInternal();
  };

  const download = () => {
    const session = lastSession;
    if (!session || session.rows.length === 0) return;
    downloadRowsAsXlsx(session.rows, session.startedAt);
  };

  const clear = () => {
    rowsRef.current = [];
    setLastSession(null);
    setElapsed(0);
    setRowCount(0);
    setSaveStatus("idle");
  };

  return {
    recording,
    elapsed,
    rowCount,
    lastSession,
    saving: saveStatus === "saving",
    saveStatus,
    start,
    stop,
    download,
    clear,
  };
}

function downloadRowsAsXlsx(rows: RecorderRow[], startedAt: Date) {
  const sheet = XLSX.utils.json_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, sheet, "Recording");
  const ts = startedAt.toISOString().replace(/[:.]/g, "-").slice(0, 19);
  XLSX.writeFile(wb, `oxivera-recording-${ts}.xlsx`);
}

function RecordButton({ recorder, connected }: { recorder: RecorderState; connected: boolean }) {
  const { recording, elapsed, rowCount, start, stop } = recorder;
  const onClick = () => (recording ? stop() : start());
  const disabled = !connected && !recording;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="flex items-center gap-2 pl-3 pr-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm transition disabled:opacity-40 disabled:cursor-not-allowed"
      style={{
        background: recording
          ? "linear-gradient(90deg, #ef4444 0%, #b91c1c 100%)"
          : "linear-gradient(90deg, #ff94c0 0%, #afd373 100%)",
      }}
      title={recording ? "Hentikan perekaman" : connected ? "Mulai perekaman" : "Menunggu data realtime"}
    >
      {recording ? (
        <>
          <HiOutlineStop className="text-lg" />
          <span>Stop</span>
          <span className="text-[11px] font-mono bg-white/20 rounded px-1.5 py-0.5">
            {formatDuration(elapsed)} · {rowCount}
          </span>
        </>
      ) : (
        <>
          <HiOutlinePlayCircle className="text-lg" />
          <span>Record</span>
        </>
      )}
    </button>
  );
}

function RecordingSummary({
  session,
  onDownload,
  onClear,
  saveStatus,
}: {
  session: RecorderSession;
  onDownload: () => void;
  onClear: () => void;
  saveStatus: RecorderState["saveStatus"];
}) {
  const duration = Math.round((session.endedAt.getTime() - session.startedAt.getTime()) / 1000);
  const savePill = (() => {
    switch (saveStatus) {
      case "saving":
        return { text: "Menyimpan ke cloud...", bg: "#fef3c7", color: "#92400e" };
      case "saved":
        return { text: "✓ Tersimpan di Firestore", bg: "#d9ebb8", color: "#5a7a2e" };
      case "error":
        return { text: "✗ Gagal simpan ke cloud", bg: "#fee2e2", color: "#991b1b" };
      case "anonymous":
        return { text: "Login untuk menyimpan ke cloud", bg: "#e0e7ff", color: "#3730a3" };
      default:
        return null;
    }
  })();

  return (
    <div className="mb-6 flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl bg-white border border-gray-200 shadow-sm">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-lg"
        style={{ background: "linear-gradient(135deg, #afd373 0%, #8fb852 100%)" }}
      >
        <HiOutlineCheckCircle />
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-sm font-semibold text-gray-900 flex items-center gap-2 flex-wrap">
          Perekaman selesai
          {savePill && (
            <span
              className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
              style={{ background: savePill.bg, color: savePill.color }}
            >
              {savePill.text}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-500">
          {session.rows.length} sampel · {formatDuration(duration)} · {session.startedAt.toLocaleTimeString("id-ID")} → {session.endedAt.toLocaleTimeString("id-ID")}
        </div>
      </div>
      <button
        onClick={onDownload}
        className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold text-white shadow-sm hover:shadow transition"
        style={{ background: "linear-gradient(90deg, #ff94c0 0%, #afd373 100%)" }}
      >
        <HiOutlineDownload className="text-base" />
        Download Excel
      </button>
      <button
        onClick={onClear}
        className="px-3 py-2 rounded-xl text-sm font-medium text-gray-500 hover:bg-gray-50 border border-gray-200"
      >
        Hapus
      </button>
    </div>
  );
}

interface SavedRecording {
  id: string;
  startedAt: Date;
  endedAt: Date;
  durationSec: number;
  rowCount: number;
  rows?: RecorderRow[];
}

function RecordingHistoryButton({ onClick }: { onClick: () => void }) {
  const { user } = useAuth();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "recordings"),
      orderBy("startedAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => setCount(snap.size),
      () => setCount(null),
    );
    return unsub;
  }, [user]);

  return (
    <button
      onClick={onClick}
      className="relative flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-gray-900 text-sm font-medium transition"
      title="Riwayat rekaman tersimpan"
    >
      <HiOutlineDocumentText className="text-base" />
      <span className="hidden sm:inline">Riwayat</span>
      {count !== null && count > 0 && (
        <span
          className="min-w-[20px] h-5 px-1.5 rounded-full text-[10px] font-bold text-white flex items-center justify-center"
          style={{ background: "linear-gradient(90deg, #ff94c0 0%, #afd373 100%)" }}
        >
          {count}
        </span>
      )}
    </button>
  );
}

function RecordingHistoryModal({ onClose }: { onClose: () => void }) {
  const { user } = useAuth();
  const [sessions, setSessions] = useState<SavedRecording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "users", user.uid, "recordings"),
      orderBy("startedAt", "desc"),
    );
    const unsub = onSnapshot(
      q,
      (snap) => {
        const items: SavedRecording[] = snap.docs.map((d) => {
          const data = d.data();
          const startedAt = (data.startedAt as Timestamp)?.toDate?.() ?? new Date(0);
          const endedAt = (data.endedAt as Timestamp)?.toDate?.() ?? new Date(0);
          return {
            id: d.id,
            startedAt,
            endedAt,
            durationSec: Number(data.durationSec) || 0,
            rowCount: Number(data.rowCount) || 0,
            rows: (data.rows as RecorderRow[]) || [],
          };
        });
        setSessions(items);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError("Gagal memuat data. Periksa Firestore Rules.");
        setLoading(false);
      },
    );
    return unsub;
  }, [user]);

  async function handleDelete(id: string) {
    if (!user) return;
    if (!confirm("Hapus rekaman ini secara permanen?")) return;
    setBusy(id);
    try {
      await deleteDoc(doc(db, "users", user.uid, "recordings", id));
    } catch (e) {
      console.error(e);
      alert("Gagal menghapus rekaman.");
    } finally {
      setBusy(null);
    }
  }

  function handleDownload(s: SavedRecording) {
    if (!s.rows || s.rows.length === 0) {
      alert("Baris data tidak tersedia untuk rekaman ini.");
      return;
    }
    downloadRowsAsXlsx(s.rows, s.startedAt);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <h3 className="font-bold text-gray-900 flex items-center gap-2">
              <HiOutlineCloudUpload className="text-lg" style={{ color: "#8fb852" }} />
              Riwayat Rekaman
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Data perekaman tersimpan di Firestore
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-900"
          >
            <HiOutlineX className="text-lg" />
          </button>
        </div>

        <div className="flex-1 overflow-auto px-6 py-4">
          {!user && (
            <EmptyState text="Login untuk menyimpan dan melihat riwayat rekaman." />
          )}
          {user && loading && <EmptyState text="Memuat..." />}
          {user && !loading && error && <EmptyState text={error} error />}
          {user && !loading && !error && sessions.length === 0 && (
            <EmptyState text="Belum ada rekaman tersimpan. Mulai rekam dari dashboard." />
          )}
          {sessions.length > 0 && (
            <ul className="space-y-2">
              {sessions.map((s) => (
                <li
                  key={s.id}
                  className="flex flex-wrap items-center gap-3 px-3 py-3 rounded-xl border border-gray-100 hover:bg-gray-50 transition"
                >
                  <div
                    className="w-10 h-10 rounded-lg flex items-center justify-center text-white"
                    style={{ background: "linear-gradient(135deg, #ff94c0 0%, #afd373 100%)" }}
                  >
                    <HiOutlineDocumentText className="text-lg" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold text-gray-900">
                      {s.startedAt.toLocaleDateString("id-ID", {
                        weekday: "short",
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                    <div className="text-xs text-gray-500">
                      {s.startedAt.toLocaleTimeString("id-ID")} → {s.endedAt.toLocaleTimeString("id-ID")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 text-[11px]">
                    <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono">
                      {formatDuration(s.durationSec)}
                    </span>
                    <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 font-mono">
                      {s.rowCount} sampel
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleDownload(s)}
                      className="p-2 rounded-lg text-white shadow-sm"
                      style={{ background: "linear-gradient(90deg, #ff94c0 0%, #afd373 100%)" }}
                      title="Download Excel"
                    >
                      <HiOutlineDownload className="text-base" />
                    </button>
                    <button
                      onClick={() => handleDelete(s.id)}
                      disabled={busy === s.id}
                      className="p-2 rounded-lg text-red-500 hover:bg-red-50 disabled:opacity-40"
                      title="Hapus"
                    >
                      <HiOutlineTrash className="text-base" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-6 py-3 border-t border-gray-100 text-[11px] text-gray-400 flex items-center gap-1.5">
          <HiOutlineClock /> Urut terbaru · {sessions.length} rekaman
        </div>
      </div>
    </div>
  );
}

function EmptyState({ text, error }: { text: string; error?: boolean }) {
  return (
    <div
      className={`text-sm text-center py-10 ${error ? "text-red-600" : "text-gray-400"}`}
    >
      {text}
    </div>
  );
}

function formatDuration(seconds: number) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}
