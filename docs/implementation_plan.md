# 跨國網頁版記帳軟體 (MoneyBook Global) — 系統架構與實作詳盡計畫

本文件定義了「MoneyBook Global」的底層架構、資料庫綱要、認證流程、多語系設計以及各開發階段的技術細節。

---

## 一、 技術選型總覽與架構設計

### 1. 核心技術棧
| 技術層面 | 選擇方案 | 選擇理由與應用場景 |
| :--- | :--- | :--- |
| **前端架構** | Next.js 14 (App Router) + TypeScript | 支援服務器端渲染 (SSR) 加速首屏載入，利用 App Router 的檔案型路由管理多頁面。TypeScript 提供嚴格型別，減少 runtime 錯誤。 |
| **樣式系統** | Vanilla CSS + CSS Variables | 為追求極致效能與原生體驗，不依賴龐大 UI 框架。使用 CSS 變數輕鬆實作「深色/亮色模式」切換。 |
| **身份認證** | NextAuth.js v5 (Auth.js) | 無縫整合 Next.js，處理 Session 管理與 Cookie 安全。直接串接 Google Provider 實作 OAuth 2.0 (SSO) 登入。 |
| **資料庫 & ORM** | PostgreSQL + Prisma ORM | 記帳軟體對 ACID (原子性、一致性、隔離性、持久性) 要求極高。PostgreSQL 提供強大的關聯式查詢；Prisma 負責 Schema 管理與安全的 DB 遷移。 |
| **多國語系 (i18n)** | next-intl | 專為 Next.js App Router 設計的國際化套件，支援動態路由 `/[locale]/` 與 Server Components 翻譯。 |
| **影像辨識 (OCR)** | Tesseract.js + Google Gemini API | 前端輕量辨識 (Tesseract) 搭配後端 AI 智慧分類萃取 (Gemini 1.5 Flash)，提升發票辨識準確率至 99%。 |

### 2. 系統架構圖 (雙重簿記底層)
系統設計最核心的挑戰在於：**使用者想要簡單直覺的「單式記帳」介面，但系統必須具備企業級的「複式簿記 (Double-entry Bookkeeping)」來防呆與支援多帳戶轉帳。**

*   **UI 層 (使用者視角):** 「午餐花了 150 元」
*   **DB 層 (系統視角 - 借貸平衡):**
    *   `Transaction`: 午餐 (2026-10-25)
    *   `Posting 1 (借方)`: 費用類帳戶 (餐飲) +150
    *   `Posting 2 (貸方)`: 資產類帳戶 (現金/信用卡) -150
    *   *驗證： 所有 Postings 的金額總和必須絕對等於 0。*

---

## 二、 資料庫定義 (Prisma Schema 詳解)

以下為核心業務邏輯的 Prisma Schema 設計：

```prisma
// 1. 使用者與認證 (結合 NextAuth)
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  locale        String    @default("zh-TW") // 語系偏好
  timezone      String    @default("Asia/Taipei")
  ledgers       Ledger[]  // 關聯至帳本
}

// 2. 帳本 (Ledger) - 支援多帳本(個人/家庭/團隊)
model Ledger {
  id              String             @id @default(cuid())
  userId          String
  name            String
  baseCurrency    String             @default("TWD") // 基準貨幣
  monthStartDay   Int                @default(1)     // 財務結算起始日(例如5號發薪)
  fiscalYearStart Int                @default(1)     // 會計年度起始月
  accounts        FinancialAccount[] // 該帳本底下的所有財務帳戶
  transactions    Transaction[]      // 交易紀錄
  categories      Category[]         // 自訂分類
}

// 3. 財務帳戶 (FinancialAccount) - 資產、負債、收入、支出
model FinancialAccount {
  id            String      @id @default(cuid())
  ledgerId      String
  name          String      // 例：玉山銀行、現金、薪水、午餐費
  type          AccountType // ASSET, LIABILITY, INCOME, EXPENSE, EQUITY
  currency      String      @default("TWD")
  isArchived    Boolean     @default(false)
  postings      Posting[]   // 關聯至分錄
}
enum AccountType { ASSET, LIABILITY, INCOME, EXPENSE, EQUITY }

// 4. 交易主體 (Transaction)
model Transaction {
  id          String      @id @default(cuid())
  ledgerId    String
  date        DateTime    // 記錄時間
  description String      // 摘要
  categoryId  String?     // UI 輔助用的主要分類
  receiptUrl  String?     // OCR 原始圖片
  postings    Posting[]   // 複式簿記分錄
}

// 5. 分錄 (Posting) - 確保會計平衡的核心
model Posting {
  id            String           @id @default(cuid())
  transactionId String
  accountId     String
  amount        Decimal          @db.Decimal(20,2) // 正值為借方(Debit)，負值為貸方(Credit)
  currency      String           // 交易貨幣
  exchangeRate  Decimal?         @db.Decimal(20,6) // 匯率換算(若與帳本基準不同)
  account       FinancialAccount @relation(fields: [accountId], references: [id])
  transaction   Transaction      @relation(fields: [transactionId], references: [id], onDelete: Cascade)
}
```

---

## 三、 功能模組實作細節與 Roadmap

### 階段一：底層基礎建置與多語系 (Phase 1)
**目標：確立骨架，能安全登入並看到屬於自己語言的介面。**

1.  **Google SSO 整合：**
    *   於 Google Cloud Console 配置 OAuth 2.0 Credentials。
    *   在 `src/lib/auth.ts` 實作 NextAuth 設定檔，綁定 PrismaAdapter。
    *   **資料流：** 登入成功後，檢查 `User` 資料表是否存在，若首次登入則觸發「初始化機制」。
2.  **國際化 (next-intl) 與在地化預設：**
    *   設定 `locales: ['zh-TW', 'zh-CN', 'ja', 'ms', 'th']` 路由層 `/[locale]/...`。
    *   **初始化機制 (Seed)：** 新用戶註冊時，透過判斷地理位置/瀏覽器語系配置預設：
        *   日本 (`ja`): 載入 JPY 幣別，預設支付帳戶包含「Suica / PASMO」、「PayPay」。
        *   台灣 (`zh-TW`): 載入 TWD 幣別，預設包含「悠遊卡」、「LINE Pay」。
        *   泰國 (`th`): 載入 THB 幣別，包含「PromptPay」。
3.  **雙重簿記 API 基礎：**
    *   建立新增交易的 RESTful / Server Actions API，由伺服器端將簡單的表單推播 (金額 150、標籤：午餐、支付：現金) 轉譯為標準的 Array of Postings 寫入安全交易區塊 (Transaction Block)。

### 階段二：日常記帳最佳化與報表體驗 (Phase 2)
**目標：復刻 MyAB 的實用性（快速入帳、圖表分析），並加入現代 UI。**

1.  **快速入帳範本與定期紀錄 (Quick Add & Subscriptions)：**
    *   設計 `TransactionTemplate` DB 表。供使用者儲存如「每日大杯冰美式 $55」。
    *   前端提供「桌面捷徑」概念的卡片式設計，一鍵點擊呼叫 API 寫入今日帳本。
    *   整合 Vercel Cron，每日凌晨撈取預定執行的「定期扣款紀錄」（如 Netflix 訂閱、房租），自動生成交易。
2.  **儀表板與圖表 (Chart.js)：**
    *   實作 Client Component：`ExpensePieChart` (月度各分類支出比例) 與 `AssetTrendBarChart` (近半年資產變化長條圖)。
    *   使用 SQL 聚合查詢 (Aggregation) 優化，避免撈取幾萬筆原始交易。
3.  **極致效能與深色模式：**
    *   於根目錄實作 `body[data-theme="dark"]` 切換機制，透過 CSS Variables 轉換全局色彩配置。

### 階段三：A.I. 智慧與多人協作進階功能 (Phase 3)
**目標：超越傳統軟體，提供跨國出差的 OCR 自動記帳與家庭共享。**

1.  **智慧收據 OCR (前端 Tesseract + 後端 Gemini Vision)：**
    *   **流程：** 使用者拍照收據 -> 前端壓縮圖檔送出 -> Next.js API `route.ts` 接收。
    *   **Gemini 提示詞工程：** 傳入圖片及 Prompts (`"Extract the total amount, currency, date, and suggest a category for this receipt. Output ONLY valid JSON."`)。
    *   **跨國優勢：** 無論使用者到泰國旅遊拿到泰文收據，或是在日本拿到日文收據，Gemini 都能輕易翻譯並歸類金額。
2.  **多人共同帳本 (Shared Ledger)：**
    *   延伸 Schema `LedgerMember` (角色：OWNER, EDITOR, VIEWER)。
    *   實作「AA 制分帳計算引擎」，自動產出「結算清單 (Settlement List)」，例如：Alice 要給 Bob 500 元。

### 階段四：資料延續與相容性遷移 (Phase 4)
**目標：讓 MyAB 的老客戶可以無痛轉移。**

1.  **MyAB 專屬 CSV 遷移工具：**
    *   因為 MyAB 僅能匯出特定格式的 CSV，我們需建立一個專屬匯入頁面 `Import Wizard`。
    *   **伺服器端解析 (csv-parse)：** 讀取上傳檔案，克服 CSV BOM 編碼問題。
    *   **對應邏輯 (Mapping)：** 彈出介面讓用戶選擇「MyAB 的『第一銀行』」要對應到新系統的哪一個「FinancialAccount」。對應完成後，批次寫入 Postings。
2.  **標準財務匯出 (PDF / CSV)：**
    *   因應審計或報稅需求，提供標準化 CSV 匯出，支援過濾時間區間與特定標籤。

---

## 四、 開發前置驗證計畫 (User Review Checklist)

在真正開始撰寫每一行程式碼前，本計畫需經確認：
- [ ] **技術堆疊**確認：確認 React/Next.js 是您熟悉的或是能接受的領域。
- [ ] **核心架構**確認：雖然底層是複雜的複式簿記，前端只給使用者看簡單輸入框（單式），此方案是否符合預期？
- [ ] **認證方案**確認：目前僅規劃 Google 單一登入，是否需要保留傳統 Email + 密碼登入？
- [ ] **排程順序**確認：您是否同意我們從 Phase 1 (登入機制與 Schema 建置) 開始進行？

> *以上計畫書全面升級，確保滿足「跨國語言」、「智慧化」、「財務正確性」與「無痛資料轉移」的商業級標準。若您同意，我們隨時可進入程式碼實作！*
