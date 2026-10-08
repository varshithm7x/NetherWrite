/**
 * collabOperations.ts -- Shared types and helpers for operation-based
 * real-time collaboration.
 *
 * Instead of broadcasting the full document on every keystroke, we extract
 * granular insert/delete/replace operations from CodeMirror 6 transactions
 * and send only those. This reduces bandwidth and prepares the system for
 * future CRDT integration.
 */

import type { ChangeSet, ChangeSpec } from '@codemirror/state';

function generateOperationId(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

// ── Wire Types ──────────────────────────────────────────────────────────────

/**
 * A single granular editing operation, extracted from a CodeMirror transaction
 * and broadcast to peers via Supabase Broadcast.
 */
export interface CollabOperation {
  /** Globally unique operation id, used for duplicate suppression. */
  operation_id: string;
  type: 'insert' | 'delete' | 'replace';
  /** Character offset where the operation starts (in the OLD document). */
  from: number;
  /** Character offset where the operation ends (in the OLD document).
   *  Required for delete and replace; omitted for pure inserts. */
  to?: number;
  /** The text being inserted or replacing. Required for insert and replace. */
  text?: string;
  /** High-resolution timestamp for ordering. */
  timestamp: number;
  /** Version the sender had before this operation was applied. */
  base_version: number;
  /** Version after this operation is applied on the sender. */
  version: number;
  /** SHA-256 hash of the sender document after this operation batch. */
  content_hash?: string;
  /** The client that produced this operation. */
  client_id: string;
  /** The client that produced this operation (for echo prevention). */
  clientId: string;
  /** The user ID that produced this operation. */
  user_id?: string;
}

/**
 * Cursor presence data broadcast to peers via Supabase Broadcast.
 */
export interface CursorPresence {
  user_id: string;
  /** Browser/client that produced this cursor. Used to suppress local echoes. */
  client_id?: string;
  file_path: string;
  cursor: { from: number; to: number };
  name: string;
  color: string;
  doc_version?: number;
}

// ── Extraction ──────────────────────────────────────────────────────────────

/**
 * Extract CollabOperations from a CodeMirror 6 ChangeSet.
 *
 * CodeMirror's `iterChanges` yields tuples `(fromA, toA, fromB, toB, inserted)`
 * where A refers to the old document and B to the new one.
 *
 *  - fromA === toA  &&  inserted.length > 0  => pure insert
 *  - inserted.length === 0                    => pure delete
 *  - otherwise                                => replace
 */
export function extractOperations(
  changes: ChangeSet,
  clientId: string,
  userId?: string,
  baseVersion: number = 0,
  version: number = baseVersion + 1,
  contentHash?: string,
): CollabOperation[] {
  const ops: CollabOperation[] = [];
  const ts = Date.now();

  changes.iterChanges((fromA, toA, _fromB, _toB, inserted) => {
    const insertedText = inserted.toString();
    const isInsert = fromA === toA && insertedText.length > 0;
    const isDelete = insertedText.length === 0 && fromA !== toA;

    if (isInsert) {
      ops.push({
        operation_id: generateOperationId(),
        type: 'insert',
        from: fromA,
        text: insertedText,
        timestamp: ts,
        base_version: baseVersion,
        version,
        content_hash: contentHash,
        client_id: clientId,
        clientId,
        user_id: userId,
      });
    } else if (isDelete) {
      ops.push({
        operation_id: generateOperationId(),
        type: 'delete',
        from: fromA,
        to: toA,
        timestamp: ts,
        base_version: baseVersion,
        version,
        content_hash: contentHash,
        client_id: clientId,
        clientId,
        user_id: userId,
      });
    } else {
      // Replace: some text was deleted and new text inserted at the same position
      ops.push({
        operation_id: generateOperationId(),
        type: 'replace',
        from: fromA,
        to: toA,
        text: insertedText,
        timestamp: ts,
        base_version: baseVersion,
        version,
        content_hash: contentHash,
        client_id: clientId,
        clientId,
        user_id: userId,
      });
    }
  });

  return ops;
}

// ── Application ─────────────────────────────────────────────────────────────

/**
 * Convert a CollabOperation back into a CodeMirror ChangeSpec that can be
 * dispatched to an EditorView.
 *
 * The resulting ChangeSpec uses `from`, `to`, and `insert` fields that
 * CodeMirror understands natively.
 */
export function operationToChangeSpec(op: CollabOperation): ChangeSpec {
  switch (op.type) {
    case 'insert':
      return { from: op.from, insert: op.text || '' };
    case 'delete':
      return { from: op.from, to: op.to };
    case 'replace':
      return { from: op.from, to: op.to, insert: op.text || '' };
  }
}

/**
 * Clamp an operation's positions to the current document length.
 * Prevents out-of-range errors when the remote doc and local doc
 * have diverged slightly.
 */
export function clampOperation(
  op: CollabOperation,
  docLength: number,
): CollabOperation {
  const from = Math.min(op.from, docLength);
  const to = op.to !== undefined ? Math.min(op.to, docLength) : undefined;
  return { ...op, from, to };
}

export function rangesOverlap(aFrom: number, aTo: number, bFrom: number, bTo: number): boolean {
  const leftFrom = Math.min(aFrom, aTo);
  const leftTo = Math.max(aFrom, aTo);
  const rightFrom = Math.min(bFrom, bTo);
  const rightTo = Math.max(bFrom, bTo);
  return Math.max(leftFrom, rightFrom) <= Math.min(leftTo, rightTo);
}
