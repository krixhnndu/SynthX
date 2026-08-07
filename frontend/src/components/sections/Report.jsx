import { useQuery } from "@tanstack/react-query";
import { api, downloadBlob } from "../../api/client";
import Button from "../ui/Button";
import { Eyebrow, NotYet, SectionHeading, Skeleton } from "../ui/Primitives";
import { formatDateTime } from "../../lib/format";

export default function Report({ caseId }) {
  const { data, error, isLoading } = useQuery({
    queryKey: ["report", caseId],
    queryFn: async () => (await api.get(`/contracts/${caseId}/report`)).data,
  });

  if (isLoading)
    return (
      <div>
        <SectionHeading title="Report" />
        <div className="mt-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-4 w-full" />
          ))}
        </div>
      </div>
    );

  if (error?.response?.status === 409)
    return (
      <div>
        <SectionHeading title="Report" />
        <NotYet stage={7}>
          The report is compiled once every analysis stage completes. It appears here
          and can be downloaded as a PDF.
        </NotYet>
      </div>
    );

  const sections = data?.sections ?? {};
  const names = Object.keys(sections);

  if (names.length === 0)
    return (
      <div>
        <SectionHeading title="Report" />
        <NotYet stage={7}>
          No report sections are visible to your role on this case yet.
        </NotYet>
      </div>
    );

  const ordered = [
    ...names.filter((n) => n === "Executive Summary"),
    ...names.filter((n) => n !== "Executive Summary"),
  ];

  return (
    <div>
      <SectionHeading
        title="Report"
        meta={data?.generatedAt ? `Generated ${formatDateTime(data.generatedAt)}` : undefined}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => downloadBlob(`/contracts/${caseId}/report?download=true`)}
          >
            Download PDF
          </Button>
        }
      />

      <div className="mt-8 max-w-3xl">
        {ordered.map((name, i) => (
          <section key={name} className="mb-10">
            <div className="flex items-baseline gap-3 border-b border-rule pb-2">
              <span className="font-mono text-2xs text-faint">
                {String(i + 1).padStart(2, "0")}
              </span>
              <h3 className="font-display text-lg text-ink">{name}</h3>
            </div>
            <div
              className="report-body mt-4 text-sm leading-relaxed text-muted [&_a]:text-severity-info [&_h4]:mt-4 [&_h4]:font-display [&_h4]:text-ink [&_li]:mt-1 [&_p]:mt-3 [&_strong]:text-ink [&_table]:w-full [&_td]:border-b [&_td]:border-rule [&_td]:py-1.5 [&_th]:border-b [&_th]:border-ruleHi [&_th]:py-1.5 [&_th]:text-left [&_ul]:mt-3 [&_ul]:list-disc [&_ul]:pl-5"
              dangerouslySetInnerHTML={{ __html: sections[name] }}
            />
          </section>
        ))}
      </div>
    </div>
  );
}
