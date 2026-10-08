# NetherWrite website

Marketing site and user docs for NetherWrite. Facts on this site come from the
desktop app repository: `package.json` (v1.0.4, Apache-2.0, Node 22+), the
root README, `docs/spaces.md`, and `docs/obsidian-plugin-compatibility.md`.
The hero graph is built from real notes and `[[wiki links]]` in `OO-Test-Vault`.

## Run

```bash
cd website
npm install
npm run dev
```

Dev server: `http://localhost:4173`

```bash
npm run build
npm run preview
```

## Vercel

Set **Root Directory** to `website`. Use Node 22. The production build runs
`prebuild`, which installs the desktop app's production dependencies from the
repo root. The hero editor and graph import those packages from `../src`.

Do not set the project root to the repository root unless you also change the
install command to `npm install && cd website && npm install` and the output
directory to `website/dist`.
