export interface Comment {
  prAuthorId: string;
  prAuthorName: string;
  reviewerId: string;
  reviewerName: string;
  commentId: string;
  comment: string;
  pullRequestId: string;
  pullRequestName: string;
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
  avatarUr?: string;
  description?: string;
  /**
   * Owner id. Specific to Gitea.
   */
  owner?: string;
}

export interface AnalyzeParams {
  projectId: string;
  /**
   * NOTE: Specific to gitlab
   */
  createdAfter: Date;
  /**
   * NOTE: Specific to gitlab
   */
  createdBefore: Date;
  /**
   * NOTE: ownerId is specific to gitea
   */
  owner: string;
  /**
   * NOTE: Specific to gitea
   */
  perPage: number;
}

export interface Client {
  getCurrentUser(): Promise<User>;
  getPullRequests(params: any): Promise<any>;
  getComments(params: any): Promise<any>;
  getUsers(): Promise<User[]>;
  searchProjects(searchText: string): Promise<Project[]>;
}
