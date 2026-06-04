import { NextResponse } from "next/server";

function cleanJsonResponse(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\s*/, "").replace(/\s*```$/, "");
  }
  return cleaned.trim();
}

export async function POST(request: Request) {
  try {
    const { code, errorMessage, language, image, clientApiKey } = await request.json();

    // Prioritize client-provided key, fallback to server environment variable
    const apiKey = clientApiKey?.trim() || process.env.GEMINI_API_KEY?.trim();

    if (!apiKey) {
      return NextResponse.json(
        {
          error: "API_KEY_MISSING",
          message: "No Gemini API Key found. Configure it in settings (gear icon) or set GEMINI_API_KEY on the server.",
        },
        { status: 400 }
      );
    }

    const contentsParts: any[] = [];

    // Image payload handling
    if (image) {
      const mimeType = image.split(";")[0].split(":")[1] || "image/jpeg";
      const base64Data = image.split(",")[1];
      contentsParts.push({
        inlineData: {
          mimeType: mimeType,
          data: base64Data,
        },
      });
    }

    // Diagnostics prompt
    contentsParts.push({
      text: `You are SyntaxSentry, a premium AI coding diagnostics expert. 
Analyze the provided code and identify compilation errors, syntax mistakes, or logical bugs.
Provide a clean solution and an explanation.

${code ? `CODE SNIPPET TO ANALYZE:\n${code}` : "NO DIRECT CODE TEXT PROVIDED (ANALYZE IMAGE)"}
${errorMessage ? `ERROR MESSAGE LOGGED:\n${errorMessage}` : ""}
${language ? `DECLARED CODING LANGUAGE: ${language}` : ""}

If an image is attached, extract the code from the image first using OCR, then diagnose the errors.

You MUST return a JSON response matching exactly this schema:
{
  "language": "detected or selected language (one of: python, javascript, java, c)",
  "originalCode": "the extracted source code from the image, or the original source code passed",
  "errorExplanation": "a detailed explanation of the errors in clean markdown, specifying what was wrong, why it happened, and how it is fixed. Highlight code keywords in backticks.",
  "correctedCode": "the full refactored code solution, formatted correctly and free of all bugs"
}

Return ONLY raw JSON. No markdown code blocks surrounding the JSON.`,
    });

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1/models/gemini-3.5-flash:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey,
        },
        body: JSON.stringify({
          contents: [
            {
              parts: contentsParts,
            },
          ],
        }),
      }
    );

    if (!response.ok) {
      const errorDetails = await response.json();
      throw new Error(errorDetails?.error?.message || "Failed request to Gemini API");
    }

    const data = await response.json();
    const jsonText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!jsonText) {
      throw new Error("Empty response returned from Gemini.");
    }

    const cleanedJsonText = cleanJsonResponse(jsonText);
    const parsedData = JSON.parse(cleanedJsonText);

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Backend diagnostics error:", error);
    return NextResponse.json(
      {
        error: "DIAGNOSTICS_FAILED",
        message: error.message || "An unexpected error occurred during analysis.",
      },
      { status: 500 }
    );
  }
}
