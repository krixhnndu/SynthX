# Open decisions and spec divergences

Everything here is a place the master prompt or the SRS left a gap, contradicted itself,
or contradicted the other document. Each entry says what was built and why, so the
choice can be reversed deliberately rather than discovered later.

## Resolved stack choices

The master prompt section 3 offered alternatives. These are now fixed:

| Layer | Chosen | Reason |
|---|---|---|
| Primary database | SQLite | Section 3 lists it as an allowed choice. Section 6's relational schema maps directly; a JSON column carries the Contract Case payload with indexed columns alongside, and optimistic locking on `version` is a plain compare-and-swap |
| Vector store | ChromaDB | Persists natively and filters by metadata, which section 8.8 requires for `source_type` filtering; FAISS would need both hand-rolled |
| Charts | Recharts | React-native, no wrapper layer beside React Flow |
| Object storage | Adapter: local dev, S3 prod | One interface from day one, so prod is config not rewrite |
| Deployment | Open | Render was chosen when the stack included Postgres and Docker. With a SQLite file and no containers, that reasoning no longer holds and the target needs re-picking |

## Gap 1 - background execution contradicted the NFRs

Section 3 committed to async FastAPI tasks. Section 11 asked for stateless workers
behind a load balancer with horizontal scaling. An in-process background task dies with
the worker and cannot scale independently of the API, so a case mid-Stage-3 would be
lost on any deploy.

**Built:** arq on the Redis that section 3 already provisions. The API enqueues, a
separate worker process executes. Both run from the same virtualenv in separate
terminals; Redis is installed on the host.

## SQLite consequences

Section 3 allowed SQLite, and it is now the choice. Three things follow from it that a
Postgres build would not have needed:

- **WAL and a busy timeout.** Stage 3 and Stage 4 dispatch agents concurrently against
  one case. Without `journal_mode=WAL` the default rollback journal blocks readers during
  every write, and parallel agents deadlock. Both pragmas are set in `app/db/session.py`.
- **Triggers instead of GRANT.** SQLite has no role-level permissions, so the append-only
  audit guarantee is enforced by `BEFORE UPDATE` and `BEFORE DELETE` triggers in
  `infra/sqlite/audit_append_only.sql`.
- **Batch migrations.** SQLite cannot ALTER a column in place, so alembic runs with
  `render_as_batch=True`.

Two limits worth knowing before this goes anywhere real: SQLite serialises writers, so
the parallelism in Stage 3 is concurrency in the agents and the LLM calls, not in the
database; and a single file cannot be shared by API and worker processes on separate
machines, which caps horizontal scaling at one host.

The Postgres path is pre-wired but untested: `psycopg2` is in requirements.txt, and
`app/db/session.py` applies its SQLite pragmas and connect args conditionally, so a
`postgresql+psycopg2://` URL loads without modification. The vector store has the same
story: `CHROMA_BACKEND=http` (with `CHROMA_HOST`/`CHROMA_PORT`) swaps the embedded
`PersistentClient` for an external Chroma `HttpClient`. Neither branch has been run
against a live server, so the first real deployment should treat both as unproven.

## No containers

Docker is removed. The API, the arq worker, Redis, Tesseract, Poppler and the WeasyPrint
system libraries are all installed on the host; the Python side runs from a virtualenv in
`backend/.venv`. Setup steps are in the README.

The removal does not change the architecture: the API and the worker are still separate
processes for the reason in Gap 1, they are now just started by hand rather than by
compose.

## Gap 2 - the RBAC policy table had no schema

Section 9 requires a policy table of `(role, resource, action)` and explicitly forbids
hardcoded per-route checks. Section 6 lists only `users`, `roles`, `user_roles`.

**Built:** a `policies` table with an optional JSON `condition` column, so attribute
predicates like "Finance may approve only below risk 0.7" are data, not code. Seeded in
`app/seed.py`.

## Gap 3 - the Supervisor was both a graph node and not

Section 7 lists Stage 5 Supervisor Consensus as a node in the static graph. Section 8.1
says the Supervisor is a direct service call, not a queued worker.

**Built:** both, split by mode. The scope pass on case creation is a direct call from
the upload path. The Stage 5 consensus pass is a graph node, so it inherits retry,
backoff and `agent_runs` bookkeeping like every other stage.

## Gap 4 - the auth surface was incomplete

Only `/auth/login` was specified. `users` implies two auth paths (password and OIDC),
and no user creation, token refresh or admin bootstrap was defined - yet
`/internal/legal-knowledge/ingest` is admin-only, so an Admin must exist before anything
can be ingested.

**Built:** `/auth/login` and `/auth/refresh`, password auth only, plus a bootstrap Admin
seeded from environment variables. OIDC is left unbuilt rather than half-built; the
`oidc_subject` column is present for it.

**Still open:** user invitation and role assignment have no UI or endpoint. Right now
roles are assigned by inserting into `user_roles` directly.

## Gap 5 - no model named, and no schema-failure retry path

Every agent depends on structured output, but no Groq model was pinned. Section 7's
retry policy covers transient failure only - an LLM returning valid JSON that violates
the namespace schema is a third failure mode it does not address.

**Built:** model set by config (`GROQ_MODEL`), defaulting to a long-context instruction
model. `app/llm/structured.py` runs two nested loops: transient retries with exponential
backoff, and inside each, a bounded schema-repair loop that feeds validation errors back
to the model.

**Still open:** the default model needs validation against real contracts, particularly
for the Stage 1 structuring and Stage 2 classification calls, which carry the longest
context.

## Gap 6 - the report render had no library

Section 8.12 emits a PDF/HTML render job without saying how.

**Built:** WeasyPrint, since the report is section-structured HTML rather than a form
layout. The renderer produces both HTML and PDF from one template.

## Gap 7 - SRS features missing from the master prompt dashboard

SRS section 8 lists **Version History** and **Multi-user Collaboration** as features.
Master prompt section 10 defines the dashboard and includes neither. Master prompt
section 15 then sets the Definition of Done as "the dashboard exposes every feature
listed in the SRS with no missing section" - which cannot be met as written.

**Built:** the master prompt's section 10 dashboard exactly, since it is the
authoritative build document and section 2 forbids adding capabilities.

**Still open:** either add both features to the master prompt (Version History is close
to free given the Contract Case already carries a `version` field and the audit log is
complete; Multi-user Collaboration is a real feature needing comments, presence and
assignment), or amend the Definition of Done to reference section 10 rather than the SRS
feature list.

## Not built, deliberately

Master prompt section 14 places these out of scope and forbids placeholder scaffolding:
knowledge graph integration, organisational learning and memory, regulatory change
monitoring, contract lifecycle management beyond one review cycle, multi-jurisdiction
compliance beyond seeded frameworks, voice-enabled review. No stubs exist for any of them.

## What is scaffolded but unproven

Every module is present and wired. What has not been run end-to-end against a real
contract: the OCR confidence threshold that routes a PDF to Tesseract, the aggregate
risk-score weighting, the redline character offsets, and every prompt in
`app/agents/*/prompt.md`. Those prompts are the highest-leverage thing to iterate on
once the pipeline runs.
