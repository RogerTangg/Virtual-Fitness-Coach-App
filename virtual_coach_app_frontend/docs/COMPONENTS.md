# 組件文件 (Component Documentation)

## 概述 (Overview)

本文件說明虛擬健身教練應用程式中的主要 React 組件，包含用途、Props 定義以及使用範例。

---

## 主要組件 (Main Components)

### 1. `SetupScreen` - 偏好設定畫面

**檔案路徑 (File Path)**: `components/setup/SetupScreen.tsx`

**用途 (Purpose)**: 
引導使用者設定運動偏好，包含目標、器材、時長與難度。採用多步驟表單設計。

**Props 定義 (Props Definition)**:

```typescript
interface SetupScreenProps {
  /** 完成設定時的回調函數 (Callback when setup is complete) */
  onComplete: (preferences: UserPreferences) => void;
  
  /** 返回上一頁的回調函數 (Callback to go back) */
  onBack: () => void;
}
```

**主要功能 (Key Features)**:
- 多步驟表單（目標 → 器材 → 時長/難度）
- 視覺化選擇按鈕
- 輸入驗證（確保必填項完成）
- 響應式設計

**使用範例 (Usage Example)**:
```tsx
<SetupScreen 
  onComplete={(prefs) => {
    console.log('使用者偏好:', prefs);
    // 進入課表生成流程
  }}
  onBack={() => {
    // 返回首頁
  }}
/>
```

---

### 2. `PlanOverviewScreen` - 課表總覽畫面

**檔案路徑 (File Path)**: `components/plan/PlanOverviewScreen.tsx`

**用途 (Purpose)**: 
顯示生成的訓練課表，使用者可查看詳細內容並決定是否開始訓練。

**Props 定義 (Props Definition)**:

```typescript
interface PlanOverviewScreenProps {
  /** 訓練計畫陣列 (Workout plan items) */
  plan: PlanItem[];
  
  /** 使用者偏好設定 (User preferences) */
  preferences: UserPreferences | null;
  
  /** 開始訓練的回調函數 (Callback to start workout) */
  onStart: () => void;
  
  /** 返回上一頁的回調函數 (Callback to go back) */
  onBack: () => void;
}
```

**主要功能 (Key Features)**:
- 展示訓練計畫卡片列表
- 可展開查看運動詳細說明
- 顯示總時長與運動數量統計
- 操作按鈕（開始訓練、重新設定）

**使用範例 (Usage Example)**:
```tsx
<PlanOverviewScreen 
  plan={workoutPlan}
  preferences={userPrefs}
  onStart={() => {
    // 進入訓練播放器
  }}
  onBack={() => {
    // 返回偏好設定
  }}
/>
```

---

### 3. `PlayerScreen` - 訓練播放器畫面

**檔案路徑 (File Path)**: `components/player/PlayerScreen.tsx`

**用途 (Purpose)**: 
全螢幕訓練播放器，逐一引導使用者完成訓練項目，包含計時器與控制按鈕。

**Props 定義 (Props Definition)**:

```typescript
interface PlayerScreenProps {
  /** 訓練計畫陣列 (Workout plan items) */
  plan: PlanItem[];
  
  /** 完成訓練的回調函數 (Callback when workout is completed) */
  onComplete: () => void;
  
  /** 退出訓練的回調函數 (Callback to exit workout) */
  onExit: () => void;
}
```

**主要功能 (Key Features)**:
- 全螢幕沉浸式介面
- 圓形進度條計時器
- 控制按鈕（暫停/繼續、上一個、下一個、退出）
- 自動倒數與自動切換下一項
- 語音提示（可選）

**狀態管理 (State Management)**:
- `currentIndex`: 當前訓練項目索引
- `timeLeft`: 剩餘時間（秒）
- `isPlaying`: 是否正在播放

**使用範例 (Usage Example)**:
```tsx
<PlayerScreen 
  plan={workoutPlan}
  onComplete={() => {
    // 進入完成畫面
  }}
  onExit={() => {
    // 確認後返回首頁
  }}
/>
```

---

### 4. `CompletedScreen` - 訓練完成畫面

**檔案路徑 (File Path)**: `components/player/CompletedScreen.tsx`

**用途 (Purpose)**: 
顯示訓練完成的慶祝畫面，提供返回首頁或重新開始的選項。

**Props 定義 (Props Definition)**:

```typescript
interface CompletedScreenProps {
  /** 訓練總時長（分鐘） (Total workout duration in minutes) */
  durationMinutes: number;
  
  /** 返回首頁的回調函數 (Callback to go home) */
  onHome: () => void;
}
```

**主要功能 (Key Features)**:
- 慶祝訊息與視覺效果
- 訓練統計摘要
- 操作按鈕（回到首頁、再練一次）

**使用範例 (Usage Example)**:
```tsx
<CompletedScreen 
  durationMinutes={30}
  onHome={() => {
    // 返回首頁
  }}
/>
```

---

## 通用 UI 組件 (Common UI Components)

### `Button` - 按鈕組件

**檔案路徑 (File Path)**: `components/ui/Button.tsx`

**用途 (Purpose)**: 
通用按鈕組件，支援多種尺寸與樣式變體。

**Props 定義 (Props Definition)**:

```typescript
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** 按鈕尺寸 (Button size) */
  size?: 'sm' | 'md' | 'lg';
  
  /** 按鈕樣式變體 (Button variant) */
  variant?: 'primary' | 'secondary' | 'outline';
  
  /** 子元素 (Children) */
  children: React.ReactNode;
}
```

**使用範例 (Usage Example)**:
```tsx
<Button size="lg" variant="primary" onClick={handleClick}>
  開始訓練
</Button>
```

---

## 組件層級架構 (Component Hierarchy)

```
App
├── Header
├── HomeScreen
├── SetupScreen
├── GeneratingScreen
├── PlanOverviewScreen
├── PlayerScreen
│   └── CircularTimer (內部組件)
└── CompletedScreen
```

---

## 設計原則 (Design Principles)

### 1. 單一職責 (Single Responsibility)
每個組件專注於單一功能，例如 `SetupScreen` 僅負責偏好設定。

### 2. Props 驅動 (Props-Driven)
組件不直接管理全域狀態，透過 Props 接收資料與回調函數。

### 3. 無障礙設計 (Accessibility)
- 使用語意化 HTML 標籤
- 支援鍵盤導航
- 適當的 ARIA 屬性

### 4. 響應式設計 (Responsive Design)
所有組件支援手機、平板、桌面三種裝置，使用 Tailwind CSS 的響應式工具類別。

---

## 擴展建議 (Extension Recommendations)

### 未來可新增的組件 (Future Components)

1. **`ProgressTracker`** - 訓練進度追蹤器
2. **`WorkoutHistoryList`** - 訓練歷史列表
3. **`CustomWorkoutBuilder`** - 自訂課表編輯器
4. **`SettingsPanel`** - 應用程式設定面板

---

**維護者 (Maintainer)**: Roger Tang  
**最後更新 (Last Updated)**: 2025-11-21
