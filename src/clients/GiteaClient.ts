import {
  Api as GiteaApi,
  giteaApi,
  User as GiteaUser,
  PullRequest as GiteaPullRequest,
  PullReviewComment as GiteaPullReviewComment,
  PullReview as GiteaPullReview,
  Repository,
} from 'gitea-js';
import { User, Client, Comment, Project, AnalyzeParams, PullRequest, PullRequestStatus } from './types';

export class GiteaClient implements Client {
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
    const all: GiteaUser[] = [];
    let users: GiteaUser[] = [];

    let page = 1;
    do {
      users = (await this.api.users.userSearch({ q: '', page, limit: 100 })).data.data ?? [];
      all.push(...users);
      page++;
    } while (users.length === 100);

    return users.map((user) => convertToUser(this.host, user));
  }

  async searchUsers(searchText: string): Promise<User[]> {
    const { data } = await this.api.users.userSearch({
      q: searchText,
      page: 1,
      limit: 100,
    });
    return (data.data ?? []).map((user) => convertToUser(this.host, user));
  }

  async analyze(params: AnalyzeParams): Promise<PullRequest[]> {
    const { project, pullRequestCount, state } = params;

    if (project == null || project.owner == null) {
      throw new Error('project is required');
    }

    const { id: projectId, owner, name } = project;

    const giteaPrs = await getAllPullRequests(this.api, project, pullRequestCount, state);

    const commentsPromise = giteaPrs.map(async (pullRequest) => {
      // In Gitea, a pull request can have multiple reviews, and each review can have multiple comments
      // So, we need:
      // 1. Get all pull requests
      // 2. Get reviews for each pull request
      // 3. Get comments for each review
      const { data: reviews } = await this.api.repos.repoListPullReviews(owner, name, pullRequest.number!);

      const commentsPromise = reviews
        .filter((review) => (review.comments_count ?? 0) > 0)
        .map((review) => this.api.repos.repoGetPullReviewComments(owner, name, pullRequest.number!, review.id!));

      const commentsResp = await Promise.all(commentsPromise);
      const prComments = commentsResp.flatMap((item) => item.data);
      return { pullRequest, comments: prComments, reviews };
    });

    const commentsResp = await Promise.all(commentsPromise);

    const allPrs = commentsResp.map(({ pullRequest, reviews, comments }) => {
      const notEmptyReviews = reviews.filter((item) => !!item.body).map((review) => convertToComment(pullRequest, review));
      const prComments = comments.map<Comment>((item) => convertToComment(pullRequest, item));
      const pr = convertToPullRequest(this.host, pullRequest, [...notEmptyReviews, ...prComments]);

      return pr;
    });

    return allPrs;
  }
}

function convertToPullRequest(hostUrl: string, pr: GiteaPullRequest, comments: Comment[]): PullRequest {
  return {
    id: pr.id!.toString(),
    title: pr.title ?? 'unknown title',
    targetBranch: pr.base?.label ?? 'unknown target branch',
    branchName: pr.head?.label ?? 'unknown branch name',
    url: pr.url!,
    updatedAt: pr.updated_at ?? 'unknown updated at',
    author: convertToUser(hostUrl, pr.user!),
    reviewers: (pr.requested_reviewers ?? []).map((user) => convertToUser(hostUrl, user)),
    comments,
    createdAt: pr.created_at ?? 'unknown created at',
  };
}

function convertToProject(repository: Repository): Project {
  return {
    id: repository.id!.toString(),
    name: /*repository.full_name || */ repository.name || 'unknown name',
    avatarUrl: repository.avatar_url,
    description: repository.description,
    owner: repository.owner!.login!.toString(),
  };
}

function convertToComment(pullRequest: GiteaPullRequest, item: GiteaPullReviewComment | GiteaPullReview): Comment {
  return {
    id: item.id!.toString(),
    prAuthorId: pullRequest.user?.id?.toString() || 'unknown prAuthorId',
    prAuthorName: pullRequest.user?.full_name || pullRequest.user?.login || 'unknown prAuthorName',
    prAuthorAvatarUrl: pullRequest.user?.avatar_url,

    commentId: item.commit_id!,
    body: item.body!,
    reviewerId: item.user?.id?.toString() || 'unknown reviewerId',
    reviewerName: item.user?.full_name || item.user?.login || 'unknown reviewerName',
    pullRequestId: pullRequest.id!.toString(),
    pullRequestName: pullRequest.title!,
    url: item.html_url ?? '#',
    filePath: 'path' in item ? item.path ?? '' : '',
  };
}

export function convertToUser(host: string, user: GiteaUser): User {
  return {
    id: user.id!.toString(),
    fullName: user.full_name!,
    userName: user.login ?? user.email ?? 'unknown userName',
    // email: user.email!,
    avatarUrl: user.avatar_url!,
    webUrl: `${host}/${user.login}`,
    active: !!user.active,
  };
}

async function getAllPullRequests(
  client: GiteaApi<any>,
  project: Project,
  prCount: number,
  state?: PullRequestStatus
): Promise<GiteaPullRequest[]> {
  const pages = Math.ceil(prCount / 50);

  const pullRequests: GiteaPullRequest[] = [];

  for (let pageIndex = 1; pageIndex <= pages; pageIndex++) {
    const result = await client.repos.repoListPullRequests(project.owner!, project.name, {
      state,
      sort: 'recentupdate',
      page: pageIndex,
    });

    if ((result.data ?? []).length > 0) {
      pullRequests.push(...result.data);
    } else {
      break;
    }
  }

  return pullRequests;
}
