"use client";

import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { doc, onSnapshot, setDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "./AuthContext";

export interface NotificationPrefs {
  email: boolean;
  push: boolean;
  weeklyReport: boolean;
}

export interface ThresholdPrefs {
  aqi: number;
  filterEfficiency: number;
  offlineMinutes: number;
}

export type Language = "id" | "en";
export type ThemeMode = "light" | "dark";

export interface UserSettings {
  notifications: NotificationPrefs;
  thresholds: ThresholdPrefs;
  language: Language;
  theme: ThemeMode;
}

const DEFAULTS: UserSettings = {
  notifications: { email: true, push: true, weeklyReport: false },
  thresholds: { aqi: 150, filterEfficiency: 70, offlineMinutes: 30 },
  language: "id",
  theme: "light",
};

interface Ctx {
  settings: UserSettings;
  updateNotifications: (n: Partial<NotificationPrefs>) => Promise<void>;
  updateThresholds: (t: Partial<ThresholdPrefs>) => Promise<void>;
  setLanguage: (l: Language) => Promise<void>;
  setTheme: (t: ThemeMode) => Promise<void>;
}

const UserSettingsContext = createContext<Ctx>({} as Ctx);

const LS_KEY = "oxivera:settings";

function readLocal(): UserSettings | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<UserSettings>;
    return {
      notifications: { ...DEFAULTS.notifications, ...(parsed.notifications || {}) },
      thresholds: { ...DEFAULTS.thresholds, ...(parsed.thresholds || {}) },
      language: parsed.language ?? DEFAULTS.language,
      theme: parsed.theme ?? DEFAULTS.theme,
    };
  } catch {
    return null;
  }
}

function writeLocal(s: UserSettings) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(LS_KEY, JSON.stringify(s));
  } catch {}
}

function applyTheme(theme: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  if (theme === "dark") root.classList.add("dark");
  else root.classList.remove("dark");
}

function applyLang(lang: Language) {
  if (typeof document === "undefined") return;
  document.documentElement.setAttribute("lang", lang);
}

export function UserSettingsProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [settings, setSettings] = useState<UserSettings>(() => readLocal() || DEFAULTS);

  useEffect(() => {
    applyTheme(settings.theme);
    applyLang(settings.language);
  }, [settings.theme, settings.language]);

  useEffect(() => {
    if (!user) return;
    const ref = doc(db, "users", user.uid, "settings", "preferences");
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) return;
      const data = snap.data() as Partial<UserSettings>;
      const merged: UserSettings = {
        notifications: { ...DEFAULTS.notifications, ...(data.notifications || {}) },
        thresholds: { ...DEFAULTS.thresholds, ...(data.thresholds || {}) },
        language: data.language ?? DEFAULTS.language,
        theme: data.theme ?? DEFAULTS.theme,
      };
      setSettings(merged);
      writeLocal(merged);
    });
    return unsub;
  }, [user]);

  const persist = useCallback(
    async (next: UserSettings) => {
      setSettings(next);
      writeLocal(next);
      if (user) {
        const ref = doc(db, "users", user.uid, "settings", "preferences");
        await setDoc(ref, next, { merge: true });
      }
    },
    [user],
  );

  const updateNotifications = useCallback(
    async (patch: Partial<NotificationPrefs>) => {
      await persist({
        ...settings,
        notifications: { ...settings.notifications, ...patch },
      });
    },
    [persist, settings],
  );

  const updateThresholds = useCallback(
    async (patch: Partial<ThresholdPrefs>) => {
      await persist({
        ...settings,
        thresholds: { ...settings.thresholds, ...patch },
      });
    },
    [persist, settings],
  );

  const setLanguage = useCallback(
    async (language: Language) => {
      await persist({ ...settings, language });
    },
    [persist, settings],
  );

  const setTheme = useCallback(
    async (theme: ThemeMode) => {
      await persist({ ...settings, theme });
    },
    [persist, settings],
  );

  const value = useMemo<Ctx>(
    () => ({
      settings,
      updateNotifications,
      updateThresholds,
      setLanguage,
      setTheme,
    }),
    [settings, updateNotifications, updateThresholds, setLanguage, setTheme],
  );

  return (
    <UserSettingsContext.Provider value={value}>
      {children}
    </UserSettingsContext.Provider>
  );
}

export const useUserSettings = () => useContext(UserSettingsContext);
