const assert = require('node:assert/strict');

function isObject(value) {
  return value && typeof value === 'object' && !Array.isArray(value);
}

function normalizeCanvas(raw) {
  const doc = isObject(raw) ? raw : {};
  const metadata = { ...doc };
  delete metadata.nodes;
  delete metadata.edges;

  const nodesRaw = Array.isArray(doc.nodes) ? doc.nodes : [];
  const nodes = nodesRaw
    .map((node, index) => {
      if (!isObject(node) || typeof node.type !== 'string') return null;
      if (!['text', 'file', 'link', 'group'].includes(node.type)) return null;
      const id = typeof node.id === 'string' && node.id ? node.id : `node-${index + 1}`;
      return {
        ...node,
        id,
        x: Number.isFinite(node.x) ? node.x : 0,
        y: Number.isFinite(node.y) ? node.y : 0,
        width: Number.isFinite(node.width) ? node.width : 260,
        height: Number.isFinite(node.height) ? node.height : 160,
      };
    })
    .filter(Boolean);

  const nodeIds = new Set(nodes.map(node => node.id));
  const edgesRaw = Array.isArray(doc.edges) ? doc.edges : [];
  const edges = edgesRaw
    .map((edge, index) => {
      if (!isObject(edge)) return null;
      if (typeof edge.fromNode !== 'string' || typeof edge.toNode !== 'string') return null;
      if (!nodeIds.has(edge.fromNode) || !nodeIds.has(edge.toNode)) return null;
      const id = typeof edge.id === 'string' && edge.id ? edge.id : `edge-${index + 1}`;
      return { ...edge, id };
    })
    .filter(Boolean);

  return { metadata, nodes, edges };
}

function serializeCanvas(payload) {
  return JSON.stringify({
    ...payload.metadata,
    nodes: payload.nodes,
    edges: payload.edges,
  });
}

(function run() {
  const obsidianLike = {
    version: '1.0',
    metadata: { source: 'obsidian-import' },
    nodes: [
      { id: 'n1', type: 'text', text: 'hello', x: 10, y: 20, width: 280, height: 160, color: '4' },
      { id: 'n2', type: 'file', file: 'Index/Home.md', subpath: '#Section', x: 360, y: 20, width: 320, height: 180 },
      { id: 'n3', type: 'group', label: 'Group A', x: 0, y: 0, width: 800, height: 400, backgroundStyle: 'cover' },
    ],
    edges: [
      { id: 'e1', fromNode: 'n1', toNode: 'n2', fromSide: 'right', toSide: 'left', toEnd: 'arrow', label: 'links' },
    ],
  };

  const normalized = normalizeCanvas(obsidianLike);
  assert.equal(normalized.nodes.length, 3, 'should import all valid nodes');
  assert.equal(normalized.edges.length, 1, 'should import valid edges');
  assert.equal(normalized.metadata.version, '1.0', 'should preserve root metadata fields');

  const roundTrip = JSON.parse(serializeCanvas(normalized));
  assert.equal(roundTrip.metadata.source, 'obsidian-import', 'round-trip should preserve metadata');
  assert.equal(roundTrip.nodes[1].subpath, '#Section', 'round-trip should preserve optional node fields');

  const malformed = {
    nodes: [
      { type: 'text', text: 'missing id', x: 0, y: 0, width: 200, height: 100 },
      { id: 'bad', type: 'weird', x: 0, y: 0, width: 200, height: 100 },
    ],
    edges: [
      { fromNode: 'node-1', toNode: 'bad' },
      { fromNode: 'node-1', toNode: 'node-1' },
    ],
  };

  const repaired = normalizeCanvas(malformed);
  assert.equal(repaired.nodes.length, 1, 'invalid node types should be dropped');
  assert.equal(repaired.nodes[0].id, 'node-1', 'missing IDs should be repaired');
  assert.equal(repaired.edges.length, 1, 'edges to missing nodes should be dropped');

  console.log('Canvas compatibility tests passed.');
})();
