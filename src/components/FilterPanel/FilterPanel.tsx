import { LoadingButton } from '@mui/lab';
import { Stack, TextField } from '@mui/material';
import { ProjectList } from '../ProjectList';
import { ProjectSchema } from '@gitbeaker/core/dist/types/types';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { useCallback, useState } from 'react';
import { useLocalStorage, useRequest } from '../../hooks';

export interface FilterPanelState {
  createdAfter: Date;
  createdBefore: Date;
  project: ProjectSchema;
}

export interface FilterPanelProps {
  onAnalyze: (state: FilterPanelState) => Promise<any>;
  children?: React.ReactElement;
}

export function FilterPanel({ onAnalyze, children }: FilterPanelProps) {
  const [createdBefore, setCreatedBefore] = useState<Date>(new Date());
  const [createdAfter, setCreatedAfter] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [project, setProject] = useLocalStorage<ProjectSchema | null>('project', null);

  const { makeRequest: analyze, isLoading } = useRequest(onAnalyze);

  const handleAnalyze = useCallback(() => {
    analyze({
      createdAfter,
      createdBefore,
      project,
    });
  }, [analyze, createdAfter, createdBefore, project]);

  return (
    <Stack className="App-users" spacing={2} position="sticky" top={0}>
      <ProjectList project={project} onProjectSelected={setProject} />
      <TextField
        label="Created After"
        type="date"
        value={createdAfter?.toISOString().substring(0, 10)}
        onChange={(newValue) => {
          const newDate = new Date(newValue.target.value);
          setCreatedAfter(newDate);
        }}
        InputLabelProps={{
          shrink: true,
        }}
        fullWidth
      />
      <TextField
        label="Created Before"
        type="date"
        value={createdBefore?.toISOString().substring(0, 10)}
        onChange={(newValue) => {
          const newDate = new Date(newValue.target.value);
          setCreatedBefore(newDate);
        }}
        InputLabelProps={{
          shrink: true,
        }}
        fullWidth
      />
      {children}
      <LoadingButton startIcon={<AnalyticsIcon />} loading={isLoading} onClick={handleAnalyze}>
        Analyze
      </LoadingButton>
    </Stack>
  );
}
