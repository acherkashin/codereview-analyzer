import {
  Api as GiteaApi,
  giteaApi,
  User as GiteaUser,
  PullRequest as GiteaPullRequest,
  PullReviewComment as GiteaPullReviewComment,
  PullReview as GiteaPullReview,
  Repository,
  TimelineComment,
} from 'gitea-js';
import { User, Project, AnalyzeParams, PullRequest, PullRequestStatus, ExportData, RawData } from './types';
import { GitService } from './GitService';
import { convertToProject, convertToPullRequest, convertToUser } from './GiteaConverter';

export class GiteaService implements GitService {
  private api: GiteaApi<any>;

  constructor(private host: string, private token: string) {
    this.api = giteaApi(this.host, {
      token: this.token, // generate one at https://gitea.example.com/user/settings/applications
    });
  }

  async getAllProjects(): Promise<Project[]> {
    const all: Repository[] = [];
    let projects: Repository[] = [];

    let page = 1;

    do {
      projects = (await this.api.repos.repoSearch({ q: '', page, limit: 100 })).data.data ?? [];
      all.push(...projects);
      page++;
    } while (projects.length === 100);

    return projects.map(convertToProject);
  }

  async searchProjects(searchText: string): Promise<Project[]> {
    const projects = (await this.api.repos.repoSearch({ q: searchText, page: 1, limit: 100 })).data.data;

    return (projects ?? []).map(convertToProject);
  }

  async getCurrentUser(): Promise<User> {
    const { data: user } = await this.api.user.userGetCurrent();
    return convertToUser(this.host, user);
  }

  async getAllUsers(): Promise<User[]> {
    const all = await this._getAllUsers();
    return all.map((user) => convertToUser(this.host, user));
  }

  async searchUsers(searchText: string): Promise<User[]> {
    const { data } = await this.api.users.userSearch({
      q: searchText,
      page: 1,
      limit: 100,
    });
    return (data.data ?? []).map((user) => convertToUser(this.host, user));
  }

  async analyze(params: AnalyzeParams): Promise<[PullRequest[], User[], ExportData]> {
    const rawUsers = await this._getAllUsers();
    const rawPullRequests = await this.requestRawData(params);
    const { pullRequests, users } = this.analyzeRawData({ pullRequests: rawPullRequests, users: rawUsers });

    return [
      pullRequests,
      users,
      {
        hostType: 'Gitea',
        hostUrl: this.host,
        data: {
          pullRequests: rawPullRequests,
          users: rawUsers,
        },
      },
    ];
  }

  async requestRawData({ project, pullRequestCount, state }: AnalyzeParams): Promise<GiteaRawDatum[]> {
    if (project == null || project.owner == null) {
      throw new Error('project is required');
    }

    const { owner, name } = project;

    const giteaPrs = await getAllPullRequests(this.api, project, pullRequestCount, state);

    const rawDataPromises = giteaPrs.map(async (pullRequest) => {
      // In Gitea, a pull request can have multiple reviews, and each review can have multiple comments
      // So, we need:
      // 1. Get all pull requests
      // 2. Get reviews for each pull request
      // 3. Get comments for each review

      // TODO: it seems we get not all reviews here. it cannot return more reviews than some limit
      const { data: reviews } = await this.api.repos.repoListPullReviews(owner, name, pullRequest.number!);
      const { data: timeline } = await this.api.repos.issueGetCommentsAndTimeline(owner, name, pullRequest.number!);

      const commentsPromise = reviews
        .filter((review) => (review.comments_count ?? 0) > 0)
        .map((review) => this.api.repos.repoGetPullReviewComments(owner, name, pullRequest.number!, review.id!));

      const commentsResp = await Promise.all(commentsPromise);
      const prComments = commentsResp.flatMap((item) => item.data);
      return { pullRequest, comments: prComments, reviews, timeline };
    });

    const rawData = await Promise.all(rawDataPromises);

    return rawData;
  }

  analyzeRawData({ pullRequests, users }: RawData): { pullRequests: PullRequest[]; users: User[] } {
    return {
      pullRequests: pullRequests.map((datum) => convertToPullRequest(this.host, datum)),
      users: users.map((user) => convertToUser(this.host, user)),
    };
  }

  private async _getAllUsers(): Promise<GiteaUser[]> {
    const all: GiteaUser[] = [];
    let users: GiteaUser[] = [];

    let page = 1;
    do {
      users = (await this.api.users.userSearch({ q: '', page, limit: 50 })).data.data ?? [];
      all.push(...users);
      page++;
    } while (users.length === 50);

    return all;
  }
}

export interface GiteaRawDatum {
  pullRequest: GiteaPullRequest;
  reviews: GiteaPullReview[];
  comments: GiteaPullReviewComment[];
  timeline: TimelineComment[];
}

const pageSize = 50;

async function getAllPullRequests(
  client: GiteaApi<any>,
  project: Project,
  prCount: number,
  state?: PullRequestStatus
): Promise<GiteaPullRequest[]> {
  const pages = Math.ceil(prCount / pageSize);

  const pullRequests: GiteaPullRequest[] = [];

  for (let pageIndex = 1; pageIndex <= pages; pageIndex++) {
    const result = await client.repos.repoListPullRequests(project.owner!, project.name, {
      state,
      // sort: 'recentupdate',
      page: pageIndex,
      limit: prCount - (pageIndex - 1) * pageSize,
    });

    if ((result.data ?? []).length > 0) {
      pullRequests.push(...result.data);
    } else {
      break;
    }
  }

  return pullRequests;
}
