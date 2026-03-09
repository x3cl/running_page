import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Analytics } from '@vercel/analytics/react';
import { Helmet } from 'react-helmet-async';
import Layout from '@/components/Layout';
import LocationStat from '@/components/LocationStat';
import RunMap from '@/components/RunMap';
import RunTable from '@/components/RunTable';
import SVGStat from '@/components/SVGStat';
import YearsStat from '@/components/YearsStat';
import { TrackWall } from '../components/TrackWall';
import useActivities from '@/hooks/useActivities';
import useSiteMetadata from '@/hooks/useSiteMetadata';
import { useInterval } from '@/hooks/useInterval';
import { IS_CHINESE } from '@/utils/const';
import {
  Activity,
  IViewState,
  filterAndSortRuns,
  filterCityRuns,
  filterTitleRuns,
  filterYearRuns,
  geoJsonForRuns,
  getBoundsForGeoData,
  scrollToMap,
  sortDateFunc,
  titleForShow,
  RunIds,
} from '@/utils/utils';
import { useTheme, useThemeChangeCounter } from '@/hooks/useTheme';

const Index = () => {
  const { siteTitle, siteUrl } = useSiteMetadata();
  const { activities, thisYear } = useActivities();
  const themeChangeCounter = useThemeChangeCounter();
  const [year, setYear] = useState(thisYear);
  const [runIndex, setRunIndex] = useState(-1);
  const [title, setTitle] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentAnimationIndex, setCurrentAnimationIndex] = useState(0);
  const [animationRuns, setAnimationRuns] = useState<Activity[]>([]);
  const [currentFilter, setCurrentFilter] = useState<{
    item: string;
    func: (_run: Activity, _value: string) => boolean;
  }>({ item: thisYear, func: filterYearRuns });

  const [singleRunId, setSingleRunId] = useState<number | null>(null);
  const [animationTrigger, setAnimationTrigger] = useState(0);

  const selectedRunIdRef = useRef<number | null>(null);
  const selectedRunDateRef = useRef<string | null>(null);

  useEffect(() => {
    const hash = window.location.hash.replace('#', '');
    if (hash && hash.startsWith('run_')) {
      const runId = parseInt(hash.replace('run_', ''), 10);
      if (!isNaN(runId)) setSingleRunId(runId);
    }
    const handleHashChange = () => {
      const newHash = window.location.hash.replace('#', '');
      if (newHash && newHash.startsWith('run_')) {
        const runId = parseInt(newHash.replace('run_', ''), 10);
        if (!isNaN(runId)) setSingleRunId(runId);
      } else {
        setSingleRunId(null);
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const runs = useMemo(() => filterAndSortRuns(activities, currentFilter.item, currentFilter.func, sortDateFunc), [activities, currentFilter.item, currentFilter.func]);
  const geoData = useMemo(() => geoJsonForRuns(runs), [runs, themeChangeCounter]);
  const bounds = useMemo(() => getBoundsForGeoData(geoData), [geoData]);
  const [viewState, setViewState] = useState<IViewState>(() => ({ ...bounds }));
  const [animatedGeoData, setAnimatedGeoData] = useState(geoData);

  useInterval(() => {
    if (!isAnimating || currentAnimationIndex >= animationRuns.length) {
      setIsAnimating(false);
      setAnimatedGeoData(geoData);
      return;
    }
    const nextIndex = Math.min(currentAnimationIndex + Math.ceil(animationRuns.length / 8), animationRuns.length);
    setAnimatedGeoData(geoJsonForRuns(animationRuns.slice(0, nextIndex)));
    setCurrentAnimationIndex(nextIndex);
  }, isAnimating ? 300 : null);

  const startAnimation = useCallback((runsToAnimate: Activity[]) => {
    if (runsToAnimate.length === 0) {
      setAnimatedGeoData(geoData);
      return;
    }
    setAnimationRuns(runsToAnimate);
    setCurrentAnimationIndex(Math.ceil(runsToAnimate.length / 8));
    setIsAnimating(true);
  }, [geoData]);

  const changeByItem = useCallback((item: string, name: string, func: any) => {
    scrollToMap();
    if (name !== 'Year') setYear(thisYear);
    setCurrentFilter({ item, func });
    setRunIndex(-1);
    setTitle(`${item} ${name} Running Heatmap`);
    setSingleRunId(null);
  }, [thisYear]);

  const changeYear = useCallback((y: string) => {
    setYear(y);
    if ((viewState.zoom ?? 0) > 3 && bounds) setViewState({ ...bounds });
    changeByItem(y, 'Year', filterYearRuns);
    setIsAnimating(false);
  }, [viewState.zoom, bounds, changeByItem]);

  const locateActivity = useCallback((runIds: RunIds) => {
    const ids = new Set(runIds);
    const selectedRuns = !runIds.length ? runs : runs.filter((r) => ids.has(r.run_id));
    if (!selectedRuns.length) return;
    const lastRun = [...selectedRuns].sort(sortDateFunc)[0];
    if (runIds.length === 1) {
      setRunIndex(runs.findIndex((r) => r.run_id === runIds[0]));
      setSingleRunId(runIds[0]);
      setAnimationTrigger(t => t + 1);
    } else {
      setRunIndex(-1);
      setSingleRunId(null);
    }
    const selectedGeoData = geoJsonForRuns(selectedRuns);
    setAnimatedGeoData(selectedGeoData);
    setViewState({ ...getBoundsForGeoData(selectedGeoData) });
    setTitle(titleForShow(lastRun));
    scrollToMap();
  }, [runs]);

  useEffect(() => {
    if (singleRunId === null) {
      setViewState((prev) => ({ ...prev, ...bounds }));
      startAnimation(runs);
    }
  }, [bounds, runs, singleRunId, startAnimation]);

  const { theme } = useTheme();

  return (
    <Layout>
      <Helmet><html lang="en" data-theme={theme} /></Helmet>
      
      {/* 顶部区域：标题和年份切换 */}
      <div className="w-full space-y-8 mb-10">
        <div className="flex flex-col md:flex-row justify-between items-center border-b pb-8">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase">
            <a href={siteUrl}>{siteTitle}</a>
          </h1>
          <div className="mt-4 md:mt-0">
             {/* 核心修改：年份选择现在横跨顶部 */}
            <YearsStat year={year} onClick={changeYear} />
          </div>
        </div>
      </div>

      {/* 中间核心：全宽足迹海报墙 */}
      <div className="w-full mb-12" id="map-container">
        <div className="bg-black p-8 rounded-3xl shadow-2xl border border-gray-800 transition-all overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 border-b border-gray-800 pb-8 gap-6">
            <div>
              <h2 className="text-5xl font-black italic text-white tracking-tighter uppercase leading-none">
                {year} RUNNING POSTER
              </h2>
              <p className="text-gray-500 font-mono text-sm mt-3 tracking-[0.4em] uppercase opacity-60">
                De-Geospatial Compact Trace Grid
              </p>
            </div>
            
            {/* 动态统计数据 */}
            <div className="flex space-x-12">
              <div className="text-center">
                <div className="text-white text-4xl font-bold font-mono leading-none">{runs.length}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-2">Activities</div>
              </div>
              <div className="text-center">
                <div className="text-white text-4xl font-bold font-mono leading-none">
                  {Math.round(runs.reduce((acc, r) => acc + r.distance, 0) / 1000)}
                </div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-2">Total KM</div>
              </div>
              {/* 特别为你添加的：总爬升展示（针对 2025 年那惊人的 8.9 万米） */}
              <div className="text-center hidden sm:block">
                <div className="text-green-400 text-4xl font-bold font-mono leading-none">
                  {Math.round(runs.reduce((acc, r) => acc + (r.total_elevation_gain || 0), 0))}
                </div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-2">Gain (m)</div>
              </div>
            </div>
          </div>
          
          {/* 足迹墙：现在它拥有全宽空间，会根据屏幕自动排布 */}
          <TrackWall activities={runs} />
        </div>

        {/* 底部：详细表格 */}
        <div className="mt-16">
          {year === 'Total' ? <SVGStat /> : (
            <RunTable 
              runs={runs} 
              locateActivity={locateActivity} 
              setActivity={() => { }} 
              runIndex={runIndex} 
              setRunIndex={setRunIndex} 
            />
          )}
        </div>
      </div>
      
      {import.meta.env.VERCEL && <Analytics />}
    </Layout>
  );
};

export default Index;