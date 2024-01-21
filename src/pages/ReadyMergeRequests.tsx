import { useCallback, useEffect } from 'react';
import { MergeRequest } from '../components/MergeRequest';
import { useLocalStorage, useRequest } from '../hooks';
import { FullSizeProgress, ProjectList } from '../components';
import { useClient } from '../stores/AuthStore';
import { PageContainer } from './PageContainer';
import { Client, MergeRequestForPage, Project } from '../clients/types';
import { timeSince } from '../utils/TimeSpanUtils';

export interface ReadyMergeRequestsProps {}

export function ReadyMergeRequests(_: ReadyMergeRequestsProps) {
  const client = useClient();
  const requestMergeRequests = useCallback((project: Project) => getReadyMergeRequestsForPage(client, project), [client]);
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
                <MergeRequest key={item.item.id} {...item} />
              ))}
            </ul>
          </>
        )}
        {isLoading && <FullSizeProgress />}
      </div>
    </PageContainer>
  );
}

//TODO: rename somehow
export async function getReadyMergeRequestsForPage(client: Client, project: Project): Promise<MergeRequestForPage[]> {
  const mrs = await client.analyze({
    //TODO: probably it doesn't work for gitlab, probably need to pass whole project object to analyze method
    projectId: project.name,
    state: 'open',
    owner: project.owner,
    pullRequestCount: Number.MAX_VALUE,
  });

  console.log(mrs);

  return mrs.map((item) => {
    return {
      item,
      // readyTime: getReadyTime(item),
      // readyPeriod: timeSince(new Date(getReadyTime(item))),
    };
  });
  // .sort((item1, item2) => item2.readyPeriod._milliseconds - item1.readyPeriod._milliseconds);
}

// function getReadyTime(mr: PullRequest) {
// //TODO: need to add this info to the PullRequest interface and calculate separately for gitlab and gitea
//   const readyNote = mr.notes.find((item) => item.body === 'marked this merge request as **ready**');
//   return readyNote?.created_at ?? mr.mergeRequest.created_at;
// }
