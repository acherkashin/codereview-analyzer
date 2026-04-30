import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AnalysisProgressPanel } from './AnalysisProgressPanel';

describe('AnalysisProgressPanel', () => {
  it('shows fetched, total count, and determinate progress when total is known', () => {
    render(
      <AnalysisProgressPanel
        progress={{
          stage: 'pull-request-details',
          stageLabel: 'Fetching pull request details',
          fetched: 7,
          total: 10,
          currentDataType: 'discussions',
          currentPullRequestTitle: 'Add progress',
        }}
      />
    );

    expect(screen.getByText('Fetching pull request details')).toBeInTheDocument();
    expect(screen.getByText('7 of 10 pull requests fetched')).toBeInTheDocument();
    expect(screen.queryByText(/remaining/i)).not.toBeInTheDocument();
    expect(screen.getByText('Fetching discussions for "Add progress"')).toBeInTheDocument();
    expect(screen.getByLabelText('Pull request fetch progress')).toHaveAttribute('aria-valuenow', '70');
  });

  it('shows fetched count and date range with indeterminate progress when total is unknown', () => {
    render(
      <AnalysisProgressPanel
        progress={{
          stage: 'pull-request-list',
          stageLabel: 'Fetching pull request list',
          fetched: 25,
          currentDataType: 'pull requests',
          createdAfter: '2026-04-01T00:00:00.000Z',
          createdBefore: '2026-04-30T00:00:00.000Z',
        }}
      />
    );

    expect(screen.getByText('25 pull requests fetched')).toBeInTheDocument();
    expect(screen.getByText('Date range: 2026-04-01 to 2026-04-30')).toBeInTheDocument();
    expect(screen.getByLabelText('Pull request fetch progress')).not.toHaveAttribute('aria-valuenow');
  });

  it('keeps variable progress text in single-line clamped rows', () => {
    const longTitle = 'A very long pull request title that should never make the progress panel grow vertically';

    render(
      <AnalysisProgressPanel
        progress={{
          stage: 'pull-request-details',
          stageLabel: 'Fetching pull request details',
          fetched: 1,
          total: 20,
          currentDataType: 'review comments',
          currentPullRequestTitle: longTitle,
        }}
      />
    );

    expect(screen.getByRole('status')).toHaveStyle({ height: '142px', overflow: 'hidden' });
    const detailRow = screen.getByText(`Fetching review comments for "${longTitle}"`);
    expect(detailRow).toHaveStyle({
      whiteSpace: 'nowrap',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
    });
    expect(detailRow).toHaveAttribute('title', `Fetching review comments for "${longTitle}"`);
  });
});
