# Panduan Setup Firebase untuk Oxivera

## Langkah 1 — Buat Project Firebase

1. Buka [Firebase Console](https://console.firebase.google.com/)
2. Klik **"Create a project"** (atau "Add project")
3. Masukkan nama project: **Oxivera**
4. Google Analytics boleh diaktifkan atau tidak (opsional)
5. Klik **"Create project"** dan tunggu sampai selesai

---

## Langkah 2 — Tambahkan Web App

1. Di halaman overview project, klik ikon **Web** (`</>`)
2. Masukkan nama app: **oxivera-web**
3. Centang **"Also set up Firebase Hosting"** jika ingin deploy di Firebase (opsional)
4. Klik **"Register app"**
5. Akan muncul konfigurasi Firebase seperti ini:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "oxivera-xxxxx.firebaseapp.com",
  projectId: "oxivera-xxxxx",
  storageBucket: "oxivera-xxxxx.firebasestorage.app",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef123456"
};
```

6. **Copy semua nilai di atas** dan paste ke file `.env.local` di root project:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSy...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=oxivera-xxxxx.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=oxivera-xxxxx
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=oxivera-xxxxx.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456
```

---

## Langkah 3 — Aktifkan Authentication

1. Di sidebar Firebase Console, klik **"Build" → "Authentication"**
2. Klik **"Get started"**
3. Di tab **"Sign-in method"**, aktifkan:
   - **Email/Password** → klik → toggle **Enable** → Save
   - **Google** → klik → toggle **Enable** → pilih support email → Save

---

## Langkah 4 — Setup Cloud Firestore

1. Di sidebar, klik **"Build" → "Firestore Database"**
2. Klik **"Create database"**
3. Pilih lokasi server (rekomendasi: **asia-southeast1** untuk Indonesia)
4. Pilih **"Start in test mode"** untuk development (nanti diubah ke production rules)
5. Klik **"Create"**

### Firestore Security Rules (Development)

Rules ini sudah otomatis di-set saat memilih test mode. Untuk memastikan:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.time < timestamp.date(2026, 5, 12);
    }
  }
}
```

> ⚠️ **Penting:** Rules di atas hanya untuk development. Sebelum production, ganti dengan rules yang lebih ketat.

### Firestore Security Rules (Production)

Ganti rules di atas dengan ini sebelum deploy ke production:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users: hanya bisa baca/tulis data sendiri
    match /users/{userId} {
      allow read, update: if request.auth != null && request.auth.uid == userId;
      allow create: if request.auth != null;
    }

    // Devices: hanya owner yang bisa akses
    match /devices/{deviceId} {
      allow read, write: if request.auth != null
        && resource.data.ownerId == request.auth.uid;
      allow create: if request.auth != null;
    }

    // Readings: authenticated users bisa baca, device bisa tulis
    match /readings/{readingId} {
      allow read: if request.auth != null;
      allow create: if true; // ESP32 kirim data via REST API
    }

    // Alerts: hanya user terkait
    match /alerts/{alertId} {
      allow read, update: if request.auth != null
        && resource.data.userId == request.auth.uid;
    }
  }
}
```

---

## Langkah 5 — Buat Collection Awal (Opsional)

Firestore akan otomatis membuat collection saat data pertama kali ditulis. Tapi jika ingin membuat manual:

1. Di Firestore, klik **"Start collection"**
2. Buat collection: **users**, **devices**, **readings**, **alerts**

---

## Langkah 6 — Jalankan Project

```bash
npm run dev
```

Buka browser di `http://localhost:3000` — kamu akan diarahkan ke halaman Login.

---

## Struktur File Project

```
src/
├── app/
│   ├── layout.tsx          # Root layout dengan AuthProvider
│   ├── page.tsx            # Home (protected, redirect ke login jika belum auth)
│   ├── globals.css         # Global styles
│   ├── login/
│   │   └── page.tsx        # Halaman login
│   └── register/
│       └── page.tsx        # Halaman register
├── components/
│   └── ProtectedRoute.tsx  # Wrapper untuk halaman yang butuh auth
├── context/
│   └── AuthContext.tsx      # Firebase Auth context & provider
└── lib/
    └── firebase.ts         # Firebase config & initialization
```

---

## Troubleshooting

| Masalah | Solusi |
|---------|--------|
| `Firebase: Error (auth/configuration-not-found)` | Pastikan `.env.local` sudah terisi dengan benar dan restart dev server |
| Google Sign-in tidak muncul popup | Pastikan Google provider sudah di-enable di Firebase Console |
| `Permission denied` di Firestore | Cek Firestore rules, pastikan masih dalam test mode atau rules sudah benar |
| Halaman blank setelah login | Cek console browser untuk error, pastikan Firestore sudah di-setup |
