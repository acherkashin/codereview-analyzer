import { useCallback, useEffect } from 'react';
import { MergeRequest } from '../components/MergeRequest';
import { useLocalStorage, useRequest } from '../hooks';
import { FullSizeProgress, ProjectList } from '../components';
import { useClient } from '../stores/AuthStore';
import { PageContainer } from './PageContainer';
import { Client, Project } from '../clients/types';
import { timeSince } from '../utils/TimeSpanUtils';

export interface ReadyMergeRequestsProps {}

export function ReadyMergeRequests(_: ReadyMergeRequestsProps) {
  const client = useClient();
  const requestMergeRequests = useCallback(
    (project: Project) => {
      return client.analyze({
        project,
        state: 'open',
        pullRequestCount: Number.MAX_VALUE,
      });
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

// function getReadyTime(mr: PullRequest) {
// //TODO: need to add this info to the PullRequest interface and calculate separately for gitlab and gitea
//   const readyNote = mr.notes.find((item) => item.body === 'marked this merge request as **ready**');
//   return readyNote?.created_at ?? mr.mergeRequest.created_at;
// }
