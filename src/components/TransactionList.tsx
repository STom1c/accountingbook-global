"use client";

import { useState } from "react";
import { deleteTransaction, updateTransaction } from "@/lib/actions/transaction";
import { useTranslations } from "next-intl";

export default function TransactionList({
  transactions,
  accounts
}: {
  transactions: any[];
  accounts: any[];
}) {
  const t = useTranslations("common");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editDesc, setEditDesc] = useState("");
  const [editToId, setEditToId] = useState("");
  const [loading, setLoading] = useState(false);

  const toAccounts = accounts.filter(a => a.type === "EXPENSE");

  const handleDelete = async (id: string) => {
    if (!confirm("確定要刪除這筆記錄嗎？")) return;
    setLoading(true);
    await deleteTransaction(id);
    setLoading(false);
  };

  const startEdit = (trx: any) => {
    setEditingId(trx.id);
    const amt = Math.abs(Number(trx.postings[0].amount));
    setEditAmount(amt.toString());
    setEditDesc(trx.description);

    const p1 = trx.postings[0];
    const p2 = trx.postings[1];
    // 找出借方(支出分類)的 ID
    let currentToId = Number(p1.amount) > 0 ? p1.accountId : p2.accountId;
    setEditToId(currentToId);
  };

  const handleUpdate = async (trx: any) => {
    setLoading(true);
    
    // 簡單找出 from / to (針對目前雙重簿記簡單兩筆分錄的結構)
    const p1 = trx.postings[0];
    const p2 = trx.postings[1];
    
    // 預設將原先的來源帳戶沿用 (貸方)
    let fromAccountId = Number(p1.amount) < 0 ? p1.accountId : p2.accountId;

    await updateTransaction(trx.id, {
      amount: Number(editAmount),
      fromAccountId,
      toAccountId: editToId, // 使用被編輯的分類
      date: new Date(trx.date),
      description: editDesc
    });

    setEditingId(null);
    setLoading(false);
  };

  if (transactions.length === 0) {
    return <div className="empty-state">尚無記錄，試著新增一筆吧！</div>;
  }

  return (
    <ul className="trx-list">
      {transactions.map(trx => (
        <li key={trx.id} className="trx-item">
          {editingId === trx.id ? (
            <div className="trx-edit-row">
              <div className="trx-edit-inputs">
                <input
                  type="text"
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  placeholder="用途描述"
                  className="trx-edit-desc"
                />
                <select
                  value={editToId}
                  onChange={(e) => setEditToId(e.target.value)}
                  className="trx-edit-cat"
                >
                  {toAccounts.map(a => <option key={a.id} value={a.id}>{a.displayName || a.name}</option>)}
                </select>
                <input
                  type="number"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                  placeholder="金額"
                  className="trx-edit-amt"
                />
              </div>
              <div className="trx-edit-actions">
                <button disabled={loading} onClick={() => handleUpdate(trx)} className="btn btn-primary" style={{ background: "var(--success)" }}>{t("save")}</button>
                <button disabled={loading} onClick={() => setEditingId(null)} className="btn btn-secondary">{t("cancel")}</button>
              </div>
            </div>
          ) : (
            <>
              <div className="trx-info">
                <div className="trx-desc">{trx.description}</div>
                <div className="trx-meta">
                  {String(trx.date).split("T")[0].replace(/-/g, "/")}
                  &nbsp;·&nbsp;
                  {trx.postings?.find((p: any) => p.amount > 0)?.account?.displayName || trx.postings?.find((p: any) => p.amount > 0)?.account?.name}
                </div>
              </div>
              <div className="trx-right">
                <div className="trx-amount">
                  ${Math.abs(Number(trx.postings[0].amount))}
                </div>
                <button disabled={loading} onClick={() => startEdit(trx)} className="btn btn-icon">{t("edit")}</button>
                <button disabled={loading} onClick={() => handleDelete(trx.id)} className="btn btn-icon btn-icon-danger">{t("delete")}</button>
              </div>
            </>
          )}
        </li>
      ))}
    </ul>
  );
}
