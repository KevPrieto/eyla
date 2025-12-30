import { NextResponse } from "next/server";
import OpenAI from "openai";

export async function POST(req: Request) {
  try {
    const { idea } = await req.json();

    if (!idea || idea.trim().length === 0) {
      return NextResponse.json(
        { error: "Idea is required" },
        { status: 400 }
      );
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    });

    const prompt = `
    Convert the following idea into a clean, structured roadmap.
    
    The roadmap must follow EXACTLY this JSON format:

    {
      "phases": [
        {
          "name": "string",
          "steps": ["string", "string", "string"]
        }
      ]
    }

    Keep it simple, clear, actionable, and avoid long paragraphs.
    Idea: ${idea}
    `;

    const completion = await client.responses.create({
      model: "gpt-4.1-mini",
      input: prompt
    });

    // Type-safe access to completion output
    const firstOutput = completion.output[0];
    if (!firstOutput || !('content' in firstOutput) || !Array.isArray(firstOutput.content)) {
      throw new Error("Unexpected response format from OpenAI");
    }
    const textContent = firstOutput.content[0];
    if (!textContent || !('text' in textContent)) {
      throw new Error("No text content in response");
    }
    const textOutput = textContent.text as string;
    const result = JSON.parse(textOutput);

    return NextResponse.json(result);
  } catch (e: any) {
    console.error("Roadmap generation error:", e);
    return NextResponse.json(
      { error: "Failed to generate roadmap" },
      { status: 500 }
    );
  }
}
