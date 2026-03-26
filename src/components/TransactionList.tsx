"use client";

import { useState } from "react";
import { deleteTransaction, updateTransaction } from "@/lib/actions/transaction";

export default function TransactionList({
  transactions,
  accounts
}: {
  transactions: any[];
  accounts: any[];
}) {
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
    return <p style={{ color: "gray" }}>尚無記錄，試著新增一筆吧！</p>;
  }

  return (
    <ul style={{ listStyle: "none", padding: 0 }}>
      {transactions.map(trx => (
        <li key={trx.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem", borderBottom: "1px solid #eee" }}>
          
          {editingId === trx.id ? (
            <div style={{ width: "100%", display: "flex", flexWrap: "wrap", gap: "0.5rem", alignItems: "center" }}>
              <input 
                type="text" 
                value={editDesc} 
                onChange={(e) => setEditDesc(e.target.value)} 
                placeholder="用途描述"
                style={{ flex: "1 1 150px", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
              />
              <select 
                value={editToId} 
                onChange={(e) => setEditToId(e.target.value)} 
                style={{ flex: "1 1 120px", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
              >
                {toAccounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
              <input 
                type="number" 
                value={editAmount} 
                onChange={(e) => setEditAmount(e.target.value)} 
                placeholder="金額"
                style={{ flex: "0 1 100px", padding: "0.5rem", border: "1px solid #ccc", borderRadius: "4px" }}
              />
              <button disabled={loading} onClick={() => handleUpdate(trx)} style={{ cursor: "pointer", background: "#4CAF50", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", fontWeight: "bold" }}>儲存</button>
              <button disabled={loading} onClick={() => setEditingId(null)} style={{ cursor: "pointer", background: "#f44336", color: "white", border: "none", padding: "0.5rem 1rem", borderRadius: "4px", fontWeight: "bold" }}>取消</button>
            </div>
          ) : (
            <>
              <div style={{ flex: 1 }}>
                <strong>{trx.description}</strong>
                <div style={{ fontSize: "0.85rem", color: "gray" }}>
                  {String(trx.date).split("T")[0].replace(/-/g, "/")}
                  {/* 可顯示科目資訊 */}
                  &nbsp;({trx.postings?.find((p: any) => p.amount > 0)?.account?.name})
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                  ${Math.abs(Number(trx.postings[0].amount))}
                </div>
                <div>
                  <button disabled={loading} onClick={() => startEdit(trx)} style={{ cursor: "pointer", marginRight: "0.5rem", padding: "0.3rem", border: "1px solid #ccc" }}>編輯</button>
                  <button disabled={loading} onClick={() => handleDelete(trx.id)} style={{ cursor: "pointer", padding: "0.3rem", border: "1px solid #d9534f", color: "#d9534f" }}>刪除</button>
                </div>
              </div>
            </>
          )}

        </li>
      ))}
    </ul>
  );
}
