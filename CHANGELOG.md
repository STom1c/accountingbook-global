# Changelog

所有對 `MoneyBook Global` 專案的顯著變更都會記錄在此檔案中。

## [1.0.0] - 2026-03-26

這是專案的第一個正式里程碑版本，核心基礎設施與 AI/語系功能已全部上線！

### Added (新增功能)
- 🚀 **Next.js App Router**: 完整建置 SSR、Server Components 與 Server Actions 架構。
- 🔐 **Auth.js (NextAuth v5)**: 實作 Google OAuth 安全登入，取代危險的傳統密碼登入。
- 🌍 **全球多語系支援 (next-intl)**: 
  - 完整支援 `zh-TW` (繁體)、`zh-CN` (簡體)、`ja` (日文)、`th` (泰文)、`ms` (馬來文)。
  - 首頁即時渲染多國語言介面。
- 🤖 **A.I. 智慧收據掃描**:
  - 完美整合 HTML5 相機，無縫呼叫 `@google/generative-ai` Vision 模型。
  - 支援從模糊小票中提取明細、貨幣總額與自動推測分類。
- 🗄️ **雙重簿記資料庫架構**:
  - `Transaction` 與 `Posting` 的嚴格關聯設計，保證資金流向的借貸平衡 (Debit = Credit)。
- 📊 **儀表板與視覺化**: 引入 Chart.js 動態繪製個人支出圓餅圖。
- 🌙 **深色模式切換**: 採用超快 Vanilla CSS 解析切換 `data-theme="dark"`。
- ⚙️ **部署準備**: 確立 Zeabur 連線與 CI/CD 目標設定。

### Fixed (修復)
- 🐛 解決 Next.js 15 中非同步 `params` Promise 生效而導致 `undefined` 路由跳轉 `404` 錯誤的問題。
- 🐛 解決 Client-side Router 快取導致 Language Switcher 首頁點擊失效的問題 (改以原生 href 物理重刷)。
- 🐛 解決 Prisma 併發 `P2025` 查詢鎖死與 Hydration 錯誤，穩定開發體驗。
- 🐛 繞過 NextAuth 預設的中介黑底頁面，改用 Server Actions 的 `<form>` 直接無縫進行登入與登出流程。
