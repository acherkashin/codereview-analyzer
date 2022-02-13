import { getAuthorReviewerFromComments, getAuthorReviewerFromDiscussions, UserComment, UserDiscussion } from './GitLabUtils';
import { arrange, asc, groupBy, summarize, tidy, n } from '@tidyjs/tidy';
import { PieSvgProps } from '@nivo/pie';
import { BarDatum } from '@nivo/bar';

export function convertToCommentsReceivedPieChart(comments: UserComment[]) {
  const rawData = getAuthorReviewerFromComments(comments);
  const data = tidy(rawData, groupBy('author', [summarize({ total: n() })]), arrange([asc('total')])).map((item) => ({
    id: item.author,
    label: item.author,
    value: item.total,
  }));

  return data;
}

export function convertToCommentsLeftPieChart(comments: UserComment[]) {
  const rawData = getAuthorReviewerFromComments(comments);
  const data = tidy(rawData, groupBy('reviewer', summarize({ total: n() })), arrange([asc('total')])).map((item) => ({
    id: item.reviewer,
    label: item.reviewer,
    value: item.total,
  }));

  return data;
}

export function convertToDiscussionsReceivedPieChart(discussions: UserDiscussion[]) {
  const rawData = getAuthorReviewerFromDiscussions(discussions);
  const data = tidy(rawData, groupBy('author', [summarize({ total: n() })]), arrange([asc('total')])).map((item) => ({
    id: item.author,
    label: item.author,
    value: item.total,
  }));

  return data;
}

export function convertToDiscussionsStartedPieChart(discussions: UserDiscussion[]) {
  const rawData = getAuthorReviewerFromDiscussions(discussions);
  const data = tidy(rawData, groupBy('reviewer', summarize({ total: n() })), arrange([asc('total')])).map((item) => ({
    id: item.reviewer,
    label: item.reviewer,
    value: item.total,
  }));

  return data;
}

export const pieChartSettings = {
  width: 500,
  height: 400,
  padding: 0.2,
  labelTextColor: 'inherit:darker(1.4)',
  labelSkipWidth: 16,
  labelSkipHeight: 16,
  margin: { top: 40, right: 80, bottom: 80, left: 80 },
  innerRadius: 0.5,
  padAngle: 0.7,
  cornerRadius: 3,
  activeOuterRadiusOffset: 8,
  borderWidth: 1,
  borderColor: {
    from: 'color',
    modifiers: [['darker', 0.2]],
  },
  arcLinkLabelsSkipAngle: 10,
  arcLinkLabelsTextColor: '#333333',
  arcLinkLabelsThickness: 2,
  arcLabelsSkipAngle: 10,
  defs: [
    {
      id: 'dots',
      type: 'patternDots',
      background: 'inherit',
      color: 'rgba(255, 255, 255, 0.3)',
      size: 4,
      padding: 1,
      stagger: true,
    },
    {
      id: 'lines',
      type: 'patternLines',
      background: 'inherit',
      color: 'rgba(255, 255, 255, 0.3)',
      rotation: -45,
      lineWidth: 6,
      spacing: 10,
    },
  ],
} as Omit<PieSvgProps<BarDatum>, 'data'>;
