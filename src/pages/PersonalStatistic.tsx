import { useCallback } from 'react';
import { ChartContainer, FilterPanel, UserSelect } from '../components';
import { BarChart, PieChart } from '../components/charts';
import {
  getAnalyze,
  useChartsStore,
  useCommentsLeftToUsers,
  useCommentsReceivedFromUsers,
  // useWhoApprovesMergeRequests,
  useWhoAssignsToAuthorToReviewPieChart,
  useWhomAssignedToReviewPieChart,
} from '../stores/ChartsStore';
import { useClient } from '../stores/AuthStore';
import { useLocalStorage } from '../hooks';
import { PageContainer } from './PageContainer';
import { AnalyzeParams, User } from '../services/types';

export function PersonalStatistic() {
  const analyze = useChartsStore(getAnalyze);
  const client = useClient();

  const handleAnalyze = useCallback(
    (params: AnalyzeParams) => {
      return analyze(client, params);
    },
    [analyze, client]
  );

  const [selectedUser, selectUser] = useLocalStorage<User | undefined>('personal-statistic-user', undefined);
  const assignedToReviewPieChart = useWhomAssignedToReviewPieChart(selectedUser?.id);
  const whoAssignsToReviewPieChart = useWhoAssignsToAuthorToReviewPieChart(selectedUser?.id);
  const commentsReceivedFromUsers = useCommentsReceivedFromUsers(selectedUser?.id);
  const commentsLeftToUsers = useCommentsLeftToUsers(selectedUser?.id);
  // const { whoApprovesUser, whomUserApproves } = useWhoApprovesMergeRequests(client, project?.id, selectedUser?.id);

  return (
    <PageContainer>
      <div className="charts">
        {selectedUser && assignedToReviewPieChart && (
          <ChartContainer title={`${selectedUser?.userName} asks following people to review his changes`}>
            <PieChart data={assignedToReviewPieChart} />
          </ChartContainer>
        )}
        {selectedUser && whoAssignsToReviewPieChart && (
          <ChartContainer title={`Following people ask ${selectedUser?.userName} to review their changes`}>
            <PieChart data={whoAssignsToReviewPieChart} />
          </ChartContainer>
        )}
        {/*  {selectedUser && whoApprovesUser && (
           <ChartContainer title={`Following people approves ${selectedUser?.name} changes`}>
             <PieChart data={whoApprovesUser} />
           </ChartContainer>
         )}
         {selectedUser && whomUserApproves && (
           <ChartContainer title={`${selectedUser?.name} approves changes of following people`}>
             <PieChart data={whomUserApproves} />
           </ChartContainer>
         )} */}
        {selectedUser && commentsLeftToUsers && (
          <ChartContainer title={`${selectedUser?.fullName} leaves comments to following people`}>
            <BarChart
              {...commentsLeftToUsers}
              onClick={(e) => {
                // updateComments(selectedUser.username, e.data.author as string);
              }}
            />
          </ChartContainer>
        )}
        {selectedUser && commentsReceivedFromUsers && (
          <ChartContainer title={`Following people leave comments to ${selectedUser?.fullName}`}>
            <BarChart
              {...commentsReceivedFromUsers}
              onClick={(e) => {
                //   updateComments(e.data.reviewer as string, selectedUser.username);
              }}
            />
          </ChartContainer>
        )}
      </div>
      <FilterPanel onAnalyze={handleAnalyze} style={{ position: 'sticky', top: 10 }}>
        <UserSelect label="Author" user={selectedUser} onSelected={selectUser} />
      </FilterPanel>
    </PageContainer>
  );
}
