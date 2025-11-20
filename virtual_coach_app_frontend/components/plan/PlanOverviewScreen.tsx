
import React, { useState } from 'react';
import { PlanItem, UserPreferences } from '../../types/app';
import { Button } from '../ui/Button';
import { Play, Clock, Dumbbell, ChevronLeft, List, ChevronDown, ChevronUp, Zap, Layers } from 'lucide-react';

interface PlanOverviewScreenProps {
  plan: PlanItem[];
  preferences: UserPreferences | null;
  onStart: () => void;
  onBack: () => void;
}

export const PlanOverviewScreen: React.FC<PlanOverviewScreenProps> = ({ 
  plan, 
  preferences, 
  onStart, 
  onBack 
}) => {
  // 狀態：控制哪一張卡片被展開 (儲存 index)
  // 修改：預設為 null (全部折疊)，而非 0 (展開第一項)
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  // 資料處理：將 [運動, 休息, 運動, 休息] 的平鋪陣列，轉換為 [運動+休息] 的整合物件
  const exercisesWithRest = plan.reduce((acc: any[], item, index) => {
    if (item.type === 'exercise') {
      // 找下一個項目看是否為休息
      const nextItem = plan[index + 1];
      const restDuration = (nextItem && nextItem.type === 'rest') ? nextItem.duration : 0;
      
      acc.push({
        ...item,
        restDuration, // 將休息時間整合進來
        originalIndex: index // 保留原始索引以便對應
      });
    }
    return acc;
  }, []);

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  // 格式化時間 (秒 -> 字串)
  const formatTimeSimple = (seconds: number) => {
    if (seconds >= 60) return `${Math.floor(seconds / 60)}分`;
    return `${seconds}秒`;
  };

  // 解析標籤 (取得難度與部位)
  const getTagsInfo = (tags: string[] = []) => {
    const difficulty = tags.find(t => t.startsWith('difficulty:'))?.split(':')[1] || '一般';
    const type = tags.find(t => t.startsWith('type:'))?.split(':')[1] || '綜合';
    return { difficulty, type };
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] animate-fade-in max-w-2xl mx-auto w-full bg-gray-50/50">
      {/* 頂部導航與標題 */}
      <div className="flex-shrink-0 mb-4 pt-2 space-y-4 px-1">
        <div className="flex items-center gap-2 text-brand-gray cursor-pointer hover:text-brand-dark transition-colors" onClick={onBack}>
          <ChevronLeft size={20} />
          <span className="text-sm font-medium">重新設定</span>
        </div>

        <div className="flex justify-between items-end px-2">
          <div>
            <h2 className="text-2xl font-bold text-brand-dark flex items-center gap-2">
              訓練菜單
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              {exercisesWithRest.length} 個動作 • 預計 {preferences?.durationMinutes} 分鐘
            </p>
          </div>
        </div>
      </div>

      {/* 課表清單 (Accordion Style) */}
      <div className="flex-1 overflow-y-auto px-1 pb-24 space-y-3 no-scrollbar">
        {exercisesWithRest.map((item, idx) => {
          const isExpanded = expandedIndex === idx;
          const { difficulty, type } = getTagsInfo(item.exercise?.tags);

          return (
            <div 
              key={idx}
              onClick={() => toggleExpand(idx)}
              className={`
                bg-white rounded-2xl transition-all duration-300 overflow-hidden border cursor-pointer
                ${isExpanded 
                  ? 'border-brand-mid shadow-md ring-1 ring-brand-mid/20' 
                  : 'border-transparent shadow-sm hover:border-brand-light'}
              `}
            >
              {/* 卡片頭部 (常駐顯示) */}
              <div className="p-5">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-4">
                    {/* 圓形序號 */}
                    <div className="w-10 h-10 rounded-full bg-brand-mid text-white flex items-center justify-center text-lg font-bold shadow-sm">
                      {idx + 1}
                    </div>
                    
                    {/* 標題 */}
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 leading-tight">
                        {item.title}
                      </h3>
                      <div className="text-xs text-gray-400 mt-0.5 font-medium">
                        {item.exercise?.name.split(' (')[1]?.replace(')', '') || 'Bodyweight'}
                      </div>
                    </div>
                  </div>

                  {/* 展開箭頭 */}
                  <div className={`text-gray-400 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                    {isExpanded ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                  </div>
                </div>

                {/* 關鍵數據三欄 (仿照圖二設計) */}
                <div className="grid grid-cols-3 gap-4 mt-2">
                  {/* 時間 */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50">
                    <span className="text-xl font-bold text-brand-mid">
                      {formatTimeSimple(item.duration)}
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mt-1">
                      訓練時間
                    </span>
                  </div>

                  {/* 強度/標籤 */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50">
                    <span className="text-base font-bold text-gray-700 flex items-center gap-1">
                      {difficulty}
                    </span>
                    <div className="flex items-center gap-1 mt-1">
                      <span className={`w-2 h-2 rounded-full ${difficulty === '高階' ? 'bg-red-400' : difficulty === '中階' ? 'bg-yellow-400' : 'bg-green-400'}`}></span>
                      <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium">
                        難度
                      </span>
                    </div>
                  </div>

                  {/* 休息 */}
                  <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-gray-50">
                    <span className="text-xl font-bold text-brand-mid">
                      {item.restDuration}s
                    </span>
                    <span className="text-[10px] text-gray-400 uppercase tracking-wider font-medium mt-1">
                      休息
                    </span>
                  </div>
                </div>
                
                {/* 標籤列 (僅在未展開時顯示簡易版，或者一直顯示) */}
                <div className="flex gap-2 mt-4">
                   <span className="px-2 py-0.5 bg-brand-light/20 border border-brand-light text-brand-dark text-[10px] font-bold rounded">
                      {type}
                   </span>
                   {item.duration >= 45 && (
                     <span className="px-2 py-0.5 bg-orange-100 border border-orange-200 text-orange-700 text-[10px] font-bold rounded">
                        耐力
                     </span>
                   )}
                </div>
              </div>

              {/* 展開區域 (詳細資訊) */}
              <div 
                className={`
                  bg-brand-light/10 border-t border-brand-light/30 transition-all duration-300 ease-in-out
                  ${isExpanded ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'}
                `}
              >
                <div className="p-5 space-y-4">
                  {/* 說明 */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1">
                      <List size={12} /> 運動說明
                    </h4>
                    <p className="text-sm text-gray-700 leading-relaxed">
                      {item.exercise?.description}
                    </p>
                  </div>

                  {/* 目標與部位 */}
                  <div className="grid grid-cols-2 gap-4 pt-2">
                    <div>
                      <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Layers size={12} /> 目標肌群
                      </h4>
                      <p className="text-sm text-gray-600">{type}</p>
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-dark uppercase tracking-wider flex items-center gap-1 mb-1">
                        <Zap size={12} /> 建議
                      </h4>
                      <p className="text-sm text-gray-600">保持呼吸，核心收緊</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部固定按鈕 */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white to-transparent z-10">
        <div className="max-w-2xl mx-auto">
          <Button 
            onClick={onStart} 
            size="lg" 
            fullWidth 
            className="shadow-xl text-lg py-4 gap-2 hover:scale-[1.02] transition-transform"
          >
            <Play fill="currentColor" /> 開始訓練
          </Button>
        </div>
      </div>
    </div>
  );
};
