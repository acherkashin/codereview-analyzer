import create from 'zustand';
import { MergeRequestSchema } from '@gitbeaker/core/dist/types/types';
import {
  convertToCommentsLeft,
  convertToCommentsReceived,
  convertToDiscussionsLeft,
  convertToDiscussionsReceived,
} from '../utils/ChartUtils';
import { getDiscussions, getUserComments, UserComment, UserDiscussion } from '../utils/GitLabUtils';
import { Resources } from '@gitbeaker/core';
import {
  convertToCommentsLeftPieChart,
  convertToCommentsReceivedPieChart,
  convertToDiscussionsReceivedPieChart,
  convertToDiscussionsStartedPieChart,
  convertWhoAssignsToAuthorToReview,
  convertWhomAuthorAssignsToReview as convertAssignedToReview,
  PieChartDatum,
} from '../utils/PieChartUtils';

export interface ChartsStore {
  mergeRequests: MergeRequestSchema[];
  comments: UserComment[];
  discussions: UserDiscussion[];
  setComments: (newComments: UserComment[]) => void;
  setDiscussions: (newDiscussions: UserDiscussion[]) => void;
  analyze: (client: Resources.Gitlab, projectId: number, createdAfter: Date, createdBefore: Date) => Promise<void>;
}

export const useChartsStore = create<ChartsStore>((set, get) => ({
  mergeRequests: [],
  comments: [],
  discussions: [],
  setComments: (newComments: UserComment[]) => set({ comments: newComments }),
  setDiscussions: (newDiscussions: UserDiscussion[]) => set({ discussions: newDiscussions }),
  analyze: async (client: Resources.Gitlab, projectId: number, createdAfter: Date, createdBefore: Date) => {
    const mergeRequests = await client.MergeRequests.all({
      projectId,
      createdAfter: createdAfter.toISOString(),
      createdBefore: createdBefore.toISOString(),
      perPage: 100,
    });

    const [comments, discussions] = await Promise.all([
      getUserComments(client, projectId, mergeRequests),
      getDiscussions(client, projectId, mergeRequests),
    ]);

    set({
      mergeRequests,
      comments,
      discussions,
    });
  },
}));

export function getDiscussionsLeft(state: ChartsStore) {
  return convertToDiscussionsLeft(state.discussions);
}

export function getDiscussionsReceived(state: ChartsStore) {
  return convertToDiscussionsReceived(state.discussions);
}

export function getCommentsLeft(state: ChartsStore) {
  return convertToCommentsLeft(state.comments);
}

export function getCommentsReceived(state: ChartsStore) {
  return convertToCommentsReceived(state.comments);
}

export function getCommentsReceivedPieChart(state: ChartsStore) {
  return convertToCommentsReceivedPieChart(state.comments);
}

export function getCommentsLeftPieChart(state: ChartsStore) {
  return convertToCommentsLeftPieChart(state.comments);
}

export function getDiscussionsReceivedPieChart(state: ChartsStore) {
  return convertToDiscussionsReceivedPieChart(state.discussions);
}

export function getDiscussionsStartedPieChart(state: ChartsStore) {
  return convertToDiscussionsStartedPieChart(state.discussions);
}

export function getAnalyze(state: ChartsStore) {
  return state.analyze;
}

//TODO: need to test
export function getAssignedToReviewPieChart(authorId: string, state: ChartsStore): PieChartDatum[] {
  if (!authorId) {
    return [];
  }

  return convertAssignedToReview(state.mergeRequests.filter((item) => item.author.id === authorId));
}

//TODO: need to test
export function getWhoAssignsToReviewPieChart(authorId: string, state: ChartsStore): PieChartDatum[] {
  if (!authorId) {
    return [];
  }

  return convertWhoAssignsToAuthorToReview(
    state.mergeRequests.filter((item) => (item.reviewers ?? []).map((item) => item.id).includes(authorId))
  );
}
