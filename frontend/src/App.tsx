import React, { useState } from 'react';
import { AppScreen, UserPreferences, PlanItem } from './types/app';
import { SetupScreen } from './components/setup/SetupScreen';
import { PlanOverviewScreen } from './components/plan/PlanOverviewScreen';
import { PlayerScreen } from './components/player/PlayerScreen';
import { CompletedScreen } from './components/player/CompletedScreen';
import { LoginScreen } from './components/auth/LoginScreen';
import { RegisterScreen } from './components/auth/RegisterScreen';
import { ProfileScreen } from './components/auth/ProfileScreen';
import { Button } from './components/ui/Button';
import { Dumbbell, User, LogIn } from 'lucide-react';
import { generateWorkoutPlan } from './features/generator/engine';
import { AuthProvider, useAuth } from './features/auth/AuthContext';

const Header = ({ onProfileClick, onLoginClick }: { onProfileClick: () => void; onLoginClick: () => void }) => {
    const { user, isLoading } = useAuth();

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
            <div className="flex items-center gap-3">
                <span className="hidden sm:inline text-sm">MVP v2.0</span>
                {!isLoading && (
                    user ? (
                        <button
                            onClick={onProfileClick}
                            className="flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                        >
                            <User size={16} />
                            <span className="text-sm hidden sm:inline">{user.display_name}</span>
                        </button>
                    ) : (
                        <button
                            onClick={onLoginClick}
                            className="flex items-center gap-2 px-3 py-1 rounded-full bg-brand-light text-brand-dark hover:bg-white transition-colors font-semibold"
                        >
                            <LogIn size={16} />
                            <span className="text-sm">登入</span>
                        </button>
                    )
                )}
            </div>
        </header>
    );
};

const HomeScreen = ({ onStart, onLogin }: { onStart: () => void; onLogin: () => void }) => {
    const { user } = useAuth();

    return (
        <div className="flex flex-col items-center justify-center min-h-[80vh] px-4 text-center space-y-10 animate-fade-in relative overflow-hidden">
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
                    無需登入,無需昂貴費用。<br />
                    只要告訴我們目標,立即為您生成<span className="font-bold text-brand-dark underline decoration-brand-light decoration-4 underline-offset-2">科學化課表</span>。
                </p>
            </div>

            <Button
                onClick={onStart}
                size="lg"
                className="text-xl px-10 py-5 shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
            >
                立即開始訓練
            </Button>

            {!user && (
                <div className="flex flex-col items-center gap-3 pt-4">
                    <p className="text-sm text-brand-gray">
                        想要保存訓練紀錄與追蹤進度?
                    </p>
                    <button
                        onClick={onLogin}
                        className="text-brand-dark font-semibold hover:underline underline-offset-4 decoration-2 decoration-brand-light transition-all"
                    >
                        立即註冊或登入 →
                    </button>
                </div>
            )}

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
};

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

const AppContent = () => {
    const [currentScreen, setCurrentScreen] = useState<AppScreen>('home');
    const [preferences, setPreferences] = useState<UserPreferences | null>(null);
    const [workoutPlan, setWorkoutPlan] = useState<PlanItem[]>([]);
    const { enterGuestMode } = useAuth();

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
            alert("抱歉,生成課表時發生錯誤,請稍後再試。");
            setCurrentScreen('home');
        }
    };

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            {currentScreen !== 'workout' && (
                <Header
                    onProfileClick={() => setCurrentScreen('profile')}
                    onLoginClick={() => setCurrentScreen('login')}
                />
            )}

            <main className={`flex-1 w-full ${currentScreen !== 'workout' ? 'container mx-auto max-w-4xl p-4' : ''}`}>
                {currentScreen === 'home' && (
                    <HomeScreen
                        onStart={() => setCurrentScreen('setup')}
                        onLogin={() => setCurrentScreen('login')}
                    />
                )}

                {currentScreen === 'login' && (
                    <LoginScreen
                        onSuccess={() => setCurrentScreen('home')}
                        onSwitchToRegister={() => setCurrentScreen('register')}
                        onContinueAsGuest={() => {
                            enterGuestMode();
                            setCurrentScreen('setup');
                        }}
                    />
                )}

                {currentScreen === 'register' && (
                    <RegisterScreen
                        onSuccess={() => setCurrentScreen('home')}
                        onSwitchToLogin={() => setCurrentScreen('login')}
                    />
                )}

                {currentScreen === 'profile' && (
                    <ProfileScreen onBack={() => setCurrentScreen('home')} />
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
                            if (confirm('確定要結束訓練嗎?')) setCurrentScreen('home');
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
};

export default function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}
