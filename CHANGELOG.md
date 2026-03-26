# Changelog

所有對 `MoneyBook Global` 專案的顯著變更都會記錄在此檔案中。
格式參考 [Keep a Changelog](https://keepachangelog.com/zh-TW/1.0.0/)，版本號遵循 [Semantic Versioning](https://semver.org/)。

---

## [1.0.0] - 2026-03-26

首個正式上線版本。核心功能、AI 掃描、多語系、雙重簿記、Zeabur 雲端部署與手機 UI 全部完成。

### Added

- **Google SSO 登入** — NextAuth v5 + PrismaAdapter，完全繞過 NextAuth 預設黑底中介頁
- **雙重簿記 DB 架構** — Transaction / Posting 嚴格保證 Debit = Credit，支援 ASSET / LIABILITY / INCOME / EXPENSE 帳戶類型
- **快速入帳表單** — QuickAddTransaction，支援自訂新分類
- **記錄編輯與刪除** — 編輯時維持簿記平衡
- **AI 收據 OCR** — HTML5 Camera live 取景 + 圖片上傳 → Gemini 1.5 Flash Vision 解析金額、描述、分類
- **AI 自動分類** — 描述欄 blur 後呼叫 `/api/categorize` 自動填入分類
- **支出圓餅圖** — Chart.js ExpensePieChart
- **深色模式** — CSS Variables `data-theme="dark"`，localStorage 持久化
- **五大語系** — 繁中、簡中、日文、泰文、馬來文，next-intl `/[locale]/` 路由
- **MyAB CSV 匯入** — Import Wizard，支援 Big5 / UTF-8 編碼，對應欄位後批次寫入 Postings
- **invoiceNumber 欄位** — Transaction model 新增發票號碼欄位
- **Zeabur 雲端部署** — Dockerfile + zbpack.json，`prisma db push` 自動同步 schema
- **Cloudflare Tunnel 路由** — 同一 domain 分流 LINE relay (port 8010) 與 MoneyBook (Zeabur :80)
- **手機優先 UI 全面重構** — Inter 字型、CSS Variables 設計系統、8pt 間距、44px 觸控目標
- **⋯ 收合式 Header 選單** — 語言切換、深色模式、Import、登出全部收入下拉選單，header 只顯示 Logo + ⋯
- **版本號顯示** — 頁面底部 footer 顯示 `v{version}`，自動讀取 package.json

### Fixed

- Next.js 16 非同步 `params` Promise 導致路由 404 的問題
- Prisma 併發 `P2025` 查詢鎖死問題
- Client Router 快取導致語言切換失效（改用 `window.location.href` 強制導向）
- NextAuth v5 `UntrustedHost` 錯誤（加入 `AUTH_TRUST_HOST=true`）
- Dockerfile build 時 `DATABASE_URL` 缺失導致 `prisma generate` 失敗（注入 dummy URL）
- `src/proxy.ts` 命名錯誤導致 next-intl middleware 不生效（改名為 `src/middleware.ts`）
- Cloudflare Tunnel 攔截所有流量導致 MoneyBook 404（拆分 ingress 路由規則）
- GitHub webhook 未自動建立導致 Zeabur 不自動重建（重新連結 GitHub repo）
