# Oxivera — Project Plan

## Deskripsi

**Oxivera** adalah sistem filter udara berbasis IoT yang memonitoring kualitas udara secara real-time. Fitur utamanya adalah membandingkan kualitas udara **sebelum** dan **sesudah** di-filter untuk membuktikan bahwa alat benar-benar berfungsi.

---

## Color Palette

| Warna            | Hex       | Penggunaan                                           |
| ---------------- | --------- | ---------------------------------------------------- |
| **Pink**         | `#ff94c0` | Primary — indikator **SEBELUM filter** (udara masuk) |
| **Pink Dark**    | `#ff6ba5` | Hover/emphasis pink                                  |
| **Pink Light**   | `#ffd4e5` | Background lembut, badge pink                        |
| **Green**        | `#afd373` | Secondary — indikator **SESUDAH filter** (udara bersih) |
| **Green Dark**   | `#8fb852` | Hover/emphasis green                                 |
| **Green Light**  | `#d9ebb8` | Background lembut, badge green                       |

> **Logika warna:** Pink = "kotor/input", Green = "bersih/output". Gradient pink→green merepresentasikan proses filtrasi udara.

---

## Tech Stack

| Layer         | Teknologi                                  |
| ------------- | ------------------------------------------ |
| **Frontend**  | React / Next.js + Tailwind CSS + Recharts  |
| **Auth**      | Firebase Authentication                    |
| **Database**  | Cloud Firestore (realtime)                 |
| **Storage**   | Firebase Storage (laporan/foto)            |
| **Hosting**   | Firebase Hosting atau Vercel               |
| **IoT**       | ESP32 → HTTP ke Firebase REST API          |
| **Hardware**  | ESP32 + Sensor MQ-135 / PMS5003 / BME680  |

---

## Sensor Data yang Dikumpulkan

Setiap sensor memiliki **2 titik pengukuran**: sebelum masuk filter dan sesudah keluar filter.

- **PM2.5 / PM10** — Partikel halus
- **CO2** — Karbon dioksida
- **VOC** — Senyawa organik volatil
- **Temperature** — Suhu
- **Humidity** — Kelembaban
- **AQI Score** — Indeks kualitas udara (dihitung dari data di atas)

---

## Halaman Web (8 Halaman)

### Public Pages

| #   | Halaman      | Deskripsi                                                    |
| --- | ------------ | ------------------------------------------------------------ |
| 1   | **Login**    | Email/password + opsi Google Sign-in via Firebase Auth       |
| 2   | **Register** | Daftar akun baru dengan verifikasi email                     |

### Protected Pages (Butuh Login)

| #   | Halaman            | Deskripsi                                                                                                          |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------ |
| 3   | **Dashboard**      | Tampilan utama — gauge/card real-time AQI sebelum & sesudah filter, persentase efektivitas, status perangkat       |
| 4   | **Analytics**      | Grafik historis (harian/mingguan/bulanan), perbandingan before vs after, tren kualitas udara                       |

| 5   | **Alerts**         | Notifikasi ketika kualitas udara buruk, filter perlu diganti, atau sensor offline                                  |
| 6   | **Reports**        | Generate laporan efektivitas filter (PDF/export), dokumentasi kinerja alat                                         |
| 7   | **Account/Profile**| Edit profil, ganti password                                                                                        |
| 8   | **Settings**       | Konfigurasi threshold alert, preferensi notifikasi                                                                 |

> **Catatan:** Tidak ada halaman Devices terpisah. Data perangkat otomatis muncul di Dashboard begitu alat IoT terhubung dan mengirim data ke Firestore.

---

## Fitur

### Fitur Utama

1. **Real-time Monitoring** — Data sensor ditampilkan live menggunakan Firestore realtime listener
2. **Before vs After Comparison** — Visualisasi side-by-side kualitas udara sebelum dan sesudah filter
3. **Filter Effectiveness Score** — Persentase efektivitas filter (misal: "Filter mengurangi polutan 87%")
4. **Historical Data** — Simpan dan tampilkan data historis dengan grafik interaktif

### Fitur Tambahan

5. **Alert System** — Notifikasi jika AQI melewati batas bahaya, filter perlu diganti, atau sensor disconnect
6. **Filter Health Indicator** — Estimasi umur filter berdasarkan penurunan performa dari waktu ke waktu
7. **Multi-location Support** — Satu dashboard bisa monitoring beberapa lokasi/ruangan
8. **Data Export** — Download data CSV/PDF untuk kebutuhan laporan atau riset
9. **Authentication** — Login, register, Google Sign-in, verifikasi email via Firebase Auth

---

## Struktur Firestore

```
users/
  └── {userId}
        ├── email
        ├── displayName
        ├── createdAt
        └── devices: ["device_001"]

devices/
  └── {deviceId}
        ├── name
        ├── location
        ├── ownerId
        ├── status: "online" | "offline"
        ├── createdAt
        └── lastReading: { pm25, co2, voc, temp, humidity, aqi, timestamp }

readings/
  └── {deviceId_timestamp}
        ├── deviceId
        ├── timestamp
        ├── position: "before" | "after"
        ├── pm25
        ├── pm10
        ├── co2
        ├── voc
        ├── temperature
        └── humidity

alerts/
  └── {alertId}
        ├── deviceId
        ├── userId
        ├── type: "air_quality" | "filter_replace" | "device_offline"
        ├── message
        ├── timestamp
        └── isRead: true | false
```

> **Tips:** `lastReading` disimpan langsung di document `devices/` supaya Dashboard tidak perlu query seluruh collection `readings/` — menghemat Firestore read cost.

---

## Phase Development

### Phase 1 — Auth + Dashboard

- Setup project (Next.js + Tailwind + Firebase)
- Halaman Login & Register (Firebase Auth)
- Halaman Dashboard dengan data real-time
- Perbandingan before vs after (gauge/card)
- Filter effectiveness score

### Phase 2 — Analytics + Devices

- Halaman Analytics dengan grafik historis (Recharts)
- Halaman Devices (daftar & status perangkat)
- Trend kualitas udara harian/mingguan/bulanan

### Phase 3 — Alerts + Filter Health

- Halaman Alerts (notifikasi & riwayat alert)
- Alert system (threshold-based)
- Filter health indicator

### Phase 4 — Reports + Polish

- Halaman Reports (generate & export PDF/CSV)
- Halaman Account/Profile
- Halaman Settings
- Multi-location support
- UI/UX polish & responsive design
