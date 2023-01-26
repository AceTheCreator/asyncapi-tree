/* eslint-disable import/no-anonymous-default-export */
import React, { useCallback, useEffect, useRef } from "react";
import { SmartBezierEdge } from "@tisoap/react-flow-smart-edge";
import ReactFlow, {
  useNodesState,
  useEdgesState,
  addEdge,
  ReactFlowProvider,
  MarkerType,
  useReactFlow,
  useStoreApi,
  useNodesInitialized,
  ConnectionLineType,
} from "reactflow";
import "reactflow/dist/style.css";
import dagre from "dagre";
import initialNodes from "../../configs/2.5.0.json";

const initialEdges = [
  {
    id: "edges-e5-7",
    source: "0",
    target: "1",
    label: "+",
    labelBgPadding: [8, 4],
    labelBgBorderRadius: 4,
    labelBgStyle: { fill: "#FFCC00", color: "#fff", fillOpacity: 0.7 },
    markerEnd: {
      type: MarkerType.ArrowClosed,
    },
  },
];

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (nodes: any, edges: any, direction = "TB") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node: any) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge: any) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node: any) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? "left" : "top";
    node.sourcePosition = isHorizontal ? "right" : "bottom";

    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes, edges };
};

const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
  initialNodes,
  initialEdges
);

const Nodes = (props: any) => {
  const reactFlowWrapper = useRef(null);
  const { setCenter, reactFlowInstance } = useReactFlow();
  const [nodes, setNodes, onNodesChange] = useNodesState(layoutedNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(layoutedEdges);

  const onConnect = useCallback(
    (params) =>
      setEdges((eds) =>
        addEdge(
          { ...params, type: ConnectionLineType.SmoothStep, animated: true },
          eds
        )
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  const focusNode = (x: number, y: number, zoom: number) => {
    setCenter(x, y, { zoom, duration: 1000 });
  };

  useEffect(() => {
    setNodes([
      ...initialNodes.map((item) => {
        return {
          id: item.id,
          type: item?.children?.length ? "default" : "output",
          data: { label: item.name, children: item.children },
          position: { x: 0, y: 0 },
          sourcePosition: "right",
          targetPosition: "left",
        };
      }),
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleNodeClick = (e, data) => {
    const findChildren = nodes.filter((item) => item?.data?.parent === data.id);
    if (!findChildren.length) {
      const itemChildren = [
        ...data.data.children.map((item, i) => {
          return {
            id: item.id,
            type: item?.children?.length ? "default" : "output",
            data: {
              label: item.name,
              children: item.children,
              parent: item.parent,
            },
            sourcePosition: "right",
            targetPosition: "left",
          };
        }),
      ];
      const newEdges = [
        ...edges,
        ...itemChildren.map((item) => {
          return {
            id: String(parseInt(Math.random(100000000) * 1000000)),
            source: item?.data?.parent,
            target: item?.id,
            markerEnd: {
              type: MarkerType.ArrowClosed,
            },
          };
        }),
      ];
      const newNodes = nodes.concat(itemChildren);
      const { nodes: layoutedNodes, edges: layoutedEdges } =
      getLayoutedElements(newNodes, newEdges, "LR");
      setNodes([...layoutedNodes]);
      setEdges([...layoutedEdges]);
      if (itemChildren.length) {
        focusNode(itemChildren[3].position.x, itemChildren[3].position.y, 1.85);
      }
    } else {
      const newNodes = removeChildren(data.data, nodes)
      setNodes([...newNodes]);
      setEdges([...edges.filter((item) => data.id !== item.source)]);
    }
  };
    var removeByAttr = function (arr, attr, value) {
      var i = arr.length;
      while (i--) {
        if (
          arr[i] &&
          arr[i].hasOwnProperty(attr) &&
          arguments.length > 2 &&
          arr[i][attr] === value
        ) {
          arr.splice(i, 1);
        }
      }
      return arr;
    };
  function removeChildren(parentNode: any, nodes: any){
    let newNodes = nodes
   const children = parentNode.children;
   if(children.length > 0){
    for(let i = 0; i < children.length; i++){
      newNodes = removeByAttr(nodes, 'id', children[i].id)
      if(children[i].children.length > 0){
        console.log('holla')
        removeChildren(children[i], newNodes)
      }
    }
   }
   return newNodes
  }
  const edgeTypes = {
    smart: SmartBezierEdge,
  };

  return (
    <div
      className="wrapper"
      ref={reactFlowWrapper}
      style={{
        width: "100%",
        height: "100vh",
      }}
    >
      <ReactFlow
        nodes={nodes}
        edges={edges}
        edgeTypes={edgeTypes}
        onNodesChange={onNodesChange}
        connectionLineType={ConnectionLineType.SmoothStep}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeClick={handleNodeClick}
        fitView
        defaultViewport={{ x: 1, y: 1, zoom: 0.5 }}
      />
    </div>
  );
};

// eslint-disable-next-line react/display-name
export default () => (
  <ReactFlowProvider>
    <Nodes />
  </ReactFlowProvider>
);
