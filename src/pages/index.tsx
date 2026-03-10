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
      
      {/* 顶部全宽导航：包含标题和年份切换 */}
      <div className="w-full pt-6 mb-10">
        <div className="flex flex-col items-center lg:items-start space-y-6">
          <h1 className="text-4xl font-black italic tracking-tighter uppercase border-b-4 border-red-500 pb-2">
            <a href={siteUrl}>{siteTitle}</a>
          </h1>
          <div className="w-full overflow-x-auto py-2 no-scrollbar">
            <YearsStat year={year} onClick={changeYear} />
          </div>
>>>>>>> 02ccb705945e233ba84c19677a7ba58b3b6fd28a
        </div>
      </div>

<<<<<<< HEAD
      <div className="w-full mb-16" id="map-container">
        <div className="bg-[#0a0a0a] p-8 rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-white/10 pb-8 gap-6">
            <div className="space-y-2">
              <h2 className="text-6xl font-black italic text-white tracking-tighter uppercase leading-none">
                {year} <span className="text-red-600 font-outline-2">POSTER</span>
              </h2>
              <p className="text-gray-400 font-mono text-xs tracking-[0.6em] uppercase opacity-50">
                Organic Tangency Trace Network
              </p>
=======
      <div className="w-full mb-16" id="map-container">
        {/* 有机足迹网格容器 */}
        <div className="bg-[#0a0a0a] p-8 rounded-[3rem] shadow-2xl border border-white/5 overflow-hidden">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 border-b border-white/10 pb-8 gap-6">
            <div className="space-y-2">
              <h2 className="text-6xl font-black italic text-white tracking-tighter uppercase leading-none">
                {year} <span className="text-red-600 font-outline-2">POSTER</span>
              </h2>
              <p className="text-gray-400 font-mono text-xs tracking-[0.6em] uppercase opacity-50">
                Organic Tangency Trace Network
              </p>
>>>>>>> 02ccb705945e233ba84c19677a7ba58b3b6fd28a
            </div>
<<<<<<< HEAD
            
            <div className="flex space-x-12">
              <div className="text-center group">
                <div className="text-white text-5xl font-black font-mono leading-none">{runs.length}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-3">Runs</div>
=======
            
            {/* 统计数据：对应你 2025 年 1727 公里和 8.9 万米爬升的数据 */}
            <div className="flex space-x-12">
              <div className="text-center group">
                <div className="text-white text-5xl font-black font-mono leading-none">{runs.length}</div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-3">Runs</div>
>>>>>>> 02ccb705945e233ba84c19677a7ba58b3b6fd28a
              </div>
              <div className="text-center group">
                <div className="text-white text-5xl font-black font-mono leading-none">
                  {Math.round(runs.reduce((acc, r) => acc + r.distance, 0) / 1000)}
                </div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-3">Total KM</div>
              </div>
              <div className="text-center group hidden sm:block">
                <div className="text-[#2ecc71] text-5xl font-black font-mono leading-none">
                  {Math.round(runs.reduce((acc, r) => acc + (r.total_elevation_gain || 0), 0))}
                </div>
                <div className="text-[10px] text-gray-500 uppercase font-bold tracking-widest mt-3">Elevation (m)</div>
              </div>
            </div>
          </div>
          
          <TrackWall activities={runs} />
        </div>

        <div className="mt-12">
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