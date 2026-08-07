/** Joins analysis findings to document clauses.
 *
 *  Findings carry `clause_ref`; document clauses carry `id` and `sectionRef`.
 *  The two are produced by different agents, so they are normalised before
 *  matching and a miss is always tolerated — a finding with no locatable
 *  clause still renders, it just isn't clickable.
 */

export function normalizeRef(ref) {
  if (ref == null) return "";
  return String(ref)
    .toLowerCase()
    .replace(/[§¶]/g, "")
    .replace(/\b(section|clause|art\.?|article)\b/g, "")
    .replace(/[^a-z0-9.]/g, "")
    .replace(/\.+$/, "")
    .trim();
}

export const anchorId = (ref) => `clause-${normalizeRef(ref)}`;

/** Set of every ref the rendered document can actually scroll to. */
export function buildClauseIndex(clauses = []) {
  const index = new Set();
  for (const clause of clauses) {
    if (clause?.id) index.add(normalizeRef(clause.id));
    if (clause?.sectionRef) index.add(normalizeRef(clause.sectionRef));
  }
  return index;
}

export function scrollToClause(ref) {
  const key = normalizeRef(ref);
  if (!key) return false;
  const node = document.getElementById(`clause-${key}`);
  if (!node) return false;
  node.scrollIntoView({ behavior: "smooth", block: "center" });
  node.classList.remove("clause-target");
  // Restart the highlight even if the same clause is clicked twice.
  void node.offsetWidth;
  node.classList.add("clause-target");
  return true;
}
