export type HostingType = 'Gitlab' | 'Gitea';

export interface Comment {
  /**
   * Comment id
   */
  id: string;
  /**
   * Id of user who created pull request where comment is left
   */
  prAuthorId: string;
  prAuthorName: string;
  prAuthorAvatarUrl?: string;

  reviewerId: string;
  reviewerName: string;
  reviewerAvatarUrl?: string;

  body: string;
  pullRequestId: string;
  pullRequestName: string;
  url: string;
  filePath: string;

  createdAt: string;
}

export interface UserDiscussion {
  /**
   * Discussion id
   */
  id: string;

  prAuthorId: string;
  prAuthorName: string;

  /**
   * Person id who started discussion
   */
  reviewerId: string;
  /**
   * Person name who started discussion
   */
  reviewerName: string;
  reviewerAvatarUrl?: string;

  pullRequestId: string;
  pullRequestName: string;
  /**
   * Link to discussion
   */
  url: string;

  comments: Comment[];
}

export interface User {
  id: string;
  //   email: string;
  fullName: string;
  userName: string;
  displayName: string;
  avatarUrl: string;
  webUrl: string;
  active: boolean;
}

export interface Project {
  id: string;
  name: string;
  avatarUrl?: string;
  description?: string;
  /**
   * Owner id. Specific to Gitea.
   */
  owner?: string;
}

export interface AnalyzeParams {
  project: Project;
  /**
   * NOTE: Specific to gitlab
   */
  createdAfter?: Date;
  /**
   * NOTE: Specific to gitlab
   */
  createdBefore?: Date;
  /**
   * How many pull requests to analyze
   * NOTE: Specific to gitea
   */
  pullRequestCount: number;
  state?: PullRequestStatus;
}

export interface PullRequest {
  id: string;
  title: string;
  branchName: string;
  url: string;
  targetBranch: string;
  author: User;
  /**
   * Users selected as reviewers in the pull request
   */
  requestedReviewers: User[];
  /**
   * Users who reviewed the pull request:
   * - approved
   * - requested changes
   * - commented
   */
  reviewedByUser: User[];
  /**
   * Users who approved the pull request
   * TODO: probably it is better to assign "User[]" instead of "string[]" to be consistent
   */
  approvedByUser: User[];
  /**
   * Users who requested changes in pull request
   */
  requestedChangesByUser: User[];
  updatedAt: string;
  createdAt: string;
  mergedAt?: string;
  comments: Comment[];
  discussions: UserDiscussion[];
  /**
   * Represents when pull request was marked as ready (WIP => Ready).
   * If not defined then pull request is WIP.
   */
  readyAt?: string;
}

export type PullRequestStatus = 'closed' | 'open' | 'all';

export interface RawData {
  pullRequests: any[];
  users: any[];
}
