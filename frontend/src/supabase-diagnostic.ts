import { supabase } from './lib/supabase';

/**
 * Supabase 連線診斷工具
 * 測試各種可能的連線問題
 */
export async function diagnoseSupabaseConnection() {
    console.log('=== Supabase 連線診斷開始 ===\n');

    // 1. 檢查環境變數
    console.log('1. 檢查環境變數:');
    // @ts-ignore
    const url = import.meta.env?.VITE_SUPABASE_URL;
    // @ts-ignore
    const key = import.meta.env?.VITE_SUPABASE_ANON_KEY;

    console.log('   URL:', url ? `✓ 已設定 (${url.substring(0, 30)}...)` : '✗ 未設定');
    console.log('   ANON_KEY:', key ? `✓ 已設定 (${key.substring(0, 20)}...)` : '✗ 未設定');

    if (!url || !key) {
        console.error('\n❌ 環境變數未正確設定！請檢查 .env 檔案');
        return;
    }

    // 2. 測試基本連線
    console.log('\n2. 測試 Supabase 基本連線:');
    try {
        const { data, error } = await supabase.auth.getSession();
        console.log('   Auth 連線:', error ? '✗ 失敗' : '✓ 成功');
        if (error) console.error('   錯誤:', error.message);
    } catch (err) {
        console.error('   ✗ 連線失敗:', err);
    }

    // 3. 測試 exercises 表讀取
    console.log('\n3. 測試讀取 exercises 表:');
    try {
        const startTime = Date.now();
        console.log('   發送請求...');

        const { data, error, status, statusText } = await supabase
            .from('exercises')
            .select('*')
            .limit(1);

        const duration = Date.now() - startTime;

        console.log(`   回應時間: ${duration}ms`);
        console.log('   HTTP Status:', status, statusText);
        console.log('   資料:', data ? `✓ 成功讀取 ${data.length} 筆` : '✗ 無資料');

        if (error) {
            console.error('   ✗ 錯誤:', error);
            console.error('   錯誤詳情:', JSON.stringify(error, null, 2));

            if (error.code === 'PGRST116') {
                console.error('\n💡 這是 RLS 權限問題！');
                console.error('   解決方案: 執行以下 SQL:');
                console.error(`   
CREATE POLICY "Allow anonymous read" ON public.exercises
FOR SELECT TO anon USING (true);
        `);
            }
        } else if (data) {
            console.log('   ✓ 成功！範例資料:', data[0]);
        }
    } catch (err: any) {
        console.error('   ✗ 請求失敗:', err.message);
    }

    // 4. 測試 count 查詢
    console.log('\n4. 測試計數查詢:');
    try {
        const { count, error } = await supabase
            .from('exercises')
            .select('*', { count: 'exact', head: true });

        if (error) {
            console.error('   ✗ 錯誤:', error.message);
        } else {
            console.log('   ✓ 總筆數:', count);
        }
    } catch (err) {
        console.error('   ✗ 查詢失敗:', err);
    }

    console.log('\n=== 診斷完成 ===');
}

// 自動執行診斷（僅在開發環境）
if (import.meta.env?.DEV) {
    console.log('🔍 自動執行 Supabase 診斷...\n');
    diagnoseSupabaseConnection();
}
