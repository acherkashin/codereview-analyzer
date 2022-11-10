import { useCallback, useContext, useMemo, useState } from 'react';
import { getFilteredComments, UserComment } from './../utils/GitLabUtils';
import { UserSchema, ProjectSchema } from '@gitbeaker/core/dist/types/types';
import { useLocalStorage } from '../hooks/useLocalStorage';
import { BaseChartTooltip, ChartContainer, CommentList, DiscussionList, ProjectList, UserSelect } from '../components';
import { Box, Button, TextField, Stack } from '@mui/material';
import { downloadComments } from '../utils/ExcelUtils';
import { AppContext } from './AppContext';
import {
  getAnalyze,
  getCommentsLeft,
  getCommentsLeftPieChart,
  getCommentsReceived,
  getCommentsReceivedPieChart,
  getDiscussionsLeft,
  getDiscussionsReceived,
  getDiscussionsReceivedPieChart,
  getDiscussionsStartedPieChart,
  useChartsStore,
} from './ChartsStore';
import { useRequest } from '../hooks';
import LoadingButton from '@mui/lab/LoadingButton';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { BarChart } from '../components/charts/BarChart';
import { convertToCommentsLeftToUsers, convertToCommentsReceivedFromUsers } from '../utils/ChartUtils';
import { PieChart } from '../components/charts/PieChart';
import { useOpen } from '../hooks/useOpen';
import { InputDialog } from '../components/dialogs/ExportToExcelDialog';
import { downloadFile } from '../utils/FileUtils';
import { ImportTextButton } from '../components/FileUploadButton';

export interface CodeReviewChartsProps {}

export function CodeReviewCharts() {
  const { client } = useContext(AppContext);
  const excelDialog = useOpen();

  const comments = useChartsStore((state) => state.comments);
  const discussions = useChartsStore((state) => state.discussions);
  const setComments = useChartsStore((state) => state.setComments);
  const setDiscussions = useChartsStore((state) => state.setDiscussions);
  const { makeRequest: analyze, isLoading } = useRequest(useChartsStore(getAnalyze));
  const discussionsLeft = useChartsStore(getDiscussionsLeft);
  const discussionsReceived = useChartsStore(getDiscussionsReceived);
  const commentsLeft = useChartsStore(getCommentsLeft);
  const commentsReceived = useChartsStore(getCommentsReceived);
  const commentsReceivedPieChart = useChartsStore(getCommentsReceivedPieChart);
  const commentsLeftByPieChart = useChartsStore(getCommentsLeftPieChart);
  const discussionsReceivedPieChart = useChartsStore(getDiscussionsReceivedPieChart);
  const discussionsStartedPieChart = useChartsStore(getDiscussionsStartedPieChart);

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

  const handleDownload = (fileName: string) => {
    if (filteredComments != null && filteredComments.length !== 0) {
      downloadComments(fileName, filteredComments);
    }
    if (comments != null && comments.length !== 0) {
      downloadComments(fileName, comments);
    }
  };

  const handleAnalyze = () => {
    analyze(client, project.id, createdAfter, createdBefore);
  };

  return (
    <Box style={{ display: 'flex' }}>
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div className="charts">
          {discussionsReceivedPieChart && (
            <ChartContainer title="Discussions started with person">
              <PieChart data={discussionsReceivedPieChart} onClick={(e) => console.log(e)} />
            </ChartContainer>
          )}
          {discussionsStartedPieChart && (
            <ChartContainer title="Discussions started by person">
              <PieChart data={discussionsStartedPieChart} onClick={(e) => console.log(e)} />
            </ChartContainer>
          )}
          {commentsReceivedPieChart && (
            <ChartContainer title="Comments received by person">
              <PieChart
                data={commentsReceivedPieChart}
                onClick={(e) => {
                  updateComments(null, e.id as string);
                }}
              />
            </ChartContainer>
          )}
          {commentsLeftByPieChart && (
            <ChartContainer title="Comments left by person">
              <PieChart
                data={commentsLeftByPieChart}
                onClick={(e) => {
                  updateComments(e.id as string, null);
                }}
              />
            </ChartContainer>
          )}
          {selectedUser && commentsLeftToUsers && (
            <ChartContainer title={`${selectedUser?.name} reviews following people`}>
              <BarChart
                {...commentsLeftToUsers}
                onClick={(e) => {
                  updateComments(selectedUser.username, e.data.author as string);
                }}
              />
            </ChartContainer>
          )}
          {selectedUser && commentsReceivedFromUsers && (
            <ChartContainer title={`Following people review ${selectedUser?.name}`}>
              <BarChart
                {...commentsReceivedFromUsers}
                onClick={(e) => {
                  updateComments(e.data.reviewer as string, selectedUser.username);
                }}
              />
            </ChartContainer>
          )}
          <ChartContainer title="Comments left by person">
            <BarChart
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
            <BarChart
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
            <BarChart
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
            <BarChart
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
        <LoadingButton startIcon={<AnalyticsIcon />} loading={isLoading} onClick={handleAnalyze}>
          Analyze
        </LoadingButton>
        <Button disabled={comments.length === 0} startIcon={<FileDownloadIcon />} onClick={excelDialog.open}>
          Download as Excel
        </Button>
        <Button
          disabled={comments.length === 0 && discussions.length === 0}
          startIcon={<FileDownloadIcon />}
          onClick={() => {
            // Need to specify Range <StartDate>-<EndDate> as a default name
            downloadFile('newFile.json', JSON.stringify({ comments, discussions }, null, 2));
          }}
        >
          Export as JSON
        </Button>
        <ImportTextButton
          label="Import as JSON"
          onTextSelected={(text) => {
            try {
              const { comments, discussions } = JSON.parse(text as string);
              setComments(comments);
              setDiscussions(discussions);
            } catch (ex) {
              console.error(ex);
            }
          }}
        />
        <InputDialog
          title="Export comments to excel"
          fieldName="File Name"
          open={excelDialog.isOpen}
          onClose={excelDialog.close}
          onDownload={handleDownload}
        />
      </Stack>
    </Box>
  );
}
