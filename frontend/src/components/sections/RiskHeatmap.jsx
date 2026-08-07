import {
  Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

const SEVERITY_COLOR = {
  low: "#5b8c5a", medium: "#c8922a", high: "#c25a2b", critical: "#a12b2b",
};
const SEVERITY_WEIGHT = { low: 1, medium: 2, high: 3, critical: 4 };

export default function RiskHeatmap({ contractCase }) {
  const findings = contractCase?.risk?.findings ?? [];
  const score = contractCase?.risk?.riskScore;

  if (findings.length === 0)
    return <p className="text-sm text-ink/60">Risk assessment runs at Stage 3.</p>;

  const byType = Object.values(
    findings.reduce((acc, f) => {
      const key = f.riskType;
      acc[key] ??= { riskType: key, weight: 0, severity: f.severity, count: 0 };
      acc[key].weight += SEVERITY_WEIGHT[f.severity] ?? 1;
      acc[key].count += 1;
      if (SEVERITY_WEIGHT[f.severity] > SEVERITY_WEIGHT[acc[key].severity])
        acc[key].severity = f.severity;
      return acc;
    }, {})
  );

  return (
    <div>
      <div className="mb-6">
        <div className="text-4xl font-display">{score?.toFixed(2) ?? "—"}</div>
        <div className="text-xs uppercase tracking-wide text-ink/50">Aggregate risk score</div>
      </div>

      <div className="bg-white border border-rule rounded p-4 mb-8" style={{ height: 320 }}>
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={byType} layout="vertical" margin={{ left: 40 }}>
            <XAxis type="number" hide />
            <YAxis dataKey="riskType" type="category" width={160} tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="weight" radius={[0, 3, 3, 0]}>
              {byType.map((entry, i) => (
                <Cell key={i} fill={SEVERITY_COLOR[entry.severity]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {findings.map((f, i) => (
        <div key={i} className="bg-white border border-rule rounded p-4 mb-3">
          <div className="flex justify-between items-baseline mb-2">
            <span
              className="text-xs uppercase tracking-wide px-2 py-0.5 rounded text-white"
              style={{ backgroundColor: SEVERITY_COLOR[f.severity] }}
            >
              {f.severity}
            </span>
            <span className="text-xs text-ink/50 font-mono">{f.clause_ref}</span>
          </div>
          <h4 className="font-medium mb-1">{f.riskType}</h4>
          <p className="text-sm mb-2">{f.rationale}</p>
          <dl className="text-xs text-ink/60 grid grid-cols-2 gap-2">
            <div><dt className="inline font-medium">Financial: </dt><dd className="inline">{f.financialImpact}</dd></div>
            <div><dt className="inline font-medium">Business: </dt><dd className="inline">{f.businessImpact}</dd></div>
          </dl>
        </div>
      ))}
    </div>
  );
}
