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
  mockDevices,
  SensorReading,
  Device,
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
  devices: Device[];
  onlineDevices: number;
  history: HistoricalPoint[];
  raw: RawSensor | null;
  connected: boolean;
  snapshot: () => string;
  refresh: () => void;
}

const Ctx = createContext<SensorDataContextType | null>(null);

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
function makeBefore(after: SensorReading): SensorReading {
  const pm25 = Math.round(after.pm25 * 4.5 * 10) / 10;
  return {
    pm25,
    pm10: Math.round(pm25 * 1.4 * 10) / 10,
    co2: Math.round(after.co2 * 1.9),
    voc: Math.round(after.voc * 3.2),
    temperature: Math.round((after.temperature + 1.5) * 10) / 10,
    humidity: Math.min(100, Math.round(after.humidity + 6)),
    aqi: calcAqi(pm25),
    timestamp: after.timestamp,
  };
}

const HISTORY_CAP = 24 * 30;
const HISTORY_INTERVAL_MS = 60 * 1000;

export function SensorDataProvider({ children }: { children: ReactNode }) {
  const [raw, setRaw] = useState<RawSensor | null>(null);
  const [connected, setConnected] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());
  const [history, setHistory] = useState<HistoricalPoint[]>([]);
  const [devices] = useState<Device[]>(mockDevices);
  const lastAppendRef = useRef<number>(0);

  useEffect(() => {
    const sensorRef = ref(rtdb, "sensor");
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
    if (!raw) return;
    const now = Date.now();
    if (history.length > 0 && now - lastAppendRef.current < HISTORY_INTERVAL_MS) return;
    lastAppendRef.current = now;

    const after = makeAfter(raw);
    const before = makeBefore(after);
    const d = new Date(now);
    const point: HistoricalPoint = {
      time: d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      hour: d.getHours(),
      beforePm25: before.pm25,
      afterPm25: after.pm25,
      beforeAqi: before.aqi,
      afterAqi: after.aqi,
      beforeCo2: before.co2,
      afterCo2: after.co2,
    };
    setHistory((prev) => {
      const next = [...prev, point];
      return next.length > HISTORY_CAP ? next.slice(-HISTORY_CAP) : next;
    });
  }, [raw, history.length]);

  const after = useMemo<SensorReading>(
    () => (raw ? makeAfter(raw) : emptyReading()),
    [raw],
  );
  const before = useMemo<SensorReading>(() => makeBefore(after), [after]);

  const effectiveness = useMemo<Effectiveness>(() => {
    const pm25 = effectivenessPercent(before.pm25, after.pm25);
    const co2 = effectivenessPercent(before.co2, after.co2);
    const voc = effectivenessPercent(before.voc, after.voc);
    return { pm25, co2, voc, avg: Math.round((pm25 + co2 + voc) / 3) };
  }, [before, after]);

  const onlineDevices = useMemo(
    () => devices.filter((d) => d.status === "online").length,
    [devices],
  );

  const snapshot = (): string => {
    const beforeCat = aqiCategory(before.aqi);
    const afterCat = aqiCategory(after.aqi);
    const deviceLines = devices
      .map(
        (d) =>
          `  - ${d.name} (${d.location}): ${d.status === "online" ? "Online" : "Offline"}, AQI terakhir ${d.after.aqi}`,
      )
      .join("\n");

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
• MQ-135 ADC: ${raw?.mq135_adc ?? "-"} (${raw?.mq135_volt ?? "-"} V)
• Perangkat: ${onlineDevices}/${devices.length} online
${deviceLines}`;
  };

  const refresh = () => setLastUpdate(new Date());

  const value: SensorDataContextType = {
    before,
    after,
    effectiveness,
    lastUpdate,
    devices,
    onlineDevices,
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
