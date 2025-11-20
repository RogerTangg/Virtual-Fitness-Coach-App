# 虛擬健身教練 (Virtual Fitness Coach)

> 智能虛擬教練應用程式 - 根據你的目標、偏好和體能程度，自動生成個性化訓練計畫

## 專案簡介 (Project Overview)

Virtual Fitness Coach 是一款現代化的健身訓練應用程式，透過智能演算法為使用者量身打造訓練計畫。無論你是健身新手還是進階訓練者，都能找到適合自己的運動方案。

### 核心功能 (Core Features)

- **個性化訓練計畫 (Personalized Workout Plans)**: 根據訓練目標（減脂/增肌/耐力）自動生成
- **多樣化選擇 (Diverse Options)**: 支援徒手、啞鈴、彈力帶等多種器材
- **難度調整 (Difficulty Adjustment)**: 初階、中階、高階三種難度等級
- **智能計時器 (Smart Timer)**: 圓形進度環設計，直觀顯示剩餘時間
- **運動示範 (Exercise Demonstrations)**: 詳細的動作說明與指導
- **響應式設計 (Responsive Design)**: 完美支援桌面、平板、手機三種裝置
- **抹茶綠主題 (Matcha Green Theme)**: 清新舒適的視覺體驗

---

## 快速開始 (Quick Start)

### 前置需求 (Prerequisites)

- Node.js 20.11.0 或更高版本
- npm 或 yarn
- Supabase 帳號（用於資料庫服務）

### 安裝步驟 (Installation)

1. **安裝相依套件 (Install Dependencies)**
   ```bash
   npm install
   ```

2. **設定環境變數 (Configure Environment Variables)**
   
   創建 `.env` 檔案並填入以下內容：
   ```env
   VITE_SUPABASE_URL=你的_SUPABASE_URL
   VITE_SUPABASE_ANON_KEY=你的_SUPABASE_ANON_KEY
   GEMINI_API_KEY=你的_GEMINI_API_KEY
   ```

3. **啟動開發伺服器 (Start Development Server)**
   ```bash
   npm run dev
   ```
   
   開啟瀏覽器訪問 `http://localhost:3000`

---

## 專案架構 (Project Structure)

```
virtual_coach_app_frontend/
├── components/           # React 元件 (React Components)
│   ├── setup/           # 偏好設定表單 (Preference Setup Forms)
│   ├── plan/            # 訓練計畫相關元件 (Workout Plan Components)
│   ├── player/          # 訓練播放器相關元件 (Workout Player Components)
│   └── ui/              # 通用 UI 元件 (Common UI Components)
├── features/            # 功能模組 (Feature Modules)
│   └── generator/       # 課表生成引擎 (Workout Plan Generator)
├── services/            # 服務層 (Service Layer)
│   └── exerciseService.ts  # Supabase 資料查詢服務
├── types/               # TypeScript 型別定義 (Type Definitions)
├── utils/               # 工具函數 (Utility Functions)
├── hooks/               # 自定義 React Hooks (Custom React Hooks)
├── data/                # 靜態資料 (Static Data)
└── docs/                # 專案文件 (Project Documentation)
```

---

## 技術棧 (Tech Stack)

### 前端框架 (Frontend Framework)
- **React 19.2.0** - UI 框架
- **TypeScript 5.8.2** - 型別安全
- **Vite 6.2.0** - 建置工具 (Build Tool)

### UI 與樣式 (UI & Styling)
- **Tailwind CSS 4.1** (CDN) - 樣式工具
- **Lucide React** - 圖示庫 (Icon Library)

### 後端服務 (Backend Service)
- **Supabase** - BaaS (Backend as a Service)
  - PostgreSQL 資料庫
  - REST API 自動生成

---

## 開發指令 (Development Commands)

| 指令 (Command) | 說明 (Description) |
|------|------|
| `npm run dev` | 啟動開發伺服器 (Start development server) |
| `npm run build` | 建置生產版本 (Build for production) |
| `npm run preview` | 預覽生產版本 (Preview production build) |

---

## 部署 (Deployment)

### 部署到 Render (Deploy to Render)

詳細步驟請參考 [RENDER_DEPLOYMENT_GUIDE.md](./RENDER_DEPLOYMENT_GUIDE.md)

**快速部署步驟 (Quick Deployment Steps)**:
1. 在 [Render](https://render.com) 建立新的 Static Site
2. 連接 GitHub Repository
3. 設定環境變數 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`)
4. 建置指令 (Build Command): `npm install && npm run build`
5. 發布目錄 (Publish Directory): `dist`
6. 部署完成！

---

## 資料庫架構 (Database Schema)

使用 Supabase PostgreSQL，詳細架構請參考 [docs/API.md](./docs/API.md)

---

## 文件 (Documentation)

- [API 文件 (API Documentation)](./docs/API.md) - Supabase 資料表結構與查詢邏輯
- [組件文件 (Component Documentation)](./docs/COMPONENTS.md) - 組件用途、Props 定義、使用範例
- [Render 部署指南 (Render Deployment Guide)](./RENDER_DEPLOYMENT_GUIDE.md) - 安全部署步驟

---

## 開發規範 (Development Guidelines)

本專案遵循 [Virtual Coach App Constitution](../.specify/memory/constitution.md) 開發準則：

- ✅ 程式碼品質標準 (Code Quality Standards)
- ✅ 測試標準 (Testing Standards)
- ✅ 使用者體驗一致性 (User Experience Consistency)
- ✅ 效能要求 (Performance Requirements)
- ✅ 文件與註解規範 (Documentation Standards) - 繁體中文為主

---

## 聯絡方式 (Contact)

如有任何問題或建議，歡迎透過以下方式聯繫：
- 開 Issue: [GitHub Issues](https://github.com/RogerTangg/Virtual-Coach-App-New_Version/issues)

---

⭐ 如果這個專案對你有幫助，請給個 Star！

Made with ❤️ and 💪 by Roger Tang
