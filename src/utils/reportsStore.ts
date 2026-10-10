import { getAPI } from "./api";
import { isFlashcardRecord, isFlashcardNotePath } from "./flashcard-decks";
import { parseLearningReport } from "./learning-reports";
import type { LearningReport } from "../types/learning-reports";

export const REPORTS_CHANGED_EVENT = "netherwrite:reports-changed";
const STORAGE_FILE = "forge-reports.json";
interface ReportFile { version: 1; reports: unknown[] }
export interface ReportLibrary { reports: LearningReport[]; skipped: number }
export class ReportStorageError extends Error {}

// Serializing mutations preserves simultaneous saves/deletes/rename updates.
let mutationQueue: Promise<unknown> = Promise.resolve();
function enqueue<T>(operation: () => Promise<T>): Promise<T> {
  const next = mutationQueue.then(operation);
  mutationQueue = next.catch(() => {});
  return next;
}

async function readFile(vaultPath: string): Promise<ReportFile> {
  const api = getAPI();
  if (await api.getVaultPath() !== vaultPath) throw new Error("The report vault is no longer open.");
  const raw = await api.dataRead(STORAGE_FILE);
  if (await api.getVaultPath() !== vaultPath) throw new Error("The report vault is no longer open.");
  if (raw === null) {
    // The existing bridge returns null for both missing files and read errors.
    // Never replace a saved library just because its contents were unreadable.
    if (await api.fileExists(`.netherwrite/${STORAGE_FILE}`)) throw new Error("Saved reports could not be read. The existing file was preserved.");
    return { version: 1, reports: [] };
  }
  let data: unknown;
  try { data = JSON.parse(raw); } catch { throw new Error("Saved reports could not be read. The existing file was preserved."); }
  if (!isFlashcardRecord(data) || data.version !== 1 || !Array.isArray(data.reports)) throw new Error("Saved reports use an invalid or unsupported format. The existing file was preserved.");
  return { version: 1, reports: data.reports };
}

export async function loadLearningReports(vaultPath: string): Promise<ReportLibrary> {
  const file = await readFile(vaultPath);
  const ids = new Set<string>();
  let skipped = 0;
  const reports = file.reports.flatMap(raw => {
    const report = parseLearningReport(raw);
    if (!report || report.vaultPath !== vaultPath || ids.has(report.id)) { skipped++; return []; }
    ids.add(report.id);
    return [report];
  });
  reports.sort((a, b) => b.createdAt - a.createdAt || a.id.localeCompare(b.id));
  return { reports, skipped };
}

async function writeFile(vaultPath: string, file: ReportFile): Promise<void> {
  try {
    await getAPI().dataWrite(STORAGE_FILE, JSON.stringify(file), { atomic: true, expectedVaultPath: vaultPath });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    // Renderer hot reload does not restart Electron's registered IPC handlers.
    if (/Invalid (?:quiz comment|data) write options/.test(message)) throw new ReportStorageError("Restart NetherWrite to enable report saving, then generate again. Your saved quiz answers are intact.");
    if (/\b(?:EACCES|EPERM)\b/.test(message)) throw new ReportStorageError("NetherWrite cannot write reports to this vault. Check the folder permissions and retry. Your quiz answers are intact.");
    if (/\bENOSPC\b/.test(message)) throw new ReportStorageError("The vault drive is full. Free some space and generate again. Your quiz answers are intact.");
    throw error;
  }
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(REPORTS_CHANGED_EVENT, { detail: { vaultPath } }));
}

export function saveLearningReport(reportData: unknown, vaultPath: string, beforeSave: () => Promise<void> = async () => {}): Promise<LearningReport> {
  return enqueue(async () => {
    const report = parseLearningReport(reportData);
    if (!report || report.vaultPath !== vaultPath) throw new Error("Invalid learning report.");
    const file = await readFile(vaultPath);
    if (file.reports.some(raw => isFlashcardRecord(raw) && raw.id === report.id)) throw new Error("This learning report already exists.");
    await beforeSave();
    if (await getAPI().getVaultPath() !== vaultPath) throw new Error("The report vault is no longer open.");
    await writeFile(vaultPath, { version: 1, reports: [...file.reports, report] });
    return report;
  });
}

export function deleteLearningReport(vaultPath: string, reportId: string): Promise<void> {
  return enqueue(async () => {
    const file = await readFile(vaultPath);
    const reports = file.reports.filter(raw => !(isFlashcardRecord(raw) && raw.id === reportId));
    if (reports.length !== file.reports.length) await writeFile(vaultPath, { version: 1, reports });
  });
}

/** Use the same exact-path and directory-prefix rename convention as editor tabs. */
export function renameReportSources(vaultPath: string, oldPath: string, newPath: string, isDirectory: boolean): Promise<void> {
  return enqueue(async () => {
    if (!isFlashcardNotePath(oldPath) || !isFlashcardNotePath(newPath) || oldPath === newPath) return;
    const file = await readFile(vaultPath);
    let changed = false;
    const reports = file.reports.map(raw => {
      const report = parseLearningReport(raw);
      if (!report || report.vaultPath !== vaultPath) return raw;
      const sourceNotePath = report.sourceNotePath === oldPath ? newPath
        : isDirectory && report.sourceNotePath.startsWith(`${oldPath}/`) ? `${newPath}/${report.sourceNotePath.slice(oldPath.length + 1)}` : report.sourceNotePath;
      if (sourceNotePath === report.sourceNotePath) return raw;
      changed = true;
      return { ...report, sourceNotePath, sourceNoteTitle: sourceNotePath.split("/").pop()!.replace(/\.md$/i, ""), performance: { ...report.performance, notePath: sourceNotePath } };
    });
    if (changed) await writeFile(vaultPath, { version: 1, reports });
  });
}
