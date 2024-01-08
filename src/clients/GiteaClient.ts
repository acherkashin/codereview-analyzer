import { Api as GiteaApi, giteaApi, User as GiteaUser, PullRequest as GiteaPullRequest } from 'gitea-js';
import { User, Client, Comment, Project, AnalyzeParams, PullRequest } from './types';

export class GiteaClient implements Client {
  private api: GiteaApi<any>;

  constructor(private host: string, private token: string) {
    this.api = giteaApi(this.host, {
      token: this.token, // generate one at https://gitea.example.com/user/settings/applications
    });
  }

  async searchProjects(searchText: string): Promise<Project[]> {
    const projects = (await this.api.repos.repoSearch({ q: searchText, page: 1, limit: 100 })).data.data;

    return (projects ?? []).map<Project>((item) => ({
      id: item.id!.toString(),
      name: /*item.full_name || */ item.name || 'unknown name',
      avatarUrl: item.avatar_url,
      description: item.description,
      owner: item.owner!.login!.toString(),
    }));
  }

  async getCurrentUser(): Promise<User> {
    const { data: user } = await this.api.user.userGetCurrent();
    return convertToUser(this.host, user);
  }

  async getUsers(): Promise<User[]> {
    const { data } = await this.api.users.userSearch({
      q: '',
      page: 1,
      limit: 100,
    });
    return (data.data ?? []).map((user) => convertToUser(this.host, user));
  }

  async getPullRequests(params: AnalyzeParams): Promise<PullRequest[]> {
    const { owner, projectId, pullRequestCount } = params;

    const giteaPrs = await getAllPullRequests(this.api, owner, projectId, pullRequestCount);

    const pullRequests = giteaPrs.map<PullRequest>((pr) => ({
      author: convertToUser(this.host, pr.user!),
      reviewers: (pr.requested_reviewers ?? []).map((user) => convertToUser(this.host, user)),
    }));

    return pullRequests;

    // open -na Google\ Chrome --args --user-data-dir=/tmp/temporary-chrome-profile-dir --disable-web-security --disable-site-isolation-trials
    // get all orgs
    // get all repos
    // get all pull requests
    // or search /repos/search
    // this.api.orgs.orgListRepos(owner).then((data) => console.log(data));
    // this.api.repos
    //   .repoSearch({
    //     q: projectId,
    //   })
    //   .then((data) => console.log(data));
    // this.api.repos.repoGetPullRequest(owner, projectId, 21163).then((data) => console.log(data));
    // /repos/{owner}/{repo}/pulls/{index}/reviews
    // this.api.repos.repoListPullReviews(owner, projectId, 21163).then((data) => console.log(data));
    // /repos/{owner}/{repo}/pulls/{index}/reviews
    // this.api.repos.repoGetPullReviewComments(owner, projectId, 21163, 67588).then((data) => console.log(data));
  }

  async getComments(params: AnalyzeParams): Promise<Comment[]> {
    const { owner, projectId, pullRequestCount } = params;

    const giteaPrs = await getAllPullRequests(this.api, owner, projectId, pullRequestCount);

    const commentsPromise = giteaPrs.map((pullRequest) => {
      return this.api.repos.repoListPullReviews(owner, projectId, pullRequest.number!).then(async (reviews) => {
        const commentsPromise = reviews.data
          .filter((review) => (review.comments_count ?? 0) > 0)
          .map((review) => this.api.repos.repoGetPullReviewComments(owner, projectId, pullRequest.number!, review.id!));

        const commentsResp = await Promise.all(commentsPromise);
        const comments = commentsResp.flatMap((item) => item.data);

        return { pullRequest, comments };
      });
    });

    const commentsResponse = await Promise.all(commentsPromise);

    const allComments = commentsResponse.flatMap(({ comments, pullRequest }) =>
      comments.flatMap<Comment>((item) => ({
        prAuthorId: pullRequest.user?.id?.toString() || 'unknown prAuthorId',
        prAuthorName: pullRequest.user?.full_name || pullRequest.user?.login || 'unknown prAuthorName',
        commentId: item.commit_id!,
        comment: item.body!,
        reviewerId: item.user?.id?.toString() || 'unknown reviewerId',
        reviewerName: item.user?.full_name || item.user?.login || 'unknown reviewerName',
        pullRequestId: pullRequest.id!.toString(),
        pullRequestName: pullRequest.title!,
      }))
    );
    console.log(allComments);

    return allComments;
  }
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
  owner: string,
  projectId: string,
  prCount: number
): Promise<GiteaPullRequest[]> {
  const pages = Math.ceil(prCount / 50);

  const pullRequests: GiteaPullRequest[] = [];

  for (let pageIndex = 1; pageIndex <= pages; pageIndex++) {
    const result = await client.repos.repoListPullRequests(owner, projectId, {
      state: 'all',
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
