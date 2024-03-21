import { useMemo } from 'react';
import { ResponsiveChord } from '@nivo/chord';
import { ChartContainer } from '../../ChartContainer';
import { PullRequest, User } from '../../../services/types';

export interface UsersConnectionChartProps {
  users: User[];
  pullRequests: PullRequest[];
}

export function UsersConnectionChart({ users, pullRequests }: UsersConnectionChartProps) {
  const data = useMemo(() => {
    //TODO: need to write test to check whether the data is correct
    // need to write tests for "Pull Requests reviews by user" chart and data should be the same
    const map: Map<string /* author id*/, Map<string /* reviewer */, number>> = new Map();

    for (const user of users) {
      const authors = new Map<string, number>(users.map((item) => [item.id, 0]));
      map.set(user.id, authors);
    }

    for (const pullRequest of pullRequests) {
      const authorMap = map.get(pullRequest.author.id)!;
      for (const reviewer of pullRequest.reviewedByUser) {
        const oldValue = authorMap.get(reviewer.id) ?? 0;
        authorMap.set(reviewer.id, oldValue + 1);
      }
    }

    const matrix = Array.from(map).map(([_, reviewerMap]) => {
      return Array.from(reviewerMap).map(([_, value]) => value);
    });

    return matrix;
  }, [users, pullRequests]);

  const userNames = useMemo(() => {
    return users.map((i) => i.fullName || i.userName);
  }, [users]);

  return (
    <ChartContainer title="" style={{ width: 500, height: 450 }}>
      <ResponsiveChord
        data={data}
        keys={userNames}
        margin={{ top: 60, right: 60, bottom: 90, left: 60 }}
        valueFormat=".2f"
        padAngle={0.02}
        innerRadiusRatio={0.96}
        innerRadiusOffset={0.02}
        inactiveArcOpacity={0.25}
        arcBorderColor={{
          from: 'color',
          modifiers: [['darker', 0.6]],
        }}
        activeRibbonOpacity={0.75}
        inactiveRibbonOpacity={0.25}
        ribbonBorderColor={{
          from: 'color',
          modifiers: [['darker', 0.6]],
        }}
        labelRotation={-90}
        labelTextColor={{
          from: 'color',
          modifiers: [['darker', 1]],
        }}
        colors={{ scheme: 'nivo' }}
        motionConfig="stiff"
        legends={[
          {
            anchor: 'bottom',
            direction: 'row',
            justify: false,
            translateX: 0,
            translateY: 70,
            itemWidth: 80,
            itemHeight: 14,
            itemsSpacing: 0,
            itemTextColor: '#999',
            itemDirection: 'left-to-right',
            symbolSize: 12,
            symbolShape: 'circle',
            effects: [
              {
                on: 'hover',
                style: {
                  itemTextColor: '#000',
                },
              },
            ],
          },
        ]}
      />
    </ChartContainer>
  );
}
