"use client";

import { useMemo, useState } from "react";
import {
  effectivenessPercent,
  aqiCategory,
  SensorReading,
  Device,
} from "@/lib/mockData";
import { useSensorData } from "@/context/SensorDataContext";
import {
  HiOutlineCheckCircle,
  HiOutlineArrowUp,
  HiOutlineArrowDown,
  HiOutlineSparkles,
  HiOutlineCube,
  HiOutlineFire,
  HiOutlineBeaker,
  HiOutlineRefresh,
  HiOutlineDotsHorizontal,
  HiOutlineStatusOnline,
  HiOutlineLocationMarker,
  HiOutlineClock,
  HiOutlineExclamation,
  HiOutlineLightningBolt,
  HiOutlineBell,
} from "react-icons/hi";
import {
  AreaChart,
  Area,
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
    devices,
    onlineDevices,
    history,
    connected,
    refresh,
  } = useSensorData();
  const [range, setRange] = useState<Range>("today");

  const historicalData = useMemo(() => {
    const hours = range === "today" ? 24 : range === "week" ? 24 * 7 : 24 * 30;
    const slice = history.slice(-hours);
    if (range === "today") return slice;
    if (range === "week") return slice.filter((_, i) => i % 6 === 0);
    return slice.filter((_, i) => i % 24 === 0);
  }, [range, history]);

  const effectivenessPm = effectiveness.pm25;
  const effectivenessCo2 = effectiveness.co2;
  const effectivenessVoc = effectiveness.voc;
  const avgEffectiveness = effectiveness.avg;

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
        </div>

        <div className="flex items-center gap-2">
          <TabGroup value={range} onChange={setRange} />
          <button
            className="p-2.5 rounded-xl bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition"
            onClick={refresh}
            title="Refresh"
          >
            <HiOutlineRefresh className="text-lg" />
          </button>
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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
          icon={<HiOutlineStatusOnline />}
          iconBg={`linear-gradient(135deg, ${PINK} 0%, ${PINK_DARK} 100%)`}
          label="Perangkat Online"
          value={`${onlineDevices}/${devices.length}`}
          subtext={`${onlineDevices} aktif`}
          sparklineData={devices.map((d, i) => ({
            v: d.status === "online" ? 100 : 20 + i * 5,
          }))}
          sparklineColor={PINK_DARK}
          sparklineId="spark-devices"
        />
        <KpiCard
          icon={<HiOutlineCube />}
          iconBg="linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
          label="Reading Hari Ini"
          value="1,248"
          change={+12.5}
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
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
              <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <RadialBarChart
                  innerRadius="40%"
                  outerRadius="95%"
                  data={[
                    { name: "VOC", value: effectivenessVoc, fill: PINK_DARK },
                    { name: "CO2", value: effectivenessCo2, fill: GREEN_DARK },
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
              <RadialLegend color={GREEN_DARK} label="CO2" value={effectivenessCo2} />
              <RadialLegend color={PINK_DARK} label="VOC" value={effectivenessVoc} />
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
            label="CO2"
            before={before.co2}
            after={after.co2}
            unit="ppm"
            percent={effectivenessCo2}
          />
          <ReductionBar
            icon={<HiOutlineBeaker />}
            label="VOC"
            before={before.voc}
            after={after.voc}
            unit="ppb"
            percent={effectivenessVoc}
          />
        </div>
      </div>

      {/* Device list + Recent activity */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-6">
        <div className="lg:col-span-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <SectionHeader
            title="Perangkat"
            subtitle={`${onlineDevices} dari ${devices.length} perangkat online`}
            action={
              <button className="text-xs font-medium text-gray-500 hover:text-gray-900 flex items-center gap-1">
                Lihat Semua <HiOutlineDotsHorizontal />
              </button>
            }
          />
          <div className="divide-y divide-gray-100">
            {devices.map((d) => (
              <DeviceRow key={d.id} device={d} />
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm">
          <SectionHeader
            title="Aktivitas Terkini"
            subtitle="Peringatan & kejadian"
            action={
              <button className="text-xs font-medium text-gray-500 hover:text-gray-900">
                Lihat Semua
              </button>
            }
          />
          <div className="divide-y divide-gray-100">
            <ActivityRow
              icon={<HiOutlineCheckCircle />}
              color={GREEN_DARK}
              bg={GREEN_LIGHT}
              title="Filter beroperasi normal"
              description="Unit #1 — efektivitas 89%"
              time="2 menit lalu"
            />
            <ActivityRow
              icon={<HiOutlineExclamation />}
              color="#f59e0b"
              bg="#fef3c7"
              title="AQI di atas ambang batas"
              description="Sebelum filter 178 (buruk)"
              time="18 menit lalu"
            />
            <ActivityRow
              icon={<HiOutlineBell />}
              color={PINK_DARK}
              bg={PINK_LIGHT}
              title="Filter perlu diperiksa"
              description="Unit #3 — offline 45 menit"
              time="45 menit lalu"
            />
            <ActivityRow
              icon={<HiOutlineLightningBolt />}
              color={GREEN_DARK}
              bg={GREEN_LIGHT}
              title="Reading tersimpan"
              description="1,248 data hari ini"
              time="1 jam lalu"
            />
          </div>
        </div>
      </div>

      {/* Environment mini cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <EnvCard
          label="Suhu Masuk"
          value={`${before.temperature}°C`}
          color={PINK}
          trend={[22, 24, 23, 25, 26, 25, 27, before.temperature]}
        />
        <EnvCard
          label="Suhu Keluar"
          value={`${after.temperature}°C`}
          color={GREEN}
          trend={[23, 24, 24, 25, 25, 26, 26, after.temperature]}
        />
        <EnvCard
          label="Kelembaban Masuk"
          value={`${before.humidity}%`}
          color={PINK}
          trend={[60, 62, 65, 63, 68, 70, 68, before.humidity]}
        />
        <EnvCard
          label="Kelembaban Keluar"
          value={`${after.humidity}%`}
          color={GREEN}
          trend={[55, 58, 60, 62, 64, 65, 63, after.humidity]}
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
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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

        <div className="grid grid-cols-3 gap-2">
          <MiniMetric label="PM2.5" value={reading.pm25} unit="μg/m³" color={colorDark} />
          <MiniMetric label="CO2" value={reading.co2} unit="ppm" color={colorDark} />
          <MiniMetric label="VOC" value={reading.voc} unit="ppb" color={colorDark} />
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

function DeviceRow({ device }: { device: Device }) {
  const online = device.status === "online";
  const cat = aqiCategory(device.after.aqi);
  return (
    <div className="flex items-center gap-3 px-6 py-4 hover:bg-gray-50 transition">
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
        style={{
          background: online ? GREEN_LIGHT : "#f3f4f6",
          color: online ? GREEN_DARK : "#9ca3af",
        }}
      >
        <HiOutlineCube />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-900 truncate">{device.name}</span>
          <span
            className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full"
            style={{
              background: online ? GREEN_LIGHT : "#fee2e2",
              color: online ? GREEN_DARK : "#dc2626",
            }}
          >
            {online ? "Online" : "Offline"}
          </span>
        </div>
        <div className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
          <HiOutlineLocationMarker className="text-xs" />
          {device.location}
        </div>
      </div>
      <div className="text-right shrink-0">
        <div className="text-sm font-bold" style={{ color: online ? GREEN_DARK : "#9ca3af" }}>
          {device.after.aqi}
        </div>
        <div className="text-[10px]" style={{ color: cat.color }}>
          {online ? cat.label : "—"}
        </div>
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
          <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
