import React, { useMemo, useState } from 'react';
import polyline from '@mapbox/polyline';

export const TrackWall = ({ activities }: { activities: any[] }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // 1. 轨迹预处理
  const clusters = useMemo(() => {
    const groups: any[] = [];
    const validActivities = activities.filter(a => a.summary_polyline);

    validActivities.forEach(activity => {
      const pts = polyline.decode(activity.summary_polyline);
      if (pts.length < 5) return;
      
      const start = `${pts[0][0].toFixed(3)},${pts[0][1].toFixed(3)}`;
      const end = `${pts[pts.length-1][0].toFixed(3)},${pts[pts.length-1][1].toFixed(3)}`;
      const distanceKey = Math.round(activity.distance / 500);
      const clusterKey = `${start}-${end}-${distanceKey}`;

      const existing = groups.find(g => g.key === clusterKey);
      if (existing) {
        existing.count += 1;
      } else {
        groups.push({
          key: clusterKey,
          points: pts.filter((_, i) => i % 10 === 0),
          rawPoints: pts,
          count: 1,
          type: activity.type
        });
      }
    });
    return groups.sort((a, b) => b.rawPoints.length - a.rawPoints.length);
  }, [activities]);

  const getActivityColor = (type: string) => {
    const t = type.toLowerCase();
    if (t.includes('trail')) return "#2ecc71"; 
    if (t.includes('ski') || t.includes('snowboard')) return "#00bfff"; 
    if (t.includes('cycling') || t.includes('ride')) return "#f1c40f"; 
    if (t.includes('swim')) return "#1abc9c"; 
    if (t.includes('hike') || t.includes('walk')) return "#e67e22"; 
    return "#ff5a5f"; 
  };

  // 2. 核心布局逻辑：螺旋轨道放置算法
  const layout = useMemo(() => {
    const results: any[] = [];
    const occupiedPoints: { x: number; y: number }[] = []; // 用于快速距离检测
    
    const centerX = 5000, centerY = 5000;
    const baseScale = 140; 
    
    // 螺旋参数
    let currentTheta = 0; 
    let currentRadius = 120; // 微调：起始半径稍微加大

    clusters.forEach((cluster, idx) => {
      const lats = cluster.rawPoints.map(p => p[0]), lons = cluster.rawPoints.map(p => p[1]);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLon = Math.min(...lons), maxLon = Math.max(...lons);
      const midLat = (minLat + maxLat) / 2;
      const midLon = (minLon + maxLon) / 2;
      const scale = baseScale / (Math.max(maxLat - minLat, maxLon - minLon) || 0.001);

      let found = false;
      let attempts = 0;

      // 轨迹内部变换函数
      const getTransformed = (lat: number, lon: number, ox: number, oy: number, rot: number) => {
        const px = (lon - midLon) * scale;
        const py = (midLat - lat) * scale;
        return {
          x: ox + (px * Math.cos(rot) - py * Math.sin(rot)),
          y: oy + (px * Math.sin(rot) + py * Math.cos(rot))
        };
      };

      // 寻找位置：沿着螺旋线不断步进直到找到空位
      while (!found && attempts < 200) {
        // 计算当前螺旋轨道上的目标点
        const targetX = centerX + currentRadius * Math.cos(currentTheta);
        const targetY = centerY + currentRadius * Math.sin(currentTheta);
        
        // 强制切向旋转：角度 = 极角 + 90度
        const rotation = currentTheta + Math.PI / 2;

        // 优化1：采样检测点从 5 个增加到 11 个，全覆盖
        const checkPoints = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1].map(pct => {
          const p = cluster.points[Math.floor(pct * (cluster.points.length - 1))];
          return getTransformed(p[0], p[1], targetX, targetY, rotation);
        });

        // 优化2：碰撞检测距离阈值增加从 15 提高到 22，留出呼吸感
        const hasCollision = occupiedPoints.some(op => 
          checkPoints.some(cp => Math.sqrt((cp.x - op.x)**2 + (cp.y - op.y)**2) < 22) 
        );

        if (!hasCollision) {
          // 放置成功
          const pathData = cluster.rawPoints.map(p => {
            const pt = getTransformed(p[0], p[1], targetX, targetY, rotation);
            return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
          }).join(' ');

          results.push({
            pathData,
            strokeWidth: 1.2 + Math.min(Math.log(cluster.count + 1) * 2, 6),
            color: getActivityColor(cluster.type),
            opacity: 0.85
          });

          // 将新的采样点加入占用列表
          const newOccupied = cluster.points.filter((_, i) => i % 3 === 0).map(p => 
            getTransformed(p[0], p[1], targetX, targetY, rotation)
          );
          occupiedPoints.push(...newOccupied);
          
          found = true;
          // 放置后，稍微增加轨道半径和角度，为下一条做准备
          currentTheta += 0.15; 
          currentRadius += 1.0; // 微调：半径开度稍微加大
        } else {
          // 如果碰撞，沿着轨道走一小步再试
          currentTheta += 0.1;
          currentRadius += 0.3; // 微调：碰撞后外扩幅度加大
          attempts++;
        }
      }
    });

    return results;
  }, [clusters]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  return (
    <div className="flex justify-center items-center w-full min-h-screen bg-[#020202] overflow-hidden">
      <div 
        className="relative w-screen h-screen cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => setIsDragging(false)}
      >
        <div 
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{ 
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
            transition: isDragging ? 'none' : 'transform 0.2s cubic-bezier(0.2, 0, 0.2, 1)'
          }}
        >
          <svg viewBox="0 0 10000 10000" className="w-[10000px] h-[10000px] overflow-visible">
            {layout.map((p, i) => (
              <polyline 
                key={i} 
                points={p.pathData} 
                fill="none" 
                stroke={p.color} 
                strokeWidth={p.strokeWidth} 
                strokeOpacity={p.opacity}
                strokeLinejoin="round" 
                strokeLinecap="round" 
                style={{ mixBlendMode: 'screen' }} 
              />
            ))}
          </svg>
        </div>

        <div className="fixed bottom-12 right-12 z-50 flex flex-col space-y-4">
          <button onClick={() => setZoom(z => z * 1.4)} className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-white shadow-2xl backdrop-blur-md transition-all active:scale-95 flex items-center justify-center">＋</button>
          <button onClick={() => setZoom(z => z * 0.7)} className="w-14 h-14 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-white shadow-2xl backdrop-blur-md transition-all active:scale-95 flex items-center justify-center">－</button>
          <button onClick={() => {setOffset({x:0,y:0}); setZoom(1)}} className="px-6 h-14 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 text-white shadow-2xl backdrop-blur-md text-xs font-bold tracking-widest">RESET</button>
        </div>
      </div>
    </div>
  );
};