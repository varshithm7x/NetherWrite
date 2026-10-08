import { isSupabaseConfigured, supabase } from './supabase';
import { authManager } from './auth';
import { generateEmbedding, toVectorLiteral } from './vector';

export interface ExploreSpace {
  id: string;
  title: string;
  description: string | null;
  helps_with: string[] | null;
  owner_id: string;
  forked_from: string | null;
  visibility: string;
  created_at: string;
  updated_at: string;
  stats: {
    views: number;
    forks: number;
    upvotes: number;
    score: number;
  } | null;
}

/**
 * Fetch trending public spaces (ordered by score DESC)
 */
export async function getTrendingSpaces(limit = 20): Promise<ExploreSpace[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('spaces')
    .select(`
      id, title, description, helps_with, owner_id, forked_from, visibility, created_at, updated_at,
      space_stats ( views, forks, upvotes, score )
    `)
    .eq('visibility', 'public')
    .order('updated_at', { ascending: false })
    .limit(limit);

  if (error) throw error;

  const spaces = (data || []).map(mapExploreSpace);
  // Sort by score descending client-side (since we join)
  spaces.sort((a, b) => (b.stats?.score ?? 0) - (a.stats?.score ?? 0));
  return spaces;
}

/**
 * Fetch recently published public spaces
 */
export async function getNewSpaces(limit = 20): Promise<ExploreSpace[]> {
  if (!isSupabaseConfigured) return [];
  const { data, error } = await supabase
    .from('spaces')
    .select(`
      id, title, description, helps_with, owner_id, forked_from, visibility, created_at, updated_at,
      space_stats ( views, forks, upvotes, score )
    `)
    .eq('visibility', 'public')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data || []).map(mapExploreSpace);
}

/**
 * Semantic search for spaces using vector similarity
 */
export async function searchSpacesSemantic(query: string, limit = 10): Promise<ExploreSpace[]> {
  if (!isSupabaseConfigured) return [];
  const embedding = await generateEmbedding(query);

  const { data, error } = await supabase.rpc('match_spaces', {
    query_embedding: toVectorLiteral(embedding),
    match_threshold: 0.7,
    match_count: limit,
  });

  if (error) throw error;

  // match_spaces returns space_id, title, description, similarity
  // We need to fetch the full space objects
  const ids = (data || []).map((d: any) => d.space_id);
  if (ids.length === 0) return [];

  const FETCH_BATCH_SIZE = 30;
  let spaces: any[] = [];
  for (let i = 0; i < ids.length; i += FETCH_BATCH_SIZE) {
    const chunk = ids.slice(i, i + FETCH_BATCH_SIZE);
    const { data: chunkSpaces, error: spacesErr } = await supabase
      .from('spaces')
      .select(`
        id, title, description, helps_with, owner_id, forked_from, visibility, created_at, updated_at,
        space_stats ( views, forks, upvotes, score )
      `)
      .in('id', chunk)
      .eq('visibility', 'public');

    if (spacesErr) throw spacesErr;
    if (chunkSpaces) spaces.push(...chunkSpaces);
  }

  return spaces.map(mapExploreSpace);
}

/**
 * Find spaces similar to the user's own spaces
 */
export async function getRecommendedSpaces(limit = 10): Promise<ExploreSpace[]> {
  if (!isSupabaseConfigured) return [];
  const userId = authManager.getUserId();
  if (!userId) return [];

  // Get the user's space embeddings to find similar public ones
  const { data: userSpaces } = await supabase
    .from('spaces')
    .select('id, title, description, helps_with')
    .eq('owner_id', userId)
    .limit(5);

  if (!userSpaces || userSpaces.length === 0) return getTrendingSpaces(limit);

  // Build a composite query from user's space metadata
  const compositeQuery = userSpaces
    .map(s => `${s.title} ${s.description || ''} ${(s.helps_with || []).join(' ')}`)
    .join('. ');

  try {
    const results = await searchSpacesSemantic(compositeQuery, limit + 5);
    // Filter out user's own spaces
    return results
      .filter(s => s.owner_id !== userId)
      .slice(0, limit);
  } catch {
    // Fallback to trending if semantic search fails
    return getTrendingSpaces(limit);
  }
}

/**
 * Record a view on a space
 */
export async function recordSpaceView(spaceId: string): Promise<void> {
  if (!isSupabaseConfigured) return;
  await supabase.rpc('increment_space_views', { p_space_id: spaceId });
}

/**
 * Get stats for a space
 */
export async function getSpaceStats(spaceId: string) {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase
    .from('space_stats')
    .select('*')
    .eq('space_id', spaceId)
    .maybeSingle();

  if (error) throw error;
  return data;
}

/**
 * Generate and store embedding for a space's metadata
 */
export async function indexSpaceMetadata(spaceId: string, title: string, description: string, tags: string[]): Promise<void> {
  const content = `${title}. ${description || ''}. Tags: ${tags.join(', ')}`;

  const embedding = await generateEmbedding(content);

  const { error } = await supabase
    .from('space_embeddings')
    .upsert({
      space_id: spaceId,
      content,
      embedding: embedding as any,
    }, { onConflict: 'space_id' });

  if (error) throw error;
}

// Helper
function mapExploreSpace(raw: any): ExploreSpace {
  const stats = Array.isArray(raw.space_stats) ? raw.space_stats[0] : raw.space_stats;
  return {
    id: raw.id,
    title: raw.title,
    description: raw.description,
    helps_with: raw.helps_with,
    owner_id: raw.owner_id,
    forked_from: raw.forked_from,
    visibility: raw.visibility,
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    stats: stats ? {
      views: stats.views ?? 0,
      forks: stats.forks ?? 0,
      upvotes: stats.upvotes ?? 0,
      score: stats.score ?? 0,
    } : null,
  };
}
