import { describe, expect, it } from 'vitest';
import { layoutTeamReviewGraph } from './TeamReviewGraphLayout';

describe('layoutTeamReviewGraph', () => {
  it('places connected nodes deterministically from left to right', () => {
    const nodes = [
      { id: 'reviewer', width: 100, height: 40 },
      { id: 'author', width: 100, height: 40 },
      { id: 'observer', width: 100, height: 40 },
    ];
    const edges = [{ source: 'reviewer', target: 'author' }];

    const firstLayout = layoutTeamReviewGraph(nodes, edges, { nodeGap: 30, rankGap: 80 });
    const secondLayout = layoutTeamReviewGraph(nodes, edges, { nodeGap: 30, rankGap: 80 });

    expect(firstLayout).toEqual(secondLayout);
    expect(firstLayout.find((node) => node.id === 'reviewer')!.x).toBeLessThan(firstLayout.find((node) => node.id === 'author')!.x);
    expect(firstLayout.every((node) => Number.isFinite(node.x) && Number.isFinite(node.y))).toBe(true);
  });
});
