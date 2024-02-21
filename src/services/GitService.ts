import { GiteaService } from './Gitea/GiteaService';
import { GitlabService } from './Gitlab/GitlabService';
import { AnalyzeParams, ExportData, Project, PullRequest, RawData, User } from './types';

export type HostingType = 'Gitlab' | 'Gitea';

export interface Credentials {
  token: string;
  host: string;
  hostType: HostingType;
}

export function getGitService({ hostType, host, token }: Credentials): GitService {
  return hostType === 'Gitlab' ? new GitlabService(host, token) : new GiteaService(host, token);
}

export interface GitService {
  analyze(params: AnalyzeParams): Promise<[PullRequest[], User[], ExportData]>;

  getCurrentUser(): Promise<User>;
  searchUsers(searchText: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  searchProjects(searchText: string): Promise<Project[]>;
  getAllProjects(): Promise<Project[]>;
}
