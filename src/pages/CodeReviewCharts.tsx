import { useCallback, useMemo, useState } from 'react';
import {
  barChartSettings,
  convertToCommentsLeft,
  convertToCommentsLeftToUsers,
  convertToCommentsReceived,
  convertToCommentsReceivedFromUsers,
  convertToDiscussionsLeft,
  convertToDiscussionsReceived,
} from '../utils/ChartUtils';
import { getFilteredComments, getUserComments, getDiscussions, UserComment, UserDiscussion } from './../utils/GitLabUtils';
import {
  pieChartSettings,
  convertToCommentsLeftPieChart,
  convertToCommentsReceivedPieChart,
  convertToDiscussionsReceivedPieChart,
  convertToDiscussionsStartedPieChart,
} from '../utils/PieChartUtils';
import { UserSchema, ProjectSchema } from '@gitbeaker/core/dist/types/types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { BaseChartTooltip, ChartContainer, CommentList, DiscussionList, ProjectList, UserSelect } from '../components';
import { Box, Button, TextField, Stack } from '@mui/material';
import { Pie } from '@nivo/pie';
import { Bar } from '@nivo/bar';
import { downloadComments } from '../utils/ExcelUtils';
import { Resources } from '@gitbeaker/core';

export interface CodeReviewChartsProps {
  client: Resources.Gitlab;
}

export function CodeReviewCharts({ client }: CodeReviewChartsProps) {
  const [selectedUser, selectUser] = useLocalStorage<UserSchema | null>('user', null);
  const [project, setProject] = useLocalStorage<ProjectSchema | null>('project', null);

  const [comments, setComments] = useState<UserComment[]>([]);
  const [discussions, setDiscussions] = useState<UserDiscussion[]>([]);

  const [createdBefore, setCreatedBefore] = useState<Date>(new Date());
  const [createdAfter, setCreatedAfter] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [filteredComments, setFilteredComments] = useState<UserComment[]>([]);

  const handleAnalyze = () => {
    Promise.all([showComments(), showDiscussions()]);
  };
  const discussionsLeft = useMemo(() => convertToDiscussionsLeft(discussions), [discussions]);
  const discussionsReceived = useMemo(() => convertToDiscussionsReceived(discussions), [discussions]);
  const commentsLeft = useMemo(() => convertToCommentsLeft(comments), [comments]);
  const commentsReceived = useMemo(() => convertToCommentsReceived(comments), [comments]);
  const commentsReceivedFromUsers = useMemo(
    () => (selectedUser ? convertToCommentsReceivedFromUsers(comments, selectedUser.id) : null),
    [comments, selectedUser]
  );
  const commentsLeftToUsers = useMemo(
    () => (selectedUser ? convertToCommentsLeftToUsers(comments, selectedUser.id) : null),
    [comments, selectedUser]
  );
  const updateComments = useCallback(
    (reviewerName: string | null, authorName: string | null) => {
      setFilteredComments(getFilteredComments(comments, reviewerName, authorName));
    },
    [comments]
  );

  const commentsReceivedPieChart = useMemo(() => convertToCommentsReceivedPieChart(comments), [comments]);
  const commentsLeftByPieChart = useMemo(() => convertToCommentsLeftPieChart(comments), [comments]);
  const discussionsReceivedPieChart = useMemo(() => convertToDiscussionsReceivedPieChart(discussions), [discussions]);
  const discussionsStartedPieChart = useMemo(() => convertToDiscussionsStartedPieChart(discussions), [discussions]);

  const showComments = async () => {
    try {
      if (!project) return;

      const comments = await getUserComments(client, {
        projectId: project.id,
        createdAfter: createdAfter.toISOString(),
        createdBefore: createdBefore.toISOString(),
      });

      setComments(comments);
    } catch (ex) {
      console.error(ex);
    }
  };

  const showDiscussions = async () => {
    try {
      if (!project) return;

      const discussions = await getDiscussions(client, {
        projectId: project.id,
        createdAfter: createdAfter.toISOString(),
        createdBefore: createdBefore.toISOString(),
      });

      setDiscussions(discussions);

      console.log(discussions);
    } catch (ex) {
      console.error(ex);
    }
  };

  return (
    <Box style={{ display: 'flex' }}>
      <Stack className="App-users" spacing={2}>
        <ProjectList project={project} onProjectSelected={setProject} />
        <UserSelect label="Author" user={selectedUser} onUserSelected={selectUser} />
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
        <Button onClick={handleAnalyze}>Analyze</Button>
        <Button
          onClick={() => {
            if (filteredComments != null && filteredComments.length !== 0) {
              downloadComments(filteredComments);
            }
            if (comments != null && comments.length !== 0) {
              downloadComments(comments);
            }
          }}
        >
          Download
        </Button>
      </Stack>
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div className="charts">
          {discussionsReceivedPieChart && (
            <ChartContainer title="Discussions started with person">
              <Pie data={discussionsReceivedPieChart} {...pieChartSettings} onClick={(e) => console.log(e)} />
            </ChartContainer>
          )}
          {discussionsStartedPieChart && (
            <ChartContainer title="Discussions started by person">
              <Pie data={discussionsStartedPieChart} {...pieChartSettings} onClick={(e) => console.log(e)} />
            </ChartContainer>
          )}
          {commentsReceivedPieChart && (
            <ChartContainer title="Comments received by person">
              <Pie
                data={commentsReceivedPieChart}
                {...pieChartSettings}
                onClick={(e) => {
                  updateComments(null, e.id as string);
                }}
              />
            </ChartContainer>
          )}
          {commentsLeftByPieChart && (
            <ChartContainer title="Comments left by person">
              <Pie
                data={commentsLeftByPieChart}
                {...pieChartSettings}
                onClick={(e) => {
                  updateComments(e.id as string, null);
                }}
              />
            </ChartContainer>
          )}
          {selectedUser && commentsLeftToUsers && (
            <ChartContainer title={`${selectedUser?.name} reviews following people`}>
              <Bar
                {...barChartSettings}
                {...commentsLeftToUsers}
                onClick={(e) => {
                  updateComments(selectedUser.username, e.data.author as string);
                }}
              />
            </ChartContainer>
          )}
          {selectedUser && commentsReceivedFromUsers && (
            <ChartContainer title={`Following people review ${selectedUser?.name}`}>
              <Bar
                {...barChartSettings}
                {...commentsReceivedFromUsers}
                onClick={(e) => {
                  updateComments(e.data.reviewer as string, selectedUser.username);
                }}
              />
            </ChartContainer>
          )}
          <ChartContainer title="Comments left by person">
            <Bar
              {...barChartSettings}
              {...commentsLeft}
              tooltip={(props) => {
                const { indexValue, value, id } = props;

                return (
                  <BaseChartTooltip {...props}>
                    <strong>{indexValue}</strong> left <strong>{value}</strong> comments to <strong>{id}</strong>
                  </BaseChartTooltip>
                );
              }}
              onClick={(e) => {
                updateComments(e.indexValue as string, e.id as string);
              }}
            />
          </ChartContainer>

          <ChartContainer title="Comments received by person">
            <Bar
              {...barChartSettings}
              {...commentsReceived}
              tooltip={(props) => {
                const { indexValue, value, id } = props;

                return (
                  <BaseChartTooltip {...props}>
                    <strong>{id}</strong> left <strong>{value}</strong> comments to <strong>{indexValue}</strong>
                  </BaseChartTooltip>
                );
              }}
              onClick={(e) => {
                updateComments(e.id as string, e.indexValue as string);
              }}
            />
          </ChartContainer>
          <ChartContainer title="Discussions started by person">
            <Bar
              {...barChartSettings}
              {...discussionsLeft}
              tooltip={(props) => {
                const { indexValue, value, id } = props;

                return (
                  <BaseChartTooltip {...props}>
                    <strong>{indexValue}</strong> started <strong>{value}</strong> discussions with <strong>{id}</strong>
                  </BaseChartTooltip>
                );
              }}
              onClick={(e) => {
                console.log(e);
              }}
            />
          </ChartContainer>
          <ChartContainer title="Discussions started with person">
            <Bar
              {...barChartSettings}
              {...discussionsReceived}
              tooltip={(props) => {
                const { indexValue, value, id } = props;

                return (
                  <BaseChartTooltip {...props}>
                    <strong>{id}</strong> started <strong>{value}</strong> discussions with <strong>{indexValue}</strong>
                  </BaseChartTooltip>
                );
              }}
              onClick={(e) => {
                console.log(e);
              }}
            />
          </ChartContainer>
        </div>
        <DiscussionList discussions={discussions} />
        <CommentList comments={filteredComments} />
        Total: {filteredComments.length}
      </div>
    </Box>
  );
}
