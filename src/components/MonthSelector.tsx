import React from 'react';

interface MonthSelectorProps {
  currentYear: number;
  currentMonth: number; // 1 - 12
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
  const months = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const handlePrev = () => {
    if (currentMonth === 1) {
      onSelectMonth(currentYear - 1, 12);
    } else {
      onSelectMonth(currentYear, currentMonth - 1);
    }
  };

  const handleNext = () => {
    if (currentMonth === 12) {
      onSelectMonth(currentYear + 1, 1);
    } else {
      onSelectMonth(currentYear, currentMonth + 1);
    }
  };

  // 格式化月份显示
  const monthStr = currentMonth < 10 ? `0${currentMonth}` : `${currentMonth}`;

  return (
    <div className="w-full flex flex-col items-center space-y-4 my-4">
      {/* 主月份切换控制条 */}
      <div className="flex items-center space-x-3 bg-black/60 border border-white/10 px-5 py-2.5 rounded-full shadow-2xl backdrop-blur-xl">
        <button
          onClick={handlePrev}
          className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all text-sm font-bold border border-white/10"
          title="上一个月"
        >
          ◀
        </button>

        <div className="flex items-baseline space-x-2 px-3">
          <span className="text-3xl md:text-4xl font-black font-mono tracking-tighter text-white">
            {currentYear}.{monthStr}
          </span>
          <span className="text-xs uppercase font-mono tracking-widest text-red-500 font-bold">
            MONTH
          </span>
        </div>

        <button
          onClick={handleNext}
          className="w-9 h-9 rounded-full bg-white/5 hover:bg-white/15 active:scale-95 text-white/80 hover:text-white flex items-center justify-center transition-all text-sm font-bold border border-white/10"
          title="下一个月"
        >
          ▶
        </button>
      </div>

      {/* 12个月份快捷选择条 */}
      <div className="flex flex-wrap justify-center gap-1.5 max-w-full px-2">
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
