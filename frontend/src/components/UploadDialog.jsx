import { useState } from "react";
import { api } from "../api/client";
import Modal from "./ui/Modal";
import Button from "./ui/Button";
import { Label, TextArea } from "./ui/Inputs";
import { ErrorNote } from "./ui/Primitives";

const FILE_INPUT =
  "block w-full cursor-pointer border border-rule bg-paper px-3 py-2 text-sm text-muted " +
  "file:mr-3 file:border-0 file:bg-raised file:px-3 file:py-1 file:font-mono file:text-2xs " +
  "file:uppercase file:tracking-label file:text-ink hover:border-ruleHi";

export default function UploadDialog({ open, onClose, onUploaded }) {
  const [file, setFile] = useState(null);
  const [priorFile, setPriorFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);

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
    <Modal
      open={open}
      onClose={onClose}
      title="Upload contract"
      subtitle="PDF, DOCX or a scan. The eight-stage review starts immediately."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleUpload} disabled={!file || busy}>
            {busy ? "Uploading" : "Start review"}
          </Button>
        </>
      }
    >
      <Label htmlFor="contract-file">Contract</Label>
      <input
        id="contract-file"
        type="file"
        onChange={(e) => setFile(e.target.files[0])}
        className={`${FILE_INPUT} mb-5`}
      />

      <Label htmlFor="prior-file" hint="optional — enables comparison">
        Prior version or template
      </Label>
      <input
        id="prior-file"
        type="file"
        onChange={(e) => setPriorFile(e.target.files[0])}
        className={`${FILE_INPUT} mb-5`}
      />

      <Label htmlFor="upload-notes">Notes for the reviewer</Label>
      <TextArea
        id="upload-notes"
        rows={3}
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        className="mb-4"
      />

      {error && <ErrorNote>{error}</ErrorNote>}
    </Modal>
  );
}
