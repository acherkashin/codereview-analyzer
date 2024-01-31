import zipcelx, { ZipCelXConfig, ZipCelXRow } from 'zipcelx';
import { Comment } from './../clients/types';

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
            value: 'PR Author',
            type: 'string',
          },
          {
            value: 'Comment Author - Reviewer',
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

  zipcelx(config);
}
