export interface MergeRequestForPage {
  item: PullRequest;
  //TOOD: make 'readyTime', 'readyPeriod' required again
  readyTime?: string;
  readyPeriod?: TimeSpan;
}

export interface Comment {
  id: string;
  prAuthorId: string;
  prAuthorName: string;
  prAuthorAvatarUrl?: string;

  reviewerId: string;
  reviewerName: string;
  commentId: string;
  body: string;
  pullRequestId: string;
  pullRequestName: string;
  url: string;
  filePath: string;

  createdAt: string;
}

export interface User {
  id: string;
  //   email: string;
  fullName: string;
  userName: string;
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
  reviewedBy: User[];
  updatedAt: string;
  createdAt: string;
  comments: Comment[];
}

export type PullRequestStatus = 'closed' | 'open' | 'all';

export interface Client {
  getCurrentUser(): Promise<User>;
  analyze(params: AnalyzeParams): Promise<PullRequest[]>;
  searchUsers(searchText: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  searchProjects(searchText: string): Promise<Project[]>;
  getAllProjects(): Promise<Project[]>;
}
