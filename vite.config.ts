import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  base: './',
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      // @xenova/transformers imports onnxruntime-node in Electron's renderer (Node-like env).
      // Redirect to onnxruntime-web (WASM) which works correctly in the browser context.
      'onnxruntime-node': 'onnxruntime-web',
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    chunkSizeWarningLimit: 1200,
    rollupOptions: {
      output: {
        manualChunks(id) {
          if (id.includes('node_modules')) {
            if (id.includes('@xenova') || id.includes('onnxruntime')) {
              return 'vendor-transformers';
            }
            if (id.includes('@codemirror') || id.includes('@lezer') || id.includes('codemirror') || id.includes('@replit/codemirror-vim')) {
              return 'vendor-codemirror';
            }
            // Mermaid's layout/rendering dependencies and the app's graph
            // dependencies import each other. Keeping them in separate manual
            // chunks creates an initialization cycle in production builds and
            // can crash the renderer before React mounts.
            if (id.includes('mermaid') || id.includes('d3') || id.includes('cytoscape') || id.includes('dagre')) {
              return 'vendor-diagrams';
            }
            if (id.includes('katex')) {
              return 'vendor-katex';
            }
            if (id.includes('yjs') || id.includes('y-') || id.includes('lib0')) {
              return 'vendor-yjs';
            }
            if (id.includes('react') || id.includes('react-dom')) {
              return 'vendor-react';
            }
          }
        },
      },
    },
  },
  optimizeDeps: {
    // Lazy model/document imports must be ready before the first indexing/upload
    // request; discovering them later makes Vite reload the active renderer.
    include: ['d3-force', 'd3', 'mermaid', 'react-colorful', '@xenova/transformers', 'onnxruntime-web', 'pdfjs-dist/legacy/build/pdf.mjs', 'mammoth/mammoth.browser.js', 'xlsx', 'docx-preview', '@aiden0z/pptx-renderer', 'y-codemirror.next', 'y-indexeddb', 'y-protocols/awareness', 'yjs', 'lib0'],
  },
  worker: {
    format: 'es',
  },
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      // Vault changes belong to Electron's file watcher, not application HMR.
      ignored: ['**/.netherwrite/**', '**/.obsidian/**', '**/Uploads/**', '**/OO-Test-Vault/**', '**/computer-science-notes/**', '**/*.onnx', '**/*.canvas'],
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    exclude: ["tests/real-plugin-bundles.test.ts"],
    environment: "node",
  },
});
