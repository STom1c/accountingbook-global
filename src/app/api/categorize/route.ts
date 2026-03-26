import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { description } = body;
    if (!description) return NextResponse.json({ error: "No description" }, { status: 400 });

    if (!process.env.GEMINI_API_KEY) {
       return NextResponse.json({ error: "Missing API Key" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Please act as an intelligent accountant. I will provide you with a short expense description.
      You must map it to exactly ONE of the following highly specific standard accounting categories for an individual:
      ['飲食', '交通', '居住', '購物', '娛樂', '學習', '醫療', '其他', '薪資', '投資', '其他收入']
      
      Description: "${description}"

      If uncertain or too vague, return "其他".
      Respond using ONLY strict JSON format (do not wrap in markdown):
      {
        "category": "飲食"
      }
    `;

    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { 
        responseMimeType: "application/json",
        temperature: 0.1
      }
    });

    const responseText = result.response.text();
    const jsonStr = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(jsonStr);

    return NextResponse.json(parsed);

  } catch (error: any) {
    console.error("Categorize Error:", error);
    return NextResponse.json({ category: "其他" }); // Graceful fallback
  }
}
