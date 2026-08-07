import { TableSkeleton } from "./Primitives";

const cx = (...parts) => parts.filter(Boolean).join(" ");

/**
 * Dense table. Semantics stay real <table>/<th>/<td> so screen readers and
 * keyboard users get the row relationships for free.
 *
 * columns: [{ key, header, render(row), align, className, width }]
 */
export default function DataTable({
  columns,
  rows,
  rowKey,
  onRowClick,
  tone,
  loading = false,
  empty = null,
  className,
}) {
  if (loading) return <TableSkeleton cols={columns.length} />;
  if (!rows?.length) return empty;

  return (
    <div className={cx("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-ruleHi text-left">
            {columns.map((col) => (
              <th
                key={col.key}
                scope="col"
                style={col.width ? { width: col.width } : undefined}
                className={cx(
                  "label py-2 pr-4 font-normal",
                  col.align === "right" && "text-right",
                  col.headerClassName
                )}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const clickable = Boolean(onRowClick);
            const bar = tone?.(row);
            return (
              <tr
                key={rowKey ? rowKey(row, i) : i}
                onClick={clickable ? () => onRowClick(row) : undefined}
                onKeyDown={
                  clickable
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          onRowClick(row);
                        }
                      }
                    : undefined
                }
                tabIndex={clickable ? 0 : undefined}
                role={clickable ? "link" : undefined}
                className={cx(
                  "group relative border-b border-rule/70 align-middle transition-colors",
                  clickable && "cursor-pointer hover:bg-raised focus:bg-raised focus:outline-none"
                )}
              >
                {columns.map((col, ci) => (
                  <td
                    key={col.key}
                    className={cx(
                      "relative py-3 pr-4",
                      col.align === "right" && "text-right",
                      col.className
                    )}
                  >
                    {ci === 0 && bar && (
                      <span aria-hidden className={cx("absolute inset-y-0 -left-0 w-0.5", bar)} />
                    )}
                    <span className={ci === 0 && bar ? "block pl-3" : undefined}>
                      {col.render ? col.render(row) : row[col.key]}
                    </span>
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
