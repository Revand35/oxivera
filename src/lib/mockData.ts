// Tipe dan helper murni untuk data sensor. Tidak ada lagi pembangkit data
// dummy di sini — semua pembacaan datang dari Realtime Database via
// SensorDataContext.

export interface SensorReading {
  pm25: number;
  pm10: number;
  co2: number;
  voc: number;
  temperature: number;
  humidity: number;
  aqi: number;
  timestamp: Date;
}

export function effectivenessPercent(before: number, after: number): number {
  if (before === 0) return 0;
  return Math.max(0, Math.round(((before - after) / before) * 100));
}

export function aqiCategory(aqi: number): { label: string; color: string } {
  if (aqi <= 50) return { label: "Baik", color: "#afd373" };
  if (aqi <= 100) return { label: "Sedang", color: "#fbbf24" };
  if (aqi <= 150) return { label: "Tidak Sehat", color: "#fb923c" };
  if (aqi <= 200) return { label: "Buruk", color: "#ef4444" };
  return { label: "Berbahaya", color: "#991b1b" };
}
