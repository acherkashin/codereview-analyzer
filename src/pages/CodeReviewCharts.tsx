import { useCallback, useState } from 'react';
import { getFilteredComments, UserComment } from './../utils/GitLabUtils';
import { BaseChartTooltip, ChartContainer, CommentList, DiscussionList } from '../components';
import { Button, Stack } from '@mui/material';
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

  const [filteredComments, setFilteredComments] = useState<UserComment[]>([]);

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
    </PageContainer>
  );
}
