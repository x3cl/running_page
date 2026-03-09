import React, { useMemo } from 'react';
import polyline from '@mapbox/polyline';

// 1. 轨迹路径归一化与聚类
const processOrganicTracks = (activities: any[]) => {
  const clusters: Record<string, { path: string; count: number; type: string; points: number[][] }> = {};
  
  activities.filter(a => a.summary_polyline).forEach(activity => {
    const points = polyline.decode(activity.summary_polyline);
    if (points.length < 2) return;

    // 创建路径指纹（基于起终点和中间点简化坐标，识别“同一条路”）
    const fingerprint = `${points[0][0].toFixed(3)}-${points[points.length-1][0].toFixed(3)}`;
    
    if (clusters[fingerprint]) {
      clusters[fingerprint].count += 1; // 相同路径叠加权重
    } else {
      clusters[fingerprint] = {
        path: activity.summary_polyline,
        count: 1,
        type: activity.type,
        points: points
      };
    }
  });
  return Object.values(clusters);
};

export const TrackWeb = ({ activities }: { activities: any[] }) => {
  const processedTracks = useMemo(() => processOrganicTracks(activities), [activities]);

  // 2. 布局算法：螺旋增长排布（让不同轨迹相切连接）
  const renderedPaths = useMemo(() => {
    let currentX = 500;
    let currentY = 500;
    const spacing = 120; // 轨迹间的间距

    return processedTracks.map((track, index) => {
      const points = track.points;
      const lats = points.map(p => p[0]);
      const lons = points.map(p => p[1]);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);
      
      const range = Math.max(maxLat - minLat, maxLon - minLon) || 0.001;
      const scale = 100 / range;

      // 螺旋排布逻辑：让轨迹像生物一样向外生长
      const angle = index * 0.5;
      const radius = Math.sqrt(index) * spacing;
      const xBase = currentX + Math.cos(angle) * radius;
      const yBase = currentY + Math.sin(angle) * radius;

      const pathData = points.map(p => 
        `${(xBase + (p[1] - minLon) * scale).toFixed(2)},${(yBase + (maxLat - p[0]) * scale).toFixed(2)}`
      ).join(' ');

      // 颜色逻辑：越野绿、滑雪蓝、路跑红
      let color = "#ff5a5f";
      if (track.type.includes('Trail') || track.type.includes('Hike')) color = "#2ecc71";
      if (track.type.includes('Ski')) color = "#00bfff";

      return {
        pathData,
        // 热力效果：跑得越多的路，线条越粗，光效越强
        strokeWidth: 1 + Math.log(track.count) * 2, 
        opacity: 0.3 + Math.min(track.count * 0.2, 0.7),
        color,
        count: track.count
      };
    });
  }, [processedTracks]);

  return (
    <div className="w-full bg-[#050505] rounded-3xl overflow-hidden shadow-inner p-4">
      <svg viewBox="0 0 1000 1000" className="w-full h-auto filter drop-shadow-[0_0_8px_rgba(255,255,255,0.1)]">
        {/* 绘制轨迹间的“逻辑神经元”连接线 */}
        {renderedPaths.map((path, i) => i > 0 && (
          <line 
            key={`line-${i}`}
            x1={renderedPaths[i-1].pathData.split(',')[0]} 
            y1={renderedPaths[i-1].pathData.split(',')[1]}
            x2={path.pathData.split(',')[0]} 
            y2={path.pathData.split(',')[1]}
            stroke="white" 
            strokeWidth="0.2" 
            opacity="0.1" 
          />
        ))}
        
        {/* 绘制主轨迹 */}
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
            style={{ mixBlendMode: 'screen' }} // 叠加处产生“发光热力”效果
          />
        ))}
      </svg>
    </div>
  );
};