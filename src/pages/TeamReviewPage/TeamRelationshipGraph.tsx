import { memo, useEffect, useMemo } from 'react';
import { Avatar, Box, Chip, Typography } from '@mui/material';
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
import { layoutTeamReviewGraph } from './TeamReviewGraphLayout';

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

export function TeamRelationshipGraph({ model, selectedRelationshipId, onRelationshipSelect }: TeamRelationshipGraphProps) {
  const graphElements = useMemo(() => {
    const positions = new Map(
      layoutTeamReviewGraph(
        model.nodes.map((node) => ({ id: node.id })),
        model.relationships.map((relationship) => ({ source: relationship.reviewer.id, target: relationship.author.id }))
      ).map((position) => [position.id, position])
    );

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
        type: 'teamRelationship',
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color,
          width: 18,
          height: 18,
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

    return { nodes, edges };
  }, [model, onRelationshipSelect, selectedRelationshipId]);

  const [nodes, setNodes, onNodesChange] = useNodesState<TeamMemberFlowNode>(graphElements.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState<TeamRelationshipFlowEdge>(graphElements.edges);

  useEffect(() => {
    setNodes(graphElements.nodes);
    setEdges(graphElements.edges);
  }, [graphElements, setEdges, setNodes]);

  return (
    <Box sx={{ height: 520, width: '100%', overflow: 'hidden', borderRadius: 1, border: '1px solid', borderColor: 'divider' }}>
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

  return (
    <Box
      sx={{
        width: 260,
        minHeight: 116,
        borderRadius: 1,
        border: '1px solid',
        borderColor: node.isSelectedTeamMember ? 'primary.main' : 'divider',
        backgroundColor: node.isSelectedTeamMember ? 'background.paper' : '#F8FAFC',
        boxShadow: node.isSelectedTeamMember ? 2 : 0,
        px: 2,
        py: 1.5,
      }}
    >
      <Handle type="target" position={Position.Left} style={{ opacity: 0 }} />
      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
        <Avatar src={node.user.avatarUrl} alt={node.user.displayName} sx={{ width: 44, height: 44 }} />
        <Box sx={{ minWidth: 0 }}>
          <Typography variant="subtitle2" noWrap>
            {node.user.displayName}
          </Typography>
          <Typography variant="caption" color="text.secondary" noWrap>
            {node.user.userName}
          </Typography>
        </Box>
      </Box>
      <Box sx={{ display: 'flex', gap: 0.75, mt: 1.5, flexWrap: 'wrap' }}>
        <Chip
          size="small"
          label={node.isSelectedTeamMember ? 'Selected' : 'Outside team'}
          color={node.isSelectedTeamMember ? 'primary' : 'default'}
          variant={node.isSelectedTeamMember ? 'filled' : 'outlined'}
        />
        {node.isSelectedTeamMember ? (
          <Chip size="small" label={`${node.reviewedPullRequestsCount} reviewed`} variant="outlined" />
        ) : (
          <Chip size="small" label={`${node.incomingReviewedPullRequestsCount} reviewed by team`} variant="outlined" />
        )}
      </Box>
      <Handle type="source" position={Position.Right} style={{ opacity: 0 }} />
    </Box>
  );
});

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
  return Math.min(6, Math.max(2, 1.5 + reviewedPullRequestsCount * 0.6));
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
