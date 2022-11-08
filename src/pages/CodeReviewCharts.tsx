import { useCallback, useContext, useMemo, useState } from 'react';
import { barChartSettings, convertToCommentsLeftToUsers, convertToCommentsReceivedFromUsers } from '../utils/ChartUtils';
import { getFilteredComments, UserComment } from './../utils/GitLabUtils';
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
import { AppContext } from './AppContext';
import {
  getAnalyze,
  getCommentsLeft,
  getCommentsReceived,
  getDiscussionsLeft,
  getDiscussionsReceived,
  useChartsStore,
} from './ChartsStore';
import { useRequest } from '../hooks';
import LoadingButton from '@mui/lab/LoadingButton';

export interface CodeReviewChartsProps {}

export function CodeReviewCharts() {
  const { client } = useContext(AppContext);

  const comments = useChartsStore((state) => state.comments);
  const discussions = useChartsStore((state) => state.discussions);
  const { makeRequest: analyze, isLoading } = useRequest(useChartsStore(getAnalyze));
  const discussionsLeft = useChartsStore(getDiscussionsLeft);
  const discussionsReceived = useChartsStore(getDiscussionsReceived);
  const commentsLeft = useChartsStore(getCommentsLeft);
  const commentsReceived = useChartsStore(getCommentsReceived);

  const [selectedUser, selectUser] = useLocalStorage<UserSchema | null>('user', null);
  const [project, setProject] = useLocalStorage<ProjectSchema | null>('project', null);

  const [createdBefore, setCreatedBefore] = useState<Date>(new Date());
  const [createdAfter, setCreatedAfter] = useState<Date>(new Date(new Date().setMonth(new Date().getMonth() - 1)));
  const [filteredComments, setFilteredComments] = useState<UserComment[]>([]);

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

  return (
    <Box style={{ display: 'flex' }}>
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
        <LoadingButton
          loading={isLoading}
          onClick={() => {
            analyze(client, project.id, createdAfter, createdBefore);
          }}
        >
          Analyze
        </LoadingButton>
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
    </Box>
  );
}
