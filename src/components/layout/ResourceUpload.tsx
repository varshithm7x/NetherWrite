import { useEffect, useRef, useState } from "react";
import { Loader2, Upload } from "lucide-react";
import { importResource } from "../../utils/resource-import";
import type { ImportedResource } from "../../utils/resource-import";

interface ResourceUploadProps {
  vaultPath?: string;
  onRefresh: () => void;
  onOpen: (path: string) => void | Promise<void>;
}

export function ResourceUpload({ vaultPath, onRefresh, onOpen }: ResourceUploadProps) {
  const picker = useRef<HTMLInputElement>(null);
  const running = useRef<AbortController | null>(null);
  const currentVault = useRef(vaultPath);
  currentVault.current = vaultPath;
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [imports, setImports] = useState<ImportedResource[]>([]);
  useEffect(() => {
    setBusy(false); setStatus(""); setError(""); setImports([]);
    return () => { running.current?.abort(); running.current = null; };
  }, [vaultPath]);

  async function upload(files: File[]) {
    if (!vaultPath || running.current || !files.length) return;
    const controller = new AbortController();
    const sourceVault = vaultPath;
    running.current = controller;
    setBusy(true); setError(""); setImports([]);
    const saved: ImportedResource[] = [];
    const failures: string[] = [];
    try {
      for (let i = 0; i < files.length; i++) {
        if (controller.signal.aborted) break;
        setStatus(`Reading ${i + 1} of ${files.length}: ${files[i].name}`);
        try {
          const imported = await importResource(files[i], sourceVault, controller.signal);
          saved.push(imported);
          if (!controller.signal.aborted && currentVault.current === sourceVault && /\.pdf$/i.test(imported.originalPath)) {
            try { await onOpen(imported.originalPath); }
            catch { failures.push(`${imported.name}: Uploaded successfully, but opening the PDF failed. Use Open PDF to retry.`); }
          }
        }
        catch (failure) {
          if (controller.signal.aborted) break;
          failures.push(`${files[i].name}: ${failure instanceof Error ? failure.message : "Upload failed."}`);
        }
      }
    } finally {
      if (running.current === controller && currentVault.current === sourceVault) {
        running.current = null;
        setBusy(false); setImports(saved); setError(failures.join("\n"));
        const readable = saved.filter(item => item.notePath).length;
        setStatus(`${saved.length} resource(s) uploaded; ${readable} available as searchable notes.${controller.signal.aborted ? " Upload cancelled." : ""}`);
        onRefresh();
      }
    }
  }

  return <section aria-label="Upload resources" className="shrink-0 border-b border-(--border-subtle) px-2 py-2 text-xs">
    <input ref={picker} type="file" accept=".pdf,.docx,.xlsx,.xls,.ods,.md,.txt,.csv,.tsv,.json,.xml,.yaml,.yml,.log,.html,.htm,image/*" multiple hidden aria-label="Choose resources to upload" onChange={event => { const files = Array.from(event.currentTarget.files || []); event.currentTarget.value = ""; void upload(files); }} />
    <button type="button" disabled={!vaultPath || busy} onClick={() => picker.current?.click()} className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-(--text-secondary) hover:bg-(--bg-hover) disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-(--interactive-accent)">
      {busy ? <Loader2 size={15} className="animate-spin" aria-hidden="true" /> : <Upload size={15} aria-hidden="true" />}
      {busy ? "Uploading resources…" : "Upload resources"}
    </button>
    <p className="m-0 px-2 text-[10px] leading-relaxed text-(--text-muted)">PDF, Word, spreadsheets, and text · Up to 50 MB each</p>
    {busy && <button type="button" className="mt-1 px-2 text-(--text-muted)" onClick={() => running.current?.abort()}>Cancel upload</button>}
    <div role="status" aria-live="polite" className="max-h-40 overflow-auto px-2 text-[11px] leading-relaxed">
      {status && <p className="mb-0 mt-1">{status}</p>}
      {imports.map(item => <div key={item.originalPath} className="mt-1">
        <button type="button" className="break-all text-left text-(--interactive-accent) hover:underline" onClick={() => onOpen(/\.pdf$/i.test(item.originalPath) ? item.originalPath : item.notePath || item.originalPath)}>{item.name}{/\.pdf$/i.test(item.originalPath) ? " — Open PDF" : item.notePath ? " — Open content" : " — Open original"}</button>
        {item.warnings.map(warning => <p key={warning} className="mb-0 mt-1 text-(--text-muted)">{warning}</p>)}
      </div>)}
    </div>
    {error && <p role="alert" className="mb-0 mt-1 whitespace-pre-wrap break-words px-2 text-(--text-error)">{error}</p>}
  </section>;
}
