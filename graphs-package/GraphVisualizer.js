import * as d3 from 'd3';

class GraphVisualizer {
  constructor() {
    this.svg = null;
    this.simulation = null;
    this.nodes = [];
    this.links = [];
    this.defaultOptions = {
      layout: 'force',
      nodeColor: '#667eea',
      edgeColor: '#34495e',
      backgroundColor: '#fafafa',
      animated: true,
      nodeRadius: 20,
      minEdgeWidth: 1,
      maxEdgeWidth: 8
    };
  }

  async visualize(graph, containerId, options = {}) {
    const graphProperties = this.detectGraphProperties(graph);
    const config = { 
      ...this.defaultOptions, 
      ...graphProperties, 
      ...options 
    };
    
    const container = document.getElementById(containerId);
    if (!container) {
      throw new Error(`Container with id '${containerId}' not found`);
    }

    container.innerHTML = '';
    
    if (typeof d3 === 'undefined') {
      await this.loadD3Library();
    }

    container.style.backgroundColor = config.backgroundColor;
    
    const rect = container.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 600;

    const graphData = this.convertGraphToD3(graph, width, height);
    this.nodes = graphData.nodes;
    this.links = graphData.links;

    if (this.nodes.length === 0) {
      console.warn('No nodes found in graph');
      return null;
    }

    this.calculateWeightScaling(config);

    this.svg = d3.select(container)
      .append('svg')
      .attr('width', width)
      .attr('height', height)
      .style('background-color', config.backgroundColor);

    const g = this.svg.append('g');
    
    const zoom = d3.zoom()
      .scaleExtent([0.1, 5])
      .on('zoom', (event) => {
        g.attr('transform', event.transform);
      });
    
    this.svg.call(zoom);

    this.createVisualization(g, config, width, height);

    return this.svg;
  }

  detectGraphProperties(graph) {
    const properties = {
      directed: false,
      weighted: false,
      showWeights: false
    };

    if (graph.isDirected !== undefined) {
      properties.directed = graph.isDirected;
    } else if (graph.constructor.name.includes('Directed')) {
      properties.directed = true;
    }

    if (graph.isWeighted !== undefined) {
      properties.weighted = graph.isWeighted;
    } else if (graph.constructor.name.includes('Weighted')) {
      properties.weighted = true;
      properties.showWeights = true;
    }

    if (graph.linkWeight && graph.nodes().length > 0) {
      try {
        const nodes = graph.nodes();
        if (nodes.length >= 2) {
          const connected = graph.connectedWith(nodes[0]);
          if (connected.length > 0) {
            const weight = graph.linkWeight(nodes[0], connected[0]);
            if (weight !== undefined) {
              properties.weighted = true;
              properties.showWeights = true;
            }
          }
        }
      } catch (e) {
        // If linkWeight throws an error, it's probably not weighted
      }
    }

    return properties;
  }

  calculateWeightScaling(config) {
    if (!config.weighted || this.links.length === 0) {
      this.weightScale = null;
      return;
    }

    const weights = this.links.map(link => link.weight);
    const minWeight = Math.min(...weights);
    const maxWeight = Math.max(...weights);

    this.weightScale = d3.scaleLinear()
      .domain([minWeight, maxWeight])
      .range([config.minEdgeWidth, config.maxEdgeWidth])
      .clamp(true);

    this.weightStats = { minWeight, maxWeight };
  }

  getEdgeWidth(weight, config) {
    return 2; // Fixed edge width for all graphs
  }

  async loadD3Library() {
    return new Promise((resolve, reject) => {
      if (typeof d3 === 'undefined') {
        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/d3/7.8.5/d3.min.js';
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load D3.js'));
        document.head.appendChild(script);
      } else {
        resolve();
      }
    });
  }

  convertGraphToD3(graph, width, height) {
    const nodes = [];
    const links = [];
    const nodeMap = new Map();
      
    const mainNodes = graph.getMainNodes ? new Set(graph.getMainNodes()) : new Set();

    const graphNodes = graph.nodes();
    if (!graphNodes || graphNodes.length === 0) {
      console.warn('Graph has no nodes');
      return { nodes: [], links: [] };
    }

    const isActuallyWeighted = this.isGraphActuallyWeighted(graph);

    graphNodes.forEach((nodeId, index) => {
      const angle = (index / graphNodes.length) * 2 * Math.PI;
      const radius = Math.min(width, height) / 4;
      
      const node = {
        id: nodeId,
        label: this.truncateLabel(nodeId.toString()),
        originalId: nodeId,
        index: index,
        isMain: mainNodes.has(nodeId),
        x: width / 2 + Math.cos(angle) * radius,
        y: height / 2 + Math.sin(angle) * radius
      };
      nodes.push(node);
      nodeMap.set(nodeId, node);
    });

    const addedEdges = new Set();
    const isDirected = graph.isDirected !== undefined ? graph.isDirected : 
                     (graph.constructor.name.includes('Directed'));

    graphNodes.forEach(node1 => {
      try {
        const connected = graph.connectedWith(node1);
        if (!connected || !Array.isArray(connected)) {
          return;
        }
        
        connected.forEach(node2 => {
          if (!nodeMap.has(node1) || !nodeMap.has(node2)) {
            return;
          }
          
          const edgeKey = isDirected ? 
            `${node1}->${node2}` : 
            [node1, node2].sort().join('<->');

          if (!addedEdges.has(edgeKey)) {
            addedEdges.add(edgeKey);
            
            let weight = 1;
            if (graph.linkWeight) {
              try {
                weight = graph.linkWeight(node1, node2);
                if (weight === undefined || weight === null || isNaN(weight)) {
                  weight = 1;
                }
              } catch (e) {
                weight = 1;
              }
            }
            
            const link = {
              source: nodeMap.get(node1),
              target: nodeMap.get(node2),
              weight: weight,
              originalSource: node1,
              originalTarget: node2
            };
            
            if (isActuallyWeighted && weight !== 1) {
              link.label = weight.toString();
            }
            
            links.push(link);
          }
        });
      } catch (e) {
        console.warn('Error processing connections for node:', node1, e);
      }
    });

    console.log(`Converted graph: ${nodes.length} nodes, ${links.length} links`);
    return { nodes, links };
  }

  isGraphActuallyWeighted(graph) {
    if (graph.isWeighted !== undefined) {
      return graph.isWeighted;
    }
    if (graph.constructor.name.includes('Weighted')) {
      return true;
    }
    
    if (graph.linkWeight && graph.nodes().length > 0) {
      try {
        const nodes = graph.nodes();
        if (nodes.length >= 2) {
          const connected = graph.connectedWith(nodes[0]);
          if (connected.length > 0) {
            const weight = graph.linkWeight(nodes[0], connected[0]);
            return weight !== undefined && weight !== 1;
          }
        }
      } catch (e) {
        // If linkWeight throws an error, it's probably not weighted
      }
    }
    
    return false;
  }

  createVisualization(g, config, width, height) {
    const isDirected = config.directed;
    const showWeights = config.showWeights;
      
    if (isDirected) {
      const defs = this.svg.append('defs');
      defs.append('marker')
        .attr('id', 'arrowhead')
        .attr('viewBox', '0 -5 10 10')
        .attr('refX', 15)
        .attr('refY', 0)
        .attr('markerWidth', 6)
        .attr('markerHeight', 6)
        .attr('orient', 'auto')
        .append('path')
        .attr('d', 'M0,-5L10,0L0,5')
        .attr('fill', config.edgeColor);
    }

    const link = g.append('g')
      .attr('class', 'links')
      .selectAll('line')
      .data(this.links)
      .enter().append('line')
      .attr('stroke', config.edgeColor)
      .attr('stroke-width', d => this.getEdgeWidth(d.weight, config))
      .attr('marker-end', d => isDirected ? 'url(#arrowhead)' : null)
      .style('opacity', 0.8);

    const linkLabels = g.append('g')
      .attr('class', 'link-labels')
      .selectAll('text')
      .data(showWeights ? this.links.filter(d => d.label) : [])
      .enter().append('text')
      .attr('class', 'link-label')
      .attr('text-anchor', 'middle')
      .attr('font-size', '10px')
      .attr('font-weight', 'bold')
      .attr('fill', '#2c3e50')
      .attr('stroke', 'white')
      .attr('stroke-width', '2px')
      .attr('paint-order', 'stroke')
      .text(d => d.label);

    const node = g.append('g')
      .attr('class', 'nodes')
      .selectAll('circle')
      .data(this.nodes)
      .enter().append('circle')
      .attr('r', config.nodeRadius)
      .attr('fill', d => d.isMain ? '#e74c3c' : config.nodeColor)
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 2)
      .style('cursor', 'pointer');

    const nodeLabels = g.append('g')
      .attr('class', 'node-labels')
      .selectAll('text')
      .data(this.nodes)
      .enter().append('text')
      .attr('class', 'node-label')
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('font-size', '12px')
      .attr('font-weight', 'bold')
      .attr('fill', '#2c3e50')
      .attr('pointer-events', 'none')
      .text(d => d.label);

    this.applyLayout(config.layout, width, height, config);
    this.setupInteractions(node, link, nodeLabels, linkLabels, config);

    this.linkElements = link;
    this.nodeElements = node;
    this.nodeLabelElements = nodeLabels;
    this.linkLabelElements = linkLabels;
    this.containerG = g;
  }

  applyLayout(layoutType, width, height, config) {
    switch (layoutType) {
      case 'force':
        this.applyForceLayout(width, height, config);
        break;
      case 'circle':
        this.applyCircleLayout(width, height);
        break;
      case 'grid':
        this.applyGridLayout(width, height);
        break;
      case 'tree':
        this.applyTreeLayout(width, height);
        break;
      default:
        this.applyForceLayout(width, height, config);
    }
  }

  applyForceLayout(width, height, config) {
    this.nodes.forEach(node => {
      if (isNaN(node.x) || isNaN(node.y)) {
        node.x = width / 2 + (Math.random() - 0.5) * 100;
        node.y = height / 2 + (Math.random() - 0.5) * 100;
      }
    });

    const linkDistance = 80;

    if (this.simulation) {
      this.simulation.stop();
    }

    this.simulation = d3.forceSimulation(this.nodes)
      .force('link', d3.forceLink(this.links).id(d => d.id).distance(linkDistance))
      .force('charge', d3.forceManyBody().strength(-200))
      .force('center', d3.forceCenter(width / 2, height / 2))
      .force('collision', d3.forceCollide().radius(config.nodeRadius + 5));

    if (config.animated) {
      this.simulation.on('tick', () => {
        this.nodes.forEach(node => {
          if (isNaN(node.x) || isNaN(node.y)) {
            node.x = width / 2 + (Math.random() - 0.5) * 100;
            node.y = height / 2 + (Math.random() - 0.5) * 100;
          }
        });
        
        this.updatePositions();
      });

      this.simulation.alphaDecay(0.01);
      this.simulation.alphaMin(0.005);
      this.simulation.velocityDecay(0.4);
      
    } else {
      this.simulation.stop();
      for (let i = 0; i < 200; ++i) {
        this.simulation.tick();
        this.nodes.forEach(node => {
          if (isNaN(node.x) || isNaN(node.y)) {
            node.x = width / 2 + (Math.random() - 0.5) * 100;
            node.y = height / 2 + (Math.random() - 0.5) * 100;
          }
        });
      }
      this.updatePositions();
    }
  }

  applyCircleLayout(width, height) {
    const radius = Math.min(width, height) / 2 - 50;
    const angleStep = (2 * Math.PI) / this.nodes.length;
    
    this.nodes.forEach((node, i) => {
      const angle = i * angleStep;
      node.x = width / 2 + radius * Math.cos(angle);
      node.y = height / 2 + radius * Math.sin(angle);
      node.fx = node.x;
      node.fy = node.y;
    });
    
    this.updatePositions();
  }

  applyGridLayout(width, height) {
    const cols = Math.ceil(Math.sqrt(this.nodes.length));
    const rows = Math.ceil(this.nodes.length / cols);
    const cellWidth = (width - 100) / cols;
    const cellHeight = (height - 100) / rows;
    
    this.nodes.forEach((node, i) => {
      const col = i % cols;
      const row = Math.floor(i / cols);
      node.x = 50 + col * cellWidth + cellWidth / 2;
      node.y = 50 + row * cellHeight + cellHeight / 2;
      node.fx = node.x;
      node.fy = node.y;
    });
    
    this.updatePositions();
  }

  applyTreeLayout(width, height) {
    const levels = new Map();
    const visited = new Set();
    
    if (this.nodes.length === 0) return;
    
    const queue = [this.nodes[0]];
    levels.set(this.nodes[0].id, 0);
    visited.add(this.nodes[0].id);
    
    while (queue.length > 0) {
      const current = queue.shift();
      const currentLevel = levels.get(current.id);
      
      this.links.forEach(link => {
        let next = null;
        if (link.source.id === current.id && !visited.has(link.target.id)) {
          next = link.target;
        } else if (link.target.id === current.id && !visited.has(link.source.id)) {
          next = link.source;
        }
        
        if (next) {
          levels.set(next.id, currentLevel + 1);
          visited.add(next.id);
          queue.push(next);
        }
      });
    }
    
    const levelCounts = new Map();
    this.nodes.forEach(node => {
      const level = levels.get(node.id) || 0;
      levelCounts.set(level, (levelCounts.get(level) || 0) + 1);
    });
    
    const levelCounters = new Map();
    this.nodes.forEach(node => {
      const level = levels.get(node.id) || 0;
      const count = levelCounters.get(level) || 0;
      levelCounters.set(level, count + 1);
      
      const totalAtLevel = levelCounts.get(level);
      const spacing = width / (totalAtLevel + 1);
      
      node.x = spacing * count;
      node.y = 100 + level * 80;
      node.fx = node.x;
      node.fy = node.y;
    });
    
    this.updatePositions();
  }

  updatePositions() {
    if (this.linkElements) {
      this.linkElements
        .attr('x1', d => isNaN(d.source.x) ? 0 : d.source.x)
        .attr('y1', d => isNaN(d.source.y) ? 0 : d.source.y)
        .attr('x2', d => isNaN(d.target.x) ? 0 : d.target.x)
        .attr('y2', d => isNaN(d.target.y) ? 0 : d.target.y);
    }

    if (this.linkLabelElements) {
      this.linkLabelElements
        .attr('x', d => {
          const x = (d.source.x + d.target.x) / 2;
          return isNaN(x) ? 0 : x;
        })
        .attr('y', d => {
          const y = (d.source.y + d.target.y) / 2;
          return isNaN(y) ? 0 : y;
        });
    }

    if (this.nodeElements) {
      this.nodeElements
        .attr('cx', d => isNaN(d.x) ? 0 : d.x)
        .attr('cy', d => isNaN(d.y) ? 0 : d.y);
    }

    if (this.nodeLabelElements) {
      this.nodeLabelElements
        .attr('x', d => isNaN(d.x) ? 0 : d.x)
        .attr('y', d => isNaN(d.y) ? 0 : d.y);
    }
  }

  setupInteractions(node, link, nodeLabels, linkLabels, config) {
    // Node click interaction - changed color to orange (#f39c12)
    node.on('click', (event, d) => {
      console.log('Node clicked:', d.originalId || d.label);
      
      link.style('stroke', config.edgeColor).style('opacity', 0.3);
      node.attr('fill', d => d.isMain ? '#e74c3c' : config.nodeColor);
      
      // Changed clicked node color from red to orange
      d3.select(event.target).attr('fill', '#f39c12');
      
      link.filter(linkData => 
        linkData.source.id === d.id || linkData.target.id === d.id
      ).style('stroke', '#667eea').style('opacity', 1);
    });

    link.on('click', (event, d) => {
      console.log('Edge clicked:', {
        from: d.originalSource || d.source.id,
        to: d.originalTarget || d.target.id,
        weight: d.weight
      });
    });

    this.svg.on('click', (event) => {
      if (event.target === event.currentTarget) {
        link.style('stroke', config.edgeColor).style('opacity', 0.8);
        node.attr('fill', d => d.isMain ? '#e74c3c' : config.nodeColor);
      }
    });

    const drag = d3.drag()
      .on('start', (event, d) => {
        if (!event.active && this.simulation) {
          this.simulation.alphaTarget(0.3).restart();
        }
        d.fx = d.x;
        d.fy = d.y;
      })
      .on('drag', (event, d) => {
        d.fx = event.x;
        d.fy = event.y;
        d.x = event.x;
        d.y = event.y;
        this.updatePositions();
      })
      .on('end', (event, d) => {
        if (!event.active && this.simulation) {
          this.simulation.alphaTarget(0.1);
        }
      });

    node.call(drag);

    node.on('mouseover', function(event, d) {
      d3.select(this).attr('r', config.nodeRadius + 5);
    }).on('mouseout', function(event, d) {
      d3.select(this).attr('r', config.nodeRadius);
    });

    node.on('dblclick', (event, d) => {
      d.fx = null;
      d.fy = null;
      if (this.simulation) {
        this.simulation.alphaTarget(0.3).restart();
      }
    });
  }

  truncateLabel(label, maxLength = 15) {
    if (label.length <= maxLength) return label;
    return label.substring(0, maxLength - 3) + '...';
  }

  changeLayout(layoutName, options = {}) {
    if (!this.svg) return;
    
    const rect = this.svg.node().getBoundingClientRect();
    const config = { ...this.defaultOptions, ...options, layout: layoutName };
    
    if (options.resetPositions) {
      this.nodes.forEach(node => {
        node.fx = null;
        node.fy = null;
      });
    }
    
    this.applyLayout(layoutName, rect.width, rect.height, config);
  }

  unfixAllNodes() {
    this.nodes.forEach(node => {
      node.fx = null;
      node.fy = null;
    });
    if (this.simulation) {
      this.simulation.alphaTarget(0.3).restart();
    }
  }

  fixAllNodes() {
    this.nodes.forEach(node => {
      node.fx = node.x;
      node.fy = node.y;
    });
  }

  export(format = 'png', options = {}) {
    if (!this.svg) return null;
    
    const svgData = new XMLSerializer().serializeToString(this.svg.node());
    const svgBlob = new Blob([svgData], {type: 'image/svg+xml;charset=utf-8'});
    return svgBlob;
  }

  destroy() {
    if (this.simulation) {
      this.simulation.stop();
      this.simulation = null;
    }
    if (this.svg) {
      this.svg.remove();
      this.svg = null;
    }
  }

  updateGraph(graph, options = {}) {
    if (!this.svg) return;
    
    this.svg.selectAll('g').remove();
    
    const rect = this.svg.node().getBoundingClientRect();
    const graphData = this.convertGraphToD3(graph, rect.width, rect.height);
    this.nodes = graphData.nodes;
    this.links = graphData.links;
    
    const config = { ...this.defaultOptions, ...options };
    this.calculateWeightScaling(config);
    
    const g = this.svg.append('g');
    
    this.createVisualization(g, config, rect.width, rect.height);
  }
}

export default GraphVisualizer;