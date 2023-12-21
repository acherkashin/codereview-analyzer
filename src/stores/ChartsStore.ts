import create, { StoreApi } from 'zustand';
import { MergeRequestSchema } from '@gitbeaker/core/dist/types/types';
import {
  convertToCommentsLeft,
  convertToCommentsLeftToUsers,
  convertToCommentsReceived,
  convertToCommentsReceivedFromUsers,
  convertToDiscussionsLeft,
  convertToDiscussionsReceived,
} from '../utils/ChartUtils';
import { getMergeRequestsWithApprovals, UserDiscussion } from '../utils/GitLabUtils';
import { Resources } from '@gitbeaker/core';
import {
  convertToCommentsLeftPieChart,
  convertToCommentsReceivedPieChart,
  convertToDiscussionsReceivedPieChart,
  convertToDiscussionsStartedPieChart,
  getWhoApprovesUser,
  getWhoAssignsToAuthorToReview,
  getWhomAuthorAssignsToReview as convertAssignedToReview,
  getWhomUserApproves,
  PieChartDatum,
} from '../utils/PieChartUtils';
import createContext from 'zustand/context';
import { useState } from 'react';
import { Client } from '../clients/types/Client';
import { Comment } from '../clients/types/Comment';

export interface ChartsStore {
  mergeRequests: MergeRequestSchema[];
  comments: Comment[];
  discussions: UserDiscussion[];
  setComments: (newComments: Comment[]) => void;
  setDiscussions: (newDiscussions: UserDiscussion[]) => void;
  analyze: (client: Client, projectId: number, createdAfter: Date, createdBefore: Date) => Promise<void>;
}

const { Provider: ChartsStoreProvider, useStore: useChartsStore } = createContext<StoreApi<ChartsStore>>();
export { ChartsStoreProvider, useChartsStore };

export function createChartsStore() {
  return create<ChartsStore>((set, get) => ({
    mergeRequests: [],
    comments: [],
    discussions: [],
    setComments: (newComments: Comment[]) => set({ comments: newComments }),
    setDiscussions: (newDiscussions: UserDiscussion[]) => set({ discussions: newDiscussions }),
    analyze: async (client: Client, projectId: number, createdAfter: Date, createdBefore: Date) => {
      const mergeRequests = await client.getPullRequests({
        projectId,
        createdAfter: createdAfter.toISOString(),
        createdBefore: createdBefore.toISOString(),
        perPage: 100,
      });

      const comments = await client.getComments({
        projectId,
        createdAfter: createdAfter.toISOString(),
        createdBefore: createdBefore.toISOString(),
        perPage: 100,
      });

      // const [comments, discussions] = await Promise.all([
      //   getUserComments(client, projectId, mergeRequests),
      //   getDiscussions(client, projectId, mergeRequests),
      // ]);

      set({
        mergeRequests,
        comments,
        discussions: [],
      });
    },
  }));
}

const personalPageStore = createChartsStore();

export function createPersonalPageStore() {
  return personalPageStore;
}

const chartsStore = createChartsStore();

export function createCommonChartsStore() {
  return chartsStore;
}

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

export function useWhomAssignedToReviewPieChart(authorId?: number): PieChartDatum[] {
  return useChartsStore((state) => {
    if (!authorId) {
      return [];
    }

    const authorMrs = state.mergeRequests.filter((item) => item.author.id === authorId);
    return convertAssignedToReview(authorMrs);
  });
}

export function useWhoAssignsToAuthorToReviewPieChart(authorId?: number): PieChartDatum[] {
  return useChartsStore((state) => {
    if (authorId == null) {
      return [];
    }

    const reviewerMrs = state.mergeRequests.filter((item) => (item.reviewers ?? []).map((item) => item.id).includes(authorId));
    return getWhoAssignsToAuthorToReview(reviewerMrs);
  });
}

export function useCommentsReceivedFromUsers(userId?: string) {
  return useChartsStore((state) => {
    if (userId == null) {
      return [];
    }

    return convertToCommentsReceivedFromUsers(state.comments, userId);
  });
}

export function useCommentsLeftToUsers(userId?: string) {
  return useChartsStore((state) => {
    if (userId == null) {
      return [];
    }

    return convertToCommentsLeftToUsers(state.comments, userId);
  });
}

export function useWhoApprovesMergeRequests(client: Resources.Gitlab, projectId?: number, userId?: number) {
  const [whoApprovesUser, setWhoApprovesUser] = useState<PieChartDatum[]>([]);
  const [whomUserApproves, setWhomUserApproves] = useState<PieChartDatum[]>([]);

  useChartsStore((state) => {
    if (userId == null || state.mergeRequests.length === 0 || !projectId) {
      return [];
    }

    getMergeRequestsWithApprovals(client, projectId, state.mergeRequests).then((response) => {
      setWhoApprovesUser(getWhoApprovesUser(response, userId));
      setWhomUserApproves(getWhomUserApproves(response, userId));
    });
  });

  return {
    whoApprovesUser,
    whomUserApproves,
  };
}
