# NoteWeave

A lighter desktop knowledge workspace for the hackathon, derived from the Apache-licensed OpenOnyx app in `../notework`.

The interface has three panels: your folder and files, a Markdown editor or D3 graph, and an AI thinking partner. The lavender accents, quieter typography, simplified navigation, and focused settings give it its own visual identity.

- Open a local folder; recursively discover Markdown, PDF, DOCX, and text files.
- Create and edit portable `.md` notes with CodeMirror, automatic saving, live Markdown formatting while editing, and wiki links. Folders begin collapsed; searching expands matching paths. Related link cards below each note can insert wiki links.
- Render original PDF pages with navigation and zoom, and paginated Word DOCX documents. Extract their text separately for AI retrieval. Chat retrieves original document passages and provides clickable source citations.
- Reuse the reference embedding engine unchanged: local `all-MiniLM-L6-v2`, disk cache, cosine similarity, and lexical fallback. Related suggestions use the existing enrichment logic.
- Reuse the reference D3 worker, canvas renderer, and graph controls unchanged.
- No Spaces, Supabase, accounts, synchronization, collaboration, plugins, or external app integrations.

## Run

Node.js 22 or newer:

```bash
npm install
npm run dev
```

`npm run dev:web` provides a browser demo with four example notes. Real folder access and document import use the desktop app. `npm run build` creates the renderer and Electron bundles; `npm start` opens the production build. `npm run package:linux` builds a Linux application package.

## Try the AI

1. Open a folder containing research notes, PDFs, or DOCX files. Alternatively import files with the upload button; files are copied into `Documents/` without overwriting existing files.
2. Wait for indexing. On first use the embedding model downloads; if it is unavailable, the existing engine uses keyword vectors and the status bar identifies the fallback.
3. Open the AI settings button in the right panel, select OpenRouter or OpenAI, enter your key, and choose a model. A compatible API base URL is optional.
4. Ask a question over the entire folder or the current file. Enable **Web** for internet research, or explicitly ask for internet references. Asking to create or generate a note saves a new Markdown file under `AI Notes/`; answers also have a **Save as note** button. Follow the citations to open the source. Use Related to explore semantic suggestions, and Knowledge graph to explore wiki links.

Provider-generated answers require your API key and send retrieved passages to your chosen provider. Notes and local discovery do not require a key. Credentials and indexes are stored locally in the reference-compatible `.openonyx/` folder inside your vault; keep this directory out of version control.

Text-based PDFs are supported; scanned PDFs need OCR before importing. Legacy binary Word `.doc` files must be saved as `.docx`. Documents above 50 MB are skipped with a visible explanation. Original documents remain unchanged. Refresh the folder after external file changes. Document text is read-only; Markdown notes are editable.

`Ctrl/Cmd+N` creates a note, `Ctrl/Cmd+S` saves, and `Ctrl/Cmd+G` opens the graph.

## Verification

```bash
npm run lint
npm test
npm run build
```

Tests cover the unchanged embedding behavior, source citation verification, provider settings, filesystem boundaries, actual DOCX extraction, PDF page extraction, nested discovery, and document retrieval.

Browser checks verify collapsed folders, live Markdown, suggestions below notes, real PDF and DOCX rendering, and note creation with web-reference UI using a mocked provider response. Live provider searches require your configured key and provider availability.

Web integration follows the [OpenRouter server-tool documentation](https://openrouter.ai/docs/guides/features/server-tools/web-search) and [OpenAI web-search documentation](https://developers.openai.com/api/docs/guides/tools-web-search). Provider web search may incur search charges in addition to model usage.

See `LICENSE` and `NOTICE` for the upstream attribution.
