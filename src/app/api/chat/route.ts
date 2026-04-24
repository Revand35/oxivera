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

function listApiKeys(): string[] {
  const multi = process.env.GEMINI_API_KEYS || "";
  const single =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_API_KEY ||
    process.env.NEXT_PUBLIC_GEMINI_API_KEY ||
    "";
  return [...multi.split(","), single].map((k) => k.trim()).filter(Boolean);
}

function listAnthropicKeys(): string[] {
  const multi = process.env.ANTHROPIC_API_KEYS || "";
  const single = process.env.ANTHROPIC_API_KEY || "";
  return [...multi.split(","), single].map((k) => k.trim()).filter(Boolean);
}

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function localFallbackReply(context: string): string {
  const lines = context.split("\n").map((line) => line.trim());
  const aqiBefore = lines.find((line) => line.includes("AQI Sebelum Filter"));
  const aqiAfter = lines.find((line) => line.includes("AQI Sesudah Filter"));
  const eff = lines.find((line) => line.includes("Efektivitas Filter Rata-rata"));
  const conn = lines.find((line) => line.includes("Koneksi RTDB"));

  return [
    "Mode fallback aktif karena koneksi AI eksternal belum tersedia.",
    conn ? `• ${conn.replace("• ", "")}` : "• Koneksi perangkat belum terbaca.",
    aqiBefore ? `• ${aqiBefore.replace("• ", "")}` : "",
    aqiAfter ? `• ${aqiAfter.replace("• ", "")}` : "",
    eff ? `• ${eff.replace("• ", "")}` : "",
    "Untuk respons AI penuh, isi `ANTHROPIC_API_KEY` atau `GEMINI_API_KEY` di environment server.",
  ]
    .filter(Boolean)
    .join("\n");
}

interface ClientMessage {
  role: "user" | "ai";
  content: string;
}

function pickModels(): string[] {
  const raw =
    process.env.GEMINI_MODELS ||
    process.env.GEMINI_MODEL ||
    "gemini-2.5-flash,gemini-1.5-flash";
  return raw
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

function pickAnthropicModels(): string[] {
  const raw =
    process.env.ANTHROPIC_MODELS ||
    process.env.ANTHROPIC_MODEL ||
    "claude-3-5-sonnet-latest";
  return raw
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function shouldRetry(status: number): boolean {
  return status === 429 || status === 503 || status >= 500;
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

    const geminiKeys = listApiKeys();

    const contents = messages.map((m) => ({
      role: m.role === "ai" ? "model" : "user",
      parts: [{ text: m.content }],
    }));

    // Inject live monitoring snapshot into system prompt so AI can ground its answers
    // on the user's actual sensor data (Dashboard & Analytics see the same data).
    const fullSystemPrompt = context
      ? `${SYSTEM_PROMPT}\n\n---\n\n${context}\n\nGunakan data di atas saat user bertanya tentang kondisi udara, efektivitas filter, atau status perangkat mereka. Sebut angka aktualnya — jangan mengarang atau pakai contoh generik.`
      : SYSTEM_PROMPT;

    const models = pickModels();
    const anthropicModels = pickAnthropicModels();
    const anthropicKeys = listAnthropicKeys();
    let lastError: { status: number; detail: string; model: string; provider: string } | null = null;

    const retryDelaysMs = [0, 500, 1200];

    // Prioritas Claude (Anthropic).
    if (anthropicKeys.length > 0) {
      for (const model of anthropicModels) {
        const keysForThisModel = shuffle(anthropicKeys);

        for (const apiKey of keysForThisModel) {
          for (let attempt = 0; attempt < retryDelaysMs.length; attempt++) {
            if (retryDelaysMs[attempt] > 0) {
              const jitter = Math.floor(Math.random() * 200);
              await sleep(retryDelaysMs[attempt] + jitter);
            }

            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 12000);

            let anthropicRes: Response;
            try {
              anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
                method: "POST",
                headers: {
                  "content-type": "application/json",
                  "anthropic-version": "2023-06-01",
                  "x-api-key": apiKey,
                },
                body: JSON.stringify({
                  model,
                  max_tokens: 1024,
                  temperature: 0.8,
                  system: fullSystemPrompt,
                  messages: messages.map((m) => ({
                    role: m.role === "ai" ? "assistant" : "user",
                    content: m.content,
                  })),
                }),
                signal: controller.signal,
              });
            } catch (error) {
              clearTimeout(timeout);
              lastError = {
                status: 500,
                detail: error instanceof Error ? error.message : "Network error",
                model,
                provider: "anthropic",
              };
              console.error(
                `Anthropic fetch error (${model}, attempt ${attempt + 1}/${retryDelaysMs.length}):`,
                error
              );
              continue;
            } finally {
              clearTimeout(timeout);
            }

            if (!anthropicRes.ok) {
              const errorText = await anthropicRes.text();
              lastError = {
                status: anthropicRes.status,
                detail: errorText,
                model,
                provider: "anthropic",
              };
              console.error(
                `Anthropic API error (${model}, attempt ${attempt + 1}/${retryDelaysMs.length}):`,
                anthropicRes.status,
                errorText
              );

              if (shouldRetry(anthropicRes.status)) {
                continue;
              }
              break;
            }

            const data = await anthropicRes.json();
            const text =
              data?.content
                ?.map((part: { type?: string; text?: string }) =>
                  part?.type === "text" ? part.text || "" : ""
                )
                .join("")
                .trim() ||
              "Maaf, aku tidak bisa menjawab itu sekarang. Coba tanyakan hal lain ya.";

            return NextResponse.json({ reply: text, source: "anthropic", model });
          }
        }
      }
    }

    // Fallback ke Gemini jika Claude tidak tersedia.
    for (const model of models) {
      const keysForThisModel = shuffle(geminiKeys);

      for (const apiKey of keysForThisModel) {
        const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

        for (let attempt = 0; attempt < retryDelaysMs.length; attempt++) {
          if (retryDelaysMs[attempt] > 0) {
            // Small jitter to reduce synchronized retries when traffic spikes.
            const jitter = Math.floor(Math.random() * 200);
            await sleep(retryDelaysMs[attempt] + jitter);
          }

          const controller = new AbortController();
          const timeout = setTimeout(() => controller.abort(), 12000);

          let geminiRes: Response;
          try {
            geminiRes = await fetch(geminiUrl, {
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
              signal: controller.signal,
            });
          } catch (error) {
            clearTimeout(timeout);
            lastError = {
              status: 500,
              detail: error instanceof Error ? error.message : "Network error",
              model,
              provider: "gemini",
            };
            console.error(
              `Gemini fetch error (${model}, attempt ${attempt + 1}/${retryDelaysMs.length}):`,
              error
            );
            continue;
          } finally {
            clearTimeout(timeout);
          }

          if (!geminiRes.ok) {
            const errorText = await geminiRes.text();
            lastError = { status: geminiRes.status, detail: errorText, model, provider: "gemini" };
            console.error(
              `Gemini API error (${model}, attempt ${attempt + 1}/${retryDelaysMs.length}):`,
              geminiRes.status,
              errorText
            );

            if (shouldRetry(geminiRes.status)) {
              continue;
            }
            break;
          }

          const data = await geminiRes.json();
          const text =
            data?.candidates?.[0]?.content?.parts
              ?.map((p: { text?: string }) => p.text || "")
              .join("") ||
            "Maaf, aku tidak bisa menjawab itu sekarang. Coba tanyakan hal lain ya.";

          return NextResponse.json({ reply: text, source: "gemini", model });
        }
      }
    }

    const fallback = localFallbackReply(context);
    return NextResponse.json({
      reply: `${fallback}\n\nCatatan: layanan AI eksternal sedang sibuk, jadi jawaban ini dari mode cadangan.`,
      source: "fallback",
      error: lastError
        ? `${lastError.provider} ${lastError.model} ${lastError.status}`
        : "AI provider unavailable",
    });
  } catch (err) {
    console.error("Chat route error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
