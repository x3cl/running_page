import React, { useMemo } from 'react';
import polyline from '@mapbox/polyline';

export const TrackWall = ({ activities }: { activities: any[] }) => {
  const processedTracks = useMemo(() => {
    const clusters: Record<string, { path: string; count: number; type: string; points: number[][] }> = {};
    activities.filter(a => a.summary_polyline).forEach(activity => {
      const points = polyline.decode(activity.summary_polyline);
      if (points.length < 2) return;
      const fingerprint = `${points[0][0].toFixed(3)}-${points[points.length-1][0].toFixed(3)}`;
      if (clusters[fingerprint]) {
        clusters[fingerprint].count += 1;
      } else {
        clusters[fingerprint] = { path: activity.summary_polyline, count: 1, type: activity.type, points };
      }
    });
    return Object.values(clusters);
  }, [activities]);

  const renderedPaths = useMemo(() => {
    const canvasSize = 1200; // 扩大画布增加呼吸感
    const centerX = canvasSize / 2, centerY = canvasSize / 2, spacing = 140;
    
    return processedTracks.map((track, i) => {
      const lats = track.points.map(p => p[0]), lons = track.points.map(p => p[1]);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLon = Math.min(...lons), maxLon = Math.max(...lons);
      const latRange = maxLat - minLat, lonRange = maxLon - minLon;
      const range = Math.max(latRange, lonRange) || 0.001;
      const scale = 110 / range;
      
      const angle = i * 0.65, radius = Math.sqrt(i) * spacing;
      const xBase = centerX + Math.cos(angle) * radius;
      const yBase = centerY + Math.sin(angle) * radius;

      // 计算中心点用于连接线
      const midX = xBase + (lonRange * scale) / 2;
      const midY = yBase + (latRange * scale) / 2;

      const pathData = track.points.map(p => 
        `${(xBase + (p[1] - minLon) * scale).toFixed(2)},${(yBase + (maxLat - p[0]) * scale).toFixed(2)}`
      ).join(' ');

      let color = "#ff5a5f"; // 默认路跑
      if (track.type.includes('Trail') || track.type.includes('Hike')) color = "#2ecc71"; // 越野绿
      if (track.type.includes('Ski')) color = "#00bfff"; // 滑雪蓝

      return { pathData, midX, midY, strokeWidth: 1.2 + Math.log(track.count) * 2.8, opacity: 0.4 + Math.min(track.count * 0.2, 0.5), color };
    });
  }, [processedTracks]);

  return (
    <div className="w-full bg-[#050505] rounded-[40px] overflow-hidden p-4 shadow-2xl border border-white/5">
      <svg viewBox="0 0 1200 1200" className="w-full h-auto">
        {/* 先画底层的连接线，形成“大网” */}
        <g stroke="white" strokeWidth="0.5" opacity="0.15">
          {renderedPaths.map((p, i) => {
            if (i === 0) return null;
            const prev = renderedPaths[i - 1];
            return (
              <line 
                key={`link-${i}`} 
                x1={prev.midX} y1={prev.midY} 
                x2={p.midX} y2={p.midY} 
                strokeDasharray="2 4" // 点状线增加神经元感
              />
            );
          })}
        </g>
        
        {/* 绘制轨迹主体 */}
        {renderedPaths.map((p, i) => (
          <polyline 
            key={i} 
            points={p.pathData} 
            fill="none" 
            stroke={p.color} 
            strokeWidth={p.strokeWidth} 
            opacity={p.opacity} 
            strokeLinejoin="round" 
            strokeLinecap="round" 
            style={{ mixBlendMode: 'screen' }}
          />
        ))}
      </svg>
    </div>
  );
};