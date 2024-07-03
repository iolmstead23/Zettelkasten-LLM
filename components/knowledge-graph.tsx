'use client'

import React, { useEffect, useRef, useState } from 'react';
import RelationGraph, { RelationGraphInstance } from 'relation-graph/react';
import type { MutableRefObject } from 'react';
import type {
  RGLine,
  RGLink,
  RGNode,
  RGNodeSlotProps,
  RGOptions,
  RelationGraphExpose
} from 'relation-graph/react';

const staticJsonData = {
  rootId: '1',
  nodes: [
    { id: '1', text: 'Node-1', myicon: 'el-icon-star-on' },
    { id: '2', text: 'Node-2', myicon: 'el-icon-star-on' },
    { id: '3', text: 'Node-3', myicon: 'el-icon-star-on' },
  ],
  lines: [
    { from: '1', to: '3', text: 'Line text' },
    { from: '1', to: '2', text: 'Line text' },
  ]
};

const NodeSlot: React.FC<RGNodeSlotProps> = ({ node }) => {
  console.log('NodeSlot:', node.text);
  return (
    <div style={{ lineHeight: '80px', textAlign: 'center' }}>
      <span>{node.text}</span>
    </div>
  );
};

const SimpleGraph: React.FC = () => {
  const graphRef = useRef<RelationGraphExpose | null>(null);

  useEffect(() => {
    if (graphRef.current) {
      showGraph();
    }
  });

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
    console.log('onNodeClick:', node.text);
    return true;
  };

  const onLineClick = (line: RGLine, _link: RGLink, _e: MouseEvent | TouchEvent) => {
    console.log('onLineClick:', line.text, line.from, line.to);
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