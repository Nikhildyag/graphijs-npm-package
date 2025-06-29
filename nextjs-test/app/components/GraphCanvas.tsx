'use client';

import React, { useEffect, useRef } from 'react';
import {
  UndirectedWeightedGraph,
  UndirectedUnweightedGraph,
  DirectedUnweightedGraph,
  DirectedWeightedGraph,
} from 'graphijs';

import GraphVisualizer from '../lib/GraphVisualizer'
import '../assests/App.css';

const GraphCanvas: React.FC = () => {
  const graphRef = useRef<HTMLDivElement>(null);

//   const graph = new DirectedWeightedGraph();

//   // Traffic flow with capacity (directed and weighted)
//   const metroLinks: [string, string, number][] = [
//     ['Downtown', 'Mall', 150],
//     ['Mall', 'Airport', 200],
//     ['Airport', 'Hotel District', 100],
//     ['Hotel District', 'Downtown', 75],
//     ['Downtown', 'University', 120],
//     ['University', 'Hospital', 90],
//     ['Hospital', 'Mall', 110],
//     ['Mall', 'Residential Area', 180],
//     ['Residential Area', 'School District', 95],
//     ['School District', 'Downtown', 130],
//     ['University', 'Tech Park', 160],
//     ['Tech Park', 'Airport', 140],
//     ['Tech Park', 'Mall', 85],
//     ['Hospital', 'Residential Area', 70],
//     ['Residential Area', 'University', 105],
//   ];

    //   const mainNodes: string[] = ['Downtown', 'Mall', 'Airport', 'University'];
    
    const graph = new UndirectedUnweightedGraph();
  
    // Social network connections (no weights, no direction)
    const metroLinks = [
      ['Alice', 'Bob'],
      ['Bob', 'Charlie'],
      ['Charlie', 'David'],
      ['David', 'Alice'],
      ['Alice', 'Eve'],
      ['Eve', 'Frank'],
      ['Frank', 'Bob'],
      ['Charlie', 'Grace'],
      ['Grace', 'David'],
      ['Frank', 'Henry'],
      ['Henry', 'Alice']
    ];
  
  const mainNodes = ['Alice', 'Bob', 'Charlie'];

  metroLinks.forEach(([from, to, weight]) => {
    graph.addLink(from, to, weight);
  });

  mainNodes.forEach((node) => {
    graph.setMainNode(node);
  });

  useEffect(() => {
    const visualizer = new GraphVisualizer();
    if (graphRef.current) {
      visualizer.visualize(graph, graphRef.current.id, {
        directed: false,
        showWeights: true,
        layout: 'force',
      });
    }

    return () => {
      visualizer.destroy();
    };
  }, []);

  return (
    <div className="App">
      <h2 className="heading">Graph</h2>
      <div
        id="metro-graph"
        ref={graphRef}
        className="graph-box"
        style={{
          height: '700px',
          width: '95vw',
          maxWidth: '1600px',
          margin: '0 auto',
        }}
      ></div>
    </div>
  );
};

export default GraphCanvas;
