import { LoadingButton } from '@mui/lab';
import { Stack, TextField } from '@mui/material';
import { ProjectList } from '../ProjectList';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import { useCallback, useState } from 'react';
import { useLocalStorage, useRequest } from '../../hooks';
import { AnalyzeParams, Project } from '../../services/types';
import { getHostType, useAuthStore } from '../../stores/AuthStore';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs, { Dayjs } from 'dayjs';

export interface FilterPanelProps {
  onAnalyze: (state: AnalyzeParams) => Promise<any>;
  children?: React.ReactElement;
  style?: React.CSSProperties;
}

export function FilterPanel({ onAnalyze, children, style }: FilterPanelProps) {
  const [createdBefore, setCreatedBefore] = useState<Dayjs | null>(dayjs(new Date()));
  const [createdAfter, setCreatedAfter] = useState<Dayjs | null>(dayjs().subtract(1, 'month'));
  const [project, setProject] = useLocalStorage<Project | undefined>('project', undefined);
  const [prCount, setPrCount] = useState(100);

  const { makeRequest: analyze, isLoading } = useRequest(onAnalyze);
  const hostType = useAuthStore(getHostType);

  const handleAnalyze = useCallback(() => {
    if (!project || !createdAfter || !createdBefore) {
      alert('Please select project and time frame');
      return;
    }

    analyze({
      createdAfter: createdAfter.toDate(),
      createdBefore: createdBefore.toDate(),
      project,
      pullRequestCount: prCount,
      state: 'all',
    });
  }, [analyze, createdAfter, createdBefore, prCount, project]);

  return (
    <Stack spacing={2} position="sticky" top={0} style={style}>
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
          <DatePicker
            label="Created After"
            format="DD/MM/YYYY"
            value={createdAfter}
            onChange={(newValue) => {
              setCreatedAfter(newValue);
            }}
          />
          <DatePicker
            label="Created Before"
            format="DD/MM/YYYY"
            value={createdBefore}
            onChange={(newValue) => {
              setCreatedBefore(newValue);
            }}
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
