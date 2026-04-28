import { createBrowserRouter } from 'react-router-dom';
import { CodeReviewChartsPage, ErrorPage, Login, OneOnOneReviewPage, TeamReviewPage } from './';
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
