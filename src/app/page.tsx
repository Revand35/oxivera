"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import ceoPhoto from "../../assets/ABI.jpg";
import cmoPhoto from "../../assets/Naomi.jpeg";
import cpoPhoto from "../../assets/Dhafa.jpg";
import cboPhoto from "../../assets/vorin.jpg";
import ctoPhoto from "../../assets/Evan.jpg";
import croPhoto from "../../assets/Aurel.jpeg";
import { useAuth } from "@/context/AuthContext";
import {
  HiOutlineMenu,
  HiOutlineX,
  HiOutlineArrowRight,
  HiOutlineLightningBolt,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineLocationMarker,
  HiOutlineSparkles,
  HiOutlineSun,
  HiOutlineCloud,
  HiOutlineTrendingUp,
  HiOutlineChip,
  HiOutlineWifi,
  HiOutlineMail,
  HiOutlinePhone,
  HiOutlineCheckCircle,
} from "react-icons/hi";
import { FaGithub, FaInstagram, FaLinkedin, FaTwitter } from "react-icons/fa";

const PINK = "#ff94c0";
const PINK_DARK = "#ff6ba5";
const GREEN = "#afd373";
const GREEN_DARK = "#8fb852";
const GRADIENT = `linear-gradient(90deg, ${PINK} 0%, ${GREEN} 100%)`;

// Landing-page "Dashboard" CTAs always force a fresh login — even if the
// user has an active session — by signing out first and routing to /login.
function useEnterDashboard() {
  const { logout } = useAuth();
  const router = useRouter();
  return async (e?: React.MouseEvent) => {
    if (e) e.preventDefault();
    try {
      await logout();
    } catch {}
    router.push("/login");
  };
}

export default function HomePage() {
  // Clean up any leftover service worker on first load (one-time cleanup).
  useEffect(() => {
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.getRegistrations().then((regs) => {
        regs.forEach((reg) => {
          // Trigger update check — new sw.js is a kill-switch that unregisters itself.
          reg.update().catch(() => {});
        });
      });
    }
  }, []);

  return (
    <div className="min-h-screen bg-white text-gray-800">
      <Navbar />
      <Hero />
      <FeatureCards />
      <AboutSection />
      <TeamSection />
      <StatsSection />
      <SensorGrid />
      <HowItWorks />

      <CTASection />
      <Footer />
    </div>
  );
}

/* ───────────── TEAM ───────────── */
function TeamSection() {
  const teamMembers = [
    {
      role: "CEO",
      name: "Gabriel Abimanyu Putra Kurniawan D",
      photo: ceoPhoto,
    },
    {
      role: "CMO",
      name: "Aisha Naomi Paramesti",
      photo: cmoPhoto,
    },
    {
      role: "CPO",
      name: "Dhafa Riezqi Aribrata",
      photo: cpoPhoto,
    },
    {
      role: "CBO",
      name: "Bilqis Desnayu Ivorin",
      photo: cboPhoto,
    },
    {
      role: "CTO",
      name: "Evan Farrel Arkana Jainuri",
      photo: ctoPhoto,
    },
    {
      role: "CRO",
      name: "I Gusti Ayu Aurellia Annisa Nawantari",
      photo: croPhoto,
    },
  ];

  return (
    <section className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <div
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: PINK_DARK }}
          >
            Company Profile
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-gray-900 mb-4 leading-[1.1]">
            Tim Inti Oxivera
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Orang-orang di balik pengembangan produk, riset, dan pertumbuhan Oxivera.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {teamMembers.map((member) => (
            <div key={member.role} className="text-center group">
              <div className="relative w-32 h-40 mx-auto mb-4 overflow-hidden rounded-xl">
                <Image
                  src={member.photo}
                  alt={`${member.name} - ${member.role}`}
                  fill
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  className="object-cover group-hover:scale-105 transition-transform duration-300"
                />
              </div>
              <p
                className="inline-flex text-xs font-semibold px-3 py-1 rounded-full mb-2"
                style={{
                  background: "linear-gradient(135deg, #ffd4e5 0%, #d9ebb8 100%)",
                  color: GREEN_DARK,
                }}
              >
                {member.role}
              </p>
              <h3 className="text-sm font-semibold text-gray-900">{member.name}</h3>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── NAVBAR ───────────── */
function Navbar() {
  const [open, setOpen] = useState(false);
  const enterDashboard = useEnterDashboard();

  const links = [
    { href: "#beranda", label: "Beranda" },
    { href: "#tentang", label: "Tentang" },
    { href: "#fitur", label: "Fitur" },
    { href: "#sensor", label: "Sensor" },
    { href: "#cara-kerja", label: "Cara Kerja" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        <Link href="#beranda" className="flex items-center gap-2.5">
          <Image
            src="/oxivera-logo.png"
            alt="Oxivera logo"
            width={40}
            height={40}
            priority
            className="w-10 h-10 object-contain"
          />
          <div>
            <h1
              className="text-xl font-bold tracking-tight leading-none"
              style={{
                background: GRADIENT,
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Oxivera
            </h1>
            <p className="text-[10px] text-gray-400 leading-none mt-0.5">Air Filter Monitor</p>
          </div>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {links.map((l) => (
            <a
              key={l.href}
              href={l.href}
              className="text-sm font-medium text-gray-600 hover:text-gray-900 transition"
            >
              {l.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <a
            href="/login"
            onClick={enterDashboard}
            className="text-sm font-medium text-gray-700 hover:text-gray-900 cursor-pointer"
          >
            Masuk
          </a>
          <Link
            href="/register"
            className="text-sm font-medium px-4 py-2 rounded-full text-white shadow-md hover:shadow-lg transition inline-flex items-center gap-1.5"
            style={{ background: GRADIENT }}
          >
            Daftar
          </Link>
        </div>

        <button
          onClick={() => setOpen(!open)}
          className="md:hidden p-2 text-gray-700"
          aria-label="Menu"
        >
          {open ? <HiOutlineX className="text-2xl" /> : <HiOutlineMenu className="text-2xl" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-gray-100 bg-white">
          <div className="px-4 py-3 space-y-1">
            {links.map((l) => (
              <a
                key={l.href}
                href={l.href}
                onClick={() => setOpen(false)}
                className="block py-2 text-sm font-medium text-gray-700 hover:text-gray-900"
              >
                {l.label}
              </a>
            ))}
            <div className="pt-3 flex gap-2">
              <a
                href="/login"
                onClick={enterDashboard}
                className="flex-1 text-center py-2 text-sm font-medium border border-gray-300 rounded-lg cursor-pointer"
              >
                Masuk
              </a>
              <Link
                href="/register"
                className="flex-1 text-center py-2 text-sm font-medium text-white rounded-lg"
                style={{ background: GRADIENT }}
              >
                Daftar
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

/* ───────────── HERO ───────────── */
function Hero() {
  const enterDashboard = useEnterDashboard();

  return (
    <section
      id="beranda"
      className="relative overflow-hidden"
      style={{
        background:
          "radial-gradient(ellipse at top left, #ffd4e5 0%, transparent 50%), radial-gradient(ellipse at bottom right, #d9ebb8 0%, transparent 50%), #ffffff",
      }}
    >
      <div
        className="absolute top-20 -left-20 w-72 h-72 rounded-full opacity-30 blur-3xl"
        style={{ background: PINK }}
      />
      <div
        className="absolute bottom-10 -right-20 w-96 h-96 rounded-full opacity-20 blur-3xl"
        style={{ background: GREEN }}
      />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-28">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <div
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
              style={{
                background: "linear-gradient(135deg, #ffd4e5 0%, #d9ebb8 100%)",
                color: GREEN_DARK,
              }}
            >
              <HiOutlineSparkles /> Sistem IoT Monitoring Udara Real-time
            </div>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-semibold tracking-tight text-gray-900 leading-[1.05] mb-6">
              Udara Bersih,{" "}
              <span
                className="italic"
                style={{
                  background: GRADIENT,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Terbukti Nyata.
              </span>
            </h1>
            <p className="text-lg text-gray-600 mb-8 leading-relaxed max-w-xl">
              Oxivera bukan sekadar filter udara. Kami membuktikan alat kami bekerja dengan
              membandingkan kualitas udara <strong style={{ color: PINK_DARK }}>sebelum</strong> dan{" "}
              <strong style={{ color: GREEN_DARK }}>sesudah</strong> difilter, secara real-time.
            </p>
            <div className="flex flex-wrap gap-3">
              <a
                href="/login"
                onClick={enterDashboard}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-white font-medium shadow-lg hover:shadow-xl transition hover:-translate-y-0.5 cursor-pointer"
                style={{ background: GRADIENT }}
              >
                Masuk Dashboard <HiOutlineArrowRight />
              </a>
              <a
                href="#cara-kerja"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition"
              >
                Cara Kerja
              </a>
            </div>

            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              <MiniStat number="87%" label="Efektivitas" />
              <MiniStat number="4+" label="Sensor" />
              <MiniStat number="24/7" label="Monitoring" />
            </div>
          </div>

          <div className="relative">
            <HeroVisual />
          </div>
        </div>
      </div>
    </section>
  );
}

function MiniStat({ number, label }: { number: string; label: string }) {
  return (
    <div>
      <div
        className="text-2xl sm:text-3xl font-bold"
        style={{
          background: GRADIENT,
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {number}
      </div>
      <div className="text-xs text-gray-500 mt-1">{label}</div>
    </div>
  );
}

function HeroVisual() {
  return (
    <div className="relative mx-auto max-w-md">
      <div
        className="relative rounded-3xl p-6 shadow-2xl"
        style={{
          background: "linear-gradient(135deg, #ffffff 0%, #fafafa 100%)",
          border: "1px solid #f0f0f0",
        }}
      >
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs font-medium text-gray-500">LIVE</span>
          </div>
          <HiOutlineWifi className="text-lg text-gray-400" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-5">
          <div
            className="rounded-2xl p-4"
            style={{ background: "linear-gradient(135deg, #ffd4e5 0%, #ffffff 100%)" }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: PINK_DARK }}>
              Sebelum Filter
            </div>
            <div className="text-3xl font-bold text-gray-800 mt-1">178</div>
            <div className="text-xs text-gray-500 mt-0.5">AQI · Buruk</div>
          </div>
          <div
            className="rounded-2xl p-4"
            style={{ background: "linear-gradient(135deg, #d9ebb8 0%, #ffffff 100%)" }}
          >
            <div className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: GREEN_DARK }}>
              Sesudah Filter
            </div>
            <div className="text-3xl font-bold text-gray-800 mt-1">23</div>
            <div className="text-xs text-gray-500 mt-0.5">AQI · Baik</div>
          </div>
        </div>

        <div className="rounded-2xl p-4 text-white" style={{ background: GRADIENT }}>
          <div className="text-xs opacity-90">Efektivitas Filter</div>
          <div className="text-3xl font-bold mt-0.5">87%</div>
          <div className="text-[10px] opacity-80 mt-1">Polutan berkurang</div>
        </div>

        <div className="mt-5 flex items-end gap-1.5 h-16">
          {[40, 60, 45, 80, 55, 90, 70, 95, 65, 85, 50, 75].map((h, i) => (
            <div
              key={i}
              className="flex-1 rounded-t"
              style={{
                height: `${h}%`,
                background: i < 6 ? PINK : GREEN,
                opacity: 0.7 + (i % 3) * 0.1,
              }}
            />
          ))}
        </div>
      </div>

      <div
        className="absolute -top-4 -left-4 bg-white rounded-2xl shadow-lg p-3 flex items-center gap-2 border border-gray-100"
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-lg"
          style={{ background: PINK }}
        >
          <HiOutlineLightningBolt />
        </div>
        <div>
          <div className="text-[10px] text-gray-500">Real-time</div>
          <div className="text-xs font-semibold">Firestore Live</div>
        </div>
      </div>
      <div
        className="absolute -bottom-4 -right-4 bg-white rounded-2xl shadow-lg p-3 flex items-center gap-2 border border-gray-100"
      >
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center text-white text-lg"
          style={{ background: GREEN }}
        >
          <HiOutlineShieldCheck />
        </div>
        <div>
          <div className="text-[10px] text-gray-500">Terjamin</div>
          <div className="text-xs font-semibold">Data Aman</div>
        </div>
      </div>
    </div>
  );
}

/* ───────────── FEATURE CARDS ───────────── */
function FeatureCards() {
  const cards = [
    {
      icon: <HiOutlineLightningBolt />,
      title: "Real-time Monitoring",
      desc: "Data sensor ditampilkan live tanpa refresh, menggunakan Firestore listener.",
    },
    {
      icon: <HiOutlineChartBar />,
      title: "Before vs After",
      desc: "Perbandingan kualitas udara input dan output filter secara side-by-side.",
    },
    {
      icon: <HiOutlineShieldCheck />,
      title: "Filter Effectiveness",
      desc: "Persentase efektivitas filter menghitung pengurangan polutan otomatis.",
    },
    {
      icon: <HiOutlineLocationMarker />,
      title: "Multi-location",
      desc: "Satu dashboard mengawasi beberapa lokasi atau ruangan sekaligus.",
    },
  ];

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((c, i) => (
            <div
              key={i}
              className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl hover:-translate-y-1 transition group"
              style={{ boxShadow: "0 4px 20px rgba(0,0,0,0.04)" }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl text-white mb-4 shadow-md group-hover:scale-110 transition"
                style={{ background: GRADIENT }}
              >
                {c.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1">{c.title}</h3>
              <p className="text-sm text-gray-500 leading-relaxed">{c.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── ABOUT ───────────── */
function AboutSection() {
  return (
    <section id="tentang" className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative">
            <div
              className="aspect-square rounded-3xl overflow-hidden shadow-xl relative"
              style={{
                background:
                  "linear-gradient(135deg, #ffd4e5 0%, #ffffff 50%, #d9ebb8 100%)",
              }}
            >
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-4/5 aspect-square">
                  {[0, 1, 2, 3].map((i) => (
                    <div
                      key={i}
                      className="absolute inset-0 rounded-full border-2"
                      style={{
                        borderColor: i % 2 === 0 ? PINK : GREEN,
                        opacity: 0.3 + i * 0.15,
                        transform: `scale(${1 - i * 0.18})`,
                      }}
                    />
                  ))}
                  <div
                    className="absolute inset-0 m-auto w-20 h-20 rounded-full flex items-center justify-center text-white text-4xl shadow-lg"
                    style={{ background: GRADIENT }}
                  >
                    <HiOutlineSparkles />
                  </div>
                </div>
              </div>

              {[
                { top: "10%", left: "15%", size: 8, color: PINK },
                { top: "25%", right: "20%", size: 12, color: PINK },
                { bottom: "15%", left: "25%", size: 10, color: GREEN },
                { bottom: "30%", right: "15%", size: 6, color: GREEN },
                { top: "60%", left: "10%", size: 8, color: GREEN },
              ].map((p, i) => (
                <div
                  key={i}
                  className="absolute rounded-full opacity-60 animate-pulse"
                  style={{
                    ...p,
                    width: p.size,
                    height: p.size,
                    background: p.color,
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
              ))}
            </div>

            <div className="absolute -bottom-6 -right-6 bg-white rounded-2xl shadow-xl p-4 border border-gray-100 max-w-[200px]">
              <div className="flex items-center gap-2 mb-1">
                <HiOutlineCheckCircle className="text-xl" style={{ color: GREEN_DARK }} />
                <span className="text-xs font-semibold text-gray-800">Terbukti Efektif</span>
              </div>
              <p className="text-[11px] text-gray-500 leading-relaxed">
                Data sensor terverifikasi di dua titik pengukuran.
              </p>
            </div>
          </div>

          <div>
            <div
              className="text-xs font-semibold uppercase tracking-wider mb-3"
              style={{ color: GREEN_DARK }}
            >
              Tentang Oxivera
            </div>
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-gray-900 mb-5 leading-[1.1]">
              Kami membangun kepercayaan lewat{" "}
              <span className="italic" style={{ color: PINK_DARK }}>
                data
              </span>
              , bukan klaim.
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Banyak filter udara mengklaim bisa membersihkan udara, tapi tidak bisa dibuktikan.
              Oxivera menjawab masalah itu dengan menempatkan sensor pada dua titik — sebelum dan
              sesudah filter — sehingga setiap pengguna bisa melihat pengurangan polutan secara
              kuantitatif dalam persentase.
            </p>

            <div className="space-y-3">
              {[
                "Transparansi penuh lewat data real-time yang bisa diaudit.",
                "Menggunakan sensor gas: MQ-135.",
                "Cloud-native: Firebase Firestore, Firebase Auth, ESP32 IoT.",
                "Dashboard responsif yang bisa diakses di desktop maupun mobile.",
              ].map((txt, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ background: "linear-gradient(135deg, #ffd4e5 0%, #d9ebb8 100%)" }}
                  >
                    <HiOutlineCheckCircle style={{ color: GREEN_DARK }} />
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">{txt}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── STATS ───────────── */
function StatsSection() {
  const stats = [
    { number: "87%", label: "Rata-rata efektivitas filter" },
    { number: "6+", label: "Parameter udara diukur" },
    { number: "2", label: "Titik pengukuran per alat" },
    { number: "24/7", label: "Pemantauan non-stop" },
  ];

  return (
    <section className="py-16 relative overflow-hidden" style={{ background: GRADIENT }}>
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage:
            "radial-gradient(circle at 20% 50%, rgba(255,255,255,0.3) 0%, transparent 50%)",
        }}
      />
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 text-center text-white">
          {stats.map((s, i) => (
            <div key={i}>
              <div className="text-4xl sm:text-5xl font-bold mb-2">{s.number}</div>
              <div className="text-sm opacity-90">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── SENSOR GRID ───────────── */
function SensorGrid() {
  const sensors = [
    {
      icon: <HiOutlineSparkles />,
      title: "PM2.5 & PM10",
      desc: "Mendeteksi partikel halus (debu, asap) yang membahayakan paru-paru.",
      color: PINK,
    },
    {
      icon: <HiOutlineSun />,
      title: "Temperature",
      desc: "Pemantauan suhu ruangan — memengaruhi kenyamanan dan kualitas udara.",
      color: GREEN,
    },
    {
      icon: <HiOutlineCloud />,
      title: "Humidity",
      desc: "Kelembaban relatif — memengaruhi penyebaran polutan dan patogen.",
      color: PINK,
    },
    {
      icon: <HiOutlineTrendingUp />,
      title: "AQI Score",
      desc: "Indeks kualitas udara agregat, dihitung dari seluruh parameter di atas.",
      color: GREEN,
    },
  ];

  return (
    <section id="fitur" className="py-16 lg:py-24 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div
            id="sensor"
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: PINK_DARK }}
          >
            Parameter yang Diukur
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-gray-900 mb-4 leading-[1.1]">
            Empat parameter, dua titik, satu alat.
          </h2>
          <p className="text-gray-600 leading-relaxed">
            Setiap parameter diukur dua kali — di input dan output filter — agar selisihnya
            menunjukkan efektivitas alat secara objektif.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {sensors.map((s, i) => (
            <div
              key={i}
              className="rounded-2xl p-5 border border-gray-100 bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-300 group overflow-hidden"
            >
              <div
                className="absolute -top-8 -right-8 w-24 h-24 rounded-full opacity-10 group-hover:opacity-15 transition"
                style={{ background: s.color }}
              />
              <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl text-white mb-3 shadow-md"
                style={{ background: s.color }}
              >
                {s.icon}
              </div>
              <h3 className="font-semibold text-gray-900 mb-1.5 text-sm">{s.title}</h3>
              <p className="text-xs text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ───────────── HOW IT WORKS ───────────── */
function HowItWorks() {
  const steps = [
    {
      num: "01",
      title: "Pasang Alat",
      desc: "Hubungkan perangkat ESP32 + sensor ke listrik dan WiFi rumah atau kantor.",
      icon: <HiOutlineChip />,
    },
    {
      num: "02",
      title: "Data Otomatis Terkirim",
      desc: "Setiap beberapa detik, sensor membaca udara dan mengirim ke Firestore.",
      icon: <HiOutlineWifi />,
    },
    {
      num: "03",
      title: "Pantau di Dashboard",
      desc: "Buka Oxivera dari HP atau desktop untuk melihat data live kapan saja.",
      icon: <HiOutlineChartBar />,
    },
  ];

  return (
    <section id="cara-kerja" className="py-16 lg:py-24 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-14">
          <div
            className="text-xs font-semibold uppercase tracking-wider mb-3"
            style={{ color: GREEN_DARK }}
          >
            Cara Kerja
          </div>
          <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-gray-900 mb-4 leading-[1.1]">
            Dari alat ke layar dalam tiga langkah.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 relative">
          <div
            className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5"
            style={{ background: GRADIENT, opacity: 0.3 }}
          />

          {steps.map((s, i) => (
            <div key={i} className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
              <div
                className="relative w-16 h-16 rounded-2xl flex items-center justify-center text-3xl text-white mb-4 shadow-lg mx-auto"
                style={{ background: GRADIENT }}
              >
                {s.icon}
                <div
                  className="absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-gray-800 bg-white shadow-md"
                >
                  {s.num}
                </div>
              </div>
              <h3 className="text-center font-semibold text-gray-900 mb-2">{s.title}</h3>
              <p className="text-center text-sm text-gray-500 leading-relaxed">{s.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}


/* ───────────── CTA ───────────── */
function CTASection() {
  const enterDashboard = useEnterDashboard();

  return (
    <section className="py-16 lg:py-20 bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div
          className="relative rounded-3xl p-10 lg:p-14 text-center overflow-hidden shadow-xl"
          style={{ background: GRADIENT }}
        >
          <div
            className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-20 -translate-y-1/3 translate-x-1/3"
            style={{ background: "white" }}
          />
          <div
            className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10 translate-y-1/3 -translate-x-1/3"
            style={{ background: "white" }}
          />

          <div className="relative">
            <h2 className="font-serif text-4xl sm:text-5xl font-semibold text-white mb-4 leading-[1.1]">
              Siap membuktikan udara di sekitarmu lebih bersih?
            </h2>
            <p className="text-white/90 mb-8 max-w-xl mx-auto">
              Masuk ke dashboard untuk memulai monitoring kualitas udara
              rumah atau kantor kamu secara real-time.
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <a
                href="/login"
                onClick={enterDashboard}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white font-medium shadow-lg hover:shadow-xl transition cursor-pointer"
                style={{ color: PINK_DARK }}
              >
                Masuk Dashboard <HiOutlineArrowRight />
              </a>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-full border-2 border-white text-white font-medium hover:bg-white/10 transition"
              >
                Daftar
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ───────────── FOOTER ───────────── */
function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 pt-14 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-4 gap-10 mb-10">
          <div className="md:col-span-1">
            <div className="flex items-center gap-2.5 mb-4">
              <Image
                src="/oxivera-logo.png"
                alt="Oxivera logo"
                width={36}
                height={36}
                className="w-9 h-9 object-contain"
              />
              <h3
                className="text-xl font-bold"
                style={{
                  background: GRADIENT,
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Oxivera
              </h3>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              Sistem monitoring filter udara IoT yang membuktikan efektivitas alat lewat data
              real-time.
            </p>
            <div className="flex gap-3">
              {[FaInstagram, FaTwitter, FaLinkedin, FaGithub].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-full bg-gray-800 hover:bg-gray-700 flex items-center justify-center transition"
                >
                  <Icon className="text-sm" />
                </a>
              ))}
            </div>
          </div>

          <FooterCol
            title="Produk"
            items={[
              { label: "Dashboard", href: "/dashboard" },
              { label: "Analytics", href: "/analytics" },
              { label: "AI Chat", href: "/chat" },
              { label: "Account", href: "/account" },
            ]}
          />

          <FooterCol
            title="Perusahaan"
            items={[
              { label: "Tentang", href: "#tentang" },
              { label: "Cara Kerja", href: "#cara-kerja" },
              { label: "Fitur", href: "#fitur" },
              { label: "Sensor", href: "#sensor" },
            ]}
          />

          <div>
            <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">
              Hubungi
            </h4>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2 text-gray-400">
                <HiOutlineMail className="text-lg shrink-0" style={{ color: PINK }} />
                <span>hello@oxivera.id</span>
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <HiOutlinePhone className="text-lg shrink-0" style={{ color: GREEN }} />
                <span>+62 812-3456-7890</span>
              </li>
              <li className="flex items-center gap-2 text-gray-400">
                <HiOutlineLocationMarker className="text-lg shrink-0" style={{ color: PINK }} />
                <span>Jakarta, Indonesia</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-800 flex flex-col md:flex-row justify-between items-center gap-3 text-xs text-gray-500">
          <p>© 2026 Oxivera. All rights reserved.</p>
          <p>Made with 💚 for cleaner air</p>
        </div>
      </div>
    </footer>
  );
}

function FooterCol({
  title,
  items,
}: {
  title: string;
  items: { label: string; href: string }[];
}) {
  return (
    <div>
      <h4 className="text-sm font-semibold text-white uppercase tracking-wider mb-4">{title}</h4>
      <ul className="space-y-2 text-sm">
        {items.map((item, i) => (
          <li key={i}>
            <Link href={item.href} className="text-gray-400 hover:text-white transition">
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
