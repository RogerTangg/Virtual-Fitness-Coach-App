import React, { useState } from 'react';
import { UserPreferences } from '../../types/app';
import { Button } from '../ui/Button';
import { Dumbbell, Clock, Target, Zap, ChevronRight, Check } from 'lucide-react';

interface SetupScreenProps {
  onComplete: (prefs: UserPreferences) => void;
  onBack: () => void;
}

type Section = 'goal' | 'equipment' | 'details';

export const SetupScreen: React.FC<SetupScreenProps> = ({ onComplete, onBack }) => {
  // 表單狀態
  const [prefs, setPrefs] = useState<UserPreferences>({
    goal: '',
    equipment: ['bodyweight'], // 預設包含徒手
    durationMinutes: 15,
    difficulty: 'beginner'
  });

  // UI 狀態：控制當前顯示的步驟（可選，這裡為了流暢體驗，我們做成單頁長滾動或分段顯示，這裡採用分段引導）
  const [step, setStep] = useState<Section>('goal');

  // 選項資料
  const goals = [
    { id: 'muscle', label: '增肌', desc: '提升肌肉量與力量', icon: <Dumbbell className="w-6 h-6" /> },
    { id: 'fat-loss', label: '減脂', desc: '高強度燃燒卡路里', icon: <Zap className="w-6 h-6" /> },
    { id: 'tone', label: '塑形', desc: '修飾線條與核心', icon: <Target className="w-6 h-6" /> },
  ];

  const equipmentOpts = [
    { id: 'bodyweight', label: '徒手 (無器材)', desc: '隨時隨地' },
    { id: 'dumbbell', label: '啞鈴', desc: '加強負重' },
    { id: 'band', label: '彈力帶', desc: '阻力訓練' },
    { id: 'kettlebell', label: '壺鈴', desc: '爆發力' },
  ];

  const durations = [15, 30, 45, 60];
  
  const difficulties = [
    { id: 'beginner', label: '初階', desc: '剛開始運動' },
    { id: 'intermediate', label: '中階', desc: '有運動習慣' },
    { id: 'advanced', label: '高階', desc: '追求極限' },
  ] as const;

  // 處理器材多選
  const toggleEquipment = (id: string) => {
    setPrefs(prev => {
      const current = prev.equipment;
      if (current.includes(id)) {
        // 不允許取消選擇 "bodyweight" (徒手是基礎)
        if (id === 'bodyweight') return prev; 
        return { ...prev, equipment: current.filter(e => e !== id) };
      } else {
        return { ...prev, equipment: [...current, id] };
      }
    });
  };

  const handleNext = () => {
    if (step === 'goal') setStep('equipment');
    else if (step === 'equipment') setStep('details');
    else onComplete(prefs);
  };

  // 渲染選擇卡片
  const SelectionCard = ({ 
    selected, 
    onClick, 
    title, 
    description, 
    icon 
  }: { 
    selected: boolean; 
    onClick: () => void; 
    title: string; 
    description?: string;
    icon?: React.ReactNode;
  }) => (
    <div 
      onClick={onClick}
      className={`
        relative cursor-pointer rounded-xl p-6 border-2 transition-all duration-200 flex items-start gap-4
        ${selected 
          ? 'border-brand-dark bg-brand-dark/5 ring-1 ring-brand-dark' 
          : 'border-gray-200 hover:border-brand-dark/50 bg-white'}
      `}
    >
      {/* Checkmark indicator */}
      <div className={`
        w-6 h-6 rounded-full border-2 flex items-center justify-center flex-shrink-0 mt-1 transition-colors
        ${selected ? 'bg-brand-dark border-brand-dark text-brand-light' : 'border-gray-300 bg-transparent'}
      `}>
        {selected && <Check size={14} strokeWidth={3} />}
      </div>

      <div className="flex-1">
        <div className="flex items-center gap-2 mb-1">
          {icon && <span className={selected ? 'text-brand-dark' : 'text-gray-400'}>{icon}</span>}
          <h3 className={`font-bold text-lg ${selected ? 'text-brand-dark' : 'text-gray-700'}`}>{title}</h3>
        </div>
        {description && <p className="text-sm text-gray-500">{description}</p>}
      </div>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-fade-in">
      {/* 進度條 */}
      <div className="flex items-center justify-center mb-8 gap-2">
        <div className={`h-2 rounded-full transition-all duration-300 ${step === 'goal' ? 'w-8 bg-brand-dark' : 'w-2 bg-gray-200'}`} />
        <div className={`h-2 rounded-full transition-all duration-300 ${step === 'equipment' ? 'w-8 bg-brand-dark' : 'w-2 bg-gray-200'}`} />
        <div className={`h-2 rounded-full transition-all duration-300 ${step === 'details' ? 'w-8 bg-brand-dark' : 'w-2 bg-gray-200'}`} />
      </div>

      {/* Step 1: Goal */}
      {step === 'goal' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-brand-dark mb-2">您的主要目標是什麼？</h2>
            <p className="text-brand-gray">這將決定訓練的強度與組間休息時間。</p>
          </div>
          <div className="grid gap-4">
            {goals.map(g => (
              <SelectionCard
                key={g.id}
                selected={prefs.goal === g.id}
                onClick={() => setPrefs({ ...prefs, goal: g.id })}
                title={g.label}
                description={g.desc}
                icon={g.icon}
              />
            ))}
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={onBack}>返回</Button>
            <Button 
              onClick={handleNext} 
              disabled={!prefs.goal}
              className="flex-1 ml-4"
            >
              下一步
            </Button>
          </div>
        </div>
      )}

      {/* Step 2: Equipment */}
      {step === 'equipment' && (
        <div className="space-y-6">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-brand-dark mb-2">您有哪些器材？</h2>
            <p className="text-brand-gray">複選。我們會根據您擁有的器材安排動作。</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {equipmentOpts.map(e => (
              <SelectionCard
                key={e.id}
                selected={prefs.equipment.includes(e.id)}
                onClick={() => toggleEquipment(e.id)}
                title={e.label}
                description={e.desc}
              />
            ))}
          </div>
          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={() => setStep('goal')}>上一步</Button>
            <Button onClick={handleNext} className="flex-1 ml-4">下一步</Button>
          </div>
        </div>
      )}

      {/* Step 3: Details (Duration & Difficulty) */}
      {step === 'details' && (
        <div className="space-y-8">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-brand-dark mb-2">最後調整</h2>
            <p className="text-brand-gray">量身打造您的訓練強度。</p>
          </div>

          {/* Duration */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Clock className="text-brand-dark" />
              <h3 className="font-bold text-lg">訓練時長 (分鐘)</h3>
            </div>
            <div className="flex justify-between gap-2">
              {durations.map(d => (
                <button
                  key={d}
                  onClick={() => setPrefs({ ...prefs, durationMinutes: d })}
                  className={`
                    flex-1 py-3 rounded-lg font-medium transition-all
                    ${prefs.durationMinutes === d 
                      ? 'bg-brand-dark text-brand-light shadow-md' 
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
                  `}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty */}
          <div className="bg-white p-6 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 mb-4">
              <Zap className="text-brand-dark" />
              <h3 className="font-bold text-lg">訓練強度</h3>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {difficulties.map(d => (
                <button
                  key={d.id}
                  onClick={() => setPrefs({ ...prefs, difficulty: d.id as any })}
                  className={`
                    py-3 px-2 rounded-lg text-sm font-medium transition-all border-2
                    ${prefs.difficulty === d.id
                      ? 'border-brand-dark bg-brand-dark/5 text-brand-dark' 
                      : 'border-transparent bg-gray-100 text-gray-600 hover:bg-gray-200'}
                  `}
                >
                  {d.label}
                </button>
              ))}
            </div>
            <p className="text-xs text-center mt-3 text-gray-500">
              {difficulties.find(d => d.id === prefs.difficulty)?.desc}
            </p>
          </div>

          <div className="mt-8 flex justify-between">
            <Button variant="outline" onClick={() => setStep('equipment')}>上一步</Button>
            <Button 
              onClick={handleNext} 
              className="flex-1 ml-4 text-lg gap-2"
            >
              開始生成課表 <ChevronRight />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};