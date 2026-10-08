# NetherWrite Changelog

A comprehensive chronological record of all features, improvements, optimizations, and bug fixes implemented in NetherWrite.

---

## Unreleased

* Renamed the desktop app, website, documentation, and platform packaging to **NetherWrite**. The executable is `netherwrite` and the application ID is `com.netherwrite.app`.
* Existing desktop profiles, browser preferences, offline notes, and vault data migrate to the new names. Legacy canvas metadata remains readable; user note text is preserved.
* Native development and packaging environment variables now use the `NETHERWRITE_` prefix. Update local environment files and CI configuration accordingly.
* Repository, download, contact, and website references now use NetherWrite. Publishing requires corresponding GitHub/account/domain changes and new release artifacts.

## 2026-09-13 (v1.0.5)

This release builds on v1.0.4 with a major editor and collaboration upgrade, stronger local-first AI, improved plugin compatibility, and a production-ready documentation site.

### Editor and Commenting
* **Full Comment Threads**: Added comment creation, editing, replies, mentions, image attachments, image lightboxes, edited timestamps, and persistent local storage.
* **Rich Comment Formatting**: Added a toolbar for bold, italic, underline, strikethrough, highlighting, inline code, links, blockquotes, ordered lists, and unordered lists. Comments render as a live formatted preview instead of exposing Markdown syntax.
* **Better Comment Layout**: Added normal standalone comment cards, compact cards, long-comment previews, expand/collapse controls, collision-aware positioning, smooth expansion movement, and hover-linked emphasis.
* **Accurate Anchors**: Fixed repeated words being highlighted together. A comment now belongs only to the exact selected occurrence, including selections inside rendered tables.
* **Markdown Editing**: Added live table editing with row and column controls, improved callout editing and typography, better image widgets and lightbox zoom, and safer Mermaid rendering with theme support.
* **Editor Reliability**: Fixed missing-content rendering crashes, stale CodeMirror positions during file and tab activation, layout overflow, and several refresh and hydration edge cases.

### AI and Knowledge Graph
* **Grounded Citations**: Cloud citation results now preserve note paths, can download the referenced note on demand, and filter deleted notes from lexical fallback results.
* **AI Graph Improvements**: Improved graph auto-centering, rendering performance, force layout behavior, and node activity. ONNX Runtime WASM assets are hosted locally for offline embedding support, with embedding-cache pruning.
* **Writing Assistance**: Improved inline AI suggestions and centralized Mermaid-aware prompting with higher response limits.

### Collaboration and Vaults
* **Yjs Collaboration**: Improved CRDT hydration, real-time presence, reconnection, remote persistence, sync batching, and Canvas synchronization.
* **Conflict Protection**: Preserved rejected local edits as conflict copies and prevented legacy last-write-wins synchronization from overwriting Yjs-managed documents.
* **Vault Workflow**: Added recent vaults, close-vault actions, inline file and folder renaming, directory-aware note and folder creation, file and folder moves, and more reliable external file watching and refresh behavior.
* **Local-First Safety**: Hardened filesystem path isolation, API-key storage outside plaintext localStorage, outbound URL validation, plugin permissions, and cross-user note retrieval.

### Interface, Plugins, and Website
* **Theme and Layout**: Refined the default dark theme, made comment colors theme-aware, improved sidebar and explorer contrast, and fixed wallpaper and responsive layout issues.
* **Plugin Compatibility**: Expanded Obsidian API polyfills, filesystem adapters, plugin views, marketplace behavior, and runtime compatibility coverage.
* **Plugin Security**: Sanitized marketplace README rendering, hardened renderer IPC, rejected redirects to private hosts, and routed external plugin links through validated IPC.
* **Documentation Site**: Added the production documentation website, product walkthrough, embedded workspace demonstrations, feature comparisons, responsive layouts, and improved README installation guidance.

### Build and Release Quality
* **Testing**: Added the pull-request CI gate, build-integrity checks, unit and integration coverage, plugin runtime tests, compatibility checks, and the unified all-checks runner.
* **Cross-Platform Packaging**: Maintained native Linux, Windows, and macOS packaging for AppImage, Debian, Arch, NSIS, portable EXE, DMG, and ZIP artifacts.
* **Electron Reliability**: Improved startup behavior, single-instance handling, hardware acceleration, Vite code splitting, lazy loading, and editor component memoization.

### Contributors
Thank you to everyone who contributed between v1.0.4 and v1.0.5:

* **Varshith M7X** — editor, comments, synchronization, graph performance, AI, themes, release engineering, and integration work.
* **Rishi Jat** — CI, website, documentation, plugin compatibility, security hardening, and release workflow work.
* **Muhammad Ali Siddiqui** — marketplace security and integration fixes.
* **Muhammad Muneeb** — cloud citations, PDF export, status bar, and collaboration fixes.
* **0xIta3hi** — API-key security, documentation, and repository maintenance.
* **alibro005** — Mermaid rendering, plugin security, vault behavior, and command workflow fixes.
* **JINLING1** — command palette and platform usability fixes.
* **Cenk** — cross-user retrieval and database security hardening.
* **Sarthik**, **GUNPARK_GOOKIM**, **hopperminecart**, and **Abdulazeez A. Noaman** — Electron startup, synchronization, titlebar, and external-link reliability fixes.

---

## 2026-07-24 (v1.0.4)

### NetherWrite Rebrand & Vault Migration
* **Project Rebrand**: Rebranded project and organization to **NetherWrite** (`github.com/varshithm7x/NetherWrite`), updating package manifests, desktop metadata, storage keys, environment variables, database schemas, and documentation while retaining nominative fair-use references to Obsidian plugin API compatibility.
* **Automatic Vault Migration**: Implemented automatic migration of legacy `.openobsidian/` data directories to `.netherwrite/` when opening existing vaults, preserving vector embeddings, space metadata, and disk caches seamlessly.
* **Dynamic Settings Versioning**: Connected Settings "About" section and General Options tab to display dynamic application version (`v1.0.4`) and updated GitHub API endpoint to `varshithm7x/NetherWrite` for update checking.
* **CI/CD Release Workflow Fix**: Fixed GitHub Action release workflow (`release.yml`) to generate release notes on a single matrix runner, preventing duplicated `Full Changelog:` links across multi-platform release builds.

---

## 2026-07-21 (v1.0.3)

### Features and Improvements
* **Link AutoComplete Panel**: Added dedicated LinkAutoComplete Panel component to simplify linking files across vaults.
* **Linux Desktop Installation**: Added standalone install script (`scripts/install.sh`) and optimized Linux GTK desktop packaging integration.

### Performance and Refactoring
* **AI Panel Performance**: Optimized AI page rendering performance, note embedding retrieval, and search suggestion filtering.
* **Workspace Clean Up**: Removed obsolete New Tab view components and streamlined tab layout routing.

### Security and Fixes
* **Dependency Security**: Resolved security vulnerabilities across package dependencies.
* **Packaging & Desktop Icons**: Fixed desktop icon path configuration and native packaging scripts for Linux GTK targets.

---

## 2026-07-20 (v1.0.2)

### Features and Improvements
* **Space Unlocking & Password Authentication**: Added a private space unlocking flow with modal interface and secure password authentication.
* **Space Forking & Visual Progress**: Optimized space forking with batch processing and real-time visual progress tracking for remixed spaces.
* **Collaboration & File Deletion**: Integrated file deletion handling in the sync engine and updated RLS database policies to support space collaboration.
* **Collaboration Maintenance Notice**: Added a maintenance mode status notice to the collaboration panel.
* **Application Icon Refresh**: Updated high-resolution icon assets (.icns, .ico, .png) and configured native icon loading in the Electron main process.

### Refactoring and Optimization
* **Canvas & Graph Pan Support**: Added smooth panning support for wheel and scroll events across both CanvasView and GraphRenderer components.
* **Markdown Renderer Line Break Options**: Standardized line break options across MarkdownPreview, LinkPreview, and Obsidian API MarkdownRenderer.

### Bug Fixes
* **Sidebar File Navigation**: Fixed file tree navigation in the sidebar to correctly preserve and render empty directories.
* **Update Checker Info**: Clarified private repository constraints and manual update steps in Settings update checker.

---

## 2026-07-18 (v1.0.1)

### Features and Improvements
* **Text Formatting Hotkeys**: Implemented native formatting shortcuts inside the CodeMirror markdown editor: Bold (Ctrl+B / Cmd+B), Italic (Ctrl+I / Cmd+I), Inline Code (Ctrl+E / Ctrl+` / Cmd+E / Cmd+`), and Strikethrough (Ctrl+Shift+X / Cmd+Shift+X). These wrap/unwrap selections correctly and position the cursor inside empty tags.
* **Update Checker & Installer Linker**: Connected the "Check for updates" option in Settings to fetch release details from GitHub. Added platform detection to recommend and directly link the corresponding package download (.pkg.tar.zst for Arch, .deb for Debian, .dmg for Mac, or .exe for Windows).
* **Logo Contrast Containers**: Wrapped all application logo image tags in contrast boxes (white card for dark/black logo variants and high-contrast dark frames for light/white logo variants) to ensure perfect visibility on all desktop and client background configurations.
* **Settings Panel Styling**: Redesigned the About section in Settings into a static, clear text-based layout with clean visual grids, system status information, and community resource links. Emojis, transitions, and hover scaling animations were removed.

### Refactoring and Optimization
* **AI Graph Performance Optimization**: Decoupled the high-frequency physics ticks (~60fps) of the D3 layout engine from the React thread in the AI Knowledge Graph component. Implemented a throttled 10fps polling routine for progress tracking, reducing React update overhead and resolving UI stutters.
* **General Smooth Scrolling**: Added GPU-accelerated smooth scrolling Chromium switches to the Electron startup pipeline and configured will-change/scroll-behavior properties on all scrollable panels.

### Bug Fixes
* **Supabase Authentication Race Condition**: Resolved a race condition where saving custom Supabase config in settings triggered overlapping auth initialization routines. Implemented generation counters to abort obsolete checks and clean up active listeners.
* **Supabase Session Persistence**: Set persistSession to false for secondary databases to avoid session collisions.

### Infrastructure & Packaging
* **Linux Pacman Packaging Fix**: Replaced the general "gtk" package dependency with "gtk3" inside Pacman package configs, and added FPM --no-auto-depends to prevent spurious native dependencies from being injected during AUR builds.

---

## 2026-05-21

### Features and Improvements
* **Plugin Marketplace Layout**: Implemented a split-pane layout with markdown README rendering for the plugin marketplace.
* **Plugin Marketplace Portal**: Rendered the PluginMarketplace component within a portal at the document body level.

### Refactoring and Optimization
* **Design Token Standardization**: Standardized design tokens and color palettes across all application themes to ensure consistent rendering.

### Infrastructure & Chore
* **Git Configuration**: Updated `.gitignore` with new patterns and removed transient queue files.

---

## 2026-05-20

### Collaboration
* **Collaboration Engine**: Implemented a basic collaboration engine supporting vaulted workspaces, presence tracking, and multi-user synchronization.

---

## 2026-05-17

### Remote Sync & Spaces
* **Supabase Vector Indexing**: Enabled vector indexing for remote cloud spaces by fetching notes directly from Supabase.
* **Spaces System**: Implemented the Spaces feature with local-first indexing, RAG capabilities, and a robust sync engine for Supabase integration.
* **Workspace State Persistence**: Implemented workspace state persistence to disk and layout restoration upon application startup.

### Performance & Refactoring
* **Sync Engine Optimization**: Optimized the sync engine using batched operations, queue deduplication, and refined offline handling.
* **Styles Cleanup**: Removed the redundant `will-change` CSS property from global styles.

### UI & UX
* **Close Tabs**: Increased tab close button size and adjusted layout styling for better consistency.

---

## 2026-05-16

### Canvas & DB Schema
* **Canvas File Types**: Added support for canvas notes by fetching the `is_canvas` flag and assigning appropriate file extensions.
* **Canvas Schema**: Added the `is_canvas` field to the notes schema and the processing pipeline.
* **Supabase DB Integration**: Implemented user-owned Supabase database integration with schema automation and improved internal plugin stubs.

### Bug Fixes
* **Index Rebuilds**: Ensured index builds use a fresh file tree and added error toast notifications for failed index operations.
* **Local Workspace Restriction**: Added local-only index state and restricted indexing UI to local spaces.

---

## 2026-05-15

### Layout & Navigation
* **New Tab View**: Implemented a New Tab view and default state for blank workspaces.
* **Multi-Pane Layout**: Implemented a multi-pane layout system with drag-and-drop capabilities and refactored editor header styles.

### Bug Fixes & Refactoring
* **Scroll Optimization**: Prevented scroll propagation on mount and optimized space view layout by fixing indexing bar visibility and container overflow.
* **Graph View Link Width**: Set a constant link width of 1 in the GraphView component.
* **Graph Rendering Performance**: Optimized graph rendering performance by adjusting Device Pixel Ratio (DPR) and alpha values.
* **Spacing Alignment**: Updated spacing constants for consistent layout alignment.

### Dependency Migrations
* **Transformers Migration**: Migrated from `@xenova/transformers` to `@huggingface/transformers` and updated `onnxruntime-web` dependency, resolving minor package issues.

---

## 2026-05-14

### Plugin System & Customization
* **Plugin Registry Stubs**: Implemented plugin registry stubs and cleaned up vault test files.
* **Plugin Connectivity**: Enabled main-view support for plugin views and lifted CORS restrictions to improve plugin connectivity.
* **Theme & Performance Toggles**: Added support for new themes, custom base theme toggling, and improved hardware-accelerated iframe rendering.
* **Plugin Video Support**: Updated video aspect ratio and added default form element styles for plugins.

### Performance & Direct DOM Resize
* **Canvas Path Performance**: Optimized canvas rendering by bypassing React for scribble paths and adding CSS containment.
* **Sidebar Resizing**: Optimized sidebar and panel resizing by using direct DOM manipulation to eliminate React re-renders during drag events.
* **Dynamic Icons**: Replaced the static icon map with dynamic Lucide library integration in `obsidian-api` utilities.

---

## 2026-05-13

### Embeds & Restoration
* **Universal Embed Registry**: Implemented a universal embed registry and unified iframe resolver for enhanced media rendering in `MarkdownPreview`.
* **Social Embeds**: Added support for themed Twitter embeds in Markdown previews and updated CSP headers.
* **Session Restoration**: Implemented persistent vault path storage and automatic session restoration on startup.
* **API Stubs**: Expanded Obsidian API stubs and removed obsolete test files.

---

## 2026-05-12

### UI & UX Styling
* **Sidebar Enhancements**: Increased sidebar icon sizes and refactored CSS formatting for improved layout and readability.

---

## 2026-05-11

### Ribbon & Tooltips
* **Sidebar Collapses**: Added smooth collapse animation to sidebar folder tree items using CSS grid transitions.
* **Custom Tooltips**: Implemented custom delayed-hover tooltips for ribbon buttons to replace native title attributes.
* **Navigation & Tab Control**: Added Ctrl+Tab navigation, optimized tab selection logic, and implemented horizontal scroll for titlebar tabs.

### Canvas Insights & Editor
* **Scribble Color Migration**: Implemented theme-aware automatic scribble color migration and improved canvas dot visibility.
* **Inline Note Insights**: Replaced the thought model toggle with an inline note insight feature and updated the UI styling.
* **Editor Header Extraction**: Refactored and extracted editor controls into a new `EditorHeader` component, integrating it into the main layout.
* **Unified Title Bar**: Migrated editor tabs to a unified Obsidian-style title bar integrated into the application shell.
* **Sidebar Footer**: Moved vault switcher and settings to the sidebar footer.
* **Chevron Styling**: Removed file icon rendering logic and updated sidebar chevron styling.
* **TitleBar Sizing**: Refactored TitleBar icon sizes and layout styling for improved spacing and alignment.

---

## 2026-05-10

### Code Health
* **Theme Detection**: Consolidated theme detection logic into a central helper and updated UI components to use it.

---

## 2026-05-09

### Performance
* **Canvas Performance**: Optimized canvas viewport performance by bypassing React state for DOM transforms and animations.

---

## 2026-05-08

### Canvas Panning & Scribbling
* **Adaptive Grid**: Implemented adaptive grid scaling and smoother panning for CanvasView dots.
* **Scribble Sync**: Implemented scribble selection and synchronized movement during node and canvas drag operations.

---

## 2026-05-07

### Infrastructure & Suggest
* **Image Resolving**: Implemented image path resolution.
* **Abstract Input Suggest**: Added the `AbstractInputSuggest` utility.
* **App Update**: Updated app version and set default npm package manager, ignoring the `.vscode` directory.

---

## 2026-05-05

### Theming & Prototypes
* **Adaptive Branding**: Added adaptive branding logos that update based on theme luminance.
* **Interface-Prototype Pattern**: Refactored Notice, Modal, and Setting to the interface-prototype pattern, and added the Peach White theme option.

---

## 2026-05-04

### APIs & Physics Refactor
* **Workspace View Refactoring**: Encapsulated containerEl with accessors in workspace views, and added TypeScript interfaces for SettingTabs.
* **Vulnerability Fix**: Addressed a path traversal vulnerability in `fileSystem.ts`.
* **Graph Parity**: Refactored graph rendering and simulation physics with Obsidian-parity standards, updated ONNX runtime version, and configured `.gitignore` to ignore `.gemini` files.
* **Obsidian API Extension**: Added `containerEl` to the Obsidian API and implemented adaptive graph physics and labeling.
* **UI Components**: Standardized Obsidian UI components, expanded DOM extensions, and implemented git view styles.

---

## 2026-05-02

### API Compatibility
* **Obsidian Stubs**: Introduced Obsidian API stubs and DOM extensions for plugin compatibility, and updated CSP settings.

---

## 2026-05-01

### Core Refactor
* **Plugin Decoupling**: Decoupled plugin system initialization from vault loading and improved plugin installation error handling and logging.

---

## 2026-04-29

### Performance and Synchronization
* **Concurrent Writes**: Optimized sync engine with concurrent localDB writes.
* **File Read Parallelization**: Parallelized file reading in `AIPage` for significant speedup.

---

## 2026-04-28

### Core Features & Documentation
* **Scroll-to-Line**: Implemented scroll-to-line after a file is opened.
* **Comprehensive Documentation**: Created a comprehensive README documenting AI features.
* **Sidebar Enhancements**: Added file filtering, sorting, and contextual icons to the file explorer sidebar.

---

## 2026-04-27

### Workspace Permissions
* **Space Permissions**: Implemented robust space deletion permissions, enabled vector index copying for forks, and added toast notifications with improved Electron auth handling.

---

## 2026-04-26

### Discoverability
* **Public Discovery**: Implemented public space discovery system with semantic search, community voting, and Supabase integration.

---

## 2026-04-25

### Themes
* **Dark Plus Theme**: Added Dark Plus theme support and updated related UI components.

---

## 2026-04-15

### Bug Fixes
* **Pen Width Fix**: Fixed width issue when the pen tool is clicked.

---

## 2026-04-14

### Canvas Drawing & Aesthetics
* **Color Panel**: Fixed color changing panel overflow by adding a new `ColorPanel` component.
* **Theme Styling**: Designed a richer and more balanced dark theme.
* **Canvas Styling**: Aligned Canvas styles to match Obsidian Canvas styling.
* **Drawing Tools**: Added erase, pen, and lasso select tools.
* **Draw Tool**: Added a new drawing tool.
* **Canvas Sync Fix**: Fixed canvas notes update issue.

---

## 2026-04-12

### Canvas Text & Layout Optimizations
* **Text Visibility**: Fixed canvas text render issue and improved text visibility and color contrast in dark and light canvas themes.
* **Grid Rendering**: Fixed canvas grid display issues.
* **Testing Vault**: Added mega vault for testing large vaults.
* **Pan/Zoom Smoothness**: Implemented smooth zoom and drag/pan fixes.
* **Zoom Performance**: Resolved zoom lag on heavy canvases.
* **Markdown Margin Adjustments**: Reduced margin and vertical spacing for callouts, lists, paragraphs, and embedded markdown sections.
* **Starred Files Hierarchy**: Starred files UI is styled as proper sidebar rows instead of default button look, with a cleaner hierarchy and parent-path subtitle helper.
* **Scoped Ctrl+Scroll**: Scoped Ctrl+scroll behavior to prevent canvas zooming when zooming note text inside embedded nodes.
* **Canvas Operations**: Added canvas file actions (New Canvas, Duplicate, Save As) and a Recent Canvases popover, tracking recent canvases in app state and command palette.

---

## 2026-04-11

### Core Canvas & Electron Fixes
* **Canvas Release**: Released Canvas v1 and Canvas Update v1.
* **Electron Windows Startup**: Resolved Windows startup compatibility issues and Electron platform bugs.
* **Graph View Customization**: Enabled customizable background color settings for the graph view.
* **Light Theme Improvements**: Designed a high-quality Light Theme that is soft and eye-friendly.
* **Text & Icon Colors**: Fixed faded icons and text styling.
* **Configuration**: Fixed baseUrl error in `tsconfig.json` and resolved project vulnerabilities.
* **Axios Upgrade**: Updated axios to version 1.15.0.
* **Graph Mode Toggle**: Enabled read mode viewing of notes when their corresponding nodes are clicked inside the graph.
* **CodeMirror Editor Enhancements**: Enabled word-wrapping, hid horizontal scrollbars, and matched content width to read mode.
* **Image Pasting**: Compressed long pasted image paths prior to insertion.
* **Image-to-Text Button**: Improved layout and aesthetics of the image-to-text / text-to-image conversion buttons.
* **Sidebar Switcher**: Replaced the command palette button in the ribbon with a direct File Explorer toggle button.

---

## 2026-04-10

### Bug Fixes
* Resolved minor interface issues.

---

## 2026-04-09

### UI Enhancements
* **Editor Text Style**: Updated markdown editor text colors to a pleasant whitish-blue.
* **Cursor & Pointers**: Resolved cursor active-state pointer bugs.

---

## 2026-04-08

### Canvas2D Graph Renderer
* **Dependency Removal**: Removed PixiJS dependency, eliminating webgl and shader max-statement errors.
* **Canvas2D Renderer**: Introduced a new Canvas2D Renderer (`GraphRenderer.ts`) with high-DPI support, smooth zoom/pan with lerp interpolation, and hover-dimming of non-connected nodes.
* **Large Vault testing**: Added a custom test vault for testing massive vaults.

---

## 2026-04-07

### Graph settings & Stability
* **Responsive Slider Calculations**: Prevented the force settings from triggering auto-relayout on dragging; changes now apply smoothly on specific triggers.
* **Thought Model Alignment**: Prevented the thought model panel from overlapping with the graph view or modifying YAML themes.
* **Vault Configs**: Saved separate configuration settings for each workspace vault.
* **Graph Repositioning**: Fixed auto-repositioning bugs and scattering on graph node operations.
* **Force Customization**: Added Center Force, Repel Force, Link Force, and Link Distance sliders with helpful tooltips.
* **Vault Search**: Added a simple machine learning model for vault search capabilities.

---

## 2026-04-06

### Major Features Launch
* **Markdown Live Preview**: Full Markdown editing with live-preview rendering.
* **Wiki Links**: Linked concept support via `[[Wiki Links]]`.
* **Global & Local Graphs**: Interactive graph visualization with toggle capability.
* **Full-Text Search**: Robust vault search and Quick Switcher.
* **Command Palette**: Trigger commands easily using `Ctrl+P`.
* **Auto-Save**: Integrated automatic saving with a 2-second debounce timer.
* **Daily Notes**: Daily note creation templates.
* **Templates System**: Instantly insert templated notes with dynamic variables (`{{date}}`, `{{title}}`, etc.).
* **Callouts & Admonitions**: Full styling support for alert styles (`> [!note]`, `> [!warning]`, etc.).
* **Task Lists**: Click-to-toggle task lists in edit and preview modes.
* **AutoComplete Links**: Suggestions dropdown when typing `[[`.
* **Outline Pane**: Hierarchy-based heading navigator.
* **Frontmatter Properties**: Properties panel for frontmatter/YAML editing.
* **Starred Notes**: Pin and access critical notes in the sidebar.

---

## 2026-04-05

### Pre-release Optimizations
* **Graph Pre-run**: Pre-run graph physics engine for 300 iterations for stable initial positioning.
* **Tag & Outgoing Links Panes**: Added tag listing pane with counts and outgoing links tracker.
* **Vault Stats**: Status bar displaying real-time word count, notes count, and link density.
* **Graph Layout Sliders**: Added graph spacing sliders and resolved search/replace UI bugs.

---

## 2026-04-04

### Toolbar & Resizers
* **Toolbar Introduction**: Added a universal Toolbar with built-in search.
* **Graph Defaults**: Enabled fullscreen graph mode when opening an empty vault.
* **Aesthetics**: Improved node/edge highlighting, customized stroke colors, and redesigned zoom button triggers.
* **Panes**: Rebuilt the split-pane resizer and node dimensions adjuster.

---

## 2026-04-03

### NetherWrite Rebrand
* **Rebrand**: Rebranded project to NetherWrite.
* **Console Warnings**: Resolved extensive console warnings and optimized bright layout components for better contrast.

---

## 2026-03-30

### Initial Commit
* **First Release**: Configured electron packager, build scripts, workspace directories, and core markdown view integration.
