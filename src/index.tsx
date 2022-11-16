import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import { ThemeProvider } from '@emotion/react';
import { theme } from './theme';
import { PersonalStatistic, CodeReviewCharts, ReadyMergeRequests, ErrorPage, Login } from './pages';
import { ChartsStoreProvider, createChartsStore } from './stores/ChartsStore';

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
            <ChartsStoreProvider key="charts" createStore={createChartsStore}>
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
            <ChartsStoreProvider key="personal" createStore={createChartsStore}>
              <PersonalStatistic />
            </ChartsStoreProvider>
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
