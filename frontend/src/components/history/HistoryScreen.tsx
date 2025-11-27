import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { ConfirmDialog } from '../ui/ConfirmDialog';
import { 
  ArrowLeft, 
  Clock, 
  Star, 
  Dumbbell, 
  Target,
  Trash2,
  ChevronDown,
  ChevronUp,
  History as HistoryIcon,
  Flame,
  Award,
  PlayCircle,
  AlertCircle
} from 'lucide-react';
import { useAuth } from '../../features/auth/AuthContext';
import { getWorkoutLogs, getWorkoutStats, deleteWorkoutLog, getWorkoutLogById } from '../../services/workoutLogService';
import { WorkoutLogListItem, WorkoutStats, WorkoutLog } from '../../types/workoutLog';

interface HistoryScreenProps {
  onBack: () => void;
  onStartWorkout?: () => void;
}

/**
 * 歷史紀錄頁面 (History Screen)
 * Phase 2: 資料持久化模組 - 桌面端優化版本
 */
export const HistoryScreen: React.FC<HistoryScreenProps> = ({ onBack, onStartWorkout }) => {
  const { user } = useAuth();
  const [logs, setLogs] = useState<WorkoutLogListItem[]>([]);
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [expandedLogDetails, setExpandedLogDetails] = useState<WorkoutLog | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; logId: string | null }>({
    isOpen: false,
    logId: null,
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // 載入資料 - 加入超時處理
  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError(null);
    
    // 設定 10 秒超時
    const timeoutId = setTimeout(() => {
      setIsLoading(false);
      setLoadError('載入超時，請稍後再試');
    }, 10000);

    try {
      const userId = user?.id || null;
      const [logsData, statsData] = await Promise.all([
        getWorkoutLogs(userId, 50),
        getWorkoutStats(userId),
      ]);
      clearTimeout(timeoutId);
      setLogs(logsData);
      setStats(statsData);
      setLoadError(null);
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('載入歷史紀錄失敗:', error);
      setLoadError('載入失敗，請稍後再試');
    } finally {
      setIsLoading(false);
    }
  };

  // 展開/收合詳情
  const handleToggleExpand = async (logId: string) => {
    if (expandedLogId === logId) {
      setExpandedLogId(null);
      setExpandedLogDetails(null);
      return;
    }

    setExpandedLogId(logId);
    setLoadingDetails(true);
    
    try {
      const details = await getWorkoutLogById(logId, user?.id || null);
      setExpandedLogDetails(details);
    } catch (error) {
      console.error('載入詳情失敗:', error);
    } finally {
      setLoadingDetails(false);
    }
  };

  // 確認刪除
  const handleDeleteClick = (logId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeleteConfirm({ isOpen: true, logId });
  };

  // 執行刪除
  const handleDeleteConfirm = async () => {
    if (!deleteConfirm.logId) return;
    
    setDeletingId(deleteConfirm.logId);
    setDeleteConfirm({ isOpen: false, logId: null });
    
    try {
      const success = await deleteWorkoutLog(deleteConfirm.logId, user?.id || null);
      if (success) {
        setLogs(prev => prev.filter(log => log.id !== deleteConfirm.logId));
        if (expandedLogId === deleteConfirm.logId) {
          setExpandedLogId(null);
          setExpandedLogDetails(null);
        }
        const newStats = await getWorkoutStats(user?.id || null);
        setStats(newStats);
      }
    } catch (error) {
      console.error('刪除失敗:', error);
    } finally {
      setDeletingId(null);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return '今天';
    if (diffDays === 1) return '昨天';
    if (diffDays < 7) return `${diffDays} 天前`;
    
    return date.toLocaleDateString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      weekday: 'short',
    });
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
  };

  const goalDisplayMap: Record<string, { label: string; color: string }> = {
    'muscle': { label: '增肌', color: 'bg-blue-100 text-blue-700' },
    'muscle_gain': { label: '增肌', color: 'bg-blue-100 text-blue-700' },
    'fat-loss': { label: '減脂', color: 'bg-orange-100 text-orange-700' },
    'fat_loss': { label: '減脂', color: 'bg-orange-100 text-orange-700' },
    'tone': { label: '塑形', color: 'bg-green-100 text-green-700' },
    'cardio': { label: '有氧', color: 'bg-pink-100 text-pink-700' },
    'strength': { label: '力量', color: 'bg-purple-100 text-purple-700' },
    'flexibility': { label: '柔軟度', color: 'bg-teal-100 text-teal-700' },
    '增肌': { label: '增肌', color: 'bg-blue-100 text-blue-700' },
    '減脂': { label: '減脂', color: 'bg-orange-100 text-orange-700' },
    '塑形': { label: '塑形', color: 'bg-green-100 text-green-700' },
  };

  const feedbackMap: Record<string, { label: string; emoji: string }> = {
    'too_easy': { label: '太簡單', emoji: '😎' },
    'just_right': { label: '剛剛好', emoji: '👍' },
    'too_hard': { label: '太難', emoji: '💪' },
  };

  return (
    <div className="min-h-[80vh] animate-fade-in">
      {/* 頁面標題區 */}
      <div className="mb-8">
        <button
          onClick={onBack}
          className="flex items-center gap-2 text-gray-500 hover:text-brand-dark mb-6 transition-colors group"
        >
          <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
          <span>返回個人頁面</span>
        </button>
        
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-brand-light rounded-2xl flex items-center justify-center">
              <HistoryIcon size={28} className="text-brand-dark" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-brand-dark">訓練歷史</h1>
              <p className="text-gray-500">
                {user ? '您的所有訓練紀錄' : '訪客模式 - 僅顯示本地紀錄'}
              </p>
            </div>
          </div>
          
          {onStartWorkout && (
            <Button onClick={onStartWorkout} className="gap-2">
              <PlayCircle size={18} />
              新訓練
            </Button>
          )}
        </div>
      </div>

      {/* 統計摘要 */}
      {!isLoading && stats && stats.totalWorkouts > 0 && (
        <div className="grid grid-cols-4 gap-4 mb-8">
          <StatCard
            icon={<Dumbbell size={20} />}
            label="總訓練次數"
            value={stats.totalWorkouts}
            suffix="次"
            color="brand"
          />
          <StatCard
            icon={<Clock size={20} />}
            label="總訓練時間"
            value={stats.totalMinutes}
            suffix="分鐘"
            color="blue"
          />
          <StatCard
            icon={<Flame size={20} />}
            label="連續天數"
            value={stats.currentStreak}
            suffix="天"
            color="orange"
            highlight={stats.currentStreak >= 3}
          />
          <StatCard
            icon={<Star size={20} />}
            label="平均評分"
            value={stats.avgRating?.toFixed(1) || '-'}
            suffix="星"
            color="yellow"
          />
        </div>
      )}

      {/* 主要內容區 */}
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
        {/* 表頭 */}
        <div className="px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-800">訓練紀錄</h2>
            {!isLoading && logs.length > 0 && (
              <span className="text-sm text-gray-500">共 {logs.length} 筆</span>
            )}
          </div>
        </div>

        {/* 內容 */}
        <div className="divide-y divide-gray-100">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="w-12 h-12 border-4 border-brand-light/30 border-t-brand-dark rounded-full animate-spin mb-4"></div>
              <p className="text-gray-500">載入訓練紀錄中...</p>
            </div>
          ) : loadError ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <AlertCircle size={48} className="text-red-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-800 mb-2">載入失敗</h3>
              <p className="text-gray-500 mb-4">{loadError}</p>
              <Button variant="secondary" onClick={loadData}>重新載入</Button>
            </div>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mb-6">
                <HistoryIcon size={36} className="text-gray-400" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">尚無訓練紀錄</h3>
              <p className="text-gray-500 mb-6 max-w-sm">
                完成您的第一次訓練後，紀錄將會顯示在這裡。
              </p>
              {onStartWorkout && (
                <Button onClick={onStartWorkout} className="gap-2">
                  <PlayCircle size={18} />
                  開始訓練
                </Button>
              )}
            </div>
          ) : (
            logs.map((log) => (
              <WorkoutLogRow
                key={log.id}
                log={log}
                isExpanded={expandedLogId === log.id}
                expandedDetails={expandedLogId === log.id ? expandedLogDetails : null}
                loadingDetails={expandedLogId === log.id && loadingDetails}
                formatDate={formatDate}
                formatTime={formatTime}
                goalDisplayMap={goalDisplayMap}
                feedbackMap={feedbackMap}
                onToggleExpand={() => handleToggleExpand(log.id)}
                onDelete={(e) => handleDeleteClick(log.id, e)}
                isDeleting={deletingId === log.id}
              />
            ))
          )}
        </div>
      </div>

      {/* 訪客提示 */}
      {!user && logs.length > 0 && (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <Award size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-amber-800 text-sm">
              <strong>訪客模式：</strong>紀錄僅儲存在此裝置。註冊帳號可永久保存並跨裝置同步。
            </p>
          </div>
        </div>
      )}

      {/* 刪除確認對話框 */}
      <ConfirmDialog
        isOpen={deleteConfirm.isOpen}
        type="warning"
        title="刪除訓練紀錄"
        message="確定要刪除這筆訓練紀錄嗎？此操作無法復原。"
        confirmText="刪除"
        cancelText="取消"
        confirmVariant="danger"
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirm({ isOpen: false, logId: null })}
      />
    </div>
  );
};

// 統計卡片 - 桌面端優化
const StatCard = ({ 
  icon, 
  label, 
  value, 
  suffix,
  color,
  highlight = false,
}: { 
  icon: React.ReactNode; 
  label: string; 
  value: number | string; 
  suffix: string;
  color: 'brand' | 'blue' | 'orange' | 'yellow';
  highlight?: boolean;
}) => {
  const colorMap = {
    brand: 'bg-brand-light text-brand-dark',
    blue: 'bg-blue-100 text-blue-600',
    orange: 'bg-orange-100 text-orange-600',
    yellow: 'bg-yellow-100 text-yellow-600',
  };

  return (
    <div className={`bg-white rounded-xl border p-5 ${highlight ? 'border-orange-300 bg-orange-50/30' : 'border-gray-200'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${colorMap[color]}`}>
          {icon}
        </div>
        {highlight && <span className="text-lg">🔥</span>}
      </div>
      <div className="text-2xl font-bold text-gray-900">
        {value}
        <span className="text-sm font-normal text-gray-500 ml-1">{suffix}</span>
      </div>
      <div className="text-sm text-gray-500 mt-1">{label}</div>
    </div>
  );
};

// 訓練紀錄行 - 桌面端表格式設計
const WorkoutLogRow = ({
  log,
  isExpanded,
  expandedDetails,
  loadingDetails,
  formatDate,
  formatTime,
  goalDisplayMap,
  feedbackMap,
  onToggleExpand,
  onDelete,
  isDeleting,
}: {
  log: WorkoutLogListItem;
  isExpanded: boolean;
  expandedDetails: WorkoutLog | null;
  loadingDetails: boolean;
  formatDate: (date: string) => string;
  formatTime: (date: string) => string;
  goalDisplayMap: Record<string, { label: string; color: string }>;
  feedbackMap: Record<string, { label: string; emoji: string }>;
  onToggleExpand: () => void;
  onDelete: (e: React.MouseEvent) => void;
  isDeleting: boolean;
}) => {
  const goalInfo = goalDisplayMap[log.goal] || { label: log.goal, color: 'bg-gray-100 text-gray-700' };

  return (
    <div className={isExpanded ? 'bg-gray-50/50' : 'hover:bg-gray-50/50 transition-colors'}>
      {/* 主行 */}
      <div 
        className="px-6 py-4 cursor-pointer flex items-center gap-6"
        onClick={onToggleExpand}
      >
        {/* 日期時間 */}
        <div className="w-40 flex-shrink-0">
          <div className="font-medium text-gray-900">{formatDate(log.started_at)}</div>
          <div className="text-sm text-gray-400">{formatTime(log.started_at)}</div>
        </div>

        {/* 標籤 */}
        <div className="flex items-center gap-2 flex-1">
          <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium ${goalInfo.color}`}>
            <Target size={12} className="mr-1" />
            {goalInfo.label}
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
            <Clock size={12} className="mr-1" />
            {log.duration_minutes} 分鐘
          </span>
          <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-medium bg-gray-100 text-gray-600">
            <Dumbbell size={12} className="mr-1" />
            {log.exerciseCount} 動作
          </span>
        </div>

        {/* 評分 */}
        <div className="w-28 flex-shrink-0">
          {log.rating ? (
            <div className="flex items-center gap-0.5">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={14}
                  className={star <= log.rating! ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
                />
              ))}
            </div>
          ) : (
            <span className="text-sm text-gray-400">未評分</span>
          )}
        </div>

        {/* 操作 */}
        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={onDelete}
            disabled={isDeleting}
            className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all disabled:opacity-50"
            title="刪除紀錄"
          >
            <Trash2 size={16} />
          </button>
          <div className={`p-1.5 rounded-lg ${isExpanded ? 'bg-brand-light text-brand-dark' : 'text-gray-400'}`}>
            {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </div>
        </div>
      </div>

      {/* 展開詳情 */}
      {isExpanded && (
        <div className="px-6 pb-4">
          <div className="ml-40 pl-6 border-l-2 border-brand-light">
            {loadingDetails ? (
              <div className="py-4 flex items-center gap-2 text-gray-500">
                <div className="w-5 h-5 border-2 border-brand-light/30 border-t-brand-dark rounded-full animate-spin"></div>
                <span>載入詳情...</span>
              </div>
            ) : expandedDetails ? (
              <div className="py-2 space-y-4">
                {/* 備註 */}
                {expandedDetails.notes && (
                  <div>
                    <div className="text-xs font-medium text-gray-500 mb-1">訓練備註</div>
                    <p className="text-gray-700">{expandedDetails.notes}</p>
                  </div>
                )}

                {/* 動作列表 */}
                <div>
                  <div className="text-xs font-medium text-gray-500 mb-2">執行動作</div>
                  <div className="flex flex-wrap gap-2">
                    {expandedDetails.exercises.map((exercise, index) => (
                      <div 
                        key={index}
                        className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-1.5 text-sm"
                      >
                        <span className="text-gray-700">{exercise.name}</span>
                        {exercise.feedback && feedbackMap[exercise.feedback] && (
                          <span>{feedbackMap[exercise.feedback].emoji}</span>
                        )}
                        {exercise.completed && <span className="text-green-500">✓</span>}
                      </div>
                    ))}
                  </div>
                </div>

                {/* 設定 */}
                <div className="flex gap-4 text-xs text-gray-500">
                  <span>難度: {expandedDetails.settings.difficulty === 'beginner' ? '初階' : expandedDetails.settings.difficulty === 'intermediate' ? '中階' : '高階'}</span>
                  <span>器材: {expandedDetails.settings.equipment.join(', ') || '徒手'}</span>
                </div>
              </div>
            ) : (
              <p className="py-4 text-gray-500">無法載入詳情</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
