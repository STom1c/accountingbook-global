import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { createDefaultLedgerIfNotExists } from "@/lib/actions/ledger";
import { getRecentTransactions, getExpenseSummary } from "@/lib/actions/transaction";
import { prisma } from "@/lib/prisma";
import QuickAddTransaction from "@/components/QuickAddTransaction";
import TransactionList from "@/components/TransactionList";
import ThemeToggle from "@/components/ThemeToggle";
import ExpensePieChart from "@/components/ExpensePieChart";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) redirect("/api/auth/signin");

  const [t, authT] = await Promise.all([
    getTranslations("common"),
    getTranslations("auth")
  ]);

  // 1. 取得或產生預設帳本與預設科目
  const ledger = await createDefaultLedgerIfNotExists();
  
  // 重新查詢更新後的 finAccounts，確保畫面顯示齊全
  const updatedAccounts = await prisma.financialAccount.findMany({ where: { ledgerId: ledger.id }});

  // 傳遞給 Client Component，過濾掉無法傳遞的 Decimal
  const plainAccounts = updatedAccounts.map((a: {id: string, name: string, type: string}) => ({
    id: a.id,
    name: a.name,
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
        type: p.account.type
      } : null
    }))
  }));

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "2rem" }}>
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <h1>MoneyBook Dash 🚀</h1>
        <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
          <ThemeToggle />
          <a href="import" style={{ fontSize: "0.9rem", color: "#4285F4", border: "1px solid #4285F4", padding: "0.4rem 0.8rem", borderRadius: "20px", textDecoration: "none" }}>
             📥 舊資料匯入精靈
          </a>
          <span>{session.user.name}</span>
          <a href="/api/auth/signout" style={{ fontSize: "0.9rem", color: "#d9534f" }}>{authT("signOut")}</a>
        </div>
      </header>
      
      <main style={{ display: "flex", gap: "2rem", flexWrap: "wrap", alignItems: "flex-start" }}>
        <div style={{ flex: "1 1 350px", display: "flex", flexDirection: "column", gap: "2rem" }}>
          <QuickAddTransaction ledgerId={ledger.id} accounts={plainAccounts} />
          <ExpensePieChart data={expenseSummary} />
        </div>
        
        <div style={{ flex: "2 1 450px" }}>
          <h3>近期交易記錄</h3>
          <TransactionList transactions={plainTransactions} accounts={plainAccounts} />
        </div>
      </main>
    </div>
  );
}
