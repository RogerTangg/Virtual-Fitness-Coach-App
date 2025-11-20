# API 文件 (API Documentation)

## 概述 (Overview)

本文件說明虛擬健身教練應用程式的資料層架構，包含 Supabase 資料表結構、查詢邏輯以及服務層 API。

---

## Supabase 資料表結構 (Database Schema)

### `exercises` 資料表 (Exercises Table)

儲存所有運動項目的資料。

#### 欄位定義 (Column Definitions)

| 欄位名稱 (Column) | 型別 (Type) | 必填 (Required) | 說明 (Description) |
|---|---|---|---|
| `id` | `uuid` | ✅ | 主鍵 (Primary Key)，自動生成 |
| `name` | `text` | ✅ | 運動名稱（例如：伏地挺身） |
| `description` | `text` | ✅ | 動作說明/注意事項 |
| `video_url` | `text` | ❌ | 示範影片連結（MP4 或 GIF） |
| `duration_seconds` | `integer` | ✅ | 建議持續時間（秒） |
| `tags` | `text[]` | ✅ | 標籤陣列，用於篩選 |
| `created_at` | `timestamp` | ✅ | 建立時間（自動） |

#### 標籤格式 (Tag Format)

標籤用於實現個人化課表生成，格式為 `類別:值`：

- **目標 (Goal)**: `goal:增肌`、`goal:減脂`、`goal:塑形`
- **難度 (Difficulty)**: `difficulty:初階`、`difficulty:中階`、`difficulty:高階`
- **器材 (Equipment)**: `equipment:徒手`、`equipment:啞鈴`、`equipment:彈力帶`
- **類型 (Type)**: `type:肌力`、`type:有氧`、`type:核心`

#### 範例資料 (Example Data)

```sql
INSERT INTO exercises (name, description, duration_seconds, tags) VALUES
(
  '伏地挺身',
  '雙手撐地，身體保持一直線，手肘彎曲至胸部接近地面後推起',
  60,
  ARRAY['goal:增肌', 'difficulty:初階', 'equipment:徒手', 'type:肌力']
);
```

---

## 服務層 API (Service Layer APIs)

### `exerciseService.ts`

負責與 Supabase 溝通，獲取運動資料。

#### `getAllExercises()`

**功能 (Purpose)**: 獲取所有運動資料，包含 Fallback 機制。

**回傳值 (Return Type)**: `Promise<Exercise[]>`

**邏輯流程 (Logic Flow)**:
1. 檢查 Supabase URL 是否已配置
2. 若未配置，直接使用 Mock Data（`data/mockExercises.ts`）
3. 從 Supabase `exercises` 資料表查詢所有資料
4. 若查詢失敗或資料為空，使用 Mock Data 作為 Fallback
5. 資料清洗：確保 `tags` 欄位必為陣列

**錯誤處理 (Error Handling)**:
- Supabase URL 未設定 → 使用 Mock Data
- 網路請求失敗 → 使用 Mock Data
- 資料庫為空 → 使用 Mock Data

**使用範例 (Usage Example)**:
```typescript
import { getAllExercises } from './services/exerciseService';

const exercises = await getAllExercises();
console.log(`共載入 ${exercises.length} 個運動項目`);
```

---

## 型別定義 (Type Definitions)

### `Exercise` (來自 `types/db.ts`)

```typescript
export interface Exercise {
  id: string;
  name: string;              // 運動名稱 (Exercise name)
  description: string;       // 動作說明 (Description)
  video_url?: string;        // 示範影片 (Demo video)
  duration_seconds: number;  // 建議時長（秒） (Duration in seconds)
  tags: string[];            // 標籤陣列 (Tags array)
}
```

### `UserPreferences` (來自 `types/app.ts`)

```typescript
export interface UserPreferences {
  goal: string;                // 運動目標 (例如: 增肌, 減脂)
  equipment: string[];        // 可用器材 (例如: 徒手, 啞鈴)
  durationMinutes: number;    // 總訓練時長（分鐘）
  difficulty: 'beginner' | 'intermediate' | 'advanced';  // 難度偏好
}
```

---

## 查詢邏輯說明 (Query Logic)

### 課表生成流程 (Workout Plan Generation Flow)

**步驟 (Steps)**:
1. **獲取所有運動資料** - 呼叫 `getAllExercises()`
2. **根據偏好篩選** - 比對使用者的 `goal`、`equipment`、`difficulty` 與運動的 `tags`
3. **隨機選擇** - 從符合條件的運動中隨機挑選
4. **計算時長** - 根據 `durationMinutes` 配置運動與休息時間
5. **生成最終課表** - 回傳 `PlanItem[]` 陣列

詳細實作請參考 `features/generator/engine.ts`。

---

## 資料流程圖 (Data Flow Diagram)

```
使用者偏好 (User Preferences)
    ↓
課表生成引擎 (Workout Generator)
    ↓
exerciseService.getAllExercises()
    ↓
Supabase API / Mock Data
    ↓
篩選與隨機選擇 (Filter & Random Selection)
    ↓
生成訓練計畫 (Generate Workout Plan)
    ↓
訓練播放器 (Workout Player)
```

---

## 擴展建議 (Extension Recommendations)

### 未來可新增的資料表 (Future Tables)

1. **`user_profiles`** - 使用者資料（若需登入功能）
2. **`workout_history`** - 訓練歷史記錄
3. **`custom_workouts`** - 使用者自訂課表

### 效能優化 (Performance Optimization)

- 實作查詢快取（例如使用 React Query）
- 為 `tags` 欄位建立 GIN Index（PostgreSQL 全文搜尋索引）
- 實作分頁查詢（若運動資料量大）

---

**維護者 (Maintainer)**: Roger Tang  
**最後更新 (Last Updated)**: 2025-11-21
