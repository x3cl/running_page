import React, { useMemo, useState, useEffect } from 'react';
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

  // 3. 阿基米德螺旋星云不重叠首尾相接布局算法 (Archimedean Nebula Head-to-Tail Layout)
  const layout = useMemo(() => {
    const results: any[] = [];
    const connectorLines: {
      x1: number;
      y1: number;
      x2: number;
      y2: number;
      color: string;
    }[] = [];
    const occupiedPoints: { x: number; y: number }[] = [];
    const centerX = 5000;
    const centerY = 5000;
    const baseScale = 96;
    const r0 = 45;
    const k_spiral = 13.5;
    const GAP = 7.0;

    let currentTheta = 0.2;
    let prevExit: { x: number; y: number } | null = null;
    let prevSFront = 0;
    let maxRadius = r0;

    processedItems.forEach((item) => {
      // 场景 A: 攀岩活动（抱石、室内攀岩、室外攀岩）精致小人节点
      if (item.category !== 'gps_track') {
        const sBack = 12.0;
        const sFront = 12.0;

        // 根据前序节点的出点与当前节点的入点，按物理弧长步进角度，确保紧密且绝对不重叠
        if (prevSFront > 0) {
          const r = r0 + k_spiral * currentTheta;
          currentTheta += (prevSFront + GAP + sBack) / r;
        }

        // 安全碰撞检测：若异常情况下与内圈点云接近，则向前小步微调直到安全
        let attempts = 0;
        while (attempts < 50) {
          const curR = r0 + k_spiral * currentTheta;
          const tx = centerX + curR * Math.cos(currentTheta);
          const ty = centerY + curR * Math.sin(currentTheta);

          const col = occupiedPoints.some(
            (op) => Math.hypot(tx - op.x, ty - op.y) < 14
          );
          if (!col) break;
          currentTheta += 0.04;
          attempts++;
        }

        const curRadius = r0 + k_spiral * currentTheta;
        if (curRadius > maxRadius) maxRadius = curRadius;

        const tx = centerX + curRadius * Math.cos(currentTheta);
        const ty = centerY + curRadius * Math.sin(currentTheta);
        const tangent = Math.atan2(
          k_spiral * Math.sin(currentTheta) + curRadius * Math.cos(currentTheta),
          k_spiral * Math.cos(currentTheta) - curRadius * Math.sin(currentTheta)
        );

        if (prevExit) {
          connectorLines.push({
            x1: prevExit.x,
            y1: prevExit.y,
            x2: tx,
            y2: ty,
            color: item.color,
          });
        }

        results.push({
          ...item,
          x: tx,
          y: ty,
          rotation: (tangent * 180) / Math.PI,
        });

        occupiedPoints.push({ x: tx, y: ty });
        prevExit = { x: tx, y: ty };
        prevSFront = sFront;
        return;
      }

      // 场景 B: 独立 GPS 轨迹（跑步、骑行、徒步、越野跑等，不合并）
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

      // 计算轨迹主轴方向（起点至离起点最远处的向量），使轨迹自然依附切线流向
      const startPt = item.rawPoints[0];
      let maxDistSq = 0;
      let furthestPt = item.rawPoints[0];
      for (let i = 0; i < item.rawPoints.length; i++) {
        const p = item.rawPoints[i];
        const distSq = (p[0] - startPt[0]) ** 2 + (p[1] - startPt[1]) ** 2;
        if (distSq > maxDistSq) {
          maxDistSq = distSq;
          furthestPt = p;
        }
      }

      const dx = (furthestPt[1] - startPt[1]) * scale;
      const dy = -(furthestPt[0] - startPt[0]) * scale;
      const trackAngle = Math.atan2(dy, dx);

      // 预估当前切线与旋转
      const estRadius = r0 + k_spiral * currentTheta;
      const estTangent = Math.atan2(
        k_spiral * Math.sin(currentTheta) + estRadius * Math.cos(currentTheta),
        k_spiral * Math.cos(currentTheta) - estRadius * Math.sin(currentTheta)
      );
      const initialRot = estTangent - trackAngle;
      const tCos = Math.cos(estTangent);
      const tSin = Math.sin(estTangent);

      // 计算本轨迹沿切线方向的跨度 [minProj, maxProj]
      const relPts = item.rawPoints.map((p: number[]) => {
        const px = (p[1] - midLon) * scale;
        const py = (midLat - p[0]) * scale;
        return {
          rx: px * Math.cos(initialRot) - py * Math.sin(initialRot),
          ry: px * Math.sin(initialRot) + py * Math.cos(initialRot),
        };
      });

      const projs = relPts.map((p: any) => p.rx * tCos + p.ry * tSin);
      const minP = Math.min(...projs);
      const maxP = Math.max(...projs);
      const sBack = minP < 0 ? -minP : 0;
      const sFront = maxP > 0 ? maxP : 0;

      // 沿螺旋弧长步进，确保本轨迹的后端与上一个活动的前端保持 GAP 呼吸距离
      if (prevSFront > 0) {
        currentTheta += (prevSFront + GAP + sBack) / estRadius;
      }

      // 安全碰撞检测：若由于极端复杂轨迹形状产生干涉，则小步向前探测直到完全无干涉
      let attempts = 0;
      let placed = false;
      let finalTx = 0,
        finalTy = 0;
      let finalPtsTrans: { x: number; y: number }[] = [];

      while (!placed && attempts < 50) {
        const curR = r0 + k_spiral * currentTheta;
        const curTangent = Math.atan2(
          k_spiral * Math.sin(currentTheta) + curR * Math.cos(currentTheta),
          k_spiral * Math.cos(currentTheta) - curR * Math.sin(currentTheta)
        );
        const finalRot = curTangent - trackAngle;
        finalTx = centerX + curR * Math.cos(currentTheta);
        finalTy = centerY + curR * Math.sin(currentTheta);

        finalPtsTrans = item.rawPoints.map((p: number[]) => {
          const px = (p[1] - midLon) * scale;
          const py = (midLat - p[0]) * scale;
          return {
            x: finalTx + (px * Math.cos(finalRot) - py * Math.sin(finalRot)),
            y: finalTy + (px * Math.sin(finalRot) + py * Math.cos(finalRot)),
          };
        });

        // 密集采样检测与前序所有活动点云的距离
        const samplePts = finalPtsTrans.filter((_: any, i: number) => i % 3 === 0);
        const col = occupiedPoints.some((op) =>
          samplePts.some((sp) => Math.hypot(sp.x - op.x, sp.y - op.y) < 14)
        );

        if (!col || attempts === 49) {
          placed = true;
        } else {
          currentTheta += 0.04;
          attempts++;
        }
      }

      const placedRadius = r0 + k_spiral * currentTheta;
      if (placedRadius > maxRadius) maxRadius = placedRadius;

      // 计算本轨迹沿世界切线的进点 (entry) 与出点 (exit)
      const curTangent = Math.atan2(
        k_spiral * Math.sin(currentTheta) + placedRadius * Math.cos(currentTheta),
        k_spiral * Math.cos(currentTheta) - placedRadius * Math.sin(currentTheta)
      );
      const worldCos = Math.cos(curTangent);
      const worldSin = Math.sin(curTangent);

      const worldProjs = finalPtsTrans.map(
        (p) => (p.x - finalTx) * worldCos + (p.y - finalTy) * worldSin
      );
      let minProjIdx = 0,
        maxProjIdx = 0;
      for (let i = 1; i < worldProjs.length; i++) {
        if (worldProjs[i] < worldProjs[minProjIdx]) minProjIdx = i;
        if (worldProjs[i] > worldProjs[maxProjIdx]) maxProjIdx = i;
      }

      const entry = finalPtsTrans[minProjIdx];
      const exitPt = finalPtsTrans[maxProjIdx];

      // 首尾相接光丝
      if (prevExit) {
        connectorLines.push({
          x1: prevExit.x,
          y1: prevExit.y,
          x2: entry.x,
          y2: entry.y,
          color: item.color,
        });
      }

      const pathData = finalPtsTrans
        .map((p) => `${p.x.toFixed(1)},${p.y.toFixed(1)}`)
        .join(' ');

      results.push({
        ...item,
        pathData,
        strokeWidth: 2.2,
        opacity: 0.92,
      });

      // 将轨迹点加入占用点云
      finalPtsTrans.forEach((p, i) => {
        if (i % 4 === 0) occupiedPoints.push(p);
      });

      prevExit = exitPt;
      prevSFront = worldProjs[maxProjIdx];
    });

    return { items: results, connectors: connectorLines, maxRadius };
  }, [processedItems]);

  // 月份切换或数据变更时，自适应视口初始缩放并居中
  useEffect(() => {
    setOffset({ x: 0, y: 0 });
    if (layout.maxRadius > 350) {
      setZoom(Math.max(0.45, Math.min(1.15, 350 / layout.maxRadius)));
    } else if (layout.maxRadius > 0) {
      setZoom(Math.min(1.15, 320 / layout.maxRadius));
    } else {
      setZoom(1);
    }
  }, [layout.maxRadius]);

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

            {/* 1. 星云首尾相接流光线 (Connective Stardust Threads) */}
            <g className="pointer-events-none">
              {layout.connectors.map((c, idx) => (
                <g key={`nebula-conn-${idx}`}>
                  <line
                    x1={c.x1}
                    y1={c.y1}
                    x2={c.x2}
                    y2={c.y2}
                    stroke="rgba(255, 255, 255, 0.32)"
                    strokeWidth={1.2}
                    strokeDasharray="2 4"
                  />
                  <circle
                    cx={c.x2}
                    cy={c.y2}
                    r={2.2}
                    fill={c.color}
                    opacity={0.85}
                  />
                </g>
              ))}
            </g>

            {/* 2. 轨迹线与攀岩节点 */}
            {layout.items.map((item, i) => {
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

              // 2. 攀岩活动统一小人节点（去掉外框与背景，统一攀爬小人icon，以不同颜色代表抱石、室内与室外）
              if (
                item.category === 'indoor_bouldering' ||
                item.category === 'indoor_climbing' ||
                item.category === 'outdoor_climbing'
              ) {
                return (
                  <g
                    key={`climb-figure-${item.id}-${i}`}
                    transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation})`}
                    className="pointer-events-auto climb-pebble-node"
                    onMouseEnter={() => setHoveredItem(item)}
                  >
                    <g className="pebble-body" filter="url(#glow)">
                      {/* 攀爬小人头部 (Climber Head) */}
                      <circle
                        cx="0"
                        cy="-9"
                        r="3.5"
                        fill={`${item.color}22`}
                        stroke={item.color}
                        strokeWidth="2"
                      />
                      {/* 攀爬小人身躯与四肢 (Dynamic Climber Body Silhouette) */}
                      <path
                        d="M-2,-5 L-7,-7 L-11,-4 A 2.2 2.2 0 0 0 -9,-1 L-6,-3 L-2,-2 L-2,2 L-8,8 A 2.2 2.2 0 0 0 -6,11 L-1,6 L2,6 L7,10 A 2.2 2.2 0 0 0 10,8 L6,3 L3,2 L3,-2 L7,-7 L9,-11 A 2.2 2.2 0 0 0 6,-12 L4,-8 L1,-5 Z"
                        fill={`${item.color}22`}
                        stroke={item.color}
                        strokeWidth="1.8"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                    </g>
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
              if (layout.maxRadius > 350) {
                setZoom(Math.max(0.45, Math.min(1.15, 350 / layout.maxRadius)));
              } else if (layout.maxRadius > 0) {
                setZoom(Math.min(1.15, 320 / layout.maxRadius));
              } else {
                setZoom(1);
              }
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