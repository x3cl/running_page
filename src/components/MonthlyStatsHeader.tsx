import React, { useMemo } from 'react';
import { getClimbCategory, isManualClimbRecord, isFitnessActivity } from '@/utils/utils';

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

    // 1. 路跑 (Road Running)
    let roadRunCount = 0;
    let roadRunDistMeters = 0;
    let roadRunElev = 0;
    let roadRunSecs = 0;

    // 2. 越野跑 (Trail Running)
    let trailRunCount = 0;
    let trailRunDistMeters = 0;
    let trailRunElev = 0;
    let trailRunSecs = 0;

    // 3. 徒步健走 (Hiking / Walking)
    let hikeCount = 0;
    let hikeDistMeters = 0;
    let hikeElev = 0;
    let hikeSecs = 0;

    // 4. 骑行运动 (Cycling)
    let rideCount = 0;
    let rideDistMeters = 0;
    let rideElev = 0;
    let rideSecs = 0;

    // 5. 室内高壁攀岩 (Indoor Climbing)
    let indoorClimbCount = 0;
    let indoorClimbSecs = 0;

    // 6. 室内抱石 (Indoor Bouldering)
    let boulderingCount = 0;
    let boulderingSecs = 0;

    // 7. 室外野攀 (Outdoor Climbing)
    let outdoorClimbCount = 0;
    let manualOutdoorClimbCount = 0;
    let outdoorClimbElevation = 0;
    let outdoorClimbDistMeters = 0;
    let outdoorClimbSecs = 0;

    // 8. 滑雪 (Skiing)
    let skiCount = 0;
    let skiDistMeters = 0;
    let skiElev = 0;
    let skiSecs = 0;

    // 9. 游泳/水上 (Swimming / Water Sports)
    let swimCount = 0;
    let swimDistMeters = 0;
    let swimSecs = 0;

    // 10. 室内健身 (Fitness / Strength Training)
    let fitnessCount = 0;
    let fitnessDistMeters = 0;
    let fitnessSecs = 0;

    // 11. 其他运动 (Other)
    let otherCount = 0;
    let otherDistMeters = 0;
    let otherSecs = 0;

    activities.forEach((act) => {
      const dist = act.distance || 0;
      const elev = act.total_elevation_gain || act.elevation_gain || 0;
      const secs = parseSeconds(act.moving_time);
      const name = (act.name || '').toLowerCase();
      const type = (act.type || '').toLowerCase();
      const subtype = (act.subtype || '').toLowerCase();
      const climbCat = getClimbCategory(act);
      const isManual = climbCat ? isManualClimbRecord(act) : false;

      totalDistMeters += dist;
      totalElevation += elev;
      totalSecs += secs;

      // 区分三大攀岩运动与常规运动
      if (climbCat === 'indoor_bouldering') {
        boulderingCount++;
        boulderingSecs += secs;
      } else if (climbCat === 'indoor_climbing') {
        indoorClimbCount++;
        indoorClimbSecs += secs;
      } else if (climbCat === 'outdoor_climbing') {
        outdoorClimbCount++;
        if (isManual) {
          manualOutdoorClimbCount++;
        }
        outdoorClimbElevation += elev;
        outdoorClimbDistMeters += dist;
        outdoorClimbSecs += secs;
      } else if (
        type.includes('trail') ||
        subtype.includes('trail') ||
        name.includes('越野')
      ) {
        // 越野跑 (Trail Running)
        trailRunCount++;
        trailRunDistMeters += dist;
        trailRunElev += elev;
        trailRunSecs += secs;
      } else if (
        type === 'run' ||
        type === 'running' ||
        type === 'road_running' ||
        type === 'treadmill' ||
        name.includes('路跑') ||
        (name.includes('跑步') && !name.includes('越野'))
      ) {
        // 路跑 (Road Running)
        roadRunCount++;
        roadRunDistMeters += dist;
        roadRunElev += elev;
        roadRunSecs += secs;
      } else if (
        type.includes('hike') ||
        type.includes('walk') ||
        name.includes('徒步') ||
        name.includes('健走')
      ) {
        // 徒步 / 健走 (Hiking / Walking)
        hikeCount++;
        hikeDistMeters += dist;
        hikeElev += elev;
        hikeSecs += secs;
      } else if (
        type.includes('ride') ||
        type.includes('cycling') ||
        type.includes('biking') ||
        name.includes('骑行')
      ) {
        // 骑行 (Cycling)
        rideCount++;
        rideDistMeters += dist;
        rideElev += elev;
        rideSecs += secs;
      } else if (
        type.includes('ski') ||
        type.includes('snowboard') ||
        name.includes('滑雪')
      ) {
        // 滑雪 (Skiing)
        skiCount++;
        skiDistMeters += dist;
        skiElev += elev;
        skiSecs += secs;
      } else if (
        type.includes('swim') ||
        type.includes('paddle') ||
        type.includes('rowing') ||
        name.includes('游泳') ||
        name.includes('水上')
      ) {
        // 游泳 / 水上运动 (Swimming)
        swimCount++;
        swimDistMeters += dist;
        swimSecs += secs;
      } else if (isFitnessActivity(act)) {
        // 室内健身 / 力量训练 (Fitness / Strength Training)
        fitnessCount++;
        fitnessDistMeters += dist;
        fitnessSecs += secs;
      } else {
        // 其他活动 (Other Sports)
        otherCount++;
        otherDistMeters += dist;
        otherSecs += secs;
      }
    });

    return {
      totalDistanceKm: (totalDistMeters / 1000).toFixed(1),
      totalElevationM: Math.round(totalElevation),
      totalDurationStr: formatHours(totalSecs),
      totalActivities: activities.length,
      // 1. 路跑
      roadRunCount,
      roadRunDistanceKm: (roadRunDistMeters / 1000).toFixed(1),
      roadRunElevationM: Math.round(roadRunElev),
      roadRunTimeStr: formatHours(roadRunSecs),
      // 2. 越野跑
      trailRunCount,
      trailRunDistanceKm: (trailRunDistMeters / 1000).toFixed(1),
      trailRunElevationM: Math.round(trailRunElev),
      trailRunTimeStr: formatHours(trailRunSecs),
      // 3. 徒步
      hikeCount,
      hikeDistanceKm: (hikeDistMeters / 1000).toFixed(1),
      hikeElevationM: Math.round(hikeElev),
      hikeTimeStr: formatHours(hikeSecs),
      // 4. 骑行
      rideCount,
      rideDistanceKm: (rideDistMeters / 1000).toFixed(1),
      rideElevationM: Math.round(rideElev),
      rideTimeStr: formatHours(rideSecs),
      // 5. 室内高壁
      indoorClimbCount,
      indoorClimbTimeStr: formatHours(indoorClimbSecs),
      // 6. 室内抱石
      boulderingCount,
      boulderingTimeStr: formatHours(boulderingSecs),
      // 7. 室外野攀
      outdoorClimbCount,
      manualOutdoorClimbCount,
      outdoorClimbDistanceKm: (outdoorClimbDistMeters / 1000).toFixed(1),
      outdoorClimbElevationM: Math.round(outdoorClimbElevation),
      outdoorClimbSecs,
      outdoorClimbTimeStr: formatHours(outdoorClimbSecs),
      // 8. 滑雪
      skiCount,
      skiDistanceKm: (skiDistMeters / 1000).toFixed(1),
      skiElevationM: Math.round(skiElev),
      skiTimeStr: formatHours(skiSecs),
      // 9. 游泳/水上
      swimCount,
      swimDistanceKm: (swimDistMeters / 1000).toFixed(1),
      swimTimeStr: formatHours(swimSecs),
      // 10. 室内健身
      fitnessCount,
      fitnessDistanceKm: (fitnessDistMeters / 1000).toFixed(1),
      fitnessTimeStr: formatHours(fitnessSecs),
      // 11. 其他
      otherCount,
      otherDistanceKm: (otherDistMeters / 1000).toFixed(1),
      otherTimeStr: formatHours(otherSecs),
    };
  }, [activities]);

  const isAnnual = month === 0;
  const monthStr = month < 10 ? `0${month}` : `${month}`;
  const displayTitle = isAnnual ? `${year} 全年` : `${year}.${monthStr}`;
  const scopeBadge = isAnnual ? 'Annual Scope' : 'Monthly Scope';

  return (
    <div className="w-full mb-8">
      {/* 顶部标题与核心数据汇总 */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end mb-8 border-b border-white/10 pb-6 gap-6 relative z-10">
        <div className="space-y-2">
          <div className="flex items-center space-x-3">
            <span className="px-3 py-1 bg-red-600/20 border border-red-500/40 text-red-400 font-mono text-xs uppercase tracking-widest rounded-full font-bold">
              {scopeBadge}
            </span>
            <span className="text-gray-400 font-mono text-xs tracking-widest uppercase">
              Organic Tangency Trace Network
            </span>
          </div>
          <h2 className="text-5xl md:text-6xl font-black italic text-white tracking-tighter uppercase leading-none">
            {displayTitle} <span className="text-red-600 font-outline-2">SUMMARY</span>
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

      {/* 运动分类统计胶囊标签栏（路跑与越野跑分开，独立展示徒步、野攀、高壁、抱石、骑行等全部项目） */}
      <div className="flex flex-wrap items-center gap-2.5 pt-2">
        {/* 1. 🏃‍♂️ 路跑 */}
        {stats.roadRunCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-red-500/10 border border-red-500/30 text-xs font-mono text-gray-200 flex items-center space-x-2">
            <span className="text-red-400 font-bold flex items-center gap-1">
              🏃‍♂️ 路跑
            </span>
            <span className="text-white font-bold">{stats.roadRunCount} 次</span>
            <span className="text-gray-400 text-[10px]">
              ({stats.roadRunDistanceKm} km{stats.roadRunElevationM > 0 ? `, +${stats.roadRunElevationM}m` : ''})
            </span>
          </div>
        )}

        {/* 2. 🏔️ 越野跑 */}
        {stats.trailRunCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-[#39ff14]/10 border border-[#39ff14]/30 text-xs font-mono text-gray-200 flex items-center space-x-2 shadow-lg shadow-[#39ff14]/5">
            <span className="text-[#39ff14] font-bold flex items-center gap-1">
              🏔️ 越野跑
            </span>
            <span className="text-white font-bold">{stats.trailRunCount} 次</span>
            <span className="text-emerald-400/90 text-[10px]">
              ({stats.trailRunDistanceKm} km, +{stats.trailRunElevationM}m)
            </span>
          </div>
        )}

        {/* 3. 🧗‍♂️ 室内抱石专属标签 */}
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

        {/* 4. 🧗 室内高壁攀岩专属标签 */}
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

        {/* 5. 🧗‍♀️ 室外野攀 Topo 专属标签 */}
        {stats.outdoorClimbCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-cyan-500/15 border border-cyan-400/50 text-xs font-mono text-cyan-200 flex items-center space-x-2 shadow-lg shadow-cyan-500/10">
            <span className="text-cyan-400 font-black flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              🧗‍♀️ 室外野攀
            </span>
            <span className="text-white font-black">{stats.outdoorClimbCount} 次</span>
            <span className="text-cyan-300/80 text-[10px]">
              (
              {stats.outdoorClimbElevationM > 0 ? `+${stats.outdoorClimbElevationM}m, ` : ''}
              {stats.outdoorClimbSecs > 0
                ? stats.manualOutdoorClimbCount > 0
                  ? `${stats.outdoorClimbTimeStr} + ${stats.manualOutdoorClimbCount}次打卡`
                  : stats.outdoorClimbTimeStr
                : `${stats.manualOutdoorClimbCount} 次手动打卡`}
              )
            </span>
          </div>
        )}

        {/* 6. 🥾 徒步健走 */}
        {stats.hikeCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs font-mono text-gray-200 flex items-center space-x-2">
            <span className="text-amber-400 font-bold flex items-center gap-1">
              🥾 徒步
            </span>
            <span className="text-white font-bold">{stats.hikeCount} 次</span>
            <span className="text-amber-300/80 text-[10px]">
              ({stats.hikeDistanceKm} km{stats.hikeElevationM > 0 ? `, +${stats.hikeElevationM}m` : ''})
            </span>
          </div>
        )}

        {/* 7. 🚴 骑行 */}
        {stats.rideCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-purple-500/10 border border-purple-500/30 text-xs font-mono text-gray-200 flex items-center space-x-2">
            <span className="text-purple-400 font-bold flex items-center gap-1">
              🚴 骑行
            </span>
            <span className="text-white font-bold">{stats.rideCount} 次</span>
            <span className="text-gray-400 text-[10px]">
              ({stats.rideDistanceKm} km{stats.rideElevationM > 0 ? `, +${stats.rideElevationM}m` : ''})
            </span>
          </div>
        )}

        {/* 8. ⛷️ 滑雪 */}
        {stats.skiCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-sky-500/10 border border-sky-400/30 text-xs font-mono text-gray-200 flex items-center space-x-2">
            <span className="text-sky-400 font-bold flex items-center gap-1">
              ⛷️ 滑雪
            </span>
            <span className="text-white font-bold">{stats.skiCount} 次</span>
            <span className="text-sky-300/80 text-[10px]">
              ({stats.skiDistanceKm} km{stats.skiElevationM > 0 ? `, +${stats.skiElevationM}m` : ''})
            </span>
          </div>
        )}

        {/* 9. 🏊 水上/游泳 */}
        {stats.swimCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-indigo-500/10 border border-indigo-400/30 text-xs font-mono text-gray-200 flex items-center space-x-2">
            <span className="text-indigo-400 font-bold flex items-center gap-1">
              🏊 水上/游泳
            </span>
            <span className="text-white font-bold">{stats.swimCount} 次</span>
            <span className="text-indigo-300/80 text-[10px]">
              ({parseFloat(stats.swimDistanceKm) > 0 ? `${stats.swimDistanceKm} km` : stats.swimTimeStr})
            </span>
          </div>
        )}

        {/* 10. 🏋️ 室内健身 */}
        {stats.fitnessCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-lime-500/15 border border-lime-400/50 text-xs font-mono text-lime-200 flex items-center space-x-2 shadow-lg shadow-lime-500/10">
            <span className="text-lime-400 font-black flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-lime-400 animate-pulse" />
              🏋️ 室内健身
            </span>
            <span className="text-white font-black">{stats.fitnessCount} 次</span>
            <span className="text-lime-300/80 text-[10px]">({stats.fitnessTimeStr})</span>
          </div>
        )}

        {/* 11. ⚡ 其他小项目 */}
        {stats.otherCount > 0 && (
          <div className="px-3.5 py-1.5 rounded-xl bg-gray-500/10 border border-gray-500/30 text-xs font-mono text-gray-200 flex items-center space-x-2">
            <span className="text-gray-400 font-bold flex items-center gap-1">
              ⚡ 其他活动
            </span>
            <span className="text-white font-bold">{stats.otherCount} 次</span>
            <span className="text-gray-400 text-[10px]">
              ({parseFloat(stats.otherDistanceKm) > 0 ? `${stats.otherDistanceKm} km` : stats.otherTimeStr})
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
export default MonthlyStatsHeader;
