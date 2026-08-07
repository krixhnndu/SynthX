import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export default function AuditTrail() {
  const { caseId } = useParams();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["audit", caseId],
    queryFn: async () => (await api.get(`/contracts/${caseId}/audit`)).data,
  });

  return (
    <div className="max-w-5xl mx-auto px-6 py-10">
      <Link to={`/contracts/${caseId}`} className="text-xs text-ink/50 underline">
        Back to case
      </Link>
      <h1 className="text-2xl mt-1 mb-6">Audit trail</h1>

      {isLoading ? (
        <p className="text-sm text-ink/60">Loading.</p>
      ) : (
        <table className="w-full text-sm bg-white border border-rule rounded">
          <thead className="text-left text-xs uppercase text-ink/50">
            <tr className="border-b border-rule">
              <th className="p-2">When</th><th>Actor</th><th>Action</th><th>Detail</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={i} className="border-b border-rule/50 align-top">
                <td className="p-2 whitespace-nowrap text-xs">
                  {new Date(r.timestamp).toLocaleString()}
                </td>
                <td>{r.actor}</td>
                <td className="font-mono text-xs">{r.action}</td>
                <td className="text-xs text-ink/60">
                  <pre className="whitespace-pre-wrap">{JSON.stringify(r.metadata, null, 1)}</pre>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
