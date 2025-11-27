/**
 * DashboardScreen - 儀表板畫面組件
 * Phase 2: 儀表板與數據分析模組
 * 
 * 全新設計：英雄區塊、互動式卡片、進度視覺化
 * 桌面端優先設計，響應式佈局
 */

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../../features/auth/AuthContext';
import { getDashboardData, getMonthCalendarData, DashboardData, CalendarWorkoutDay } from '../../services/dashboardService';
import { Button } from '../ui/Button';
import { 
  Activity, 
  Clock, 
  Flame, 
  Trophy,
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  Star,
  Play,
  History,
  Loader2,
  Target,
  Zap,
  Sparkles,
  Award,
  ArrowRight
} from 'lucide-react';

interface DashboardScreenProps {
  /** 開始訓練回調 */
  onStartWorkout: () => void;
  /** 查看歷史紀錄回調 */
  onViewHistory: () => void;
  /** 查看個人資料回調 */
  onViewProfile: () => void;
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
  size = 120, 
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
 * 迷你統計卡片組件
 */
const MiniStatCard: React.FC<{
  icon: React.ReactNode;
  label: string;
  value: string | number;
  trend?: { value: number; isPositive: boolean };
  iconBg: string;
}> = ({ icon, label, value, trend, iconBg }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 hover:shadow-md transition-all hover:-translate-y-1 group">
    <div className="flex items-center gap-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${iconBg} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-gray-500 truncate">{label}</p>
        <div className="flex items-center gap-2">
          <p className="text-lg font-bold text-gray-800">{value}</p>
          {trend && (
            <span className={`text-xs font-medium ${trend.isPositive ? 'text-green-500' : 'text-red-500'}`}>
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}%
            </span>
          )}
        </div>
      </div>
    </div>
  </div>
);

/**
 * 日曆組件 - 增強版
 * 功能：月份切換、訓練日標記、今日高亮、訓練時長視覺化、tooltip 詳情
 */
const WorkoutCalendar: React.FC<{
  userId: string | null;
  calendarData: CalendarWorkoutDay[];
}> = ({ userId, calendarData }) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [monthData, setMonthData] = useState<CalendarWorkoutDay[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedDay, setSelectedDay] = useState<{ date: number; minutes: number; count: number } | null>(null);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  useEffect(() => {
    const loadMonthData = async () => {
      setIsLoading(true);
      try {
        const data = await getMonthCalendarData(userId, year, month + 1);
        setMonthData(data);
      } catch (error) {
        console.error('載入月曆資料失敗:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const now = new Date();
    if (year === now.getFullYear() && month === now.getMonth()) {
      setMonthData(calendarData);
    } else {
      loadMonthData();
    }
    // 切換月份時清除選中的日期
    setSelectedDay(null);
  }, [year, month, userId, calendarData]);

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startPadding = firstDay.getDay();
    const totalDays = lastDay.getDate();

    const days: { date: number | null; hasWorkout: boolean; minutes: number; workoutCount: number }[] = [];

    for (let i = 0; i < startPadding; i++) {
      days.push({ date: null, hasWorkout: false, minutes: 0, workoutCount: 0 });
    }

    for (let d = 1; d <= totalDays; d++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      const workout = monthData.find(w => w.date === dateStr);
      days.push({
        date: d,
        hasWorkout: !!workout,
        minutes: workout?.totalMinutes || 0,
        workoutCount: workout?.workoutCount || 0,
      });
    }

    return days;
  }, [year, month, monthData]);

  // 計算訓練強度等級 (用於顏色深淺)
  const getIntensityLevel = (minutes: number): number => {
    if (minutes === 0) return 0;
    if (minutes < 15) return 1;
    if (minutes < 30) return 2;
    if (minutes < 45) return 3;
    return 4;
  };

  // 訓練強度顏色映射
  const intensityColors = [
    '', // 0: 無訓練
    'bg-green-100 text-green-700', // 1: <15分鐘
    'bg-green-200 text-green-800', // 2: 15-30分鐘
    'bg-green-300 text-green-800', // 3: 30-45分鐘
    'bg-green-400 text-green-900', // 4: 45+分鐘
  ];

  const handlePrevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(year, month + 1, 1));
  const handleToday = () => setCurrentDate(new Date());

  const monthNames = ['一月', '二月', '三月', '四月', '五月', '六月', 
                      '七月', '八月', '九月', '十月', '十一月', '十二月'];
  const dayNames = ['日', '一', '二', '三', '四', '五', '六'];

  const today = new Date();
  const isToday = (d: number | null) => 
    d !== null && year === today.getFullYear() && month === today.getMonth() && d === today.getDate();
  const isCurrentMonth = year === today.getFullYear() && month === today.getMonth();

  const workoutDaysCount = calendarDays.filter(d => d.hasWorkout).length;
  const totalMinutes = calendarDays.reduce((sum, d) => sum + d.minutes, 0);

  // 處理日期點擊
  const handleDayClick = (day: { date: number | null; hasWorkout: boolean; minutes: number; workoutCount: number }) => {
    if (day.date === null) return;
    if (day.hasWorkout) {
      setSelectedDay({ date: day.date, minutes: day.minutes, count: day.workoutCount });
    } else {
      setSelectedDay(null);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
      {/* 標題區 */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-brand-dark/10 flex items-center justify-center">
              <CalendarIcon className="w-4 h-4 text-brand-dark" />
            </div>
            訓練日曆
          </h3>
          <div className="flex items-center gap-3 mt-1 ml-10">
            <p className="text-xs text-gray-500">本月 {workoutDaysCount} 天</p>
            {totalMinutes > 0 && (
              <p className="text-xs text-green-600 font-medium">共 {totalMinutes} 分鐘</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          {!isCurrentMonth && (
            <button 
              onClick={handleToday} 
              className="px-2 py-1 text-xs text-brand-dark hover:bg-brand-light/30 rounded-md transition-colors"
            >
              今天
            </button>
          )}
          <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1">
            <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-md transition-colors">
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>
            <span className="text-sm font-medium text-gray-700 px-3 min-w-[90px] text-center">
              {year !== today.getFullYear() ? `${year}年 ` : ''}{monthNames[month]}
            </span>
            <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-md transition-colors">
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-48">
          <Loader2 className="w-6 h-6 animate-spin text-brand-dark" />
        </div>
      ) : (
        <>
          {/* 星期標題 */}
          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((day, idx) => (
              <div 
                key={day} 
                className={`text-center text-xs font-medium py-2 ${idx === 0 || idx === 6 ? 'text-gray-400' : 'text-gray-500'}`}
              >
                {day}
              </div>
            ))}
          </div>

          {/* 日曆格子 */}
          <div className="grid grid-cols-7 gap-1">
            {calendarDays.map((day, idx) => {
              const intensity = getIntensityLevel(day.minutes);
              const isSelected = selectedDay?.date === day.date;
              
              return (
                <div
                  key={idx}
                  onClick={() => handleDayClick(day)}
                  className={`
                    aspect-square flex flex-col items-center justify-center text-sm rounded-lg relative transition-all
                    ${day.date === null ? '' : 'cursor-pointer hover:ring-2 hover:ring-brand-light/50'}
                    ${isToday(day.date) ? 'bg-brand-dark text-white font-bold ring-2 ring-brand-dark' : ''}
                    ${day.hasWorkout && !isToday(day.date) ? intensityColors[intensity] : ''}
                    ${isSelected ? 'ring-2 ring-brand-dark scale-105' : ''}
                  `}
                >
                  {day.date !== null && (
                    <>
                      <span className="text-sm">{day.date}</span>
                      {day.hasWorkout && (
                        <div className="flex items-center gap-0.5 mt-0.5">
                          {Array.from({ length: Math.min(day.workoutCount, 3) }).map((_, i) => (
                            <div 
                              key={i} 
                              className={`w-1 h-1 rounded-full ${isToday(day.date) ? 'bg-white' : 'bg-current opacity-60'}`} 
                            />
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          {/* 選中日期詳情 */}
          {selectedDay && (
            <div className="mt-4 p-3 bg-gray-50 rounded-xl border border-gray-100 animate-fade-in">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center">
                    <Dumbbell className="w-4 h-4 text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">
                      {month + 1}月{selectedDay.date}日
                    </p>
                    <p className="text-xs text-gray-500">
                      {selectedDay.count} 次訓練 · {selectedDay.minutes} 分鐘
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedDay(null)}
                  className="p-1 hover:bg-gray-200 rounded-full transition-colors"
                >
                  <span className="text-gray-400 text-sm">✕</span>
                </button>
              </div>
            </div>
          )}

          {/* 圖例 */}
          <div className="mt-4 flex items-center justify-end gap-2 text-xs text-gray-500">
            <span>少</span>
            {[1, 2, 3, 4].map(level => (
              <div 
                key={level} 
                className={`w-3 h-3 rounded-sm ${intensityColors[level].split(' ')[0]}`} 
              />
            ))}
            <span>多</span>
          </div>
        </>
      )}
    </div>
  );
};

/**
 * 標籤分佈水平條形圖組件
 */
const TagDistributionChart: React.FC<{
  data: { tag: string; count: number; percentage: number; color: string }[];
}> = ({ data }) => {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
            <Target className="w-4 h-4 text-purple-600" />
          </div>
          訓練目標分佈
        </h3>
        <div className="flex items-center justify-center h-32 text-gray-400">
          <div className="text-center">
            <Dumbbell className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>尚無訓練數據</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow">
      <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2 mb-6">
        <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
          <Target className="w-4 h-4 text-purple-600" />
        </div>
        訓練目標分佈
      </h3>
      
      <div className="space-y-4">
        {data.slice(0, 5).map((item, idx) => (
          <div key={idx} className="group">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gray-700">{item.tag}</span>
              <span className="text-sm text-gray-500">{item.count} 次 ({item.percentage}%)</span>
            </div>
            <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-1000 ease-out group-hover:opacity-80"
                style={{ 
                  width: `${item.percentage}%`, 
                  backgroundColor: item.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * 最近訓練列表組件 - 精簡版
 */
const RecentWorkouts: React.FC<{
  workouts: DashboardData['recentWorkouts'];
  onViewHistory: () => void;
}> = ({ workouts, onViewHistory }) => {
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return '今天';
    if (days === 1) return '昨天';
    if (days < 7) return `${days} 天前`;
    return date.toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-lg transition-shadow h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center">
            <History className="w-4 h-4 text-blue-600" />
          </div>
          最近訓練
        </h3>
        <button
          onClick={onViewHistory}
          className="text-sm text-brand-dark hover:text-brand-dark/80 font-medium flex items-center gap-1 transition-colors"
        >
          全部
          <ArrowRight className="w-3 h-3" />
        </button>
      </div>

      {workouts.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Dumbbell className="w-8 h-8 opacity-50" />
          </div>
          <p className="text-sm">尚無訓練紀錄</p>
          <p className="text-xs mt-1">開始第一次訓練吧！</p>
        </div>
      ) : (
        <div className="space-y-2">
          {workouts.slice(0, 4).map((workout, idx) => (
            <div 
              key={workout.id || idx}
              className="flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors cursor-pointer group"
            >
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-brand-light to-brand-dark/20 flex items-center justify-center group-hover:scale-110 transition-transform">
                <Dumbbell className="w-5 h-5 text-brand-dark" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-800 text-sm truncate">{workout.goal}</p>
                <p className="text-xs text-gray-500">{workout.duration} 分鐘</p>
              </div>
              <div className="text-right">
                <p className="text-xs text-gray-400">{formatDate(workout.date)}</p>
                {workout.rating && (
                  <div className="flex items-center gap-0.5 justify-end text-yellow-500 mt-0.5">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="text-xs font-medium">{workout.rating}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * DashboardScreen 主組件
 */
export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  onStartWorkout,
  onViewHistory,
  onViewProfile,
}) => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        const data = await Promise.race([
          getDashboardData(user?.id || null),
          new Promise<null>((_, reject) => 
            setTimeout(() => reject(new Error('載入逾時')), 5000)
          )
        ]);
        
        if (data) {
          setDashboardData(data);
        }
      } catch (err) {
        console.error('載入儀表板失敗:', err);
        setError('載入數據失敗，請重試');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [user?.id]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center animate-pulse mx-auto">
            <Dumbbell className="w-8 h-8 text-gray-400 animate-spin" style={{ animationDuration: '2s' }} />
          </div>
          <p className="text-gray-500 font-medium">載入您的訓練數據...</p>
        </div>
      </div>
    );
  }

  if (error || !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4 p-8 bg-white rounded-2xl shadow-lg max-w-md">
          <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto">
            <Activity className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-red-500 font-medium">{error || '發生未知錯誤'}</p>
          <Button onClick={() => window.location.reload()}>重新載入</Button>
        </div>
      </div>
    );
  }

  const { stats, calendarData, tagDistribution, recentWorkouts } = dashboardData;

  // 計算週目標進度 (假設每週目標 5 次)
  const weeklyGoal = 5;
  const weeklyProgress = Math.min((stats.weeklyWorkouts / weeklyGoal) * 100, 100);

  // 獲取問候語
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return '早安';
    if (hour < 18) return '午安';
    return '晚安';
  };

  return (
    <div className="space-y-8 animate-fade-in pb-8">
      {/* ===== 英雄區塊 Hero Section - 深灰色調 ===== */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 p-6 lg:p-8">
        {/* 背景裝飾 */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -right-20 -top-20 w-80 h-80 bg-white/5 rounded-full blur-3xl" />
          <div className="absolute -left-10 -bottom-10 w-60 h-60 bg-yellow-400/10 rounded-full blur-2xl" />
          <div className="absolute right-1/4 top-1/4 w-4 h-4 bg-yellow-400 rounded-full animate-pulse" />
          <div className="absolute left-1/3 bottom-1/3 w-2 h-2 bg-green-400 rounded-full animate-ping" />
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          {/* 左側：歡迎訊息 */}
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-yellow-400" />
              <span className="text-gray-300 text-sm font-medium">{getGreeting()}</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">
              {user ? user.display_name : '健身者'}！
            </h1>
            <p className="text-white/70 text-lg">
              {stats.currentStreak > 0 ? (
                <>
                  <span className="text-orange-400">🔥 {stats.currentStreak} 天連續訓練</span>
                  <span className="ml-2">— 你太棒了！</span>
                </>
              ) : (
                '準備好開始今天的訓練了嗎？'
              )}
            </p>

            {/* 快速統計 */}
            <div className="flex flex-wrap gap-4 mt-6">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                <Trophy className="w-5 h-5 text-yellow-400" />
                <div>
                  <p className="text-white/60 text-xs">累計訓練</p>
                  <p className="text-white font-bold">{stats.totalWorkouts} 次</p>
                </div>
              </div>
              <div className="bg-white/10 backdrop-blur-sm rounded-xl px-4 py-2 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-400" />
                <div>
                  <p className="text-white/60 text-xs">消耗熱量</p>
                  <p className="text-white font-bold">{stats.estimatedCalories} kcal</p>
                </div>
              </div>
            </div>
          </div>

          {/* 右側：週進度圓環 + 開始按鈕 */}
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <ProgressRing 
                progress={weeklyProgress} 
                size={140} 
                strokeWidth={10}
                color="#10B981"
                bgColor="rgba(255,255,255,0.2)"
              >
                <div className="text-center">
                  <p className="text-3xl font-bold text-white">{stats.weeklyWorkouts}</p>
                  <p className="text-white/60 text-xs">/ {weeklyGoal} 次</p>
                  <p className="text-white/80 text-xs mt-1">本週目標</p>
                </div>
              </ProgressRing>
              {weeklyProgress >= 100 && (
                <div className="absolute -top-2 -right-2 w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg animate-bounce">
                  <Award className="w-5 h-5 text-white" />
                </div>
              )}
            </div>
            
            <Button 
              onClick={onStartWorkout} 
              size="lg" 
              className="w-full lg:w-auto bg-green-500 text-white hover:bg-green-600 font-bold shadow-xl hover:shadow-2xl transform hover:scale-105 transition-all flex items-center justify-center gap-2 px-8"
            >
              <Play className="w-5 h-5" />
              開始訓練
            </Button>
          </div>
        </div>
      </div>

      {/* ===== 統計概覽 - 統一柔和色調 ===== */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <MiniStatCard
          icon={<Activity className="w-5 h-5 text-brand-dark" />}
          label="總訓練次數"
          value={stats.totalWorkouts}
          iconBg="bg-brand-light/30"
        />
        <MiniStatCard
          icon={<Clock className="w-5 h-5 text-blue-600" />}
          label="總訓練時間"
          value={`${stats.totalMinutes} 分`}
          iconBg="bg-blue-100"
        />
        <MiniStatCard
          icon={<Flame className="w-5 h-5 text-orange-500" />}
          label="消耗熱量"
          value={`${stats.estimatedCalories}`}
          iconBg="bg-orange-100"
        />
        <MiniStatCard
          icon={<Zap className="w-5 h-5 text-yellow-500" />}
          label="連續天數"
          value={`${stats.currentStreak} 天`}
          iconBg="bg-yellow-100"
        />
      </div>

      {/* ===== 主內容區 - 桌面端三欄佈局 ===== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 左側: 日曆 (佔 2 欄) */}
        <div className="lg:col-span-2">
          <WorkoutCalendar 
            userId={user?.id || null} 
            calendarData={calendarData}
          />
        </div>

        {/* 右側: 最近訓練 */}
        <div>
          <RecentWorkouts 
            workouts={recentWorkouts}
            onViewHistory={onViewHistory}
          />
        </div>
      </div>

      {/* ===== 訓練目標分佈 ===== */}
      <TagDistributionChart data={tagDistribution} />

      {/* ===== 激勵語句 ===== */}
      <div className="text-center py-6">
        <p className="text-gray-400 text-sm italic">
          "每一次訓練，都是更好的自己。"
        </p>
      </div>
    </div>
  );
};
