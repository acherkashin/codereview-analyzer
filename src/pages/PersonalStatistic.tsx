import { ChartContainer } from '../components';
import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { useChartsStore, useWhomAssignedToReviewPieChart } from '../stores/ChartsStore';
import { getCurrentUser, useAuthStore } from '../stores/AuthStore';
import { useMemo } from 'react';
import { convertToCommentsLeftToUsers, convertToCommentsReceivedFromUsers } from '../utils/ChartUtils';

export function PersonalStatistic() {
  const comments = useChartsStore((state) => state.comments);
  const currentUser = useAuthStore(getCurrentUser);
  const assignedToReviewPieChart = useWhomAssignedToReviewPieChart(currentUser?.id);
  const whoAssignsToReviewPieChart = useWhomAssignedToReviewPieChart(currentUser?.id);
  const commentsReceivedFromUsers = useMemo(
    () => (currentUser ? convertToCommentsReceivedFromUsers(comments, currentUser.id) : null),
    [comments, currentUser]
  );
  const commentsLeftToUsers = useMemo(
    () => (currentUser ? convertToCommentsLeftToUsers(comments, currentUser.id) : null),
    [comments, currentUser]
  );

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
    </div>
  );
}
