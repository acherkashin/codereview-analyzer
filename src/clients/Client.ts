import { GiteaClient } from './GiteaClient';
import { GitlabClient } from './GitlabClient';
import { AnalyzeParams, ExportData, Project, PullRequest, User } from './types';

export type HostingType = 'Gitlab' | 'Gitea';

export interface Credentials {
  token: string;
  host: string;
  hostType: HostingType;
}

export function getClient({ hostType, host, token }: Credentials): Client {
  return hostType === 'Gitlab' ? new GitlabClient(host, token) : new GiteaClient(host, token);
}

export interface Client {
  analyze(params: AnalyzeParams): Promise<[PullRequest[], ExportData]>;
  analyzeRawData(rawData: any[]): PullRequest[];

  getCurrentUser(): Promise<User>;
  searchUsers(searchText: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  searchProjects(searchText: string): Promise<Project[]>;
  getAllProjects(): Promise<Project[]>;
}
