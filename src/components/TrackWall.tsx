import React, { useMemo, useState } from 'react';
import polyline from '@mapbox/polyline';

interface TrackWallProps {
  activities: any[];
}

export const TrackWall: React.FC<TrackWallProps> = ({ activities }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<any | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // 1. 赛博霓虹调色盘
  const getActivityColor = (type: string, name: string = '') => {
    const t = (type || '').toLowerCase();
    const n = (name || '').toLowerCase();
    if (n.includes('抱石') || t.includes('boulder')) return "#ffcc00"; // 抱石金黄
    if (n.includes('室内攀岩') || t.includes('indoor_climbing')) return "#ff6a00"; // 室内攀岩炽热橙
    if (t.includes('rock_climbing') || t.includes('mountaineering') || n.includes('climb')) return "#00e5ff"; // 野攀电光青
    if (t.includes('trail')) return "#39ff14"; // 荧光绿 (Acid Green)
    if (t.includes('ski') || t.includes('snowboard')) return "#00f0ff"; // 冰川青
    if (t.includes('cycling') || t.includes('ride')) return "#ff00ff"; // 极光紫 (Magenta)
    if (t.includes('swim')) return "#7000ff"; // 霓虹深紫
    if (t.includes('hike') || t.includes('walk')) return "#ff9100"; // 炽热橙
    return "#ff3131"; // 赛博红 (Electric Red)
  };

  // 2. 数据分类与准备（关键：独立轨迹不合并，加入三大攀岩类型）
  const processedItems = useMemo(() => {
    if (!activities || !activities.length) return [];
    const items: any[] = [];

    activities.forEach((activity, idx) => {
      const name = (activity.name || '').toLowerCase();
      const type = (activity.type || '').toLowerCase();

      // 判断攀岩类型
      const isIndoorBouldering =
        name.includes('抱石') || type.includes('boulder');
      const isIndoorClimb =
        !isIndoorBouldering &&
        (name.includes('室内攀岩') ||
          type.includes('indoor_climbing') ||
          (name.includes('indoor') && name.includes('climb')));
      const isOutdoorClimb =
        !isIndoorBouldering &&
        !isIndoorClimb &&
        (type.includes('rock_climbing') ||
          type.includes('mountaineering') ||
          name.includes('climboutdoor') ||
          name.includes('pitches') ||
          name.includes('野攀') ||
          (name.includes('climb') && !name.includes('室内')));

      if (isIndoorBouldering) {
        items.push({
          id: activity.run_id || idx,
          name: activity.name || '室内抱石',
          date: activity.start_date_local,
          duration: activity.moving_time,
          heartrate: activity.average_heartrate,
          elevation: activity.elevation_gain || activity.total_elevation_gain,
          type: 'indoor_bouldering',
          category: 'indoor_bouldering',
          color: '#ffcc00',
        });
        return;
      }

      if (isIndoorClimb) {
        items.push({
          id: activity.run_id || idx,
          name: activity.name || '室内攀岩',
          date: activity.start_date_local,
          duration: activity.moving_time,
          heartrate: activity.average_heartrate,
          elevation: activity.elevation_gain || activity.total_elevation_gain,
          type: 'indoor_climbing',
          category: 'indoor_climbing',
          color: '#ff6a00',
        });
        return;
      }

      if (isOutdoorClimb) {
        items.push({
          id: activity.run_id || idx,
          name: activity.name || '室外野攀',
          date: activity.start_date_local,
          distance: activity.distance,
          duration: activity.moving_time,
          heartrate: activity.average_heartrate,
          elevation: activity.elevation_gain || activity.total_elevation_gain,
          type: 'outdoor_climbing',
          category: 'outdoor_climbing',
          color: '#00e5ff',
        });
        return;
      }

      // 常规户外有 GPS 轨迹的活动（跑步、越野跑、骑行、徒步等）
      if (activity.summary_polyline) {
        const pts = polyline.decode(activity.summary_polyline);
        if (pts.length >= 5) {
          // 不做合并！每一次运动独立加入
          items.push({
            id: activity.run_id || idx,
            name: activity.name || '跑步活动',
            date: activity.start_date_local,
            distance: activity.distance,
            duration: activity.moving_time,
            heartrate: activity.average_heartrate,
            elevation: activity.elevation_gain || activity.total_elevation_gain,
            type: activity.type,
            category: 'gps_track',
            points: pts.filter((_, i) => i % 10 === 0),
            rawPoints: pts,
            color: getActivityColor(activity.type, activity.name),
          });
        }
      }
    });

    return items;
  }, [activities]);

  // 3. 有机切线旋转星系布局算法（微调版：容纳独立轨迹与三大攀岩专属节点）
  const layout = useMemo(() => {
    const results: any[] = [];
    const occupiedPoints: { x: number; y: number }[] = [];
    const centerX = 5000,
      centerY = 5000;
    const baseScale = 140;
    let currentTheta = 0;
    let currentRadius = 130;

    processedItems.forEach((item) => {
      // 场景 A: 攀岩类型节点（小石头精致拟物，紧凑点缀并联系在轨迹之间）
      if (item.category !== 'gps_track') {
        let found = false,
          attempts = 0;
        const nodeRadius = 24; // 精致小石头占用半径

        while (!found && attempts < 200) {
          const targetX = centerX + currentRadius * Math.cos(currentTheta);
          const targetY = centerY + currentRadius * Math.sin(currentTheta);
          const rotation = currentTheta + Math.PI / 2;

          const hasCollision = occupiedPoints.some(
            (op) =>
              Math.sqrt((targetX - op.x) ** 2 + (targetY - op.y) ** 2) <
              nodeRadius
          );

          if (!hasCollision) {
            // 寻找 1~2 个邻近轨迹上的联结锚点（让小石头自然联系点缀在轨迹之间）
            const connectors = occupiedPoints
              .map((op) => ({
                x: op.x,
                y: op.y,
                dist: Math.hypot(op.x - targetX, op.y - targetY),
              }))
              .filter((p) => p.dist >= 18 && p.dist <= 75)
              .sort((a, b) => a.dist - b.dist)
              .slice(0, 2);

            results.push({
              ...item,
              x: targetX,
              y: targetY,
              rotation: (rotation * 180) / Math.PI,
              connectors,
            });

            // 占位采样点（小石头约 36-40 像素）
            for (let a = 0; a < Math.PI * 2; a += 1.2) {
              occupiedPoints.push({
                x: targetX + 16 * Math.cos(a),
                y: targetY + 16 * Math.sin(a),
              });
            }
            occupiedPoints.push({ x: targetX, y: targetY });

            found = true;
            currentTheta += 0.16;
            currentRadius += 0.9;
          } else {
            currentTheta += 0.08;
            currentRadius += 0.35;
            attempts++;
          }
        }
        return;
      }

      // 场景 B: 独立 GPS 轨迹（不合并）
      const lats = item.rawPoints.map((p: number[]) => p[0]);
      const lons = item.rawPoints.map((p: number[]) => p[1]);
      const minLat = Math.min(...lats),
        maxLat = Math.max(...lats);
      const minLon = Math.min(...lons),
        maxLon = Math.max(...lons);
      const midLat = (minLat + maxLat) / 2,
        midLon = (minLon + maxLon) / 2;
      const scale =
        baseScale / (Math.max(maxLat - minLat, maxLon - minLon) || 0.001);
      let found = false,
        attempts = 0;

      const getTransformed = (
        lat: number,
        lon: number,
        ox: number,
        oy: number,
        rot: number
      ) => {
        const px = (lon - midLon) * scale;
        const py = (midLat - lat) * scale;
        return {
          x: ox + (px * Math.cos(rot) - py * Math.sin(rot)),
          y: oy + (px * Math.sin(rot) + py * Math.cos(rot)),
        };
      };

      while (!found && attempts < 200) {
        const targetX = centerX + currentRadius * Math.cos(currentTheta);
        const targetY = centerY + currentRadius * Math.sin(currentTheta);
        const rotation = currentTheta + Math.PI / 2;

        const checkPoints = [0, 0.2, 0.4, 0.6, 0.8, 1].map((pct) => {
          const p = item.points[Math.floor(pct * (item.points.length - 1))];
          return getTransformed(p[0], p[1], targetX, targetY, rotation);
        });

        const hasCollision = occupiedPoints.some((op) =>
          checkPoints.some(
            (cp) => Math.sqrt((cp.x - op.x) ** 2 + (cp.y - op.y) ** 2) < 22
          )
        );

        if (!hasCollision) {
          const pathData = item.rawPoints
            .map((p: number[]) => {
              const pt = getTransformed(p[0], p[1], targetX, targetY, rotation);
              return `${pt.x.toFixed(1)},${pt.y.toFixed(1)}`;
            })
            .join(' ');

          results.push({
            ...item,
            pathData,
            strokeWidth: 2.2,
            opacity: 0.92,
          });

          const newOccupied = item.points
            .filter((_: any, i: number) => i % 3 === 0)
            .map((p: number[]) =>
              getTransformed(p[0], p[1], targetX, targetY, rotation)
            );
          occupiedPoints.push(...newOccupied);

          found = true;
          currentTheta += 0.16;
          currentRadius += 1.2;
        } else {
          currentTheta += 0.1;
          currentRadius += 0.35;
          attempts++;
        }
      }
    });

    return results;
  }, [processedItems]);

  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    setMousePos({ x: e.clientX, y: e.clientY });
    if (!isDragging) return;
    setOffset({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
  };

  // 格式化用时
  const formatTime = (time: any) => {
    if (!time) return 'N/A';
    if (typeof time === 'string') {
      const parts = time.split(':');
      if (parts.length >= 2) {
        return `${parseInt(parts[0], 10)}h ${parseInt(parts[1], 10)}m`;
      }
      return time;
    }
    const mins = Math.floor(time / 60);
    return `${mins}m`;
  };

  return (
    <div className="relative w-full h-[800px] bg-[#050508] rounded-[2.5rem] overflow-hidden select-none border border-white/5 shadow-2xl">
      <style>{`
        @keyframes galaxyRotate {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes flicker {
          0%, 100% { opacity: 0.95; }
          50% { opacity: 0.75; }
          52% { opacity: 1; }
        }
        @keyframes pulseGlow {
          0%, 100% { filter: drop-shadow(0 0 6px rgba(255,200,0,0.8)); }
          50% { filter: drop-shadow(0 0 16px rgba(255,200,0,1)); }
        }
        .galaxy-engine {
          animation: galaxyRotate 180s linear infinite;
          transform-origin: 5000px 5000px;
        }
        .cyber-line {
          filter: url(#glow);
          transition: stroke-width 0.2s ease, stroke 0.2s ease;
        }
        .cyber-line:hover {
          stroke-width: 5px !important;
          stroke: #ffffff !important;
          filter: drop-shadow(0 0 12px #fff);
          cursor: pointer;
        }
        .climb-pebble-node {
          cursor: pointer;
        }
        .climb-pebble-node:hover {
          filter: drop-shadow(0 0 16px #ffffff) !important;
        }
        .climb-pebble-node .pebble-body {
          transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
          transform-origin: 0 0;
        }
        .climb-pebble-node:hover .pebble-body {
          transform: scale(1.4);
        }
        .grid-bg {
          background-image: 
            linear-gradient(to right, rgba(255,255,255,0.02) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(255,255,255,0.02) 1px, transparent 1px);
          background-size: 50px 50px;
        }
      `}</style>

      {/* 赛博底网背景 */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />

      {/* 居中水印 */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-5">
        <span className="text-[120px] font-black italic tracking-widest font-mono text-white">
          ORGANIC NETWORK
        </span>
      </div>

      <div
        className="relative w-full h-full cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={() => setIsDragging(false)}
        onMouseLeave={() => {
          setIsDragging(false);
          setHoveredItem(null);
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center pointer-events-none"
          style={{
            transform: `translate3d(${offset.x}px, ${offset.y}px, 0) scale(${zoom})`,
            transition: isDragging
              ? 'none'
              : 'transform 0.4s cubic-bezier(0.2, 0, 0.2, 1)',
          }}
        >
          <svg
            viewBox="0 0 10000 10000"
            className={`w-[10000px] h-[10000px] overflow-visible ${
              isAutoRotating ? 'galaxy-engine' : ''
            }`}
          >
            <defs>
              {/* 核心霓虹辉光滤镜 */}
              <filter id="glow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
              <filter id="intense-glow" x="-50%" y="-50%" width="200%" height="200%">
                <feGaussianBlur stdDeviation="6" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>
            </defs>

            {layout.map((item, i) => {
              // 1. 常规独立 GPS 轨迹线
              if (item.category === 'gps_track') {
                return (
                  <polyline
                    key={`gps-${item.id}-${i}`}
                    points={item.pathData}
                    className="cyber-line pointer-events-auto"
                    fill="none"
                    stroke={item.color}
                    strokeWidth={item.strokeWidth}
                    strokeOpacity={item.opacity}
                    strokeLinejoin="round"
                    strokeLinecap="round"
                    style={{ mixBlendMode: 'screen' }}
                    onMouseEnter={() => setHoveredItem(item)}
                  />
                );
              }

              // 攀岩小石头与临近轨迹间的联系光丝 (Connectors)
              const connectorsJsx = item.connectors && item.connectors.length > 0 ? (
                <g key={`conns-${item.id}-${i}`} className="pointer-events-none">
                  {item.connectors.map((c: any, cIdx: number) => (
                    <g key={`c-${item.id}-${i}-${cIdx}`}>
                      <line
                        x1={item.x}
                        y1={item.y}
                        x2={c.x}
                        y2={c.y}
                        stroke={item.color}
                        strokeWidth={1}
                        strokeDasharray="3 3"
                        strokeOpacity={0.5}
                      />
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={1.8}
                        fill={item.color}
                        opacity={0.7}
                      />
                    </g>
                  ))}
                </g>
              ) : null;

              // 2. 室内抱石 (Indoor Bouldering)：精致小石头晶体（抱石垫 + 切面晶体 + 几何大造型挂件 + 抱石身躯）
              if (item.category === 'indoor_bouldering') {
                return (
                  <React.Fragment key={`boulder-frag-${item.id}-${i}`}>
                    {connectorsJsx}
                    <g
                      key={`boulder-${item.id}-${i}`}
                      transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation})`}
                      className="pointer-events-auto climb-pebble-node"
                      onMouseEnter={() => setHoveredItem(item)}
                    >
                      <g className="pebble-body" filter="url(#glow)">
                        {/* 抱石小石头晶石轮廓 (Boulder Pebble token) */}
                        <polygon
                          points="-19,-7 -8,-18 10,-17 20,-6 16,13 -7,18 -19,8"
                          fill="rgba(255, 204, 0, 0.22)"
                          stroke="#ffcc00"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        {/* 石头立体切面 (Faceted cut lines) */}
                        <path
                          d="M-8,-18 L1,1 L16,13 M1,1 L-19,8 M1,1 L20,-6 M-8,-18 L-19,-7"
                          stroke="#fff066"
                          strokeWidth="0.8"
                          opacity="0.5"
                        />
                        {/* 底部微缩防落垫 (Mini Crash Pad) */}
                        <rect
                          x="-8"
                          y="9"
                          width="16"
                          height="3"
                          rx="1"
                          fill="none"
                          stroke="#ffcc00"
                          strokeWidth="0.9"
                        />
                        <line
                          x1="0"
                          y1="9"
                          x2="0"
                          y2="12"
                          stroke="#ffcc00"
                          strokeWidth="0.8"
                        />
                        {/* 抱石姿态小人 (Mini Climber) */}
                        <circle
                          cx="0"
                          cy="-4.5"
                          r="2.2"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                        <path
                          d="M0,-2 L0,2.5 L-4,5 M0,2.5 L4,2 L8,0 M0,-0.5 L-5,-1.5 M0,-0.5 L5,-3.5"
                          stroke="#ffffff"
                          strokeWidth="1.1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* 微缩大造型挂件 (Mini Volume) */}
                        <polygon points="5,-6 9,-4 7,-1" fill="#fff066" opacity="0.9" />
                      </g>
                    </g>
                  </React.Fragment>
                );
              }

              // 3. 室内攀岩 (Indoor Climbing)：精致小石头晶体（高壁晶石 + D型岩点 + 向上抓握蹬壁姿态）
              if (item.category === 'indoor_climbing') {
                return (
                  <React.Fragment key={`indoor-climb-frag-${item.id}-${i}`}>
                    {connectorsJsx}
                    <g
                      key={`indoor-climb-${item.id}-${i}`}
                      transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation})`}
                      className="pointer-events-auto climb-pebble-node"
                      onMouseEnter={() => setHoveredItem(item)}
                    >
                      <g className="pebble-body" filter="url(#glow)">
                        {/* 高壁小石头晶石轮廓 (Indoor Wall Pebble token) */}
                        <polygon
                          points="-18,-11 -4,-18 14,-14 20,2 14,16 -6,19 -19,10 -21,-2"
                          fill="rgba(255, 106, 0, 0.22)"
                          stroke="#ff6a00"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        {/* 石头立体切面 (Faceted cut lines) */}
                        <path
                          d="M-4,-18 L1,0 L14,16 M1,0 L20,2 M1,0 L-19,10 M-4,-18 L-21,-2"
                          stroke="#ffaa55"
                          strokeWidth="0.8"
                          opacity="0.5"
                        />
                        {/* 高壁攀岩姿态小人 (Mini Climber Scaling Wall) */}
                        <circle
                          cx="0"
                          cy="-5.5"
                          r="2.2"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="1"
                        />
                        <path
                          d="M0,-3 L0,3 L-4,8 M0,3 L4,7 M0,-1 L-5,-3 M0,-1 L4,-4"
                          stroke="#ffffff"
                          strokeWidth="1.1"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                        {/* 经典 D 型小岩点 */}
                        <path d="M-9,-4 Q-6,-2 -9,0 Z" fill="#ffaa55" />
                        <path d="M7,-5 Q10,-3 7,-1 Z" fill="#ffaa55" />
                      </g>
                    </g>
                  </React.Fragment>
                );
              }

              // 4. 室外野攀 (Outdoor Climbing Topo)：精致小石头晶体（山峰断崖切面 + 顶端双环锚链 + Topo打点路线 + 攀登小人）
              if (item.category === 'outdoor_climbing') {
                return (
                  <React.Fragment key={`outdoor-climb-frag-${item.id}-${i}`}>
                    {connectorsJsx}
                    <g
                      key={`outdoor-climb-${item.id}-${i}`}
                      transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation})`}
                      className="pointer-events-auto climb-pebble-node"
                      onMouseEnter={() => setHoveredItem(item)}
                    >
                      <g className="pebble-body" filter="url(#glow)">
                        {/* 天然悬崖小石头晶石轮廓 (Mountain Crag Pebble token) */}
                        <polygon
                          points="-20,11 -17,-5 -7,-19 2,-11 11,-19 20,-5 16,15 -5,19"
                          fill="rgba(0, 229, 255, 0.20)"
                          stroke="#00e5ff"
                          strokeWidth="1.8"
                          strokeLinejoin="round"
                        />
                        {/* 石头切面裂隙 (Faceted cut & crack lines) */}
                        <path
                          d="M-7,-19 L1,2 L16,15 M1,2 L-17,-5 M1,2 L11,-19 M1,2 L-5,19"
                          stroke="#80f5ff"
                          strokeWidth="0.8"
                          opacity="0.5"
                        />
                        {/* 顶端微缩双环保护站 (Mini Summit Twin Rings) */}
                        <circle
                          cx="4"
                          cy="-12"
                          r="1.5"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="0.8"
                        />
                        <circle
                          cx="7.5"
                          cy="-12"
                          r="1.5"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="0.8"
                        />
                        {/* Topo 攀登路线打点虚线 */}
                        <path
                          d="M-5,11 L-2,4 L2,-3 L5,-10"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="0.8"
                          strokeDasharray="1.5 1.5"
                        />
                        <circle cx="-0.5" cy="1" r="1.2" fill="#00e5ff" />
                        {/* 攀爬小人 */}
                        <circle
                          cx="-2"
                          cy="-4"
                          r="1.8"
                          fill="none"
                          stroke="#ffffff"
                          strokeWidth="0.8"
                        />
                        <path
                          d="M-2,-2 L-2,3 L-5,6 M-2,3 L2,4 M-2,0 L-5,-1 M-2,0 L2,-3"
                          stroke="#ffffff"
                          strokeWidth="0.9"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </g>
                    </g>
                  </React.Fragment>
                );
              }

              return null;
            })}
          </svg>
        </div>

        {/* 交互悬浮信息卡片 (Hover Tooltip) */}
        {hoveredItem && (
          <div
            className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-3"
            style={{
              left: `${mousePos.x}px`,
              top: `${mousePos.y - 12}px`,
            }}
          >
            <div className="bg-[#0a0a0f]/95 border border-white/20 p-4 rounded-2xl shadow-2xl backdrop-blur-xl min-w-[220px] text-white">
              <div className="flex items-center justify-between gap-2 mb-2 pb-2 border-b border-white/10">
                <span
                  className="text-xs font-mono font-bold px-2 py-0.5 rounded-md"
                  style={{
                    backgroundColor: `${hoveredItem.color}22`,
                    color: hoveredItem.color,
                    border: `1px solid ${hoveredItem.color}55`,
                  }}
                >
                  {hoveredItem.category === 'indoor_bouldering'
                    ? '🧗‍♂️ 室内抱石'
                    : hoveredItem.category === 'indoor_climbing'
                    ? '🧗 室内高壁攀岩'
                    : hoveredItem.category === 'outdoor_climbing'
                    ? '🧗‍♀️ 室外野攀 (Topo)'
                    : '🏃 轨迹路线'}
                </span>
                <span className="text-[11px] font-mono text-gray-400">
                  {hoveredItem.date ? hoveredItem.date.split(' ')[0] : ''}
                </span>
              </div>

              <div className="font-bold text-sm text-gray-100 mb-2 truncate">
                {hoveredItem.name}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {hoveredItem.distance > 0 && (
                  <div>
                    <span className="text-gray-500 block text-[10px]">距离</span>
                    <span className="font-bold text-white">
                      {(hoveredItem.distance / 1000).toFixed(2)} km
                    </span>
                  </div>
                )}
                {hoveredItem.duration && (
                  <div>
                    <span className="text-gray-500 block text-[10px]">时长</span>
                    <span className="font-bold text-white">
                      {formatTime(hoveredItem.duration)}
                    </span>
                  </div>
                )}
                {hoveredItem.heartrate > 0 && (
                  <div>
                    <span className="text-gray-500 block text-[10px]">平均心率</span>
                    <span className="font-bold text-red-400">
                      {Math.round(hoveredItem.heartrate)} bpm
                    </span>
                  </div>
                )}
                {hoveredItem.elevation > 0 && (
                  <div>
                    <span className="text-gray-500 block text-[10px]">累计爬升</span>
                    <span className="font-bold text-[#2ecc71]">
                      +{Math.round(hoveredItem.elevation)} m
                    </span>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 视口浮动控制条 */}
        <div className="absolute bottom-8 right-8 z-40 flex flex-col space-y-3">
          <button
            onClick={() => setIsAutoRotating(!isAutoRotating)}
            className={`w-12 h-12 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-md transition-all flex items-center justify-center text-lg ${
              isAutoRotating
                ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/40'
                : 'bg-white/5 text-white/70 hover:text-white'
            }`}
            title={isAutoRotating ? '暂停自转' : '开启自转'}
          >
            {isAutoRotating ? '💫' : '🛑'}
          </button>
          <button
            onClick={() => setZoom((z) => Math.min(z * 1.35, 5))}
            className="w-12 h-12 bg-white/5 hover:bg-cyan-500/20 active:scale-95 rounded-2xl border border-white/10 text-white shadow-2xl backdrop-blur-md transition-all flex items-center justify-center font-bold"
            title="放大"
          >
            ＋
          </button>
          <button
            onClick={() => setZoom((z) => Math.max(z * 0.75, 0.2))}
            className="w-12 h-12 bg-white/5 hover:bg-cyan-500/20 active:scale-95 rounded-2xl border border-white/10 text-white shadow-2xl backdrop-blur-md transition-all flex items-center justify-center font-bold"
            title="缩小"
          >
            －
          </button>
          <button
            onClick={() => {
              setOffset({ x: 0, y: 0 });
              setZoom(1);
            }}
            className="px-4 h-10 bg-white/5 hover:bg-cyan-500/20 active:scale-95 rounded-2xl border border-white/10 text-cyan-400 shadow-2xl backdrop-blur-md text-[10px] font-bold tracking-widest uppercase transition-all"
            title="重置视角"
          >
            Reset
          </button>
        </div>
      </div>
    </div>
  );
};
export default TrackWall;