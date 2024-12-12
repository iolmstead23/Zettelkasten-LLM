"use client";

import React, { useEffect, useRef } from "react";
import RelationGraph, { RelationGraphInstance } from "relation-graph/react";

import type {
  RGLine,
  RGLink,
  RGNode,
  RGNodeSlotProps,
  RGOptions,
  RelationGraphExpose,
} from "relation-graph/react";
import {
  useKnowledgeGraphContext,
  useSortIndexContext,
} from "@/components/ui/UIProvider";

const NodeSlot: React.FC<RGNodeSlotProps> = ({ node }) => {
  // set size to small
  node.width = node.height = 25;
  // move text left based on text length (numbers are arbitrary)
  const dynamicMargin = `-${Math.pow(node.text?.length! / 3.6, 2)}px`;
  // disable dragging event
  node.disableDrag = true;

  return (
    <div className="py-[110%]">
      <span
        className="text-center text-black text-xs text-nowrap"
        style={{ marginLeft: dynamicMargin }}
      >
        {node.text?.split(".")[0]}
      </span>
    </div>
  );
};

const SimpleGraph: React.FC = () => {
  const knowledgeGraph = useKnowledgeGraphContext();
  const sortIndex = useSortIndexContext();
  const graphRef = useRef<RelationGraphExpose | null>(null);

  useEffect(() => {
    if (graphRef.current) {
      showGraph();
    }
  });

  // trigger an index sort on render and get updated nodes
  useEffect(() => {
    sortIndex.setIndexSort(true);
  }, []);

  const nodes: any[] = knowledgeGraph.nodes;

  const staticJsonData = {
    rootId: "1",
    nodes: nodes,
    lines: [],
  };

  const showGraph = async () => {
    if (graphRef.current) {
      await graphRef.current.setJsonData(staticJsonData, (graphInstance) => {
        // Do something when graph ready
      });
    }
  };

  const options: RGOptions = {
    debug: true,
    defaultLineShape: 1,
    layout: {
      layoutName: "center",
      maxLayoutTimes: 3000,
    },
    defaultExpandHolderPosition: "right",
  };

  const onNodeClick = (node: RGNode, _e: MouseEvent | TouchEvent) => {
    return true;
  };

  const onLineClick = (
    line: RGLine,
    _link: RGLink,
    _e: MouseEvent | TouchEvent
  ) => {
    return true;
  };

  return (
    <div className="h-[85vh]">
      <RelationGraph
        ref={graphRef}
        options={options}
        nodeSlot={NodeSlot}
        onNodeClick={onNodeClick}
        onLineClick={onLineClick}
      />
    </div>
  );
};

export default SimpleGraph;
