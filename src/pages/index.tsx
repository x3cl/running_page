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
      <div className="w-full lg:w-1/3">
        <h1 className="my-12 mt-6 text-5xl font-extrabold italic"><a href={siteUrl}>{siteTitle}</a></h1>
        {(viewState.zoom ?? 0) <= 3 && IS_CHINESE ? (
          <LocationStat changeYear={changeYear} changeCity={s => changeByItem(s, 'City', filterCityRuns)} changeTitle={s => changeByItem(s, 'Title', filterTitleRuns)} />
        ) : (
          <YearsStat year={year} onClick={changeYear} />
        )}
      </div>
      <div className="w-full lg:w-2/3" id="map-container">
        <RunMap title={title} viewState={viewState} geoData={animatedGeoData} setViewState={setViewState} changeYear={changeYear} thisYear={year} animationTrigger={animationTrigger} />
        {year === 'Total' ? <SVGStat /> : (
          <RunTable runs={runs} locateActivity={locateActivity} setActivity={() => {}} runIndex={runIndex} setRunIndex={setRunIndex} />
        )}
        <div className="mt-12 mb-8">
          <h2 className="text-2xl font-bold mb-6 italic text-red-500">我的全球足迹墙</h2>
          <TrackWall activities={activities} />
        </div>
      </div>
      {import.meta.env.VERCEL && <Analytics />}
    </Layout>
  );
};

export default Index;