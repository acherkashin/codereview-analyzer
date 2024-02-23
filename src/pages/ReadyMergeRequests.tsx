import { useCallback, useEffect } from 'react';
import { MergeRequest } from '../components/MergeRequest';
import { useLocalStorage, useRequest } from '../hooks';
import { FullSizeProgress, ProjectList } from '../components';
import { useClient } from '../stores/AuthStore';
import { PageContainer } from './PageContainer';
import { Project } from '../services/types';
import { convert } from '../services/GitConverter';

export interface ReadyMergeRequestsProps {}

export function ReadyMergeRequests(_: ReadyMergeRequestsProps) {
  const client = useClient();
  const requestMergeRequests = useCallback(
    async (project: Project) => {
      const data = await client.fetch({
        project,
        state: 'open',
        pullRequestCount: Number.MAX_VALUE,
      });
      const { pullRequests } = convert(data);

      return pullRequests.filter((item) => item.readyAt != null);
    },
    [client]
  );
  const { makeRequest, response: mrs, isLoading } = useRequest(requestMergeRequests);
  const [project, setProject] = useLocalStorage<Project | undefined>('ready-merge-request-project', undefined);

  useEffect(() => {
    if (project == null) return;

    makeRequest(project);
  }, [client, makeRequest, project]);

  return (
    <PageContainer>
      <div style={{ display: 'flex', flexDirection: 'column', width: 800, margin: '0 auto' }}>
        <ProjectList project={project} onSelected={setProject} />
        {mrs && !isLoading && (
          <>
            <div>Merge Requests: {mrs.length}</div>
            <ul>
              {mrs.map((item) => (
                <MergeRequest key={item.id} pullRequest={item} />
              ))}
            </ul>
          </>
        )}
        {isLoading && <FullSizeProgress />}
      </div>
    </PageContainer>
  );
}
