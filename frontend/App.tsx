import React, { useState, useEffect } from 'react';
import { AppScreen, UserPreferences, PlanItem } from './types/app';
import { SetupScreen } from './components/setup/SetupScreen';
import { PlanOverviewScreen } from './components/plan/PlanOverviewScreen';
import { PlayerScreen } from './components/player/PlayerScreen';
import { CompletedScreen } from './components/player/CompletedScreen';
import { LoginScreen } from './components/auth/LoginScreen';
import { RegisterScreen } from './components/auth/RegisterScreen';
import { ProfileScreen } from './components/auth/ProfileScreen';
import { Button } from './components/ui/Button';
import { Dumbbell, User } from 'lucide-react';
import { generateWorkoutPlan } from './features/generator/engine';
import { AuthProvider, useAuth } from './contexts/AuthContext';

/**
 * Header 組件 (Header Component)
 * 
 * 應用程式頂端導覽列，包含品牌 Logo 與用戶資訊
 * 
 * @returns {JSX.Element} Header 組件
 */
const Header = ({ onProfileClick }: { onProfileClick?: () => void }) => {
  const { user, isGuest } = useAuth();

  return (
    <header className="bg-brand-dark text-white py-4 px-6 flex justify-between items-center sticky top-0 z-50 shadow-md">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-brand-light rounded-lg flex items-center justify-center text-brand-dark font-bold shadow-inner">
          <Dumbbell size={18} strokeWidth={3} />
        </div>
        <h1 className="text-xl font-bold tracking-tight text-white">
          Virtual <span className="text-white">Coach</span>
        </h1>
      </div>

      {/* 用戶資訊區 */}
      <div className="flex items-center gap-3">
        {!isGuest && user && (
          <span className="hidden sm:inline text-brand-light font-medium">
            {user.profile.display_name}
          </span>
        )}

        {/* 用戶頭像按鈕 - 改進設計，更顯眼 */}
        <button
          onClick={onProfileClick}
          className="group relative flex items-center gap-2 px-3 py-2 rounded-xl bg-brand-light/10 hover:bg-brand-light/20 transition-all duration-200 border-2 border-brand-light/20 hover:border-brand-light/40"
          title={isGuest ? '登入 / 註冊' : '個人資料'}
        >
          <div className="w-8 h-8 rounded-full bg-brand-light flex items-center justify-center">
            <User size={18} className="text-brand-dark" strokeWidth={2.5} />
          </div>

          {/* Guest 狀態顯示登入提示 */}
          {isGuest && (
            <span className="hidden md:inline text-sm font-medium text-brand-light">
              登入 / 註冊
            </span>
          )}
        </button>
      </div>
    </header>
  );
};

/**
 * HomeScreen 組件 (Home Screen Component)
 * 
 * 應用程式首頁，包含品牌標語與開始訓練按鈕
 * 
 * @param {Object} props - 組件 Props
 * @param {Function} props.onStart - 開始訓練的回調函數 (Callback to start training)
 * @param {Function} props.onLogin - 登入的回調函數 (Callback to login)
 * @returns {JSX.Element} HomeScreen 組件
 */
const HomeScreen = ({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) => (
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

    {/* 登入/註冊提示 */}
    <div className="text-center space-y-2">
      <p className="text-sm text-brand-gray">
        已經有帳號了？
        <button
          onClick={onLogin}
          className="ml-1 font-bold text-brand-dark hover:underline transition-colors"
        >
          登入
        </button>
        以同步訓練紀錄至雲端
      </p>
    </div>

    <div className="flex gap-8 text-sm text-brand-gray/60 pt-4">
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
 * AppContent 內部組件 (App Content Inner Component)
 * 
 * 必須在 AuthProvider 內部才能使用 useAuth
 */
function AppContent() {
  const { user, isGuest, isLoading } = useAuth();
  const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
  const [preferences, setPreferences] = useState<UserPreferences | null>(null);
  const [workoutPlan, setWorkoutPlan] = useState<PlanItem[]>([]);

  /**
   * 初始化：根據認證狀態決定初始畫面
   */
  useEffect(() => {
    if (isLoading) return;

    // 會員自動導向 setup（Phase 2.4 dashboard 未實作前）
    // 訪客維持在 home
    if (!isGuest && user) {
      // 未來：導向 dashboard
      // 目前：維持 home，讓使用者選擇開始訓練
    }
  }, [isLoading, isGuest, user]);

  /**
   * 處理偏好設定完成事件 (Handle Setup Complete Event)
   */
  const handleSetupComplete = async (prefs: UserPreferences) => {
    setPreferences(prefs);
    setCurrentScreen('generating');

    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      const plan = await generateWorkoutPlan(prefs);
      setWorkoutPlan(plan);
      setCurrentScreen('overview');
    } catch (error) {
      console.error("生成失敗", error);
      alert("抱歉，生成課表時發生錯誤，請稍後再試。");
      setCurrentScreen('home');
    }
  };

  /**
   * 處理 Header 使用者圖示點擊
   */
  const handleProfileClick = () => {
    if (isGuest) {
      setCurrentScreen('login');
    } else {
      setCurrentScreen('profile');
    }
  };

  // 載入中狀態
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-brand-light/30 border-t-brand-dark rounded-full animate-spin mx-auto"></div>
          <p className="text-brand-gray">載入中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {currentScreen !== 'workout' && <Header onProfileClick={handleProfileClick} />}

      <main className={`flex-1 w-full ${currentScreen !== 'workout' ? 'container mx-auto max-w-4xl p-4' : ''}`}>
        {currentScreen === 'home' && (
          <HomeScreen
            onStart={() => setCurrentScreen('setup')}
            onLogin={() => setCurrentScreen('login')}
          />
        )}

        {currentScreen === 'setup' && (
          <SetupScreen
            onComplete={handleSetupComplete}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'generating' && <GeneratingScreen />}

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
            onRegister={() => setCurrentScreen('register')}
          />
        )}

        {currentScreen === 'login' && (
          <LoginScreen
            onRegister={() => setCurrentScreen('register')}
            onGuestContinue={() => setCurrentScreen('setup')}
            onSuccess={() => setCurrentScreen('home')}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'register' && (
          <RegisterScreen
            onLogin={() => setCurrentScreen('login')}
            onBack={() => setCurrentScreen('home')}
          />
        )}

        {currentScreen === 'profile' && (
          <ProfileScreen
            onBack={() => setCurrentScreen('home')}
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

/**
 * App 主組件 (Main App Component)
 * 
 * 包裹 AuthProvider 提供全域認證狀態
 */
export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}