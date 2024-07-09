'use client'

import React, { useEffect, useRef, useState } from 'react';
import RelationGraph, { RelationGraphInstance } from 'relation-graph/react';

import type {
  JsonNode,
  RGLine,
  RGLink,
  RGNode,
  RGNodeSlotProps,
  RGOptions,
  RelationGraphExpose
} from 'relation-graph/react';
import { useKnowledgeGraphContext, useSortIndexContext } from './ui/UIProvider';

const NodeSlot: React.FC<RGNodeSlotProps> = ({ node }) => {
  // console.log('NodeSlot:', node.text);
  return (
    <div style={{ lineHeight: '80px', textAlign: 'center' }}>
      <span>{node.text}</span>
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

  // trigger an index sort and get updated nodes
  useEffect(()=>{
    sortIndex.setIndexSort(true);
  },[])

  const nodes: any[] = knowledgeGraph.nodes;

  const staticJsonData = {
    rootId: '1',
    nodes: nodes,
    lines: []
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
      layoutName: 'center',
      maxLayoutTimes: 3000,
    },
    defaultExpandHolderPosition: 'right',
  };

  const onNodeClick = (node: RGNode, _e: MouseEvent | TouchEvent) => {
    // console.log('onNodeClick:', node.text);
    return true;
  };

  const onLineClick = (line: RGLine, _link: RGLink, _e: MouseEvent | TouchEvent) => {
    // console.log('onLineClick:', line.text, line.from, line.to);
    return true;
  };

  return (
    <div className='h-[85vh]'>
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