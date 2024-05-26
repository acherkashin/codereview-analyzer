import { useCallback } from 'react';
import { DiscussionList, FullScreenDialog } from '../../components';
import { Stack } from '@mui/material';
import SpeakerNotesOutlinedIcon from '@mui/icons-material/SpeakerNotesOutlined';
import QuestionAnswerOutlinedIcon from '@mui/icons-material/QuestionAnswerOutlined';

import { getAnalyze, useChartsStore } from '../../stores/ChartsStore';

import { ImportTextButton, CommentList } from '../../components';
import { useClient } from '../../stores/AuthStore';
import { FilterPanel } from '../../components/FilterPanel/FilterPanel';
import { PageContainer } from '../shared/PageContainer';
import { AnalyzeParams } from '../../services/types';
import { CodeReviewTiles } from './CodeReviewTiles';
import { useIsGuest } from '../../hooks/useIsGuest';
import { CodeReviewFilterPanel } from './CodeReviewFilterPanel';
import { useShallow } from 'zustand/react/shallow';
import { CodeReviewCharts } from './CodeReviewCharts';
import { ChartsTitle } from './ChartsTitle';
import { CommentItemProps } from '../../components/CommentList';

export interface CodeReviewChartsProps {}

export function CodeReviewChartsPage(_: CodeReviewChartsProps) {
  const client = useClient();
  const isGuest = useIsGuest();

  const { user, allPrs, users, title, filteredComments, filteredDiscussions } = useChartsStore(
    useShallow((state) => ({
      user: state.user,
      allPrs: state.pullRequests,
      users: state.users,
      title: state.dialogTitle,
      filteredComments: state.filteredComments,
      filteredDiscussions: state.filteredDiscussions,
    }))
  );

  const importData = useChartsStore((state) => state.actions.import);
  const closeDialog = useChartsStore((state) => state.actions.closeDialog);
  const analyze = useChartsStore(getAnalyze);

  const showDiscussionsAt = useChartsStore((state) => state.actions.showDiscussionsAt);
  const showFilteredComments = useChartsStore((state) => state.actions.showFilteredComments);
  const showFilteredDiscussions = useChartsStore((state) => state.actions.showFilteredDiscussions);
  const showDiscussion = useChartsStore((state) => state.actions.showDiscussion);
  const showCommentsWithWord = useChartsStore((state) => state.actions.showCommentsWithWord);

  const handleAnalyze = useCallback(
    (params: AnalyzeParams) => {
      return analyze(client, params);
    },
    [analyze, client]
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
          onWordClick={showCommentsWithWord}
          onShowComments={showFilteredComments}
          onShowDiscussions={showFilteredDiscussions}
          onShowDiscussionsAt={showDiscussionsAt}
          onDiscussionClick={showDiscussion}
        />
      </div>

      <FullScreenDialog
        icon={<SpeakerNotesOutlinedIcon />}
        title={title}
        open={(filteredComments ?? []).length !== 0}
        onClose={closeDialog}
      >
        <CommentList
          comments={(filteredComments ?? []).map(
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
        open={(filteredDiscussions ?? []).length !== 0}
        onClose={closeDialog}
      >
        <DiscussionList discussions={filteredDiscussions ?? []} />
      </FullScreenDialog>
    </PageContainer>
  );
}
