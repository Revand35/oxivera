// Mock data untuk development — akan diganti dengan data realtime dari Firestore/IoT

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

export interface Device {
  id: string;
  name: string;
  location: string;
  status: "online" | "offline";
  lastSeen: Date;
  before: SensorReading;
  after: SensorReading;
}

function calcAqi(pm25: number): number {
  if (pm25 <= 12) return Math.round((50 / 12) * pm25);
  if (pm25 <= 35) return Math.round(50 + ((pm25 - 12) / 23) * 50);
  if (pm25 <= 55) return Math.round(100 + ((pm25 - 35) / 20) * 50);
  if (pm25 <= 150) return Math.round(150 + ((pm25 - 55) / 95) * 50);
  return 200 + Math.round((pm25 - 150) / 2);
}

export function generateReading(polluted = true): SensorReading {
  const pm25 = polluted
    ? 80 + Math.random() * 40
    : 8 + Math.random() * 10;
  const pm10 = pm25 * (1.3 + Math.random() * 0.3);
  return {
    pm25: Math.round(pm25 * 10) / 10,
    pm10: Math.round(pm10 * 10) / 10,
    co2: Math.round(polluted ? 800 + Math.random() * 400 : 420 + Math.random() * 100),
    voc: Math.round(polluted ? 400 + Math.random() * 300 : 80 + Math.random() * 60),
    temperature: Math.round((26 + Math.random() * 3) * 10) / 10,
    humidity: Math.round(55 + Math.random() * 15),
    aqi: calcAqi(pm25),
    timestamp: new Date(),
  };
}

export const mockDevices: Device[] = [
  {
    id: "device-001",
    name: "Oxivera Unit #1",
    location: "Ruang Tamu",
    status: "online",
    lastSeen: new Date(),
    before: generateReading(true),
    after: generateReading(false),
  },
  {
    id: "device-002",
    name: "Oxivera Unit #2",
    location: "Kamar Tidur",
    status: "online",
    lastSeen: new Date(),
    before: generateReading(true),
    after: generateReading(false),
  },
  {
    id: "device-003",
    name: "Oxivera Unit #3",
    location: "Ruang Kerja",
    status: "offline",
    lastSeen: new Date(Date.now() - 1000 * 60 * 45),
    before: generateReading(true),
    after: generateReading(false),
  },
];

export function generateHistoricalData(hours = 24) {
  const data = [];
  const now = Date.now();
  for (let i = hours; i >= 0; i--) {
    const timestamp = new Date(now - i * 3600 * 1000);
    const before = generateReading(true);
    const after = generateReading(false);
    data.push({
      time: timestamp.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }),
      hour: timestamp.getHours(),
      beforePm25: before.pm25,
      afterPm25: after.pm25,
      beforeAqi: before.aqi,
      afterAqi: after.aqi,
      beforeCo2: before.co2,
      afterCo2: after.co2,
    });
  }
  return data;
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
