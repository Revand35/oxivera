import type { Language } from "@/context/UserSettingsContext";

type Key =
  | "account.title"
  | "account.description"
  | "account.sectionSecurity"
  | "account.sectionPreferences"
  | "account.sectionAbout"
  | "account.editProfile"
  | "account.editProfileDesc"
  | "account.fullName"
  | "account.saving"
  | "account.save"
  | "account.changePassword"
  | "account.changePasswordDesc"
  | "account.currentPassword"
  | "account.newPassword"
  | "account.confirmPassword"
  | "account.processing"
  | "account.changePasswordBtn"
  | "account.emailVerification"
  | "account.emailVerified"
  | "account.emailNotVerified"
  | "account.resendEmail"
  | "account.sending"
  | "account.sendVerification"
  | "account.emailVerifiedShort"
  | "account.verifyDescription"
  | "account.security"
  | "account.securityDesc"
  | "account.notifications"
  | "account.notificationsDesc"
  | "account.emailNotif"
  | "account.emailNotifDesc"
  | "account.pushNotif"
  | "account.pushNotifDesc"
  | "account.weekly"
  | "account.weeklyDesc"
  | "account.appearance"
  | "account.appearanceDesc"
  | "account.language"
  | "account.languageDesc"
  | "account.darkMode"
  | "account.darkModeDesc"
  | "account.threshold"
  | "account.thresholdDesc"
  | "account.aqiThreshold"
  | "account.aqiThresholdDesc"
  | "account.filterEff"
  | "account.filterEffDesc"
  | "account.offlineTime"
  | "account.offlineTimeDesc"
  | "account.saveThreshold"
  | "account.thresholdSaved"
  | "account.help"
  | "account.helpDesc"
  | "account.terms"
  | "account.termsDesc"
  | "account.about"
  | "account.aboutDesc"
  | "account.logout"
  | "account.logoutDesc"
  | "account.deleteAccount"
  | "account.deleteAccountDesc"
  | "account.deleteAccountBtn"
  | "account.deleteConfirm"
  | "account.deleteWarning"
  | "account.confirmPasswordDelete"
  | "account.cancel"
  | "account.deletePermanent"
  | "account.deleting"
  | "account.uploadPhoto"
  | "account.changePhoto"
  | "account.removePhoto"
  | "account.photoUploading"
  | "account.accountInfo"
  | "account.createdAt"
  | "account.lastSignIn"
  | "account.provider"
  | "account.signOutAll"
  | "account.faqQ1"
  | "account.faqA1"
  | "account.faqQ2"
  | "account.faqA2"
  | "account.faqQ3"
  | "account.faqA3"
  | "account.termsBody"
  | "account.aboutBody"
  | "account.minutes";

const dict: Record<Language, Record<Key, string>> = {
  id: {
    "account.title": "Akun",
    "account.description": "Kelola profil, keamanan, dan preferensi akun",
    "account.sectionSecurity": "Akun & Keamanan",
    "account.sectionPreferences": "Preferensi",
    "account.sectionAbout": "Tentang & Bantuan",
    "account.editProfile": "Edit Profil",
    "account.editProfileDesc": "Ubah nama tampilan",
    "account.fullName": "Nama Lengkap",
    "account.saving": "Menyimpan...",
    "account.save": "Simpan",
    "account.changePassword": "Ubah Password",
    "account.changePasswordDesc": "Perbarui password akun",
    "account.currentPassword": "Password Saat Ini",
    "account.newPassword": "Password Baru",
    "account.confirmPassword": "Konfirmasi Password Baru",
    "account.processing": "Memproses...",
    "account.changePasswordBtn": "Ubah Password",
    "account.emailVerification": "Verifikasi Email",
    "account.emailVerified": "Email sudah terverifikasi",
    "account.emailNotVerified": "Kirim ulang email verifikasi",
    "account.resendEmail": "Email verifikasi dikirim. Cek inbox kamu.",
    "account.sending": "Mengirim...",
    "account.sendVerification": "Kirim Email Verifikasi",
    "account.emailVerifiedShort": "Email kamu sudah terverifikasi.",
    "account.verifyDescription":
      "Verifikasi email untuk keamanan tambahan dan menerima notifikasi penting.",
    "account.security": "Keamanan & Aktivitas",
    "account.securityDesc": "Info akun & sesi",
    "account.notifications": "Notifikasi",
    "account.notificationsDesc": "Email, push, dan laporan mingguan",
    "account.emailNotif": "Notifikasi Email",
    "account.emailNotifDesc": "Kirim peringatan ke email terdaftar",
    "account.pushNotif": "Push Notification",
    "account.pushNotifDesc": "Notifikasi langsung di browser",
    "account.weekly": "Laporan Mingguan",
    "account.weeklyDesc": "Ringkasan efektivitas filter setiap minggu",
    "account.appearance": "Bahasa & Tampilan",
    "account.appearanceDesc": "Bahasa aplikasi, mode gelap",
    "account.language": "Bahasa",
    "account.languageDesc": "Bahasa tampilan aplikasi",
    "account.darkMode": "Mode Gelap",
    "account.darkModeDesc": "Gunakan tema gelap",
    "account.threshold": "Threshold Sensor",
    "account.thresholdDesc": "Batas peringatan AQI & filter",
    "account.aqiThreshold": "Batas AQI Buruk",
    "account.aqiThresholdDesc":
      "Notifikasi saat AQI sebelum filter melebihi nilai ini",
    "account.filterEff": "Minimum Efektivitas Filter",
    "account.filterEffDesc":
      "Notifikasi saat efektivitas filter turun di bawah nilai ini",
    "account.offlineTime": "Waktu Offline",
    "account.offlineTimeDesc":
      "Notifikasi jika perangkat tidak kirim data selama",
    "account.saveThreshold": "Simpan Threshold",
    "account.thresholdSaved": "✓ Threshold tersimpan",
    "account.help": "Bantuan & FAQ",
    "account.helpDesc": "Panduan penggunaan Oxivera",
    "account.terms": "Syarat & Ketentuan",
    "account.termsDesc": "Kebijakan layanan",
    "account.about": "Tentang Oxivera",
    "account.aboutDesc": "Versi 1.0.0 · Sistem Monitoring Filter Udara IoT",
    "account.logout": "Keluar Akun",
    "account.logoutDesc": "Logout dari perangkat ini",
    "account.deleteAccount": "Hapus Akun",
    "account.deleteAccountDesc":
      "Tindakan ini tidak dapat dibatalkan. Semua data akan dihapus permanen.",
    "account.deleteAccountBtn": "Hapus Akun Saya",
    "account.deleteConfirm": "Konfirmasi Hapus Akun",
    "account.deleteWarning":
      "Masukkan password untuk melanjutkan. Aksi ini permanen dan tidak bisa dibatalkan.",
    "account.confirmPasswordDelete": "Password Saat Ini",
    "account.cancel": "Batal",
    "account.deletePermanent": "Ya, Hapus Permanen",
    "account.deleting": "Menghapus...",
    "account.uploadPhoto": "Unggah Foto",
    "account.changePhoto": "Ganti Foto",
    "account.removePhoto": "Hapus Foto",
    "account.photoUploading": "Mengunggah...",
    "account.accountInfo": "Informasi Akun",
    "account.createdAt": "Dibuat",
    "account.lastSignIn": "Login terakhir",
    "account.provider": "Metode login",
    "account.signOutAll": "Keluar dari perangkat ini",
    "account.faqQ1": "Bagaimana cara Oxivera mengukur kualitas udara?",
    "account.faqA1":
      "Oxivera memakai sensor MQ-135 (gas/VOC), PM2.5, dan DHT22 (suhu/kelembaban) yang mengirim data realtime ke Firebase. Dashboard menampilkan perbandingan sebelum & sesudah filter.",
    "account.faqQ2": "Kenapa data sensor tidak muncul?",
    "account.faqA2":
      "Pastikan perangkat Oxivera terhubung ke Wi-Fi dan indikator 'Live' di dashboard berwarna hijau. Jika masih tidak muncul, coba refresh halaman.",
    "account.faqQ3": "Bagaimana cara mengekspor data?",
    "account.faqA3":
      "Di halaman Dashboard klik tombol Record untuk merekam sampel per detik. Setelah Stop, klik Download Excel untuk mengunduh file .xlsx.",
    "account.termsBody":
      "Dengan menggunakan Oxivera, Anda setuju untuk menggunakan layanan ini hanya untuk pemantauan kualitas udara pribadi. Data sensor disimpan di server kami dan dapat dihapus kapan saja melalui fitur Hapus Akun. Kami tidak bertanggung jawab atas kerusakan perangkat keras akibat penggunaan di luar spesifikasi.",
    "account.aboutBody":
      "Oxivera adalah sistem monitoring filter udara berbasis IoT. Dibuat untuk membuktikan efektivitas filter secara real-time dengan membandingkan kualitas udara sebelum dan sesudah melewati filter.",
    "account.minutes": "menit",
  },
  en: {
    "account.title": "Account",
    "account.description": "Manage profile, security, and account preferences",
    "account.sectionSecurity": "Account & Security",
    "account.sectionPreferences": "Preferences",
    "account.sectionAbout": "About & Help",
    "account.editProfile": "Edit Profile",
    "account.editProfileDesc": "Change display name",
    "account.fullName": "Full Name",
    "account.saving": "Saving...",
    "account.save": "Save",
    "account.changePassword": "Change Password",
    "account.changePasswordDesc": "Update account password",
    "account.currentPassword": "Current Password",
    "account.newPassword": "New Password",
    "account.confirmPassword": "Confirm New Password",
    "account.processing": "Processing...",
    "account.changePasswordBtn": "Change Password",
    "account.emailVerification": "Email Verification",
    "account.emailVerified": "Email is verified",
    "account.emailNotVerified": "Resend verification email",
    "account.resendEmail": "Verification email sent. Check your inbox.",
    "account.sending": "Sending...",
    "account.sendVerification": "Send Verification Email",
    "account.emailVerifiedShort": "Your email is verified.",
    "account.verifyDescription":
      "Verify your email for additional security and important notifications.",
    "account.security": "Security & Activity",
    "account.securityDesc": "Account & session info",
    "account.notifications": "Notifications",
    "account.notificationsDesc": "Email, push, and weekly report",
    "account.emailNotif": "Email Notifications",
    "account.emailNotifDesc": "Send alerts to registered email",
    "account.pushNotif": "Push Notifications",
    "account.pushNotifDesc": "Instant notifications in browser",
    "account.weekly": "Weekly Report",
    "account.weeklyDesc": "Receive filter-effectiveness summary weekly",
    "account.appearance": "Language & Appearance",
    "account.appearanceDesc": "App language, dark mode",
    "account.language": "Language",
    "account.languageDesc": "App display language",
    "account.darkMode": "Dark Mode",
    "account.darkModeDesc": "Use dark theme",
    "account.threshold": "Sensor Thresholds",
    "account.thresholdDesc": "AQI & filter alert thresholds",
    "account.aqiThreshold": "Bad AQI Threshold",
    "account.aqiThresholdDesc":
      "Notify when pre-filter AQI exceeds this value",
    "account.filterEff": "Minimum Filter Efficiency",
    "account.filterEffDesc":
      "Notify when filter efficiency drops below this value",
    "account.offlineTime": "Offline Time",
    "account.offlineTimeDesc":
      "Notify if device does not send data for",
    "account.saveThreshold": "Save Thresholds",
    "account.thresholdSaved": "✓ Thresholds saved",
    "account.help": "Help & FAQ",
    "account.helpDesc": "Oxivera usage guide",
    "account.terms": "Terms & Conditions",
    "account.termsDesc": "Service policy",
    "account.about": "About Oxivera",
    "account.aboutDesc": "Version 1.0.0 · IoT Air Filter Monitoring System",
    "account.logout": "Sign Out",
    "account.logoutDesc": "Log out from this device",
    "account.deleteAccount": "Delete Account",
    "account.deleteAccountDesc":
      "This action cannot be undone. All data will be permanently deleted.",
    "account.deleteAccountBtn": "Delete My Account",
    "account.deleteConfirm": "Confirm Account Deletion",
    "account.deleteWarning":
      "Enter your password to continue. This action is permanent and cannot be undone.",
    "account.confirmPasswordDelete": "Current Password",
    "account.cancel": "Cancel",
    "account.deletePermanent": "Yes, Delete Permanently",
    "account.deleting": "Deleting...",
    "account.uploadPhoto": "Upload Photo",
    "account.changePhoto": "Change Photo",
    "account.removePhoto": "Remove Photo",
    "account.photoUploading": "Uploading...",
    "account.accountInfo": "Account Info",
    "account.createdAt": "Created",
    "account.lastSignIn": "Last sign-in",
    "account.provider": "Sign-in method",
    "account.signOutAll": "Sign out of this device",
    "account.faqQ1": "How does Oxivera measure air quality?",
    "account.faqA1":
      "Oxivera uses MQ-135 (gas/VOC), PM2.5, and DHT22 (temp/humidity) sensors streaming real-time to Firebase. The dashboard compares pre- and post-filter values.",
    "account.faqQ2": "Why is no sensor data showing?",
    "account.faqA2":
      "Make sure the Oxivera device is connected to Wi-Fi and the 'Live' indicator is green. If not, try refreshing the page.",
    "account.faqQ3": "How do I export data?",
    "account.faqA3":
      "On the Dashboard, click the Record button to sample every second. After Stop, click Download Excel to save as .xlsx.",
    "account.termsBody":
      "By using Oxivera you agree to use this service for personal air-quality monitoring only. Sensor data is stored on our servers and can be removed anytime via Delete Account. We are not responsible for hardware damage caused by use outside specifications.",
    "account.aboutBody":
      "Oxivera is an IoT-based air filter monitoring system. Built to prove filter effectiveness in real time by comparing air quality before and after passing through the filter.",
    "account.minutes": "min",
  },
};

export function t(lang: Language, key: Key): string {
  return dict[lang][key] ?? key;
}
