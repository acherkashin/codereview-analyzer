import { ExportData } from '../utils/ExportDataUtils';
import { Credentials } from '../utils/UserContextUtils';
import { GiteaService } from './Gitea/GiteaService';
import { GitlabService } from './Gitlab/GitlabService';
import { AnalyzeParams, Project, User } from './types';

export function getGitService({ hostType, host, token }: Credentials): GitService {
  return hostType === 'Gitlab' ? new GitlabService(host, token) : new GiteaService(host, token);
}

export interface GitService {
  fetch(params: AnalyzeParams, options?: FetchOptions): Promise<ExportData>;

  getCurrentUser(): Promise<User>;
  searchUsers(searchText: string): Promise<User[]>;
  getAllUsers(): Promise<User[]>;
  searchProjects(searchText: string): Promise<Project[]>;
  getAllProjects(): Promise<Project[]>;
  getErrorMessage(e: any): string;
}

export interface FetchOptions {
  onProgress?: (progress: PullRequestFetchProgress) => void;
}

export type PullRequestFetchStage = 'users' | 'pull-request-list' | 'pull-request-details';

export interface PullRequestFetchProgress {
  stage: PullRequestFetchStage;
  stageLabel: string;
  fetched?: number;
  total?: number;
  currentDataType?: string;
  currentPullRequestTitle?: string;
  createdAfter?: string;
  createdBefore?: string;
}
