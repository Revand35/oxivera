"use client";

import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import { SensorDataProvider } from "@/context/SensorDataContext";
import { UserSettingsProvider } from "@/context/UserSettingsContext";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ProtectedRoute>
      <UserSettingsProvider>
        <SensorDataProvider>
          <div className="min-h-screen bg-gray-50 flex flex-col">
            <Sidebar />
            <main className="flex-1 pb-24">{children}</main>
          </div>
        </SensorDataProvider>
      </UserSettingsProvider>
    </ProtectedRoute>
  );
}
