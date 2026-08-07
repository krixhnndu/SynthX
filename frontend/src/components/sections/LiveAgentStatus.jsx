import { useMemo } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";
import { PipelineChecklist } from "../StageRail";
import { SectionHeading } from "../ui/Primitives";
import { RUN_STATE_HEX, runsByAgent } from "../../lib/pipeline";
import { titleCase } from "../../lib/format";

const STAGE_ROWS = [
  ["ocr_parsing"],
  ["clause_classification"],
  ["risk_assessment", "compliance_verification", "cross_document_comparison"],
  ["recommendation", "negotiation_strategy"],
  ["supervisor"],
  ["explainability"],
  ["report_generation"],
];

export default function LiveAgentStatus({ status, contractCase }) {
  const runs = status?.agents ?? [];
  const byName = runsByAgent(runs);

  const { nodes, edges } = useMemo(() => {
    const nodes = [];
    const edges = [];
    STAGE_ROWS.forEach((row, rowIndex) => {
      row.forEach((agent, colIndex) => {
        const run = byName[agent];
        const state = run?.status ?? "pending";
        const color = RUN_STATE_HEX[state];
        nodes.push({
          id: agent,
          position: { x: colIndex * 230 - (row.length - 1) * 115, y: rowIndex * 110 },
          data: { label: `${titleCase(agent).toUpperCase()}\n${state}` },
          style: {
            border: `1px solid ${state === "pending" ? "#1e242c" : color}`,
            borderLeft: `2px solid ${color}`,
            borderRadius: 2,
            padding: 10,
            width: 190,
            fontSize: 10,
            letterSpacing: "0.08em",
            lineHeight: 1.6,
            whiteSpace: "pre-line",
            background: "#10141a",
            color: state === "pending" ? "#59606a" : "#e9e6df",
            fontFamily: "IBM Plex Mono, monospace",
          },
        });
      });
      if (rowIndex > 0) {
        STAGE_ROWS[rowIndex - 1].forEach((from) => {
          row.forEach((to) =>
            edges.push({
              id: `${from}-${to}`,
              source: from,
              target: to,
              style: { stroke: "#1e242c", strokeWidth: 1 },
            })
          );
        });
      }
    });
    return { nodes, edges };
  }, [status]);

  return (
    <div>
      <SectionHeading title="Pipeline" meta={`${runs.length} agent runs recorded`} />

      <div className="mt-6 grid gap-10 xl:grid-cols-[1fr_320px]">
        <div className="border border-rule bg-surface" style={{ height: 620 }}>
          <ReactFlow nodes={nodes} edges={edges} fitView proOptions={{ hideAttribution: false }}>
            <Background color="#1e242c" gap={20} size={1} />
            <Controls showInteractive={false} />
          </ReactFlow>
        </div>

        <PipelineChecklist status={status} caseStatus={contractCase?.status} />
      </div>
    </div>
  );
}
