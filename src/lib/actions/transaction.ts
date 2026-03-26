"use server";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { revalidatePath } from "next/cache";

/**
 * 建立交易 (單式輸入轉雙重簿記)
 */
export async function addTransaction(data: {
  ledgerId: string;
  amount: number;
  fromAccountId: string; // 資金來源 (例如現金、信用卡)
  toAccountId: string;   // 資金去向 (例如餐飲支出帳戶)
  date: Date;
  description: string;
  currency?: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  const { ledgerId, amount, fromAccountId, toAccountId, date, description, currency = "TWD" } = data;

  // 雙重簿記邏輯：從 fromAccount 扣除 (貸方/Credit: -amount)，增加到 toAccount (借方/Debit: +amount)
  // 建立一筆 Transaction 包裝兩筆 Posting 以保證平衡
  const transaction = await prisma.transaction.create({
    data: {
      ledgerId,
      date,
      description,
      postings: {
        create: [
          {
            accountId: fromAccountId,
            amount: -Math.abs(amount), // 資金流出: 負值
            currency,
          },
          {
            accountId: toAccountId,
            amount: Math.abs(amount),  // 資金流入: 正值
            currency,
          },
        ],
      },
    },
    include: { postings: true },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getRecentTransactions(ledgerId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  return prisma.transaction.findMany({
    where: { ledgerId },
    orderBy: { date: "desc" },
    take: 10,
    include: { postings: { include: { account: true } } },
  });
}

export async function deleteTransaction(transactionId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  await prisma.transaction.delete({ where: { id: transactionId } });
  revalidatePath("/dashboard");
  return { success: true };
}

export async function updateTransaction(transactionId: string, data: {
  amount: number;
  fromAccountId: string;
  toAccountId: string;
  date: Date;
  description: string;
}) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // 以刪除再重建來保證複式簿記平衡的絕對正確性（或利用 Prisma 的 update）
  // 為了簡潔與安全，我們更新 Transaction 主體的 date/description，並刪除舊的 postings 重新建立
  await prisma.transaction.update({
    where: { id: transactionId },
    data: {
      date: data.date,
      description: data.description,
      postings: {
        deleteMany: {}, // 刪除舊的所有分錄
        create: [
          { accountId: data.fromAccountId, amount: -Math.abs(data.amount), currency: "TWD" },
          { accountId: data.toAccountId, amount: Math.abs(data.amount), currency: "TWD" },
        ]
      }
    }
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getExpenseSummary(ledgerId: string) {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");

  // 取得本月 (簡易實作：抓近 30 天) 的所有支出分錄
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const postings = await prisma.posting.findMany({
    where: {
      transaction: { ledgerId, date: { gte: thirtyDaysAgo } },
      account: { type: "EXPENSE" } // 僅抓費用帳戶
    },
    include: { account: true }
  });

  // 以類別分組加總
  const summaryMap: Record<string, number> = {};
  for (const p of postings) {
    const categoryName = p.account.name;
    const val = Math.abs(Number(p.amount)); 
    summaryMap[categoryName] = (summaryMap[categoryName] || 0) + val;
  }

  // 轉成 ChartJS 格式並排序
  return Object.entries(summaryMap)
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}
