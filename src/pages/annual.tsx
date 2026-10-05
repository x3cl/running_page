import { useEffect, useState, useMemo, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Helmet } from 'react-helmet-async';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import RunTable from '@/components/RunTable';
import { TrackWall } from '@/components/TrackWall';
import { MonthlyStatsHeader } from '@/components/MonthlyStatsHeader';
import { ViewSwitcher } from '@/components/ViewSwitcher';
import useActivities from '@/hooks/useActivities';
import useSiteMetadata from '@/hooks/useSiteMetadata';
import {
  Activity,
  filterAndSortRuns,
  sortDateFunc,
  titleForShow,
  RunIds,
  getClimbCategory,
  isFitnessActivity,
} from '@/utils/utils';
import { useTheme } from '@/hooks/useTheme';

type SportFilter = 'all' | 'run' | 'trail' | 'climb' | 'hike' | 'ride' | 'fitness' | 'other';

const parseActivitySecs = (duration: any): number => {
  if (!duration) return 0;
  if (typeof duration === 'number') return duration;
  if (typeof duration === 'string') {
    const parts = duration.split(':');
    if (parts.length === 3) {
      return (
        (parseFloat(parts[0]) || 0) * 3600 +
        (parseFloat(parts[1]) || 0) * 60 +
        (parseFloat(parts[2]) || 0)
      );
    } else if (parts.length === 2) {
      return (parseFloat(parts[0]) || 0) * 60 + (parseFloat(parts[1]) || 0);
    }
  }
  return 0;
};

const formatDuration = (totalSecs: number): string => {
  const hours = Math.floor(totalSecs / 3600);
  const mins = Math.floor((totalSecs % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${mins}m`;
  }
  return `${mins}m`;
};

const AnnualPage = () => {
  const { siteTitle, siteUrl } = useSiteMetadata();
  const { activities, years } = useActivities();
  const { theme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  // 从 URL 参数中读取年份，没有则默认使用最近年份
  const queryYear = searchParams.get('year');
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    if (queryYear) {
      const parsed = parseInt(queryYear, 10);
      if (!isNaN(parsed)) return parsed;
    }
    return new Date().getFullYear();
  });

  const [activeFilter, setActiveFilter] = useState<SportFilter>('all');
  const [runIndex, setRunIndex] = useState(-1);
  const [, setTitle] = useState('');

  // 保证年份有效，如果 activities 加载后当前年份无记录，则自动选用有数据的最新年份
  useEffect(() => {
    if (!activities.length) return;
    const hasData = activities.some((a) =>
      (a.start_date_local || '').startsWith(`${selectedYear}-`)
    );
    if (!hasData) {
      const latest = [...activities].sort(sortDateFunc)[0];
      if (latest && latest.start_date_local) {
        const y = parseInt(latest.start_date_local.substring(0, 4), 10);
        if (!isNaN(y)) {
          setSelectedYear(y);
          setSearchParams({ year: y.toString() }, { replace: true });
        }
      }
    }
  }, [activities, selectedYear, setSearchParams]);

  // 当外部 query 参数变更时同步
  useEffect(() => {
    if (queryYear) {
      const y = parseInt(queryYear, 10);
      if (!isNaN(y) && y !== selectedYear) {
        setSelectedYear(y);
      }
    }
  }, [queryYear, selectedYear]);

  const handleSelectYear = useCallback(
    (year: number) => {
      setSelectedYear(year);
      setSearchParams({ year: year.toString() }, { replace: true });
      setRunIndex(-1);
    },
    [setSearchParams]
  );

  const availableYearsList = useMemo(() => {
    const list = years
      .map((y) => parseInt(y, 10))
      .filter((y) => !isNaN(y))
      .sort((a, b) => b - a);
    return list.length ? list : [selectedYear];
  }, [years, selectedYear]);

  // 过滤出当年的全部活动
  const annualActivities = useMemo(() => {
    const yearPrefix = `${selectedYear}-`;
    return filterAndSortRuns(
      activities,
      yearPrefix,
      (run, prefix) => (run.start_date_local || '').startsWith(prefix),
      sortDateFunc
    );
  }, [activities, selectedYear]);

  // 12 个自然月的运动数据矩阵聚合
  const monthsData = useMemo(() => {
    const list = [];
    for (let m = 1; m <= 12; m++) {
      const mStr = m < 10 ? `0${m}` : `${m}`;
      const prefix = `${selectedYear}-${mStr}`;
      const acts = annualActivities.filter((a) =>
        (a.start_date_local || '').startsWith(prefix)
      );

      let totalDist = 0;
      let totalElev = 0;
      let totalSecs = 0;
      let runs = 0;
      let climbs = 0;
      let hikes = 0;
      let rides = 0;
      let fitness = 0;
      let others = 0;

      acts.forEach((act) => {
        totalDist += act.distance || 0;
        totalElev += act.elevation_gain || 0;
        totalSecs += parseActivitySecs(act.moving_time);

        const name = (act.name || '').toLowerCase();
        const type = (act.type || '').toLowerCase();
        const climbCat = getClimbCategory(act);

        if (climbCat) {
          climbs++;
        } else if (isFitnessActivity(act)) {
          fitness++;
        } else if (
          type.includes('hike') ||
          type.includes('hiking') ||
          type.includes('walk') ||
          name.includes('徒步') ||
          name.includes('健走')
        ) {
          hikes++;
        } else if (
          type.includes('ride') ||
          type.includes('cycling') ||
          type.includes('biking') ||
          name.includes('骑行')
        ) {
          rides++;
        } else if (
          type.includes('trail') ||
          type.includes('run') ||
          type.includes('running') ||
          name.includes('跑')
        ) {
          runs++;
        } else {
          others++;
        }
      });

      list.push({
        month: m,
        count: acts.length,
        distanceKm: totalDist / 1000,
        elevationM: Math.round(totalElev),
        durationSecs: totalSecs,
        sports: { runs, climbs, hikes, rides, fitness, others },
      });
    }
    return list;
  }, [annualActivities, selectedYear]);

  // 运动分类筛选
  const filterCounts = useMemo(() => {
    let run = 0;
    let trail = 0;
    let climb = 0;
    let hike = 0;
    let ride = 0;
    let fitness = 0;
    let other = 0;

    annualActivities.forEach((act) => {
      const name = (act.name || '').toLowerCase();
      const type = (act.type || '').toLowerCase();
      const subtype = (act.subtype || '').toLowerCase();
      const climbCat = getClimbCategory(act);

      if (climbCat) {
        climb++;
      } else if (isFitnessActivity(act)) {
        fitness++;
      } else if (
        type.includes('trail') ||
        subtype.includes('trail') ||
        name.includes('越野')
      ) {
        trail++;
      } else if (
        type.includes('hike') ||
        type.includes('hiking') ||
        type.includes('walk') ||
        name.includes('徒步') ||
        name.includes('健走')
      ) {
        hike++;
      } else if (
        type.includes('ride') ||
        type.includes('cycling') ||
        type.includes('biking') ||
        name.includes('骑行')
      ) {
        ride++;
      } else if (
        type.includes('run') ||
        type.includes('running') ||
        name.includes('路跑') ||
        name.includes('跑步')
      ) {
        run++;
      } else {
        other++;
      }
    });

    return {
      all: annualActivities.length,
      run,
      trail,
      climb,
      hike,
      ride,
      fitness,
      other,
    };
  }, [annualActivities]);

  const filteredActivities = useMemo(() => {
    if (activeFilter === 'all') return annualActivities;
    return annualActivities.filter((act) => {
      const name = (act.name || '').toLowerCase();
      const type = (act.type || '').toLowerCase();
      const subtype = (act.subtype || '').toLowerCase();
      const climbCat = getClimbCategory(act);

      if (activeFilter === 'climb') return climbCat !== null;
      if (activeFilter === 'fitness') return isFitnessActivity(act);
      if (activeFilter === 'trail') {
        return (
          !climbCat &&
          !isFitnessActivity(act) &&
          (type.includes('trail') || subtype.includes('trail') || name.includes('越野'))
        );
      }
      if (activeFilter === 'hike') {
        return (
          !climbCat &&
          !isFitnessActivity(act) &&
          (type.includes('hike') ||
            type.includes('hiking') ||
            type.includes('walk') ||
            name.includes('徒步') ||
            name.includes('健走'))
        );
      }
      if (activeFilter === 'ride') {
        return (
          !climbCat &&
          !isFitnessActivity(act) &&
          (type.includes('ride') ||
            type.includes('cycling') ||
            type.includes('biking') ||
            name.includes('骑行'))
        );
      }
      if (activeFilter === 'run') {
        return (
          !climbCat &&
          !isFitnessActivity(act) &&
          !type.includes('trail') &&
          !name.includes('越野') &&
          (type.includes('run') || type.includes('running') || name.includes('跑步') || name.includes('路跑'))
        );
      }
      if (activeFilter === 'other') {
        return (
          !climbCat &&
          !isFitnessActivity(act) &&
          !type.includes('run') &&
          !name.includes('跑') &&
          !type.includes('hike') &&
          !name.includes('徒步') &&
          !type.includes('ride') &&
          !name.includes('骑行')
        );
      }
      return true;
    });
  }, [annualActivities, activeFilter]);

  const locateActivity = useCallback(
    (runIds: RunIds) => {
      if (!runIds.length) return;
      const ids = new Set(runIds);
      const selected = filteredActivities.filter((r) => ids.has(r.run_id));
      if (!selected.length) return;
      const target = selected[0];
      setRunIndex(filteredActivities.findIndex((r) => r.run_id === target.run_id));
      setTitle(titleForShow(target));
    },
    [filteredActivities]
  );

  return (
    <Layout>
      <Helmet>
        <html lang="en" data-theme={theme} />
        <title>{`${selectedYear} 全年大盘 | ${siteTitle}`}</title>
      </Helmet>

      {/* 顶部主标题 + 导航切换器 */}
      <div className="w-full pt-4 mb-4">
        <div className="flex flex-col items-center space-y-2.5">
          <h1 className="text-2xl md:text-3xl font-black italic tracking-tighter uppercase border-b-4 border-amber-500 pb-1.5">
            <a href={siteUrl}>{siteTitle}</a>
          </h1>

          {/* 顶层视图切换：月度精选 vs 全年大盘 */}
          <ViewSwitcher
            currentView="annual"
            currentYear={selectedYear}
            currentMonth={1}
          />

          {/* 年份选择切换条 */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-1">
            {availableYearsList.map((y) => (
              <button
                key={y}
                onClick={() => handleSelectYear(y)}
                className={`px-4 py-1.5 rounded-full text-xs md:text-sm font-mono font-bold transition-all cursor-pointer ${
                  y === selectedYear
                    ? 'bg-gradient-to-r from-red-600 to-amber-600 text-white shadow-lg shadow-amber-500/30 scale-105 border border-amber-400/50'
                    : 'bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 border border-white/10'
                }`}
              >
                {y} 年
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 主展示区：全年总览看板 + 旋转星系轨迹墙 */}
      <div className="w-full mb-10" id="map-container">
        <div className="bg-[#0a0a0a] p-4 md:p-6 rounded-[2rem] shadow-2xl border border-white/5 overflow-hidden relative">
          {/* 全年数据大盘指标头 */}
          <MonthlyStatsHeader
            year={selectedYear}
            month={0}
            activities={annualActivities}
          />

          {/* 全年 12 个月度分布全景矩阵卡片 */}
          <div className="mb-6 mt-2 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3 px-1">
              <h3 className="text-sm md:text-base font-bold font-mono text-gray-300 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-amber-400 inline-block animate-pulse" />
                12 个月全景分布矩阵
                <span className="text-xs text-gray-500 font-normal">（点击任意月份可直接进入当月明细）</span>
              </h3>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
              {monthsData.map((m) => {
                const hasData = m.count > 0;
                return (
                  <div
                    key={m.month}
                    onClick={() => {
                      if (hasData) {
                        navigate(`/?year=${selectedYear}&month=${m.month}`);
                      }
                    }}
                    className={`rounded-2xl p-3 border transition-all flex flex-col justify-between ${
                      hasData
                        ? 'bg-white/[0.04] hover:bg-white/[0.09] border-white/10 hover:border-amber-500/50 cursor-pointer shadow-lg hover:scale-102 hover:shadow-amber-500/10'
                        : 'bg-white/[0.01] border-white/5 opacity-40 cursor-default'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-base font-black font-mono text-white">
                          {m.month < 10 ? `0${m.month}` : m.month}月
                        </span>
                        {hasData ? (
                          <span className="text-[10px] font-mono font-bold px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30">
                            {m.count} 次
                          </span>
                        ) : (
                          <span className="text-[10px] text-gray-600 font-mono">0</span>
                        )}
                      </div>

                      {hasData ? (
                        <div className="space-y-1 my-2">
                          <div className="text-sm font-mono font-bold text-gray-200">
                            {m.distanceKm > 0 ? `${m.distanceKm.toFixed(1)} km` : '-'}
                          </div>
                          <div className="text-[11px] font-mono text-gray-400 flex items-center justify-between">
                            <span>{m.durationSecs > 0 ? formatDuration(m.durationSecs) : '-'}</span>
                            {m.elevationM > 0 && (
                              <span className="text-emerald-400 font-bold">+{m.elevationM}m</span>
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="my-3 text-[11px] text-gray-600 font-mono italic">
                          暂无运动记录
                        </div>
                      )}
                    </div>

                    {hasData && (
                      <div className="pt-2 border-t border-white/5 flex items-center justify-between text-[11px] text-gray-400">
                        <div className="flex items-center space-x-1">
                          {m.sports.runs > 0 && <span title={`跑步 ${m.sports.runs} 次`}>🏃</span>}
                          {m.sports.climbs > 0 && <span title={`攀岩 ${m.sports.climbs} 次`}>🧗</span>}
                          {m.sports.fitness > 0 && <span title={`健身 ${m.sports.fitness} 次`}>🏋️</span>}
                          {m.sports.hikes > 0 && <span title={`徒步 ${m.sports.hikes} 次`}>🥾</span>}
                          {m.sports.rides > 0 && <span title={`骑行 ${m.sports.rides} 次`}>🚴</span>}
                        </div>
                        <span className="text-[10px] font-mono text-amber-400 group-hover:underline">
                          进入 →
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* 全年有机切线旋转星系网络 */}
          <div className="mt-4 pt-4 border-t border-white/10">
            <div className="flex items-center justify-between mb-3 px-1">
              <div>
                <h3 className="text-sm md:text-base font-bold font-mono text-white flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" />
                  {selectedYear} 全年轨迹有机星系网络
                </h3>
                <p className="text-xs text-gray-500 font-mono mt-0.5">
                  全量 GPS 轨迹与室内运动徽章自适应编织 · 支持滚轮缩放与鼠标拖拽
                </p>
              </div>
            </div>
            <TrackWall activities={annualActivities} />
          </div>
        </div>

        {/* 全年活动列表与分类过滤器 */}
        <div className="mt-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 px-2">
            <h3 className="text-xl font-bold font-mono text-white tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block animate-pulse" />
              {selectedYear}年 全年运动记录 ({filteredActivities.length} 项)
            </h3>

            {/* 运动分类筛选按钮胶囊 */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setActiveFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                  activeFilter === 'all'
                    ? 'bg-white text-black shadow-md'
                    : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                }`}
              >
                全部 ({filterCounts.all})
              </button>
              {filterCounts.climb > 0 && (
                <button
                  onClick={() => setActiveFilter('climb')}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeFilter === 'climb'
                      ? 'bg-amber-500 text-black shadow-md'
                      : 'bg-white/5 text-amber-400/80 hover:text-amber-300 border border-white/10'
                  }`}
                >
                  🧗 攀岩 ({filterCounts.climb})
                </button>
              )}
              {filterCounts.run > 0 && (
                <button
                  onClick={() => setActiveFilter('run')}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeFilter === 'run'
                      ? 'bg-red-500 text-white shadow-md'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  🏃 路跑 ({filterCounts.run})
                </button>
              )}
              {filterCounts.trail > 0 && (
                <button
                  onClick={() => setActiveFilter('trail')}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeFilter === 'trail'
                      ? 'bg-emerald-500 text-black shadow-md'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  🏔️ 越野 ({filterCounts.trail})
                </button>
              )}
              {filterCounts.fitness > 0 && (
                <button
                  onClick={() => setActiveFilter('fitness')}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeFilter === 'fitness'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'bg-white/5 text-blue-400/80 hover:text-blue-300 border border-white/10'
                  }`}
                >
                  🏋️ 健身 ({filterCounts.fitness})
                </button>
              )}
              {filterCounts.hike > 0 && (
                <button
                  onClick={() => setActiveFilter('hike')}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeFilter === 'hike'
                      ? 'bg-yellow-500 text-black shadow-md'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  🥾 徒步 ({filterCounts.hike})
                </button>
              )}
              {filterCounts.ride > 0 && (
                <button
                  onClick={() => setActiveFilter('ride')}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer flex items-center gap-1 ${
                    activeFilter === 'ride'
                      ? 'bg-cyan-500 text-black shadow-md'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  🚴 骑行 ({filterCounts.ride})
                </button>
              )}
              {filterCounts.other > 0 && (
                <button
                  onClick={() => setActiveFilter('other')}
                  className={`px-3 py-1 rounded-full text-xs font-mono font-bold transition-all cursor-pointer ${
                    activeFilter === 'other'
                      ? 'bg-purple-500 text-white shadow-md'
                      : 'bg-white/5 text-gray-400 hover:text-white border border-white/10'
                  }`}
                >
                  其他 ({filterCounts.other})
                </button>
              )}
            </div>
          </div>

          <RunTable
            runs={filteredActivities}
            locateActivity={locateActivity}
            setActivity={() => {}}
            runIndex={runIndex}
            setRunIndex={setRunIndex}
          />
        </div>
      </div>

      {import.meta.env.VERCEL && <Analytics />}
    </Layout>
  );
};

export default AnnualPage;
