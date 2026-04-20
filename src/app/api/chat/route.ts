import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

const SYSTEM_PROMPT = `Kamu adalah **Oxivera AI**, asisten virtual untuk sistem monitoring filter udara IoT bernama Oxivera.

Oxivera adalah alat filter udara yang punya 2 titik pengukuran sensor: sebelum filter (udara kotor masuk) dan sesudah filter (udara bersih keluar). Data yang dikumpulkan: PM2.5, PM10, CO2, VOC, suhu, kelembaban, dan AQI.

Tugasmu:
- Bantu user memahami data kualitas udara (AQI, PM2.5, PM10, CO2, VOC)
- Analisa efektivitas filter (perbandingan before vs after)
- Status perangkat IoT (ESP32)
- Tips menjaga udara ruangan bersih & sehat
- Rekomendasi kapan ganti filter

Aturan jawaban:
- Selalu Bahasa Indonesia yang ramah dan santai
- Jawab SINGKAT (maksimal 3-4 paragraf atau list pendek). JANGAN panjang lebar.
- Gunakan **bold** untuk istilah / angka penting
- Gunakan bullet list (•) kalau menjelaskan banyak poin
- Boleh pakai emoji relevan (🌬️💨✅⚠️🌿) tapi jangan berlebihan
- Kalau user tanya di luar topik kualitas udara / Oxivera, redirect dengan sopan ke topik yang kamu kuasai
- Jangan mengarang data real user — kalau user tanya data spesifik, sarankan cek Dashboard`;

function pickApiKey(): string | null {
  const raw = process.env.GEMINI_API_KEYS || "";
  const keys = raw.split(",").map((k) => k.trim()).filter(Boolean);
  if (keys.length === 0) return null;
  return keys[Math.floor(Math.random() * keys.length)];
}

interface ClientMessage {
  role: "user" | "ai";
  content: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      messages?: ClientMessage[];
      context?: string;
    };
    const messages = body.messages || [];
    const context = body.context?.trim() || "";

    if (messages.length === 0) {
      return NextResponse.json({ error: "No messages provided" }, { status: 400 });
    }

    const apiKey = pickApiKey();
    if (!apiKey) {
      return NextResponse.json(
        { error: "Gemini API key not configured" },
        { status: 500 }
      );
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const contents = messages.map((m) => ({
      role: m.role === "ai" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Inject live monitoring snapshot into system prompt so AI can ground its answers
    // on the user's actual sensor data (Dashboard & Analytics see the same data).
    const fullSystemPrompt = context
      ? `${SYSTEM_PROMPT}\n\n---\n\n${context}\n\nGunakan data di atas saat user bertanya tentang kondisi udara, efektivitas filter, atau status perangkat mereka. Sebut angka aktualnya — jangan mengarang atau pakai contoh generik.`
      : SYSTEM_PROMPT;

    const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const geminiRes = await fetch(geminiUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: fullSystemPrompt }] },
        contents,
        generationConfig: {
          temperature: 0.8,
          topP: 0.95,
          maxOutputTokens: 1024,
        },
        safetySettings: [
          { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_ONLY_HIGH" },
          { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_ONLY_HIGH" },
        ],
      }),
    });

    if (!geminiRes.ok) {
      const errorText = await geminiRes.text();
      console.error("Gemini API error:", geminiRes.status, errorText);
      return NextResponse.json(
        { error: `Gemini error: ${geminiRes.status}`, detail: errorText },
        { status: 502 }
      );
    }

    const data = await geminiRes.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text || "").join("") ||
      "Maaf, aku tidak bisa menjawab itu sekarang. Coba tanyakan hal lain ya.";

    return NextResponse.json({ reply: text });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
