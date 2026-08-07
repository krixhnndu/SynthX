import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";
import { EmptyState, Eyebrow, Skeleton } from "../components/ui/Primitives";
import { formatTime, titleCase } from "../lib/format";

/** Group events by calendar day so the record reads as a chronology. */
function groupByDay(rows) {
  const groups = new Map();
  for (const row of rows) {
    const d = new Date(row.timestamp);
    const key = Number.isNaN(d.getTime()) ? "Unknown" : d.toLocaleDateString();
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(row);
  }
  return [...groups.entries()];
}

export default function AuditTrail() {
  const { caseId } = useParams();
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["audit", caseId],
    queryFn: async () => (await api.get(`/contracts/${caseId}/audit`)).data,
  });

  const days = groupByDay(rows);

  return (
    <div className="mx-auto max-w-4xl">
      <Link
        to={`/contracts/${caseId}`}
        className="font-mono text-2xs uppercase tracking-label text-faint transition-colors hover:text-ink"
      >
        &larr; Back to case
      </Link>

      <h1 className="mt-3 font-display text-3xl leading-none text-ink">Audit trail</h1>
      <p className="mt-3 font-mono text-xs text-faint">{caseId}</p>

      {isLoading ? (
        <div className="mt-10 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      ) : rows.length === 0 ? (
        <EmptyState className="mt-10" title="No events recorded">
          Every upload, agent run and decision on this case is written here.
        </EmptyState>
      ) : (
        <div className="mt-10">
          {days.map(([day, events]) => (
            <section key={day} className="mb-10">
              <div className="sticky top-14 z-10 border-b border-ruleHi bg-paper/95 py-2 backdrop-blur">
                <Eyebrow>{day}</Eyebrow>
              </div>

              <ol className="mt-2">
                {events.map((event, i) => (
                  <li
                    key={i}
                    className="grid grid-cols-[64px_1fr] gap-4 border-b border-rule py-4 sm:grid-cols-[80px_1fr]"
                  >
                    <time className="font-mono text-xs text-faint">
                      {formatTime(event.timestamp)}
                    </time>

                    <div className="min-w-0">
                      <div className="flex flex-wrap items-baseline gap-x-2">
                        <span className="text-sm text-ink">{event.actor || "System"}</span>
                        <span className="font-mono text-2xs uppercase tracking-label text-severity-info">
                          {titleCase(event.action)}
                        </span>
                      </div>

                      {event.metadata && Object.keys(event.metadata).length > 0 && (
                        <dl className="mt-2 grid gap-x-6 gap-y-1 sm:grid-cols-2">
                          {Object.entries(event.metadata).map(([key, value]) => (
                            <div key={key} className="flex min-w-0 gap-2">
                              <dt className="shrink-0 font-mono text-2xs uppercase tracking-label text-faint">
                                {titleCase(key)}
                              </dt>
                              <dd className="min-w-0 truncate font-mono text-2xs text-muted">
                                {typeof value === "object" && value !== null
                                  ? JSON.stringify(value)
                                  : String(value)}
                              </dd>
                            </div>
                          ))}
                        </dl>
                      )}
                    </div>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
