import { useEffect, useState, useMemo, useCallback } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import RunTable from '@/components/RunTable';
import { TrackWall } from '@/components/TrackWall';
import { MonthSelector } from '@/components/MonthSelector';
import { MonthlyStatsHeader } from '@/components/MonthlyStatsHeader';
import useActivities from '@/hooks/useActivities';
import useSiteMetadata from '@/hooks/useSiteMetadata';
import {
  Activity,
  filterAndSortRuns,
  sortDateFunc,
  titleForShow,
  RunIds,
} from '@/utils/utils';
import { useTheme } from '@/hooks/useTheme';

const Index = () => {
  const { siteTitle, siteUrl } = useSiteMetadata();
  const { activities, years } = useActivities();
  const { theme } = useTheme();

  // 计算默认月份：当前月份的前一个完整自然月（例如 9 月默认聚焦 8 月）
  const { defaultYear, defaultMonth } = useMemo(() => {
    const now = new Date();
    const curYear = now.getFullYear();
    const curMonth = now.getMonth() + 1; // 1-12
    if (curMonth === 1) {
      return { defaultYear: curYear - 1, defaultMonth: 12 };
    }
    return { defaultYear: curYear, defaultMonth: curMonth - 1 };
  }, []);

  const [selectedYear, setSelectedYear] = useState<number>(defaultYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(defaultMonth);
  const [runIndex, setRunIndex] = useState(-1);
  const [, setTitle] = useState('');

  // 确保当 activities 加载出来后，如果 defaultYear 没有任何活动，则自动选用有数据的最近年份
  useEffect(() => {
    if (!activities.length) return;
    const hasData = activities.some((a) =>
      (a.start_date_local || '').startsWith(`${selectedYear}-`)
    );
    if (!hasData) {
      // 提取最新活动的年份
      const latest = [...activities].sort(sortDateFunc)[0];
      if (latest && latest.start_date_local) {
        const y = parseInt(latest.start_date_local.substring(0, 4), 10);
        const m = parseInt(latest.start_date_local.substring(5, 7), 10);
        if (!isNaN(y) && !isNaN(m)) {
          setSelectedYear(y);
          setSelectedMonth(m);
        }
      }
    }
  }, [activities, selectedYear]);

  // 计算当年每个月的活动数量
  const monthCounts = useMemo(() => {
    const counts: Record<number, number> = {};
    for (let m = 1; m <= 12; m++) counts[m] = 0;

    const yearPrefix = `${selectedYear}-`;
    activities.forEach((a) => {
      const dateStr = a.start_date_local || '';
      if (dateStr.startsWith(yearPrefix)) {
        const m = parseInt(dateStr.substring(5, 7), 10);
        if (m >= 1 && m <= 12) {
          counts[m] = (counts[m] || 0) + 1;
        }
      }
    });

    return counts;
  }, [activities, selectedYear]);

  // 过滤出当前选中年月的全部运动记录
  const monthPrefix = useMemo(() => {
    const mStr = selectedMonth < 10 ? `0${selectedMonth}` : `${selectedMonth}`;
    return `${selectedYear}-${mStr}`;
  }, [selectedYear, selectedMonth]);

  const monthlyActivities = useMemo(() => {
    return filterAndSortRuns(
      activities,
      monthPrefix,
      (run, prefix) => (run.start_date_local || '').startsWith(prefix),
      sortDateFunc
    );
  }, [activities, monthPrefix]);

  const handleSelectMonth = useCallback((y: number, m: number) => {
    setSelectedYear(y);
    setSelectedMonth(m);
    setRunIndex(-1);
  }, []);

  const locateActivity = useCallback(
    (runIds: RunIds) => {
      if (!runIds.length) return;
      const ids = new Set(runIds);
      const selected = monthlyActivities.filter((r) => ids.has(r.run_id));
      if (!selected.length) return;
      const target = selected[0];
      setRunIndex(monthlyActivities.findIndex((r) => r.run_id === target.run_id));
      setTitle(titleForShow(target));
    },
    [monthlyActivities]
  );

  const availableYearsList = useMemo(() => {
    const list = years
      .map((y) => parseInt(y, 10))
      .filter((y) => !isNaN(y))
      .sort((a, b) => b - a);
    return list.length ? list : [selectedYear];
  }, [years, selectedYear]);

  return (
    <Layout>
      <Helmet>
        <html lang="en" data-theme={theme} />
      </Helmet>

      {/* 顶部标题与月度切换器 */}
      <div className="w-full pt-6 mb-6">
        <div className="flex flex-col items-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-black italic tracking-tighter uppercase border-b-4 border-red-500 pb-2">
            <a href={siteUrl}>{siteTitle}</a>
          </h1>

          {/* 月度导航切换器 */}
          <MonthSelector
            currentYear={selectedYear}
            currentMonth={selectedMonth}
            onSelectMonth={handleSelectMonth}
            availableYears={availableYearsList}
            monthCounts={monthCounts}
          />
        </div>
      </div>

      {/* 主展示区：月度总结 + TrackWall 旋转星系 */}
      <div className="w-full mb-16" id="map-container">
        <div className="bg-[#0a0a0a] p-6 md:p-8 rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden relative">
          {/* 月度数据指标看板 */}
          <MonthlyStatsHeader
            year={selectedYear}
            month={selectedMonth}
            activities={monthlyActivities}
          />

          {/* 有机自转星系网络：每一条独立轨迹 + 室内抱石/高壁/室外Topo */}
          <TrackWall activities={monthlyActivities} />
        </div>

        {/* 当月详细活动表格 */}
        <div className="mt-12">
          <div className="flex items-center justify-between mb-4 px-2">
            <h3 className="text-xl font-bold font-mono text-white tracking-wider flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block animate-pulse" />
              {selectedYear}年 {selectedMonth}月 详细记录 ({monthlyActivities.length} 项)
            </h3>
          </div>
          <RunTable
            runs={monthlyActivities}
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

export default Index;