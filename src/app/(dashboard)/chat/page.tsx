"use client";

import { useState, useRef, useEffect, FormEvent } from "react";
import { useSensorData } from "@/context/SensorDataContext";
import {
  HiOutlineSparkles,
  HiOutlinePaperAirplane,
  HiOutlineRefresh,
  HiOutlineLightBulb,
  HiOutlineChartBar,
  HiOutlineShieldCheck,
  HiOutlineQuestionMarkCircle,
  HiOutlineUser,
  HiOutlineClipboardCopy,
  HiOutlineThumbUp,
  HiOutlineThumbDown,
} from "react-icons/hi";

const PINK = "#ff94c0";
const PINK_DARK = "#ff6ba5";
const PINK_LIGHT = "#ffd4e5";
const GREEN = "#afd373";
const GREEN_DARK = "#8fb852";
const GREEN_LIGHT = "#d9ebb8";
const GRADIENT = `linear-gradient(135deg, ${PINK} 0%, ${GREEN} 100%)`;

type Role = "user" | "ai";

interface Message {
  id: string;
  role: Role;
  content: string;
  time: Date;
}

const SUGGESTED_PROMPTS = [
  {
    icon: <HiOutlineChartBar />,
    title: "Analisa Kualitas Udara",
    subtitle: "Bagaimana kondisi udara hari ini?",
    color: PINK,
  },
  {
    icon: <HiOutlineShieldCheck />,
    title: "Cek Efektivitas Filter",
    subtitle: "Apakah filter masih bekerja optimal?",
    color: GREEN,
  },
  {
    icon: <HiOutlineLightBulb />,
    title: "Tips Udara Bersih",
    subtitle: "Cara menjaga kualitas udara ruangan",
    color: PINK,
  },
  {
    icon: <HiOutlineQuestionMarkCircle />,
    title: "Cara Baca AQI",
    subtitle: "Panduan interpretasi nilai AQI",
    color: GREEN,
  },
];

const FALLBACK_RESPONSE =
  "Maaf, aku sedang tidak bisa terhubung ke server AI. Coba lagi sebentar ya. Kamu juga bisa cek Dashboard untuk lihat data real-time kualitas udara & efektivitas filter.";

async function callChatAPI(
  history: Message[],
  context: string
): Promise<string> {
  const payload = {
    messages: history.map((m) => ({ role: m.role, content: m.content })),
    context,
  };
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    throw new Error(`API ${res.status}`);
  }
  const data = (await res.json()) as { reply?: string };
  return data.reply || FALLBACK_RESPONSE;
}

export default function ChatPage() {
  const { snapshot } = useSensorData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isTyping]);

  async function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: Message = {
      id: `u-${Date.now()}`,
      role: "user",
      content: trimmed,
      time: new Date(),
    };
    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput("");
    setIsTyping(true);

    try {
      const reply = await callChatAPI(nextHistory, snapshot());
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "ai", content: reply, time: new Date() },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        { id: `a-${Date.now()}`, role: "ai", content: FALLBACK_RESPONSE, time: new Date() },
      ]);
    } finally {
      setIsTyping(false);
    }
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    sendMessage(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }

  function handleInputChange(e: React.ChangeEvent<HTMLTextAreaElement>) {
    setInput(e.target.value);
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto";
      el.style.height = Math.min(el.scrollHeight, 160) + "px";
    }
  }

  function resetChat() {
    setMessages([]);
    setInput("");
  }

  const hasMessages = messages.length > 0;

  return (
    <div className="flex flex-col h-[calc(100dvh-140px)] -mb-24 max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 border-b border-gray-100 bg-white">
        <div className="flex items-center gap-3">
          <div className="relative">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center text-white text-xl shadow-md"
              style={{ background: GRADIENT }}
            >
              <HiOutlineSparkles />
            </div>
            <span
              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white"
              style={{ background: GREEN_DARK }}
            />
          </div>
          <div>
            <h1 className="font-semibold text-gray-900 leading-tight">Oxivera AI</h1>
            <p className="text-xs text-gray-500 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: GREEN_DARK }} />
              Online · Asisten kualitas udara
            </p>
          </div>
        </div>

        {hasMessages && (
          <button
            onClick={resetChat}
            className="flex items-center gap-1.5 text-xs font-medium text-gray-500 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-gray-100 transition"
          >
            <HiOutlineRefresh /> Chat Baru
          </button>
        )}
      </div>

      {/* Body */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 bg-gray-50">
        {!hasMessages ? (
          <EmptyState onPick={sendMessage} />
        ) : (
          <div className="space-y-4">
            {messages.map((m) => (
              <MessageBubble key={m.id} message={m} />
            ))}
            {isTyping && <TypingBubble />}
          </div>
        )}
      </div>

      {/* Input */}
      <div className="px-4 sm:px-6 py-3 bg-white border-t border-gray-100">
        <form onSubmit={handleSubmit} className="relative">
          <div
            className="flex items-end gap-2 bg-gray-50 rounded-2xl border border-gray-200 p-2 focus-within:border-transparent transition"
            style={{
              boxShadow: input ? `0 0 0 2px ${PINK}` : undefined,
            }}
          >
            <textarea
              ref={textareaRef}
              rows={1}
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              placeholder="Tanya apa saja tentang kualitas udaramu..."
              className="flex-1 bg-transparent resize-none outline-none text-sm text-gray-800 placeholder-gray-400 px-2 py-2 max-h-40"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-sm disabled:opacity-40 disabled:cursor-not-allowed transition hover:shadow-md"
              style={{ background: GRADIENT }}
              aria-label="Kirim"
            >
              <HiOutlinePaperAirplane className="text-lg rotate-90" />
            </button>
          </div>
          <p className="text-[10px] text-gray-400 mt-2 text-center">
            Oxivera AI dapat membuat kesalahan · Verifikasi data penting di Dashboard
          </p>
        </form>
      </div>
    </div>
  );
}

/* ───────────── SUB COMPONENTS ───────────── */

function EmptyState({ onPick }: { onPick: (text: string) => void }) {
  return (
    <div className="h-full flex flex-col items-center justify-center text-center py-8">
      <div
        className="w-16 h-16 rounded-3xl flex items-center justify-center text-white text-3xl shadow-lg mb-5"
        style={{ background: GRADIENT }}
      >
        <HiOutlineSparkles />
      </div>
      <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
        Halo! Aku{" "}
        <span
          style={{
            background: GRADIENT,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          Oxivera AI
        </span>
      </h2>
      <p className="text-sm text-gray-500 max-w-md mb-8">
        Tanya apa saja tentang kualitas udara, efektivitas filter, atau minta tips untuk menjaga
        udara rumahmu tetap bersih.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl">
        {SUGGESTED_PROMPTS.map((p, i) => (
          <button
            key={i}
            onClick={() => onPick(p.subtitle)}
            className="group flex items-start gap-3 p-4 bg-white border border-gray-200 rounded-2xl hover:shadow-md hover:border-transparent transition text-left"
          >
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-lg shrink-0 shadow-sm group-hover:scale-110 transition"
              style={{ background: p.color }}
            >
              {p.icon}
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-gray-900 mb-0.5">{p.title}</div>
              <div className="text-xs text-gray-500 leading-relaxed">{p.subtitle}</div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: Message }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div className={`flex gap-3 ${isUser ? "flex-row-reverse" : "flex-row"}`}>
      <div
        className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white shadow-sm ${
          isUser ? "text-base" : "text-lg"
        }`}
        style={{
          background: isUser ? "#6b7280" : GRADIENT,
        }}
      >
        {isUser ? <HiOutlineUser /> : <HiOutlineSparkles />}
      </div>

      <div className={`flex flex-col gap-1 max-w-[85%] sm:max-w-[75%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
            isUser
              ? "text-white rounded-tr-sm"
              : "bg-white border border-gray-200 text-gray-800 rounded-tl-sm"
          }`}
          style={
            isUser
              ? { background: GRADIENT }
              : undefined
          }
        >
          <FormattedText text={message.content} />
        </div>

        <div
          className={`flex items-center gap-2 text-[10px] text-gray-400 px-1 ${
            isUser ? "flex-row-reverse" : "flex-row"
          }`}
        >
          <span>{formatTime(message.time)}</span>
          {!isUser && (
            <>
              <button
                onClick={handleCopy}
                className="hover:text-gray-700 transition"
                title={copied ? "Disalin!" : "Salin"}
              >
                <HiOutlineClipboardCopy />
              </button>
              <button className="hover:text-gray-700 transition" title="Suka">
                <HiOutlineThumbUp />
              </button>
              <button className="hover:text-gray-700 transition" title="Tidak suka">
                <HiOutlineThumbDown />
              </button>
              {copied && <span style={{ color: GREEN_DARK }}>Disalin!</span>}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function TypingBubble() {
  return (
    <div className="flex gap-3">
      <div
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 text-white text-lg shadow-sm"
        style={{ background: GRADIENT }}
      >
        <HiOutlineSparkles />
      </div>
      <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
        <div className="flex gap-1">
          <span
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ background: PINK, animationDelay: "0ms" }}
          />
          <span
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ background: GREEN, animationDelay: "150ms" }}
          />
          <span
            className="w-2 h-2 rounded-full animate-bounce"
            style={{ background: PINK_DARK, animationDelay: "300ms" }}
          />
        </div>
      </div>
    </div>
  );
}

function FormattedText({ text }: { text: string }) {
  const lines = text.split("\n");
  return (
    <>
      {lines.map((line, i) => {
        if (line.trim() === "") return <br key={i} />;
        return (
          <div key={i} className={i > 0 ? "mt-1" : ""}>
            {renderInline(line)}
          </div>
        );
      })}
    </>
  );
}

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} style={{ color: PINK_DARK }}>
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" });
}
