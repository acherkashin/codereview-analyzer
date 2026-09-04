import { createBrowserRouter } from 'react-router-dom';
import { CodeReviewChartsPage } from './CodeReviewChartsPage/CodeReviewChartsPage';
import { ErrorPage } from './ErrorPage';
import { Login } from './Login';
import { OneOnOneReviewPage } from './OneOnOnePage/OneOnOneReviewPage';
import { TeamReviewPage } from './TeamReviewPage/TeamReviewPage';
import { ChartsStoreProvider } from './../stores/ChartsStore';
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
              <CodeReviewChartsPage />
            </ChartsStoreProvider>
          ),
        },
        {
          path: '/one-on-one',
          element: (
            <ChartsStoreProvider>
              <OneOnOneReviewPage />
            </ChartsStoreProvider>
          ),
        },
        {
          path: '/team-review',
          element: (
            <ChartsStoreProvider>
              <TeamReviewPage />
            </ChartsStoreProvider>
          ),
        },
      ],
    },
  ],
  {
    basename: '/codereview-analyzer',
  }
);
