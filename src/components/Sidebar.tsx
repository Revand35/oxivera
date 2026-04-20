"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  HiOutlineHome,
  HiOutlineChartBar,
  HiOutlineSparkles,
  HiOutlineUser,
  HiOutlineLogout,
} from "react-icons/hi";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: HiOutlineHome },
  { href: "/analytics", label: "Analytics", icon: HiOutlineChartBar },
  { href: "/chat", label: "AI Chat", icon: HiOutlineSparkles },
  { href: "/account", label: "Account", icon: HiOutlineUser },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const router = useRouter();

  async function handleLogout() {
    await logout();
    router.push("/login");
  }

  return (
    <>
      {/* Top header */}
      <header className="sticky top-0 z-30 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center justify-between">
          <div>
            <h1
              className="text-xl sm:text-2xl font-bold tracking-tight"
              style={{
                background: "linear-gradient(90deg, #ff94c0 0%, #afd373 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Oxivera
            </h1>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5 hidden sm:block">
              Air Filter Monitor
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                style={{
                  background: "linear-gradient(135deg, #ff94c0 0%, #afd373 100%)",
                }}
              >
                {(user?.displayName || user?.email || "?")[0].toUpperCase()}
              </div>
              <div className="hidden sm:block min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate max-w-[140px]">
                  {user?.displayName || "User"}
                </p>
                <p className="text-xs text-gray-500 truncate max-w-[140px]">
                  {user?.email}
                </p>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-red-600 hover:bg-red-50 px-3 py-1.5 rounded-lg transition"
              title="Keluar"
            >
              <HiOutlineLogout className="text-lg" />
              <span className="hidden sm:inline">Keluar</span>
            </button>
          </div>
        </div>
      </header>

      {/* Bottom Navbar */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-[0_-2px_10px_rgba(0,0,0,0.04)]">
        <div className="max-w-3xl mx-auto flex items-center justify-between px-1 sm:px-2">
          {navItems.map((item) => {
            const active = pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex-1 flex flex-col items-center justify-center py-2.5 px-1 transition relative"
                style={{ color: active ? "#ff6ba5" : "#6b7280" }}
              >
                {/* Active indicator top bar */}
                {active && (
                  <span
                    className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-1 rounded-b-full"
                    style={{
                      background:
                        "linear-gradient(90deg, #ff94c0 0%, #afd373 100%)",
                    }}
                  />
                )}
                <Icon className="text-xl sm:text-2xl mb-0.5" />
                <span className="text-[10px] sm:text-xs font-medium">
                  {item.label}
                </span>
              </Link>
            );
          })}
        </div>
        {/* Safe area untuk iPhone */}
        <div style={{ paddingBottom: "env(safe-area-inset-bottom)" }} />
      </nav>
    </>
  );
}
