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
      // 场景 A: 攀岩类型节点（抱石、室内高壁、室外 Topo）
      if (item.category !== 'gps_track') {
        let found = false,
          attempts = 0;
        const nodeRadius = 85; // 攀岩节点占用半径

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
            results.push({
              ...item,
              x: targetX,
              y: targetY,
              rotation: (rotation * 180) / Math.PI,
            });

            // 占位采样点
            for (let a = 0; a < Math.PI * 2; a += 0.8) {
              occupiedPoints.push({
                x: targetX + 45 * Math.cos(a),
                y: targetY + 45 * Math.sin(a),
              });
            }
            occupiedPoints.push({ x: targetX, y: targetY });

            found = true;
            currentTheta += 0.28;
            currentRadius += 1.8;
          } else {
            currentTheta += 0.12;
            currentRadius += 0.5;
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
        .climb-node-hover:hover {
          filter: drop-shadow(0 0 16px #00ffff) !important;
          cursor: pointer;
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

              // 2. 室内抱石 (Indoor Bouldering)：立体折面大挂件 + 发光抱石岩点 + 爆发折线路线
              if (item.category === 'indoor_bouldering') {
                return (
                  <g
                    key={`boulder-${item.id}-${i}`}
                    transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation}) scale(1.1)`}
                    className="pointer-events-auto climb-node-hover"
                    onMouseEnter={() => setHoveredItem(item)}
                  >
                    {/* 立体几何大挂件 (Faceted 3D Bouldering Volume) */}
                    <polygon
                      points="-65,-45 25,-65 75,-10 40,55 -55,65 -75,10"
                      fill="rgba(255,204,0,0.08)"
                      stroke="#ffcc00"
                      strokeWidth="2"
                      strokeDasharray="6 3"
                    />
                    <polygon
                      points="-65,-45 25,-65 10,-5 -55,10"
                      fill="rgba(255,204,0,0.18)"
                      stroke="#ffcc00"
                      strokeWidth="1.2"
                    />
                    <polygon
                      points="25,-65 75,-10 30,12 10,-5"
                      fill="rgba(255,204,0,0.26)"
                      stroke="#ffcc00"
                      strokeWidth="1.2"
                    />
                    <polygon
                      points="-55,10 10,-5 30,12 40,55 -55,65"
                      fill="rgba(255,204,0,0.14)"
                      stroke="#ffcc00"
                      strokeWidth="1.2"
                    />

                    {/* 彩色抱石岩点 (Bouldering Holds) */}
                    <circle cx="-48" cy="48" r="6" fill="#39ff14" filter="url(#glow)" />
                    <circle cx="-38" cy="52" r="4.5" fill="#39ff14" />
                    <circle cx="-16" cy="22" r="7" fill="#00ffff" filter="url(#glow)" />
                    <circle cx="16" cy="-18" r="6" fill="#ff00ff" filter="url(#glow)" />
                    {/* 完攀 Top 点 */}
                    <polygon
                      points="12,-48 28,-44 24,-56 10,-54"
                      fill="#ff3131"
                      filter="url(#intense-glow)"
                    />

                    {/* 抱石路线粉线 */}
                    <path
                      d="M-42,48 Q-22,38 -16,22 T16,-18 Q20,-38 18,-50"
                      fill="none"
                      stroke="#ffea00"
                      strokeWidth="2.8"
                      strokeDasharray="5 2.5"
                      filter="url(#glow)"
                    />

                    {/* 标志性文字标签 */}
                    <text
                      x="0"
                      y="85"
                      textAnchor="middle"
                      fill="#ffcc00"
                      fontSize="14"
                      fontFamily="monospace"
                      fontWeight="bold"
                      letterSpacing="3"
                    >
                      BOULDERING
                    </text>
                  </g>
                );
              }

              // 3. 室内攀岩 (Indoor Climbing)：高耸垂直分段几何板面 + 垂直路线 + 快挂与双环保护站
              if (item.category === 'indoor_climbing') {
                return (
                  <g
                    key={`indoor-climb-${item.id}-${i}`}
                    transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation}) scale(1.1)`}
                    className="pointer-events-auto climb-node-hover"
                    onMouseEnter={() => setHoveredItem(item)}
                  >
                    {/* 高耸分段几何岩壁板面 (High Wall Faceted Panels) */}
                    <polygon
                      points="-45,85 45,85 55,0 25,-85 -30,-85 -50,0"
                      fill="rgba(255,106,0,0.08)"
                      stroke="#ff6a00"
                      strokeWidth="1.8"
                    />
                    <line
                      x1="-50"
                      y1="0"
                      x2="55"
                      y2="0"
                      stroke="#ff6a00"
                      strokeWidth="1.2"
                      strokeDasharray="4 3"
                      opacity="0.6"
                    />
                    <line
                      x1="-22"
                      y1="85"
                      x2="0"
                      y2="0"
                      stroke="#ff6a00"
                      strokeWidth="0.9"
                      opacity="0.5"
                    />
                    <line
                      x1="0"
                      y1="0"
                      x2="5"
                      y2="-85"
                      stroke="#ff6a00"
                      strokeWidth="0.9"
                      opacity="0.5"
                    />

                    {/* 攀岩主线 (Ascending Route) */}
                    <path
                      d="M-16,80 Q-26,42 6,12 Q28,-22 0,-72"
                      fill="none"
                      stroke="#ff7700"
                      strokeWidth="2.8"
                      filter="url(#glow)"
                    />

                    {/* 快挂 (Quickdraws) */}
                    <circle cx="-16" cy="74" r="4" fill="#ffffff" />
                    <line x1="-22" y1="44" x2="-12" y2="40" stroke="#ffaa00" strokeWidth="2.4" />
                    <circle cx="6" cy="12" r="4" fill="#ffffff" />
                    <line x1="16" y1="-20" x2="26" y2="-24" stroke="#ffaa00" strokeWidth="2.4" />

                    {/* 保护站双环锚链 (Double Ring Anchor) */}
                    <circle
                      cx="-7"
                      cy="-75"
                      r="5"
                      fill="none"
                      stroke="#ffe600"
                      strokeWidth="2.2"
                      filter="url(#glow)"
                    />
                    <circle
                      cx="7"
                      cy="-75"
                      r="5"
                      fill="none"
                      stroke="#ffe600"
                      strokeWidth="2.2"
                      filter="url(#glow)"
                    />
                    <line x1="-2" y1="-75" x2="2" y2="-75" stroke="#ffe600" strokeWidth="2.2" />

                    <text
                      x="0"
                      y="105"
                      textAnchor="middle"
                      fill="#ff7700"
                      fontSize="14"
                      fontFamily="monospace"
                      fontWeight="bold"
                      letterSpacing="3"
                    >
                      INDOOR CLIMB
                    </text>
                  </g>
                );
              }

              // 4. 室外野攀 (Outdoor Climbing Topo)：天然悬崖轮廓 + 经典 Topo 点划线 + 攀登小人剪影！
              if (item.category === 'outdoor_climbing') {
                return (
                  <g
                    key={`outdoor-climb-${item.id}-${i}`}
                    transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation}) scale(1.15)`}
                    className="pointer-events-auto climb-node-hover"
                    onMouseEnter={() => setHoveredItem(item)}
                  >
                    {/* 天然悬崖断崖轮廓 (Crag Cliff Face & Cracks) */}
                    <path
                      d="M-85,85 L-68,42 L-90,0 L-58,-42 L-74,-85 L-10,-95 L45,-90 L80,-52 L62,0 L90,48 L74,85 Z"
                      fill="rgba(0,229,255,0.06)"
                      stroke="#00e5ff"
                      strokeWidth="2"
                    />
                    {/* 岩石裂隙线 (Rock Crack Lines) */}
                    <path
                      d="M-32,85 L-22,42 L-38,12 L-12,-20 L-26,-62 L-10,-95"
                      fill="none"
                      stroke="#00e5ff"
                      strokeWidth="1.2"
                      strokeDasharray="4 4"
                      opacity="0.45"
                    />
                    <path
                      d="M26,62 L42,22 L22,-32 L48,-72"
                      fill="none"
                      stroke="#00e5ff"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      opacity="0.35"
                    />

                    {/* 经典 Topo 点划线路线 (Dashed Topo Route Line) */}
                    <path
                      d="M0,80 Q16,42 -6,6 Q-22,-32 10,-78"
                      fill="none"
                      stroke="#ff2d55"
                      strokeWidth="3.2"
                      strokeDasharray="8 4"
                      filter="url(#intense-glow)"
                    />

                    {/* Topo 挂片点 (Bolt Hangers) */}
                    <circle cx="8" cy="50" r="4" fill="none" stroke="#ff2d55" strokeWidth="2" />
                    <circle cx="-6" cy="6" r="4" fill="none" stroke="#ff2d55" strokeWidth="2" />
                    <circle cx="-14" cy="-36" r="4" fill="none" stroke="#ff2d55" strokeWidth="2" />

                    {/* 保护站双环锚链 */}
                    <rect x="5" y="-87" width="12" height="4.5" rx="2" fill="#ff2d55" filter="url(#glow)" />
                    <circle cx="7" cy="-80" r="3.5" fill="none" stroke="#ff2d55" strokeWidth="1.8" />
                    <circle cx="15" cy="-80" r="3.5" fill="none" stroke="#ff2d55" strokeWidth="1.8" />

                    {/* 🧗‍♂️ 经典攀登小人剪影 (Climber Scaling the Crag!) */}
                    <g transform="translate(-6, 2) scale(1)">
                      {/* 头盔 */}
                      <circle cx="0" cy="-15" r="4" fill="#ffffff" filter="url(#glow)" />
                      {/* 躯干 */}
                      <line x1="0" y1="-11" x2="-2" y2="3" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
                      {/* 右手高抓点 */}
                      <path
                        d="M0,-9 L9,-14 L12,-20"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* 左手侧抓点 */}
                      <path
                        d="M0,-9 L-9,-7 L-12,-12"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* 左腿高脚蹬岩点 */}
                      <path
                        d="M-2,3 L-9,8 L-7,17"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* 右腿支撑踩点 */}
                      <path
                        d="M-2,3 L5,10 L7,19"
                        fill="none"
                        stroke="#ffffff"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* 保护绳 */}
                      <path
                        d="M-2,3 Q-6,20 2,42"
                        fill="none"
                        stroke="#ff2d55"
                        strokeWidth="1.4"
                        opacity="0.85"
                      />
                    </g>

                    <text
                      x="0"
                      y="108"
                      textAnchor="middle"
                      fill="#00e5ff"
                      fontSize="14"
                      fontFamily="monospace"
                      fontWeight="bold"
                      letterSpacing="3"
                    >
                      CRAG TOPO
                    </text>
                  </g>
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