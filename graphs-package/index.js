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
