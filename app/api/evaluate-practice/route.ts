import OpenAI from "openai";
import { NextResponse } from "next/server";

type PracticeEvaluation = {
  pronunciation_score: number;
  accent_score: number;
  fluency_score: number;
  naturalness_score: number;
  completeness_score: number;
  summary: string;
  accent_focus: string;
  pronunciation_drill: string;
  audio_note: string;
  better_version: string;
  next_step: string;
};

const evaluationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    pronunciation_score: { type: "integer", minimum: 0, maximum: 100 },
    accent_score: { type: "integer", minimum: 0, maximum: 100 },
    fluency_score: { type: "integer", minimum: 0, maximum: 100 },
    naturalness_score: { type: "integer", minimum: 0, maximum: 100 },
    completeness_score: { type: "integer", minimum: 0, maximum: 100 },
    summary: { type: "string" },
    accent_focus: { type: "string" },
    pronunciation_drill: { type: "string" },
    audio_note: { type: "string" },
    better_version: { type: "string" },
    next_step: { type: "string" },
  },
  required: [
    "pronunciation_score",
    "accent_score",
    "fluency_score",
    "naturalness_score",
    "completeness_score",
    "summary",
    "accent_focus",
    "pronunciation_drill",
    "audio_note",
    "better_version",
    "next_step",
  ],
} as const;

function buildSystemPrompt() {
  return "You are SpeakVault, a supportive English speaking coach for a Chinese native speaker in Auckland who works as a tax accountant. Evaluate spoken workplace English. Be practical, concise, and encouraging. Prefer NZ/AU workplace English. Score pronunciation, accent, and fluency conservatively from transcript quality, input mode, recording duration, and likely Chinese-speaker pronunciation risks. Give concrete accent correction advice such as stress, rhythm, linking, final consonants, vowel contrast, or intonation. If input_mode is voice, audio_note should mention the recording duration and that full waveform-level analysis is not yet available. If input_mode is typed, audio_note should say this was typed and recommend recording audio for stronger accent feedback.";
}

function buildUserPrompt(
  transcript: string,
  targetExpression: string,
  chinesePrompt: string,
  inputMode: string,
  audioDurationMs: number,
) {
  return `Chinese prompt: ${chinesePrompt}
Target expression: ${targetExpression}
User transcript: ${transcript}
Input mode: ${inputMode}
Recording duration: ${(audioDurationMs / 1000).toFixed(1)} seconds

Evaluate whether the user's spoken answer expresses the same intent naturally. Return scores and short feedback. The better_version should be a speakable version close to the user's intent, not a long written sentence.

For accent_focus, name the most useful pronunciation/accent correction point for a Chinese native speaker saying this sentence. For pronunciation_drill, give one short repeatable drill the user can say aloud. For fluency_score, consider whether the expression is concise, smoothly paced, and complete for a workplace meeting.`;
}

export async function POST(request: Request) {
  const { transcript, targetExpression, chinesePrompt, inputMode, audioDurationMs } = (await request.json()) as {
    transcript?: string;
    targetExpression?: string;
    chinesePrompt?: string;
    inputMode?: string;
    audioDurationMs?: number;
  };

  const trimmedTranscript = transcript?.trim();
  const trimmedTarget = targetExpression?.trim();
  const trimmedPrompt = chinesePrompt?.trim();
  const safeInputMode = inputMode === "voice" ? "voice" : "typed";
  const safeAudioDurationMs = typeof audioDurationMs === "number" && Number.isFinite(audioDurationMs) ? audioDurationMs : 0;

  if (!trimmedTranscript || !trimmedTarget || !trimmedPrompt) {
    return NextResponse.json({ error: "Missing transcript, target expression, or Chinese prompt." }, { status: 400 });
  }

  try {
    const provider = process.env.AI_PROVIDER ?? "openai";
    const result =
      provider === "anthropic"
        ? await evaluateWithAnthropic(trimmedTranscript, trimmedTarget, trimmedPrompt, safeInputMode, safeAudioDurationMs)
        : await evaluateWithOpenAI(trimmedTranscript, trimmedTarget, trimmedPrompt, safeInputMode, safeAudioDurationMs);

    return NextResponse.json(result);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown AI provider error.";
    const isQuotaError = message.includes("429") || message.toLowerCase().includes("quota");
    const isModelError = message.includes("404") && message.toLowerCase().includes("model");

    return NextResponse.json(
      {
        error: getProviderErrorMessage(message, isQuotaError, isModelError),
      },
      { status: isQuotaError ? 429 : isModelError ? 404 : 500 },
    );
  }
}

function getProviderErrorMessage(message: string, isQuotaError: boolean, isModelError: boolean) {
  const provider = process.env.AI_PROVIDER ?? "openai";

  if (isQuotaError) {
    return `${provider === "anthropic" ? "Claude" : "OpenAI"} quota is unavailable for this API key. Please check billing, credits, or use another API key.`;
  }

  if (isModelError) {
    return `${provider === "anthropic" ? "Claude" : "OpenAI"} could not access the configured model. Try another model in .env.local. Original error: ${message}`;
  }

  return message;
}

async function evaluateWithOpenAI(
  transcript: string,
  targetExpression: string,
  chinesePrompt: string,
  inputMode: string,
  audioDurationMs: number,
): Promise<PracticeEvaluation> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY. Add it to .env.local and restart the dev server.");
  }

  const openai = new OpenAI({ apiKey });
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
    input: [
      {
        role: "system",
        content: buildSystemPrompt(),
      },
      {
        role: "user",
        content: buildUserPrompt(transcript, targetExpression, chinesePrompt, inputMode, audioDurationMs),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "speakvault_practice_evaluation",
        schema: evaluationSchema,
        strict: true,
      },
    },
  });

  return JSON.parse(response.output_text) as PracticeEvaluation;
}

async function evaluateWithAnthropic(
  transcript: string,
  targetExpression: string,
  chinesePrompt: string,
  inputMode: string,
  audioDurationMs: number,
): Promise<PracticeEvaluation> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY. Add it to .env.local and restart the dev server.");
  }

  const configuredModel = process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5-20251001";
  const fallbackModels = ["claude-haiku-4-5-20251001", "claude-sonnet-4-5-20250929"];
  const models = [configuredModel, ...fallbackModels.filter((model) => model !== configuredModel)];
  let lastError = "";

  for (const model of models) {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model,
        max_tokens: 900,
        system: buildSystemPrompt(),
        messages: [
          {
            role: "user",
            content: buildUserPrompt(transcript, targetExpression, chinesePrompt, inputMode, audioDurationMs),
          },
        ],
        tools: [
          {
            name: "evaluate_practice",
            description: "Return a SpeakVault practice evaluation.",
            input_schema: evaluationSchema,
          },
        ],
        tool_choice: {
          type: "tool",
          name: "evaluate_practice",
        },
      }),
    });

    const data = (await response.json()) as {
      content?: Array<{ type: string; name?: string; input?: unknown }>;
      error?: { message?: string };
    };

    if (!response.ok) {
      lastError = `${response.status} ${data.error?.message ?? "Anthropic API request failed."}`;
      if (response.status === 404 && models.length > 1) {
        continue;
      }
      throw new Error(lastError);
    }

    const toolUse = data.content?.find((block) => block.type === "tool_use" && block.name === "evaluate_practice");

    if (!toolUse?.input) {
      throw new Error("Claude did not return a structured practice evaluation.");
    }

    return toolUse.input as PracticeEvaluation;
  }

  throw new Error(lastError || "Anthropic API request failed.");
}
