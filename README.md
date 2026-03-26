# MoneyBook Global 🚀

> 專業級別跨國雙重簿記系統，搭載 A.I. 視覺收據掃描，並且支援全球在地化語言。

MoneyBook Global 是一個為跨國工作者、留學生與家庭設計的現代化記帳應用。它擺脫了傳統單一貨幣與定型分類的束縛，底層使用企業級「複式簿記 (Double-entry)」來保護資料的一致性，同時前端提供直覺的單式記帳與相機 AI (Gemini 1.5) 感知掃描功能。

## 🌟 核心特色 (Features)

*   **🌍 五大語系完全涵蓋**：繁中、簡中、日文、泰文、馬來文。採用 `next-intl`，單一資料庫支援動態在地化名詞翻譯。
*   **🤖 A.I. 收據魔法掃描**：一鍵開啟鏡頭，利用 Google Gemini 1.5 Vision 閃電解析國外發票、水電單，自動填入金額與建議分類。
*   **⚖️ 雙重簿記防呆系統**：採用 ACID 等級的 PostgreSQL + Prisma，每一筆交易嚴格保證 Debit = Credit。
*   **🎨 輕量深色模式 (Vanilla CSS)**：不依賴肥大框架，透過 CSS 原生變數實現極速秒切換。
*   **🔐 無密碼 OAuth 登入**：串接 NextAuth.js，Google 帳號一鍵登入保護您的帳本資產。

## 🛠️ 技術棧 (Tech Stack)

*   **框架**: Next.js (App Router, Server Actions)
*   **資料庫**: PostgreSQL + Prisma ORM
*   **認證**: Auth.js (NextAuth v5)
*   **AI 引擎**: Google Gemini API (`@google/generative-ai`)
*   **國際化**: `next-intl`

## 🚀 本地開發與部署 (Setup)

1.  **安裝依賴套件**:
    ```bash
    npm install
    ```
2.  **設定環境變數 (`.env.local`)**:
    ```env
    GOOGLE_CLIENT_ID=your_client_id
    GOOGLE_CLIENT_SECRET=your_client_secret
    NEXTAUTH_SECRET=your_nextauth_secret
    DATABASE_URL=postgres://user:password@host/db
    GEMINI_API_KEY=your_gemini_api_key
    ```
3.  **資料庫遷移 (Prisma)**:
    ```bash
    npx prisma db push
    ```
4.  **啟動本地伺服器**:
    ```bash
    npm run dev
    ```

此專案已為 Zeabur 部署完成設計，並內建 PostgreSQL 隔離連線機制。
