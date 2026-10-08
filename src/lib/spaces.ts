import { supabase } from './supabase';
import { localDB, LocalNote } from './localdb';
import { authManager, AuthRequiredError } from './auth';
import { syncEngine } from './syncEngine';
import { indexSpaceMetadata } from './explore';
import { v4 as uuidv4 } from 'uuid';
import { indexNote } from './vector';
import { getAPI } from '../utils/api';
import { sha256Hex } from '../utils/collabDocument';

export type SpaceVisibility = 'local' | 'private' | 'public';

/**
 * Create a new space. Always starts as 'local' by default.
 */
export async function createSpace(params: {
  title: string;
  description?: string;
  helpsWith?: string[];
  visibility?: SpaceVisibility;
}): Promise<any> {
  const userId = authManager.getUserId();
  const visibility = params.visibility || 'local';
  const now = new Date().toISOString();

  // If visibility is not local, require auth
  if (visibility !== 'local' && !userId) {
    throw new AuthRequiredError('Login required for cloud spaces');
  }

  const space = {
    id: uuidv4(),
    owner_id: userId || 'local',
    title: params.title,
    description: params.description || null,
    helps_with: params.helpsWith || [],
    visibility,
    is_public: visibility === 'public',
    forked_from: null,
    created_at: now,
    updated_at: now,
  };

  const enqueueSync = visibility !== 'local' && !!userId;
  await localDB.putSpace(space as any, enqueueSync);

  return space;
}

/**
 * Publish a space. REQUIRES login. Changes visibility to 'public'.
 */
export async function publishSpace(spaceId: string): Promise<any> {
  const user = authManager.requireAuth();

  const space = await localDB.getSpace(spaceId);
  if (!space) throw new Error('Space not found locally');

  const updatedSpace = {
    ...space,
    owner_id: user.id,
    visibility: 'public',
    is_public: true,
    updated_at: new Date().toISOString(),
  };
  await localDB.putSpace(updatedSpace as any, true);

  // Index space metadata for semantic search
  try {
    await indexSpaceMetadata(
      spaceId,
      updatedSpace.title,
      updatedSpace.description || '',
      (updatedSpace.helps_with as string[]) || []
    );
  } catch (err) {
    console.error('[Spaces] Failed to index space metadata:', err);
  }

  // For space sync logic, since `pushSpace` was removed, we trigger a normal push loop.
  // We can just rely on the syncEngine queue or trigger a push manually.
  syncEngine.triggerPush();

  return updatedSpace;
}

/**
 * Unpublish: set visibility to 'private' (still synced, just not in marketplace)
 */
export async function unpublishSpace(spaceId: string): Promise<any> {
  authManager.requireAuth();

  const space = await localDB.getSpace(spaceId);
  if (!space) throw new Error('Space not found locally');

  const updatedSpace = {
    ...space,
    visibility: 'private',
    is_public: false,
    updated_at: new Date().toISOString(),
  };
  await localDB.putSpace(updatedSpace as any, true);

  return updatedSpace;
}

/**
 * Make a space private (cloud-synced but not public)
 */
export async function makeSpacePrivate(spaceId: string): Promise<any> {
  const user = authManager.requireAuth();

  const space = await localDB.getSpace(spaceId);
  if (!space) throw new Error('Space not found locally');

  const updatedSpace = {
    ...space,
    owner_id: user.id,
    visibility: 'private',
    is_public: false,
    updated_at: new Date().toISOString(),
  };
  const wasLocal = space.visibility === 'local';
  await localDB.putSpace(updatedSpace as any, true);

  // If previously local, notes were never enqueued -- force-push everything
  if (wasLocal) {
    syncEngine.triggerPush();
  }

  return updatedSpace;
}

/**
 * Make a space local-only (remove from cloud)
 */
export async function makeSpaceLocal(spaceId: string): Promise<any> {
  const space = await localDB.getSpace(spaceId);
  if (!space) throw new Error('Space not found locally');

  // If it was on the cloud, enqueue a delete
  if ((space as any).visibility !== 'local') {
    await localDB.putSpace(
      { ...space, visibility: 'local', is_public: false, updated_at: new Date().toISOString() } as any,
      false
    );
    // Explicitly enqueue delete for the cloud record
    await localDB.putSyncItem({
      id: `spaces_${spaceId}_delete`, // unique ID to not overlap with any pending updates
      operation: 'delete',
      table: 'spaces',
      record_id: spaceId,
      payload: { id: spaceId },
      created_at: Date.now(),
      retry_count: 0
    });
  } else {
    await localDB.putSpace(
      { ...space, visibility: 'local', is_public: false, updated_at: new Date().toISOString() } as any,
      false
    );
  }

  return space;
}

/**
 * Fork a public space. REQUIRES login.
 * Clones the space, assigns new owner, re-indexes embeddings.
 */
export async function forkSpace(originalSpaceId: string): Promise<string> {
  const user = authManager.requireAuth();

  // 1. Fetch original space from cloud
  const { data: originalSpace, error: spaceErr } = await supabase
    .from('spaces')
    .select('*')
    .eq('id', originalSpaceId)
    .single();

  if (spaceErr) throw spaceErr;

  // 2. Fetch original notes from cloud
  const { data: originalNotes, error: notesErr } = await supabase
    .from('notes')
    .select('*')
    .eq('space_id', originalSpaceId);

  if (notesErr) throw notesErr;

  // 3. Create new space
  const newSpaceId = uuidv4();
  const newSpace = {
    ...originalSpace,
    id: newSpaceId,
    owner_id: user.id,
    visibility: 'private',
    is_public: false,
    forked_from: originalSpaceId,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  await localDB.putSpace(newSpace as any, true);

  // Increment fork count on original
  await supabase.rpc('increment_space_forks', { space_id: originalSpaceId });

  // 4. Copy notes and trigger re-indexing
  const newSpaceFolder = `Spaces/${newSpace.title.replace(/[\\/:*?"<>|]/g, '')}`;

  const stripSpacePrefix = (path: string, spaceTitle: string): string => {
    const exactPrefix = `Spaces/${spaceTitle.replace(/[\\/:*?"<>|]/g, '')}/`;
    if (path.startsWith(exactPrefix)) {
      return path.slice(exactPrefix.length);
    }
    if (path.startsWith('Spaces/')) {
      const parts = path.split('/');
      if (parts.length > 2) {
        return parts.slice(2).join('/');
      }
    }
    return path;
  };

  for (const originalNote of (originalNotes || [])) {
    const fallbackPath = originalNote.is_canvas ? `${originalNote.title}.canvas` : `${originalNote.title}.md`;
    const subPath = originalNote.path && originalNote.path.trim() !== '' ? stripSpacePrefix(originalNote.path, originalSpace.title) : fallbackPath;
    const notePath = `${newSpaceFolder}/${subPath}`;

    const newNoteId = uuidv4();
    const newNote: LocalNote = {
      id: newNoteId,
      space_id: newSpaceId,
      vault_id: null,
      last_client_id: null,
      version: 0,
      last_modified: new Date().toISOString(),
      client_id: null,
      content_hash: await sha256Hex(originalNote.content || ''),
      title: originalNote.title,
      path: notePath,
      content: originalNote.content,
      pinned: originalNote.pinned,
      created_at: originalNote.created_at,
      updated_at: new Date().toISOString(),
      deleted: originalNote.deleted,
      is_canvas: originalNote.is_canvas,
    };

    await localDB.putNote(newNote, true);

    // Also write to file system so it actually exists in the local vault with the correct path
    try {
      if (subPath.includes('/')) {
         const parts = subPath.split('/');
         parts.pop(); // remove file name
         let currentPath = newSpaceFolder;
         for (const part of parts) {
            currentPath = `${currentPath}/${part}`;
            try {
              await getAPI().createDirectory(currentPath);
            } catch (e) {
              // Ignore if already exists
            }
         }
      }
      await getAPI().createFile(notePath, originalNote.content);
    } catch (err) {
       console.error(`[Spaces] Failed to write forked note to filesystem: ${notePath}`, err);
    }

    // Non-blocking re-index
    indexNote(newNoteId, newNote.content).catch(err => {
      console.error('[Spaces] Failed to index forked note:', err);
    });
  }

  return newSpaceId;
}

/**
 * Get space visibility status
 */
export function getVisibilityLabel(visibility: SpaceVisibility): string {
  switch (visibility) {
    case 'local': return 'Local Only';
    case 'private': return 'Private Cloud';
    case 'public': return 'Public';
    default: return 'Local Only';
  }
}
