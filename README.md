# MoneyBook Global

> 專業級別跨國雙重簿記系統，搭載 A.I. 視覺收據掃描，支援全球在地化語言。

---

## 核心特色

- **五大語系**：繁中 / 簡中 / 日本語 / Malay / ไทย，next-intl 動態在地化
- **AI 收據掃描**：相機即時取景 + 上傳圖片 → Gemini 1.5 Flash Vision 解析金額、品項、分類
- **AI 自動分類**：描述欄 blur 後自動呼叫 API 推測支出類別
- **雙重簿記**：PostgreSQL + Prisma，每筆交易嚴格保證 Debit = Credit
- **深色模式**：Vanilla CSS Variables，localStorage 持久化
- **MyAB CSV 匯入**：從既有記帳 App 無痛遷移
- **Google SSO**：無密碼 OAuth 2.0 登入
- **手機優先 UI**：Inter 字型、8pt 間距系統、44px 觸控目標、⋯ 收合選單

---

## Tech Stack

| 層面 | 選擇 |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Auth | NextAuth v5 (Auth.js) + Google OAuth 2.0 |
| Database | PostgreSQL + Prisma v6 |
| i18n | next-intl 4.x — `/[locale]/` route segments |
| AI | Google Gemini 1.5 Flash Vision |
| Styles | Vanilla CSS + CSS Variables |
| Deploy | Zeabur (Docker) + Cloudflare Tunnel |

---

## 本地開發

```bash
npm install
cp .env.example .env.local   # 填入環境變數
npx prisma db push
npm run dev
```

### 必要環境變數

```env
DATABASE_URL=postgresql://...
NEXTAUTH_URL=https://your-domain.com
NEXTAUTH_SECRET=...
AUTH_TRUST_HOST=true
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GEMINI_API_KEY=...
```

---

## 部署架構

```
GitHub push → Zeabur auto-rebuild (Dockerfile)
             → prisma db push (自動同步 schema)
             → Next.js production server :3000
             ← Cloudflare Tunnel ← icq6161620.dpdns.org
```

詳見 `docs/zeabur_部署架構分析.md`

---

## 文件

| 檔案 | 說明 |
|---|---|
| `docs/implementation_plan.md` | 系統架構、DB Schema、開發 Roadmap |
| `docs/impl_progress.md` | 實作進度記錄 |
| `docs/zeabur_部署架構分析.md` | Zeabur 部署架構分析 |
| `docs/開發計畫書_競品分析與需求規劃.md` | 產品規劃與競品分析 |
| `CHANGELOG.md` | 版本變更記錄 |
