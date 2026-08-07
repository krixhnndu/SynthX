const RESULT_STYLE = {
  pass: "text-severity-low", fail: "text-severity-critical", uncertain: "text-severity-medium",
};

export default function Compliance({ contractCase }) {
  const findings = contractCase?.compliance?.findings ?? [];
  const frameworks = contractCase?.compliance?.frameworksChecked ?? [];

  if (findings.length === 0)
    return <p className="text-sm text-ink/60">Compliance verification runs at Stage 3.</p>;

  return (
    <div>
      <p className="text-sm text-ink/60 mb-5">
        Checked against: {frameworks.join(", ") || "no frameworks recorded"}
      </p>
      <table className="w-full text-sm bg-white border border-rule rounded">
        <thead className="text-left text-xs uppercase text-ink/50">
          <tr className="border-b border-rule">
            <th className="p-2">Clause</th><th>Framework</th><th>Result</th><th>Citation</th>
          </tr>
        </thead>
        <tbody>
          {findings.map((f, i) => (
            <tr key={i} className="border-b border-rule/50 align-top">
              <td className="p-2 font-mono text-xs">{f.clause_ref}</td>
              <td>{f.framework}</td>
              <td className={`font-medium ${RESULT_STYLE[f.result]}`}>{f.result}</td>
              <td className="text-ink/70">{f.citation}<div className="text-xs mt-1">{f.detail}</div></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
