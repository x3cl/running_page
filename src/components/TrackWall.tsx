import React from 'react';
import polyline from '@mapbox/polyline';

export const TrackWall = ({ activities }: { activities: any[] }) => {
  // 仅筛选有轨迹数据的运动
  const filtered = activities.filter(a => a.summary_polyline);
  
  if (filtered.length === 0) {
    return <div className="text-gray-500 py-20 text-center font-mono">NO TRACK DATA FOUND</div>;
  }

  return (
    /* 极致紧凑的网格：大屏每行显示 20 个，间距极小 */
    <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-1">
      {filtered.map((activity) => {
        const points = polyline.decode(activity.summary_polyline);
        if (!points.length) return null;
        
        const lats = points.map(p => p[0]);
        const lons = points.map(p => p[1]);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);
        
        const latRange = maxLat - minLat;
        const lonRange = maxLon - minLon;
        // 关键：防止除以 0，并计算缩放比例使轨迹占据方块 90% 的空间
        const maxRange = Math.max(latRange, lonRange) || 0.0001;
        const scale = 90 / maxRange;
        
        // 计算居中偏移量
        const xOffset = (100 - lonRange * scale) / 2;
        const yOffset = (100 - latRange * scale) / 2;

        const path = points.map(p => 
          `${(xOffset + (p[1] - minLon) * scale).toFixed(2)},${(yOffset + (maxLat - p[0]) * scale).toFixed(2)}`
        ).join(' ');
        
        // 针对你的运动习惯进行着色：
        // 1. 越野跑 (占你 2025 年运动的 72%) 用鲜艳的绿色
        // 2. 滑雪 (42 天记录) 用天蓝色
        // 3. 普通跑步用经典的橙红色
        let color = "#ff5a5f"; 
        if (activity.type.includes('Trail') || activity.type.includes('Hike')) color = "#2ecc71";
        if (activity.type.includes('Ski')) color = "#00bfff";

        return (
          <div 
            key={activity.run_id} 
            className="aspect-square bg-[#121212] flex items-center justify-center overflow-hidden rounded-sm hover:bg-gray-800 transition-all group relative"
            title={`${activity.name} - ${(activity.distance / 1000).toFixed(2)}km`}
          >
            <svg viewBox="0 0 100 100" className="w-full h-full p-1">
              <polyline 
                points={path} 
                fill="none" 
                stroke={color} 
                strokeWidth="2" 
                strokeLinejoin="round" 
                strokeLinecap="round" 
              />
            </svg>
            {/* 悬停时显示公里数，增加互动感 */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 transition-opacity">
               <span className="text-[7px] text-white font-mono">{(activity.distance / 1000).toFixed(0)}K</span>
            </div>
          </div>
        );
      })}
    </div>
  );
};