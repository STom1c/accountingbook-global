# MoneyBook Global — 實作進度記錄 (Implementation Progress)

> 專案路徑：`~/py_projects/my-accounting-app`  
> 部署目標：Zeabur (自帶伺服器 2C4G 60G) + 網域 `icq6161620.dpdns.org`  
> 最後更新：2026-03-26

---

## 進度總覽

| Phase 1 | 專案初始化、DB Schema、Google SSO、多語系 | ✅ 已完成 |
| Phase 2 | 雙重簿記 API、快速入帳、圖表報表、深色模式 | 🔄 進行中 |
| Phase 3 | OCR 收據掃描、多人共享帳本 | ⏳ 待開始 |
| Phase 4 | MyAB CSV 匯入、報表匯出 | ⏳ 待開始 |

---

## Phase 1：底層基礎建置

### Step 1.1 — 初始化 Next.js 14 專案 ✅
- Next.js 14 (App Router, TypeScript, ESLint) 成功初始化，342 packages

### Step 1.2 — 安裝核心相依套件 ✅
- `next-auth@beta`, `@auth/prisma-adapter`, `@prisma/client`, `next-intl`, `chart.js`, `react-chartjs-2`, `csv-parse`
- 414 packages total, 0 vulnerabilities

### Step 1.3 — Prisma Schema 設計與驗證 ✅
- `The schema at prisma/schema.prisma is valid 🚀`
- Prisma Client v6.19.2 生成成功
- 模型：User, Account, Session, VerificationToken, Ledger, FinancialAccount, Transaction, Posting, Category, Budget, TransactionTemplate

### Step 1.4 — 核心設定檔建立 ✅
- `src/lib/prisma.ts` — Prisma Client 單例
- `src/lib/auth.ts` — NextAuth v5 + Google Provider + PrismaAdapter
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth API Route
- `src/middleware.ts` — next-intl 語系路由攔截
- `src/i18n/routing.ts` — 語系定義 (zh-TW, zh-CN, ja, ms, th)
- `src/i18n/request.ts` — Server-side 語系載入
- `next.config.ts` — Next.js + next-intl plugin 設定
- `.env.example` — 環境變數範本

### Step 1.5 — 多語系翻譯檔 ✅
- 繁體中文 (zh-TW)、簡體中文 (zh-CN)、日文 (ja)、馬來文 (ms)、泰文 (th)
- 涵蓋 key 群組：common, nav, auth, transaction, category, account, currency, dashboard, settings

### Step 1.6 — .env.local 設定 ✅
- ✅ Google Cloud Console Client ID 
- ✅ Google Cloud Console Client Secret
- ✅ NEXTAUTH_SECRET 自動生成完成
- ✅ Zeabur PostgreSQL `DATABASE_URL` 已取得

### Step 1.7 — 本地開發驗證 ⏳
- ✅ `npx prisma db push` 執行完成，架構同步成功
- 👉 `npm run dev` 即可啟動本地開發伺服器

### Step 1.8 — Zeabur 部署 ⏳
- 待本地驗證通過，且建立 GitHub Repo 後執行

## Phase 2：日常記帳最佳化與報表體驗 ✅
- [x] **雙重簿記核心 API 建置** (建立 Transaction, 確保 Debit/Credit 平衡)
- [x] **快速入帳介面** (建立 QuickAddTransaction 表單)
- [x] **分類管理與熱修復** (自訂大數據庫分類與防呆自動收束)
- [x] **記錄刪除與編輯** (確保異動時依然維持簿記平衡與關聯資料轉換)
- [x] **圖表分析整合** (Chart.js 支出圓餅圖 `ExpensePieChart`)
- [x] **深色模式** (Vanilla CSS Variables `data-theme='dark'` 切換)
  
---

## 待執行手動步驟提醒事項 (To Do)

| 任務 | 說明 | 狀態 |
|---|---|---|
| **建立 GitHub Repo** | 請在您的 GitHub 建立新倉庫（無需 README），我會為您推播程式碼。 | ✅ 已完成 |
| **部署 Zeabur PostgreSQL** | 請於 [Zeabur 控制台](https://dash.zeabur.com) → 新建專案 → 添加服務 (Marketplace) → 選 PostgreSQL，完成後將 `DATABASE_URL` 提供給我。 | ❓ 等待執行 |

---

## 問題記錄 (Issues Log)

| 時間 | 問題 | 解決方式 | 狀態 |
|---|---|---|---|
| 2026-03-26 | `public/` `src/` 空目錄導致 create-next-app 衝突 | `rmdir public src` 後重新執行 | ✅ 已解決 |
| 2026-03-26 | eslint-visitor-keys Node v23 engine warning | 奇數版本相容性問題，不影響運行 | ✅ 可忽略 |
