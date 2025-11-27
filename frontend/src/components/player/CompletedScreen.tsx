import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Button } from '../ui/Button';
import { 
  Trophy, 
  Home, 
  Star, 
  History, 
  Loader2, 
  Clock, 
  Flame, 
  Target,
  TrendingUp,
  Zap,
  Dumbbell,
  CheckCircle
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { createWorkoutLog, updateWorkoutLog } from '../../services/workoutLogService';
import { 
  WorkoutLog, 
  CreateWorkoutLogInput, 
  ExerciseLogEntry, 
  preferencesToSettings 
} from '../../types/workoutLog';
import { UserPreferences, PlanItem } from '../../types/app';

interface CompletedScreenProps {
  durationMinutes: number;
  preferences: UserPreferences;
  plan: PlanItem[];
  exerciseFeedback?: Map<string, 'too_easy' | 'just_right' | 'too_hard'>;
  startedAt: string;
  onHome: () => void;
  onHistory: () => void;
  /** 實際完成的動作數量（中途離開時可能少於 plan 中的總數） */
  completedExerciseCount?: number;
  /** 實際訓練秒數（精確追蹤時間） */
  actualDurationSeconds?: number;
}

/**
 * 圓環進度圖組件
 */
const ProgressRing: React.FC<{
  progress: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  bgColor?: string;
  children?: React.ReactNode;
}> = ({ 
  progress, 
  size = 100, 
  strokeWidth = 8, 
  color = '#1A365D',
  bgColor = '#E2E8F0',
  children 
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg className="transform -rotate-90" width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={bgColor}
          strokeWidth={strokeWidth}
          fill="none"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        {children}
      </div>
    </div>
  );
};

/**
 * 統計數字卡片組件
 */
const StatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subLabel?: string;
  color: string;
}> = ({ icon, label, value, subLabel, color }) => (
  <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
    <div className={`w-10 h-10 rounded-full ${color} flex items-center justify-center mx-auto mb-2`}>
      {icon}
    </div>
    <p className="text-2xl font-bold text-gray-800">{value}</p>
    <p className="text-sm text-gray-500">{label}</p>
    {subLabel && <p className="text-xs text-gray-400 mt-1">{subLabel}</p>}
  </div>
);

/**
 * 動作完成列表組件
 */
const ExerciseCompletionList: React.FC<{
  plan: PlanItem[];
  exerciseFeedback?: Map<string, 'too_easy' | 'just_right' | 'too_hard'>;
  completedCount?: number;
}> = ({ plan, exerciseFeedback, completedCount }) => {
  const exercises = plan.filter(item => item.type === 'exercise');
  const actualCompleted = completedCount !== undefined ? completedCount : exercises.length;
  
  if (exercises.length === 0) return null;

  const getFeedbackLabel = (feedback: string | undefined) => {
    switch (feedback) {
      case 'too_easy': return { text: '太簡單', color: 'text-green-600 bg-green-50' };
      case 'just_right': return { text: '剛剛好', color: 'text-blue-600 bg-blue-50' };
      case 'too_hard': return { text: '太困難', color: 'text-orange-600 bg-orange-50' };
      default: return null;
    }
  };

  return (
    <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
      <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
        <Dumbbell className="w-4 h-4 text-brand-dark" />
        動作列表 ({actualCompleted}/{exercises.length} 已完成)
      </h4>
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {exercises.map((item, idx) => {
          const isCompleted = idx < actualCompleted;
          const feedback = exerciseFeedback?.get(item.exercise?.id || '');
          const feedbackInfo = getFeedbackLabel(feedback);
          
          return (
            <div key={idx} className={`flex items-center justify-between py-2 border-b border-gray-50 last:border-0 ${!isCompleted ? 'opacity-50' : ''}`}>
              <div className="flex items-center gap-2">
                <CheckCircle className={`w-4 h-4 ${isCompleted ? 'text-green-500' : 'text-gray-300'}`} />
                <span className={`text-sm ${isCompleted ? 'text-gray-700' : 'text-gray-400 line-through'}`}>{item.title}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">{item.duration}秒</span>
                {isCompleted && feedbackInfo && (
                  <span className={`text-xs px-2 py-0.5 rounded-full ${feedbackInfo.color}`}>
                    {feedbackInfo.text}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

/**
 * 訓練完成頁面 (Completed Screen)
 * Phase 2 更新: 支援訓練紀錄儲存與回饋評分、統計圖表視覺化
 */
export const CompletedScreen: React.FC<CompletedScreenProps> = ({ 
  durationMinutes, 
  preferences,
  plan,
  exerciseFeedback,
  startedAt,
  onHome,
  onHistory,
  completedExerciseCount,
  actualDurationSeconds,
}) => {
  const { user } = useAuth();
  const [rating, setRating] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [savedLogId, setSavedLogId] = useState<string | null>(null);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const hasSavedRef = useRef(false); // 防止重複儲存

  // 自動儲存訓練紀錄 (不含評分) - 只執行一次
  // 加入依賴以確保 props 已完全傳入
  useEffect(() => {
    if (hasSavedRef.current) return; // 已儲存過則跳過
    
    // 確保 plan 已準備好再儲存
    if (!plan || plan.length === 0) return;
    
    hasSavedRef.current = true;
    
    const saveLog = async () => {
      // 取得所有動作
      const allExercises = plan.filter(item => item.type === 'exercise');
      
      // 根據實際完成數量決定記錄哪些動作
      const actualCompleted = completedExerciseCount !== undefined 
        ? completedExerciseCount 
        : allExercises.length;
      
      // 建立動作執行紀錄
      const exerciseLogs: ExerciseLogEntry[] = allExercises.map((item, index) => ({
        name: item.title,
        exerciseId: item.exercise?.id,
        plannedDuration: item.duration,
        actualDuration: index < actualCompleted ? item.duration : 0,
        completed: index < actualCompleted,
        feedback: exerciseFeedback?.get(item.exercise?.id || '') || null,
      }));

      // 使用實際訓練時間
      const actualMinutes = actualDurationSeconds !== undefined 
        ? Math.round(actualDurationSeconds / 60) 
        : durationMinutes;

      const input: CreateWorkoutLogInput = {
        started_at: startedAt,
        completed_at: new Date().toISOString(),
        duration_minutes: actualMinutes > 0 ? actualMinutes : 1, // 至少 1 分鐘
        settings: preferencesToSettings(preferences),
        exercises: exerciseLogs,
        rating: null,
        notes: null,
      };

      try {
        console.log('儲存訓練紀錄:', { actualCompleted, actualMinutes, exerciseCount: exerciseLogs.length });
        const log = await createWorkoutLog(user?.id || null, input);
        if (log) {
          setSavedLogId(log.id);
          setIsSaved(true);
          console.log('訓練紀錄儲存成功:', log.id);
        }
      } catch (error) {
        console.error('儲存訓練紀錄失敗:', error);
      }
    };

    saveLog();
  }, [plan, completedExerciseCount, actualDurationSeconds, preferences, startedAt, user?.id, durationMinutes, exerciseFeedback]);

  // 儲存評分與備註
  const handleSaveRating = async () => {
    if (!savedLogId || rating === 0) return;

    setIsSaving(true);
    try {
      await updateWorkoutLog(savedLogId, user?.id || null, {
        rating,
        notes: notes.trim() || null,
      });
    } catch (error) {
      console.error('儲存評分失敗:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // 評分變更時自動儲存
  useEffect(() => {
    if (rating > 0 && savedLogId) {
      handleSaveRating();
    }
  }, [rating]);

  // 計算訓練統計數據
  const stats = useMemo(() => {
    const allExercises = plan.filter(item => item.type === 'exercise');
    const totalExercises = allExercises.length;
    
    // 使用實際完成數量（若有傳入），否則預設為全部完成
    const actualCompleted = completedExerciseCount !== undefined 
      ? completedExerciseCount 
      : totalExercises;
    
    // 計算已完成動作的預定總秒數
    const completedExercises = allExercises.slice(0, actualCompleted);
    const plannedSeconds = completedExercises.reduce((sum, item) => sum + (item.duration || 0), 0);
    
    // 使用實際訓練秒數（若有傳入），否則使用計劃時間
    const actualSeconds = actualDurationSeconds !== undefined 
      ? actualDurationSeconds 
      : plannedSeconds;
    
    // 轉換為分鐘顯示
    const actualMinutes = Math.round(actualSeconds / 60);
    
    // 估算消耗熱量 (基於 MET 值)
    // 假設中等強度運動 MET = 5, 體重 70kg
    // 使用實際訓練分鐘數計算
    const estimatedCalories = Math.round((5 * 70 * actualMinutes) / 60);
    
    // 計算回饋分佈
    let tooEasy = 0, justRight = 0, tooHard = 0;
    exerciseFeedback?.forEach((feedback) => {
      if (feedback === 'too_easy') tooEasy++;
      else if (feedback === 'just_right') justRight++;
      else if (feedback === 'too_hard') tooHard++;
    });

    // 完成率 = 實際完成 / 計劃總數
    const completionRate = totalExercises > 0 
      ? Math.round((actualCompleted / totalExercises) * 100) 
      : 0;

    return {
      totalExercises,
      actualCompleted,
      plannedSeconds,
      actualSeconds,
      actualMinutes,
      estimatedCalories,
      feedbackDistribution: { tooEasy, justRight, tooHard },
      avgDurationPerExercise: actualCompleted > 0 ? Math.round(actualSeconds / actualCompleted) : 0,
      completionRate,
      isPartialComplete: actualCompleted < totalExercises,
    };
  }, [plan, durationMinutes, exerciseFeedback, completedExerciseCount, actualDurationSeconds]);

  // 計算回饋分佈百分比（用於圖表）
  const feedbackTotal = stats.feedbackDistribution.tooEasy + stats.feedbackDistribution.justRight + stats.feedbackDistribution.tooHard;
  const feedbackPercentages = feedbackTotal > 0 ? {
    tooEasy: Math.round((stats.feedbackDistribution.tooEasy / feedbackTotal) * 100),
    justRight: Math.round((stats.feedbackDistribution.justRight / feedbackTotal) * 100),
    tooHard: Math.round((stats.feedbackDistribution.tooHard / feedbackTotal) * 100),
  } : { tooEasy: 0, justRight: 0, tooHard: 0 };

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-2xl">
        {/* ===== 頂部成就區塊 - 深灰/金色調 ===== */}
        <div className="relative bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 rounded-3xl p-6 mb-6 overflow-hidden">
          {/* 背景裝飾 */}
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-yellow-400/10 rounded-full blur-3xl" />
            <div className="absolute -left-5 -bottom-5 w-32 h-32 bg-yellow-500/10 rounded-full blur-2xl" />
          </div>
          
          <div className="relative z-10 text-center">
            {/* 獎盃 - 閃爍動畫 */}
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-yellow-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-[0_0_30px_rgba(250,204,21,0.3)] animate-pulse">
              <Trophy size={40} className="text-yellow-900" />
            </div>
            
            <h2 className="text-3xl font-extrabold text-white mb-2">
              {stats.isPartialComplete ? '訓練結束！💪' : '訓練完成！🎉'}
            </h2>
            <p className="text-gray-300">
              {stats.isPartialComplete 
                ? `你完成了 ${stats.actualCompleted} 個動作，共 ${stats.actualMinutes > 0 ? stats.actualMinutes : '<1'} 分鐘`
                : '太棒了！你完成了今天的訓練'
              }
            </p>
          </div>
        </div>

        {/* ===== 核心統計數據 ===== */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
          <StatCard
            icon={<Clock className="w-5 h-5 text-white" />}
            label="訓練時間"
            value={stats.actualMinutes > 0 ? stats.actualMinutes : `<1`}
            subLabel="分鐘"
            color="bg-blue-500"
          />
          <StatCard
            icon={<Dumbbell className="w-5 h-5 text-white" />}
            label="完成動作"
            value={`${stats.actualCompleted}/${stats.totalExercises}`}
            subLabel="個動作"
            color="bg-brand-dark"
          />
          <StatCard
            icon={<Flame className="w-5 h-5 text-white" />}
            label="消耗熱量"
            value={stats.estimatedCalories}
            subLabel="大卡 (估計)"
            color="bg-orange-500"
          />
          <StatCard
            icon={<Zap className="w-5 h-5 text-white" />}
            label="完成率"
            value={`${stats.completionRate}%`}
            subLabel={stats.isPartialComplete ? '部分完成' : '全部完成'}
            color={stats.completionRate === 100 ? 'bg-green-500' : 'bg-yellow-500'}
          />
        </div>

        {/* ===== 難度回饋分佈圖表 ===== */}
        {feedbackTotal > 0 && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-6">
            <h4 className="text-sm font-bold text-gray-700 mb-4 flex items-center gap-2">
              <Target className="w-4 h-4 text-brand-dark" />
              難度回饋分佈
            </h4>
            
            {/* 水平進度條 */}
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-green-600">太簡單</span>
                  <span className="text-gray-500">{stats.feedbackDistribution.tooEasy} 次 ({feedbackPercentages.tooEasy}%)</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all duration-1000"
                    style={{ width: `${feedbackPercentages.tooEasy}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-blue-600">剛剛好</span>
                  <span className="text-gray-500">{stats.feedbackDistribution.justRight} 次 ({feedbackPercentages.justRight}%)</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-1000"
                    style={{ width: `${feedbackPercentages.justRight}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-orange-600">太困難</span>
                  <span className="text-gray-500">{stats.feedbackDistribution.tooHard} 次 ({feedbackPercentages.tooHard}%)</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-orange-500 rounded-full transition-all duration-1000"
                    style={{ width: `${feedbackPercentages.tooHard}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ===== 完成動作列表 ===== */}
        <ExerciseCompletionList 
          plan={plan} 
          exerciseFeedback={exerciseFeedback} 
          completedCount={stats.actualCompleted} 
        />

        {/* ===== 評分區塊 ===== */}
        <div className="w-full mt-6 p-5 bg-white rounded-xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 text-center">為這次訓練評分</h3>
          
          {/* 星星評分 */}
          <div className="flex justify-center gap-2 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => setRating(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-1 transition-transform hover:scale-110 active:scale-95"
              >
                <Star
                  size={32}
                  className={`transition-colors ${
                    star <= (hoverRating || rating)
                      ? 'text-yellow-400 fill-yellow-400'
                      : 'text-gray-200'
                  }`}
                />
              </button>
            ))}
          </div>

          {/* 備註輸入 */}
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onBlur={handleSaveRating}
            placeholder="記錄一下這次訓練的感受吧... (選填)"
            className="w-full p-3 border border-gray-200 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-brand-light focus:border-transparent text-gray-700 placeholder-gray-400 text-sm"
            rows={2}
          />

          {/* 儲存狀態 */}
          {isSaving && (
            <div className="flex items-center justify-center gap-2 mt-2 text-gray-500 text-sm">
              <Loader2 size={14} className="animate-spin" />
              <span>儲存中...</span>
            </div>
          )}
          {isSaved && !isSaving && (
            <p className="text-sm text-green-600 mt-2 text-center">
              ✓ 訓練紀錄已{user ? '同步至雲端' : '儲存至本機'}
            </p>
          )}
        </div>

        {/* ===== 訪客提示 ===== */}
        {!user && (
          <div className="w-full mt-4 p-4 bg-brand-light/20 rounded-xl border border-brand-light/50">
            <p className="text-brand-dark text-sm text-center">
              <strong>提示：</strong>註冊帳號可永久保存您的訓練紀錄與進度追蹤！
            </p>
          </div>
        )}

        {/* ===== 操作按鈕 ===== */}
        <div className="flex flex-col sm:flex-row gap-3 w-full mt-6">
          <Button onClick={onHome} fullWidth size="lg" className="gap-2 shadow-lg shadow-brand-dark/20">
            <Home size={20} /> 返回首頁
          </Button>
          <Button variant="outline" onClick={onHistory} fullWidth size="lg" className="gap-2">
            <History size={20} /> 查看紀錄
          </Button>
        </div>
      </div>
    </div>
  );
};