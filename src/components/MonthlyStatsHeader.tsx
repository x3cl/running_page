import React, { useMemo } from 'react';

interface MonthlyStatsHeaderProps {
  year: number;
  month: number;
  activities: any[];
}

export const MonthlyStatsHeader: React.FC<MonthlyStatsHeaderProps> = ({
  year,
  month,
  activities,
}) => {
  // 解析时长字符串或秒数
  const parseSeconds = (duration: any): number => {
    if (!duration) return 0;
    if (typeof duration === 'number') return duration;
    if (typeof duration === 'string') {
      const parts = duration.split(':');
      if (parts.length === 3) {
        const hours = parseFloat(parts[0]) || 0;
        const mins = parseFloat(parts[1]) || 0;
        const secs = parseFloat(parts[2]) || 0;
        return hours * 3600 + mins * 60 + secs;
      } else if (parts.length === 2) {
        const mins = parseFloat(parts[0]) || 0;
        const secs = parseFloat(parts[1]) || 0;
        return mins * 60 + secs;
      }
    }
    return 0;
  };

  const formatHours = (totalSecs: number): string => {
    const hours = Math.floor(totalSecs / 3600);
    const mins = Math.floor((totalSecs % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const stats = useMemo(() => {
    let totalDistMeters = 0;
    let totalElevation = 0;
    let totalSecs = 0;

    let runCount = 0;
    let runDistMeters = 0;

    let rideCount = 0;
    let rideDistMeters = 0;

    let hikeCount = 0;
    let hikeDistMeters = 0;

    let indoorClimbCount = 0;
    let indoorClimbSecs = 0;

    let boulderingCount = 0;
    let boulderingSecs = 0;

    let outdoorClimbCount = 0;
    let outdoorClimbElevation = 0;
    let outdoorClimbSecs = 0;

    activities.forEach((act) => {
      const dist = act.distance || 0;
      const elev = act.total_elevation_gain || act.elevation_gain || 0;
      const secs = parseSeconds(act.moving_time);
      const name = (act.name || '').toLowerCase();
      const type = (act.type || '').toLowerCase();

      totalDistMeters += dist;
      totalElevation += elev;
      totalSecs += secs;

      // 区分三大攀岩运动
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
        boulderingCount++;
        boulderingSecs += secs;
      } else if (isIndoorClimb) {
        indoorClimbCount++;
        indoorClimbSecs += secs;
      } else if (isOutdoorClimb) {
        outdoorClimbCount++;
        outdoorClimbElevation += elev;
        outdoorClimbSecs += secs;
      } else if (type.includes('ride') || type.includes('cycling')) {
        rideCount++;
        rideDistMeters += dist;
      } else if (type.includes('hike') || type.includes('walk')) {
        hikeCount++;
        hikeDistMeters += dist;
      } else {
        // 跑步、越野跑、滑雪等
        runCount++;
        runDistMeters += dist;
      }
    });

    return {
      totalDistanceKm: (totalDistMeters / 1000).toFixed(1),
      totalElevationM: Math.round(totalElevation),
      totalDurationStr: formatHours(totalSecs),
      totalActivities: activities.length,
      runCount,
      runDistanceKm: (runDistMeters / 1000).toFixed(1),
      rideCount,
      rideDistanceKm: (rideDistMeters / 1000).toFixed(1),
      hikeCount,
      hikeDistanceKm: (hikeDistMeters / 1000).toFixed(1),
      indoorClimbCount,
      indoorClimbTimeStr: formatHours(indoorClimbSecs),
      boulderingCount,
      boulderingTimeStr: formatHours(boulderingSecs),
      outdoorClimbCount,
      outdoorClimbElevationM: Math.round(outdoorClimbElevation),
      outdoorClimbTimeStr: formatHours(outdoorClimbSecs),
    };
  }, [activities]);

  const monthStr = month < 10 ? `0${month}` : `${month}`;

  return (
    <div className="w-full mb-8">
      {/* 顶部标题与核心数据汇总 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 border-b border-white/10 pb-6 gap-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-red-600/20 border border-red-500/40 text-red-400 font-mono text-xs uppercase tracking-widest rounded-full font-bold">
              Monthly Scope
            </span>
            <span className="text-gray-400 font-mono text-xs tracking-widest uppercase">
              Organic Tangency Trace Network
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black italic text-white tracking-tighter uppercase leading-none">
            {year}.{monthStr} <span className="text-red-600 font-outline-2">SUMMARY</span>
          </h2>
        </div>

        {/* 四项总核心指标卡 */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 md:gap-8 w-full lg:w-auto">
          <div className="text-left lg:text-center group">
            <div className="text-white text-4xl sm:text-5xl font-black font-mono leading-none tracking-tight">
              {stats.totalActivities}
            </div>
            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-2 flex items-center lg:justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white/60 inline-block" />
              总运动次数
            </div>
          </div>

          <div className="text-left lg:text-center group">
            <div className="text-white text-4xl sm:text-5xl font-black font-mono leading-none tracking-tight">
              {stats.totalDistanceKm}
            </div>
            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-2 flex items-center lg:justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
              总里程 (KM)
            </div>
          </div>

          <div className="text-left lg:text-center group">
            <div className="text-[#2ecc71] text-4xl sm:text-5xl font-black font-mono leading-none tracking-tight">
              {stats.totalElevationM}
            </div>
            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-2 flex items-center lg:justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#2ecc71] inline-block" />
              累计爬升 (m)
            </div>
          </div>

          <div className="text-left lg:text-center group">
            <div className="text-[#00ffff] text-4xl sm:text-5xl font-black font-mono leading-none tracking-tight">
              {stats.totalDurationStr}
            </div>
            <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-2 flex items-center lg:justify-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-[#00ffff] inline-block" />
              总有效时长
            </div>
          </div>
        </div>
      </div>

      {/* 运动分类统计胶囊标签栏（重点突出室内攀岩、抱石与室外野攀） */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2">
        {stats.runCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-gray-200 flex items-center space-x-2">
            <span className="text-red-400 font-bold">🏃 跑步/越野</span>
            <span className="text-white font-bold">{stats.runCount} 次</span>
            <span className="text-gray-400 text-[10px]">({stats.runDistanceKm} km)</span>
          </div>
        )}

        {/* 重点特色：室内抱石专属标签 */}
        {stats.boulderingCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-yellow-500/15 border border-yellow-400/50 text-xs font-mono text-yellow-200 flex items-center space-x-2 shadow-lg shadow-yellow-500/10">
            <span className="text-yellow-400 font-black flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              🧗‍♂️ 室内抱石
            </span>
            <span className="text-white font-black">{stats.boulderingCount} 次</span>
            <span className="text-yellow-300/80 text-[10px]">({stats.boulderingTimeStr})</span>
          </div>
        )}

        {/* 重点特色：室内高壁攀岩专属标签 */}
        {stats.indoorClimbCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-orange-500/15 border border-orange-400/50 text-xs font-mono text-orange-200 flex items-center space-x-2 shadow-lg shadow-orange-500/10">
            <span className="text-orange-400 font-black flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              🧗 室内攀岩
            </span>
            <span className="text-white font-black">{stats.indoorClimbCount} 次</span>
            <span className="text-orange-300/80 text-[10px]">({stats.indoorClimbTimeStr})</span>
          </div>
        )}

        {/* 重点特色：室外野攀 Topo 专属标签 */}
        {stats.outdoorClimbCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/50 text-xs font-mono text-cyan-200 flex items-center space-x-2 shadow-lg shadow-cyan-500/10">
            <span className="text-cyan-400 font-black flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              🧗‍♀️ 室外野攀 (Topo)
            </span>
            <span className="text-white font-black">{stats.outdoorClimbCount} 次</span>
            <span className="text-cyan-300/80 text-[10px]">
              ({stats.outdoorClimbElevationM > 0 ? `+${stats.outdoorClimbElevationM}m, ` : ''}{stats.outdoorClimbTimeStr})
            </span>
          </div>
        )}

        {stats.rideCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs font-mono text-gray-200 flex items-center space-x-2">
            <span className="text-purple-400 font-bold">🚴 骑行</span>
            <span className="text-white font-bold">{stats.rideCount} 次</span>
            <span className="text-gray-400 text-[10px]">({stats.rideDistanceKm} km)</span>
          </div>
        )}

        {stats.hikeCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs font-mono text-gray-200 flex items-center space-x-2">
            <span className="text-emerald-400 font-bold">🥾 徒步</span>
            <span className="text-white font-bold">{stats.hikeCount} 次</span>
            <span className="text-gray-400 text-[10px]">({stats.hikeDistanceKm} km)</span>
          </div>
        )}
      </div>
    </div>
  );
};
export default MonthlyStatsHeader;
