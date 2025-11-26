# Prompt: 升級虛擬教練 App 至第二階段 (Phase 2)

## 角色 (Role)
請擔任資深全端工程師。請根據以下規格，實作 4 個核心模組，將目前的 MVP App 進行升級。

## 功能需求 (Requirements)

### 1. 身份驗證與使用者管理 (Authentication)
* **目標：** 區分「訪客 (Guest)」與「會員 (Member)」。
* **功能：**
    * 實作 **註冊 / 登入** (Email + 密碼)。
    * (選用) Google 第三方登入。
    * **訪客模式：** 可生成/播放課表，但資料僅存於本地/暫存。訓練結束後，提示註冊以保存紀錄。
    * **會員模式：** 所有資料自動同步至雲端資料庫。
    * **個人頁面：** 編輯基本資料、登出功能。

### 2. 互動式回饋 (Interactive Feedback)
* **組間回饋 (Inter-set)：**
    * 在播放器的「休息 (Rest)」畫面中，顯示 3 個按鈕：**「太簡單」、「剛剛好」、「太難」**。
    * 記錄用戶針對剛完成的該動作的選擇。
* **訓練後回饋 (Post-workout)：**
    * 在「完成頁面 (Complete Screen)」增加 **1-5 星評分** 以及 **文字備註** 輸入框。

### 3. 資料持久化 (Data Persistence)
* **資料架構 (Schema)：** 建立 `WorkoutLog` 模型，包含：
    * `userId` (使用者 ID)
    * `timestamp` (時間戳記)
    * `duration` (總分鐘數)
    * `settings` (當次設定：目標、強度)
    * `exercises` (陣列物件：包含動作名稱、回饋評分、實際執行時間)
* **UI：** 新增 **歷史紀錄頁面 (History Page)**，按時間倒序顯示過去的訓練列表。

### 4. 儀表板與數據分析 (Dashboard & Analytics)
* **會員首頁：** 登入用戶的首頁應從預設的「設定頁」替換為「儀表板」。
* **核心指標 (Key Metrics)：** 顯示總訓練次數、總運動分鐘數、連續天數 (Streak)、預估消耗熱量。
* **視覺化圖表：**
    * **日曆視圖 (Calendar)：** 標記有完成訓練的日期。
    * **部位分佈 (Muscle Distribution)：** 圓餅圖或雷達圖，顯示 `tags` 的頻率 (例如：有氧 vs 肌力 vs 腿部)。

## UX 流程更新 (UX Flow Updates)
1.  **App 啟動：** 檢查 Session -> 若為訪客進入 `Setup`；若為會員進入 `Dashboard`。
2.  **播放器：** 將「回饋 UI」插入至 `Rest` 視圖中。
3.  **結束頁面：** 若為訪客，顯示「註冊以保存」按鈕；若為會員，自動存入 DB 並導向儀表板。

## 執行順序 (Execution)
請依序執行：資料庫架構變更 (Schema) -> 後端邏輯 (Backend Logic) -> 前端 UI 元件 (Frontend UI)。