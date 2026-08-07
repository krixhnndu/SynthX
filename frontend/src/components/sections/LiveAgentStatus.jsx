import { useMemo } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import "reactflow/dist/style.css";

const STAGE_ROWS = [
  ["ocr_parsing"],
  ["clause_classification"],
  ["risk_assessment", "compliance_verification", "cross_document_comparison"],
  ["recommendation", "negotiation_strategy"],
  ["supervisor"],
  ["explainability"],
  ["report_generation"],
];

const STATUS_COLOR = {
  pending: "#d9d6cf", running: "#c8922a", completed: "#5b8c5a",
  failed: "#a12b2b", skipped: "#9a9a9a",
};

export default function LiveAgentStatus({ status }) {
  const runs = status?.agents ?? [];
  const byName = Object.fromEntries(runs.map((r) => [r.agent, r]));

  const { nodes, edges } = useMemo(() => {
    const nodes = [];
    const edges = [];
    STAGE_ROWS.forEach((row, rowIndex) => {
      row.forEach((agent, colIndex) => {
        const run = byName[agent];
        const state = run?.status ?? "pending";
        nodes.push({
          id: agent,
          position: { x: colIndex * 230 - (row.length - 1) * 115, y: rowIndex * 110 },
          data: { label: `${agent.replace(/_/g, " ")}\n${state}` },
          style: {
            border: `2px solid ${STATUS_COLOR[state]}`,
            borderRadius: 6, padding: 8, width: 190,
            fontSize: 12, whiteSpace: "pre-line", background: "#fff",
          },
        });
      });
      if (rowIndex > 0) {
        STAGE_ROWS[rowIndex - 1].forEach((from) => {
          row.forEach((to) => edges.push({ id: `${from}-${to}`, source: from, target: to }));
        });
      }
    });
    return { nodes, edges };
  }, [status]);

  return (
    <div className="bg-white border border-rule rounded" style={{ height: 620 }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
}
