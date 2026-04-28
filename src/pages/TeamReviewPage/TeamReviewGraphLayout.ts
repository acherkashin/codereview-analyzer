import { graphlib, layout } from '@dagrejs/dagre';

export interface TeamReviewLayoutNode {
  id: string;
  width?: number;
  height?: number;
}

export interface TeamReviewLayoutEdge {
  source: string;
  target: string;
}

export interface TeamReviewLayoutOptions {
  direction?: 'LR' | 'TB';
  nodeWidth?: number;
  nodeHeight?: number;
  nodeGap?: number;
  rankGap?: number;
}

export interface TeamReviewLayoutPosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const defaultLayoutOptions: Required<TeamReviewLayoutOptions> = {
  direction: 'LR',
  nodeWidth: 260,
  nodeHeight: 116,
  nodeGap: 48,
  rankGap: 120,
};

export function layoutTeamReviewGraph(
  nodes: TeamReviewLayoutNode[],
  edges: TeamReviewLayoutEdge[],
  options: TeamReviewLayoutOptions = {}
): TeamReviewLayoutPosition[] {
  const resolvedOptions = { ...defaultLayoutOptions, ...options };
  const graph = new graphlib.Graph().setDefaultEdgeLabel(() => ({}));

  graph.setGraph({
    rankdir: resolvedOptions.direction,
    nodesep: resolvedOptions.nodeGap,
    ranksep: resolvedOptions.rankGap,
    marginx: 24,
    marginy: 24,
  });

  nodes.forEach((node) => {
    graph.setNode(node.id, {
      width: node.width ?? resolvedOptions.nodeWidth,
      height: node.height ?? resolvedOptions.nodeHeight,
    });
  });

  edges.forEach((edge) => {
    graph.setEdge(edge.source, edge.target);
  });

  layout(graph);

  return nodes.map((node) => {
    const width = node.width ?? resolvedOptions.nodeWidth;
    const height = node.height ?? resolvedOptions.nodeHeight;
    const position = graph.node(node.id);

    return {
      id: node.id,
      x: position.x - width / 2,
      y: position.y - height / 2,
      width,
      height,
    };
  });
}
