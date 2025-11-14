# PRD：虛擬健身教練互動應用 (MVP)
# 產品需求文件 (功能性)

## 1. 總覽

本文件定義了「虛擬健身教練互動應用」MVP 的核心功能需求。

**MVP 核心目標：** 打造一個無須登入的網頁應用。Trainee (學員) 輸入個人偏好 後，系統能立即生成一個客製化的訓練課表，並透過一個全螢幕的「訓練播放器」介面引導學員完成訓練。所有內容應由 Admin (管理員) 透過一個獨立的 CMS (內容管理系統) 進行維護。

---

## 2. 核心史詩 (Epics)

我們將功能需求拆分為四大史詩 (Epics)：

* **Epic 1: 內容管理 (CMS)** - *Admin (管理員) 的功能*
* **Epic 2: 偏好設定 (Input)** - *Trainee (學員) 的功能*
* **Epic 3: 課表生成 (Logic)** - *System (系統) 的功能*
* **Epic 4: 訓練播放器 (Player)** - *Trainee (學員) 的功能*

---

## 3. 功能需求 (Functional Requirements)

### Epic 1: 內容管理 (CMS)

**User Role:** Admin (管理員)
**Goal:** 透過 Supabase 提供的圖形化介面，管理所有「運動數據資料庫」，無需撰寫程式碼。

| 序號 | User Story | 驗收標準 (Acceptance Criteria) |
| :--- | :--- | :--- |
| **F-1.1** | 作為 Admin，我**必須**能新增、編輯、刪除「運動」資料。 | 1. 系統需有一個 `exercises` (運動) 資料表。<br/>2. 每一筆 `exercise` 資料**必須**包含以下欄位：<br/> &nbsp;&nbsp;&nbsp;&nbsp;- `name` (文字)：動作名稱<br/> &nbsp;&nbsp;&nbsp;&nbsp;- `description` (文字)：動作說明/注意事項<br/> &nbsp;&nbsp;&nbsp;&nbsp;- `video_url` (文字)：連結至一個 MP4 或 GIF 檔案 (示範影片)<br/> &nbsp;&nbsp;&nbsp;&nbsp;- `duration_seconds` (數字)：此動作的建議持續時間 (秒)<br/> &nbsp;&nbsp;&nbsp;&nbsp;- `tags` (陣列)：用於篩選的標籤 |
| **F-1.2** | 作為 Admin，我**必須**能為每個運動定義「標籤 (Tags)」。 | 1. `tags` 欄位是實現「個人化」的核心。<br/>2. Admin **必須**能自由新增標籤，但應遵循以下格式：<br/> &nbsp;&nbsp;&nbsp;&nbsp;- `goal:增肌` 或 `goal:減脂`<br/> &nbsp;&nbsp;&nbsp;&nbsp;- `difficulty:初階` 或 `difficulty:中階`<br/> &nbsp;&nbsp;&nbsp;&nbsp;- `equipment:徒手` 或 `equipment:啞鈴`<br/> &nbsp;&nbsp;&nbsp;&nbsp;- `type:肌力` 或 `type:有氧` |

### Epic 2: 偏好設定 (Input)

**User Role:** Trainee (學員)
**Goal:** Trainee 在應用程式的主畫面，設定他們當次的訓練需求。

| 序號 | User Story | 驗收標準 (Acceptance Criteria) |
| :--- | :--- | :--- |
| **F-2.1** | 作為 Trainee，我**必須**能選擇我的「運動目標」。 | 1. 介面上提供「運動目標」的選項 (例如：單選按鈕)。<br/>2. 選項應包含：增肌、減脂、塑形等。 |
| **F-2.2** | 作為 Trainee，我**必須**能選擇「可用的器材」。 | 1. 介面上提供「可用器材」的選項 (例如：多選核取方塊)。<br/>2. 選項應包含：徒手、啞鈴、彈力帶等。 |
| **F-2.3** | 作為 Trainee，我**必須**能選擇「運動總時長」。 | 1. 介面上提供「總時長」的選項 (例如：滑桿或下拉選單)。<br/>2. 選項應包含：15 分鐘、30 分鐘、45 分鐘等。 |
| **F-2.4** | 作為 Trainee，我**必須**能選擇「難度偏好」。 | 1. 介