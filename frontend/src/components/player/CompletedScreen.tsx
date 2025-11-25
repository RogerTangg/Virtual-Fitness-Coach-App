import React from 'react';
import { Button } from '../ui/Button';
import { Trophy, RotateCcw, Home } from 'lucide-react';

interface CompletedScreenProps {
  durationMinutes: number;
  onHome: () => void;
}

export const CompletedScreen: React.FC<CompletedScreenProps> = ({ durationMinutes, onHome }) => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center text-center p-4 animate-fade-in">
      {/* 修改動畫為 limited 版本 */}
      <div className="w-28 h-28 bg-yellow-400 rounded-full flex items-center justify-center mb-8 shadow-[0_0_60px_rgba(250,204,21,0.4)] animate-bounce-limited ring-4 ring-yellow-100">
        <Trophy size={56} className="text-yellow-900 drop-shadow-md" />
      </div>
      
      <h2 className="text-4xl font-extrabold text-brand-dark mb-4 tracking-tight">
        訓練完成！
      </h2>
      
      <p className="text-xl text-gray-600 max-w-md mb-12 leading-relaxed">
        太棒了！您剛剛完成了 <span className="font-bold text-brand-dark text-2xl">{durationMinutes}</span> 分鐘的訓練。<br/>
        今天的汗水是明天的線條。
      </p>

      {/* 
         修改: 將 max-w-xs 放寬至 max-w-md 以容納並排文字
         新增: whitespace-nowrap 強制按鈕文字不換行
      */}
      <div className="flex flex-col sm:flex-row gap-4 w-full max-w-md">
        <Button onClick={onHome} fullWidth size="lg" className="gap-2 shadow-lg shadow-brand-dark/20 whitespace-nowrap">
          <Home size={20} /> 返回首頁
        </Button>
        <Button variant="outline" onClick={onHome} fullWidth size="lg" className="gap-2 whitespace-nowrap">
          <RotateCcw size={20} /> 再練一次
        </Button>
      </div>
    </div>
  );
};