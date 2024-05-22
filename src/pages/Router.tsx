import { createBrowserRouter } from 'react-router-dom';
import { CodeReviewCharts, ReadyMergeRequests, ErrorPage, Login, ExportPage } from './';
import { ChartsStoreProvider } from './../stores/ChartsStore';
import { createExportStore, ExportStoreProvider } from './../stores/ExportStore';
import { App } from './../App';

export const router = createBrowserRouter(
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
            <ChartsStoreProvider>
              <CodeReviewCharts />
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
