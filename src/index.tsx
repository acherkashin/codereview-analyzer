import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import { CodeReviewCharts } from './pages/CodeReviewCharts';
import { ErrorPage } from './pages/ErrorPage';
import { ReadyMergeRequests } from './pages/ReadyMergeRequests';
import { createBrowserRouter, RouterProvider, Link as RouterLink } from 'react-router-dom';

const router = createBrowserRouter([
  {
    path: '/',
    element: <App />,
    errorElement: <ErrorPage />,
    children: [
      {
        path: '/charts',
        element: <CodeReviewCharts />,
      },
      {
        path: '/ready-mrs',
        element: <ReadyMergeRequests />,
      },
    ],
  },
]);

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
  <React.StrictMode>
    <RouterProvider router={router} />
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
