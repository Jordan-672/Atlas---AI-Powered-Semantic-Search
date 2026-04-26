import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

interface GraphNode {
  id: string;
  label: string;
  type: string;
  // D3 force simulation appends positional properties at runtime.
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

interface GraphEdge {
  // D3 replaces string IDs with node object references during simulation setup.
  source: string | GraphNode;
  target: string | GraphNode;
  label: string;
}

interface GraphViewProps {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

const GraphView: React.FC<GraphViewProps> = ({ nodes, edges }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [selectedNode, setSelectedNode] = useState<GraphNode | null>(null);

  useEffect(() => {
    if (!svgRef.current || nodes.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll("*").remove();

    const width = svgRef.current.clientWidth;
    const height = svgRef.current.clientHeight;

    const defs = svg.append("defs");

    // Glow filter applied to nodes for visual depth.
    const filter = defs.append("filter").attr("id", "glow");
    filter.append("feGaussianBlur").attr("stdDeviation", "3").attr("result", "coloredBlur");
    const feMerge = filter.append("feMerge");
    feMerge.append("feMergeNode").attr("in", "coloredBlur");
    feMerge.append("feMergeNode").attr("in", "SourceGraphic");

    const g = svg.append("g");

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([0.1, 4])
      .on("zoom", (event) => {
        g.attr("transform", event.transform);
      });

    svg.call(zoom as any);

    // Deep-copy nodes and edges; D3 mutates input data with positional properties.
    const simNodes: GraphNode[] = nodes.map(n => ({ ...n }));
    const simEdges: GraphEdge[] = edges.map(e => ({ ...e }));

    const simulation = d3.forceSimulation<GraphNode>(simNodes)
      .force("link", d3.forceLink<GraphNode, GraphEdge>(simEdges)
        .id(d => d.id)
        .distance(120)
      )
      .force("charge", d3.forceManyBody().strength(-300))
      .force("center", d3.forceCenter(width / 2, height / 2))
      .force("collision", d3.forceCollide().radius(40))
      .alpha(1)
      .alphaDecay(0.03);

    const link = g.append("g")
      .selectAll("line")
      .data(simEdges)
      .enter()
      .append("line")
      .attr("stroke", "#3b5ea6")
      .attr("stroke-width", 1.5)
      .attr("stroke-opacity", 0.6)
      .attr("marker-end", "url(#arrow)");

    defs.append("marker")
      .attr("id", "arrow")
      .attr("viewBox", "0 -5 10 10")
      .attr("refX", 20)
      .attr("refY", 0)
      .attr("markerWidth", 6)
      .attr("markerHeight", 6)
      .attr("orient", "auto")
      .append("path")
      .attr("d", "M0,-5L10,0L0,5")
      .attr("fill", "#3b82f6");

    const linkLabel = g.append("g")
      .selectAll("text")
      .data(simEdges)
      .enter()
      .append("text")
      .text(d => d.label)
      .attr("font-size", "9px")
      .attr("fill", "#64748b")
      .attr("text-anchor", "middle");

    const node = g.append("g")
      .selectAll("circle")
      .data(simNodes)
      .enter()
      .append("circle")
      .attr("r", 10)
      .attr("fill", d => d.type === "file" ? "#1e3a5f" : "#1a2e1a")
      .attr("stroke", d => d.type === "file" ? "#3b82f6" : "#10b981")
      .attr("stroke-width", 2)
      .style("filter", "url(#glow)")
      .style("cursor", "pointer")
      .on("click", (event, d) => {
        setSelectedNode(prev => prev?.id === d.id ? null : d);
      })
      .call(
        d3.drag<SVGCircleElement, GraphNode>()
          .on("start", (event, d) => {
            if (!event.active) simulation.alphaTarget(0.3).restart();
            d.fx = d.x;
            d.fy = d.y;
          })
          .on("drag", (event, d) => {
            d.fx = event.x;
            d.fy = event.y;
          })
          .on("end", (event, d) => {
            if (!event.active) simulation.alphaTarget(0);
            // Release fixed position so the node re-enters the simulation.
            d.fx = null;
            d.fy = null;
          }) as any
      );

    const label = g.append("g")
      .selectAll("text")
      .data(simNodes)
      .enter()
      .append("text")
      .text(d => d.label.length > 20 ? d.label.slice(0, 17) + "..." : d.label)
      .attr("font-size", "10px")
      .attr("fill", "#e2e8f0")
      .attr("dy", "1.5em")
      .attr("text-anchor", "middle");

    simulation.on("tick", () => {
      link
        .attr("x1", d => (d.source as GraphNode).x!)
        .attr("y1", d => (d.source as GraphNode).y!)
        .attr("x2", d => (d.target as GraphNode).x!)
        .attr("y2", d => (d.target as GraphNode).y!);

      linkLabel
        .attr("x", d => ((d.source as GraphNode).x! + (d.target as GraphNode).x!) / 2)
        .attr("y", d => ((d.source as GraphNode).y! + (d.target as GraphNode).y!) / 2);

      node
        .attr("cx", d => d.x!)
        .attr("cy", d => d.y!);

      label
        .attr("x", d => d.x!)
        .attr("y", d => d.y!);
    });

    return () => {
      simulation.stop();
    };
  }, [nodes, edges]);

  return (
    <div className="relative w-full h-full">
      <div className="absolute top-3 left-3 z-10 text-xs text-atlas-muted bg-atlas-surface/80 backdrop-blur-sm px-3 py-2 rounded-lg border border-atlas-border">
        Scroll to zoom · Drag to pan · Click nodes
      </div>

      <svg ref={svgRef} className="w-full h-full" />

      {selectedNode && (
        <div className="absolute bottom-3 left-3 z-10 bg-atlas-surface border border-atlas-accent/30 rounded-xl p-4 max-w-xs animate-fade-in">
          <div className="text-sm font-mono text-atlas-accent mb-1">{selectedNode.label}</div>
          <div className="text-xs text-atlas-muted">{selectedNode.type}</div>
          <div className="text-xs text-atlas-muted/60 mt-1 break-all">{selectedNode.id}</div>
        </div>
      )}
    </div>
  );
};

export default GraphView;