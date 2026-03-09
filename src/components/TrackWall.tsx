import React, { useMemo } from 'react';
import polyline from '@mapbox/polyline';

export const TrackWall = ({ activities }: { activities: any[] }) => {
  const processedTracks = useMemo(() => {
    const clusters: Record<string, { path: string; count: number; type: string; points: number[][] }> = {};
    activities.filter(a => a.summary_polyline).forEach(activity => {
      const points = polyline.decode(activity.summary_polyline);
      if (points.length < 2) return;
      // 路径指纹：识别是否为同一条重复路线
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
    const centerX = 500, centerY = 500, spacing = 130;
    return processedTracks.map((track, i) => {
      const lats = track.points.map(p => p[0]), lons = track.points.map(p => p[1]);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLon = Math.min(...lons), maxLon = Math.max(...lons);
      const range = Math.max(maxLat - minLat, maxLon - minLon) || 0.001;
      const scale = 110 / range;
      
      // 螺旋排布：让不同轨迹相切生长
      const angle = i * 0.6, radius = Math.sqrt(i) * spacing;
      const xBase = centerX + Math.cos(angle) * radius, yBase = centerY + Math.sin(angle) * radius;
      const pathData = track.points.map(p => 
        `${(xBase + (p[1] - minLon) * scale).toFixed(2)},${(yBase + (maxLat - p[0]) * scale).toFixed(2)}`
      ).join(' ');

      // 颜色逻辑：越野绿、滑雪蓝、路跑红
      let color = "#ff5a5f";
      if (track.type.includes('Trail') || track.type.includes('Hike')) color = "#2ecc71";
      if (track.type.includes('Ski')) color = "#00bfff";

      return { pathData, strokeWidth: 1.2 + Math.log(track.count) * 2.5, opacity: 0.4 + Math.min(track.count * 0.2, 0.5), color };
    });
  }, [processedTracks]);

  return (
    <div className="w-full bg-[#080808] rounded-3xl overflow-hidden p-6 shadow-2xl">
      <svg viewBox="0 0 1000 1000" className="w-full h-auto">
        {renderedPaths.map((p, i) => (
          <polyline key={i} points={p.pathData} fill="none" stroke={p.color} 
            strokeWidth={p.strokeWidth} opacity={p.opacity} 
            strokeLinejoin="round" strokeLinecap="round" style={{ mixBlendMode: 'screen' }} />
        ))}
        {/* 神经元连接线 */}
        {renderedPaths.map((p, i) => i > 0 && (
          <line key={`l-${i}`} x1={renderedPaths[i-1].pathData.split(',')[0]} y1={renderedPaths[i-1].pathData.split(',')[1]}
            x2={p.pathData.split(',')[0]} y2={p.pathData.split(',')[1]} stroke="white" strokeWidth="0.3" opacity="0.08" />
        ))}
      </svg>
    </div>
  );
};