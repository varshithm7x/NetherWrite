# NetherWrite

<p align="center">
  <strong>The Open-Source, Local-First, AI-Grounded Knowledge Management Ecosystem.</strong>
</p>

<p align="center">
  <a href="https://github.com/varshithm7x/NetherWrite"><img alt="Main Repository" src="https://img.shields.io/badge/Repository-NetherWrite-111827?style=for-the-badge&logo=github"></a>
  <a href="https://github.com/varshithm7x/NetherWrite/releases"><img alt="Latest Release" src="https://img.shields.io/badge/Release-v1.0.5-47848F?style=for-the-badge&logo=electron"></a>
  <a href="https://github.com/varshithm7x/NetherWrite/blob/main/LICENSE"><img alt="License: Apache-2.0" src="https://img.shields.io/badge/License-Apache%202.0-10B981?style=for-the-badge"></a>
</p>

---

## Overview

NetherWrite is an open-source organization dedicated to building state-of-the-art knowledge tools centered around user privacy, local file ownership, and modern AI intelligence. 

Our core philosophy is simple: **Your thoughts belong to you.** Notes should reside in open Markdown files on your local drive, unencumbered by proprietary lock-in, while still benefiting from cutting-edge graph visualizations, semantic search, local vector embeddings, and Obsidian plugin ecosystem compatibility.

---

## Core Principles

| Principle | Description |
| --- | --- |
| **Local-First Architecture** | Your Markdown files, vault assets, local indexes, and graph structures remain on your file system by default. |
| **Markdown & Canvas Native** | Full support for standard `.md` formatting, Obsidian `.canvas` visual maps, KaTeX equations, and wiki-link connections. |
| **Grounded AI Retrieval** | Local embeddings with Transformers.js and optional RAG capabilities allow you to query your vault securely without exposing raw notes. |
| **Plugin Ecosystem Support** | Engineered runtime layer compatible with Obsidian API interfaces, enabling rich community plugin support. |
| **Cross-Platform Availability** | Desktop builds for Linux (AppImage, deb, Arch pkg), macOS (dmg, zip), and Windows (nsis, portable). |

---

## Featured Repositories

### [varshithm7x/NetherWrite](https://github.com/varshithm7x/NetherWrite)
The flagship desktop application built with Electron, React 19, TypeScript, CodeMirror 6, D3.js, Tailwind CSS, Transformers.js, IndexedDB, and Supabase.

- **Markdown Workspace**: Live preview, split panes, tab groups, backlinks, tags, and Vim keybindings.
- **Interactive Knowledge Graph**: 2D canvas graph visualization with physics customization and semantic link discovery.
- **Spaces & RAG Engine**: Vector-indexed knowledge layers for local semantic search and vault-grounded Q&A.
- **Obsidian API Compatibility**: Support for community plugins including Dataview, Templater, Kanban, Excalidraw, and Tasks.

---

## Technology Stack

```
           +-------------------------------------------------------+
           |               NetherWrite Ecosystem                  |
           +-------------------------------------------------------+
                                      |
     +--------------------------------+--------------------------------+
     |                                |                                |
     v                                v                                v
+------------------+        +------------------+        +------------------+
|   Core Desktop   |        |   Local AI & DB  |        | Cloud & Sync (Opt|
+------------------+        +------------------+        +------------------+
| Electron 41      |        | Transformers.js  |        | Supabase Sync    |
| React 19         |        | IndexedDB Cache  |        | pgvector Engine  |
| CodeMirror 6     |        | D3.js Graph      |        | Public Spaces    |
| TypeScript 5.8   |        | Pandoc WASM      |        | Key-Wrapped Auth |
+------------------+        +------------------+        +------------------+
```

---

## Getting Started

### Installation
Download the latest binaries for Linux, macOS, or Windows directly from our [Releases Page](https://github.com/varshithm7x/NetherWrite/releases).

* **macOS Note**: If Gatekeeper displays *"NetherWrite.app is damaged or from an unidentified developer"*, right-click `NetherWrite.app` → select **Open**, or run:
  ```bash
  xattr -cr /Applications/NetherWrite.app
  ```
* **Windows Note**: Free code signing provided by [SignPath.io](https://signpath.io/) and certificate by [SignPath Foundation](https://signpath.org/).

### Building from Source

```bash
# Clone the main repository
git clone https://github.com/varshithm7x/NetherWrite.git

# Navigate into the project folder
cd NetherWrite

# Install dependencies
npm install

# Run the development environment
npm run dev
```

---

## Community & Contribution

We welcome contributions from developers, researchers, and writers. Whether you are adding features, refining plugin compatibility, fixing bugs, or improving documentation:

- Read our [Contribution Guidelines](https://github.com/varshithm7x/NetherWrite/blob/main/CONTRIBUTING.md).
- Explore open issues in the [NetherWrite Issue Tracker](https://github.com/varshithm7x/NetherWrite/issues).
- Check the project [Architecture Documentation](https://github.com/varshithm7x/NetherWrite/tree/main/docs).

---

## Contact & Links

- **Organization Homepage**: [https://github.com/NetherWrite](https://github.com/NetherWrite)
- **Main Repository**: [varshithm7x/NetherWrite](https://github.com/varshithm7x/NetherWrite)
- **License**: [Apache License 2.0](https://github.com/varshithm7x/NetherWrite/blob/main/LICENSE)
