"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ImportWizard({ ledgerId }: { ledgerId: string }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [headers, setHeaders] = useState<string[]>([]);
  const [preview, setPreview] = useState<any[]>([]);
  
  const [mapping, setMapping] = useState({
    date: "",
    amount: "",
    fromAccount: "",
    toAccount: "",
    description: ""
  });
  
  const [status, setStatus] = useState<"idle" | "uploading" | "mapping" | "importing" | "success">("idle");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;
    setFile(selected);
    setStatus("uploading");

    const formData = new FormData();
    formData.append("file", selected);

    try {
      const res = await fetch("/api/import/preview", { method: "POST", body: formData });
      if (!res.ok) throw new Error(await res.text());
      const data = await res.json();
      setHeaders(data.headers);
      setPreview(data.preview);
      
      // Auto-guess common MyAB headers
      const guess = {
        date: data.headers.find((h: string) => h.includes("日期")) || data.headers[0],
        amount: data.headers.find((h: string) => h.includes("金額")) || data.headers[0],
        fromAccount: data.headers.find((h: string) => h.includes("類別") || h.includes("帳戶") || h.includes("資產")) || "",
        toAccount: data.headers.find((h: string) => h.includes("項目") || h.includes("支出科目") || h.includes("歸屬")) || "",
        description: data.headers.find((h: string) => h.includes("明細") || h.includes("備註") || h.includes("摘要")) || data.headers[0],
      };
      setMapping(guess);
      setStatus("mapping");
    } catch (err) {
      alert("解析 CSV 失敗，可能格式有誤或檔案為空。");
      setStatus("idle");
    }
  };

  const handleImport = async () => {
    if (!file) return;
    setStatus("importing");
    
    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("ledgerId", ledgerId);
      formData.append("mapping", JSON.stringify(mapping));

      const res = await fetch("/api/import/execute", { method: "POST", body: formData });
      if (!res.ok) throw new Error(await res.text());
      const resData = await res.json();
      
      alert(`🎉 成功匯入了 ${resData.imported} 筆歷史紀錄！`);
      setStatus("success");
      router.push("/dashboard");
    } catch (err) {
      alert("匯入失敗！");
      setStatus("mapping");
    }
  };

  if (status === "success") return <h2>匯入完成，請返回儀表板查看。</h2>;

  return (
    <div style={{ maxWidth: "800px", margin: "2rem auto", padding: "2rem", background: "var(--background)", border: "1px solid #ccc", borderRadius: "8px" }}>
      <h1>💾 專屬 CSV 無痛匯入精靈</h1>
      <p style={{ color: "gray", marginBottom: "2rem" }}>將 MyAB (或任何其他軟體) 的歷史總帳一次轉移進入雙重簿記核心。</p>
      
      {status === "idle" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <label style={{ display: "block", background: "#4285F4", color: "white", padding: "1rem", textAlign: "center", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
             選擇您的 CSV 檔案
             <input type="file" accept=".csv" onChange={handleFileChange} style={{ display: "none" }} />
          </label>
        </div>
      )}

      {status === "uploading" && <p>正在讀取與解析欄位中...</p>}

      {status === "mapping" && (
        <>
          <div style={{ marginBottom: "2rem", padding: "1rem", background: "rgba(0,0,0,0.05)", borderRadius: "8px", overflowX: "auto" }}>
            <h3>CSV 預覽 (前 3 筆資料)</h3>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr>{headers.map(h => <th key={h} style={{ borderBottom: "1px solid #ccc", textAlign: "left", padding: "0.5rem" }}>{h}</th>)}</tr>
              </thead>
              <tbody>
                {preview.map((row, i) => (
                  <tr key={i}>{headers.map(h => <td key={h} style={{ borderBottom: "1px solid #eee", padding: "0.5rem" }}>{row[h]}</td>)}</tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{ display: "grid", gap: "1rem", gridTemplateColumns: "1fr 1fr", marginBottom: "2rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label>📅 對應「日期」欄位</label>
              <select value={mapping.date} onChange={e => setMapping({...mapping, date: e.target.value})} style={{ padding: "0.5rem", borderRadius: "4px" }}>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label>💰 對應「金額」欄位</label>
              <select value={mapping.amount} onChange={e => setMapping({...mapping, amount: e.target.value})} style={{ padding: "0.5rem", borderRadius: "4px" }}>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label>🏦 來源「支付帳戶」 (如:第一銀行)</label>
              <select value={mapping.fromAccount} onChange={e => setMapping({...mapping, fromAccount: e.target.value})} style={{ padding: "0.5rem", borderRadius: "4px" }}>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
              <label>🛒 去向「支出類別」 (如:餐飲費)</label>
              <select value={mapping.toAccount} onChange={e => setMapping({...mapping, toAccount: e.target.value})} style={{ padding: "0.5rem", borderRadius: "4px" }}>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", gridColumn: "1 / -1" }}>
              <label>📝 對應「描述/摘要」欄位</label>
              <select value={mapping.description} onChange={e => setMapping({...mapping, description: e.target.value})} style={{ padding: "0.5rem", borderRadius: "4px" }}>
                {headers.map(h => <option key={h} value={h}>{h}</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleImport} style={{ background: "#4CAF50", color: "white", padding: "1rem 2rem", border: "none", borderRadius: "8px", fontSize: "1.1rem", cursor: "pointer", width: "100%", fontWeight: "bold" }}>
             🚀 開始海量匯入
          </button>
        </>
      )}

      {status === "importing" && (
        <p style={{ fontSize: "1.2rem", color: "#4285F4", fontWeight: "bold", textAlign: "center" }}>
          🔄 正在啟動雙重簿記演算法轉換與寫入，請稍候片刻...
        </p>
      )}
    </div>
  );
}
