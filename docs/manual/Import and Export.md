# Import and Export

NetherWrite is built around ordinary files, so most import and export work starts in the filesystem. A vault can be copied, backed up, versioned, zipped, synced, or opened by another Markdown tool.

## Import existing notes

To bring existing Markdown into NetherWrite, copy the files into a vault folder or open the folder directly as a vault. Keep attachments beside the notes or in a predictable attachments folder.

## Import from Obsidian

Open the existing Obsidian vault folder directly or test a copy first. Markdown notes, wiki links, attachments, and `.canvas` files are the most portable parts. Plugin-specific databases and settings may need separate review.

## Upload resources

Click **Upload resources** below the vault selector and above **Root Directory**. Select one or more files, up to 50 MB each. NetherWrite preserves the originals under `Uploads` and extracts readable content locally into Markdown notes.

Supported extraction includes PDFs (up to 500 pages), DOCX, XLSX/XLS/ODS, Markdown, UTF-8 text, CSV/TSV, JSON, XML, YAML, logs, and HTML. PDF pages and spreadsheet sheets retain headings in the extracted note. The note links back to the original resource. PowerPoint uploads are not supported; export the presentation as PDF first.

Uploaded PDFs open automatically in a document tab. **Open PDF** reopens the original in the built-in viewer, which renders nearby pages and releases distant canvases. While that PDF is active, Intelligence and Forge use its extracted content note automatically. Mind-map source nodes return to the original PDF. For other supported resources, click **Open content** to read the extracted note. Extracted notes participate in the existing note search and indexing pipeline. Existing AI settings and model request limits still apply.

Scanned pages and images require OCR; NetherWrite reports pages without readable text. Unsupported formats are preserved as originals without creating a misleading content note. Extraction captures the content at upload time: upload a revised file again to import its updated contents. Duplicate filenames create separate imports.

## Export notes

For simple export, copy the Markdown files. For a project archive, include:

- Markdown notes.
- Canvas files.
- Attachments.
- Any README or index note.
- Relevant plugin data if it is needed to interpret the notes.

## PDF and external formats

When exporting to PDF or another format, inspect the result. Markdown features such as embeds, callouts, and local images may need adjustment depending on the exporter.

## Continue learning

- [Open a Vault](<Open a Vault.md>)
- [Obsidian Compatibility](<Obsidian Compatibility.md>)
- [Privacy](<Privacy.md>)

