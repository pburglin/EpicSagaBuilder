import { supabase } from './supabase';

export async function addKarmaPoints(
  characterId: string,
  points: number,
  reason: string,
  createdBy: string
): Promise<void> {
  const { error } = await supabase.rpc('add_karma_points', {
    character_id: characterId,
    points,
    reason,
    created_by: createdBy
  });

  if (error) throw error;
}

export async function calculateStoryKarma(storyId: string): Promise<number> {
  const { data, error } = await supabase.rpc('calculate_story_karma', {
    story_id: storyId
  });

  if (error) throw error;
  return data || 0;
}

export async function calculateUserKarma(userId: string): Promise<number> {
  const { data, error } = await supabase.rpc('calculate_user_karma', {
    user_id: userId
  });

  if (error) throw error;
  return data || 0;
}

export async function voteOnAction(
  targetCharacterId: string,
  voterCharacterId: string,
  isUpvote: boolean
): Promise<void> {
  await addKarmaPoints(
    targetCharacterId,
    isUpvote ? 1 : -1,
    isUpvote ? 'Action upvoted' : 'Action downvoted',
    voterCharacterId
  );
  
  // Deduct karma point from voter
  await addKarmaPoints(
    voterCharacterId,
    -1,
    'Used karma point to vote',
    voterCharacterId
  );
}