import React, { useMemo, useState } from 'react';
import polyline from '@mapbox/polyline';

interface TrackWallProps {
  activities: any[];
}

const INDOOR_CLIMB_PATHS = [
  "M2400 4045 l-236 -154 -627 52 -627 52 -21 -22 c-21 -21 -22 -33 -36 -510 -7 -268 -16 -524 -19 -568 l-5 -81 -245 -149 c-219 -134 -246 -154 -264 -190 -10 -22 -87 -190 -169 -374 l-151 -334 0 -602 c0 -577 1 -603 19 -619 10 -9 264 -118 564 -242 l545 -224 914 -40 c502 -22 932 -40 955 -40 41 0 52 8 392 308 l349 307 79 155 c43 85 112 211 152 279 l74 123 28 302 c27 289 29 325 29 878 l0 576 -249 438 c-137 241 -258 445 -270 452 -11 8 -31 12 -44 8 -13 -3 -95 -74 -181 -157 -86 -84 -161 -148 -165 -143 -4 5 -111 149 -236 319 -126 171 -237 320 -248 333 -12 12 -32 22 -46 22 -16 0 -113 -58 -261 -155z m502 -345 c136 -184 255 -338 264 -343 33 -19 71 8 219 154 l152 150 217 -382 216 -382 0 -561 c0 -529 -1 -577 -26 -841 l-27 -280 -74 -125 c-41 -69 -105 -186 -143 -261 l-69 -135 -320 -282 -320 -282 -917 40 -916 40 -514 212 -514 212 0 549 0 550 151 336 c84 185 156 341 161 347 5 7 121 80 258 164 187 115 251 159 259 179 5 14 12 141 15 281 10 428 16 631 22 725 l6 90 556 -47 c306 -26 578 -47 604 -48 44 0 61 9 260 140 117 77 217 138 223 137 5 -2 121 -154 257 -337z",
  "M1094 3542 c-38 -25 -40 -94 -7 -212 20 -75 47 -124 95 -175 53 -58 110 -85 179 -85 151 1 271 146 293 357 7 62 -2 98 -28 115 -6 4 -126 8 -266 8 -140 0 -260 -4 -266 -8z m421 -154 c-19 -97 -94 -188 -155 -188 -61 0 -134 88 -155 188 l-7 32 162 0 162 0 -7 -32z",
  "M1953 3152 c-207 -74 -269 -320 -122 -486 79 -90 229 -118 342 -63 69 34 130 102 153 169 24 73 16 182 -19 239 -75 128 -225 187 -354 141z m184 -143 c68 -42 94 -150 52 -218 -61 -100 -178 -114 -260 -32 -83 83 -56 211 56 263 48 22 102 17 152 -13z",
  "M2702 2975 c-23 -7 -57 -24 -75 -38 -18 -14 -120 -144 -227 -291 l-195 -265 -205 -1 -204 0 -83 -84 -83 -84 -100 128 c-105 136 -139 162 -226 176 -146 23 -293 -124 -269 -269 11 -65 31 -96 217 -337 126 -164 184 -231 213 -247 58 -32 140 -48 192 -36 l43 10 0 -82 c0 -80 -3 -89 -147 -486 -130 -360 -146 -411 -147 -469 0 -78 24 -131 84 -182 107 -92 279 -68 351 48 15 25 319 806 319 821 0 1 15 3 33 3 19 0 93 26 171 60 76 34 139 60 141 58 1 -2 19 -97 39 -211 20 -114 42 -221 50 -236 19 -35 73 -88 111 -108 44 -24 143 -28 188 -10 93 39 157 127 157 215 0 38 -109 710 -126 778 -9 37 -80 110 -127 133 -66 32 -147 28 -237 -10 -40 -17 -74 -28 -77 -25 -3 3 108 159 247 348 139 188 259 358 267 377 53 126 -26 282 -162 320 -51 14 -79 13 -133 -4z m118 -130 c41 -21 60 -53 60 -100 0 -37 -21 -69 -265 -400 l-265 -359 0 -98 c0 -89 2 -98 22 -112 33 -23 45 -21 173 34 64 28 131 50 148 50 38 0 93 -31 101 -57 19 -62 127 -732 122 -758 -18 -97 -161 -112 -201 -22 -8 18 -32 140 -54 272 -35 204 -44 243 -62 258 -12 9 -30 17 -40 17 -10 0 -96 -34 -191 -75 -134 -59 -183 -75 -220 -75 -35 0 -53 -6 -71 -22 -17 -16 -71 -145 -181 -438 -88 -232 -166 -424 -178 -437 -17 -18 -32 -23 -74 -23 -46 0 -55 4 -78 31 -18 21 -26 42 -26 67 0 22 58 197 145 440 l145 403 0 166 c0 141 -3 169 -17 185 -23 26 -62 22 -130 -13 -55 -28 -62 -30 -105 -19 -26 7 -57 23 -70 38 -59 65 -331 428 -338 451 -18 68 34 136 105 136 55 0 61 -6 200 -186 63 -81 122 -148 132 -151 34 -9 59 9 149 106 l89 96 206 0 c183 0 209 2 227 18 11 9 109 138 217 285 228 310 251 330 325 292z",
  "M382 1914 c-19 -13 -22 -24 -22 -77 0 -157 83 -313 194 -367 92 -44 209 -19 280 60 93 103 149 327 96 380 -19 19 -33 20 -273 20 -212 0 -256 -2 -275 -16z m428 -132 c0 -42 -35 -117 -75 -158 -36 -38 -47 -44 -82 -44 -31 0 -48 7 -72 29 -31 29 -73 109 -85 164 l-6 27 160 0 c148 0 160 -1 160 -18z",
  "M3260 1850 c-24 -24 -25 -68 -6 -161 38 -179 157 -299 296 -299 159 0 282 147 305 363 6 54 4 65 -15 90 l-21 27 -270 0 c-256 0 -270 -1 -289 -20z m460 -125 c0 -8 -8 -37 -19 -64 -34 -91 -89 -141 -153 -141 -65 0 -141 87 -163 188 l-7 32 171 0 c145 0 171 -2 171 -15z",
  "M837 1212 c-33 -37 -14 -180 38 -287 29 -60 92 -127 143 -151 20 -10 61 -20 89 -22 159 -14 303 173 303 392 0 88 6 86 -297 86 -239 0 -261 -1 -276 -18z m437 -139 c-35 -148 -132 -226 -214 -171 -36 25 -85 109 -96 166 l-6 32 161 0 161 0 -6 -27z",
];

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

              // 2. 室内抱石 (Indoor Bouldering)：极简粗线条拟物风（防落保护垫 + 矮岩石轮廓 + 几何大造型 + D型岩点 + 抱石姿态）
              if (item.category === 'indoor_bouldering') {
                return (
                  <g
                    key={`boulder-${item.id}-${i}`}
                    transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation}) scale(0.44)`}
                    className="pointer-events-auto climb-node-hover"
                    onMouseEnter={() => setHoveredItem(item)}
                  >
                    <g transform="translate(-200, -200)">
                      {/* 矮岩石/大屋檐外轮廓背景 (Boulder Silhouette) */}
                      <polygon
                        points="50,110 180,45 320,70 370,160 340,300 65,300 30,210"
                        fill="rgba(255,204,0,0.06)"
                        stroke="#ffcc00"
                        strokeWidth="14"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      {/* 抱石防落保护垫 (Crash Pad) */}
                      <rect
                        x="80"
                        y="335"
                        width="240"
                        height="40"
                        rx="10"
                        fill="none"
                        stroke="#ffcc00"
                        strokeWidth="14"
                        strokeLinejoin="round"
                      />
                      <line
                        x1="200"
                        y1="335"
                        x2="200"
                        y2="375"
                        stroke="#ffcc00"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                      {/* 几何大造型挂件 (Big Volume Hold) */}
                      <polygon
                        points="260,95 320,120 280,165"
                        fill="none"
                        stroke="#ffcc00"
                        strokeWidth="14"
                        strokeLinejoin="round"
                      />
                      {/* D型经典抱石岩点 (D-shaped Holds) */}
                      <path
                        d="M 80 170 L 130 170 A 25 25 0 0 1 80 170 Z"
                        fill="none"
                        stroke="#ffcc00"
                        strokeWidth="14"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      <path
                        d="M 100 250 L 150 250 A 25 25 0 0 1 100 250 Z"
                        fill="none"
                        stroke="#ffcc00"
                        strokeWidth="14"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      {/* 攀爬者头部 (Climber Head) */}
                      <circle
                        cx="195"
                        cy="130"
                        r="24"
                        fill="none"
                        stroke="#ffcc00"
                        strokeWidth="14"
                      />
                      {/* 攀爬者动态发力身躯 (Climber Body Outline: Heel hook & Compression) */}
                      <path
                        d="M 185 160 L 130 160 L 105 170 A 12 12 0 0 0 115 190 L 140 180 L 165 185 L 165 210 L 135 250 A 12 12 0 0 0 155 265 L 185 225 L 205 225 L 260 215 L 295 195 A 12 12 0 0 0 290 175 L 255 195 L 215 205 L 215 185 L 255 155 L 275 140 A 12 12 0 0 0 265 120 L 235 145 L 205 160 Z"
                        fill="none"
                        stroke="#ffcc00"
                        strokeWidth="14"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      <text
                        x="200"
                        y="415"
                        textAnchor="middle"
                        fill="#ffcc00"
                        fontSize="24"
                        fontFamily="monospace"
                        fontWeight="bold"
                        letterSpacing="4"
                      >
                        BOULDERING
                      </text>
                    </g>
                  </g>
                );
              }

              // 3. 室内攀岩 (Indoor Climbing)：严格按照参考图风格（高耸折角岩壁 + 攀岩小人中空轮廓 + D型岩点）
              if (item.category === 'indoor_climbing') {
                return (
                  <g
                    key={`indoor-climb-${item.id}-${i}`}
                    transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation}) scale(0.44)`}
                    className="pointer-events-auto climb-node-hover"
                    onMouseEnter={() => setHoveredItem(item)}
                  >
                    <g transform="translate(-205, -210)">
                      <polygon
                        points="95,30 215,40 255,20 325,75 385,125 375,300 320,385 110,380 30,335 25,230 75,160 80,70"
                        fill="rgba(255,106,0,0.06)"
                      />
                      <g transform="translate(0, 420) scale(0.1, -0.1)" fill="#ff6a00" stroke="none">
                        {INDOOR_CLIMB_PATHS.map((p, pIdx) => (
                          <path key={`icp-${pIdx}`} d={p} />
                        ))}
                      </g>
                      <text
                        x="205"
                        y="425"
                        textAnchor="middle"
                        fill="#ff6a00"
                        fontSize="24"
                        fontFamily="monospace"
                        fontWeight="bold"
                        letterSpacing="4"
                      >
                        INDOOR CLIMB
                      </text>
                    </g>
                  </g>
                );
              }

              // 4. 室外野攀 (Outdoor Climbing Topo)：同一矢量风格（天然悬崖轮廓 + 双环锚链保护站 + Topo虚线路线 + 攀爬身躯）
              if (item.category === 'outdoor_climbing') {
                return (
                  <g
                    key={`outdoor-climb-${item.id}-${i}`}
                    transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation}) scale(0.44)`}
                    className="pointer-events-auto climb-node-hover"
                    onMouseEnter={() => setHoveredItem(item)}
                  >
                    <g transform="translate(-200, -200)">
                      {/* 天然悬崖断崖轮廓 (Natural Mountain Crag Face) */}
                      <polygon
                        points="50,130 110,60 170,95 240,30 330,75 375,170 355,330 290,380 90,380 30,290 35,190"
                        fill="rgba(0,229,255,0.06)"
                        stroke="#00e5ff"
                        strokeWidth="14"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      {/* 天然岩石裂隙线 (Natural Rock Crack Line) */}
                      <path
                        d="M 100 135 L 85 210 L 105 275 L 80 345"
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="8"
                        strokeDasharray="10 10"
                        strokeLinecap="round"
                        opacity="0.75"
                      />
                      {/* 顶端双环保护站 (Summit Double Ring Anchor Station) */}
                      <circle
                        cx="248"
                        cy="65"
                        r="12"
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="10"
                      />
                      <circle
                        cx="278"
                        cy="65"
                        r="12"
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="10"
                      />
                      <line
                        x1="258"
                        y1="65"
                        x2="268"
                        y2="65"
                        stroke="#00e5ff"
                        strokeWidth="10"
                        strokeLinecap="round"
                      />
                      {/* Topo 攀登路线虚线 (Ascending Topo Route Line) */}
                      <path
                        d="M 140 370 Q 170 280 200 230 T 263 77"
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="8"
                        strokeDasharray="12 8"
                        strokeLinecap="round"
                      />
                      {/* 挂片保护点 (Bolt Hangers) */}
                      <circle cx="165" cy="305" r="8" fill="#00e5ff" />
                      <circle cx="225" cy="170" r="8" fill="#00e5ff" />
                      {/* 攀爬者头部 (Climber Head) */}
                      <circle
                        cx="210"
                        cy="180"
                        r="22"
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="14"
                      />
                      {/* 攀爬者动态身躯 (Climber Body Scaling the Crag) */}
                      <path
                        d="M 195 210 L 155 215 L 135 235 A 12 12 0 0 0 152 250 L 168 235 L 185 235 L 185 260 L 165 315 A 12 12 0 0 0 188 325 L 205 275 L 220 275 L 245 270 L 265 305 A 12 12 0 0 0 285 295 L 265 255 L 235 250 L 230 235 L 255 210 L 270 175 A 12 12 0 0 0 250 162 L 235 195 L 215 210 Z"
                        fill="none"
                        stroke="#00e5ff"
                        strokeWidth="14"
                        strokeLinejoin="round"
                        strokeLinecap="round"
                      />
                      <text
                        x="200"
                        y="415"
                        textAnchor="middle"
                        fill="#00e5ff"
                        fontSize="24"
                        fontFamily="monospace"
                        fontWeight="bold"
                        letterSpacing="4"
                      >
                        CRAG TOPO
                      </text>
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