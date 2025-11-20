import React, { useState } from 'react';
import { AppScreen, UserPreferences, PlanItem } from './types/app';
import { SetupScreen } from './components/setup/SetupScreen';
import { PlanOverviewScreen } from './components/plan/PlanOverviewScreen';
import { PlayerScreen } from './components/player/PlayerScreen';
import { CompletedScreen } from './components/player/CompletedScreen';
import { Button } from './components/ui/Button';
import { Dumbbell, User } from 'lucide-react';
import { generateWorkoutPlan } from './features/generator/engine';

/**
 * Header 組件 (Header Component)
 * 
 * 應用程式頂端導覽列，包含品牌 Logo 與版本資訊
 * 
 * @returns {JSX.Element} Header 組件
 */
const Header = () => (
  <header className="bg-brand-dark text-white py-4 px-6 flex justify-between items-center sticky top-0 z-50 shadow-md">
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 bg-brand-light rounded-lg flex items-center justify-center text-brand-dark font-bold shadow-inner">
        <Dumbbell size={18} strokeWidth={3} />
      </div>
      <h1 className="text-xl font-bold tracking-tight text-white">
        Virtual <span className="text-white">Coach</span>
      </h1>
    </div>
    <div className="flex items-center gap-2 text-sm text-gray-300">
      <span className="hidden sm:inline">MVP v1.0</span>
      <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center">
        <User size={16} />
      </div>
    </div>
  </header>
);

/**
 * HomeScreen 組件 (Home Screen Component)
 * 
 * 應用程式首頁，包含品牌標語與開始訓練按鈕
 * 
 * @param {Object} props - 組件 Props
 * @param {Function} props.onStart - 開始訓練的回調函數 (Callback to start training)
 * @returns {JSX.Element} HomeScreen 組件
 */
const HomeScreen = ({ onStart }: { onStart: () => void }) => (
  <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center space-y-10 animate-fade-in relative overflow-hidden">

    {/* 背景裝飾 */}
    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-brand-light/20 rounded-full blur-3xl -z-10"></div>

    <div className="space-y-6 max-w-2xl">
      <div className="inline-block px-3 py-1 bg-brand-light/30 text-brand-dark text-sm font-bold rounded-full mb-2 border border-brand-light/50">
        ✨ 24小時待命的私人教練
      </div>
      <h2 className="text-5xl font-extrabold text-brand-dark sm:text-6xl leading-tight">
        專屬你的<br />
        <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-dark to-brand-mid">
          虛擬健身教練
        </span>
      </h2>
      <p className="text-xl text-brand-gray leading-relaxed max-w-lg mx-auto">
        無需登入，無需昂貴費用。<br />
        只要告訴我們目標，立即為您生成<span className="font-bold text-brand-dark underline decoration-brand-light decoration-4 underline-offset-2">科學化課表</span>。
      </p>
    </div>

    <Button
      onClick={onStart}
      size="lg"
      className="text-xl px-10 py-5 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
    >
      立即開始訓練
    </Button>

    <div className="flex gap-8 text-sm text-brand-gray/60 pt-8">
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-brand-light"></span> 免費使用
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-brand-light"></span> 無需器材
      </div>
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 rounded-full bg-brand-light"></span> 客製化
      </div>
    </div>
  </div>
);

/**
 * GeneratingScreen 組件 (Generating Screen Component)
 * 
 * 課表生成中的載入畫面，顯示旋轉動畫與提示文字
 * 
 * @returns {JSX.Element} GeneratingScreen 組件
 */
const GeneratingScreen = () => (
  <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
    <div className="relative">
      <div className="w-16 h-16 border-4 border-brand-light/30 border-t-brand-dark rounded-full animate-spin"></div>
      <div className="absolute inset-0 flex items-center justify-center">
        <Dumbbell className="text-brand-dark animate-pulse" size={20} />
      </div>
    </div>
    <div className="text-center space-y-2">
      <h3 className="text-xl font-bold text-brand-dark">正在規劃您的課表...</h3>
      <p className="text-brand-gray">AI 正在挑選最適合您的動作組合</p>
    </div>
  </div>
);

/**
 * App 主組件 (Main App Component)
 * 
 * 應用程式的根組件，管理全域狀態與畫面路由
 * 
 * 狀態管理 (State Management):
 * - currentScreen: 當前畫面 (home/setup/generating/overview/workout/completed)
 * - preferences: 使用者偏好設定 (User Preferences)
 * - workoutPlan: 生成的訓練計畫 (Generated Workout Plan)
 * 
 * @returns {JSX.Element} App 組件
 */
export default function App() {
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<PlanItem[]>([]);

  /**
   * 處理偏好設定完成事件 (Handle Setup Complete Event)
   * 
   * 當使用者完成偏好設定後，呼叫課表生成引擎生成訓練計畫
   * 
   * 流程 (Flow):
   * 1. 儲存使用者偏好 (Save user preferences)
   * 2. 切換至「生成中」畫面 (Switch to generating screen)
   * 3. 呼叫生成引擎 (Call workout generator engine)
   * 4. 人為延遲 1.5 秒展示載入動畫 (Artificial delay for UX)
   * 5. 切換至課表總覽畫面 (Switch to overview screen)
   * 
   * @param {UserPreferences} prefs - 使用者偏好設定 (User preferences)
   */
  const handleSetupComplete = async (prefs: UserPreferences) => {
    setPreferences(prefs);
    setCurrentScreen('generating');

    // 呼叫生成引擎
    try {
      // 人為延遲展示 Loading 動畫 (提升 UX)
      await new Promise(resolve => setTimeout(resolve, 1500));

      const plan = await generateWorkoutPlan(prefs);
      setWorkoutPlan(plan);
      // 生成完畢，進入總覽頁面 (Overview) 而非直接開始
      setCurrentScreen('overview');
    } catch (error) {
      console.error("生成失敗", error);
      alert("抱歉，生成課表時發生錯誤，請稍後再試。");
      setCurrentScreen('home');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* 訓練模式時隱藏 Header */}
      {currentScreen !== 'workout' && <Header />}

      <main className={`flex-1 w-full ${currentScreen !== 'workout' ? 'container mx-auto max-w-4xl p-4' : ''}`}>

        {currentScreen === 'home' && (
          <HomeScreen onStart={() => setCurrentScreen('setup')} />
        )}

        {currentScreen === 'setup' && (
          <SetupScreen
            onComplete={handleSetupComplete}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'generating' && (
          <GeneratingScreen />
        )}

        {currentScreen === 'overview' && workoutPlan.length > 0 && (
          <PlanOverviewScreen
            plan={workoutPlan}
            preferences={preferences}
            onStart={() => setCurrentScreen('workout')}
            onBack={() => setCurrentScreen('setup')}
          />
        )}

        {currentScreen === 'workout' && workoutPlan.length > 0 && (
          <PlayerScreen
            plan={workoutPlan}
            onComplete={() => setCurrentScreen('completed')}
            onExit={() => {
              if (confirm('確定要結束訓練嗎？')) setCurrentScreen('home');
            }}
          />
        )}

        {currentScreen === 'completed' && preferences && (
          <CompletedScreen
            durationMinutes={preferences.durationMinutes}
            onHome={() => setCurrentScreen('home')}
          />
        )}
      </main>

      {currentScreen === 'home' && (
        <footer className="py-6 text-center text-brand-gray/50 text-sm">
          &copy; {new Date().getFullYear()} Virtual Fitness Coach. Built for Trainees.
        </footer>
      )}
    </div>
  );
}