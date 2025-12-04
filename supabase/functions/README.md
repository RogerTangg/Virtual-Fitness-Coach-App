# Supabase Edge Functions

本目錄包含專案使用的 Supabase Edge Functions。

## generate-workout

AI 訓練課表生成器的安全代理函數，用於保護 Gemini API Key 不暴露給前端。

### 功能

- 接收前端傳來的運動列表和使用者偏好
- 使用伺服器端儲存的 Gemini API Key 呼叫 AI
- 回傳 AI 選擇的運動 ID 列表

### 部署步驟

#### 1. 安裝 Supabase CLI

```bash
npm install -g supabase
```

#### 2. 登入 Supabase

```bash
supabase login
```

#### 3. 連結專案

```bash
supabase link --project-ref YOUR_PROJECT_REF
```

#### 4. 設置 Gemini API Key（Secret）

```bash
supabase secrets set GEMINI_API_KEY=your_actual_gemini_api_key
```

#### 5. 部署 Edge Function

```bash
supabase functions deploy generate-workout
```

### 本地開發測試

```bash
# 啟動本地 Edge Function 服務
supabase functions serve generate-workout --env-file .env.local

# 測試呼叫
curl -i --location 'http://localhost:54321/functions/v1/generate-workout' \
  --header 'Authorization: Bearer YOUR_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{
    "exercises": [...],
    "preferences": {
      "goal": "muscle",
      "durationMinutes": 30,
      "difficulty": "intermediate",
      "equipment": ["bodyweight", "dumbbell"]
    }
  }'
```

### 環境變數

| 變數名稱 | 說明 | 儲存位置 |
|---------|------|---------|
| `GEMINI_API_KEY` | Google Gemini API 金鑰 | Supabase Secrets（伺服器端） |

### 前端呼叫方式

```typescript
const { data, error } = await supabase.functions.invoke('generate-workout', {
  body: { exercises, preferences },
});
```

### 安全性

- ✅ API Key 儲存在 Supabase Secrets，不會暴露給前端
- ✅ 支援 CORS，允許前端跨域呼叫
- ✅ 驗證請求格式，防止無效呼叫
