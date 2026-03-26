# MoneyBook Global — 實作進度記錄 (Implementation Progress)

> 專案路徑：`~/py_projects/my-accounting-app`  
> 部署目標：Zeabur (自帶伺服器 2C4G 60G) + 網域 `icq6161620.dpdns.org`  
> 最後更新：2026-03-26

---

## 進度總覽

| Phase | 描述 | 狀態 |
|---|---|---|
| Phase 1 | 專案初始化、DB Schema、Google SSO、多語系 | 🔄 進行中 |
| Phase 2 | 快速入帳、圖表報表、深色模式 | ⏳ 待開始 |
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

### Step 1.6 — .env.local 設定 ⚠️ (等待使用者)
- [ ] Google Cloud Console Client ID
- [ ] Google Cloud Console Client Secret
- [ ] Zeabur PostgreSQL DATABASE_URL
- NEXTAUTH_SECRET 會自動生成

### Step 1.7 — 本地開發驗證 ⏳
- 待 env 設定後執行 `npm run dev` 測試

### Step 1.8 — Zeabur 部署 ⏳
- 待本地驗證通過後執行

---

## 待決議事項 (Pending Decisions)

| # | 問題 | 狀態 |
|---|---|---|
| 1 | Google Cloud OAuth Client ID & Secret | ❓ 等待使用者 |
| 2 | Zeabur PostgreSQL DATABASE_URL | ❓ 等待使用者 |
| 3 | GitHub Repo 是否已存在？ | ❓ 等待確認 |

---

## 問題記錄 (Issues Log)

| 時間 | 問題 | 解決方式 | 狀態 |
|---|---|---|---|
| 2026-03-26 | `public/` `src/` 空目錄導致 create-next-app 衝突 | `rmdir public src` 後重新執行 | ✅ 已解決 |
| 2026-03-26 | eslint-visitor-keys Node v23 engine warning | 奇數版本相容性問題，不影響運行 | ✅ 可忽略 |
