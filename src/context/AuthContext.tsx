"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  GoogleAuthProvider,
  signInWithPopup,
  updateProfile,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  reauthenticateWithPopup,
} from "firebase/auth";
import { doc, setDoc, serverTimestamp, deleteDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, displayName: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: (currentPassword?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });
    return unsubscribe;
  }, []);

  async function login(email: string, password: string) {
    await signInWithEmailAndPassword(auth, email, password);
  }

  async function register(email: string, password: string, displayName: string) {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(result.user, { displayName });
    await setDoc(doc(db, "users", result.user.uid), {
      email,
      displayName,
      createdAt: serverTimestamp(),
    });
  }

  async function loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    // Selalu tampilkan account chooser — biar user bisa pilih akun mana yang dipakai.
    provider.setCustomParameters({ prompt: "select_account" });
    const result = await signInWithPopup(auth, provider);
    // Simpan user ke Firestore jika pertama kali login
    await setDoc(
      doc(db, "users", result.user.uid),
      {
        email: result.user.email,
        displayName: result.user.displayName,
        createdAt: serverTimestamp(),
      },
      { merge: true }
    );
  }

  async function logout() {
    await signOut(auth);
  }

  async function deleteAccount(currentPassword?: string) {
    const current = auth.currentUser;
    if (!current) throw new Error("Tidak ada user yang sedang login.");

    const providerIds = current.providerData.map((p) => p.providerId);
    if (providerIds.includes("password")) {
      if (!currentPassword)
        throw new Error("Masukkan password untuk konfirmasi.");
      const cred = EmailAuthProvider.credential(current.email!, currentPassword);
      await reauthenticateWithCredential(current, cred);
    } else if (providerIds.includes("google.com")) {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: "select_account" });
      await reauthenticateWithPopup(current, provider);
    }

    try {
      await deleteDoc(doc(db, "users", current.uid, "settings", "preferences"));
    } catch {}
    try {
      await deleteDoc(doc(db, "users", current.uid));
    } catch {}

    await deleteUser(current);
  }

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, loginWithGoogle, logout, deleteAccount }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
