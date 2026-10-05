import React, { useMemo, useState, useEffect } from 'react';
import polyline from '@mapbox/polyline';
import { getClimbCategory, isManualClimbRecord, isFitnessActivity } from '@/utils/utils';

interface TrackWallProps {
  activities: any[];
}

// Noun Project Rock Climbing Icon (ID: 1991938 by Abner Ignatius)
const ROCK_CLIMBING_ICON_PATH =
  'M -2.72 -11.91 c -0.22 0.12 -0.27 0.19 -0.27 0.44 0.00 0.18 0.14 0.34 1.28 1.52 1.24 1.29 1.95 1.95 2.48 2.32 0.40 0.27 1.30 0.70 1.77 0.83 0.23 0.07 0.83 0.31 1.33 0.54 0.50 0.22 1.00 0.44 1.12 0.48 0.42 0.13 0.39 -0.01 0.53 3.12 0.07 1.56 0.15 3.52 0.16 4.35 0.04 1.69 0.08 2.16 0.30 2.61 0.28 0.62 0.77 1.00 1.75 1.37 0.68 0.25 1.05 0.70 1.15 1.37 0.02 0.15 0.01 0.63 -0.02 1.08 -0.04 0.46 -0.05 1.28 -0.02 1.93 0.04 1.07 0.05 1.14 0.18 1.27 0.18 0.18 0.47 0.18 0.65 -0.00 0.14 -0.14 0.14 -0.15 0.18 -2.24 0.04 -2.25 0.02 -2.46 -0.27 -3.02 -0.33 -0.63 -0.77 -0.99 -1.70 -1.37 -0.68 -0.27 -0.85 -0.41 -1.03 -0.79 -0.14 -0.31 -0.13 -0.19 -0.34 -5.92 -0.07 -1.84 -0.16 -3.49 -0.19 -3.65 -0.11 -0.49 -0.36 -0.71 -1.43 -1.23 -0.52 -0.25 -1.35 -0.61 -1.86 -0.80 -1.68 -0.65 -1.84 -0.76 -3.86 -2.82 -0.86 -0.88 -1.44 -1.43 -1.54 -1.44 -0.08 -0.02 -0.23 0.01 -0.33 0.06 z M -4.78 -9.81 c -0.27 0.23 -0.57 0.74 -0.57 0.96 0.00 0.19 0.10 0.34 0.52 0.80 0.33 0.36 0.64 1.01 0.76 1.58 0.05 0.25 0.05 0.40 -0.04 0.77 -0.21 0.95 -0.69 1.59 -1.58 2.13 -0.82 0.50 -1.35 0.95 -1.53 1.30 -0.33 0.63 -0.25 0.91 0.71 2.43 0.43 0.68 1.08 1.70 1.44 2.29 0.71 1.12 1.12 1.60 1.63 1.87 0.27 0.15 0.29 0.18 0.58 0.88 0.16 0.40 0.62 1.46 1.01 2.36 0.39 0.89 0.97 2.22 1.28 2.95 0.48 1.14 0.59 1.34 0.74 1.41 0.20 0.10 0.47 0.08 1.00 -0.09 0.60 -0.19 0.85 -0.60 0.74 -1.20 -0.33 -1.69 -0.96 -4.01 -1.49 -5.56 -0.28 -0.80 -0.51 -1.48 -0.51 -1.50 0.00 -0.04 0.62 -0.76 1.06 -1.24 0.06 -0.07 0.22 0.19 0.85 1.36 0.42 0.79 0.81 1.49 0.86 1.54 0.23 0.26 0.58 0.19 1.22 -0.25 0.42 -0.28 0.55 -0.48 0.55 -0.88 0.00 -0.31 -0.32 -1.54 -0.83 -3.20 -0.57 -1.84 -0.82 -2.19 -1.68 -2.39 -0.56 -0.13 -1.07 0.08 -2.59 1.06 -0.46 0.30 -0.85 0.54 -0.86 0.54 -0.02 -0.00 -0.21 -0.39 -0.42 -0.88 -0.46 -1.03 -0.48 -1.18 -0.21 -1.68 0.39 -0.70 0.66 -1.33 0.83 -1.86 0.15 -0.48 0.17 -0.65 0.17 -1.39 0.01 -0.77 -0.01 -0.89 -0.17 -1.38 -0.31 -0.93 -0.98 -1.80 -1.91 -2.46 -0.55 -0.39 -0.74 -0.48 -1.05 -0.48 -0.22 -0.00 -0.31 0.04 -0.49 0.19 z m 1.25 1.34 c 0.96 0.77 1.46 1.72 1.46 2.82 0.01 0.83 -0.14 1.31 -0.71 2.42 l -0.48 0.94 -0.01 0.51 c 0.00 0.50 0.01 0.54 0.31 1.18 0.18 0.36 0.43 0.96 0.57 1.32 0.27 0.68 0.40 0.83 0.73 0.83 0.08 -0.00 0.57 -0.28 1.11 -0.63 1.74 -1.12 1.97 -1.25 2.30 -1.25 0.22 -0.00 0.34 0.10 0.48 0.35 0.10 0.19 0.45 1.30 0.88 2.79 0.17 0.58 0.32 1.11 0.34 1.16 0.02 0.08 0.00 0.11 -0.08 0.11 -0.08 -0.00 -0.29 -0.33 -0.89 -1.46 -0.43 -0.80 -0.83 -1.52 -0.89 -1.60 -0.11 -0.14 -0.39 -0.19 -0.61 -0.10 -0.05 0.02 -0.45 0.44 -0.88 0.94 -1.14 1.28 -1.59 1.64 -2.21 1.73 -0.71 0.10 -1.20 -0.30 -1.99 -1.58 -0.27 -0.44 -0.86 -1.38 -1.32 -2.12 -0.53 -0.85 -0.83 -1.38 -0.83 -1.49 0.00 -0.21 0.21 -0.40 1.20 -1.05 0.89 -0.59 1.28 -0.99 1.64 -1.67 0.45 -0.87 0.59 -1.78 0.39 -2.56 -0.13 -0.51 -0.51 -1.28 -0.80 -1.63 -0.14 -0.16 -0.25 -0.30 -0.25 -0.31 0.00 -0.05 0.21 0.08 0.56 0.36 z m 3.01 14.03 c 0.24 0.70 0.53 1.57 0.63 1.95 0.23 0.76 0.68 2.64 0.73 3.06 0.04 0.25 0.03 0.28 -0.08 0.28 -0.10 -0.00 -0.18 -0.13 -0.38 -0.62 -0.14 -0.34 -0.51 -1.20 -0.82 -1.92 -0.31 -0.71 -0.79 -1.85 -1.07 -2.51 l -0.51 -1.22 0.38 -0.10 c 0.21 -0.05 0.43 -0.14 0.49 -0.18 0.06 -0.05 0.13 -0.07 0.15 -0.04 0.02 0.02 0.24 0.61 0.48 1.31 z M -8.42 -7.38 c -0.58 0.19 -1.13 0.71 -1.35 1.29 -0.19 0.48 -0.19 1.13 0.00 1.60 0.18 0.46 0.64 0.96 1.08 1.18 0.30 0.15 0.42 0.17 0.89 0.17 0.47 -0.00 0.59 -0.02 0.89 -0.16 0.19 -0.08 0.46 -0.27 0.60 -0.41 1.08 -1.00 0.86 -2.82 -0.44 -3.51 -0.33 -0.18 -0.45 -0.21 -0.90 -0.22 -0.33 -0.02 -0.61 0.01 -0.77 0.06 z m 1.28 1.15 c 0.41 0.31 0.56 0.92 0.36 1.41 -0.28 0.67 -1.00 0.87 -1.63 0.45 -0.73 -0.50 -0.63 -1.60 0.18 -1.98 0.30 -0.14 0.82 -0.08 1.09 0.12 z';

// Noun Project / Olympic Style Weightlifting & Fitness Icon (力量举/健身矢量小人)
const FITNESS_ICON_PATH =
  'M -11.5 -11.8 h 23 v 1.2 h -23 z ' +
  'M -12.5 -14.2 h 1.8 v 6 h -1.8 z ' +
  'M -10 -13.4 h 1.5 v 4.4 h -1.5 z ' +
  'M 8.5 -13.4 h 1.5 v 4.4 h -1.5 z ' +
  'M 10.7 -14.2 h 1.8 v 6 h -1.8 z ' +
  'M 0 -9.6 a 2.3 2.3 0 1 0 0.001 0 z ' +
  'M -6.4 -10.8 L -3.2 -4.6 L -1.6 -4.6 L -4.8 -10.8 Z ' +
  'M 6.4 -10.8 L 3.2 -4.6 L 1.6 -4.6 L 4.8 -10.8 Z ' +
  'M -2.8 -4.6 h 5.6 L 1.6 1.2 h -3.2 Z ' +
  'M -1.6 0.8 L -4.5 5.8 L -3.2 11.2 h -2.2 L -6.5 5.4 L -2.8 0.5 Z ' +
  'M 1.6 0.8 L 4.5 5.8 L 3.2 11.2 h 2.2 L 6.5 5.4 L 2.8 0.5 Z';

export const TrackWall: React.FC<TrackWallProps> = ({ activities }) => {
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isAutoRotating, setIsAutoRotating] = useState(true);
  const [hoveredItem, setHoveredItem] = useState<any | null>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // 1. 赛博霓虹调色盘
  const getActivityColor = (type: string, name: string = '', subtype: string = '') => {
    const t = (type || '').toLowerCase();
    const n = (name || '').toLowerCase();
    const st = (subtype || '').toLowerCase();
    if (isFitnessActivity({ type: t, name: n, subtype: st })) return "#ccff00"; // 室内健身 赛博电光黄绿 (Neon Volt)
    if (n.includes('抱石') || t.includes('boulder') || st.includes('boulder')) return "#ffcc00"; // 抱石金黄
    if (n.includes('室内攀岩') || t.includes('indoor_climbing')) return "#ff6a00"; // 室内攀岩炽热橙
    if (t.includes('rock_climbing') || t.includes('mountaineering') || n.includes('climb') || n.includes('野攀') || n.includes('攀岩')) return "#00e5ff"; // 野攀电光青
    if (t.includes('trail') || st.includes('trail') || n.includes('越野')) return "#39ff14"; // 越野跑 荧光绿 (Acid Neon Green)
    if (t.includes('ski') || t.includes('snowboard') || n.includes('滑雪')) return "#00f0ff"; // 冰川青
    if (t.includes('cycling') || t.includes('ride') || t.includes('biking') || n.includes('骑行')) return "#ff00ff"; // 极光紫 (Magenta)
    if (t.includes('swim') || t.includes('paddle') || t.includes('rowing') || n.includes('游泳') || n.includes('水上')) return "#7000ff"; // 霓虹深紫
    if (t.includes('hike') || t.includes('walk') || n.includes('徒步') || n.includes('健走')) return "#ff9100"; // 徒步 炽热琥珀橙
    return "#ff3131"; // 路跑 赛博红 (Electric Red)
  };

  // 2. 数据分类与准备（关键：如果有轨迹就加进去；无轨迹的攀岩/室内运动以节点呈现）
  const processedItems = useMemo(() => {
    if (!activities || !activities.length) return [];
    const items: any[] = [];

    activities.forEach((activity, idx) => {
      const climbCat = getClimbCategory(activity);
      const isManual = climbCat ? isManualClimbRecord(activity) : false;
      const type = (activity.type || '').toLowerCase();
      const name = (activity.name || '').toLowerCase();
      const subtype = (activity.subtype || '').toLowerCase();

      const isTrail = type.includes('trail') || subtype.includes('trail') || name.includes('越野');
      const isRoadRun =
        (type === 'run' ||
          type === 'running' ||
          type === 'road_running' ||
          type === 'treadmill' ||
          name.includes('路跑') ||
          (name.includes('跑步') && !name.includes('越野'))) &&
        !isTrail;
      const isHike = type.includes('hike') || type.includes('walk') || name.includes('徒步') || name.includes('健走');
      const isRide = type.includes('ride') || type.includes('cycling') || type.includes('biking') || name.includes('骑行');
      const isSki = type.includes('ski') || type.includes('snowboard') || name.includes('滑雪');
      const isSwim = type.includes('swim') || type.includes('paddle') || type.includes('rowing') || name.includes('游泳');
      const isFitness = isFitnessActivity(activity);

      // 核心需求：“如果有轨迹就加进去” —— 无论室外野攀、越野跑、路跑、徒步还是骑行，只要有轨迹即加入真实轨迹！
      if (activity.summary_polyline) {
        const pts = polyline.decode(activity.summary_polyline);
        if (pts.length >= 2) {
          items.push({
            id: activity.run_id || idx,
            name: activity.name || (climbCat === 'outdoor_climbing' ? '室外攀岩轨迹' : isFitness ? '健身轨迹' : '运动轨迹'),
            date: activity.start_date_local,
            distance: activity.distance,
            duration: activity.moving_time,
            heartrate: activity.average_heartrate,
            elevation: activity.elevation_gain || activity.total_elevation_gain,
            type: activity.type,
            subtype: activity.subtype,
            category: 'gps_track',
            climbCategory: climbCat,
            isTrail,
            isRoadRun,
            isHike,
            isRide,
            isSki,
            isSwim,
            isFitness,
            rawPoints: pts,
            color: getActivityColor(activity.type, activity.name, activity.subtype),
          });
          return;
        }
      }

      // 室内健身打卡记录
      if (isFitness) {
        items.push({
          id: activity.run_id || idx,
          name: activity.name || '室内健身训练',
          date: activity.start_date_local,
          distance: activity.distance,
          duration: activity.moving_time,
          heartrate: activity.average_heartrate,
          elevation: activity.elevation_gain || activity.total_elevation_gain,
          type: 'fitness',
          category: 'fitness',
          isFitness: true,
          isManual: true,
          color: '#ccff00',
        });
        return;
      }

      // 无 GPS 轨迹的室内/打卡记录
      if (climbCat === 'indoor_bouldering') {
        items.push({
          id: activity.run_id || idx,
          name: activity.name || (isManual ? '室内抱石 (手动记录)' : '室内抱石'),
          date: activity.start_date_local,
          duration: activity.moving_time,
          heartrate: activity.average_heartrate,
          elevation: activity.elevation_gain || activity.total_elevation_gain,
          type: 'indoor_bouldering',
          category: 'indoor_bouldering',
          isManual,
          color: '#ffcc00',
        });
        return;
      }

      if (climbCat === 'indoor_climbing') {
        items.push({
          id: activity.run_id || idx,
          name: activity.name || (isManual ? '室内攀岩 (手动记录)' : '室内攀岩'),
          date: activity.start_date_local,
          duration: activity.moving_time,
          heartrate: activity.average_heartrate,
          elevation: activity.elevation_gain || activity.total_elevation_gain,
          type: 'indoor_climbing',
          category: 'indoor_climbing',
          isManual,
          color: '#ff6a00',
        });
        return;
      }

      if (climbCat === 'outdoor_climbing') {
        items.push({
          id: activity.run_id || idx,
          name: activity.name || (isManual ? '室外野攀 (手动打卡)' : '室外野攀'),
          date: activity.start_date_local,
          distance: activity.distance,
          duration: activity.moving_time,
          heartrate: activity.average_heartrate,
          elevation: activity.elevation_gain || activity.total_elevation_gain,
          type: 'outdoor_climbing',
          category: 'outdoor_climbing',
          isManual,
          color: '#00e5ff',
        });
        return;
      }

      // 其他无 GPS 的运动记录（如室内跑步机等）
      items.push({
        id: activity.run_id || idx,
        name: activity.name || '室内运动',
        date: activity.start_date_local,
        distance: activity.distance,
        duration: activity.moving_time,
        heartrate: activity.average_heartrate,
        elevation: activity.elevation_gain || activity.total_elevation_gain,
        type: activity.type,
        subtype: activity.subtype,
        category: 'indoor_workout',
        isManual: true,
        color: getActivityColor(activity.type, activity.name, activity.subtype),
      });
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
        startPt: finalPtsTrans[0],
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

            {/* 2. 轨迹线与攀岩/运动节点 */}
            {layout.items.map((item, i) => {
              // 1. 常规独立 GPS 轨迹线（路跑、越野跑、室外野攀、徒步、骑行等）
              if (item.category === 'gps_track') {
                return (
                  <g key={`gps-group-${item.id}-${i}`}>
                    <polyline
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
                    {/* 如果是室外野攀轨迹，在起点位置叠加攀登小人图标 */}
                    {item.climbCategory === 'outdoor_climbing' && item.startPt && (
                      <g
                        transform={`translate(${item.startPt.x}, ${item.startPt.y}) scale(0.85)`}
                        className="pointer-events-auto climb-pebble-node"
                        onMouseEnter={() => setHoveredItem(item)}
                      >
                        <g filter="url(#glow)">
                          <path
                            d={ROCK_CLIMBING_ICON_PATH}
                            fill="#00e5ff"
                          />
                        </g>
                      </g>
                    )}
                    {/* 如果是健身轨迹，在起点位置叠加力量举小人图标 */}
                    {item.isFitness && item.startPt && (
                      <g
                        transform={`translate(${item.startPt.x}, ${item.startPt.y}) scale(0.85)`}
                        className="pointer-events-auto climb-pebble-node"
                        onMouseEnter={() => setHoveredItem(item)}
                      >
                        <g filter="url(#glow)">
                          <path
                            d={FITNESS_ICON_PATH}
                            fill="#ccff00"
                          />
                        </g>
                      </g>
                    )}
                  </g>
                );
              }

              // 2. 攀岩活动统一小人节点（采用 Noun Project Rock Climbing 1991938 标志性岩壁攀登者图标）
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
                    {/* 手动打卡外圈虚线星环光晕 */}
                    {item.isManual && (
                      <circle
                        cx="0"
                        cy="0"
                        r={13.5}
                        fill="none"
                        stroke={item.color}
                        strokeWidth={1}
                        strokeDasharray="2.5 3"
                        opacity={0.65}
                      />
                    )}
                    <g className="pebble-body" filter="url(#glow)">
                      <path
                        d={ROCK_CLIMBING_ICON_PATH}
                        fill={item.color}
                      />
                    </g>
                  </g>
                );
              }

              // 3. 室内健身专属小人节点（力量举/健身小人矢量图标）
              if (item.category === 'fitness' || item.isFitness) {
                return (
                  <g
                    key={`fitness-figure-${item.id}-${i}`}
                    transform={`translate(${item.x}, ${item.y}) rotate(${item.rotation || 0})`}
                    className="pointer-events-auto climb-pebble-node group cursor-pointer transition-transform duration-300"
                    onMouseEnter={() => setHoveredItem(item)}
                  >
                    {/* 呼吸外环星环光晕 */}
                    <circle
                      cx="0"
                      cy="0"
                      r={13.5}
                      fill="none"
                      stroke={item.color}
                      strokeWidth={1}
                      strokeDasharray="2.5 3"
                      opacity={0.7}
                    />
                    <g className="pebble-body" filter="url(#glow)">
                      <path
                        d={FITNESS_ICON_PATH}
                        fill={item.color}
                      />
                    </g>
                  </g>
                );
              }

              // 4. 其他室内无 GPS 活动节点（例如跑步机、室内器械）
              if (item.category === 'indoor_workout') {
                return (
                  <g
                    key={`workout-dot-${item.id}-${i}`}
                    transform={`translate(${item.x}, ${item.y})`}
                    className="pointer-events-auto climb-pebble-node"
                    onMouseEnter={() => setHoveredItem(item)}
                  >
                    <circle
                      cx="0"
                      cy="0"
                      r={6}
                      fill={item.color}
                      filter="url(#glow)"
                      opacity={0.9}
                    />
                    <circle
                      cx="0"
                      cy="0"
                      r={10}
                      fill="none"
                      stroke={item.color}
                      strokeWidth={1}
                      strokeDasharray="2 2"
                      opacity={0.4}
                    />
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
                  {hoveredItem.climbCategory === 'outdoor_climbing'
                    ? (hoveredItem.rawPoints ? '🧗‍♀️ 室外野攀 · GPS 轨迹' : (hoveredItem.isManual ? '🧗‍♀️ 室外野攀 · 手动打卡' : '🧗‍♀️ 室外野攀'))
                    : hoveredItem.category === 'indoor_bouldering'
                    ? (hoveredItem.isManual ? '🧗‍♂️ 室内抱石 · 手动打卡' : '🧗‍♂️ 室内抱石')
                    : hoveredItem.category === 'indoor_climbing'
                    ? (hoveredItem.isManual ? '🧗 室内高壁 · 手动打卡' : '🧗 室内高壁攀岩')
                    : hoveredItem.category === 'fitness' || hoveredItem.isFitness
                    ? (hoveredItem.rawPoints ? '🏋️ 健身训练 · GPS 轨迹' : '🏋️ 室内健身 · 训练打卡')
                    : hoveredItem.isTrail
                    ? '🏔️ 越野跑轨迹'
                    : hoveredItem.isRoadRun
                    ? '🏃‍♂️ 路跑轨迹'
                    : hoveredItem.isHike
                    ? '🥾 徒步轨迹'
                    : hoveredItem.isRide
                    ? '🚴 骑行轨迹'
                    : hoveredItem.isSki
                    ? '⛷️ 滑雪轨迹'
                    : hoveredItem.isSwim
                    ? '🏊 游泳水上轨迹'
                    : hoveredItem.category === 'indoor_workout'
                    ? '⚡ 室内运动'
                    : '🏃 运动轨迹'}
                </span>
                <span className="text-[11px] font-mono text-gray-400">
                  {hoveredItem.date ? hoveredItem.date.split(' ')[0] : ''}
                </span>
              </div>

              <div className="font-bold text-sm text-gray-100 mb-2 truncate">
                {hoveredItem.name}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                {hoveredItem.isManual ? (
                  <div className="col-span-2 py-1 px-2 rounded-lg bg-white/5 border border-white/10 flex items-center justify-between text-gray-300">
                    <span className="text-[10px] text-gray-400">记录属性</span>
                    <span className="text-[11px] font-semibold text-lime-300">
                      📍 室内打卡训练
                    </span>
                  </div>
                ) : (
                  <>
                    {hoveredItem.distance > 0 && (
                      <div>
                        <span className="text-gray-500 block text-[10px]">距离</span>
                        <span className="font-bold text-white">
                          {(hoveredItem.distance / 1000).toFixed(2)} km
                        </span>
                      </div>
                    )}
                    {hoveredItem.duration && hoveredItem.duration !== '0:00:00' && (
                      <div>
                        <span className="text-gray-500 block text-[10px]">时长</span>
                        <span className="font-bold text-white">
                          {formatTime(hoveredItem.duration)}
                        </span>
                      </div>
                    )}
                  </>
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

        {/* 左下角图例 HUD (Legend) */}
        <div className="absolute bottom-8 left-8 z-40 hidden sm:flex flex-wrap items-center gap-3.5 px-4 py-2.5 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 shadow-2xl pointer-events-none select-none text-[11px] font-mono text-gray-300">
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 rounded-full bg-[#ff3131] inline-block shadow-[0_0_8px_#ff3131]" />
            <span>路跑</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 rounded-full bg-[#39ff14] inline-block shadow-[0_0_8px_#39ff14]" />
            <span>越野跑</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 rounded-full bg-[#ff9100] inline-block shadow-[0_0_8px_#ff9100]" />
            <span>徒步</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3.5 h-1 rounded-full bg-[#ff00ff] inline-block shadow-[0_0_8px_#ff00ff]" />
            <span>骑行</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ccff00] inline-block shadow-[0_0_8px_#ccff00]" />
            <span>室内健身</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00e5ff] inline-block shadow-[0_0_8px_#00e5ff]" />
            <span>室外野攀</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ff6a00] inline-block shadow-[0_0_8px_#ff6a00]" />
            <span>室内攀岩</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-[#ffcc00] inline-block shadow-[0_0_8px_#ffcc00]" />
            <span>室内抱石</span>
          </div>
        </div>

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