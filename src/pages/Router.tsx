import { createBrowserRouter } from 'react-router-dom';
import { CodeReviewChartsPage, ErrorPage, Login } from './';
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
      ],
    },
  ],
  {
    basename: '/gitlab-codereview-analyzer',
  }
);
