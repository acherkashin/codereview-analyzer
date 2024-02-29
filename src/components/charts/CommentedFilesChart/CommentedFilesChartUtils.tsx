import { arrange, asc, distinct, filter, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { getFileExtension } from '../../../utils/ChartUtils';
import { Comment } from '../../../services/types';

/**
 * Returns array that consist of the following objects:
 * [{
 *   "Alexander Cherkashin": 1,
 *   "Vasya Pupkin": 2,
 *   total: 3,
 *   extension: "ts",
 * }, ...]
 * @param comments
 * @returns
 */
export function getCommentedFilesData(comments: Comment[]) {
  const paths = comments.filter((item) => !!item.filePath).map((item) => ({ filePath: item.filePath }));
  const authors = tidy(comments, distinct(['reviewerName'])).map((item) => item.reviewerName);
  const extensions = tidy(
    paths.map((item) => ({ extension: getFileExtension(item.filePath) })),
    distinct(['extension'])
  );

  const data = extensions
    .map(({ extension }) => {
      // only comments for current extension
      const extensionComments = tidy(
        comments,
        filter((i) => getFileExtension(i.filePath) === extension)
      );

      const reviewerComments = tidy(
        extensionComments,
        groupBy('reviewerName', [summarize({ total: n() })]),
        arrange([asc('total')])
      );

      const result = reviewerComments.reduce((acc, { reviewerName, total }) => {
        acc[reviewerName] = total;
        return acc;
      }, {} as Record<string, number>);

      return {
        ...result,
        extension: extension,
        total: extensionComments.length,
      };
    })
    .sort((a, b) => a.total - b.total);

  return {
    authors,
    data,
  };
}
