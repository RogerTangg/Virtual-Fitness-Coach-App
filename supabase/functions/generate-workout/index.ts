/**
 * Supabase Edge Function: generate-workout
 * 
 * 作為 Gemini AI API 的安全代理
 * API Key 儲存在 Supabase 環境變數中，不會暴露給前端
 * 
 * 部署指令：
 * supabase functions deploy generate-workout --no-verify-jwt
 * 
 * 環境變數設定：
 * supabase secrets set GEMINI_API_KEY=your_api_key
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

// CORS 標頭
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Gemini API 設定
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

interface GenerateRequest {
  exercises: Array<{
    id: string;
    name: string;
    duration: number;
    description: string;
    tags: string[];
  }>;
  preferences: {
    goal: string;
    durationMinutes: number;
    difficulty: string;
    equipment: string[];
  };
}

serve(async (req: Request) => {
  // 處理 CORS preflight 請求
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // 只允許 POST 請求
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }),
        { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 從環境變數獲取 API Key（安全：不會暴露給前端）
    const apiKey = Deno.env.get('GEMINI_API_KEY');
    if (!apiKey) {
      console.error('GEMINI_API_KEY 環境變數未設定');
      return new Response(
        JSON.stringify({ error: 'AI service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 解析請求
    const { exercises, preferences }: GenerateRequest = await req.json();

    if (!exercises || !preferences) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: exercises, preferences' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 訓練目標翻譯映射
    const GOAL_LABELS: Record<string, string> = {
      'muscle': '增肌訓練',
      'fat-loss': '減脂燃脂',
      'tone': '塑形雕塑',
      'flexibility': '柔軟度提升',
    };

    // 難度翻譯映射
    const DIFFICULTY_LABELS: Record<string, string> = {
      'beginner': '初階',
      'intermediate': '中階',
      'advanced': '高階',
    };

    // 器材翻譯映射
    const EQUIPMENT_LABELS: Record<string, string> = {
      'bodyweight': '徒手',
      'dumbbell': '啞鈴',
      'band': '彈力帶',
      'kettlebell': '壺鈴',
    };

    // 建構 AI 提示詞
    const prompt = `你是一位專業的健身教練。請根據以下條件，從提供的運動列表中選擇最適合的運動組合來設計一個訓練課表。

## 使用者需求
- **訓練目標**: ${GOAL_LABELS[preferences.goal] || preferences.goal}
- **訓練時長**: ${preferences.durationMinutes} 分鐘
- **難度等級**: ${DIFFICULTY_LABELS[preferences.difficulty] || preferences.difficulty}
- **可用器材**: ${preferences.equipment.map(e => EQUIPMENT_LABELS[e] || e).join('、')}

## 可選運動列表
${JSON.stringify(exercises, null, 2)}

## 設計要求
1. 總訓練時間（包含休息）應接近 ${preferences.durationMinutes} 分鐘
2. 每個運動之間會有 30 秒休息時間
3. 選擇多樣化的運動，避免連續相同肌群
4. 根據訓練目標選擇最合適的運動
5. 確保運動順序合理（先暖身、後主訓練）

## 回應格式
請只回傳選中運動的 ID 陣列（JSON 格式），按照建議的執行順序排列。
例如: ["id1", "id2", "id3", ...]

請直接回傳 JSON 陣列，不要包含其他說明文字。`;

    // 呼叫 Gemini API
    const geminiResponse = await fetch(`${GEMINI_API_URL}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.7,
          topK: 40,
          topP: 0.95,
          maxOutputTokens: 2048,
        }
      }),
    });

    if (!geminiResponse.ok) {
      const errorText = await geminiResponse.text();
      console.error('Gemini API 錯誤:', errorText);
      return new Response(
        JSON.stringify({ error: 'AI service error', details: geminiResponse.status }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const geminiData = await geminiResponse.json();
    
    // 提取回應文字
    const responseText = geminiData.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      return new Response(
        JSON.stringify({ error: 'Invalid AI response format' }),
        { status: 502, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // 解析 AI 回應中的運動 ID 列表
    let selectedIds: string[] = [];
    
    // 嘗試匹配 JSON 陣列格式
    const jsonMatch = responseText.match(/\[[\s\S]*?\]/);
    if (jsonMatch) {
      try {
        const ids = JSON.parse(jsonMatch[0]);
        if (Array.isArray(ids)) {
          selectedIds = ids.filter((id: unknown) => typeof id === 'string');
        }
      } catch {
        // 解析失敗，繼續嘗試其他格式
      }
    }

    // 嘗試匹配 UUID 格式
    if (selectedIds.length === 0) {
      const idPattern = /[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}/gi;
      const matches = responseText.match(idPattern);
      selectedIds = matches ? Array.from(new Set(matches)) : [];
    }

    // 回傳結果
    return new Response(
      JSON.stringify({ 
        success: true, 
        selectedExerciseIds: selectedIds,
        rawResponse: responseText // 用於除錯
      }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Edge Function 錯誤:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
