class Graph {
  constructor(isDirected = false, isWeighted = false) {
    this.isDirected = isDirected;
    this.isWeighted = isWeighted;
    this.counterId = 0;
    this.keyToIdTable = {};
    this.idToKeyTable = {};
    this.links = {};
    this.mainNodes = new Set();
  }

  type() {
    return {
      weighted: this.isWeighted,
      directed: this.isDirected,
    };
  }

  addNode(key) {
    if (this.keyToIdTable[key] === undefined) {
      const id = this.counterId++;
      this.keyToIdTable[key] = id;
      this.idToKeyTable[id] = key;
      this.links[id] = {};
      return true;
    }
    return false;
  }

  addLink(key1, key2, weight) {
    if (key1 === key2) {
      return false;
    }
    if (this.hasLink(key1, key2)) {
      return false;
    }
    if (!this.isWeighted || weight === undefined) {
      weight = 1;
    }
    if (isNaN(weight) || typeof weight !== "number" || !isFinite(weight)) {
      throw new TypeError("Weight must be a finite number");
    }
    if (!this.hasNode(key1)) {
      this.addNode(key1);
    }
    if (!this.hasNode(key2)) {
      this.addNode(key2);
    }
    const id1 = this.keyToIdTable[key1];
    const id2 = this.keyToIdTable[key2];
    this.links[id1][id2] = weight;
    if (!this.isDirected) {
      this.links[id2][id1] = weight;
    }
    return true;
  }

  hasNode(key) {
    return this.keyToIdTable[key] !== undefined;
  }

  hasLink(key1, key2) {
    return (
      this.hasNode(key1) &&
      this.hasNode(key2) &&
      this.links[this.keyToIdTable[key1]][this.keyToIdTable[key2]] !== undefined
    );
  }

  removeLink(key1, key2) {
    if (!this.hasLink(key1, key2)) {
      return false;
    }
    const id1 = this.keyToIdTable[key1];
    const id2 = this.keyToIdTable[key2];
    delete this.links[id1][id2];
    if (!this.isDirected) {
      delete this.links[id2][id1];
    }
    return true;
  }

  linkWeight(key1, key2) {
    if (!this.hasLink(key1, key2)) {
      return undefined;
    } else {
      return this.links[this.keyToIdTable[key1]][this.keyToIdTable[key2]];
    }
  }

  connectedWith(key) {
    if (!this.hasNode(key)) {
      return undefined;
    }
    const result = [];
    const ids = Object.keys(this.links[this.keyToIdTable[key]]);
    for (const id of ids) {
      result.push(this.idToKeyTable[id]);
    }
    return result;
  }

  removeNode(key) {
    if (!this.hasNode(key)) {
      return false;
    }
    const neighbours = this.connectedWith(key);
    for (const neighbour of neighbours) {
      this.removeLink(key, neighbour);
      if (this.isDirected) {
        this.removeLink(neighbour, key);
      }
    }
    const id = this.keyToIdTable[key];
    delete this.links[id];
    delete this.keyToIdTable[key];
    delete this.idToKeyTable[id];
    return true;
  }

  nodes() {
    const res = [];
    for (const id in this.idToKeyTable) {
      res.push(this.idToKeyTable[id]);
    }
    return res;
  }

  setMainNode(key) {
    if (this.hasNode(key)) {
      this.mainNodes.add(key);
      return true;
    }
    return false;
  }

  getMainNodes() {
    return Array.from(this.mainNodes);
  }

  dijkstra(startKey, endKey) {
    if (!this.hasNode(startKey) || !this.hasNode(endKey)) {
      return { path: [], distance: Infinity };
    }

    const distances = {};
    const previous = {};
    const visited = new Set();
    const queue = [];

    for (const node of this.nodes()) {
      distances[node] = Infinity;
      previous[node] = null;
    }
    distances[startKey] = 0;
    queue.push(startKey);

    while (queue.length > 0) {
      queue.sort((a, b) => distances[a] - distances[b]);
      const current = queue.shift();

      if (visited.has(current)) continue;
      visited.add(current);

      if (current === endKey) break;

      const neighbors = this.connectedWith(current);
      if (neighbors) {
        for (const neighbor of neighbors) {
          if (!visited.has(neighbor)) {
            const alt = distances[current] + this.linkWeight(current, neighbor);
            if (alt < distances[neighbor]) {
              distances[neighbor] = alt;
              previous[neighbor] = current;
              if (!queue.includes(neighbor)) {
                queue.push(neighbor);
              }
            }
          }
        }
      }
    }

    const path = [];
    let current = endKey;
    while (current !== null) {
      path.unshift(current);
      current = previous[current];
    }

    if (path.length === 0 || path[0] !== startKey) {
      return { path: [], distance: Infinity };
    }

    return { path, distance: distances[endKey] };
  }

  findAllPaths(startKey, endKey, visited = new Set(), path = []) {
    if (!this.hasNode(startKey) || !this.hasNode(endKey)) {
      return [];
    }

    visited.add(startKey);
    path.push(startKey);

    if (startKey === endKey) {
      return [path.slice()];
    }

    const allPaths = [];
    const neighbors = this.connectedWith(startKey);
    
    if (neighbors) {
      for (const neighbor of neighbors) {
        if (!visited.has(neighbor)) {
          const paths = this.findAllPaths(neighbor, endKey, visited, path);
          allPaths.push(...paths);
        }
      }
    }

    path.pop();
    visited.delete(startKey);
    return allPaths;
  }
}

export function createGraph(isDirected, isWeighted) {
  return function () {
    return new Graph(isDirected, isWeighted);
  };
}

export default Graph;