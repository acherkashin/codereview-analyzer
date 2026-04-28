import { memo, useEffect, useMemo } from 'react';
import { Avatar, Box, Typography } from '@mui/material';
import {
  Background,
  BaseEdge,
  Controls,
  Edge,
  EdgeLabelRenderer,
  EdgeProps,
  Handle,
  MarkerType,
  MiniMap,
  Node,
  NodeProps,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
  useReactFlow,
  getBezierPath,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { TeamReviewModel, TeamReviewNode, TeamReviewRelationship } from '../../utils/TeamReviewUtils';
import { stringToColor } from '../../utils/ColorUtils';
import { TeamReviewLayoutPosition, layoutTeamReviewGraph } from './TeamReviewGraphLayout';

export interface TeamRelationshipGraphProps {
  model: TeamReviewModel;
  selectedRelationshipId?: string | null;
  onRelationshipSelect: (relationshipId: string) => void;
}

interface TeamMemberNodeData extends Record<string, unknown> {
  node: TeamReviewNode;
}

interface TeamRelationshipEdgeData extends Record<string, unknown> {
  relationship: TeamReviewRelationship;
  selected: boolean;
  onSelect: (relationshipId: string) => void;
}

type TeamMemberFlowNode = Node<TeamMemberNodeData, 'teamMember'>;
type TeamRelationshipFlowEdge = Edge<TeamRelationshipEdgeData, 'teamRelationship'>;

const NODE_WIDTH = 220;
const NODE_HEIGHT = 78;
const MIN_GRAPH_HEIGHT = 520;
const MAX_GRAPH_HEIGHT = 760;
const GRAPH_HEIGHT_PADDING = 144;
const HANDLE_OFFSETS = [18, 34, 50, 66, 82];
const CENTER_HANDLE_SLOT = Math.floor(HANDLE_OFFSETS.length / 2);

export function TeamRelationshipGraph({ model, selectedRelationshipId, onRelationshipSelect }: TeamRelationshipGraphProps) {
  const graphElements = useMemo(() => {
    const layoutPositions = layoutTeamReviewGraph(
        model.nodes.map((node) => ({ id: node.id })),
        model.relationships.map((relationship) => ({ source: relationship.reviewer.id, target: relationship.author.id }))
    );
    const positions = new Map(layoutPositions.map((position) => [position.id, position]));
    const handleAssignments = getRelationshipHandleAssignments(model.relationships, positions);

    const nodes: TeamMemberFlowNode[] = model.nodes.map((node) => ({
      id: node.id,
      type: 'teamMember',
      position: positions.get(node.id) ?? { x: 0, y: 0 },
      sourcePosition: Position.Right,
      targetPosition: Position.Left,
      data: { node },
      draggable: true,
    }));

    const edges: TeamRelationshipFlowEdge[] = model.relationships.map((relationship) => {
      const color = selectedRelationshipId === relationship.id ? '#5048E5' : stringToColor(relationship.reviewer.id);

      return {
        id: relationship.id,
        source: relationship.reviewer.id,
        target: relationship.author.id,
        sourceHandle: getHandleId('source', handleAssignments.get(relationship.id)?.sourceSlot ?? CENTER_HANDLE_SLOT),
        targetHandle: getHandleId('target', handleAssignments.get(relationship.id)?.targetSlot ?? CENTER_HANDLE_SLOT),
        type: 'teamRelationship',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color,
          width: 14,
          height: 14,
        },
        style: {
          stroke: color,
          strokeWidth: getRelationshipStrokeWidth(relationship.reviewedPullRequestsCount),
        },
        data: {
          relationship,
          selected: selectedRelationshipId === relationship.id,
          onSelect: onRelationshipSelect,
        },
      };
    });

    return { nodes, edges, height: getGraphHeight(layoutPositions) };
  }, [model, onRelationshipSelect, selectedRelationshipId]);

  const [nodes, setNodes, onNodesChange] = useNodesState<TeamMemberFlowNode>(graphElements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<TeamRelationshipFlowEdge>(graphElements.edges);

  useEffect(() => {
    setNodes(graphElements.nodes);
    setEdges(graphElements.edges);
  }, [graphElements, setEdges, setNodes]);

  return (
    <Box sx={{ height: graphElements.height, width: '100%', overflow: 'hidden', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
      <ReactFlow<TeamMemberFlowNode, TeamRelationshipFlowEdge>
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        minZoom={0.2}
        fitView
        fitViewOptions={{ padding: 0.18 }}
        proOptions={{ hideAttribution: true }}
      >
        <Background color="#D1D5DB" gap={20} />
        <Controls showInteractive={false} />
        <MiniMap pannable zoomable nodeColor={getMiniMapNodeColor} />
        <FitViewOnGraphChange revision={graphElements.nodes.map((node) => node.id).join('|') + graphElements.edges.map((edge) => edge.id).join('|')} />
      </ReactFlow>
    </Box>
  );
}

const TeamMemberNode = memo(function TeamMemberNode({ data }: NodeProps<TeamMemberFlowNode>) {
  const { node } = data;
  const countLabel = node.isSelectedTeamMember
    ? `${node.reviewedPullRequestsCount} reviewed`
    : `${node.incomingReviewedPullRequestsCount} reviewed by team`;

  return (
    <Box
      sx={{
        width: NODE_WIDTH,
        minHeight: NODE_HEIGHT,
        borderRadius: 1,
        border: '1px solid',
        borderColor: 'divider',
        backgroundColor: 'background.paper',
        px: 1.25,
        py: 1,
      }}
    >
      <EdgeHandles type="target" position={Position.Left} />
      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
        <Avatar
          src={node.user.avatarUrl}
          alt={node.user.displayName}
          sx={{
            width: 34,
            height: 34,
            filter: node.isSelectedTeamMember ? 'none' : 'grayscale(1) contrast(1.05)',
          }}
        />
        <Box sx={{ minWidth: 0, flex: '1 1 auto' }}>
          <Typography variant="subtitle2" noWrap sx={{ lineHeight: 1.25 }}>
            {node.user.displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {node.user.userName}
          </Typography>
          <Box
            component="span"
            sx={{
              display: 'inline-flex',
              alignItems: 'center',
              maxWidth: '100%',
              mt: 0.5,
              px: 0.75,
              py: 0.125,
              borderRadius: 999,
              border: '1px solid',
              borderColor: 'divider',
              backgroundColor: '#F9FAFB',
              color: 'text.secondary',
              fontSize: 11,
              fontWeight: 600,
              lineHeight: '16px',
              whiteSpace: 'nowrap',
            }}
          >
            {countLabel}
          </Box>
        </Box>
      </Box>
      <EdgeHandles type="source" position={Position.Right} />
    </Box>
  );
});

function EdgeHandles({ type, position }: { type: 'source' | 'target'; position: Position.Left | Position.Right }) {
  return (
    <>
      {HANDLE_OFFSETS.map((offset, index) => (
        <Handle
          key={getHandleId(type, index)}
          id={getHandleId(type, index)}
          type={type}
          position={position}
          style={{
            opacity: 0,
            top: `${offset}%`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </>
  );
}

function TeamRelationshipEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  style,
  markerEnd,
  data,
}: EdgeProps<TeamRelationshipFlowEdge>) {
  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  if (!data) {
    return <BaseEdge id={id} path={edgePath} markerEnd={markerEnd} style={style} />;
  }

  const { relationship, selected, onSelect } = data;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{
          ...style,
          strokeWidth: selected ? 4 : style?.strokeWidth,
        }}
      />
      <EdgeLabelRenderer>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            onSelect(relationship.id);
          }}
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
            pointerEvents: 'all',
            border: selected ? '1px solid #5048E5' : '1px solid #D1D5DB',
            borderRadius: 8,
            background: selected ? '#EEF2FF' : '#FFFFFF',
            color: '#121828',
            padding: '4px 8px',
            fontSize: 12,
            fontWeight: 700,
            boxShadow: '0px 1px 3px rgba(15, 23, 42, 0.18)',
            cursor: 'pointer',
          }}
        >
          {relationship.reviewedPullRequestsCount} PR{relationship.reviewedPullRequestsCount === 1 ? '' : 's'}
        </button>
      </EdgeLabelRenderer>
    </>
  );
}

function FitViewOnGraphChange({ revision }: { revision: string }) {
  const { fitView } = useReactFlow();

  useEffect(() => {
    window.requestAnimationFrame(() => {
      fitView({ padding: 0.18, duration: 200 });
    });
  }, [fitView, revision]);

  return null;
}

function getRelationshipStrokeWidth(reviewedPullRequestsCount: number) {
  return Math.min(4, Math.max(1.5, 1.2 + reviewedPullRequestsCount * 0.35));
}

const nodeTypes = {
  teamMember: TeamMemberNode,
};

const edgeTypes = {
  teamRelationship: TeamRelationshipEdge,
};

function getMiniMapNodeColor(node: Node) {
  const data = node.data as TeamMemberNodeData;
  return data.node.isSelectedTeamMember ? '#5048E5' : '#94A3B8';
}

function getHandleId(type: 'source' | 'target', index: number) {
  return `${type}-${index}`;
}

function getRelationshipHandleAssignments(relationships: TeamReviewRelationship[], positions: Map<string, TeamReviewLayoutPosition>) {
  const assignments = new Map<string, { sourceSlot: number; targetSlot: number }>();
  const byReviewer = new Map<string, TeamReviewRelationship[]>();
  const byAuthor = new Map<string, TeamReviewRelationship[]>();

  relationships.forEach((relationship) => {
    assignments.set(relationship.id, { sourceSlot: CENTER_HANDLE_SLOT, targetSlot: CENTER_HANDLE_SLOT });
    addRelationshipToMap(byReviewer, relationship.reviewer.id, relationship);
    addRelationshipToMap(byAuthor, relationship.author.id, relationship);
  });

  byReviewer.forEach((reviewerRelationships) => {
    const sortedRelationships = [...reviewerRelationships].sort((left, right) => sortByNodeCenterY(left.author.id, right.author.id, positions));

    sortedRelationships.forEach((relationship, index) => {
      assignments.get(relationship.id)!.sourceSlot = getHandleSlot(index, sortedRelationships.length);
    });
  });

  byAuthor.forEach((authorRelationships) => {
    const sortedRelationships = [...authorRelationships].sort((left, right) => sortByNodeCenterY(left.reviewer.id, right.reviewer.id, positions));

    sortedRelationships.forEach((relationship, index) => {
      assignments.get(relationship.id)!.targetSlot = getHandleSlot(index, sortedRelationships.length);
    });
  });

  return assignments;
}

function addRelationshipToMap(map: Map<string, TeamReviewRelationship[]>, key: string, relationship: TeamReviewRelationship) {
  const relationships = map.get(key) ?? [];
  relationships.push(relationship);
  map.set(key, relationships);
}

function sortByNodeCenterY(leftNodeId: string, rightNodeId: string, positions: Map<string, TeamReviewLayoutPosition>) {
  return getNodeCenterY(leftNodeId, positions) - getNodeCenterY(rightNodeId, positions) || leftNodeId.localeCompare(rightNodeId);
}

function getNodeCenterY(nodeId: string, positions: Map<string, TeamReviewLayoutPosition>) {
  const position = positions.get(nodeId);

  if (!position) {
    return 0;
  }

  return position.y + position.height / 2;
}

function getHandleSlot(index: number, total: number) {
  if (total <= 1) {
    return CENTER_HANDLE_SLOT;
  }

  if (total <= HANDLE_OFFSETS.length) {
    return Math.round((index * (HANDLE_OFFSETS.length - 1)) / (total - 1));
  }

  return index % HANDLE_OFFSETS.length;
}

function getGraphHeight(positions: TeamReviewLayoutPosition[]) {
  if (positions.length === 0) {
    return MIN_GRAPH_HEIGHT;
  }

  const minY = Math.min(...positions.map((position) => position.y));
  const maxY = Math.max(...positions.map((position) => position.y + position.height));
  const preferredHeight = maxY - minY + GRAPH_HEIGHT_PADDING;

  return Math.min(MAX_GRAPH_HEIGHT, Math.max(MIN_GRAPH_HEIGHT, preferredHeight));
}
