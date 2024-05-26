import { PropsWithChildren, useCallback, useState } from 'react';
import { getFilteredComments, getFilteredDiscussions } from '../../utils/GitUtils';
import { CommentList, DiscussionList, FullScreenDialog } from '../../components';
import { Stack, Typography } from '@mui/material';
import SpeakerNotesOutlinedIcon from '@mui/icons-material/SpeakerNotesOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';

import {
  getAnalyze,
  getComments,
  getDiscussions,
  getFilteredPullRequests,
  getHostType,
  getUserComments,
  useChartsStore,
} from '../../stores/ChartsStore';

import { ImportTextButton } from '../../components/ImportTextButton';
import { useClient } from '../../stores/AuthStore';
import { FilterPanel } from '../../components/FilterPanel/FilterPanel';
import { PageContainer } from '../shared/PageContainer';
import { AnalyzeParams, Comment, UserDiscussion } from '../../services/types';
import { CommentItemProps } from '../../components/CommentList';
import { CodeReviewTiles } from './CodeReviewTiles';
import { useIsGuest } from '../../hooks/useIsGuest';
import { ReviewCalendarChart } from '../../components/charts/ReviewCalendarChart/ReviewCalendarChart';
import { CodeReviewFilterPanel } from './CodeReviewFilterPanel';
import { useShallow } from 'zustand/react/shallow';
import { CodeReviewCharts } from './CodeReviewCharts';
import { ChartsTitle } from './ChartsTitle';
// import { UsersConnectionChart } from '../components/charts/UsersConnectionChart/UsersConnectionChart';

export interface CodeReviewChartsProps {}

export function CodeReviewChartsPage(_: CodeReviewChartsProps) {
  const client = useClient();
  const isGuest = useIsGuest();

  const { user, allPrs, users } = useChartsStore(
    useShallow((state) => ({
      user: state.user,
      allPrs: state.pullRequests,
      users: state.users,
    }))
  );

  const importData = useChartsStore((state) => state.actions.import);
  const comments = useChartsStore(getComments);
  const discussions = useChartsStore(getDiscussions);
  const analyze = useChartsStore(getAnalyze);

  const [title, setTitle] = useState('');
  const [filteredComments, setFilteredComments] = useState<Comment[]>([]);
  const [filteredDiscussions, setFilteredDiscussions] = useState<UserDiscussion[]>([]);

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

  const showDiscussionsAt = useCallback(
    (pointDate: Date) => {
      const filtered = discussions.filter((item) => {
        const date = new Date(item.comments[0].createdAt);

        return date.getMonth() === pointDate.getMonth() && date.getFullYear() === pointDate.getFullYear();
      });

      setFilteredDiscussions(filtered);
      setTitle('Discussions started at' + pointDate.toLocaleDateString());
    },
    [discussions]
  );

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

  if (allPrs == null || users == null) {
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
      <div style={{ display: 'flex', flexDirection: 'column', flexGrow: 1, overflowX: 'hidden' }}>
        <CodeReviewFilterPanel />

        <ChartsTitle>Highlights</ChartsTitle>
        <CodeReviewTiles user={user} />
        <CodeReviewCharts
          onWordClick={handleWordClick}
          onShowComments={showFilteredComments}
          onShowDiscussions={showFilteredDiscussions}
          onShowDiscussionsAt={showDiscussionsAt}
        />
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
