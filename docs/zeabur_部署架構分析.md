# MoneyBook Global — Zeabur 部署架構分析

> **部署平台：** Zeabur (底層使用 k3s / Kubernetes 輕量版架構)  
> **本文說明：** 哪些服務 Zeabur 已提供 (Marketplace 一鍵安裝)，哪些需要自行配置

---

## 一、Zeabur 架構原理

Zeabur 採用 **k3s（輕量版 Kubernetes）** 作為底層容器編排引擎：

- **每個「Service」= 一個 k3s Pod**，有自己的 DNS 名稱可互相呼叫。
- **每個「Project」= 一個 k3s Namespace**，服務之間透過內部網路直接溝通（不需要公開對外）。
- 網路流量透過 **Ingress Controller** 對外披露，提供 HTTPS 自動 TLS 憑證 (Let's Encrypt)。
- 提供 **Marketplace（模板市集）**，大部分常用服務只需幾秒鐘即可完成部署。

---

## 二、服務清單：可用 vs. 需自行安裝

### ✅ Zeabur Marketplace 已提供（一鍵部署）

| 服務 | 用途 | 對應本專案需求 |
|---|---|---|
| **PostgreSQL** | 主要關聯式資料庫 | Prisma ORM 的資料庫後端，儲存全部帳務資料 |
| **PostgreSQL + pgvector** | 向量搜尋擴展版 | 未來若加入 AI 語義搜尋 (e.g. 搜尋相似交易) |
| **Redis** | 快取 + 訊息佇列 | Session 快取、Rate Limiting、未來 Bull Queue 非同步任務 |
| **MinIO** | S3 相容物件儲存 | 儲存使用者上傳的**收據圖片** (OCR 功能需要) |
| **Logto** | 身份認證服務 | 若改用 Logto 取代 NextAuth (支援 Google SSO + 更多 Provider) |
| **Umami** | 無 Cookie 網站分析 | 追蹤頁面瀏覽量 (取代 Google Analytics，更符合隱私法規) |
| **n8n** | 低程式碼自動化工作流程 | 可替代 Cron Job 觸發定期記帳 (圖形化設定，更直覺) |

### ⚙️ Zeabur 可部署但需手動設定（部署後需額外配置）

| 服務 | 說明 |
|---|---|
| **Next.js App (主應用)** | 將程式碼連結 GitHub Repo 後，Zeabur 可自動偵測 Next.js 並部署；但環境變數 (.env) 需手動設定 |
| **Prisma Migrations** | 首次部署後需手動於 Zeabur 的 SSH 終端機執行 `npx prisma migrate deploy` |
| **自訂網域 (Custom Domain)** | 需在 Zeabur 設定介面綁定自訂網域，並在 DNS 解析商更新 CNAME 記錄 |

### ❌ Zeabur 原生**不提供**（需自行解決）

| 功能 | 目前限制 | 建議替代方案 |
|---|---|---|
| **Cron Job (排程工作)** | Zeabur 無原生的 Cron 管理介面 (社群有功能需求但尚未正式支援) | **方案 A（推薦）**：使用 Zeabur 已提供的 **n8n** 設定定時觸發。 **方案 B**：在 Next.js 程式碼中使用 `node-cron`，於獨立 Worker Service 執行。 **方案 C**：建立一個獨立的「排程服務」容器，內部跑 cron。 |
| **Email 寄送服務** | 無內建 SMTP 或郵件派送服務 | 使用 **Resend** 或 **Mailgun** 的免費 API 層 (非自架) |
| **SSL/TLS 憑證** | 已自動提供，但若使用**自訂網域**要先完成 DNS 驗證才生效 | 無需額外安裝，自動由 Let's Encrypt 發行 |
| **CDN / 靜態資源加速** | Zeabur 沒有 built-in CDN | 方案：使用 **Cloudflare 免費版** 接在 Zeabur 公開網域前做 CDN 及防 DDoS |
| **永久性儲存 (Persistent Volume)** | MinIO 等資料服務有 PV，但**應用層不建議直接寫入 Pod 磁碟**（Pod 重啟後消失）| 收據圖片一定要存到 MinIO，不要存在 Next.js 容器本地 |
| **日誌彙整 / 告警** | 沒有企業級 Log 集中管理 | 初期使用 Zeabur 內建的 Console Logs 即可；進階可部署 Marketplace 的 **Grafana + Prometheus** 組合 |

---

## 三、MoneyBook Global 建議部署架構圖

```
使用者瀏覽器
     │ HTTPS (自動 TLS)
     ▼
┌─────────────────────────────────────────────┐
│              Zeabur Project                  │
│              (k3s Namespace)                 │
│                                             │
│  ┌─────────────┐    ┌────────────────────┐  │
│  │  Next.js App │◄──►│  PostgreSQL          │  │
│  │  (主服務)    │    │  (帳務資料庫)       │  │
│  │             │    └────────────────────┘  │
│  │             │    ┌────────────────────┐  │
│  │             │◄──►│  Redis             │  │
│  │             │    │  (Session快取)     │  │
│  │             │    └────────────────────┘  │
│  │             │    ┌────────────────────┐  │
│  │             │◄──►│  MinIO             │  │
│  └─────────────┘    │  (收據圖片儲存)    │  │
│                      └────────────────────┘  │
│  ┌─────────────┐                            │
│  │    n8n       │  ← 定時觸發定期記帳 API   │
│  └─────────────┘                            │
└─────────────────────────────────────────────┘
         │ 外部 API 呼叫
         ▼
┌─────────────────┐  ┌──────────────┐
│  Google OAuth    │  │ Gemini API   │
│  (SSO 登入驗證) │  │ (OCR 收據)   │
└─────────────────┘  └──────────────┘
```

---

## 四、部署步驟順序（建議）

### Step 1：在 Zeabur 建立 Project
1. 登入 [Zeabur](https://zeabur.com) → 新建 Project `moneybook-global`。
2. 選定部署區域（**新加坡 (ap-east)** 推薦，距離台/日/馬/泰最近）。

### Step 2：一鍵部署資料庫服務（Marketplace）
1. 在 Project 內 → `Add Service` → Marketplace。
2. 搜尋 **PostgreSQL** → 點擊部署 → Zeabur 自動生成 `DATABASE_URL` 環境變數。
3. 搜尋 **Redis** → 點擊部署 → 自動生成 `REDIS_URL`。
4. 搜尋 **MinIO** → 點擊部署 → 記錄 Endpoint、Access Key、Secret Key。

### Step 3：部署 Next.js 主應用
1. 在 Project 內 → `Add Service` → Git → 選擇 GitHub Repo。
2. Zeabur 自動偵測 Next.js，設定 Build Command = `npm run build`。
3. 注入所有必要環境變數：
   ```env
   DATABASE_URL=postgresql://...         # 從 PostgreSQL 服務複製
   REDIS_URL=redis://...                 # 從 Redis 服務複製
   NEXTAUTH_URL=https://yourdomain.com
   NEXTAUTH_SECRET=<強隨機字串>
   GOOGLE_CLIENT_ID=<Google Cloud Console>
   GOOGLE_CLIENT_SECRET=<Google Cloud Console>
   MINIO_ENDPOINT=<MinIO Service 內網 DNS>
   MINIO_ACCESS_KEY=<MinIO Key>
   MINIO_SECRET_KEY=<MinIO Secret>
   GEMINI_API_KEY=<Google AI Studio>
   ```
4. 部署成功後，開啟 Zeabur SSH 終端機 → 執行首次資料庫遷移：
   ```bash
   npx prisma migrate deploy
   ```

### Step 4：設定 n8n 定期任務（取代 Cron Job）
1. Marketplace 部署 **n8n**。
2. 建立 Workflow：「Schedule Node (每日凌晨 00:05)」→「HTTP Request 呼叫 Next.js API `/api/cron/recurring`」。
3. 在 HTTP Request Header 設定 `Authorization: Bearer ${CRON_SECRET}`。

### Step 5：綁定自訂網域與 Cloudflare
1. Zeabur Project → Next.js 服務 → `Add Domain`。
2. 在 DNS 商新增 `CNAME` 指向 Zeabur 提供的域名。
3. （建議）在 Cloudflare 管理 DNS，可免費啟用 Orange Cloud (Proxy) 取得 CDN 加速。

---

## 五、費用估算（Zeabur Developer 方案）

Zeabur 依資源使用量收費（CPU + 記憶體）：

| 服務 | 預估月費 |
|---|---|
| Next.js App (0.5 CPU, 512MB RAM) | ~USD 5-10 |
| PostgreSQL (1 CPU, 1GB RAM) | ~USD 8-15 |
| Redis (共享資源) | ~USD 2-5 |
| MinIO (+ 儲存空間費用) | ~USD 3-8 |
| n8n | ~USD 2-5 |
| **總計** | **約 USD 20-43 /月** |

> **省錢建議：** 開發初期可使用 Zeabur 的 Serverless 模式（服務閑置時自動縮容至零），費用可降至 **USD 5-10/月**。
