import OpenAI from "openai";
import { NextResponse } from "next/server";

type GeneratedExpression = {
  english: string;
  chinese: string;
  category: string;
  difficulty: "Easy" | "Natural" | "Advanced";
  tags: string[];
  note: string;
  alternatives: string[];
};

type GenerateExpressionsResult = {
  expressions: GeneratedExpression[];
};
type ProfileContext = {
  role?: string;
  major?: string;
  location?: string;
  english_style?: string;
};

const expressionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    expressions: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          english: { type: "string" },
          chinese: { type: "string" },
          category: { type: "string" },
          difficulty: { type: "string", enum: ["Easy", "Natural", "Advanced"] },
          tags: {
            type: "array",
            minItems: 2,
            maxItems: 5,
            items: { type: "string" },
          },
          note: { type: "string" },
          alternatives: {
            type: "array",
            minItems: 2,
            maxItems: 3,
            items: { type: "string" },
          },
        },
        required: ["english", "chinese", "category", "difficulty", "tags", "note", "alternatives"],
      },
    },
  },
  required: ["expressions"],
} as const;

function normalizeProfile(profile?: ProfileContext) {
  return {
    role: profile?.role || "Tax Accountant",
    major: profile?.major || "",
    location: profile?.location || "New Zealand",
    englishStyle: profile?.english_style || "New Zealand",
  };
}

function buildSystemPrompt(profile?: ProfileContext) {
  const context = normalizeProfile(profile);
  const learnerContext =
    context.role === "Student"
      ? `a student in ${context.location}${context.major ? ` majoring in ${context.major}` : ""}`
      : `someone in ${context.location} working as a ${context.role}`;

  return `You are SpeakVault, an English speaking coach for a Chinese native speaker who is ${learnerContext}. Generate practical ${context.englishStyle} English that is natural, concise, and speakable. Do not translate literally. Preserve the user's intent while making the expression more native-like and appropriate for the learner's role, location, and English style.`;
}

function buildUserPrompt(thought: string, profile?: ProfileContext) {
  const context = normalizeProfile(profile);

  return `Chinese thought: ${thought}
Role: ${context.role}
Major: ${context.major || "N/A"}
Location: ${context.location}
English style: ${context.englishStyle}

Return exactly 3 options with this exact difficulty spread:
1. Easy: the simplest speakable version
2. Natural: the most useful native-like workplace version
3. Advanced: a more polished professional version

Make them useful for the learner's profile, daily life, work, or study context when relevant. Include Chinese meaning, tags, alternatives, and a short note explaining why the expression is natural in the selected English style.`;
}

export async function POST(request: Request) {
  const { thought, profile } = (await request.json()) as { thought?: string; profile?: ProfileContext };
  const trimmedThought = thought?.trim();

  if (!trimmedThought) {
    return NextResponse.json({ error: "Please enter a Chinese thought first." }, { status: 400 });
  }

  try {
    const provider = process.env.AI_PROVIDER ?? "openai";
    const result =
      provider === "anthropic"
        ? await generateWithAnthropic(trimmedThought, profile)
        : await generateWithOpenAI(trimmedThought, profile);

    return NextResponse.json(normalizeDifficulties(result));
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

function normalizeDifficulties(result: GenerateExpressionsResult): GenerateExpressionsResult {
  const difficulties: GeneratedExpression["difficulty"][] = ["Easy", "Natural", "Advanced"];

  return {
    expressions: result.expressions.slice(0, 3).map((expression, index) => ({
      ...expression,
      difficulty: difficulties[index] ?? "Natural",
    })),
  };
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

async function generateWithOpenAI(thought: string, profile?: ProfileContext): Promise<GenerateExpressionsResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("Missing OPENAI_API_KEY. Add it to the server environment variables and restart or redeploy.");
  }

  const openai = new OpenAI({ apiKey });
  const response = await openai.responses.create({
    model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
    input: [
      {
        role: "system",
        content: buildSystemPrompt(profile),
      },
      {
        role: "user",
        content: buildUserPrompt(thought, profile),
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "speakvault_expressions",
        schema: expressionSchema,
        strict: true,
      },
    },
  });

  return JSON.parse(response.output_text) as GenerateExpressionsResult;
}

async function generateWithAnthropic(thought: string, profile?: ProfileContext): Promise<GenerateExpressionsResult> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("Missing ANTHROPIC_API_KEY. Add it to the server environment variables and restart or redeploy.");
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
      max_tokens: 1800,
      system: buildSystemPrompt(profile),
      messages: [
        {
          role: "user",
          content: buildUserPrompt(thought, profile),
        },
      ],
      tools: [
        {
          name: "generate_expressions",
          description: "Return exactly 3 SpeakVault expression options.",
          input_schema: expressionSchema,
        },
      ],
      tool_choice: {
        type: "tool",
        name: "generate_expressions",
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

    const toolUse = data.content?.find((block) => block.type === "tool_use" && block.name === "generate_expressions");

    if (!toolUse?.input) {
      throw new Error("Claude did not return structured expressions.");
    }

    return toolUse.input as GenerateExpressionsResult;
  }

  throw new Error(lastError || "Anthropic API request failed.");
}
