import { useState } from "react";
import { api } from "../api/client";
import Button from "../components/ui/Button";
import { Label, Select, TextArea, TextInput } from "../components/ui/Inputs";
import { ErrorNote, Eyebrow, Note, SectionHeading } from "../components/ui/Primitives";
import { titleCase } from "../lib/format";

const SOURCE_TYPES = ["policy", "regulation", "precedent", "template", "historical_contract"];

export default function KnowledgeBase() {
  const [sourceType, setSourceType] = useState("policy");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  async function handleIngest() {
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const { data } = await api.post("/internal/legal-knowledge/ingest", {
        source_type: sourceType,
        title,
        content,
        metadata: {},
      });
      setResult(`Stored as ${data.chunks} searchable chunks.`);
      setTitle("");
      setContent("");
    } catch (err) {
      setError(
        err.response?.status === 403
          ? "Only an Admin can add to the knowledge base."
          : "The document couldn't be stored."
      );
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl">
      <Eyebrow>Administration</Eyebrow>
      <h1 className="mt-1 font-display text-3xl leading-none text-ink">Knowledge base</h1>
      <p className="mt-3 max-w-xl text-sm text-muted">
        Policies, regulations and approved templates the review agents cite as evidence.
        Text added here becomes retrievable during analysis.
      </p>

      <SectionHeading className="mt-10" title="Add a source" />

      <div className="mt-6">
        <Label htmlFor="source-type">Source type</Label>
        <Select
          id="source-type"
          value={sourceType}
          onChange={(e) => setSourceType(e.target.value)}
          className="mb-5 sm:w-64"
        >
          {SOURCE_TYPES.map((t) => (
            <option key={t} value={t}>
              {titleCase(t)}
            </option>
          ))}
        </Select>

        <Label htmlFor="kb-title">Title</Label>
        <TextInput
          id="kb-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Standard limitation of liability policy"
          className="mb-5"
        />

        <Label htmlFor="kb-content" hint="plain text">
          Text
        </Label>
        <TextArea
          id="kb-content"
          rows={14}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          className="mb-5 font-mono text-xs leading-relaxed"
        />

        {error && <ErrorNote className="mb-5">{error}</ErrorNote>}
        {result && <Note className="mb-5">{result}</Note>}

        <Button
          variant="primary"
          onClick={handleIngest}
          disabled={!title || !content || busy}
        >
          {busy ? "Storing" : "Add to knowledge base"}
        </Button>
      </div>
    </div>
  );
}
