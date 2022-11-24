import { useCallback, useState } from 'react';
import { getFilteredComments, getFilteredDiscussions, getNoteUrl, UserComment, UserDiscussion } from './../utils/GitLabUtils';
import { BaseChartTooltip, ChartContainer, CommentList, DiscussionList, FullScreenDialog } from '../components';
import { Button, Stack } from '@mui/material';
import SpeakerNotesOutlinedIcon from '@mui/icons-material/SpeakerNotesOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import { downloadComments } from '../utils/ExcelUtils';
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
} from '../stores/ChartsStore';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { BarChart } from '../components/charts/BarChart';
import { PieChart } from '../components/charts/PieChart';
import { useOpen } from '../hooks/useOpen';
import { InputDialog } from '../components/dialogs/ExportToExcelDialog';
import { downloadFile } from '../utils/FileUtils';
import { ImportTextButton } from '../components/FileUploadButton';
import { useClient } from '../stores/AuthStore';
import { FilterPanel, FilterPanelState } from '../components/FilterPanel/FilterPanel';
import { PageContainer } from './PageContainer';
import { CommentItemProps } from '../components/CommentList';

export interface CodeReviewChartsProps {}

export function CodeReviewCharts(_: CodeReviewChartsProps) {
  const client = useClient();
  const excelDialog = useOpen();

  const comments = useChartsStore((state) => state.comments);
  const discussions = useChartsStore((state) => state.discussions);
  const setComments = useChartsStore((state) => state.setComments);
  const setDiscussions = useChartsStore((state) => state.setDiscussions);
  const analyze = useChartsStore(getAnalyze);
  const discussionsLeft = useChartsStore(getDiscussionsLeft);
  const discussionsReceived = useChartsStore(getDiscussionsReceived);
  const commentsLeft = useChartsStore(getCommentsLeft);
  const commentsReceived = useChartsStore(getCommentsReceived);
  const commentsReceivedPieChart = useChartsStore(getCommentsReceivedPieChart);
  const commentsLeftByPieChart = useChartsStore(getCommentsLeftPieChart);
  const discussionsReceivedPieChart = useChartsStore(getDiscussionsReceivedPieChart);
  const discussionsStartedPieChart = useChartsStore(getDiscussionsStartedPieChart);

  const [title, setTitle] = useState('');
  const [filteredComments, setFilteredComments] = useState<UserComment[]>([]);
  const [filteredDiscussions, setFilteredDiscussions] = useState<UserDiscussion[]>([]);

  const showFilteredComments = useCallback(
    (reviewerName: string | null, authorName: string | null) => {
      if (reviewerName && authorName) {
        setTitle(`Comments received by ${authorName} from ${reviewerName}`);
      } else if (reviewerName) {
        setTitle(`Comments left by ${reviewerName}`);
      } else if (authorName) {
        setTitle(`Comments received by ${authorName}`);
      }

      setFilteredComments(getFilteredComments(comments, reviewerName, authorName));
    },
    [comments]
  );

  const showFilteredDiscussions = useCallback(
    (reviewerName: string | null, authorName: string | null) => {
      if (reviewerName && authorName) {
        setTitle(`Discussions started by ${reviewerName} with ${authorName}`);
      } else if (reviewerName) {
        setTitle(`Discussions started by ${reviewerName}`);
      } else if (authorName) {
        setTitle(`Discussions started with ${authorName}`);
      }

      setFilteredDiscussions(getFilteredDiscussions(discussions, reviewerName, authorName));
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
    ({ project, createdAfter, createdBefore }: FilterPanelState) => {
      return analyze(client, project.id, createdAfter, createdBefore);
    },
    [analyze, client]
  );

  return (
    <PageContainer>
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <div className="charts">
          {discussionsReceivedPieChart && (
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
          {discussionsStartedPieChart && (
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
                id: item.comment.id.toString(),
                avatarUrl: item.comment.author.avatar_url,
                title: item.mergeRequest.title,
                commentUrl: getNoteUrl(item),
                noteText: item.comment.body,
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
        <DiscussionList discussions={discussions} />
      </FullScreenDialog>
    </PageContainer>
  );
}
