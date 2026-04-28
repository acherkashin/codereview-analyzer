import { describe, expect, it } from 'vitest';
import { layoutTeamReviewGraph } from './TeamReviewGraphLayout';

describe('layoutTeamReviewGraph', () => {
  it('uses compact node defaults', () => {
    const [node] = layoutTeamReviewGraph([{ id: 'member' }], []);

    expect(node.width).toBe(220);
    expect(node.height).toBe(78);
    expect(Number.isFinite(node.x)).toBe(true);
    expect(Number.isFinite(node.y)).toBe(true);
  });

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

  it('spreads branching targets vertically with the default spacing', () => {
    const nodes = [{ id: 'reviewer' }, { id: 'author-a' }, { id: 'author-b' }, { id: 'author-c' }];
    const edges = [
      { source: 'reviewer', target: 'author-a' },
      { source: 'reviewer', target: 'author-b' },
      { source: 'reviewer', target: 'author-c' },
    ];

    const result = layoutTeamReviewGraph(nodes, edges);
    const reviewer = result.find((node) => node.id === 'reviewer')!;
    const authors = result.filter((node) => node.id.startsWith('author-')).sort((left, right) => left.y - right.y);

    expect(authors.every((author) => reviewer.x < author.x)).toBe(true);

    const gaps = authors.slice(1).map((author, index) => author.y - authors[index].y);
    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(140);
  });
});
