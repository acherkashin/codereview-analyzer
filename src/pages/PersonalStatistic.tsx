import { useCallback, useState } from 'react';
import { Stack } from '@mui/material';
import { UserSchema } from '@gitbeaker/core/dist/types/types';
import { ChartContainer, FilterPanel, UserSelect } from '../components';
import { BarChart, PieChart } from '../components/charts';
import {
  getAnalyze,
  useChartsStore,
  useCommentsLeftToUsers,
  useCommentsReceivedFromUsers,
  useWhoApprovesMergeRequests,
  useWhoAssignsToAuthorToReviewPieChart,
  useWhomAssignedToReviewPieChart,
} from '../stores/ChartsStore';
import { ProjectSchema } from '@gitbeaker/core/dist/types/types';
import { getCurrentUser, useAuthStore, useClient } from '../stores/AuthStore';
import { useLocalStorage } from '../hooks';
import { FilterPanelState } from '../components/FilterPanel/FilterPanel';

export function PersonalStatistic() {
  const analyze = useChartsStore(getAnalyze);
  const client = useClient();
  const [project, setProject] = useState<ProjectSchema | null>(null);

  const handleAnalyze = useCallback(
    ({ project, createdAfter, createdBefore }: FilterPanelState) => {
      setProject(project);
      return analyze(client, project.id, createdAfter, createdBefore);
    },
    [analyze, client]
  );

  const currentUser = useAuthStore(getCurrentUser);
  const assignedToReviewPieChart = useWhomAssignedToReviewPieChart(currentUser?.id);
  const whoAssignsToReviewPieChart = useWhoAssignsToAuthorToReviewPieChart(currentUser?.id);
  const commentsReceivedFromUsers = useCommentsReceivedFromUsers(currentUser?.id);
  const commentsLeftToUsers = useCommentsLeftToUsers(currentUser?.id);
  const approvedMrs = useWhoApprovesMergeRequests(client, project?.id, currentUser?.id);

  const [selectedUser, selectUser] = useLocalStorage<UserSchema | null>('user', null);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', justifyContent: 'center', alignContent: 'center' }}>
      <div className="charts">
        {currentUser && assignedToReviewPieChart && (
          <ChartContainer title={`${currentUser?.name} asks following people to review his changes`}>
            <PieChart data={assignedToReviewPieChart} />
          </ChartContainer>
        )}
        {currentUser && whoAssignsToReviewPieChart && (
          <ChartContainer title={`Following people ask ${currentUser?.name} to review their changes`}>
            <PieChart data={whoAssignsToReviewPieChart} />
          </ChartContainer>
        )}
        {currentUser && approvedMrs && (
          <ChartContainer title={`Following people approves ${currentUser?.name} changes`}>
            <PieChart data={approvedMrs} />
          </ChartContainer>
        )}
        {currentUser && commentsLeftToUsers && (
          <ChartContainer title={`${currentUser?.name} leaves comments to following people`}>
            <BarChart
              {...commentsLeftToUsers}
              onClick={(e) => {
                // updateComments(currentUser.username, e.data.author as string);
              }}
            />
          </ChartContainer>
        )}
        {currentUser && commentsReceivedFromUsers && (
          <ChartContainer title={`Following people leave comments to ${currentUser?.name}`}>
            <BarChart
              {...commentsReceivedFromUsers}
              onClick={(e) => {
                // updateComments(e.data.reviewer as string, currentUser.username);
              }}
            />
          </ChartContainer>
        )}
      </div>
      <Stack className="App-users" spacing={2} position="sticky" top={0}>
        <FilterPanel onAnalyze={handleAnalyze}>
          <UserSelect label="Author" user={selectedUser} onUserSelected={selectUser} />
        </FilterPanel>
      </Stack>
    </div>
  );
}
