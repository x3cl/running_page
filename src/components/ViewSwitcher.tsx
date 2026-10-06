import React from 'react';
import { useNavigate } from 'react-router-dom';

interface ViewSwitcherProps {
  currentView: 'monthly' | 'annual';
  currentYear: number;
  currentMonth?: number;
}

export const ViewSwitcher: React.FC<ViewSwitcherProps> = ({
  currentView,
  currentYear,
  currentMonth = 1,
}) => {
  const navigate = useNavigate();

  return (
    <div className="flex items-center justify-center p-1 bg-black/60 border border-white/10 rounded-full shadow-2xl backdrop-blur-xl mb-3">
      <button
        type="button"
        onClick={() => {
          if (currentView !== 'monthly') {
            const m = currentMonth > 0 ? currentMonth : 9;
            navigate(`/?year=${currentYear}&month=${m}`);
          }
        }}
        className={`flex items-center space-x-2 px-4 md:px-5 py-1.5 rounded-full text-xs md:text-sm font-mono font-bold transition-all cursor-pointer ${
          currentView === 'monthly'
            ? 'bg-red-600 text-white shadow-lg shadow-red-600/40 scale-102 z-10'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <span>📅</span>
        <span>月度精选</span>
      </button>

      <button
        type="button"
        onClick={() => {
          if (currentView !== 'annual') {
            navigate(`/annual?year=${currentYear}`);
          }
        }}
        className={`flex items-center space-x-2 px-4 md:px-5 py-1.5 rounded-full text-xs md:text-sm font-mono font-bold transition-all cursor-pointer ${
          currentView === 'annual'
            ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg shadow-amber-500/40 scale-102 z-10'
            : 'text-gray-400 hover:text-white hover:bg-white/5'
        }`}
      >
        <span>🏆</span>
        <span>全年大盘</span>
      </button>
    </div>
  );
};

export default ViewSwitcher;
