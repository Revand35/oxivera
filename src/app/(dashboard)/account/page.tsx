"use client";

import { useEffect, useRef, useState, FormEvent } from "react";
import { useRouter } from "next/navigation";
import PageHeader from "@/components/PageHeader";
import { useAuth } from "@/context/AuthContext";
import { useUserSettings, Language } from "@/context/UserSettingsContext";
import { t } from "@/lib/i18n";
import {
  updateProfile,
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
  sendEmailVerification,
} from "firebase/auth";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
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
  HiOutlineCamera,
  HiOutlineX,
} from "react-icons/hi";

const PINK = "#ff94c0";
const GREEN = "#afd373";

type OpenSection =
  | "profile"
  | "password"
  | "email"
  | "security"
  | "notif"
  | "appearance"
  | "threshold"
  | "help"
  | "terms"
  | "about"
  | null;

export default function AccountPage() {
  const { user, logout, deleteAccount } = useAuth();
  const { settings } = useUserSettings();
  const router = useRouter();
  const [open, setOpen] = useState<OpenSection>(null);
  const [showDelete, setShowDelete] = useState(false);
  const lang = settings.language;

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  function toggle(section: Exclude<OpenSection, null>) {
    setOpen(open === section ? null : section);
  }

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto">
      <PageHeader title={t(lang, "account.title")} description={t(lang, "account.description")} />

      {/* Profile card */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 mb-6">
        <div className="flex items-center gap-4">
          <AvatarWithUpload />
          <div className="min-w-0 flex-1">
            <h3 className="text-lg sm:text-xl font-semibold text-gray-800 truncate">
              {user?.displayName || "User"}
            </h3>
            <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5 truncate">
              <HiOutlineMail className="shrink-0" /> <span className="truncate">{user?.email}</span>
            </p>
            {user?.emailVerified ? (
              <p className="text-xs flex items-center gap-1 mt-1" style={{ color: "#8fb852" }}>
                <HiOutlineCheckCircle /> {t(lang, "account.emailVerified")}
              </p>
            ) : (
              <p className="text-xs flex items-center gap-1 mt-1 text-amber-600">
                <HiOutlineInformationCircle /> {t(lang, "account.emailNotVerified")}
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Akun & Keamanan */}
      <SectionGroup title={t(lang, "account.sectionSecurity")}>
        <ExpandableItem
          icon={<HiOutlineUser />}
          label={t(lang, "account.editProfile")}
          description={t(lang, "account.editProfileDesc")}
          isOpen={open === "profile"}
          onToggle={() => toggle("profile")}
        >
          <ProfileForm />
        </ExpandableItem>

        <ExpandableItem
          icon={<HiOutlineLockClosed />}
          label={t(lang, "account.changePassword")}
          description={t(lang, "account.changePasswordDesc")}
          isOpen={open === "password"}
          onToggle={() => toggle("password")}
        >
          <PasswordForm />
        </ExpandableItem>

        <ExpandableItem
          icon={<HiOutlineMail />}
          label={t(lang, "account.emailVerification")}
          description={
            user?.emailVerified
              ? t(lang, "account.emailVerified")
              : t(lang, "account.emailNotVerified")
          }
          isOpen={open === "email"}
          onToggle={() => toggle("email")}
        >
          <EmailVerificationSection emailVerified={!!user?.emailVerified} />
        </ExpandableItem>

        <ExpandableItem
          icon={<HiOutlineShieldCheck />}
          label={t(lang, "account.security")}
          description={t(lang, "account.securityDesc")}
          isOpen={open === "security"}
          onToggle={() => toggle("security")}
        >
          <SecurityInfo onSignOut={handleLogout} />
        </ExpandableItem>
      </SectionGroup>

      {/* Preferensi */}
      <SectionGroup title={t(lang, "account.sectionPreferences")}>
        <ExpandableItem
          icon={<HiOutlineBell />}
          label={t(lang, "account.notifications")}
          description={t(lang, "account.notificationsDesc")}
          isOpen={open === "notif"}
          onToggle={() => toggle("notif")}
        >
          <NotificationPreferences />
        </ExpandableItem>

        <ExpandableItem
          icon={<HiOutlineGlobeAlt />}
          label={t(lang, "account.appearance")}
          description={t(lang, "account.appearanceDesc")}
          isOpen={open === "appearance"}
          onToggle={() => toggle("appearance")}
        >
          <AppearancePreferences />
        </ExpandableItem>

        <ExpandableItem
          icon={<HiOutlineDeviceMobile />}
          label={t(lang, "account.threshold")}
          description={t(lang, "account.thresholdDesc")}
          isOpen={open === "threshold"}
          onToggle={() => toggle("threshold")}
        >
          <ThresholdPreferences />
        </ExpandableItem>
      </SectionGroup>

      {/* Tentang & Bantuan */}
      <SectionGroup title={t(lang, "account.sectionAbout")}>
        <ExpandableItem
          icon={<HiOutlineQuestionMarkCircle />}
          label={t(lang, "account.help")}
          description={t(lang, "account.helpDesc")}
          isOpen={open === "help"}
          onToggle={() => toggle("help")}
        >
          <HelpFaq />
        </ExpandableItem>
        <ExpandableItem
          icon={<HiOutlineDocumentText />}
          label={t(lang, "account.terms")}
          description={t(lang, "account.termsDesc")}
          isOpen={open === "terms"}
          onToggle={() => toggle("terms")}
        >
          <p className="text-xs text-gray-600 leading-relaxed">
            {t(lang, "account.termsBody")}
          </p>
        </ExpandableItem>
        <ExpandableItem
          icon={<HiOutlineInformationCircle />}
          label={t(lang, "account.about")}
          description={t(lang, "account.aboutDesc")}
          isOpen={open === "about"}
          onToggle={() => toggle("about")}
        >
          <p className="text-xs text-gray-600 leading-relaxed">
            {t(lang, "account.aboutBody")}
          </p>
        </ExpandableItem>
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
            <div className="font-medium text-red-600">{t(lang, "account.logout")}</div>
            <div className="text-xs text-gray-500">{t(lang, "account.logoutDesc")}</div>
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
            <h4 className="font-semibold text-red-600">{t(lang, "account.deleteAccount")}</h4>
            <p className="text-sm text-gray-500 mt-0.5 mb-3">
              {t(lang, "account.deleteAccountDesc")}
            </p>
            <button
              onClick={() => setShowDelete(true)}
              className="px-4 py-2 border border-red-300 text-red-600 hover:bg-red-50 rounded-lg font-medium text-sm"
            >
              {t(lang, "account.deleteAccountBtn")}
            </button>
          </div>
        </div>
      </div>

      <p className="text-center text-xs text-gray-400 mb-4">
        Oxivera v1.0.0 · Made with 💚 for cleaner air
      </p>

      {showDelete && (
        <DeleteAccountModal
          onCancel={() => setShowDelete(false)}
          onConfirm={async (pw) => {
            await deleteAccount(pw);
            router.push("/login");
          }}
          hasPasswordProvider={
            user?.providerData.some((p) => p.providerId === "password") ?? false
          }
        />
      )}
    </div>
  );
}

/* ───────────── Layout helpers ───────────── */

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

/* ───────────── Avatar upload ───────────── */

async function resizeImage(file: File, size = 256, quality = 0.8): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(size / bitmap.width, size / bitmap.height, 1);
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas tidak tersedia");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

function AvatarWithUpload() {
  const { user } = useAuth();
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [avatarDataUrl, setAvatarDataUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (snap) => {
      const data = snap.data();
      setAvatarDataUrl((data?.avatarDataUrl as string | undefined) ?? null);
    });
    return unsub;
  }, [user]);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setError("");
    if (file.size > 5 * 1024 * 1024) {
      setError("Foto maksimal 5 MB sebelum resize");
      return;
    }
    setSaving(true);
    try {
      const dataUrl = await resizeImage(file, 256, 0.8);
      if (dataUrl.length > 900_000) {
        setError("Hasil resize terlalu besar. Coba gambar yang lebih kecil.");
        return;
      }
      await setDoc(
        doc(db, "users", user.uid),
        { avatarDataUrl: dataUrl },
        { merge: true },
      );
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, { photoURL: dataUrl.slice(0, 2000) });
          await auth.currentUser.reload();
        } catch {}
      }
    } catch {
      setError("Gagal memproses foto");
    } finally {
      setSaving(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function handleRemove() {
    if (!user) return;
    setSaving(true);
    try {
      await setDoc(doc(db, "users", user.uid), { avatarDataUrl: null }, { merge: true });
      if (auth.currentUser) {
        try {
          await updateProfile(auth.currentUser, { photoURL: "" });
          await auth.currentUser.reload();
        } catch {}
      }
    } finally {
      setSaving(false);
    }
  }

  const initial = (user?.displayName || user?.email || "?")[0].toUpperCase();
  const photoSrc = avatarDataUrl || user?.photoURL || null;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative">
        <div
          className="w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center text-white text-2xl sm:text-3xl font-bold shadow-md shrink-0 overflow-hidden"
          style={{ background: `linear-gradient(135deg, ${PINK} 0%, ${GREEN} 100%)` }}
        >
          {photoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={photoSrc} alt="Avatar" className="w-full h-full object-cover" />
          ) : (
            initial
          )}
        </div>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={saving}
          title="Upload foto"
          className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-white border border-gray-200 shadow flex items-center justify-center text-gray-600 hover:bg-gray-50 disabled:opacity-50"
        >
          <HiOutlineCamera className="text-sm" />
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFile}
        />
      </div>
      {photoSrc && !saving && (
        <button
          onClick={handleRemove}
          className="text-[10px] text-gray-500 hover:text-red-600"
        >
          Hapus foto
        </button>
      )}
      {saving && <p className="text-[10px] text-gray-500">Menyimpan...</p>}
      {error && <p className="text-[10px] text-red-600">{error}</p>}
    </div>
  );
}

/* ───────────── Forms ───────────── */

function ProfileForm() {
  const { user } = useAuth();
  const { settings } = useUserSettings();
  const lang = settings.language;
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
        await auth.currentUser.reload();
        setMsg("✓ " + (lang === "id" ? "Profil berhasil diperbarui" : "Profile updated"));
      }
    } catch {
      setMsg("✗ " + (lang === "id" ? "Gagal memperbarui profil" : "Failed to update profile"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">
          {t(lang, "account.fullName")}
        </label>
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
        {loading ? t(lang, "account.saving") : t(lang, "account.save")}
      </button>
    </form>
  );
}

function PasswordForm() {
  const { settings } = useUserSettings();
  const lang = settings.language;
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setMsg("");
    if (newPw.length < 6) {
      setMsg("✗ " + (lang === "id" ? "Password baru minimal 6 karakter" : "New password must be at least 6 characters"));
      return;
    }
    if (newPw !== confirm) {
      setMsg("✗ " + (lang === "id" ? "Konfirmasi tidak cocok" : "Confirmation does not match"));
      return;
    }
    setLoading(true);
    try {
      if (auth.currentUser?.email) {
        const credential = EmailAuthProvider.credential(auth.currentUser.email, current);
        await reauthenticateWithCredential(auth.currentUser, credential);
        await updatePassword(auth.currentUser, newPw);
        setMsg("✓ " + (lang === "id" ? "Password berhasil diubah" : "Password changed"));
        setCurrent("");
        setNewPw("");
        setConfirm("");
      }
    } catch {
      setMsg("✗ " + (lang === "id" ? "Password saat ini salah atau operasi gagal" : "Current password is wrong or operation failed"));
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <SmallPasswordInput label={t(lang, "account.currentPassword")} value={current} onChange={setCurrent} />
      <SmallPasswordInput label={t(lang, "account.newPassword")} value={newPw} onChange={setNewPw} />
      <SmallPasswordInput label={t(lang, "account.confirmPassword")} value={confirm} onChange={setConfirm} />
      {msg && <FormMessage msg={msg} />}
      <button
        type="submit"
        disabled={loading}
        className="w-full px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50"
        style={{ background: `linear-gradient(90deg, ${PINK} 0%, ${GREEN} 100%)` }}
      >
        {loading ? t(lang, "account.processing") : t(lang, "account.changePasswordBtn")}
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
  const { settings } = useUserSettings();
  const lang = settings.language;
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleResend() {
    setMsg("");
    setLoading(true);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setMsg("✓ " + t(lang, "account.resendEmail"));
      }
    } catch {
      setMsg("✗ " + (lang === "id" ? "Gagal mengirim email verifikasi" : "Failed to send verification email"));
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
        {t(lang, "account.emailVerifiedShort")}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <p className="text-xs text-gray-600">{t(lang, "account.verifyDescription")}</p>
      {msg && <FormMessage msg={msg} />}
      <button
        onClick={handleResend}
        disabled={loading}
        className="w-full px-4 py-2 text-sm rounded-lg text-white font-medium disabled:opacity-50"
        style={{ background: `linear-gradient(90deg, ${PINK} 0%, ${GREEN} 100%)` }}
      >
        {loading ? t(lang, "account.sending") : t(lang, "account.sendVerification")}
      </button>
    </div>
  );
}

/* ───────────── Security / account info ───────────── */

function SecurityInfo({ onSignOut }: { onSignOut: () => void }) {
  const { user } = useAuth();
  const { settings } = useUserSettings();
  const lang = settings.language;
  if (!user) return null;
  const meta = user.metadata;
  const providers = user.providerData.map((p) => p.providerId).join(", ") || "password";
  const fmt = (ts?: string) => (ts ? new Date(ts).toLocaleString(lang === "id" ? "id-ID" : "en-US") : "-");

  return (
    <div className="space-y-3">
      <InfoRow label={t(lang, "account.createdAt")} value={fmt(meta.creationTime)} />
      <InfoRow label={t(lang, "account.lastSignIn")} value={fmt(meta.lastSignInTime)} />
      <InfoRow label={t(lang, "account.provider")} value={providers} />
      <button
        onClick={onSignOut}
        className="w-full px-4 py-2 text-sm rounded-lg border border-red-300 text-red-600 hover:bg-red-50 font-medium"
      >
        {t(lang, "account.signOutAll")}
      </button>
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-xs border-b border-gray-200 pb-2 last:border-b-0">
      <span className="text-gray-500">{label}</span>
      <span className="text-gray-800 font-medium text-right break-all">{value}</span>
    </div>
  );
}

/* ───────────── Preferences ───────────── */

function NotificationPreferences() {
  const { settings, updateNotifications } = useUserSettings();
  const lang = settings.language;
  const { email, push, weeklyReport } = settings.notifications;
  const [pushError, setPushError] = useState("");

  async function togglePush(next: boolean) {
    if (next && typeof Notification !== "undefined") {
      try {
        const perm = await Notification.requestPermission();
        if (perm !== "granted") {
          setPushError(
            lang === "id"
              ? "Izin notifikasi browser ditolak."
              : "Browser notification permission denied.",
          );
          return;
        }
      } catch {}
    }
    setPushError("");
    await updateNotifications({ push: next });
  }

  return (
    <div className="space-y-1">
      <Toggle
        label={t(lang, "account.emailNotif")}
        description={t(lang, "account.emailNotifDesc")}
        value={email}
        onChange={(v) => updateNotifications({ email: v })}
      />
      <Toggle
        label={t(lang, "account.pushNotif")}
        description={t(lang, "account.pushNotifDesc")}
        value={push}
        onChange={togglePush}
      />
      {pushError && <p className="text-[10px] text-red-600 pl-1">{pushError}</p>}
      <Toggle
        label={t(lang, "account.weekly")}
        description={t(lang, "account.weeklyDesc")}
        value={weeklyReport}
        onChange={(v) => updateNotifications({ weeklyReport: v })}
      />
    </div>
  );
}

function AppearancePreferences() {
  const { settings, setLanguage, setTheme } = useUserSettings();
  const lang = settings.language;
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between py-3 border-b border-gray-200">
        <div className="flex-1 pr-3">
          <div className="font-medium text-gray-800 text-sm">{t(lang, "account.language")}</div>
          <div className="text-xs text-gray-500">{t(lang, "account.languageDesc")}</div>
        </div>
        <select
          value={lang}
          onChange={(e) => setLanguage(e.target.value as Language)}
          className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none text-sm bg-white"
        >
          <option value="id">Bahasa Indonesia</option>
          <option value="en">English</option>
        </select>
      </div>
      <Toggle
        label={t(lang, "account.darkMode")}
        description={t(lang, "account.darkModeDesc")}
        value={settings.theme === "dark"}
        onChange={(v) => setTheme(v ? "dark" : "light")}
        icon={<HiOutlineMoon />}
      />
    </div>
  );
}

function ThresholdPreferences() {
  const { settings, updateThresholds } = useUserSettings();
  const lang = settings.language;
  const [aqi, setAqi] = useState(settings.thresholds.aqi);
  const [filterEff, setFilterEff] = useState(settings.thresholds.filterEfficiency);
  const [offline, setOffline] = useState(settings.thresholds.offlineMinutes);
  const [msg, setMsg] = useState("");

  async function handleSave() {
    await updateThresholds({ aqi, filterEfficiency: filterEff, offlineMinutes: offline });
    setMsg(t(lang, "account.thresholdSaved"));
    setTimeout(() => setMsg(""), 2000);
  }

  return (
    <div className="space-y-1">
      <ThresholdSlider
        label={t(lang, "account.aqiThreshold")}
        description={t(lang, "account.aqiThresholdDesc")}
        value={aqi}
        onChange={setAqi}
        min={50}
        max={300}
        unit="AQI"
      />
      <ThresholdSlider
        label={t(lang, "account.filterEff")}
        description={t(lang, "account.filterEffDesc")}
        value={filterEff}
        onChange={setFilterEff}
        min={30}
        max={95}
        unit="%"
      />
      <ThresholdSlider
        label={t(lang, "account.offlineTime")}
        description={t(lang, "account.offlineTimeDesc")}
        value={offline}
        onChange={setOffline}
        min={5}
        max={120}
        unit={t(lang, "account.minutes")}
      />
      {msg && <FormMessage msg={msg} />}
      <button
        onClick={handleSave}
        className="w-full mt-3 px-4 py-2 text-sm rounded-lg text-white font-medium"
        style={{ background: `linear-gradient(90deg, ${PINK} 0%, ${GREEN} 100%)` }}
      >
        {t(lang, "account.saveThreshold")}
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

/* ───────────── Help / FAQ ───────────── */

function HelpFaq() {
  const { settings } = useUserSettings();
  const lang = settings.language;
  const items = [
    { q: t(lang, "account.faqQ1"), a: t(lang, "account.faqA1") },
    { q: t(lang, "account.faqQ2"), a: t(lang, "account.faqA2") },
    { q: t(lang, "account.faqQ3"), a: t(lang, "account.faqA3") },
  ];
  const [openIdx, setOpenIdx] = useState<number | null>(0);
  return (
    <div className="space-y-2">
      {items.map((it, i) => {
        const isOpen = openIdx === i;
        return (
          <div key={i} className="rounded-lg border border-gray-200 bg-white overflow-hidden">
            <button
              onClick={() => setOpenIdx(isOpen ? null : i)}
              className="w-full flex items-center justify-between gap-3 text-left px-3 py-2 hover:bg-gray-50"
            >
              <span className="text-xs font-semibold text-gray-800">{it.q}</span>
              {isOpen ? (
                <HiOutlineChevronDown className="text-gray-400 shrink-0" />
              ) : (
                <HiOutlineChevronRight className="text-gray-300 shrink-0" />
              )}
            </button>
            {isOpen && <div className="px-3 pb-3 text-xs text-gray-600 leading-relaxed">{it.a}</div>}
          </div>
        );
      })}
    </div>
  );
}

/* ───────────── Delete account modal ───────────── */

function DeleteAccountModal({
  onCancel,
  onConfirm,
  hasPasswordProvider,
}: {
  onCancel: () => void;
  onConfirm: (password: string) => Promise<void>;
  hasPasswordProvider: boolean;
}) {
  const { settings } = useUserSettings();
  const lang = settings.language;
  const [pw, setPw] = useState("");
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  async function handle() {
    setErr("");
    setLoading(true);
    try {
      await onConfirm(pw);
    } catch (e) {
      setErr(
        (e as Error)?.message ||
          (lang === "id" ? "Gagal menghapus akun" : "Failed to delete account"),
      );
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
      <div className="bg-white rounded-2xl max-w-sm w-full p-5 shadow-xl">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-lg shrink-0"
              style={{ background: "#fee2e2", color: "#dc2626" }}
            >
              <HiOutlineTrash />
            </div>
            <h3 className="font-semibold text-gray-900 text-sm">
              {t(lang, "account.deleteConfirm")}
            </h3>
          </div>
          <button onClick={onCancel} className="text-gray-400 hover:text-gray-700">
            <HiOutlineX />
          </button>
        </div>
        <p className="text-xs text-gray-600 mb-3">{t(lang, "account.deleteWarning")}</p>
        {hasPasswordProvider && (
          <SmallPasswordInput
            label={t(lang, "account.confirmPasswordDelete")}
            value={pw}
            onChange={setPw}
          />
        )}
        {err && <FormMessage msg={"✗ " + err} />}
        <div className="flex gap-2 mt-4">
          <button
            onClick={onCancel}
            disabled={loading}
            className="flex-1 px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {t(lang, "account.cancel")}
          </button>
          <button
            onClick={handle}
            disabled={loading || (hasPasswordProvider && pw.length === 0)}
            className="flex-1 px-4 py-2 text-sm rounded-lg bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 font-medium"
          >
            {loading ? t(lang, "account.deleting") : t(lang, "account.deletePermanent")}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ───────────── Shared ───────────── */

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
