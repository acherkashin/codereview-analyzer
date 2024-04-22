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
            // We need to specify "key" to use different provider for CodeReviewCharts and PersonalStatistic pages
            // otherwise react think that component (ChartsStoreProvider) is not changed and just re-render page without re-rendering context
            // and in this case both pages uses the same store
            <ChartsStoreProvider key="charts">
              <CodeReviewCharts />
            </ChartsStoreProvider>
          ),
        },
        {
          path: '/ready-mrs',
          element: <ReadyMergeRequests />,
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
