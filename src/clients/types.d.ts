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
}

export interface Client {
  getCurrentUser(): Promise<User>;
  getPullRequests(params: any): Promise<any>;
  getComments(params: any): Promise<any>;
  getUsers(): Promise<User[]>;
  searchProjects(searchText: string): Promise<Project[]>;
}
