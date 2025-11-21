# 🏋️ Virtual Coach App

> 智能虛擬教練應用程式 - 根據你的目標、偏好和體能程度，自動生成個性化訓練計畫

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19.2.0-blue.svg)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-7.2.2-purple.svg)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green.svg)](https://supabase.com/)

## 📖 專案簡介

Virtual Coach App 是一款現代化的健身訓練應用程式，透過智能演算法為使用者量身打造訓練計畫。無論你是健身新手還是進階訓練者，都能找到適合自己的運動方案。

### ✨ 核心功能

-  **個性化訓練計畫**: 根據訓練目標（減脂/增肌/耐力）自動生成
-  **肌群選擇**: 支援胸部、背部、腿部、肩部、手臂、核心等多個部位
-  **難度調整**: 初階、中階、高階三種難度等級
-  **智能計時器**: 圓形進度環設計，直觀顯示剩餘時間
-  **運動示範**: 詳細的動作說明與指導
-  **響應式設計**: 完美支援桌面、平板、手機三種裝置
-  **抹茶綠主題**: 清新舒適的視覺體驗

## 🚀 快速開始

### 前置需求

- Node.js 20.11.0 或更高版本
- npm 或 yarn
- Git

### 安裝步驟

1. **Clone 專案**
```bash
git clone https://github.com/RogerTangg/Virtual-Coach-App-New_Version.git
cd Virtual-Coach-App-New_Version/virtual_coach_app_frontend
```

2. **安裝相依套件**
```bash
npm install
```

3. **設定環境變數**

複製 `.env` 檔案並填入 Supabase 憑證：
```bash
# .env
VITE_SUPABASE_URL=你的_SUPABASE_URL
VITE_SUPABASE_ANON_KEY=你的_SUPABASE_KEY
```

4. **啟動開發伺服器**
```bash
npm run dev
```

開啟瀏覽器訪問 `http://localhost:5173`

## 🏗️ 專案架構

```
virtual_coach_app_frontend/
├── src/
│   ├── components/          # React 元件
│   │   ├── common/         # 通用元件 (Button, Loading, Toast)
│   │   ├── layout/         # 佈局元件 (AppShell, ResponsiveContainer)
│   │   ├── player/         # 訓練播放器相關元件
│   │   ├── preferences/    # 偏好設定表單
│   │   └── workout/        # 訓練計畫相關元件
│   ├── contexts/           # React Context
│   ├── hooks/              # 自定義 Hooks
│   ├── services/           # API 服務層
│   │   ├── supabaseClient.ts
│   │   ├── exerciseService.ts
│   │   └── workoutGenerator.ts
│   ├── styles/             # 全域樣式
│   ├── theme/              # 主題配置
│   ├── types/              # TypeScript 型別定義
│   └── utils/              # 工具函數
├── tests/                  # 測試檔案
│   ├── unit/              # 單元測試
│   ├── integration/       # 整合測試
│   └── visual/            # 視覺回歸測試 (Playwright)
├── public/                # 靜態資源
├── database/              # 資料庫架構與設定
└── specs/                 # 功能規格文件
```

## 🎨 技術棧

### 前端框架
- **React 19.2.0** - UI 框架
- **TypeScript 5.8.3** - 型別安全
- **Vite 7.2.2** - 建置工具

### UI 庫
- **Mantine v7** - 元件庫
- **Tailwind CSS 4.1** - 樣式工具
- **Framer Motion 11.x** - 動畫

### 後端服務
- **Supabase** - BaaS (PostgreSQL + REST API)

### 測試
- **Vitest 4.0.9** - 單元測試
- **React Testing Library 16.1.0** - 元件測試
- **Playwright 1.40** - E2E 與視覺回歸測試
- **MSW 2.8.0** - API Mocking

## 📱 功能展示

### 1. 偏好設定頁面
選擇訓練目標、目標肌群、難度等級和訓練時長

### 2. 訓練計畫列表
- 自動生成符合偏好的運動項目
- 可展開查看詳細說明
- 顯示組數、次數、休息時間

### 3. 訓練播放器
- 全螢幕沉浸式體驗
- 圓形計時器倒數
- 暫停/繼續/上一個/下一個控制
- 退出確認對話框

### 4. 完成畫面
- 訓練統計摘要
- 重新開始或回到首頁

## 🧪 測試

### 執行所有測試
```bash
npm test
```

### 執行單元測試（Watch 模式）
```bash
npm run test:watch
```

### 執行視覺回歸測試
```bash
npx playwright test
```

### 查看測試覆蓋率
```bash
npm run test:coverage
```

## 🌐 部署

### 部署到 Render

詳細步驟請參考 [RENDER_DEPLOYMENT_GUIDE.md](./virtual_coach_app_frontend/RENDER_DEPLOYMENT_GUIDE.md)

**快速部署**:
1. Fork 此專案到你的 GitHub
2. 在 [Render](https://render.com) 建立新的 Web Service
3. 連接 GitHub Repository
4. 設定環境變數 (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
5. 部署完成！

### 建置指令
```bash
npm run build
```

### 預覽生產版本
```bash
npm run preview
```

## 📊 資料庫架構

使用 Supabase PostgreSQL，包含以下資料表：

- **exercises** - 運動項目資料
  - 名稱、描述、影片連結
  - 目標肌群、難度等級
  - 預設組數、次數、休息時間

詳細架構請參考 [database/schema.sql](./database/schema.sql)

## 🔧 開發指令

| 指令 | 說明 |
|------|------|
| `npm run dev` | 啟動開發伺服器 |
| `npm run build` | 建置生產版本 |
| `npm run preview` | 預覽生產版本 |
| `npm test` | 執行測試 |
| `npm run test:watch` | Watch 模式測試 |
| `npm run lint` | 執行 ESLint |

## 🎯 專案里程碑

- [x] **Phase 1**: 專案設定與架構 (7/7 tasks)
- [x] **Phase 2**: 設計系統建立 (11/11 tasks)
- [x] **Phase 3**: 偏好設定表單 (11/11 tasks)
- [x] **Phase 4**: 訓練計畫列表 (10/10 tasks)
- [x] **Phase 5**: 訓練播放器 (10/10 tasks)
- [x] **Phase 6**: 響應式設計 (14/14 tasks)
- [ ] **Phase 7**: 優化與 Polish (15 tasks)

**總進度**: 63/78 (81%)

## 🤝 貢獻指南

歡迎提交 Issue 和 Pull Request！

1. Fork 此專案
2. 建立功能分支 (`git checkout -b feature/AmazingFeature`)
3. Commit 變更 (`git commit -m 'Add some AmazingFeature'`)
4. Push 到分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📝 授權

此專案採用 MIT 授權 - 詳見 [LICENSE](LICENSE) 檔案