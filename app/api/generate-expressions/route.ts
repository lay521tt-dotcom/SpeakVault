import OpenAI from "openai";
import { NextResponse } from "next/server";

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
          difficulty: { type: "string", enum: ["Easy", "Natural", "Advanced", "Softer", "Workplace"] },
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

export async function POST(request: Request) {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "Missing OPENAI_API_KEY. Add it to .env.local and restart the dev server.",
      },
      { status: 500 },
    );
  }

  const { thought } = (await request.json()) as { thought?: string };
  const trimmedThought = thought?.trim();

  if (!trimmedThought) {
    return NextResponse.json({ error: "Please enter a Chinese thought first." }, { status: 400 });
  }

  const openai = new OpenAI({ apiKey });

  try {
    const response = await openai.responses.create({
      model: process.env.OPENAI_MODEL ?? "gpt-5.4-mini",
      input: [
        {
          role: "system",
          content:
            "You are SpeakVault, an English speaking coach for a Chinese native speaker living in Auckland, New Zealand and working as a tax accountant. Generate practical NZ/AU workplace English that is natural, concise, and speakable. Do not translate literally. Preserve the user's intent while making the expression more native-like and professional.",
        },
        {
          role: "user",
          content: `Chinese thought: ${trimmedThought}\n\nReturn exactly 3 options. Make them useful for workplace meetings, daily life, or tax/accounting contexts when relevant. Include Chinese meaning, difficulty, tags, alternatives, and a short note explaining why the expression is natural.`,
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

    return NextResponse.json(JSON.parse(response.output_text));
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OpenAI error.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
