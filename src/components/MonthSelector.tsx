import React from 'react';
import { useNavigate } from 'react-router-dom';

interface MonthSelectorProps {
  currentYear: number;
  currentMonth: number; // 0 for All, 1 - 12
  onSelectMonth: (year: number, month: number) => void;
  availableYears: number[];
  monthCounts: Record<number, number>; // month -> activity count for current year
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  currentYear,
  currentMonth,
  onSelectMonth,
  availableYears,
  monthCounts,
}) => {
  const navigate = useNavigate();
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const handlePrev = () => {
    if (currentMonth <= 1) {
      onSelectMonth(currentYear - 1, 12);
    } else {
      onSelectMonth(currentYear, currentMonth - 1);
    }
  };

  const handleNext = () => {
    if (currentMonth === 0) {
      onSelectMonth(currentYear, 1);
    } else if (currentMonth === 12) {
      onSelectMonth(currentYear + 1, 1);
    } else {
      onSelectMonth(currentYear, currentMonth + 1);
    }
  };

  // 格式化月份显示
  const monthStr = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;

  // 计算当年总活动数
  const totalYearCount = Object.values(monthCounts).reduce((a, b) => a + b, 0);

  return (
    <div className="w-full flex flex-col items-center space-y-2 my-2">
      {/* 快捷年份选择标签栏 */}
      {availableYears.length > 1 && (
        <div className="flex flex-wrap items-center justify-center gap-1.5 mb-0.5">
          {availableYears.map((y) => (
            <button
              key={y}
              onClick={() => onSelectMonth(y, currentMonth)}
              className={`px-2.5 py-0.5 rounded-full text-xs font-mono font-bold transition-all ${
                y === currentYear
                  ? 'bg-white text-black shadow-lg shadow-white/20 scale-105'
                  : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
              }`}
            >
              {y} 年
            </button>
          ))}
        </div>
      )}

      {/* 主月份切换控制条 */}
      <div className="flex items-center space-x-2.5 bg-black/60 border border-white/10 px-4 py-2 rounded-full shadow-2xl backdrop-blur-xl">
        <button
          onClick={handlePrev}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all text-xs font-bold border border-white/10"
          title="上一个"
        >
          ◀
        </button>

        <div className="flex items-baseline space-x-2 px-2.5">
          <span className="text-2xl md:text-3xl font-black font-mono tracking-tighter text-white">
            {currentMonth === 0 ? `${currentYear} 全年` : `${currentYear}.${monthStr}`}
          </span>
          <span className={`text-[11px] uppercase font-mono tracking-widest font-bold ${
            currentMonth === 0 ? 'text-amber-400' : 'text-red-500'
          }`}>
            {currentMonth === 0 ? 'ANNUAL' : 'MONTH'}
          </span>
        </div>

        <button
          onClick={handleNext}
          className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all text-xs font-bold border border-white/10"
          title="下一个"
        >
          ▶
        </button>
      </div>

      {/* 全年 + 12个月份快捷选择条 */}
      <div className="flex flex-wrap justify-center gap-1.5 max-w-full px-2">
        {/* 进入全年大盘独立界面 */}
        <button
          onClick={() => navigate(`/annual?year=${currentYear}`)}
          className={`px-3.5 py-1 rounded-xl text-xs font-mono transition-all flex items-center space-x-1.5 border cursor-pointer group ${
            currentMonth === 0
              ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white font-black border-amber-500 shadow-lg shadow-amber-500/30 scale-105 z-10'
              : 'bg-gradient-to-r from-red-600/25 to-amber-600/25 text-amber-300 border-amber-500/40 hover:border-amber-400 hover:from-red-600/40 hover:to-amber-600/40 shadow-sm'
          }`}
          title={`进入 ${currentYear} 全年大盘独立界面`}
        >
          <span>🏆 全年大盘</span>
          <span
            className={`text-[9px] px-1 py-0.2 rounded-full font-bold ${
              currentMonth === 0 ? 'bg-black/30 text-white' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}
          >
            {totalYearCount}
          </span>
          <span className="text-[10px] group-hover:translate-x-0.5 transition-transform">→</span>
        </button>

        {months.map((m) => {
          const isSelected = m === currentMonth;
          const count = monthCounts[m] || 0;
          const hasActivities = count > 0;

          return (
            <button
              key={m}
              onClick={() => onSelectMonth(currentYear, m)}
              className={`px-3 py-1 rounded-xl text-xs font-mono transition-all flex items-center space-x-1 border ${
                isSelected
                  ? 'bg-red-600 text-white font-black border-red-500 shadow-lg shadow-red-600/30 scale-105 z-10'
                  : hasActivities
                  ? 'bg-white/5 text-gray-300 border-white/10 hover:border-white/30 hover:bg-white/10'
                  : 'bg-black/30 text-gray-600 border-white/5 opacity-50 hover:opacity-80'
              }`}
            >
              <span>{m}月</span>
              {hasActivities && (
                <span
                  className={`text-[9px] px-1 py-0.2 rounded-full font-bold ${
                    isSelected ? 'bg-black/30 text-white' : 'bg-white/10 text-gray-400'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
export default MonthSelector;
