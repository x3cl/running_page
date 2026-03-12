import React, { useMemo, useState } from 'react';
import polyline from '@mapbox/polyline';

export const TrackWall = ({ activities }: { activities: any[] }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isAutoRotating, setIsAutoRotating] = useState(true);

  // 1. 赛博霓虹调色盘
  const getActivityColor = (type: string) => {
    const t = type.toLowerCase();
    // 使用高亮霓虹色
    if (t.includes('trail')) return "#39ff14"; // 荧光绿 (Acid Green)
    if (t.includes('ski') || t.includes('snowboard')) return "#00ffff"; // 电光青 (Electric Cyan)
    if (t.includes('cycling') || t.includes('ride')) return "#ff00ff"; // 极光紫 (Magenta)
    if (t.includes('swim')) return "#7000ff"; // 霓虹深紫 (Deep Neon Purple)
    if (t.includes('hike') || t.includes('walk')) return "#ff9100"; // 炽热橙 (Blaze Orange)
    return "#ff3131"; // 赛博红 (Electric Red)
  };

  const clusters = useMemo(() => {
    const groups: any[] = [];
    if (!activities) return [];
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

  const layout = useMemo(() => {
    const results: any[] = [];
    const occupiedPoints: { x: number; y: number }[] = [];
    const centerX = 5000, centerY = 5000;
    const baseScale = 140; 
    let currentTheta = 0; 
    let currentRadius = 120;

    clusters.forEach((cluster) => {
      const lats = cluster.rawPoints.map(p => p[0]), lons = cluster.rawPoints.map(p => p[1]);
      const minLat = Math.min(...lats), maxLat = Math.max(...lats);
      const minLon = Math.min(...lons), maxLon = Math.max(...lons);
      const midLat = (minLat + maxLat) / 2, midLon = (minLon + maxLon) / 2;
      const scale = baseScale / (Math.max(maxLat - minLat, maxLon - minLon) || 0.001);
      let found = false, attempts = 0;

      const getTransformed = (lat: number, lon: number, ox: number, oy: number, rot: number) => {
        const px = (lon - midLon) * scale;
        const py = (midLat - lat) * scale;
        return {
          x: ox + (px * Math.cos(rot) - py * Math.sin(rot)),
          y: oy + (px * Math.sin(rot) + py * Math.cos(rot))
        };
      };

      while (!found && attempts < 200) {
        const targetX = centerX + currentRadius * Math.cos(currentTheta);
        const targetY = centerY + currentRadius * Math.sin(currentTheta);
        const rotation = currentTheta + Math.PI / 2;
        const checkPoints = [0, 0.2, 0.4, 0.6, 0.8, 1].map(pct => {
          const p = cluster.points[Math.floor(pct * (cluster.points.length - 1))];
          return getTransformed(p[0], p[1], targetX, targetY, rotation);
        });
        const hasCollision = occupiedPoints.some(op => 
          checkPoints.some(cp => Math.sqrt((cp.x - op.x)**2 + (cp.y - op.y)**2) < 22) 
        );
        if (!hasCollision) {
          const pathData = cluster.rawPoints.map(p => {
            const pt = getTransformed(p[0], p[1], targetX, targetY, rotation);
            return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
          }).join(' ');
          results.push({
            pathData,
            strokeWidth: 1.2 + Math.min(Math.log(cluster.count + 1) * 2, 6),
            color: getActivityColor(cluster.type),
            opacity: 0.9
          });
          const newOccupied = cluster.points.filter((_, i) => i % 3 === 0).map(p => 
            getTransformed(p[0], p[1], targetX, targetY, rotation)
          );
          occupiedPoints.push(...newOccupied);
          found = true;
          currentTheta += 0.15; 
          currentRadius += 1.0; 
        } else {
          currentTheta += 0.1;
          currentRadius += 0.3;
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
    <div className="flex justify-center items-center w-full min-h-screen bg-[#050508] overflow-hidden">
      <style>{`
        @keyframes galaxyRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 0.9; }
          50% { opacity: 0.7; }
          52% { opacity: 1; }
        }
        .galaxy-engine {
          animation: galaxyRotate 150s linear infinite;
          transform-origin: 5000px 5000px;
        }
        .cyber-line {
          filter: url(#glow); /* 应用霓虹辉光 */
          transition: stroke 0.3s ease;
          animation: flicker 4s infinite Math.random() + 's';
        }
        .grid-bg {
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px);
          background-size: 40px 40px;
        }
      `}</style>

      {/* 赛博网格背景 */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />

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
            transition: isDragging ? 'none' : 'transform 0.4s cubic-bezier(0.2, 0, 0.2, 1)'
          }}
        >
          <svg viewBox="0 0 10000 10000" className={`w-[10000px] h-[10000px] overflow-visible ${isAutoRotating ? 'galaxy-engine' : ''}`}>
            <defs>
              {/* 核心：赛博辉光滤镜 */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {layout.map((p, i) => (
              <polyline 
                key={i} 
                points={p.pathData} 
                className="cyber-line"
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
          <button 
            onClick={() => setIsAutoRotating(!isAutoRotating)} 
            className={`w-14 h-14 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md transition-all flex items-center justify-center text-xl ${isAutoRotating ? 'bg-cyan-500/20 text-cyan-400' : 'bg-white/5 text-white'}`}
          >
            {isAutoRotating ? '💫' : '🛑'}
          </button>
          <button onClick={() => setZoom(z => z * 1.4)} className="w-14 h-14 bg-white/5 hover:bg-cyan-500/20 rounded-2xl border border-white/10 text-white shadow-2xl backdrop-blur-md transition-all flex items-center justify-center font-bold">＋</button>
          <button onClick={() => setZoom(z => z * 0.7)} className="w-14 h-14 bg-white/5 hover:bg-cyan-500/20 rounded-2xl border border-white/10 text-white shadow-2xl backdrop-blur-md transition-all flex items-center justify-center font-bold">－</button>
          <button onClick={() => {setOffset({x:0,y:0}); setZoom(1)}} className="px-6 h-14 bg-white/5 hover:bg-cyan-500/20 rounded-2xl border border-white/10 text-cyan-400 shadow-2xl backdrop-blur-md text-xs font-bold tracking-widest uppercase">System Reset</button>
        </div>
      </div>
    </div>
  );
};