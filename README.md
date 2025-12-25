# GitLab Code Review Analyzer - Project Structure

## Overview

A React-based web application for analyzing GitLab and Gitea pull request data, providing comprehensive charts and insights for code review processes.

## Technologies Stack

- **Frontend**: React 18, TypeScript
- **UI Framework**: Material-UI (MUI)
- **Charts**: Nivo (React chart library)
- **State Management**: Zustand
- **Data Processing**: Tidy.js
- **Date Handling**: Day.js
- **Build Tool**: Vite
- **Testing**: Vitest

## Folder Structure

```
src/
├── components/          # Reusable UI components
│   ├── charts/         # Chart components (Bar, Line, Pie, etc.)
│   ├── tooltips/       # Chart tooltip components
│   ├── tiles/          # Dashboard tile components
│   ├── dialogs/        # Modal dialogs
│   └── FilterPanel/    # Filtering controls
├── pages/              # Page components
│   └── CodeReviewChartsPage/  # Main dashboard page
├── services/           # API integration
│   ├── Gitlab/         # GitLab API service
│   └── Gitea/          # Gitea API service
├── stores/             # Zustand state stores
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── theme/              # MUI theme configuration
└── types.d.ts          # TypeScript type definitions
```

## Key Components

- **Charts**: Modular chart system with consistent API
- **Services**: Abstracted API layer for GitLab/Gitea integration
- **Stores**: Centralized state management for analytics data
- **Utils**: Data processing and formatting utilities

## Development

- Built with modern React patterns (hooks, functional components)
- TypeScript for type safety
- Component-based architecture with clear separation of concerns
- Responsive design with Material-UI grid system

# Available charts

| №   | Chart Name                                                                                | Description                                                                                                                   | Available for specific user |
| --- | ----------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | --------------------------- |
| 1   | Enables the analysis of how frequently each user initiates discussions on a monthly basis | Enables the analysis of how frequently each user initiates discussions on a monthly basis                                     | ✅                          |
| 2   | Discussions started with person per month                                                 | Allows to analyze how many discussions started with each user by other users per month                                        | ✅                          |
| 3   | Top 10 Longest Discussions                                                                | Shows discussions with the greatest number of comments                                                                        | ✅                          |
| 4   | Discussions started with person (PieChart)                                                | Shows how discussions are distributed among authors of pull requests                                                          |                             |
| 5   | Discussions started by person (PieChart)                                                  | Shows how discussions are distributed among reviewers                                                                         |                             |
| 7   | Discussions started with person (BarChart)                                                | Shows how discussions are distributed among authors of pull requests and who starts those discussions                         | ✅                          |
| 8   | Discussions started by person (BarChart)                                                  | Shows how discussions are distributed among reviewers and who they start discussions with                                     | ✅                          |
| 9   | Changes to Discussions correlation                                                        | Allows to analyze whether there is correlation between changed files count and discussions count started in the pull requests |                             |
| 10  | Comments left by person per month                                                         | Enables the analysis of how frequently each user leaves comments on a monthly basis                                           | ✅                          |
| 11  | Tags cloud created from most popular words in comments                                    | Displays the most popular words that appear in comments to pull requests                                                      | ✅                          |
| 12  | Pull Requests reviews by user                                                             | Displays how many pull requests were assigned to the user to make a review and how many were actually reviewed and approved   | ✅                          |
| 13  | Top 10 Most commented Pull Requests                                                       | Highlights pull requests with the highest volume of comments                                                                  | ✅                          |
| 14  | Comments left by person (PieChart)                                                        | Shows how comments are distributed among reviewers                                                                            |                             |
| 15  | Comments left by person (BarChart)                                                        | Shows how comments are distributed among reviewers and who they leave comment to                                              | ✅                          |
| 16  | Comments received by person (PieChart)                                                    | Shows how comments are distributed among authors of pull requests                                                             |                             |
| 17  | Comments received by person (BarChart)                                                    | Shows how comments are distributed among authors of pull requests and who leaves those discussions                            | ✅                          |
| 18  | Commented Files                                                                           | Displays which files users usually leave comments on during code reviews                                                      | ✅                          |
| 19  | Approved By                                                                               | Displays whose pool requests each user approves                                                                               | ✅                          |
| 20  | Approvals Received By                                                                     | Displays who approves pull request of each user                                                                               | ✅                          |
| 21  | Review Requested From                                                                     | Shows whom users frequently request reviews from and displays the individuals who ask to review their changes                 | ✅                          |
| 22  | Review Requested By                                                                       | Shows which users frequently request reviews from others and displays the individuals they ask to review their changes        | ✅                          |
| 23  | Daily reviews                                                                             | Enables the analysis of how frequently each user reviews on a daily basis                                                     | ✅                          |
| 24  | Pull Requests created by user                                                             | Displays the number of pull requests contributed by each user                                                                 |                             |
| 25  | Review Ration                                                                             | Shows review ration for every developer - the probability that the developer will review a pull request assigned to him.      |                             |
| 26  | Created Pull Requests                                                                     | Shows count of pull requests created daily                                                                                    | ✅                          |
