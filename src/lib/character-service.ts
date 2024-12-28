import { supabase } from './supabase';
import { ensureUserProfile } from './auth';
import type { Character } from '../types';

export async function createCharacter(data: {
  name: string;
  class: string;
  race: string;
  description: string;
  imageUrl?: string;
  userId: string;
  storyId: string;
  karmaPoints: number;
}): Promise<Character> {
  // First increment the current_authors count
  const { error: updateError } = await supabase
    .rpc('increment_story_authors', {
      story_id: data.storyId
    });

  if (updateError) {
    throw new Error('Failed to join story');
  }

  // Then create the character
  const { data: character, error: characterError } = await supabase
    .from('characters')
    .insert({
      name: data.name,
      class: data.class,
      race: data.race,
      description: data.description,
      image_url: data.imageUrl,
      user_id: data.userId,
      story_id: data.storyId,
      karma_points: 0
    })
    .select()
    .single();

  if (characterError || !character) {
    throw new Error('Failed to create character');
  }

  return {
    id: character.id,
    name: character.name,
    class: character.class,
    race: character.race,
    description: character.description,
    imageUrl: character.image_url || '',
    userId: character.user_id,
    storyId: character.story_id,
    karmaPoints: character.karma_points,
    status: character.status || 'active'
  };
}

export async function archiveCharacter(characterId: string, storyId: string): Promise<void> {
  // First decrement the current_authors count
  const { error: updateError } = await supabase
    .rpc('decrement_story_authors', {
      story_id: storyId
    });

  if (updateError) {
    throw new Error('Failed to update story authors count');
  }

  // Archive the character
  const { error: archiveError } = await supabase
    .rpc('archive_character', {
      character_id: characterId
    });

  if (archiveError) {
    throw new Error('Failed to archive character');
  }
}

export async function getUserCharacterInStory(userId: string, storyId: string): Promise<Character | null> {
  const { data, error } = await supabase
    .from('characters')
    .select()
    .eq('status', 'active')
    .eq('user_id', userId)
    .eq('story_id', storyId)
    .maybeSingle();

  if (error || !data) {
    console.log('No active character found:', { error, data });
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    class: data.class,
    race: data.race,
    description: data.description,
    imageUrl: data.image_url || '',
    userId: data.user_id,
    storyId: data.story_id,
    karmaPoints: data.karma_points,
    status: data.status || 'active'
  };
}

export async function getCharacterInStory(characterId: string, storyId: string): Promise<Character | null> {
  const { data, error } = await supabase
    .from('characters')
    .select()
    .eq('character_id', characterId)
    .eq('story_id', storyId)
    .maybeSingle();

  if (error || !data) {
    console.log('No character found:', { error, data });
    return null;
  }

  return {
    id: data.id,
    name: data.name,
    class: data.class,
    race: data.race,
    description: data.description,
    imageUrl: data.image_url || '',
    userId: data.user_id,
    storyId: data.story_id,
    status: data.status || 'active'
  };
}