import create, { StoreApi } from 'zustand';
import {
  convertToCommentsLeft,
  convertToCommentsLeftToUsers,
  convertToCommentsReceived,
  convertToCommentsReceivedFromUsers,
  convertToDiscussionsLeft,
  convertToDiscussionsReceived,
} from '../utils/ChartUtils';
import { getMergeRequestsWithApprovals, UserDiscussion } from '../utils/GitLabUtils';
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
import { AnalyzeParams, Client, Comment, PullRequest } from '../clients/types';

export interface ChartsStore {
  mergeRequests: PullRequest[];
  comments: Comment[];
  discussions: UserDiscussion[];
  setComments: (newComments: Comment[]) => void;
  setDiscussions: (newDiscussions: UserDiscussion[]) => void;
  analyze: (client: Client, params: AnalyzeParams) => Promise<void>;
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
    analyze: async (client: Client, params: AnalyzeParams) => {
      const mergeRequests = await client.analyze(params);
      const comments = mergeRequests.flatMap((item) => item.comments);

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

export function useWhomAssignedToReviewPieChart(authorId?: string): PieChartDatum[] {
  return useChartsStore((state) => {
    if (!authorId) {
      return [];
    }

    const authorMrs = state.mergeRequests.filter((item) => item.author.id === authorId);
    return convertAssignedToReview(authorMrs);
  });
}

export function useWhoAssignsToAuthorToReviewPieChart(authorId?: string): PieChartDatum[] {
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

// export function useWhoApprovesMergeRequests(client: Resources.Gitlab, projectId?: number, userId?: number) {
//   const [whoApprovesUser, setWhoApprovesUser] = useState<PieChartDatum[]>([]);
//   const [whomUserApproves, setWhomUserApproves] = useState<PieChartDatum[]>([]);

//   useChartsStore((state) => {
//     if (userId == null || state.mergeRequests.length === 0 || !projectId) {
//       return [];
//     }

//     getMergeRequestsWithApprovals(client, projectId, state.mergeRequests).then((response) => {
//       setWhoApprovesUser(getWhoApprovesUser(response, userId));
//       setWhomUserApproves(getWhomUserApproves(response, userId));
//     });
//   });

//   return {
//     whoApprovesUser,
//     whomUserApproves,
//   };
// }
