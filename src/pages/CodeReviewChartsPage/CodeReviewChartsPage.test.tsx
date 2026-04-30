import type React from 'react';
import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { CodeReviewChartsPage } from './CodeReviewChartsPage';

const testState = vi.hoisted(() => ({
  isAnalyzing: false,
  importData: vi.fn(),
  analyze: vi.fn(),
}));

vi.mock('../../stores/ChartsStore', () => {
  function getAnalyze() {
    return testState.analyze;
  }

  return {
    getAnalyze,
    useChartsStore: (selector: any) => {
      if (selector === getAnalyze) {
        return testState.analyze;
      }

      return selector({
        user: undefined,
        pullRequests: null,
        users: null,
        dialogTitle: '',
        filteredComments: null,
        filteredDiscussions: null,
        isAnalyzing: testState.isAnalyzing,
        actions: {
          import: testState.importData,
          closeDialog: vi.fn(),
          showFilteredComments: vi.fn(),
          showFilteredDiscussions: vi.fn(),
          showDiscussion: vi.fn(),
          showCommentsWithWord: vi.fn(),
        },
      });
    },
  };
});

vi.mock('../../stores/AuthStore', () => ({
  useClient: () => ({}),
}));

vi.mock('../../hooks/useIsGuest', () => ({
  useIsGuest: () => false,
}));

vi.mock('../../components', () => ({
  ImportTextButton: ({ label }: { label: string }) => <button>{label}</button>,
  CommentList: () => <div />,
  DiscussionList: () => <div />,
  FullScreenDialog: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

vi.mock('../../components/FilterPanel/FilterPanel', () => ({
  FilterPanel: () => <div>Filter Panel</div>,
}));

vi.mock('./CodeReviewFilterPanel', () => ({
  CodeReviewFilterPanel: () => <div />,
}));

vi.mock('./CodeReviewTiles', () => ({
  CodeReviewTiles: () => <div />,
}));

vi.mock('./CodeReviewCharts', () => ({
  CodeReviewCharts: () => <div />,
}));

vi.mock('./ChartsTitle', () => ({
  ChartsTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

describe('CodeReviewChartsPage', () => {
  afterEach(() => {
    testState.isAnalyzing = false;
    vi.clearAllMocks();
  });

  it('shows Import as JSON before analysis starts', () => {
    render(<CodeReviewChartsPage />);

    expect(screen.getByText('Import as JSON')).toBeInTheDocument();
  });

  it('uses a wider responsive start panel', () => {
    render(<CodeReviewChartsPage />);

    expect(screen.getByTestId('analysis-start-panel')).toHaveStyle({
      width: 'min(560px, calc(100vw - 32px))',
    });
  });

  it('hides Import as JSON while analysis is running', () => {
    testState.isAnalyzing = true;

    render(<CodeReviewChartsPage />);

    expect(screen.queryByText('Import as JSON')).not.toBeInTheDocument();
  });
});
