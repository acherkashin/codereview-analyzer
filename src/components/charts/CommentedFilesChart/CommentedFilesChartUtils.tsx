import { arrange, asc, distinct, filter, groupBy, n, summarize, tidy } from '@tidyjs/tidy';
import { ReviewBarChartSettings, getFileExtension } from '../../../utils/ChartUtils';
import { Comment } from './../../../clients/types';

export function convertToFilesCommented(comments: Comment[]) {
  const paths = comments.filter((item) => !!item.filePath).map((item) => ({ filePath: item.filePath }));
  const authors = tidy(comments, distinct(['reviewerName'])).map((item) => item.reviewerName);
  const extensions = tidy(
    paths.map((item) => ({ extension: getFileExtension(item.filePath) })),
    distinct(['extension'])
  );

  /**
   * Array consist of the following objects
   * [{
   *   "Alexander Cherkashin": 1,
   *   "Vasya Pupkin": 2,
   *   total: 3,
   *   extension: "ts",
   * }, ...]
   */
  const data = extensions.map(({ extension }) => {
    // only comments for current extension
    const extensionComments = tidy(
      comments,
      filter((i) => getFileExtension(i.filePath) == extension)
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
  });

  // const data = tidy(extensions, groupBy('extension', [summarize({ total: n() })]), arrange([asc('total')]));

  return {
    authors,
    data,
  };
}
