import { useState } from "react";
import { api } from "../api/client";

export default function UploadDialog({ open, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [priorFile, setPriorFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

  if (!open) return null;

  async function handleUpload() {
    if (!file) return;
    setBusy(true);
    setError(null);
    const form = new FormData();
    form.append("file", file);
    if (priorFile) form.append("comparison_file", priorFile);
    if (notes) form.append("notes", notes);
    try {
      await api.post("/contracts", form);
      onUploaded?.();
      onClose();
    } catch (err) {
      setError("Upload failed. Check the file format and try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="fixed inset-0 bg-ink/40 grid place-items-center px-6">
      <div className="bg-paper border border-rule rounded w-full max-w-lg p-6">
        <h2 className="text-xl mb-1">Upload contract</h2>
        <p className="text-sm text-ink/60 mb-5">
          PDF, DOCX or a scan. Add a prior version to get a comparison.
        </p>

        <label className="block text-xs font-medium mb-1">Contract</label>
        <input type="file" onChange={(e) => setFile(e.target.files[0])} className="mb-4 text-sm" />

        <label className="block text-xs font-medium mb-1">
          Prior version or template <span className="text-ink/50">(optional)</span>
        </label>
        <input
          type="file"
          onChange={(e) => setPriorFile(e.target.files[0])}
          className="mb-4 text-sm"
        />

        <label className="block text-xs font-medium mb-1">Notes for the reviewer</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={2}
          className="w-full border border-rule rounded px-3 py-2 mb-4 bg-white text-sm"
        />

        {error && <p className="text-sm text-severity-critical mb-3">{error}</p>}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm">Cancel</button>
          <button
            onClick={handleUpload}
            disabled={!file || busy}
            className="bg-ink text-paper px-4 py-2 rounded text-sm font-medium disabled:opacity-40"
          >
            {busy ? "Uploading" : "Start review"}
          </button>
        </div>
      </div>
    </div>
  );
}
