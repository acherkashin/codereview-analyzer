import { ResponsiveLine } from '@nivo/line';

const data = [
  {
    id: 'japan',
    color: 'hsl(141, 70%, 50%)',
    data: [
      {
        x: 'plane',
        y: 52,
      },
      {
        x: 'helicopter',
        y: 280,
      },
      {
        x: 'boat',
        y: 201,
      },
      {
        x: 'train',
        y: 31,
      },
      {
        x: 'subway',
        y: 146,
      },
      {
        x: 'bus',
        y: 60,
      },
      {
        x: 'car',
        y: 200,
      },
      {
        x: 'moto',
        y: 258,
      },
      {
        x: 'bicycle',
        y: 26,
      },
      {
        x: 'horse',
        y: 209,
      },
      {
        x: 'skateboard',
        y: 236,
      },
      {
        x: 'others',
        y: 194,
      },
    ],
  },
  {
    id: 'france',
    color: 'hsl(319, 70%, 50%)',
    data: [
      {
        x: 'plane',
        y: 217,
      },
      {
        x: 'helicopter',
        y: 175,
      },
      {
        x: 'boat',
        y: 292,
      },
      {
        x: 'train',
        y: 196,
      },
      {
        x: 'subway',
        y: 103,
      },
      {
        x: 'bus',
        y: 166,
      },
      {
        x: 'car',
        y: 266,
      },
      {
        x: 'moto',
        y: 38,
      },
      {
        x: 'bicycle',
        y: 43,
      },
      {
        x: 'horse',
        y: 43,
      },
      {
        x: 'skateboard',
        y: 33,
      },
      {
        x: 'others',
        y: 229,
      },
    ],
  },
  {
    id: 'us',
    color: 'hsl(342, 70%, 50%)',
    data: [
      {
        x: 'plane',
        y: 220,
      },
      {
        x: 'helicopter',
        y: 28,
      },
      {
        x: 'boat',
        y: 189,
      },
      {
        x: 'train',
        y: 173,
      },
      {
        x: 'subway',
        y: 244,
      },
      {
        x: 'bus',
        y: 214,
      },
      {
        x: 'car',
        y: 179,
      },
      {
        x: 'moto',
        y: 181,
      },
      {
        x: 'bicycle',
        y: 236,
      },
      {
        x: 'horse',
        y: 54,
      },
      {
        x: 'skateboard',
        y: 216,
      },
      {
        x: 'others',
        y: 213,
      },
    ],
  },
  {
    id: 'germany',
    color: 'hsl(152, 70%, 50%)',
    data: [
      {
        x: 'plane',
        y: 258,
      },
      {
        x: 'helicopter',
        y: 72,
      },
      {
        x: 'boat',
        y: 205,
      },
      {
        x: 'train',
        y: 295,
      },
      {
        x: 'subway',
        y: 46,
      },
      {
        x: 'bus',
        y: 263,
      },
      {
        x: 'car',
        y: 135,
      },
      {
        x: 'moto',
        y: 161,
      },
      {
        x: 'bicycle',
        y: 122,
      },
      {
        x: 'horse',
        y: 94,
      },
      {
        x: 'skateboard',
        y: 215,
      },
      {
        x: 'others',
        y: 160,
      },
    ],
  },
  {
    id: 'norway',
    color: 'hsl(101, 70%, 50%)',
    data: [
      {
        x: 'plane',
        y: 294,
      },
      {
        x: 'helicopter',
        y: 178,
      },
      {
        x: 'boat',
        y: 146,
      },
      {
        x: 'train',
        y: 277,
      },
      {
        x: 'subway',
        y: 151,
      },
      {
        x: 'bus',
        y: 30,
      },
      {
        x: 'car',
        y: 54,
      },
      {
        x: 'moto',
        y: 7,
      },
      {
        x: 'bicycle',
        y: 286,
      },
      {
        x: 'horse',
        y: 189,
      },
      {
        x: 'skateboard',
        y: 190,
      },
      {
        x: 'others',
        y: 206,
      },
    ],
  },
];

export function LineChart(
  {
    /* see data tab */
  }
) {
  return (
    <ResponsiveLine
      data={data}
      margin={{ top: 50, right: 110, bottom: 50, left: 60 }}
      xScale={{ type: 'point' }}
      yScale={{
        type: 'linear',
        min: 'auto',
        max: 'auto',
        stacked: true,
        reverse: false,
      }}
      yFormat=" >-.2f"
      axisTop={null}
      axisRight={null}
      axisBottom={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'transportation',
        legendOffset: 36,
        legendPosition: 'middle',
      }}
      axisLeft={{
        tickSize: 5,
        tickPadding: 5,
        tickRotation: 0,
        legend: 'count',
        legendOffset: -40,
        legendPosition: 'middle',
      }}
      pointSize={10}
      pointColor={{ theme: 'background' }}
      pointBorderWidth={2}
      pointBorderColor={{ from: 'serieColor' }}
      pointLabelYOffset={-12}
      useMesh={true}
      legends={[
        {
          anchor: 'bottom-right',
          direction: 'column',
          justify: false,
          translateX: 100,
          translateY: 0,
          itemsSpacing: 0,
          itemDirection: 'left-to-right',
          itemWidth: 80,
          itemHeight: 20,
          itemOpacity: 0.75,
          symbolSize: 12,
          symbolShape: 'circle',
          symbolBorderColor: 'rgba(0, 0, 0, .5)',
          effects: [
            {
              on: 'hover',
              style: {
                itemBackground: 'rgba(0, 0, 0, .03)',
                itemOpacity: 1,
              },
            },
          ],
        },
      ]}
    />
  );
}
