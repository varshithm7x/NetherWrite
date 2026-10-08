import { supabase } from './supabase';
import { authManager } from './auth';

export type VoteValue = 1 | -1;

/**
 * Vote on a space. Uses the DB function which handles upsert + score recalculation.
 */
export async function voteOnSpace(spaceId: string, value: VoteValue): Promise<void> {
  authManager.requireAuth();

  const { error } = await supabase.rpc('vote_on_space', {
    p_space_id: spaceId,
    p_value: value,
  });

  if (error) throw error;
}

/**
 * Remove vote by setting to 0 (delete the row)
 */
export async function removeVote(spaceId: string): Promise<void> {
  const user = authManager.requireAuth();

  const { error } = await supabase
    .from('space_votes')
    .delete()
    .eq('user_id', user.id)
    .eq('space_id', spaceId);

  if (error) throw error;
}

/**
 * Get the current user's vote on a space
 */
export async function getUserVote(spaceId: string): Promise<VoteValue | null> {
  const userId = authManager.getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('space_votes')
    .select('value')
    .eq('user_id', userId)
    .eq('space_id', spaceId)
    .maybeSingle();

  if (error) throw error;
  return data?.value as VoteValue | null;
}

/**
 * Get vote counts for a space
 */
export async function getVoteCounts(spaceId: string): Promise<{ upvotes: number; downvotes: number }> {
  const { data, error } = await supabase
    .from('space_votes')
    .select('value')
    .eq('space_id', spaceId);

  if (error) throw error;

  const votes = data || [];
  return {
    upvotes: votes.filter(v => v.value === 1).length,
    downvotes: votes.filter(v => v.value === -1).length,
  };
}
