// In app/knowledge-graph/page.tsx
"use client";

import React, {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { PlotParams } from "react-plotly.js";
import dynamic from "next/dynamic";
import { useKnowledgeGraphContext } from "@/components/ui/UIProvider";

const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
}) as React.ComponentType<Partial<PlotParams>>;

const PlotlyChart = () => {
  const [plotData, setPlotData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true); // Add loading state
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const { nodes } = useKnowledgeGraphContext();

  // Load initial empty plot structure
  useEffect(() => {
    const loadEmptyPlot = async () => {
      setIsLoading(true);
      try {
        const response = await fetch("/emptyPlot.json");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const emptyPlot = await response.json();
        setPlotData(emptyPlot);
      } catch (error) {
        console.error("Error loading empty plot:", error);
      } finally {
        setIsLoading(false);
      }
    };
    loadEmptyPlot();
  }, []);

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="w-full h-[800px] flex items-center justify-center border border-gray-200 rounded-lg bg-white">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-lg text-gray-600">Loading chart...</p>
          </div>
        </div>
      );
    }

    if (!finalPlotData) {
      return (
        <div className="w-full h-[800px] flex items-center justify-center border border-gray-200 rounded-lg bg-white">
          <p className="text-lg text-gray-600">No data available</p>
        </div>
      );
    }

    return (
      <div
        ref={containerRef}
        className="w-full h-[800px] border border-gray-200 rounded-lg bg-white"
        style={{ minHeight: "800px" }}
      >
        <Plot
          data={finalPlotData.data}
          layout={{
            ...finalPlotData.layout,
            width: dimensions.width,
            height: dimensions.height,
          }}
          config={{
            responsive: true,
            displayModeBar: true,
            displaylogo: false,
            scrollZoom: true,
          }}
          style={{ width: "100%", height: "100%" }}
          onInitialized={() => setIsLoading(false)}
          onUpdate={() => setIsLoading(false)}
        />
      </div>
    );
  };

  // Update plot when nodes or edges change  // Update plot when nodes change
  const getUpdatedPlotData = useCallback(() => {
    if (!plotData || !nodes?.nodes) return null;

    const updatedPlot = {
      ...plotData,
      data: [
        {
          type: "scatter3d",
          mode: "lines",
          x: [],
          y: [],
          z: [],
          line: { color: "black", width: 2 },
          hoverinfo: "none",
        },
        {
          type: "scatter3d",
          mode: "markers+text",
          x: nodes.nodes.map((node) => node.x),
          y: nodes.nodes.map((node) => node.y),
          z: nodes.nodes.map((node) => node.z),
          text: nodes.nodes.map((node) => node.label),
          textposition: "top center",
          marker: {
            symbol: "circle",
            size: 10,
            color: nodes.nodes.map((_, i) => i),
            line: { color: "black", width: 0.5 },
          },
          hoverinfo: "text",
        },
      ],
    };

    // Add edges if they exist
    if (nodes.edges && nodes.edges.length > 0) {
      const edgeTraces = {
        x: [] as (number | null)[],
        y: [] as (number | null)[],
        z: [] as (number | null)[],
      };

      nodes.edges.forEach((edge) => {
        const sourceNode = nodes.nodes.find((n) => n.id === edge.source);
        const targetNode = nodes.nodes.find((n) => n.id === edge.target);

        if (
          sourceNode?.x != null &&
          sourceNode?.y != null &&
          sourceNode?.z != null &&
          targetNode?.x != null &&
          targetNode?.y != null &&
          targetNode?.z != null
        ) {
          edgeTraces.x.push(sourceNode.x, targetNode.x, null);
          edgeTraces.y.push(sourceNode.y, targetNode.y, null);
          edgeTraces.z.push(sourceNode.z, targetNode.z, null);
        }
      });

      updatedPlot.data[0] = {
        ...updatedPlot.data[0],
        x: edgeTraces.x,
        y: edgeTraces.y,
        z: edgeTraces.z,
      };
    }

    return updatedPlot;
  }, [nodes, plotData]);

  // Handle window resize
  useEffect(() => {
    const updateDimensions = () => {
      if (containerRef.current) {
        const newDimensions = {
          width: containerRef.current.clientWidth,
          height: Math.max(containerRef.current.clientHeight, 800),
        };
        while (containerRef.current.firstChild) {
          containerRef.current.firstChild.remove();
        }
        setDimensions(newDimensions);
      }
    };

    window.addEventListener("resize", updateDimensions);
    updateDimensions();

    return () => window.removeEventListener("resize", updateDimensions);
  }, []);

  const finalPlotData = useMemo(
    () => getUpdatedPlotData(),
    [getUpdatedPlotData]
  );

  return (
    <div className="w-full h-screen p-4 bg-white">
      <Suspense
        fallback={
          <div className="w-full h-[800px] flex items-center justify-center border border-gray-200 rounded-lg bg-white">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-lg text-gray-600">Loading chart...</p>
            </div>
          </div>
        }
      >
        {renderContent()}
      </Suspense>
    </div>
  );
};

export default PlotlyChart;
