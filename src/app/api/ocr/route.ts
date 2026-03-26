import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";
import { auth } from "@/lib/auth";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get("image") as File;
    if (!file) return NextResponse.json({ error: "No image found" }, { status: 400 });

    const buffer = await file.arrayBuffer();
    const base64Data = Buffer.from(buffer).toString("base64");
    const mimeType = file.type;

    if (!process.env.GEMINI_API_KEY) {
       return NextResponse.json({ error: "Gemini API Key is missing from .env" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const prompt = `
      Please act as an accountant analyzing a receipt or invoice. 
      Extract the total final amount paid (as a strict number), a concise and descriptive summary containing the store/vendor name and primary purchased items (using precise Traditional Chinese), and smartly map this expense into exactly ONE of the following specific category strings: 
      [飲食, 交通, 居住, 購物, 娛樂, 學習, 醫療, 其他, 薪資, 投資, 其他收入]. 
      If you are unsure of the category, choose "其他".
      
      You must respond mathematically and accurately based on the image only, and strictly follow this JSON object schema exactly (do not wrap in markdown):
      {
        "amount": 150,
        "description": "全家便利商店 - 咖啡與便當",
        "category": "飲食"
      }
    `;

    const result = await model.generateContent({
      contents: [{
        role: "user",
        parts: [
          { text: prompt },
          { inlineData: { data: base64Data, mimeType } }
        ]
      }],
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
    console.error("OCR Parse Error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse receipt" }, { status: 500 });
  }
}
