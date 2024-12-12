"use client";

import React, { useEffect, useState } from "react";
import { PlotParams } from "react-plotly.js";
import dynamic from "next/dynamic";

// Dynamic import of Plot component with SSR disabled
const Plot = dynamic(() => import("react-plotly.js"), {
  ssr: false,
}) as React.ComponentType<Partial<PlotParams>>;

const plotLayout = {
  title: "Sample 3D Network Model",
  width: 650,
  height: 625,
  showlegend: false,
  margin: { t: 100 },
};

const PlotlyChart = () => {
  const [plotData, setPlotData] = useState<any>(null);

  const fetchPlotData = async () => {
    try {
      const response = await fetch("/api/plotdata");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      // console.log("Plot data:", data);
      setPlotData(data);
    } catch (error) {
      console.error("Error loading JSON:", error);
    }
  };

  useEffect(() => {
    fetchPlotData();
  }, []);

  return (
    <div className="lg:flex lg:h-full lg:flex-col xl:pl-[8em] h-full w-full">
      {plotData ? (
        <Plot
          data={plotData.data}
          layout={plotLayout}
          config={plotData.config || { responsive: true }}
        />
      ) : (
        <p>Loading chart...</p>
      )}
      <span className="text-lg">
        !!! This does not represent the filetree... yet.
      </span>
    </div>
  );
};

export default PlotlyChart;
