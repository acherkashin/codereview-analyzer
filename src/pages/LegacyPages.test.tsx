import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { ExportPage } from './ExportPage';
import { ReadyMergeRequests } from './ReadyMergeRequests';

const mocks = vi.hoisted(() => ({
  client: {},
  setProjectsToExport: vi.fn(),
  exportData: null,
  exportRequest: vi.fn(async () => undefined),
  fetchProjects: vi.fn(async () => undefined),
  allProjects: [{ id: 'project-1', name: 'Analytics' }],
}));

vi.mock('../stores/AuthStore', () => ({
  useClient: () => mocks.client,
}));

vi.mock('../stores/ExportStore', () => ({
  useExportsStore: (selector: (state: unknown) => unknown) =>
    selector({
      export: mocks.exportRequest,
      fetchProjects: mocks.fetchProjects,
      setProjectsToExport: mocks.setProjectsToExport,
      allProjects: mocks.allProjects,
      exportData: mocks.exportData,
    }),
}));

vi.mock('../hooks/useLocalStorage', () => ({
  useLocalStorage: () => [undefined, vi.fn()],
}));

describe('legacy page render smoke tests', () => {
  it('renders the export page with the MUI loading button replacement', () => {
    mocks.exportRequest.mockReturnValueOnce(new Promise(() => undefined));
    render(<ExportPage />);

    expect(screen.getByRole('heading', { name: 'Projects' })).toBeInTheDocument();
    const exportButton = screen.getByRole('button', { name: 'Export' });
    fireEvent.click(exportButton);
    expect(exportButton).toBeDisabled();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Export as JSON' })).toBeDisabled();
  });

  it('renders the ready merge requests page without a selected project', () => {
    render(<ReadyMergeRequests />);

    expect(screen.getByRole('combobox', { name: 'Projects' })).toBeInTheDocument();
  });
});
