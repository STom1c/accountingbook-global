"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function createDefaultLedgerIfNotExists() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const userId = session.user.id;

  // 取得使用者的語系偏好 (Design for Global Use)
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { locale: true } });
  const userLocale = user?.locale || "zh-TW";

  // 全球化在地預設會計科目字典
  const globalTemplates: Record<string, {name: string, type: 'ASSET' | 'LIABILITY' | 'EXPENSE' | 'INCOME'}[]> = {
    "zh-TW": [
      { name: "現金", type: "ASSET" }, { name: "銀行帳戶", type: "ASSET" }, { name: "信用卡", type: "LIABILITY" },
      { name: "飲食", type: "EXPENSE" }, { name: "交通", type: "EXPENSE" }, { name: "居住", type: "EXPENSE" }, 
      { name: "購物", type: "EXPENSE" }, { name: "娛樂", type: "EXPENSE" }, { name: "學習", type: "EXPENSE" }, 
      { name: "醫療", type: "EXPENSE" }, { name: "其他", type: "EXPENSE" }, 
      { name: "薪資", type: "INCOME" }, { name: "投資", type: "INCOME" }, { name: "其他收入", type: "INCOME" }
    ],
    "ja": [
      { name: "現金", type: "ASSET" }, { name: "銀行口座", type: "ASSET" }, { name: "クレジットカード", type: "LIABILITY" },
      { name: "食費", type: "EXPENSE" }, { name: "交通費", type: "EXPENSE" }, { name: "住居費", type: "EXPENSE" },
      { name: "日用品", type: "EXPENSE" }, { name: "交際・娯楽", type: "EXPENSE" }, { name: "教育・教養", type: "EXPENSE" },
      { name: "医療・保険", type: "EXPENSE" }, { name: "その他", type: "EXPENSE" }, 
      { name: "給与", type: "INCOME" }, { name: "投資", type: "INCOME" }, { name: "その他収入", type: "INCOME" }
    ],
    "zh-CN": [
      { name: "现金", type: "ASSET" }, { name: "银行账户", type: "ASSET" }, { name: "信用卡", type: "LIABILITY" },
      { name: "餐饮", type: "EXPENSE" }, { name: "交通", type: "EXPENSE" }, { name: "居住", type: "EXPENSE" },
      { name: "购物", type: "EXPENSE" }, { name: "娱乐", type: "EXPENSE" }, { name: "学习", type: "EXPENSE" },
      { name: "医疗", type: "EXPENSE" }, { name: "其他", type: "EXPENSE" }, 
      { name: "工资", type: "INCOME" }, { name: "投资", type: "INCOME" }, { name: "其他收入", type: "INCOME" }
    ],
    "th": [
      { name: "เงินสด", type: "ASSET" }, { name: "บัญชีธนาคาร", type: "ASSET" }, { name: "บัตรเครดิต", type: "LIABILITY" },
      { name: "อาหาร", type: "EXPENSE" }, { name: "เดินทาง", type: "EXPENSE" }, { name: "ที่พัก", type: "EXPENSE" },
      { name: "ช้อปปิ้ง", type: "EXPENSE" }, { name: "บันเทิง", type: "EXPENSE" }, { name: "การศึกษา", type: "EXPENSE" },
      { name: "สุขภาพ", type: "EXPENSE" }, { name: "อื่นๆ", type: "EXPENSE" }, 
      { name: "เงินเดือน", type: "INCOME" }, { name: "ลงทุน", type: "INCOME" }, { name: "รายได้อื่นๆ", type: "INCOME" }
    ],
    "ms": [
      { name: "Tunai", type: "ASSET" }, { name: "Akaun Bank", type: "ASSET" }, { name: "Kad Kredit", type: "LIABILITY" },
      { name: "Makanan", type: "EXPENSE" }, { name: "Pengangkutan", type: "EXPENSE" }, { name: "Perumahan", type: "EXPENSE" },
      { name: "Membeli-belah", type: "EXPENSE" }, { name: "Hiburan", type: "EXPENSE" }, { name: "Pendidikan", type: "EXPENSE" },
      { name: "Perubatan", type: "EXPENSE" }, { name: "Lain-lain", type: "EXPENSE" }, 
      { name: "Gaji", type: "INCOME" }, { name: "Pelaburan", type: "INCOME" }, { name: "Lain-lain Pendapatan", type: "INCOME" }
    ],
    "en": [
      { name: "Cash", type: "ASSET" }, { name: "Bank Account", type: "ASSET" }, { name: "Credit Card", type: "LIABILITY" },
      { name: "Dining", type: "EXPENSE" }, { name: "Transport", type: "EXPENSE" }, { name: "Housing", type: "EXPENSE" },
      { name: "Shopping", type: "EXPENSE" }, { name: "Entertainment", type: "EXPENSE" }, { name: "Education", type: "EXPENSE" },
      { name: "Medical", type: "EXPENSE" }, { name: "Others", type: "EXPENSE" }, 
      { name: "Salary", type: "INCOME" }, { name: "Investment", type: "INCOME" }, { name: "Other Income", type: "INCOME" }
    ]
  };

  const seedAccounts = globalTemplates[userLocale] || globalTemplates["en"];

  // 檢查是否已有帳本
  let ledger = await prisma.ledger.findFirst({
    where: { userId },
    include: { finAccounts: true },
  });

  if (!ledger) {
    // 依據使用者的地理/語言屬性，載入對應區域的公用會計科目
    ledger = await prisma.ledger.create({
      data: {
        userId,
        name: userLocale === "ja" ? "私の帳簿" : (userLocale === "en" ? "My Ledger" : "我的帳本 (預設)"),
        finAccounts: {
          create: seedAccounts as any,
        },
      },
      include: { finAccounts: true },
    });
  } else {
    // 執行舊重複資料自動合併清理與補齊 (Hot-patch)
    await provisionAndCleanStandardCategories(ledger.id, userLocale, globalTemplates);
  }

  return ledger;
}

export async function provisionAndCleanStandardCategories(ledgerId: string, userLocale: string, globalTemplates: any) {
  // 1. 補齊缺乏的極簡標準分類
  const standard = globalTemplates[userLocale] || globalTemplates["zh-TW"];
  const standardNames = standard.map((s: any) => s.name);
  
  const existing = await prisma.financialAccount.findMany({ where: { ledgerId }});
  const existingNames = new Set(existing.map((e: {name: string}) => e.name));
  
  const toAdd = standard.filter((s: {name: string}) => !existingNames.has(s.name));
  if (toAdd.length > 0) {
    await prisma.financialAccount.createMany({
      data: toAdd.map((s: any) => ({
        ledgerId,
        name: s.name,
        type: s.type
      }))
    });
  }

  // 2. 深度清理與合併：將舊的臃腫標籤或重複項目強制映射到極簡清單
  if (userLocale === "zh-TW") {
    // 舊 -> 新的核心映射表
    const migrationMap: Record<string, string> = {
      "餐飲": "飲食",
      "伙食/餐飲": "飲食",
      "交通 (通勤/油料)": "交通",
      "通勤": "交通",
      "購物": "購物",
      "日常用品": "購物",
      "治裝美容": "購物",
      "住居": "居住",
      "住居 (房租/房貸)": "居住",
      "水電瓦斯": "居住",
      "通信/網路": "居住",
      "娛樂": "娛樂",
      "休閒娛樂": "娛樂",
      "娛樂/交際": "娛樂",
      "交際/送禮": "娛樂",
      "訂閱/會員": "娛樂",
      "醫療保健": "醫療",
      "保險": "其他",
      "稅捐": "其他",
      "雜支": "其他",
      "薪資收入": "薪資",
      "投資收益": "投資"
    };

    // 抓出最新的帳戶清單以取得正確的 ID 映射
    const latestAccounts = await prisma.financialAccount.findMany({ where: { ledgerId }});
    const accountDict = Object.fromEntries(latestAccounts.map((a: {name: string, id: string}) => [a.name, a.id]));

    // 第一階段：把所有舊標籤的帳轉移到新標籤下
    for (const [oldName, newName] of Object.entries(migrationMap)) {
      if (oldName !== newName && accountDict[oldName] && accountDict[newName]) {
        await prisma.posting.updateMany({
          where: { accountId: accountDict[oldName] },
          data: { accountId: accountDict[newName] }
        });
      }
    }

    // 第二階段：無痛刪除那些不再被使用的舊空殼標籤
    const afterMigrateAccounts = await prisma.financialAccount.findMany({ 
      where: { ledgerId },
      include: { _count: { select: { postings: true } } }
    });

    const standardSet = new Set(standardNames);
    
    // 如果這個 Account 不在「極簡標準清單」內，而且目前沒有任何交易紀錄，就直接刪光！
    for (const acc of afterMigrateAccounts) {
      if (!standardSet.has(acc.name) && acc._count.postings === 0) {
        await prisma.financialAccount.delete({ where: { id: acc.id } });
      }
    }
  }
}

export async function addFinancialAccount(data: { ledgerId: string, name: string, type: any }) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // 避免重複建立：利用 ledgerId 與 name
  const existing = await prisma.financialAccount.findFirst({
    where: { ledgerId: data.ledgerId, name: data.name, type: data.type }
  });
  if (existing) return existing;

  const newAccount = await prisma.financialAccount.create({ data });
  revalidatePath("/dashboard");
  return newAccount;
}
