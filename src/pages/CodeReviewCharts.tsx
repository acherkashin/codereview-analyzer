import { useCallback, useMemo, useState } from 'react';
import { getFilteredComments, getFilteredDiscussions, UserDiscussion } from './../utils/GitLabUtils';
import { BaseChartTooltip, ChartContainer, CommentList, DiscussionList, FullScreenDialog } from '../components';
import { Button, Stack } from '@mui/material';
import SpeakerNotesOutlinedIcon from '@mui/icons-material/SpeakerNotesOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import { downloadComments } from '../utils/ExcelUtils';
import {
  getAnalyze,
  getComments,
  getCommentsLeft,
  getCommentsLeftPieChart,
  getCommentsReceived,
  getCommentsReceivedPieChart,
  getCreatedPullRequestsPieChart,
  getDiscussionsLeft,
  getDiscussionsReceived,
  getDiscussionsReceivedPieChart,
  getDiscussionsStartedPieChart,
  useChartsStore,
} from '../stores/ChartsStore';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { useOpen } from '../hooks/useOpen';
import { InputDialog } from '../components/dialogs/ExportToExcelDialog';
import { downloadFile } from '../utils/FileUtils';
import { ImportTextButton } from '../components/FileUploadButton';
import { getHostType, useAuthStore, useClient } from '../stores/AuthStore';
import { FilterPanel } from '../components/FilterPanel/FilterPanel';
import { PageContainer } from './PageContainer';
import { AnalyzeParams, Comment, PullRequest, User } from './../clients/types';
import { CommentItemProps } from '../components/CommentList';
import { CodeReviewTiles } from './CodeReviewTiles';
import { TopPullRequestsChart } from '../components/charts/TopPullRequests';
import { ReviewByUserChart } from '../components/charts/ReviewByUserChart';
import { CommentedFilesChart } from '../components/charts/CommentedFilesChart/CommentedFilesChart';
import { CommentsPerMonthChart } from '../components/charts/CommentsPerMonthChart/CommentsPerMonthChart';
import { WordsCloud } from '../components/charts/WordsCloud/WordsCloud';

export interface CodeReviewChartsProps {}

export function CodeReviewCharts(_: CodeReviewChartsProps) {
  const client = useClient();
  const excelDialog = useOpen();

  const pullRequests = useChartsStore((state) => state.pullRequests);
  const users = useChartsStore((state) => state.users);
  const importData = useChartsStore((state) => state.import);
  const comments = useChartsStore(getComments);
  const discussions = useMemo(() => [], []); // useChartsStore((state) => state.discussions);
  const analyze = useChartsStore(getAnalyze);
  const discussionsLeft = useChartsStore(getDiscussionsLeft);
  const discussionsReceived = useChartsStore(getDiscussionsReceived);
  const commentsLeft = useChartsStore(getCommentsLeft);
  const commentsReceived = useChartsStore(getCommentsReceived);
  const commentsReceivedPieChart = useChartsStore(getCommentsReceivedPieChart);
  const commentsLeftByPieChart = useChartsStore(getCommentsLeftPieChart);
  const discussionsReceivedPieChart = useChartsStore(getDiscussionsReceivedPieChart);
  const discussionsStartedPieChart = useChartsStore(getDiscussionsStartedPieChart);
  const createdPullRequestsPieChart = useChartsStore(getCreatedPullRequestsPieChart);

  const [title, setTitle] = useState('');
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [filteredDiscussions, setFilteredDiscussions] = useState<UserDiscussion[]>([]);

  const hostType = useAuthStore(getHostType);

  const showFilteredComments = useCallback(
    (reviewerName: string | null, authorName: string | null) => {
      const filteredComments = getFilteredComments(comments, reviewerName, authorName);

      let title = '';
      if (reviewerName && authorName) {
        title = `Comments received by ${authorName} from ${reviewerName}`;
      } else if (reviewerName) {
        title = `Comments left by ${reviewerName}`;
      } else if (authorName) {
        title = `Comments received by ${authorName}`;
      }

      title += `. Total: ${filteredComments.length}`;

      setTitle(title);
      setFilteredComments(filteredComments);
    },
    [comments]
  );

  const showFilteredDiscussions = useCallback(
    (reviewerName: string | null, authorName: string | null) => {
      const filteredDiscussions = getFilteredDiscussions(discussions, reviewerName, authorName);

      let title = '';
      if (reviewerName && authorName) {
        title = `Discussions started by ${reviewerName} with ${authorName}`;
      } else if (reviewerName) {
        title = `Discussions started by ${reviewerName}`;
      } else if (authorName) {
        title = `Discussions started with ${authorName}`;
      }
      title += `. Total: ${filteredDiscussions.length}`;

      setTitle(title);
      setFilteredDiscussions(filteredDiscussions);
    },
    [discussions]
  );

  const handleDownload = (fileName: string) => {
    if (filteredComments != null && filteredComments.length !== 0) {
      downloadComments(fileName, filteredComments);
    }
    if (comments != null && comments.length !== 0) {
      downloadComments(fileName, comments);
    }
  };

  const handleAnalyze = useCallback(
    (params: AnalyzeParams) => {
      return analyze(client, params);
    },
    [analyze, client]
  );

  return (
    <PageContainer>
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <CodeReviewTiles />
        <div className="charts">
          <CommentsPerMonthChart comments={comments} />
          <ReviewByUserChart pullRequests={pullRequests} users={users} />
          <WordsCloud comments={comments} />
          <TopPullRequestsChart pullRequests={pullRequests} count={10} />
          {discussionsReceivedPieChart && hostType == 'Gitlab' && (
            <ChartContainer title="Discussions started with person">
              <PieChart
                data={discussionsReceivedPieChart}
                onClick={(e) => {
                  const authorName = e.id as string;
                  showFilteredDiscussions(null, authorName);
                }}
              />
            </ChartContainer>
          )}
          {discussionsStartedPieChart && hostType == 'Gitlab' && (
            <ChartContainer title="Discussions started by person">
              <PieChart
                data={discussionsStartedPieChart}
                onClick={(e) => {
                  const reviewerName = e.id as string;
                  showFilteredDiscussions(reviewerName, null);
                }}
              />
            </ChartContainer>
          )}
          {commentsReceivedPieChart && (
            <ChartContainer title="Comments received by person">
              <PieChart
                data={commentsReceivedPieChart}
                onClick={(e) => {
                  showFilteredComments(null, e.id as string);
                }}
              />
            </ChartContainer>
          )}
          {commentsLeftByPieChart && (
            <ChartContainer title="Comments left by person">
              <PieChart
                data={commentsLeftByPieChart}
                onClick={(e) => {
                  showFilteredComments(e.id as string, null);
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
                const reviewerName = e.indexValue as string;

                showFilteredComments(reviewerName, e.id as string);
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
                const authorName = e.indexValue as string;

                showFilteredComments(e.id as string, authorName);
              }}
            />
          </ChartContainer>
          {hostType == 'Gitlab' && (
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
                  const authorName = e.id as string;
                  const reviewerName = e.indexValue as string;
                  showFilteredDiscussions(reviewerName, authorName);
                }}
              />
            </ChartContainer>
          )}
          {hostType == 'Gitlab' && (
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
                  const authorName = e.indexValue as string;
                  const reviewerName = e.id as string;
                  showFilteredDiscussions(reviewerName, authorName);
                }}
              />
            </ChartContainer>
          )}
          <ChartContainer title="Pull Requests Created">
            <BarChart {...createdPullRequestsPieChart} onClick={() => {}} />
          </ChartContainer>
          {hostType == 'Gitea' && <CommentedFilesChart comments={comments} />}
        </div>
      </div>
      <Stack spacing={2} position="sticky" top={10}>
        <FilterPanel onAnalyze={handleAnalyze} />
        <Button disabled={comments.length === 0} startIcon={<FileDownloadIcon />} onClick={excelDialog.open}>
          Download as Excel
        </Button>
        <Button
          disabled={comments.length === 0 && discussions.length === 0}
          startIcon={<FileDownloadIcon />}
          onClick={() => {
            // Need to specify Range <StartDate>-<EndDate> as a default name
            downloadFile('newFile.json', JSON.stringify({ pullRequests, users }, null, 2));
          }}
        >
          Export as JSON
        </Button>
        <ImportTextButton
          label="Import as JSON"
          onTextSelected={(text) => {
            try {
              const { pullRequests, users } = JSON.parse(text as string) as { pullRequests: PullRequest[]; users: User[] };
              importData({ pullRequests, users });
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
      <FullScreenDialog
        icon={<SpeakerNotesOutlinedIcon />}
        title={title}
        open={filteredComments.length !== 0}
        onClose={() => {
          setFilteredComments([]);
        }}
      >
        <CommentList
          comments={filteredComments.map(
            (item) =>
              ({
                id: item.id,
                avatarUrl: item.prAuthorAvatarUrl,
                title: item.pullRequestName,
                commentUrl: item.url,
                noteText: item.body,
              } as CommentItemProps)
          )}
        />
      </FullScreenDialog>
      <FullScreenDialog
        icon={<QuestionAnswerOutlinedIcon />}
        title={title}
        open={filteredDiscussions.length !== 0}
        onClose={() => {
          setFilteredDiscussions([]);
        }}
      >
        <DiscussionList discussions={filteredDiscussions} />
      </FullScreenDialog>
    </PageContainer>
  );
}
