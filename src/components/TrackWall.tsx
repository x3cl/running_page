import React, { useMemo } from 'react';
import polyline from '@mapbox/polyline';

export const TrackWall = ({ activities }: { activities: any[] }) => {
  // 1. 处理数据：聚类并简化点
  const clusters = useMemo(() => {
    const groups: any[] = [];
    activities.filter(a => a.summary_polyline).forEach(activity => {
      const pts = polyline.decode(activity.summary_polyline);
      if (pts.length < 5) return;

      // 简单聚类：起点坐标相同则认为重合
      const finger = `${pts[0][0].toFixed(3)},${pts[0][1].toFixed(3)}`;
      const existing = groups.find(g => g.finger === finger);
      
      if (existing) {
        existing.count += 1;
        existing.activities.push(activity);
      } else {
        groups.push({
          finger,
          points: pts.filter((_, i) => i % 5 === 0), // 抽样以提高碰撞检测速度
          rawPoints: pts,
          count: 1,
          type: activity.type,
          activities: [activity]
        });
      }
    });
    return groups;
  }, [activities]);

  // 2. 核心布局：线条相切算法
  const layout = useMemo(() => {
    const placedPoints: { x: number; y: number }[] = [];
    const results: any[] = [];
    const centerX = 1000, centerY = 1000;

    clusters.forEach((cluster, index) => {
      let foundPos = false;
      let angle = 0;
      let radius = 0;
      let finalX = centerX;
      let finalY = centerY;

      // 螺旋线搜索
      while (!foundPos && radius < 1500) {
        const testX = centerX + radius * Math.cos(angle);
        const testY = centerY + radius * Math.sin(angle);

        // 归一化当前轨迹点到测试位置
        const lats = cluster.points.map(p => p[0]), lons = cluster.points.map(p => p[1]);
        const minLat = Math.min(...lats), maxLat = Math.max(...lats);
        const minLon = Math.min(...lons), maxLon = Math.max(...lons);
        const scale = 120 / (Math.max(maxLat - minLat, maxLon - minLon) || 0.001);

        const currentNormalizedPoints = cluster.points.map(p => ({
          x: testX + (p[1] - minLon) * scale,
          y: testY + (maxLat - p[0]) * scale
        }));

        // 检查与已放置点的最小距离（线条相切校验）
        if (placedPoints.length === 0) {
          foundPos = true;
        } else {
          // 寻找最近点距离
          let minDistance = Infinity;
          for (const p1 of currentNormalizedPoints) {
            for (const p2 of placedPoints) {
              const dist = Math.sqrt((p1.x - p2.x)**2 + (p1.y - p2.y)**2);
              if (dist < minDistance) minDistance = dist;
            }
          }
          
          // 阈值设为 3 像素，达到即认为“线条相切”
          if (minDistance >= 2 && minDistance <= 8) {
            foundPos = true;
            finalX = testX;
            finalY = testY;
          }
        }

        angle += 0.3;
        radius += 1.5;
      }

      // 固定位置并记录点
      const lats = cluster.points.map(p => p[0]), lons = cluster.points.map(p => p[1]);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLon = Math.min(...lons), maxLon = Math.max(...lons);
      const scale = 120 / (Math.max(maxLat - minLat, maxLon - minLon) || 0.001);

      const finalPoints = cluster.points.map(p => ({
        x: finalX + (p[1] - minLon) * scale,
        y: finalY + (maxLat - p[0]) * scale
      }));
      placedPoints.push(...finalPoints.filter((_, i) => i % 2 === 0));

      const pathData = cluster.rawPoints.map(p => 
        `${(finalX + (p[1] - minLon) * scale).toFixed(2)},${(finalY + (maxLat - p[0]) * scale).toFixed(2)}`
      ).join(' ');

      let color = "#ff5a5f"; 
      if (cluster.type.includes('Trail')) color = "#2ecc71"; // 72% 越野占比
      if (cluster.type.includes('Ski')) color = "#00bfff"; // 42 天滑雪记录

      results.push({
        pathData,
        strokeWidth: 1.5 + Math.log(cluster.count) * 3, // 重合热力
        opacity: 0.6,
        color
      });
    });

    return results;
  }, [clusters]);

  return (
    <div className="w-full bg-[#050505] rounded-[40px] overflow-hidden p-2 shadow-2xl">
      <svg viewBox="0 0 2000 2000" className="w-full h-auto">
        {layout.map((p, i) => (
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