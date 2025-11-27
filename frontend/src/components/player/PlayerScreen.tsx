import React, { useState, useEffect, useRef, useCallback } from 'react';
import { PlanItem } from '../../types/app';
import { Play, Pause, SkipForward, X, Volume2, VolumeX, Info, ChevronRight } from 'lucide-react';
import { useWakeLock } from '../../hooks/useWakeLock';
import { playShortBeep, playLongBeep } from '../../utils/audio';

interface PlayerScreenProps {
  plan: PlanItem[];
  onComplete: (completedIndex: number, elapsedSeconds: number) => void;
  onExit: (completedIndex: number, elapsedSeconds: number) => void;
}

/**
 * 訓練播放器組件 (Workout Player Component)
 * 負責顯示訓練影片、計時、語音提示與使用者互動
 */
export const PlayerScreen: React.FC<PlayerScreenProps> = ({ plan, onComplete, onExit }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [timeLeft, setTimeLeft] = useState(plan[0].duration);
  const [isPaused, setIsPaused] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [elapsedSeconds, setElapsedSeconds] = useState(0); // 追蹤實際訓練秒數
  const [completedExercises, setCompletedExercises] = useState(0); // 追蹤完成的運動數量（不含跳過）
  const [skippedExercises, setSkippedExercises] = useState<Set<number>>(new Set()); // 追蹤被跳過的動作索引

  // 計算 plan 中的運動總數（不含休息）
  const totalExercises = plan.filter(item => item.type === 'exercise').length;

  // 啟用螢幕喚醒鎖定 (Keep screen awake)
  useWakeLock();

  const currentItem = plan[currentIndex];
  const nextItem = plan[currentIndex + 1];
  const timerRef = useRef<number | null>(null);

  // 語音合成 (TTS)
  const speak = useCallback((text: string) => {
    if (!soundEnabled || !window.speechSynthesis) return;
    
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'zh-TW';
    utterance.rate = 1.2;
    window.speechSynthesis.speak(utterance);
  }, [soundEnabled]);

  // 切換暫停狀態
  const togglePause = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPaused(prev => !prev);
  }, []);

  // 跳過當前項目（跳過的動作不算完成）
  const skipItem = useCallback((e?: React.MouseEvent) => {
    e?.stopPropagation();
    
    // 如果當前是運動項目，標記為已跳過
    if (currentItem.type === 'exercise') {
      setSkippedExercises(prev => new Set(prev).add(currentIndex));
    }
    
    if (currentIndex < plan.length - 1) {
      setCurrentIndex(prev => prev + 1);
    } else {
      // 訓練結束，傳遞完成的運動數量
      onComplete(completedExercises, elapsedSeconds);
    }
  }, [currentIndex, plan.length, onComplete, elapsedSeconds, completedExercises, currentItem.type]);

  // 初始化目前動作
  useEffect(() => {
    setTimeLeft(currentItem.duration);
    if (currentItem.type === 'exercise') {
      speak(`準備，${currentItem.title}`);
    } else {
      speak('休息一下');
    }
  }, [currentIndex, currentItem, speak]);

  // 計時器與音效邏輯
  useEffect(() => {
    if (isPaused) return;

    if (timeLeft > 0) {
      timerRef.current = window.setTimeout(() => {
        setTimeLeft(prev => prev - 1);
        setElapsedSeconds(prev => prev + 1); // 追蹤實際訓練秒數
      }, 1000);

      if (soundEnabled && timeLeft <= 3) {
        playShortBeep();
      }
    } else {
      // 時間到，動作完成
      if (soundEnabled) playLongBeep();
      
      // 如果當前是運動項目且未被跳過，增加完成計數
      if (currentItem.type === 'exercise' && !skippedExercises.has(currentIndex)) {
        setCompletedExercises(prev => prev + 1);
      }
      
      if (currentIndex < plan.length - 1) {
        setCurrentIndex(prev => prev + 1);
      } else {
        // 訓練結束，傳遞完成的運動數量（+1 因為當前這個也完成了）
        const finalCompleted = currentItem.type === 'exercise' && !skippedExercises.has(currentIndex)
          ? completedExercises + 1
          : completedExercises;
        onComplete(finalCompleted, elapsedSeconds);
      }
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [timeLeft, isPaused, currentIndex, plan.length, onComplete, soundEnabled, currentItem.type, skippedExercises, completedExercises, elapsedSeconds]);

  // 鍵盤快捷鍵支援
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault();
        togglePause();
      } else if (e.code === 'ArrowRight') {
        skipItem();
      } else if (e.code === 'Escape') {
        // 中途離開時傳遞已完成的運動數量
        onExit(completedExercises, elapsedSeconds);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePause, skipItem, onExit, completedExercises, elapsedSeconds]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progress = ((currentIndex) / plan.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black text-white overflow-hidden select-none font-sans">
      {/* 頂部進度條 */}
      <div className="absolute top-0 left-0 w-full h-1 z-50 bg-gray-800">
        <div 
          className="h-full bg-brand-light shadow-[0_0_10px_#D4EB85] transition-all duration-500 ease-linear" 
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Header 區塊 - 浮動於上方 */}
      <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-40 pointer-events-none">
        <div className="flex flex-col pointer-events-auto bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/5">
           <span className="text-[10px] text-brand-light/80 uppercase tracking-widest font-bold">Progress</span>
           <span className="text-xs font-medium text-white/90 tracking-wide">
            {currentIndex + 1} <span className="text-gray-500 mx-1">/</span> {plan.length}
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button 
            onClick={(e) => { e.stopPropagation(); setSoundEnabled(!soundEnabled); }} 
            className="w-9 h-9 rounded-full bg-black/20 hover:bg-white/10 flex items-center justify-center transition-colors border border-white/10 backdrop-blur-md"
            aria-label={soundEnabled ? "靜音" : "開啟聲音"}
          >
            {soundEnabled ? <Volume2 size={16} className="text-brand-light" /> : <VolumeX size={16} className="text-gray-400" />}
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onExit(completedExercises, elapsedSeconds); }} 
            className="w-9 h-9 rounded-full bg-black/20 hover:bg-red-500/20 flex items-center justify-center transition-colors border border-white/10 backdrop-blur-md group"
            aria-label="退出訓練"
          >
            <X size={16} className="text-gray-400 group-hover:text-red-400 transition-colors" />
          </button>
        </div>
      </div>

      {/* 主要內容區 - 響應式佈局 */}
      <div className="flex-1 flex flex-col lg:flex-row relative z-10 overflow-hidden">
        
        {/* 左側：視覺區 (影片/休息動畫) - 佔據大部分空間 */}
        <div className="w-full lg:w-[72%] h-[60vh] lg:h-full flex flex-col bg-neutral-900 relative">
          
          {/* 影片播放器容器 */}
          <div 
            className="relative flex-1 flex items-center justify-center overflow-hidden cursor-pointer group"
            onClick={togglePause}
          >
            {currentItem.type === 'exercise' && currentItem.exercise ? (
               <div className="w-full h-full flex items-center justify-center bg-black">
                  <img 
                    src={currentItem.exercise.video_url} 
                    alt={currentItem.title} 
                    className="w-full h-full object-contain opacity-90"
                  />
               </div>
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-8 bg-neutral-900">
                <div className="relative">
                   <div className="absolute inset-0 bg-brand-light/10 blur-2xl rounded-full animate-pulse"></div>
                   <div className="w-40 h-40 lg:w-56 lg:h-56 rounded-full border-2 border-brand-light/30 flex items-center justify-center relative z-10 bg-black/40 backdrop-blur-sm">
                     <span className="text-brand-light text-5xl lg:text-6xl font-bold tracking-widest">REST</span>
                   </div>
                </div>
                <p className="text-gray-400 text-sm tracking-[0.2em] uppercase">Take a breath</p>
              </div>
            )}

            {/* 暫停遮罩 */}
            {isPaused && (
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm z-30 flex flex-col items-center justify-center transition-all duration-300">
                <div className="bg-black/40 p-6 rounded-full border border-white/10 backdrop-blur-md mb-4">
                  <Pause size={48} className="text-brand-light drop-shadow-[0_0_15px_rgba(212,235,133,0.5)]" />
                </div>
                <span className="text-xl font-bold text-white tracking-widest uppercase">Paused</span>
                <span className="text-xs text-gray-400 mt-2">Tap or Space to resume</span>
              </div>
            )}
            
            {/* 動作說明浮層 (僅在運動時顯示) */}
            {currentItem.type === 'exercise' && currentItem.exercise && (
              <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-black/90 via-black/60 to-transparent p-6 pt-12 pointer-events-none lg:hidden">
                 <div className="flex items-start gap-3">
                    <Info size={16} className="text-brand-light mt-1 flex-shrink-0" />
                    <p className="text-gray-200 text-sm leading-relaxed line-clamp-2">
                      {currentItem.exercise.description}
                    </p>
                 </div>
              </div>
            )}
          </div>
        </div>

        {/* 右側：控制面板 - 桌面版在右側，手機版在下方 */}
        <div className="w-full lg:w-[28%] flex-1 lg:flex-auto flex flex-col justify-between p-6 lg:p-8 bg-[#0f1205] border-t lg:border-t-0 lg:border-l border-white/10 relative z-20">
          
          {/* 上方資訊 */}
          <div className="flex flex-col gap-2 mt-2 lg:mt-8 text-center lg:text-left">
            {currentItem.type === 'exercise' && (
              <span className="text-brand-light text-xs font-bold uppercase tracking-wider mb-1 opacity-80">
                Current Exercise
              </span>
            )}
            <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight line-clamp-2">
              {currentItem.title}
            </h2>
            
            {/* 桌面版說明文字 */}
            {currentItem.type === 'exercise' && currentItem.exercise && (
              <div className="hidden lg:block mt-8 p-5 bg-white/5 rounded-xl border border-white/5">
                <div className="flex items-center gap-2 mb-3 text-brand-light/80">
                  <Info size={16} />
                  <span className="text-xs uppercase font-bold tracking-wider">Instructions</span>
                </div>
                <p className="text-gray-400 text-sm leading-relaxed">
                  {currentItem.exercise.description}
                </p>
              </div>
            )}
          </div>

          {/* 中央計時器 */}
          <div className="flex-1 flex flex-col items-center justify-center py-6">
            <div 
              className={`font-mono font-bold leading-none tracking-tighter transition-all duration-200 tabular-nums text-8xl lg:text-9xl cursor-pointer select-none
                ${timeLeft <= 3 ? 'text-red-400 drop-shadow-[0_0_25px_rgba(248,113,113,0.5)]' : 'text-white'}
              `}
              onClick={togglePause}
            >
              {formatTime(timeLeft)}
            </div>
            <p className="text-gray-600 text-xs uppercase tracking-[0.3em] font-medium mt-3">Time Remaining</p>
          </div>

          {/* 底部控制區 */}
          <div className="flex flex-col gap-8 mb-6 lg:mb-10">
            {/* Next Up 預覽 */}
            {nextItem && (
              <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-white/5 border border-white/5">
                <div className="flex flex-col overflow-hidden">
                  <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Up Next</span>
                  <span className="text-gray-300 text-sm font-medium truncate">{nextItem.title}</span>
                </div>
                <ChevronRight size={18} className="text-gray-600" />
              </div>
            )}

            {/* 主要按鈕 */}
            <div className="flex justify-center items-center gap-8">
              <button 
                onClick={togglePause}
                className="w-20 h-20 rounded-full bg-brand-light text-brand-dark flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_0_25px_rgba(212,235,133,0.3)] hover:shadow-[0_0_35px_rgba(212,235,133,0.5)]"
                title={isPaused ? "繼續 (Space)" : "暫停 (Space)"}
                aria-label={isPaused ? "繼續" : "暫停"}
              >
                {isPaused ? <Play size={36} fill="currentColor" className="ml-1" /> : <Pause size={36} fill="currentColor" />}
              </button>
              
              <button 
                onClick={skipItem}
                className="w-14 h-14 rounded-full bg-white/5 text-white border border-white/10 flex items-center justify-center hover:bg-white/10 active:scale-95 transition-all"
                title="跳過 (Right Arrow)"
                aria-label="跳過此動作"
              >
                <SkipForward size={24} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
