import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@emotion/react';
import { theme } from './theme';
import { PersonalStatistic, CodeReviewCharts, ReadyMergeRequests, ErrorPage, Login, ExportPage } from './pages';
import { ChartsStoreProvider, createCommonChartsStore, createPersonalPageStore } from './stores/ChartsStore';
import { createExportStore, ExportStoreProvider } from './stores/ExportStore';

const router = createBrowserRouter(
  [
    {
      path: '/login',
      element: <Login />,
    },
    {
      path: '/',
      element: <App />,
      errorElement: <ErrorPage />,
      children: [
        {
          path: '/charts',
          element: (
            // We need to specify "key" to use different provider for CodeReviewCharts and PersonalStatistic pages
            // otherwise react think that component (ChartsStoreProvider) is not changed and just re-render page without re-rendering context
            // and in this case both pages uses the same store
            <ChartsStoreProvider key="charts" createStore={createPersonalPageStore}>
              <CodeReviewCharts />
            </ChartsStoreProvider>
          ),
        },
        {
          path: '/ready-mrs',
          element: <ReadyMergeRequests />,
        },
        {
          path: '/personal',
          element: (
            <ChartsStoreProvider key="personal" createStore={createCommonChartsStore}>
              <PersonalStatistic />
            </ChartsStoreProvider>
          ),
        },
        {
          path: '/export',
          element: (
            <ExportStoreProvider createStore={createExportStore}>
              <ExportPage />
            </ExportStoreProvider>
          ),
        },
      ],
    },
  ],
  {
    basename: '/gitlab-codereview-analyzer',
  }
);

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <ThemeProvider theme={theme}>
      <RouterProvider router={router} />
    </ThemeProvider>
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
