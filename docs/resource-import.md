# Resource import architecture

`ResourceUpload` sits between the vault toolbar and the file explorer. It processes selected files sequentially, reports per-file failures, and aborts remaining work on cancellation, unmount, or a vault change.

`resource-content.ts` provides local text extraction. PDF.js reads every page through its worker and releases page/document resources; Mammoth extracts DOCX; SheetJS reads spreadsheet values. Parsers load only when their format is used. UTF-8 text formats use TextDecoder. PowerPoint files are rejected before reading or saving. Other unsupported formats return a warning rather than invented text. Limits bound file size, PDF page count, and extracted text length.

`resource-import.ts` preserves original bytes and builds a Markdown content note with source metadata, warnings, page/sheet headings, and a link to the original. Each import has its own directory, so repeated filenames do not overwrite existing resources.

The preload `importResource` method commits both files in Electron. FileSystemManager validates the initiating vault and upload paths, resolves both destinations before asynchronous writes, creates a new import directory exclusively, and rolls it back on a write failure. Switching vaults cannot redirect an in-flight write.

During a renderer reload, an older running preload may lack `importResource`. The renderer bridge detects this and uses the existing file methods with absolute destinations tied to the initiating vault. It checks the vault before each write, avoids existing import directories, and removes failed import files while the initiating vault remains active. Switching vaults stops subsequent writes and cleanup; a committed original may remain in the original vault. Updated bridges continue to use the atomic native import.

After a successful commit, the main process refreshes search/watchers. The renderer bridge emits the existing Markdown creation/write events while the initiating vault remains active; App refreshes the tree and updates its normal note index. Forge, Intelligence, linking, and other note consumers therefore share persisted extracted content rather than adding separate PDF-only readers to each feature.

PDF uploads automatically open their original in the existing document-tab viewer. `resource-paths.ts` supplies the stable companion path. RightSidebar resolves the active PDF to its content note for Intelligence and Forge, loads its saved text without decoding PDF bytes as Markdown, ignores stale reads after document/vault changes, and maps source navigation back to the PDF. Source generation continues to anchor quizzes and flashcards to the persistent content note. The viewer uses first-page geometry for initial placeholders, loads exact geometry lazily, bounds canvas resolution, and cancels/releases distant or obsolete renders.

Content notes are import-time snapshots. OCR, image interpretation, legacy DOC extraction, PowerPoint uploads, and live re-extraction after changes to the original are not implemented. Existing AI provider configuration, retrieval behavior, and request budgets remain in effect.
