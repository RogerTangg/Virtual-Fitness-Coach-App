-- ======================================
-- Virtual Coach App - Authentication Schema (Phase 2)
-- ======================================
-- Purpose: 使用者身份驗證與個人資料管理
-- Dependencies: Supabase Auth (auth.users)
-- ======================================

-- ======================================
-- Table: user_profiles
-- Purpose: 儲存使用者公開資料
-- ======================================

CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name VARCHAR(100),
  avatar_url VARCHAR(500),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 建立更新時間觸發器 (使用既有的函數)
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
BEFORE UPDATE ON user_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ======================================
-- Row Level Security (RLS) 政策
-- ======================================

-- 啟用 RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- 政策 1: 使用者可以查看自己的個人資料
CREATE POLICY "Users can view own profile" 
  ON user_profiles 
  FOR SELECT 
  USING (auth.uid() = id);

-- 政策 2: 使用者可以更新自己的個人資料
CREATE POLICY "Users can update own profile" 
  ON user_profiles 
  FOR UPDATE 
  USING (auth.uid() = id);

-- 政策 3: 允許插入新的個人資料 (註冊時自動建立)
CREATE POLICY "Users can insert own profile" 
  ON user_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = id);

-- ======================================
-- Trigger Function: 自動建立使用者個人資料
-- ======================================

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 建立觸發器: 當新使用者註冊時自動建立 profile
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ======================================
-- 建立索引 (加速查詢)
-- ======================================

CREATE INDEX IF NOT EXISTS idx_user_profiles_display_name ON user_profiles (display_name);

-- ======================================
-- 驗證資料結構
-- ======================================

-- 顯示資料表資訊
SELECT 
  table_name, 
  column_name, 
  data_type, 
  is_nullable
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;

-- ======================================
-- 使用說明 (Usage Instructions)
-- ======================================

/*
執行順序 (Execution Order):
1. 確保已在 Supabase Dashboard 啟用 Email Authentication
2. 在 Supabase SQL Editor 中執行此檔案
3. 驗證 user_profiles 表建立成功
4. 驗證 RLS 政策已啟用

測試方法 (Testing):
1. 前端註冊新使用者
2. 檢查 auth.users 表是否有新記錄
3. 檢查 user_profiles 表是否自動建立對應記錄
4. 嘗試以該使用者登入並更新 display_name

清除資料 (Clean Up - 僅開發環境):
-- DELETE FROM user_profiles; -- 這會級聯刪除 auth.users
-- 或直接在 Supabase Auth Dashboard 刪除使用者
*/
