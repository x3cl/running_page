import React, { useMemo, useState } from 'react';
import polyline from '@mapbox/polyline';

export const TrackWall = ({ activities }: { activities: any[] }) => {
  const [zoom, setZoom] = useState(1); // 缩放状态

  const clusters = useMemo(() => {
    const groups: any[] = [];
    activities.filter(a => a.summary_polyline).forEach(activity => {
      const pts = polyline.decode(activity.summary_polyline);
      if (pts.length < 5) return;
      const finger = `${pts[0][0].toFixed(3)},${pts[0][1].toFixed(3)}`;
      const existing = groups.find(g => g.finger === finger);
      if (existing) {
        existing.count += 1;
      } else {
        groups.push({
          finger,
          points: pts.filter((_, i) => i % 5 === 0), 
          rawPoints: pts,
          count: 1,
          type: activity.type
        });
      }
    });
    return groups;
  }, [activities]);

  const layout = useMemo(() => {
    const placedPoints: { x: number; y: number }[] = [];
    const results: any[] = [];
    const centerX = 1500, centerY = 1500;
    const baseScale = 150;

    clusters.forEach((cluster) => {
      let foundPos = false;
      let angle = 0;
      let radius = 0;
      let finalX = centerX, finalY = centerY;

      while (!foundPos && radius < 2500) {
        const testX = centerX + radius * Math.cos(angle);
        const testY = centerY + radius * Math.sin(angle);
        
        const lats = cluster.points.map(p => p[0]);
        const lons = cluster.points.map(p => p[1]);
        const minLat = Math.min(...lats), maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const scale = baseScale / (Math.max(maxLat - minLat, Math.max(...lons) - minLon) || 0.001);

        const currentPoints = cluster.points.map(p => ({
          x: testX + (p[1] - minLon) * scale,
          y: testY + (maxLat - p[0]) * scale
        }));

        if (placedPoints.length === 0) {
          foundPos = true;
        } else {
          let minDistance = Infinity;
          for (const p1 of currentPoints) {
            for (const p2 of placedPoints) {
              const dist = Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
              if (dist < minDistance) minDistance = dist;
            }
          }
          if (minDistance >= 15 && minDistance <= 35) {
            foundPos = true;
            finalX = testX;
            finalY = testY;
          }
        }
        angle += 0.25;
        radius += 5;
      }

      const lats = cluster.rawPoints.map(p => p[0]), lons = cluster.rawPoints.map(p => p[1]);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const scale = baseScale / (Math.max(maxLat - minLat, Math.max(...lons) - minLon) || 0.001);

      const pathData = cluster.rawPoints.map(p => 
        `${(finalX + (p[1] - minLon) * scale).toFixed(2)},${(finalY + (maxLat - p[0]) * scale).toFixed(2)}`
      ).join(' ');

      const color = cluster.type.includes('Trail') ? "#2ecc71" : (cluster.type.includes('Ski') ? "#00bfff" : "#ff5a5f");

      results.push({ pathData, strokeWidth: 2 + Math.log(cluster.count) * 3, color });
      
      // 修复在这里：使用 const 声明变量
      const currentFinalPoints = cluster.points.map(p => ({
        x: finalX + (p[1] - minLon) * scale,
        y: finalY + (maxLat - p[0]) * scale
      }));
      placedPoints.push(...currentFinalPoints);
    });
    return results;
  }, [clusters]);

  return (
    <div className="relative w-full bg-[#050505] rounded-[40px] overflow-hidden shadow-2xl border border-white/5">
      <div className="absolute top-6 right-6 z-20 flex flex-col space-y-2">
        <button 
          onClick={() => setZoom(prev => Math.min(prev + 0.2, 3))}
          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/10 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
        </button>
        <button 
          onClick={() => setZoom(prev => Math.max(prev - 0.2, 0.5))}
          className="p-3 bg-white/10 hover:bg-white/20 text-white rounded-full backdrop-blur-md border border-white/10 transition-all"
        >
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 12H4" /></svg>
        </button>
      </div>

      <div className="w-full h-auto overflow-auto cursor-grab active:cursor-grabbing" style={{ maxHeight: '85vh' }}>
        <svg 
          viewBox="0 0 3000 3000" 
          className="w-full transition-transform duration-300 origin-center"
          style={{ transform: `scale(${zoom})`, width: '100%' }}
        >
          {layout.map((p, i) => (
            <polyline 
              key={i} 
              points={p.pathData} 
              fill="none" 
              stroke={p.color} 
              strokeWidth={p.strokeWidth} 
              strokeLinejoin="round" 
              strokeLinecap="round" 
              style={{ mixBlendMode: 'screen' }} 
            />
          ))}
        </svg>
      </div>
    </div>
  );
};