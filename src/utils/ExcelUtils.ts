import zipcelx, { ZipCelXConfig, ZipCelXRow } from 'zipcelx';
import { getNoteUrl, UserComment } from './GitLabUtils';

export function downloadComments(fileName: string, comments: UserComment[]) {
  const exportEntries = comments.map<ZipCelXRow>(({ mergeRequest, comment }) => [
    {
      value: mergeRequest.author.username as string,
      type: 'string',
    },
    {
      value: comment.author.username,
      type: 'string',
    },
    {
      value: comment.body,
      type: 'string',
    },
    {
      value: getNoteUrl({ mergeRequest, comment }),
      type: 'string',
    },
    {
      value: mergeRequest.title,
      type: 'string',
    },
  ]);

  const config: ZipCelXConfig = {
    filename: fileName ?? `Comments - ${new Date().toLocaleString()}`,
    sheet: {
      data: [
        [
          {
            value: 'MR Author',
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
