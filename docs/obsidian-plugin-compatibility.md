# Obsidian plugin compatibility

NetherWrite targets the public Obsidian plugin API and tests against the official
`obsidian` npm package.

## Compatibility baseline

- Official API package: `obsidian@1.13.1`
- Public runtime export audit: 158 of 158 exports
- Editor integrations: CodeMirror 6 and legacy CodeMirror 5 module access
- Desktop integrations: Node/Electron module loading and binary vault I/O
- Export backend: managed Pandoc 3.10 WASM runtime with filesystem access
- UI integrations: commands, ribbon icons, status bar items, settings, modals,
  workspace leaves, sidebars, custom views, and Markdown processors
- Lifecycle integrations: plugin/component load, unload, event, interval, DOM,
  view, command, editor extension, and processor cleanup

## Real plugin regression matrix

The test suite evaluates, constructs, loads, and unloads production bundles for:

| Plugin | Version |
| --- | --- |
| Dataview | 0.5.70 |
| Templater | 2.22.1 |
| Tasks | 8.1.0 |
| Calendar | 2.0.0-beta.2 |
| Kanban | 2.0.51 |
| Style Settings | 1.0.9 |
| Advanced Tables | 0.23.2 |
| QuickAdd | 2.12.3 |
| Obsidian Git | 2.38.3 |
| Excalidraw | 2.23.12 |
| Better Export PDF | 1.11.0 |
| Enhancing Export | 1.11.1 |
| Reading Time | 1.1.2 |

The fixtures cover data/indexing, templates, tasks, workspace views, custom
Markdown views, settings UI, editor commands, migrations, Node modules, Git,
icons, ribbons, sidebars, and cleanup.

The pinned release bundles are downloaded to a temporary cache by
`scripts/fetch-plugin-fixtures.cjs`. Missing fixtures are a test failure; the
suite does not silently skip the plugin matrix.

Enhancing Export uses the managed Pandoc backend. Install or refresh it with:

```bash
npm run install:pandoc-backend
```

## Verification

Run the complete compatibility gate:

```bash
npm run test:plugin-compat
npm run test:canvas-compat
npm run lint
npm run build
```

`scripts/test-obsidian-api-compat.cjs` compares the local runtime module against
the official package and fails when an official runtime export is missing.
`tests/plugin-runtime.test.ts` verifies behavior that export checks cannot cover.
`tests/real-plugin-bundles.test.ts` executes real compiled community plugins.

Compatibility is enforced against the public API. Plugins that depend on
undocumented Obsidian internals can still require plugin-specific adapters when
those internals change.
