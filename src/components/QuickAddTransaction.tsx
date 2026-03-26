"use client";

import { useState, useRef } from "react";
import { addTransaction } from "@/lib/actions/transaction";
import { addFinancialAccount } from "@/lib/actions/ledger";
import { useTranslations } from "next-intl";

export default function QuickAddTransaction({ ledgerId, accounts }: { ledgerId: string, accounts: any[] }) {
  const [amount, setAmount] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(false);
  const t = useTranslations("transaction");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [showScanner, setShowScanner] = useState(false);

  const fromAccounts = accounts.filter(a => a.type === "ASSET" || a.type === "LIABILITY");
  const toAccounts = accounts.filter(a => a.type === "EXPENSE");
  
  const [fromId, setFromId] = useState(fromAccounts[0]?.id || "");
  const [toId, setToId] = useState(toAccounts[0]?.id || "");
  
  // 自訂分類欄位
  const [customToName, setCustomToName] = useState("");
  const [analyzing, setAnalyzing] = useState(false);

  const stopScanner = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setShowScanner(false);
  };

  const startScanner = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      setShowScanner(true);
      // Wait for React to render the video element
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      }, 100);
    } catch (err) {
      alert("無法啟動相機，請確認瀏覽器權限或使用 https 連線！");
    }
  };

  const captureFrame = async () => {
    if (!videoRef.current) return;
    
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    
    ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
    stopScanner();
    setAnalyzing(true);

    canvas.toBlob(async (blob) => {
      if (!blob) {
        setAnalyzing(false);
        return;
      }
      
      try {
        const formData = new FormData();
        formData.append("image", blob, "receipt-scan.jpg");

        const res = await fetch("/api/ocr", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json();
          alert("AI 掃描失敗：" + err.error);
          return;
        }

        const data: { amount: number, description: string, category: string } = await res.json();
        setAmount(data.amount?.toString() || "");
        setDesc(data.description || "");

        const matchedAccount = toAccounts.find(a => a.name === data.category);
        if (matchedAccount) {
          setToId(matchedAccount.id);
        } else {
          setToId("_CUSTOM_");
          setCustomToName(data.category || "");
        }
      } catch (err: any) {
        alert("AI 解析發生異常，請重試！");
      } finally {
        setAnalyzing(false);
      }
    }, "image/jpeg", 0.8);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setAnalyzing(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/ocr", { method: "POST", body: formData });
      if (!res.ok) {
        const err = await res.json();
        alert("AI 掃描失敗：" + err.error);
        return;
      }

      const data: { amount: number, description: string, category: string } = await res.json();
      setAmount(data.amount?.toString() || "");
      setDesc(data.description || "");

      const matchedAccount = toAccounts.find(a => a.name === data.category);
      if (matchedAccount) {
        setToId(matchedAccount.id);
      } else {
        setToId("_CUSTOM_");
        setCustomToName(data.category || "");
      }
    } catch (err: any) {
      alert("AI 解析發生異常，請重試！");
    } finally {
      setAnalyzing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDescBlur = async () => {
    if (!desc.trim()) return;
    try {
      // 在背景進行文字的 AI 分類判斷
      const res = await fetch("/api/categorize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ description: desc }),
      });
      if (res.ok) {
        const { category } = await res.json();
        const matched = toAccounts.find(a => a.name === category);
        if (matched) setToId(matched.id);
      }
    } catch(err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || !desc || !fromId) return;
    if (toId !== "_CUSTOM_" && !toId) return;
    if (toId === "_CUSTOM_" && !customToName) return;

    setLoading(true);

    let finalToId = toId;
    
    // 如果使用者選了自訂分類，先在後台建檔
    if (toId === "_CUSTOM_") {
      const newAcc = await addFinancialAccount({
        ledgerId,
        name: customToName,
        type: "EXPENSE"
      });
      finalToId = newAcc.id;
    }

    await addTransaction({
      ledgerId,
      amount: Number(amount),
      fromAccountId: fromId,
      toAccountId: finalToId,
      date: new Date(),
      description: desc,
      currency: "TWD"
    });

    setAmount("");
    setDesc("");
    setCustomToName("");
    setToId(toAccounts[0]?.id || "");
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="card">
      <h3 className="section-title">{t("quickAdd")}</h3>

      {/* Scanner / Upload Section */}
      <div className="form-group">
        {showScanner ? (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              style={{ width: "100%", borderRadius: "8px", background: "#000", maxHeight: "280px", objectFit: "cover" }}
            />
            <div style={{ display: "flex", gap: "0.5rem" }}>
              <button type="button" onClick={captureFrame} className="btn btn-capture">
                {t("capture")}
              </button>
              <button type="button" onClick={stopScanner} className="btn btn-stop">
                {t("cancelScanner")}
              </button>
            </div>
          </div>
        ) : analyzing ? (
          <div className="analyzing-badge">{t("analyzing")}</div>
        ) : (
          <div style={{ display: "flex", gap: "0.5rem", flexDirection: "column" }}>
            <button type="button" disabled={loading} onClick={startScanner} className="btn btn-scan">
              📷 {t("startScanner")}
            </button>
            <input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileUpload} style={{ display: "none" }} />
            <button type="button" disabled={loading} onClick={() => fileInputRef.current?.click()} className="btn btn-secondary">
              {t("uploadFile")}
            </button>
          </div>
        )}
      </div>

      <div className="form-group">
        <label className="form-label">{t("amount")}</label>
        <input
          type="number"
          inputMode="decimal"
          value={amount}
          onChange={e => setAmount(e.target.value)}
          required
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label className="form-label">{t("description")}</label>
        <input
          type="text"
          value={desc}
          onChange={e => setDesc(e.target.value)}
          onBlur={handleDescBlur}
          required
          placeholder="(Auto-categorize on blur)"
          className="form-input"
        />
      </div>

      <div className="form-group">
        <label className="form-label">{t("from")}</label>
        <select value={fromId} onChange={e => setFromId(e.target.value)} className="form-select">
          {fromAccounts.map(a => <option key={a.id} value={a.id}>{a.displayName || a.name}</option>)}
        </select>
      </div>

      <div className="form-group">
        <label className="form-label">{t("to")}</label>
        <select value={toId} onChange={e => setToId(e.target.value)} className="form-select">
          {toAccounts.map(a => <option key={a.id} value={a.id}>{a.displayName || a.name}</option>)}
          <option value="_CUSTOM_">+ Custom Category...</option>
        </select>
        {toId === "_CUSTOM_" && (
          <input
            type="text"
            placeholder="New category name"
            value={customToName}
            onChange={e => setCustomToName(e.target.value)}
            required
            className="form-input"
            style={{ marginTop: "0.5rem", borderColor: "var(--primary)" }}
          />
        )}
      </div>

      <button type="submit" disabled={loading} className="btn btn-primary">
        {loading ? "..." : t("addNew")}
      </button>
    </form>
  );
}
