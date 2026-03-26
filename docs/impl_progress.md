# MoneyBook Global — 實作進度記錄 (Implementation Progress)

> 專案路徑：`~/py_projects/my-accounting-app`
> 部署目標：Zeabur (自帶伺服器 2C4G) + 網域 `icq6161620.dpdns.org`
> 最後更新：2026-03-26
> 目前版本：**v1.0.0**

---

## 進度總覽

| Phase | 內容 | 狀態 |
|---|---|---|
| Phase 1 | 專案初始化、DB Schema、Google SSO、多語系 | ✅ 已完成 |
| Phase 2 | 雙重簿記 API、快速入帳、圖表報表、深色模式 | ✅ 已完成 |
| Phase 3 | OCR 收據掃描、AI 自動分類、多語系細化 | ✅ 已完成 |
| Phase 4 | MyAB CSV 匯入、手機 UI 重構、Zeabur 部署 | ✅ 已完成 |

---

## Phase 1：底層基礎建置 ✅

- Next.js 16 (App Router, TypeScript) 初始化
- Prisma Schema：User, Ledger, FinancialAccount, Transaction, Posting, Category, Budget, TransactionTemplate
- NextAuth v5 + Google OAuth + PrismaAdapter
- next-intl 多語系路由 (`zh-TW`, `zh-CN`, `ja`, `ms`, `th`)
- `src/middleware.ts` — next-intl 語系路由攔截
- 五語系翻譯檔 (common, nav, auth, transaction, category, account, currency, dashboard, settings)
- `.env.example` 環境變數範本

## Phase 2：日常記帳最佳化與報表體驗 ✅

- 雙重簿記核心 API (Transaction + Posting，Debit/Credit 平衡驗證)
- QuickAddTransaction 快速入帳表單
- 記錄刪除與編輯 (編輯維持簿記平衡)
- Chart.js 支出圓餅圖 (ExpensePieChart)
- 深色模式 (CSS Variables `data-theme="dark"`)
- 自訂分類建立 (addFinancialAccount)

## Phase 3：A.I. 智慧與跨國支援 ✅

- HTML5 Camera live 取景掃描 + 圖片上傳 → `/api/ocr`
- Gemini 1.5 Flash Vision OCR：多國語言收據解析（金額、描述、分類）
- `/api/categorize` — 描述文字 AI 自動分類
- invoiceNumber 欄位新增至 Transaction model
- 語系切換 Client-side 強制導向（解決 Router cache 問題）
- 首次登入自動建立預設帳本與財務科目

## Phase 4：部署、匯入與 UI 精修 ✅

### Zeabur 雲端部署
- Dockerfile：`prisma db push --skip-generate && npm start`
- `zbpack.json`：`{ "build_type": "dockerfile" }`
- Dummy DATABASE_URL 解決 build-time Prisma generate 問題
- `AUTH_TRUST_HOST=true` 解決 NextAuth UntrustedHost
- GitHub webhook 連結（自動觸發 redeploy）

### Cloudflare Tunnel 路由
- 同一 domain `icq6161620.dpdns.org` 分流：
  - LINE relay paths → `localhost:8010`
  - 其餘 → Zeabur ingress `localhost:80`

### MyAB CSV 匯入
- Import Wizard (`/import`)，Big5 / UTF-8 雙編碼支援
- 欄位對應介面，批次寫入 Postings

### 手機 UI 重構
- Inter 字型 + CSS Variables 設計系統
- `globals.css` 完整 CSS class 系統（告別 inline style）
- 8pt 間距網格，44px 觸控目標
- Header：Logo + ⋯ 下拉選單（語言、深色模式、Import、登出）
- 版本號 footer

---

## 問題記錄 (Issues Log)

| 時間 | 問題 | 解決方式 |
|---|---|---|
| 2026-03-26 | Prisma generate 需要 DATABASE_URL | Dockerfile 注入 dummy URL |
| 2026-03-26 | NextAuth UntrustedHost | 加入 AUTH_TRUST_HOST=true |
| 2026-03-26 | Cloudflare Tunnel 攔截全部流量導致 404 | 拆分 ingress 路由 |
| 2026-03-26 | next-intl middleware 不生效 | 將 proxy.ts 改名為 middleware.ts |
| 2026-03-26 | GitHub webhook 未建立，Zeabur 不自動重建 | 重新連結 GitHub repo |
| 2026-03-26 | Header 按鈕手機版換行跑版 | 改為 ⋯ 下拉選單架構 |
