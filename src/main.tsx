import React, { Suspense } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createBrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import Index from './pages';
import ReactGA from 'react-ga4';
import {
  GOOGLE_ANALYTICS_TRACKING_ID,
  USE_GOOGLE_ANALYTICS,
} from './utils/const';
import '@/styles/index.css';
import { withOptionalGAPageTracking } from './utils/trackRoute';

// 路由代码分割：避免首页无端加载 recharts、mapbox、@assets 庞大矢量图等
const HomePage = React.lazy(() => import('@/pages/total'));
const AnnualPage = React.lazy(() => import('@/pages/annual'));
const NotFound = React.lazy(() => import('./pages/404'));

if (USE_GOOGLE_ANALYTICS) {
  ReactGA.initialize(GOOGLE_ANALYTICS_TRACKING_ID);
}

const RouteErrorBoundary = () => (
  <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center font-mono">
    <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-500 flex items-center justify-center text-2xl mb-4 border border-red-500/30">
      ⚠️
    </div>
    <h2 className="text-xl font-bold text-white mb-2">页面渲染遇到异常</h2>
    <p className="text-gray-400 text-xs mb-6 max-w-md">
      应用在渲染此视图时捕获到错误，请尝试刷新页面或返回首页。
    </p>
    <a
      href={import.meta.env.BASE_URL || '/'}
      className="px-5 py-2 bg-gradient-to-r from-red-600 to-amber-600 text-white rounded-full text-xs font-bold shadow-lg shadow-red-600/30 hover:scale-105 transition-all"
    >
      返回首页
    </a>
  </div>
);

const routes = createBrowserRouter(
  [
    {
      path: '/',
      element: withOptionalGAPageTracking(<Index />),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'annual',
      element: withOptionalGAPageTracking(
        <Suspense fallback={<div className="p-8 text-center text-gray-400 font-mono">加载中...</div>}>
          <AnnualPage />
        </Suspense>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: 'summary',
      element: withOptionalGAPageTracking(
        <Suspense fallback={<div className="p-8 text-center text-gray-400 font-mono">加载中...</div>}>
          <HomePage />
        </Suspense>
      ),
      errorElement: <RouteErrorBoundary />,
    },
    {
      path: '*',
      element: withOptionalGAPageTracking(
        <Suspense fallback={<div className="p-8 text-center text-gray-400 font-mono">加载中...</div>}>
          <NotFound />
        </Suspense>
      ),
      errorElement: <RouteErrorBoundary />,
    },
  ],
  { basename: import.meta.env.BASE_URL }
);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <HelmetProvider>
      <RouterProvider router={routes} />
    </HelmetProvider>
  </React.StrictMode>
);
