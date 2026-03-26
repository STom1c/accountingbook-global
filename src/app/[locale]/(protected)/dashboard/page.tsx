import { getTranslations } from "next-intl/server";
import { auth, signOut } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createDefaultLedgerIfNotExists } from "@/lib/actions/ledger";
import { getRecentTransactions, getExpenseSummary } from "@/lib/actions/transaction";
import { prisma } from "@/lib/prisma";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import TransactionList from "@/components/TransactionList";
import ThemeToggle from "@/components/ThemeToggle";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import ExpensePieChart from "@/components/ExpensePieChart";
import Image from "next/image";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  const [t, authT, navT, dashT, catT, accT] = await Promise.all([
    getTranslations("common"),
    getTranslations("auth"),
    getTranslations("nav"),
    getTranslations("dashboard"),
    getTranslations("category"),
    getTranslations("account")
  ]);

  // 1. 取得或產生預設帳本與預設科目
  const ledger = await createDefaultLedgerIfNotExists();
  
  // 重新查詢更新後的 finAccounts，確保畫面顯示齊全
  const updatedAccounts = await prisma.financialAccount.findMany({ where: { ledgerId: ledger.id }});

  // 動態處理字典反解：如果使用者切換到了日文，應該把資料庫裡的「交通」翻譯成「交通費」展示
  const getDisplayName = (name: string) => {
    const cats: Record<string, string> = { "餐飲": "food", "飲食": "food", "交通": "transport", "住居": "housing", "居住": "housing", "娛樂": "entertainment", "醫療": "medical", "教育": "education", "學習": "education", "購物": "shopping", "薪資": "salary", "投資": "investment", "其他": "other" };
    const accs: Record<string, string> = { "現金": "cash", "銀行帳戶": "bankAccount", "信用卡": "creditCard", "悠遊卡": "easyCard" };
    if (cats[name]) return catT(cats[name] as any);
    if (accs[name]) return accT(accs[name] as any);
    return name;
  };

  // 傳遞給 Client Component，過濾掉無法傳遞的 Decimal，並附加 `displayName`
  const plainAccounts = updatedAccounts.map((a: {id: string, name: string, type: string}) => ({
    id: a.id,
    name: a.name,
    displayName: getDisplayName(a.name),
    type: a.type
  }));

  // 2. 獲取記錄與圖表資料
  let recentTransactions = await getRecentTransactions(ledger.id);
  let expenseSummary = await getExpenseSummary(ledger.id);
  
  // 由於 recentTransactions 裡面的 postings 有 Decimal，把它序列化為字串或純數字傳給 Client
  const plainTransactions = recentTransactions.map((trx: any) => ({
    ...trx,
    postings: trx.postings.map((p: any) => ({
      ...p,
      amount: Number(p.amount),
      account: p.account ? {
        id: p.account.id,
        name: p.account.name,
        displayName: getDisplayName(p.account.name),
        type: p.account.type
      } : null
    }))
  }));

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.8rem" }}>
          <Image src="/logo.png" alt="Icon" width={36} height={36} style={{ borderRadius: "8px", boxShadow: "0 2px 5px rgba(0,0,0,0.1)", objectFit: "cover" }} />
          <h1 style={{ margin: 0 }}>MoneyBook Dash</h1>
        </div>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center", flexWrap: "wrap" }}>
          <ThemeToggle />
          <LanguageSwitcher />
          <a href="import" style={{ fontSize: "0.9rem", color: "#4285F4", border: "1px solid #4285F4", padding: "0.4rem 0.8rem", borderRadius: "20px", textDecoration: "none" }}>
             📥 {navT("settings")} / Import Data
          </a>
          <span>{session.user.name}</span>
          <form action={async () => {
            "use server";
            await signOut({ redirectTo: "/" });
          }}>
            <button type="submit" style={{ background: "transparent", border: "none", cursor: "pointer", fontSize: "0.9rem", color: "#d9534f", fontWeight: "bold" }}>
              {authT("signOut")}
            </button>
          </form>
        </div>
      </header>
      
      <main style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 350px", display: "flex", flexDirection: "column", gap: "2rem" }}>
          <QuickAddTransaction ledgerId={ledger.id} accounts={plainAccounts} />
          <ExpensePieChart data={expenseSummary} />
        </div>
        
        <div style={{ flex: "2 1 450px" }}>
          <h3>{dashT("recentTransactions")}</h3>
          <TransactionList transactions={plainTransactions} accounts={plainAccounts} />
        </div>
      </main>
    </div>
  );
}
