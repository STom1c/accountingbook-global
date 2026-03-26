import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { parse } from "csv-parse/sync";
import * as iconv from "iconv-lite";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const formData = await req.formData();
    const file = formData.get("file") as File;
    const ledgerId = formData.get("ledgerId") as string;
    const mappingStr = formData.get("mapping") as string;
    const mapping = JSON.parse(mappingStr);
    
    if (!file || !ledgerId) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    
    let csvStr = "";
    try {
      const utf8Decoder = new TextDecoder("utf-8", { fatal: true });
      csvStr = utf8Decoder.decode(buffer);
    } catch (e) {
      csvStr = iconv.decode(buffer, "big5");
    }

    const records = parse(csvStr, { 
      columns: true, 
      skip_empty_lines: true, 
      bom: true,
      relax_quotes: true,
      relax_column_count: true
    });

    let accounts = await prisma.financialAccount.findMany({ where: { ledgerId } });
    
    // --- 💰 智能演算法：從明細反推支出類別 ---
    const guessExpenseCategory = (text: string) => {
       const t = text.toLowerCase();
       if (/加油|過路費|停車|捷運|高鐵|火車|計程車|機車|維修|保養|車票|機票/.test(t)) return "交通";
       if (/早餐|午餐|晚餐|飲料|咖啡|便當|麵包|餅乾|餐廳|全家|7-11|萊爾富|ok|飲食|餐/.test(t)) return "飲食";
       if (/房租|水費|電費|瓦斯|網路|保全|電信|電話費|管理費|家具|家飾/.test(t)) return "居住";
       if (/衣服|鞋子|超市|全聯|家樂福|大潤發|化妝品|日用品|文具|保養品|購物/.test(t)) return "購物";
       if (/電影|唱歌|遊戲|玩具|ktv|旅遊|門票|展覽|訂閱|netflix|spotify|休閒/.test(t)) return "娛樂";
       if (/書|課程|學費|補習|講義|雜誌|進修/.test(t)) return "學習";
       if (/看診|掛號|醫|藥|診所|保健|保險|健身/.test(t)) return "醫療";
       if (/薪水|薪資|獎金|津貼|回饋/.test(t)) return "薪資"; 
       if (/股息|利息|投資|基金|股票/.test(t)) return "投資"; 
       return null;
    };

    // --- 🏦 智能演算法：從字眼判斷支付方式 (資產/負債) ---
    const guessAssetAccount = (text: string) => {
       const t = text.toLowerCase();
       if (/信用卡|刷卡|大華卡|visa|mastercard|jcb/.test(t)) return "信用卡";
       if (/現金|鈔|零錢/.test(t)) return "現金";
       if (/銀行|轉帳|匯款|存款|支存|活存|atm/.test(t)) return "銀行帳戶";
       return text; // 保留原原本本的名字如果猜不到
    };

    const txBatch = [];
    
    for (const row of records as any[]) {
       let dateStr = row[mapping.date];
       let amountStr = row[mapping.amount];
       if (!dateStr || !amountStr) continue;

       let rawFrom = row[mapping.fromAccount] || "";
       let rawTo = row[mapping.toAccount] || "";
       let rawDesc = row[mapping.description] || "";
       // 嘗試融合備註做完整明細
       if (row["備註"] && row["備註"] !== rawDesc) rawDesc += ` (${row["備註"]})`;

       let fromName = rawFrom ? guessAssetAccount(rawFrom) : "現金";
       
       // 如果沒有對應好「目的類別」欄位，就呼叫智能分類演算法！
       let toName = rawTo;
       if (!toName) {
         toName = guessExpenseCategory(rawDesc) || "其他";
       }

       // 帳戶動態建立檢核
       let fromAcc = accounts.find((a: any) => a.name === fromName);
       if(!fromAcc){
          fromAcc = await prisma.financialAccount.create({ data: { ledgerId, name: fromName, type: "ASSET" }});
          accounts.push(fromAcc);
       }
       
       let toAcc = accounts.find((a: any) => a.name === toName);
       if(!toAcc){
          toAcc = await prisma.financialAccount.create({ data: { ledgerId, name: toName, type: "EXPENSE" }});
          accounts.push(toAcc);
       }

       let amtMatch = amountStr.toString().replace(/,/g, '');
       const amt = Math.abs(Number(amtMatch));
       const parsedDate = new Date(dateStr.replace(/\//g, "-"));

       txBatch.push({
          date: isNaN(parsedDate.getTime()) ? new Date() : parsedDate,
          description: rawDesc,
          fromAccountId: fromAcc.id,
          toAccountId: toAcc.id,
          amount: amt
       });
    }

    // 將所有交易逐一寫入雙重簿記中
    let imported = 0;
    for (const t of txBatch) {
        await prisma.transaction.create({
            data: {
               ledgerId,
               date: t.date,
               description: t.description,
               postings: {
                   create: [
                       { accountId: t.fromAccountId, amount: -t.amount, currency: "TWD" },
                       { accountId: t.toAccountId, amount: t.amount, currency: "TWD" }
                   ]
               }
            }
        });
        imported++;
    }

    return NextResponse.json({ success: true, imported });

  } catch (err: any) {
    console.error("Import Error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
