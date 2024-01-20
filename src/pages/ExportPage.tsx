import { Button, CircularProgress, Typography } from '@mui/material';
import { useRequest } from '../hooks';
import { useClient } from '../stores/AuthStore';
import { useExportsStore } from '../stores/ExportStore';
import { PageContainer } from './PageContainer';
import { LoadingButton } from '@mui/lab';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { downloadFile } from '../utils/FileUtils';
import { CheckBoxProjectList } from '../components/CheckBoxProjectList';
import { useEffect } from 'react';

const { version } = require('./../../package.json');

export function ExportPage() {
  const handleExport = useExportsStore((store) => store.export);
  const fetchProjects = useExportsStore((store) => store.fetchProjects);
  const setProjectsToExport = useExportsStore((store) => store.setProjectsToExport);
  const allProjects = useExportsStore((store) => store.allProjects);
  const exportData = useExportsStore((store) => store.exportData);
  const client = useClient();
  const { isLoading: isExporting, makeRequest } = useRequest(handleExport);
  const { isLoading: isLoadingProjects, makeRequest: requestProjects } = useRequest(fetchProjects);

  useEffect(() => {
    if (allProjects == null || allProjects.length === 0) {
      //TODO: remove any
      requestProjects(client);
    }
  }, [allProjects, client, requestProjects]);

  return (
    <PageContainer style={{ flexDirection: 'row' }}>
      <section style={{ width: 300, height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Typography variant="h2">Projects</Typography>
        {isLoadingProjects && <CircularProgress style={{ alignSelf: 'center' }} />}
        <div style={{ overflow: 'auto' }}>
          {allProjects != null && <CheckBoxProjectList projects={allProjects} onChange={setProjectsToExport} />}
        </div>
      </section>
      <div>
        <LoadingButton loading={isExporting} onClick={() => makeRequest(client as any)}>
          Export
        </LoadingButton>
        <Button
          disabled={exportData == null}
          startIcon={<FileDownloadIcon />}
          onClick={() => {
            // Need to specify Range <StartDate>-<EndDate> as a default name
            downloadFile('newFile.json', JSON.stringify({ ...exportData, version }, null, 2));
          }}
        >
          Export as JSON
        </Button>
      </div>
    </PageContainer>
  );
}
