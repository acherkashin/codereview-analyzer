import { LoadingButton } from '@mui/lab';
import { Stack, TextField } from '@mui/material';
import { ProjectList } from '../ProjectList';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { useCallback, useState } from 'react';
import { useLocalStorage, useRequest } from '../../hooks';
import { AnalyzeParams, Project } from '../../services/types';
import { getHostType, useAuthStore } from '../../stores/AuthStore';

export interface FilterPanelProps {
  onAnalyze: (state: AnalyzeParams) => Promise<any>;
  children?: React.ReactElement;
  style?: React.CSSProperties;
}

export function FilterPanel({ onAnalyze, children, style }: FilterPanelProps) {
  const [createdBefore, setCreatedBefore] = useState<Date>(new Date());
  const [createdAfter, setCreatedAfter] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [project, setProject] = useLocalStorage<Project | undefined>('project', undefined);
  const [prCount, setPrCount] = useState(100);

  const { makeRequest: analyze, isLoading } = useRequest(onAnalyze);
  const hostType = useAuthStore(getHostType);

  const handleAnalyze = useCallback(() => {
    if (!project) {
      return;
    }

    analyze({
      createdAfter,
      createdBefore,
      project,
      pullRequestCount: prCount,
    });
  }, [analyze, createdAfter, createdBefore, prCount, project]);

  return (
    <Stack className="App-users" spacing={2} position="sticky" top={0} style={style}>
      <ProjectList project={project} onSelected={setProject} />
      {hostType === 'Gitea' && (
        <TextField
          type="number"
          label="Pull Requests Count"
          value={prCount}
          onChange={(e) => setPrCount(parseInt(e.target.value))}
        />
      )}
      {hostType === 'Gitlab' && (
        <>
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
        </>
      )}
      {children}
      <LoadingButton disabled={project == null} startIcon={<AnalyticsIcon />} loading={isLoading} onClick={handleAnalyze}>
        Analyze
      </LoadingButton>
    </Stack>
  );
}
