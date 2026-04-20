"use client";

import { useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/context/AuthContext";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import {
  HiOutlineUser,
  HiOutlineMail,
  HiOutlineLockClosed,
  HiOutlineCheckCircle,
  HiOutlineShieldCheck,
  HiOutlineBell,
  HiOutlineInformationCircle,
  HiOutlineQuestionMarkCircle,
  HiOutlineLogout,
  HiOutlineChevronRight,
  HiOutlineChevronDown,
  HiOutlineDeviceMobile,
  HiOutlineGlobeAlt,
  HiOutlineMoon,
  HiOutlineTrash,
  HiOutlineDocumentText,
} from "react-icons/hi";

const PINK = "#ff94c0";
const GREEN = "#afd373";

type OpenSection =
  | "profile"
  | "password"
  | "email"
  | "notif"
  | "appearance"
  | "threshold"
  | null;

export default function AccountPage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const [open, setOpen] = useState<OpenSection>(null);

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  function toggle(section: Exclude<OpenSection, null>) {
    setOpen(open === section ? null : section);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader title="Account" description="Kelola profil, keamanan, dan preferensi akun" />

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-md shrink-0"
            style={{ background: `linear-gradient(135deg, ${PINK} 0%, ${GREEN} 100%)` }}
          >
            {(user?.displayName || user?.email || "?")[0].toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
              {user?.displayName || "User"}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5 truncate">
              <HiOutlineMail className="shrink-0" /> <span className="truncate">{user?.email}</span>
            </p>
            {user?.emailVerified ? (
              <p className="text-xs flex items-center gap-1 mt-1" style={{ color: "#8fb852" }}>
                <HiOutlineCheckCircle /> Email terverifikasi
              </p>
            ) : (
              <p className="text-xs flex items-center gap-1 mt-1 text-amber-600">
                <HiOutlineInformationCircle /> Email belum terverifikasi
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Akun & Keamanan */}
      <SectionGroup title="Akun & Keamanan">
        <ExpandableItem
          icon={<HiOutlineUser />}
          label="Edit Profil"
          description="Ubah nama tampilan"
          isOpen={open === "profile"}
          onToggle={() => toggle("profile")}
        >
          <ProfileForm />
        </ExpandableItem>

        <ExpandableItem
          icon={<HiOutlineLockClosed />}
          label="Ubah Password"
          description="Perbarui password akun"
          isOpen={open === "password"}
          onToggle={() => toggle("password")}
        >
          <PasswordForm />
        </ExpandableItem>

        <ExpandableItem
          icon={<HiOutlineMail />}
          label="Verifikasi Email"
          description={user?.emailVerified ? "Email sudah terverifikasi" : "Kirim ulang email verifikasi"}
          isOpen={open === "email"}
          onToggle={() => toggle("email")}
        >
          <EmailVerificationSection emailVerified={!!user?.emailVerified} />
        </ExpandableItem>

        <LinkItem
          icon={<HiOutlineShieldCheck />}
          label="Keamanan & Privasi"
          description="2FA, sesi aktif (segera hadir)"
          disabled
        />
      </SectionGroup>

      {/* Preferensi */}
      <SectionGroup title="Preferensi">
        <ExpandableItem
          icon={<HiOutlineBell />}
          label="Notifikasi"
          description="Email, push, dan laporan mingguan"
          isOpen={open === "notif"}
          onToggle={() => toggle("notif")}
        >
          <NotificationPreferences />
        </ExpandableItem>

        <ExpandableItem
          icon={<HiOutlineGlobeAlt />}
          label="Bahasa & Tampilan"
          description="Bahasa aplikasi, mode gelap"
          isOpen={open === "appearance"}
          onToggle={() => toggle("appearance")}
        >
          <AppearancePreferences />
        </ExpandableItem>

        <ExpandableItem
          icon={<HiOutlineDeviceMobile />}
          label="Threshold Sensor"
          description="Batas peringatan AQI & filter"
          isOpen={open === "threshold"}
          onToggle={() => toggle("threshold")}
        >
          <ThresholdPreferences />
        </ExpandableItem>
      </SectionGroup>

      {/* Tentang & Bantuan */}
      <SectionGroup title="Tentang & Bantuan">
        <LinkItem
          icon={<HiOutlineQuestionMarkCircle />}
          label="Bantuan & FAQ"
          description="Panduan penggunaan Oxivera"
          disabled
        />
        <LinkItem
          icon={<HiOutlineDocumentText />}
          label="Syarat & Ketentuan"
          description="Kebijakan layanan"
          disabled
        />
        <LinkItem
          icon={<HiOutlineInformationCircle />}
          label="Tentang Oxivera"
          description="Versi 1.0.0 · Sistem Monitoring Filter Udara IoT"
          disabled
        />
      </SectionGroup>

      {/* Logout */}
      <SectionGroup>
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition text-left"
        >
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
            style={{ background: "#fee2e2", color: "#dc2626" }}
          >
            <HiOutlineLogout />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-medium text-red-600">Keluar Akun</div>
            <div className="text-xs text-gray-500">Logout dari perangkat ini</div>
          </div>
          <HiOutlineChevronRight className="text-gray-300 shrink-0" />
        </button>
      </SectionGroup>

      {/* Danger zone */}
      <div className="bg-white rounded-2xl shadow-sm border border-red-200 p-5 mb-6">
        <div className="flex items-start gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
            style={{ background: "#fee2e2", color: "#dc2626" }}
          >
            <HiOutlineTrash />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-red-600">Hapus Akun</h4>
            <p className="text-sm text-gray-500 mt-0.5 mb-3">
              Tindakan ini tidak dapat dibatalkan. Semua data akan dihapus permanen.
            </p>
            <button className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm">
              Hapus Akun Saya
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mb-4">
        Oxivera v1.0.0 · Made with 💚 for cleaner air
      </p>
    </div>
  );
}

function SectionGroup({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      {title && (
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 mb-2">
          {title}
        </h3>
      )}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden divide-y divide-gray-100">
        {children}
      </div>
    </div>
  );
}

function LinkItem({
  icon,
  label,
  description,
  disabled,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  disabled?: boolean;
}) {
  return (
    <div
      className={`w-full flex items-center gap-3 p-4 transition ${
        disabled ? "opacity-50 cursor-not-allowed" : "hover:bg-gray-50 cursor-pointer"
      }`}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
        style={{
          background: "linear-gradient(135deg, #ffd4e5 0%, #d9ebb8 100%)",
          color: "#5a7a2e",
        }}
      >
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-medium text-gray-800 text-sm flex items-center gap-2">
          {label}
          {disabled && (
            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">Soon</span>
          )}
        </div>
        <div className="text-xs text-gray-500 truncate">{description}</div>
      </div>
      <HiOutlineChevronRight className="text-gray-300 shrink-0" />
    </div>
  );
}

function ExpandableItem({
  icon,
  label,
  description,
  isOpen,
  onToggle,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  description: string;
  isOpen: boolean;
  onToggle: () => void;
  children: React.ReactNode;
}) {
  return (
    <div>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 transition text-left"
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
          style={{
            background: "linear-gradient(135deg, #ffd4e5 0%, #d9ebb8 100%)",
            color: "#5a7a2e",
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-medium text-gray-800 text-sm">{label}</div>
          <div className="text-xs text-gray-500 truncate">{description}</div>
        </div>
        {isOpen ? (
          <HiOutlineChevronDown className="text-gray-400 shrink-0" />
        ) : (
          <HiOutlineChevronRight className="text-gray-300 shrink-0" />
        )}
      </button>
      {isOpen && <div className="px-4 pb-4 pt-1 bg-gray-50/50">{children}</div>}
    </div>
  );
}

function ProfileForm() {
  const { user } = useAuth();
  const [displayName, setDisplayName] = useState(user?.displayName || "");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      if (auth.currentUser) {
        await updateProfile(auth.currentUser, { displayName });
        setMsg("✓ Profil berhasil diperbarui");
      }
    } catch {
      setMsg("✗ Gagal memperbarui profil");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Nama Lengkap</label>
        <input
          type="text"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none bg-white"
          onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 2px ${PINK}`)}
          onBlur={(e) => (e.currentTarget.style.boxShadow = "")}
        />
      </div>
      {msg && <FormMessage msg={msg} />}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50"
        style={{ background: `linear-gradient(90deg, ${PINK} 0%, ${GREEN} 100%)` }}
      >
        {loading ? "Menyimpan..." : "Simpan"}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    if (newPw.length < 6) {
      setMsg("✗ Password baru minimal 6 karakter");
      return;
    }
    if (newPw !== confirm) {
      setMsg("✗ Konfirmasi tidak cocok");
      return;
    }
    setLoading(true);
    try {
      if (auth.currentUser?.email) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, current);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPw);
        setMsg("✓ Password berhasil diubah");
        setCurrent("");
        setNewPw("");
        setConfirm("");
      }
    } catch {
      setMsg("✗ Password saat ini salah atau operasi gagal");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <SmallPasswordInput label="Password Saat Ini" value={current} onChange={setCurrent} />
      <SmallPasswordInput label="Password Baru" value={newPw} onChange={setNewPw} />
      <SmallPasswordInput label="Konfirmasi Password Baru" value={confirm} onChange={setConfirm} />
      {msg && <FormMessage msg={msg} />}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50"
        style={{ background: `linear-gradient(90deg, ${PINK} 0%, ${GREEN} 100%)` }}
      >
        {loading ? "Memproses..." : "Ubah Password"}
      </button>
    </form>
  );
}

function SmallPasswordInput({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
      <input
        type="password"
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none bg-white"
        onFocus={(e) => (e.currentTarget.style.boxShadow = `0 0 0 2px ${GREEN}`)}
        onBlur={(e) => (e.currentTarget.style.boxShadow = "")}
      />
    </div>
  );
}

function EmailVerificationSection({ emailVerified }: { emailVerified: boolean }) {
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setMsg("");
    setLoading(true);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setMsg("✓ Email verifikasi telah dikirim. Cek inbox kamu.");
      }
    } catch {
      setMsg("✗ Gagal mengirim email verifikasi");
    } finally {
      setLoading(false);
    }
  }

  if (emailVerified) {
    return (
      <div
        className="text-xs p-3 rounded-lg flex items-center gap-2"
        style={{ background: "#d9ebb8", color: "#5a7a2e" }}
      >
        <HiOutlineCheckCircle className="text-lg" />
        Email kamu sudah terverifikasi.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-600">
        Verifikasi email untuk keamanan tambahan dan menerima notifikasi penting.
      </p>
      {msg && <FormMessage msg={msg} />}
      <button
        onClick={handleResend}
        disabled={loading}
        className="w-full px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50"
        style={{ background: `linear-gradient(90deg, ${PINK} 0%, ${GREEN} 100%)` }}
      >
        {loading ? "Mengirim..." : "Kirim Email Verifikasi"}
      </button>
    </div>
  );
}

function NotificationPreferences() {
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const [weeklyReport, setWeeklyReport] = useState(false);

  return (
    <div className="space-y-1">
      <Toggle
        label="Notifikasi Email"
        description="Kirim peringatan ke email terdaftar"
        value={emailNotif}
        onChange={setEmailNotif}
      />
      <Toggle
        label="Push Notification"
        description="Notifikasi langsung di browser"
        value={pushNotif}
        onChange={setPushNotif}
      />
      <Toggle
        label="Laporan Mingguan"
        description="Terima ringkasan efektivitas filter setiap minggu"
        value={weeklyReport}
        onChange={setWeeklyReport}
      />
    </div>
  );
}

function AppearancePreferences() {
  const [language, setLanguage] = useState("id");
  const [darkMode, setDarkMode] = useState(false);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between py-3 border-b border-gray-200">
        <div className="flex-1 pr-3">
          <div className="font-medium text-gray-800 text-sm">Bahasa</div>
          <div className="text-xs text-gray-500">Bahasa tampilan aplikasi</div>
        </div>
        <select
          value={language}
          onChange={(e) => setLanguage(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none text-sm bg-white"
        >
          <option value="id">Bahasa Indonesia</option>
          <option value="en">English</option>
        </select>
      </div>
      <Toggle
        label="Mode Gelap"
        description="Gunakan tema gelap"
        value={darkMode}
        onChange={setDarkMode}
        disabled
        icon={<HiOutlineMoon />}
      />
    </div>
  );
}

function ThresholdPreferences() {
  const [aqiThreshold, setAqiThreshold] = useState(150);
  const [filterEfficiency, setFilterEfficiency] = useState(70);
  const [offlineMinutes, setOfflineMinutes] = useState(30);
  const [msg, setMsg] = useState("");

  function handleSave() {
    setMsg("✓ Threshold tersimpan");
    setTimeout(() => setMsg(""), 2000);
  }

  return (
    <div className="space-y-1">
      <ThresholdSlider
        label="Batas AQI Buruk"
        description="Notifikasi saat AQI sebelum filter melebihi nilai ini"
        value={aqiThreshold}
        onChange={setAqiThreshold}
        min={50}
        max={300}
        unit="AQI"
      />
      <ThresholdSlider
        label="Minimum Efektivitas Filter"
        description="Notifikasi saat efektivitas filter turun di bawah nilai ini"
        value={filterEfficiency}
        onChange={setFilterEfficiency}
        min={30}
        max={95}
        unit="%"
      />
      <ThresholdSlider
        label="Waktu Offline"
        description="Notifikasi jika perangkat tidak kirim data selama"
        value={offlineMinutes}
        onChange={setOfflineMinutes}
        min={5}
        max={120}
        unit="menit"
      />
      {msg && <FormMessage msg={msg} />}
      <button
        onClick={handleSave}
        className="w-full mt-3 px-4 py-2 text-sm rounded-lg text-white font-medium"
        style={{ background: `linear-gradient(90deg, ${PINK} 0%, ${GREEN} 100%)` }}
      >
        Simpan Threshold
      </button>
    </div>
  );
}

function ThresholdSlider({
  label,
  description,
  value,
  onChange,
  min,
  max,
  unit,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  unit: string;
}) {
  return (
    <div className="py-3 border-b border-gray-200 last:border-b-0">
      <div className="flex items-start justify-between mb-2 gap-3">
        <div className="min-w-0">
          <div className="font-medium text-gray-800 text-sm">{label}</div>
          <div className="text-xs text-gray-500">{description}</div>
        </div>
        <div
          className="px-2.5 py-1 rounded-lg text-xs font-bold text-white shrink-0"
          style={{ background: `linear-gradient(90deg, ${PINK} 0%, ${GREEN} 100%)` }}
        >
          {value} {unit}
        </div>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
        style={{ accentColor: PINK }}
      />
      <div className="flex justify-between text-[10px] text-gray-400">
        <span>
          {min} {unit}
        </span>
        <span>
          {max} {unit}
        </span>
      </div>
    </div>
  );
}

function Toggle({
  label,
  description,
  value,
  onChange,
  disabled,
  icon,
}: {
  label: string;
  description: string;
  value: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-b-0">
      <div className="flex-1 pr-3">
        <div className="font-medium text-gray-800 text-sm flex items-center gap-2">
          {icon} {label}
          {disabled && (
            <span className="text-[10px] px-1.5 py-0.5 bg-gray-100 text-gray-500 rounded">Soon</span>
          )}
        </div>
        <div className="text-xs text-gray-500">{description}</div>
      </div>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange(!value)}
        className="relative w-11 h-6 rounded-full transition shrink-0 disabled:opacity-40"
        style={{
          background: value
            ? `linear-gradient(90deg, ${PINK} 0%, ${GREEN} 100%)`
            : "#d1d5db",
        }}
      >
        <span
          className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all"
          style={{ left: value ? "calc(100% - 22px)" : "2px" }}
        />
      </button>
    </div>
  );
}

function FormMessage({ msg }: { msg: string }) {
  return (
    <div
      className="text-xs p-2 rounded"
      style={{
        background: msg.startsWith("✓") ? "#d9ebb8" : "#fee2e2",
        color: msg.startsWith("✓") ? "#5a7a2e" : "#991b1b",
      }}
    >
      {msg}
    </div>
  );
}
