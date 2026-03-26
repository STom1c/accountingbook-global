import { NextRequest, NextResponse } from "next/server";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    
    let csvStr = "";
    try {
      // 嘗試用標準 UTF-8 解碼，遇到無效位元組會報錯進入 catch
      const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
      csvStr = utf8Decoder.decode(buffer);
    } catch (e) {
      // 秋草應變：MyAB 是台灣老牌軟體，使用 iconv-lite 解碼 Big5 最穩
      csvStr = iconv.decode(buffer, "big5");
    }

    const records = parse(csvStr, {
      columns: true,
      skip_empty_lines: true,
      bom: true,
      relax_quotes: true,
      relax_column_count: true
    });
    
    if (records.length === 0) return NextResponse.json({ error: "CSV file is empty or invalid format." }, { status: 400 });
    
    const headers = Object.keys(records[0] as object);
    return NextResponse.json({ headers, preview: records.slice(0, 3) });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
