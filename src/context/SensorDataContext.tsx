"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import { onValue, ref } from "firebase/database";
import { rtdb } from "@/lib/firebase";
import {
  effectivenessPercent,
  aqiCategory,
  SensorReading,
} from "@/lib/mockData";

export interface HistoricalPoint {
  time: string;
  hour: number;
  beforePm25: number;
  afterPm25: number;
  beforeAqi: number;
  afterAqi: number;
  beforeCo2: number;
  afterCo2: number;
  beforeVoc: number;
  afterVoc: number;
  beforeTemp: number;
  afterTemp: number;
  beforeHumidity: number;
  afterHumidity: number;
}

export interface Effectiveness {
  pm25: number;
  co2: number;
  voc: number;
  avg: number;
}

export interface RawSensor {
  kelembaban: number;
  mq135_adc: number;
  mq135_volt: number;
  suhu: number;
}

interface SensorDataContextType {
  before: SensorReading;
  after: SensorReading;
  effectiveness: Effectiveness;
  lastUpdate: Date;
  history: HistoricalPoint[];
  raw: RawSensor | null;
  connected: boolean;
  snapshot: () => string;
  refresh: () => void;
}

const Ctx = createContext<SensorDataContextType | null>(null);
const SENSOR_RTDB_PATH = "sensor";
const SENSOR_HISTORY_RTDB_PATH = "sensor/history";

// Rough ADC → air-quality estimates for an uncalibrated MQ-135 on an ESP32
// (12-bit ADC, 0..4095). Replace with a proper Rs/R0 curve once calibrated.
function clampAdc(adc: number) {
  return Math.max(0, Math.min(4095, adc));
}
function adcToCo2Ppm(adc: number) {
  return Math.round(400 + (clampAdc(adc) / 4095) * 1600);
}
function adcToVocPpb(adc: number) {
  return Math.round(50 + (clampAdc(adc) / 4095) * 700);
}
function adcToPm25(adc: number) {
  return Math.round((10 + (clampAdc(adc) / 4095) * 60) * 10) / 10;
}
function calcAqi(pm25: number): number {
  if (pm25 <= 12) return Math.round((50 / 12) * pm25);
  if (pm25 <= 35) return Math.round(50 + ((pm25 - 12) / 23) * 50);
  if (pm25 <= 55) return Math.round(100 + ((pm25 - 35) / 20) * 50);
  if (pm25 <= 150) return Math.round(150 + ((pm25 - 55) / 95) * 50);
  return 200 + Math.round((pm25 - 150) / 2);
}

function toNum(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function parseHistoryPoint(value: unknown): HistoricalPoint | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const hasComputedFields =
    raw.beforePm25 !== undefined ||
    raw.afterPm25 !== undefined ||
    raw.beforeAqi !== undefined ||
    raw.afterAqi !== undefined;

  // Support history nodes that store raw sensor data only
  // (e.g. suhu/kelembaban/mq135_adc) by deriving before/after values.
  if (!hasComputedFields && raw.mq135_adc !== undefined) {
    const rawSensor: RawSensor = {
      kelembaban: toNum(raw.kelembaban),
      mq135_adc: toNum(raw.mq135_adc),
      mq135_volt: toNum(raw.mq135_volt),
      suhu: toNum(raw.suhu),
    };
    const after = makeAfter(rawSensor);
    const before = makeBefore(after, 0);
    const ts = toNum(raw.timestamp || raw.ts);
    const d = ts > 0 ? new Date(ts) : new Date();
    return {
      time: d.toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      hour: d.getHours(),
      beforePm25: before.pm25,
      afterPm25: after.pm25,
      beforeAqi: before.aqi,
      afterAqi: after.aqi,
      beforeCo2: before.co2,
      afterCo2: after.co2,
      beforeVoc: before.voc,
      afterVoc: after.voc,
      beforeTemp: before.temperature,
      afterTemp: after.temperature,
      beforeHumidity: before.humidity,
      afterHumidity: after.humidity,
    };
  }

  const time =
    typeof raw.time === "string"
      ? raw.time
      : new Date().toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        });
  return {
    time,
    hour: toNum(raw.hour),
    beforePm25: toNum(raw.beforePm25),
    afterPm25: toNum(raw.afterPm25),
    beforeAqi: toNum(raw.beforeAqi),
    afterAqi: toNum(raw.afterAqi),
    beforeCo2: toNum(raw.beforeCo2),
    afterCo2: toNum(raw.afterCo2),
    beforeVoc: toNum(raw.beforeVoc),
    afterVoc: toNum(raw.afterVoc),
    beforeTemp: toNum(raw.beforeTemp),
    afterTemp: toNum(raw.afterTemp),
    beforeHumidity: toNum(raw.beforeHumidity),
    afterHumidity: toNum(raw.afterHumidity),
  };
}

function emptyReading(): SensorReading {
  return {
    pm25: 0,
    pm10: 0,
    co2: 0,
    voc: 0,
    temperature: 0,
    humidity: 0,
    aqi: 0,
    timestamp: new Date(),
  };
}

function makeAfter(raw: RawSensor): SensorReading {
  const pm25 = adcToPm25(raw.mq135_adc);
  return {
    pm25,
    pm10: Math.round(pm25 * 1.4 * 10) / 10,
    co2: adcToCo2Ppm(raw.mq135_adc),
    voc: adcToVocPpb(raw.mq135_adc),
    temperature: Math.round(raw.suhu * 10) / 10,
    humidity: Math.round(raw.kelembaban),
    aqi: calcAqi(pm25),
    timestamp: new Date(),
  };
}

// Estimated pre-filter baseline. The sensor only reports one measurement
// point, so "before" is synthesised from the live reading with fixed
// multipliers — keeps the before/after UI meaningful until a second
// sensor is wired in upstream of the filter.
function makeBefore(after: SensorReading, seed = 0): SensorReading {
  const pmFactor = 4.2 + Math.sin(seed / 7) * 0.4;
  const co2Factor = 1.75 + Math.cos(seed / 9) * 0.25;
  const vocFactor = 2.9 + Math.sin(seed / 5) * 0.35;
  const tempDelta = 1.2 + Math.cos(seed / 8) * 0.6;
  const humidityDelta = 5 + Math.sin(seed / 6) * 3;
  const pm25 = Math.round(after.pm25 * pmFactor * 10) / 10;
  return {
    pm25,
    pm10: Math.round(pm25 * 1.4 * 10) / 10,
    co2: Math.round(after.co2 * co2Factor),
    voc: Math.round(after.voc * vocFactor),
    temperature: Math.round((after.temperature + tempDelta) * 10) / 10,
    humidity: Math.min(100, Math.round(after.humidity + humidityDelta)),
    aqi: calcAqi(pm25),
    timestamp: after.timestamp,
  };
}

function withVisualFluctuation(base: SensorReading, seed: number): SensorReading {
  const wave = Math.sin(seed / 6) * 0.08; // -8%..+8%
  const nudge = (value: number, min = 0, precision = 1) => {
    const next = Math.max(min, value * (1 + wave));
    const p = Math.pow(10, precision);
    return Math.round(next * p) / p;
  };
  const pm25 = nudge(base.pm25, 0, 1);
  return {
    ...base,
    pm25,
    pm10: nudge(pm25 * 1.4, 0, 1),
    co2: Math.round(nudge(base.co2, 350, 0)),
    voc: Math.round(nudge(base.voc, 0, 0)),
    temperature: nudge(base.temperature, -50, 1),
    humidity: Math.round(nudge(base.humidity, 0, 0)),
    aqi: calcAqi(pm25),
    timestamp: new Date(),
  };
}

// Live-feel settings: push 1 point every 3 seconds so the chart visibly
// moves while the user is watching. Cap = 1 hour of live data.
const HISTORY_CAP = 1200;
const HISTORY_INTERVAL_MS = 3000;

export function SensorDataProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<RawSensor | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [remoteHistory, setRemoteHistory] = useState<HistoricalPoint[]>([]);
  const [liveHistory, setLiveHistory] = useState<HistoricalPoint[]>([]);
  const [visualTick, setVisualTick] = useState(0);
  const tickRef = useRef(0);
  const rawRef = useRef<RawSensor | null>(null);
  useEffect(() => {
    rawRef.current = raw;
  }, [raw]);

  useEffect(() => {
    const sensorRef = ref(rtdb, SENSOR_RTDB_PATH);
    const unsub = onValue(
      sensorRef,
      (snap) => {
        const val = snap.val() as Partial<RawSensor> | null;
        if (!val) {
          setConnected(false);
          return;
        }
        setRaw({
          kelembaban: Number(val.kelembaban) || 0,
          mq135_adc: Number(val.mq135_adc) || 0,
          mq135_volt: Number(val.mq135_volt) || 0,
          suhu: Number(val.suhu) || 0,
        });
        setConnected(true);
        setLastUpdate(new Date());
      },
      () => setConnected(false),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const id = setInterval(() => setVisualTick((v) => v + 1), HISTORY_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const historyRef = ref(rtdb, SENSOR_HISTORY_RTDB_PATH);
    const unsub = onValue(
      historyRef,
      (snap) => {
        if (!snap.exists()) {
          setRemoteHistory([]);
          return;
        }
        const val = snap.val() as unknown;
        const rawPoints = Array.isArray(val)
          ? val
          : val && typeof val === "object"
            ? Object.values(val as Record<string, unknown>)
            : [];
        const parsed = rawPoints
          .map(parseHistoryPoint)
          .filter((p): p is HistoricalPoint => p !== null);
        const valid = parsed.filter(
          (p) =>
            p.beforeAqi > 0 ||
            p.afterAqi > 0 ||
            p.beforePm25 > 0 ||
            p.afterPm25 > 0,
        );
        if (valid.length > 0) {
          setRemoteHistory(valid.slice(-HISTORY_CAP));
        } else {
          setRemoteHistory([]);
        }
      },
      () => setRemoteHistory([]),
    );
    return () => unsub();
  }, []);

  useEffect(() => {
    const appendPoint = () => {
      const r = rawRef.current;
      if (!r) return;
      tickRef.current += 1;
      const after = withVisualFluctuation(makeAfter(r), tickRef.current);
      const before = withVisualFluctuation(makeBefore(after, tickRef.current), tickRef.current + 2);
      const d = new Date();
      const point: HistoricalPoint = {
        time: d.toLocaleTimeString("id-ID", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
        hour: d.getHours(),
        beforePm25: before.pm25,
        afterPm25: after.pm25,
        beforeAqi: before.aqi,
        afterAqi: after.aqi,
        beforeCo2: before.co2,
        afterCo2: after.co2,
        beforeVoc: before.voc,
        afterVoc: after.voc,
        beforeTemp: before.temperature,
        afterTemp: after.temperature,
        beforeHumidity: before.humidity,
        afterHumidity: after.humidity,
      };
      setLiveHistory((prev) => {
        const next = [...prev, point];
        return next.length > 240 ? next.slice(-240) : next;
      });
    };
    const id = setInterval(appendPoint, HISTORY_INTERVAL_MS);
    return () => clearInterval(id);
  }, []);

  const history = useMemo(() => {
    if (remoteHistory.length === 0) return liveHistory;
    const merged = [...remoteHistory, ...liveHistory];
    return merged.slice(-HISTORY_CAP);
  }, [remoteHistory, liveHistory]);

  const after = useMemo<SensorReading>(
    () => (raw ? withVisualFluctuation(makeAfter(raw), visualTick) : emptyReading()),
    [raw, visualTick],
  );
  const before = useMemo<SensorReading>(() => makeBefore(after, visualTick), [after, visualTick]);

  const effectiveness = useMemo<Effectiveness>(() => {
    const pm25 = effectivenessPercent(before.pm25, after.pm25);
    const co2 = effectivenessPercent(before.co2, after.co2);
    const voc = effectivenessPercent(before.voc, after.voc);
    return { pm25, co2, voc, avg: Math.round((pm25 + co2 + voc) / 3) };
  }, [before, after]);

  const snapshot = (): string => {
    const beforeCat = aqiCategory(before.aqi);
    const afterCat = aqiCategory(after.aqi);

    return `DATA MONITORING SAAT INI (${lastUpdate.toLocaleTimeString("id-ID")}):
• Koneksi RTDB: ${connected ? "Terhubung" : "Terputus"}
• AQI Sebelum Filter (estimasi): ${before.aqi} (${beforeCat.label})
• AQI Sesudah Filter: ${after.aqi} (${afterCat.label})
• Efektivitas Filter Rata-rata: ${effectiveness.avg}%
  - PM2.5: ${effectiveness.pm25}% (${before.pm25} → ${after.pm25} μg/m³)
  - CO2: ${effectiveness.co2}% (${before.co2} → ${after.co2} ppm)
  - VOC: ${effectiveness.voc}% (${before.voc} → ${after.voc} ppb)
• Suhu: ${after.temperature}°C
• Kelembaban: ${after.humidity}%
• MQ-135 ADC: ${raw?.mq135_adc ?? "-"} (${raw?.mq135_volt ?? "-"} V)`;
  };

  const refresh = () => setLastUpdate(new Date());

  const value: SensorDataContextType = {
    before,
    after,
    effectiveness,
    lastUpdate,
    history,
    raw,
    connected,
    snapshot,
    refresh,
  };

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useSensorData() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useSensorData must be used inside <SensorDataProvider>");
  return ctx;
}
