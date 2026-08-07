import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { SeverityTag } from "../ui/Tags";
import { Eyebrow, NotYet, SectionHeading } from "../ui/Primitives";
import {
  SEVERITY_BAR,
  SEVERITY_HEX,
  SEVERITY_ORDER,
  SEVERITY_TEXT,
  SEVERITY_WEIGHT,
  riskBand,
  titleCase,
} from "../../lib/format";

const cx = (...parts) => parts.filter(Boolean).join(" ");

function ChartTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="border border-ruleHi bg-surface px-3 py-2">
      <div className="font-mono text-2xs uppercase tracking-label text-ink">
        {titleCase(d.riskType)}
      </div>
      <div className="mt-1 text-xs text-muted">
        {d.count} finding{d.count === 1 ? "" : "s"} · peak {d.severity}
      </div>
    </div>
  );
}

export default function RiskHeatmap({ contractCase }) {
  const findings = contractCase?.risk?.findings ?? [];
  const score = contractCase?.risk?.riskScore;

  if (findings.length === 0)
    return (
      <div>
        <SectionHeading title="Risk" />
        <NotYet stage={3}>
          Risk assessment scores each clause and records the financial and business
          exposure behind every finding.
        </NotYet>
      </div>
    );

  const band = riskBand(score);

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
  ).sort((a, b) => b.weight - a.weight);

  const counts = SEVERITY_ORDER.map((s) => ({
    severity: s,
    count: findings.filter((f) => f.severity === s).length,
  }));

  const ordered = [...findings].sort(
    (a, b) => (SEVERITY_WEIGHT[b.severity] ?? 0) - (SEVERITY_WEIGHT[a.severity] ?? 0)
  );

  return (
    <div>
      <SectionHeading title="Risk" meta={`${findings.length} findings`} />

      {/* Score and distribution, no boxes. */}
      <div className="mt-6 grid gap-px border-y border-rule bg-rule sm:grid-cols-[200px_1fr]">
        <div className="bg-paper px-5 py-5">
          <div className={cx("font-display text-5xl leading-none", band ? SEVERITY_TEXT[band] : "text-ink")}>
            {score?.toFixed(2) ?? "—"}
          </div>
          <Eyebrow className="mt-2">Aggregate risk score</Eyebrow>
        </div>

        <div className="flex flex-wrap gap-x-10 gap-y-4 bg-paper px-5 py-5">
          {counts.map((c) => (
            <div key={c.severity}>
              <div className={cx("font-display text-2xl leading-none", SEVERITY_TEXT[c.severity])}>
                {c.count}
              </div>
              <Eyebrow className="mt-1.5">{c.severity}</Eyebrow>
            </div>
          ))}
        </div>
      </div>

      {/* One instrument, not decoration. */}
      <div className="mt-10">
        <Eyebrow>Weighted exposure by risk type</Eyebrow>
        <div className="mt-3" style={{ height: Math.max(180, byType.length * 34 + 24) }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={byType} layout="vertical" margin={{ left: 0, right: 12, top: 4, bottom: 4 }}>
              <XAxis type="number" hide />
              <YAxis
                dataKey="riskType"
                type="category"
                width={170}
                tickLine={false}
                axisLine={false}
                tick={{ fontSize: 11, fill: "#8b929b", fontFamily: "IBM Plex Mono, monospace" }}
                tickFormatter={titleCase}
              />
              <Tooltip cursor={{ fill: "#161b23" }} content={<ChartTip />} />
              <Bar dataKey="weight" barSize={10}>
                {byType.map((entry, i) => (
                  <Cell key={i} fill={SEVERITY_HEX[entry.severity]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="mt-12">
        <SectionHeading title="Findings" meta="Ordered by severity" />
        <div className="mt-2 divide-y divide-rule border-b border-rule">
          {ordered.map((f, i) => (
            <div key={i} className="relative py-5 pl-4">
              <span aria-hidden className={cx("absolute inset-y-0 left-0 w-0.5", SEVERITY_BAR[f.severity])} />
              <div className="flex flex-wrap items-baseline justify-between gap-3">
                <SeverityTag severity={f.severity} />
                <span className="font-mono text-2xs text-faint">{f.clause_ref}</span>
              </div>
              <h4 className="mt-2 font-display text-base text-ink">{titleCase(f.riskType)}</h4>
              <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted">{f.rationale}</p>
              <dl className="mt-4 grid gap-x-10 gap-y-3 sm:grid-cols-2">
                <div>
                  <Eyebrow>Financial impact</Eyebrow>
                  <dd className="mt-1 text-xs text-muted">{f.financialImpact || "—"}</dd>
                </div>
                <div>
                  <Eyebrow>Business impact</Eyebrow>
                  <dd className="mt-1 text-xs text-muted">{f.businessImpact || "—"}</dd>
                </div>
              </dl>
              {f.evidenceCitation && (
                <p className="mt-3 font-mono text-2xs text-faint">Evidence: {f.evidenceCitation}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
