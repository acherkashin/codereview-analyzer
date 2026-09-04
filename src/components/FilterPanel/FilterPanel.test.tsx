import { fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FilterPanel } from './FilterPanel';
import { ChartsStoreProvider } from '../../stores/ChartsStore';
import { useAuthStore } from '../../stores/AuthStore';

describe('FilterPanel Gitea pull request minimum', () => {
  beforeEach(() => {
    localStorage.setItem('project', JSON.stringify({ id: 'repo', name: 'repo', owner: 'owner' }));
    useAuthStore.setState({
      userContext: { access: 'full', host: 'https://gitea.example.com', token: 'token', hostType: 'Gitea' },
      genericClient: {} as any,
    });
  });

  afterEach(() => {
    localStorage.clear();
    useAuthStore.setState({ userContext: null, genericClient: null });
  });

  it('explains the minimum semantics and accepts a positive whole number', () => {
    const onAnalyze = vi.fn();
    render(
      <ChartsStoreProvider>
        <FilterPanel onAnalyze={onAnalyze} />
      </ChartsStoreProvider>
    );

    expect(screen.getByLabelText('Minimum analyzable PRs')).toHaveValue(100);
    expect(
      screen.getByText(
        'Counts unique open or merged PRs. Closed-unmerged and duplicate results are skipped; the final page may make the total slightly higher.'
      )
    ).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Minimum analyzable PRs'), { target: { value: '1000' } });
    fireEvent.click(screen.getByRole('button', { name: 'Analyze' }));

    expect(onAnalyze).toHaveBeenCalledWith(expect.objectContaining({ pullRequestCount: 1000, state: 'all' }));
  });

  it('rejects non-positive and fractional values', () => {
    render(
      <ChartsStoreProvider>
        <FilterPanel onAnalyze={vi.fn()} />
      </ChartsStoreProvider>
    );

    const input = screen.getByLabelText('Minimum analyzable PRs');
    const analyze = screen.getByRole('button', { name: 'Analyze' });

    fireEvent.change(input, { target: { value: '0' } });
    expect(analyze).toBeDisabled();

    fireEvent.change(input, { target: { value: '1.5' } });
    expect(analyze).toBeDisabled();
  });
});
