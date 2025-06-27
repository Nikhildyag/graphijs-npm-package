import { UndirectedUnweightedGraph } from "../graphs-package/index.js";
var g = UndirectedUnweightedGraph();
g.addNode("A");
g.addLink("A", "B");
g.addLink("A", "C");
// g.addLink("A", 1);
g.addLink("B", "C");
console.log(g.hasNode("C")); // true
g.hasLink("B", "A"); // true
// g.removeLink("C", "A");
console.log(g.connectedWith("C")); // ["A", "B"]