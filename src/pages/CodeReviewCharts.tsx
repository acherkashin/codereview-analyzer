import { useCallback, useState } from 'react';
import { getFilteredComments, getFilteredDiscussions } from '../utils/GitUtils';
import { ChartContainer, CommentList, DiscussionList, FullScreenDialog } from '../components';
import { Button, Stack, Typography } from '@mui/material';
import SpeakerNotesOutlinedIcon from '@mui/icons-material/SpeakerNotesOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';
import CloseIcon from '@mui/icons-material/Close';
import { downloadComments } from '../utils/ExcelUtils';
import {
  getAnalysisInterval,
  getAnalyze,
  getComments,
  getCreatedPullRequestsPieChart,
  getDiscussions,
  getExportData,
  useChartsStore,
} from '../stores/ChartsStore';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { BarChart } from '../components/charts/BarChart';
import { useOpen } from '../hooks/useOpen';
import { InputDialog } from '../components/dialogs/ExportToExcelDialog';
import { downloadFile } from '../utils/FileUtils';
import { ImportTextButton } from '../components/FileUploadButton';
import { getHostType, useAuthStore, useClient } from '../stores/AuthStore';
import { FilterPanel } from '../components/FilterPanel/FilterPanel';
import { PageContainer } from './PageContainer';
import { AnalyzeParams, Comment, UserDiscussion } from '../services/types';
import { CommentItemProps } from '../components/CommentList';
import { CodeReviewTiles } from './CodeReviewTiles';
import { useIsGuest } from '../hooks/useIsGuest';
import {
  ReviewRequestRecipients,
  ReviewRequestDistributionChart,
  ApprovalDistributionChart,
  ApprovalRecipientsChart,
  StartedByDiscussionsChart,
  StartedWithDiscussionsChart,
  StartedWithDiscussionsPieChart,
  CommentsLeftPieChart,
  CommentsReceivedPieChart,
  StartedByDiscussionsPieChart,
  CommentsLeftBarChart,
  CommentsReceivedBarChart,
  TopPullRequestsChart,
  ReviewByUserChart,
  CommentedFilesChart,
  CommentsPerMonthChart,
  WordsCloud,
  TopLongestDiscussionsChart,
} from '../components/charts';
// import { UsersConnectionChart } from '../components/charts/UsersConnectionChart/UsersConnectionChart';

export interface CodeReviewChartsProps {}

export function CodeReviewCharts(_: CodeReviewChartsProps) {
  const client = useClient();
  const excelDialog = useOpen();
  const isGuest = useIsGuest();

  const pullRequests = useChartsStore((state) => state.pullRequests);
  const users = useChartsStore((state) => state.users);
  const importData = useChartsStore((state) => state.import);
  const closeAnalysis = useChartsStore((state) => state.closeAnalysis);
  const dataToExport = useChartsStore(getExportData);
  const comments = useChartsStore(getComments);
  const discussions = useChartsStore(getDiscussions);
  const analyze = useChartsStore(getAnalyze);
  const createdPullRequestsPieChart = useChartsStore(getCreatedPullRequestsPieChart);
  const analysisInterval = useChartsStore(getAnalysisInterval);

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

  const handleWordClick = useCallback(
    (word: string) => {
      const filtered = comments.filter((item) => item.body.includes(word));
      setTitle(`Comments containing "${word}". Count: ${filtered.length}`);
      setFilteredComments(filtered);
    },
    [comments]
  );

  if (pullRequests.length === 0) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', height: '100%' }}>
        <Stack spacing={2} position="sticky" style={{ width: 300 }}>
          {!isGuest && <FilterPanel onAnalyze={handleAnalyze} />}
          <ImportTextButton
            label="Import as JSON"
            onTextSelected={(json) => {
              try {
                importData(json);
              } catch (ex) {
                //TODO: need to show error in UI
                console.error(ex);
              }
            }}
          />
        </Stack>
      </div>
    );
  }

  return (
    <PageContainer>
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
        <Stack direction="row" spacing={2}>
          <Typography variant="h3" textAlign="center">
            {analysisInterval}
          </Typography>
          <Button disabled={comments.length === 0} startIcon={<FileDownloadIcon />} onClick={excelDialog.open}>
            Download as Excel
          </Button>
          <Button
            startIcon={<FileDownloadIcon />}
            onClick={() => {
              // Need to specify Range <StartDate>-<EndDate> as a default name
              downloadFile('newFile.json', JSON.stringify(dataToExport, null, 2));
            }}
          >
            Export as JSON
          </Button>
          {/* TODO: probably need to show confirmation dialog to prevent closing analysis if data were not exported */}
          <Button startIcon={<CloseIcon />} onClick={closeAnalysis}>
            Close Analysis
          </Button>
          <InputDialog
            title="Export comments to excel"
            fieldName="File Name"
            open={excelDialog.isOpen}
            onClose={excelDialog.close}
            onDownload={handleDownload}
          />
        </Stack>

        <CodeReviewTiles />

        <div className="charts">
          <CommentsPerMonthChart comments={comments} />
          <ReviewByUserChart pullRequests={pullRequests} users={users} />
          <WordsCloud comments={comments} onClick={handleWordClick} />
          <TopPullRequestsChart pullRequests={pullRequests} count={10} />
          {/* <UsersConnectionChart pullRequests={pullRequests} users={users} /> */}
          <TopLongestDiscussionsChart
            pullRequests={pullRequests}
            count={10}
            onClick={(discussion) => {
              setTitle(`Discussion started by ${discussion.reviewerName} in ${discussion.pullRequestName}`);
              setFilteredDiscussions([discussion]);
            }}
          />
          <ApprovalDistributionChart pullRequests={pullRequests} users={users} />
          <ApprovalRecipientsChart pullRequests={pullRequests} users={users} />
          <ReviewRequestRecipients pullRequests={pullRequests} users={users} />
          <ReviewRequestDistributionChart pullRequests={pullRequests} users={users} />
          <StartedWithDiscussionsPieChart
            discussions={discussions}
            onClick={(authorName) => showFilteredDiscussions(null, authorName)}
          />
          <StartedByDiscussionsPieChart
            discussions={discussions}
            onClick={(reviewerName) => showFilteredDiscussions(reviewerName, null)}
          />
          <CommentsLeftPieChart comments={comments} onClick={(id) => showFilteredComments(id, null)} />
          <CommentsLeftBarChart comments={comments} onClick={showFilteredComments} />

          <CommentsReceivedPieChart comments={comments} onClick={(id) => showFilteredComments(null, id)} />
          <CommentsReceivedBarChart comments={comments} onClick={showFilteredComments} />

          <StartedByDiscussionsChart discussions={discussions} onClick={showFilteredDiscussions} />
          <StartedWithDiscussionsChart discussions={discussions} onClick={showFilteredDiscussions} />
          <ChartContainer title="Pull Requests Created">
            <BarChart {...createdPullRequestsPieChart} onClick={() => {}} />
          </ChartContainer>
          {hostType === 'Gitea' && <CommentedFilesChart comments={comments} />}
        </div>
      </div>

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
