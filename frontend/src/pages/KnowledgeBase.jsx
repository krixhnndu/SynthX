import { useState } from "react";
import { api } from "../api/client";

const SOURCE_TYPES = ["policy", "regulation", "precedent", "template", "historical_contract"];

export default function KnowledgeBase() {
  const [sourceType, setSourceType] = useState("policy");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleIngest() {
    setError(null);
    try {
      const { data } = await api.post("/internal/legal-knowledge/ingest", {
        source_type: sourceType, title, content, metadata: {},
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
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-6 py-10">
      <h1 className="text-2xl mb-1">Knowledge base</h1>
      <p className="text-sm text-ink/60 mb-8">
        Policies, regulations and approved templates the review agents cite as evidence.
      </p>

      <label className="block text-xs font-medium mb-1">Source type</label>
      <select
        value={sourceType}
        onChange={(e) => setSourceType(e.target.value)}
        className="border border-rule rounded px-3 py-2 mb-4 bg-white text-sm"
      >
        {SOURCE_TYPES.map((t) => (
          <option key={t} value={t}>{t.replace(/_/g, " ")}</option>
        ))}
      </select>

      <label className="block text-xs font-medium mb-1">Title</label>
      <input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full border border-rule rounded px-3 py-2 mb-4 bg-white text-sm"
      />

      <label className="block text-xs font-medium mb-1">Text</label>
      <textarea
        rows={12}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="w-full border border-rule rounded px-3 py-2 mb-4 bg-white text-sm font-mono"
      />

      {error && <p className="text-sm text-severity-critical mb-3">{error}</p>}
      {result && <p className="text-sm text-severity-low mb-3">{result}</p>}

      <button
        onClick={handleIngest}
        disabled={!title || !content}
        className="bg-ink text-paper px-4 py-2 rounded text-sm font-medium disabled:opacity-40"
      >
        Add to knowledge base
      </button>
    </div>
  );
}
