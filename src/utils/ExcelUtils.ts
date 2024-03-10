import zipcelx, { ZipCelXConfig, ZipCelXRow } from 'zipcelx';
import { Comment, UserDiscussion } from '../services/types';

export function downloadComments(fileName: string, comments: Comment[]) {
  const exportEntries = comments.map<ZipCelXRow>((comment) => [
    {
      value: comment.prAuthorName,
      type: 'string',
    },
    {
      value: comment.reviewerName,
      type: 'string',
    },
    {
      value: comment.body,
      type: 'string',
    },
    {
      value: comment.url,
      type: 'string',
    },
    {
      value: comment.pullRequestName,
      type: 'string',
    },
  ]);

  const config: ZipCelXConfig = {
    filename: fileName ?? `Comments - ${new Date().toLocaleString()}`,
    sheet: {
      data: [
        [
          {
            value: 'Pull Request Author',
            type: 'string',
          },
          {
            value: 'Comment Left By',
            type: 'string',
          },
          {
            value: 'Comment Content',
            type: 'string',
          },
          {
            value: 'Comment Link',
            type: 'string',
          },
          {
            value: 'MR Title',
            type: 'string',
          },
        ],
        ...exportEntries,
      ],
    },
  };

  return zipcelx(config);
}

export function downloadDiscussions(fileName: string, discussions: UserDiscussion[]) {
  const headerRow: ZipCelXRow = [
    {
      value: 'Pull Request Id',
      type: 'string',
    },
    {
      value: 'Pull Request Title',
      type: 'string',
    },
    {
      value: 'Pull Request Author',
      type: 'string',
    },
    {
      value: 'Discussion Started By',
      type: 'string',
    },
    {
      value: 'Started At',
      type: 'string',
    },
    {
      value: 'Full Discussion',
      type: 'string',
    },
    {
      value: 'Discussion Link',
      type: 'string',
    },
  ];

  const discussionRows = discussions.map<ZipCelXRow>((discussion) => {
    const fullDiscussion = discussion.comments.map((item) => `— (${item.reviewerName}): ${item.body}`).join('\n');

    return [
      {
        value: discussion.pullRequestId,
        type: 'string',
      },
      {
        value: discussion.pullRequestName,
        type: 'string',
      },
      {
        value: discussion.prAuthorName,
        type: 'string',
      },
      {
        value: discussion.reviewerName,
        type: 'string',
      },
      {
        value: discussion.comments[0].createdAt,
        type: 'string',
      },
      {
        value: fullDiscussion,
        type: 'string',
      },
      {
        value: discussion.url,
        type: 'string',
      },
    ];
  });

  const config: ZipCelXConfig = {
    filename: fileName ?? `Discussions - ${new Date().toLocaleString()}`,
    sheet: {
      data: [headerRow, ...discussionRows],
    },
  };

  return zipcelx(config);
}
