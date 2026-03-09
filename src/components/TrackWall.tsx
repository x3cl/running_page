import React from 'react';
import polyline from '@mapbox/polyline';

export const TrackWall = ({ activities }: { activities: any[] }) => {
  // 只显示有轨迹的运动
  const filtered = activities.filter(a => a.summary_polyline);
  
  if (filtered.length === 0) return null;

  return (
    <div className="grid grid-cols-6 sm:grid-cols-10 md:grid-cols-15 lg:grid-cols-20 gap-1 p-2 bg-black rounded-lg">
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
        const maxRange = Math.max(latRange, lonRange) || 1;
        const scale = 90 / maxRange;
        
        // 居中处理
        const xOffset = (90 - lonRange * scale) / 2 + 5;
        const yOffset = (90 - latRange * scale) / 2 + 5;

        const path = points.map(p => 
          `${(xOffset + (p[1] - minLon) * scale).toFixed(2)},${(yOffset + (maxLat - p[0]) * scale).toFixed(2)}`
        ).join(' ');
        
        // 颜色：越野跑绿色，滑雪蓝色，路跑橙色
        let color = "#ff5a5f"; // 默认路跑
        if (activity.type.includes('Trail') || activity.type.includes('Hike')) color = "#2ecc71";
        if (activity.type.includes('Ski')) color = "#00bfff";

        return (
          <div key={activity.run_id} className="aspect-square bg-gray-900 flex items-center justify-center overflow-hidden rounded-sm">
            <svg viewBox="0 0 100 100" className="w-full h-full p-1">
              <polyline 
                points={path} 
                fill="none" 
                stroke={color} 
                strokeWidth="1.5" 
                strokeLinejoin="round" 
                strokeLinecap="round" 
              />
            </svg>
          </div>
        );
      })}
    </div>
  );
};