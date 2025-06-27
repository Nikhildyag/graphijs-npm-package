"use strict";
import Graph from "./Graph.js";
import { createGraph } from "./Graph.js";

// module.exports = {
//   UndirectedUnweightedGraph: Graph.createGraph(false, false),
//   DirectedUnweightedGraph: Graph.createGraph(true, false),
//   DirectedWeightedGraph: Graph.createGraph(true, true),
//   UndirectedWeightedGraph: Graph.createGraph(false, true),
// };
export const UndirectedUnweightedGraph = createGraph(false, true);
export const DirectedUnweightedGraph = createGraph(true, false);
export const DirectedWeightedGraph = createGraph(true, true);
export const UndirectedWeightedGraph = createGraph(false, true);

// Export the base Graph class
export { Graph };

// Export visualization functionality
export { GraphVisualizer };

// Simple visualization function
export function visualizeGraph(graph, containerId, options = {}) {
  const visualizer = new GraphVisualizer();
  return visualizer.visualize(graph, containerId, options);
}
