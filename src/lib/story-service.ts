import { supabase } from './supabase';
import type { Story, Message } from '../types';

export async function loadStoryWithCharacters(
  storyId: string,
  activeCharactersOnly: boolean = false
): Promise<Story> {
  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      characters(
        id,
        name,
        class,
        race,
        description,
        image_url,
        user_id,
        story_id,
        status
      )
    `)
    .eq('id', storyId)
    .single();

  if (error || !data) {
    throw new Error('Failed to load story');
  }

  // Map characters from database format to frontend format
  const characters = (data.characters || [])
    .filter(char => !activeCharactersOnly || char.status === 'active')
    .map(char => ({
      id: char.id,
      name: char.name,
      class: char.class,
      race: char.race,
      description: char.description,
      imageUrl: char.image_url || '',
      userId: char.user_id,
      storyId: char.story_id,
      status: char.status
    }));

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    status: data.status,
    maxAuthors: data.max_authors,
    currentAuthors: data.current_authors,
    createdAt: data.created_at,
    imageUrl: data.image_url || '',
    characterClasses: data.character_classes,
    characterRaces: data.character_races,
    startingScene: data.starting_scene,
    mainQuest: data.main_quest,
    characters
  };
}

export async function getFeaturedStories(limit: number = 3): Promise<Story[]> {
  const { data, error } = await supabase
    .from('stories')
    .select(`
      *,
      characters(
        id,
        name,
        class,
        race,
        description,
        image_url,
        user_id,
        story_id,
        status
      )
    `)
    .eq('status', 'active')
    .order('current_authors', { ascending: false })
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error || !data) {
    console.error('Failed to load featured stories:', error);
    return [];
  }

  return data.map(story => ({
    id: story.id,
    title: story.title,
    description: story.description,
    status: story.status,
    maxAuthors: story.max_authors,
    currentAuthors: story.current_authors,
    createdAt: story.created_at,
    imageUrl: story.image_url || '',
    characterClasses: story.character_classes,
    characterRaces: story.character_races,
    startingScene: story.starting_scene,
    mainQuest: story.main_quest,
    characters: (story.characters || [])
      .filter(char => char.status === 'active')
      .map(char => ({
      ...char,
      imageUrl: char.image_url || '',
      userId: char.user_id,
      storyId: char.story_id,
      status: char.status || 'active'
    }))
  }));
}

export async function loadStoryMessages(storyId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('story_messages')
    .select('*')
    .eq('story_id', storyId)
    .order('created_at', { ascending: true });

  if (error || !data) {
    throw new Error('Failed to load messages');
  }

  return data.map(message => ({
    id: message.id,
    content: message.content,
    type: message.type,
    characterId: message.character_id,
    createdAt: message.created_at,
    storyId: message.story_id
  }));
}

export async function completeStory(storyId: string): Promise<void> {
  const { error } = await supabase
    .rpc('complete_story', {
      story_id: storyId
    });

  if (error) {
    throw new Error('Failed to complete story');
  }
}

export async function sendCharacterMessage(
  storyId: string,
  characterId: string,
  content: string
): Promise<Message> {
  console.log('Sending character message:', { storyId, characterId });

  const { data, error } = await supabase
    .from('story_messages')
    .insert({
      story_id: storyId,
      character_id: characterId,
      content,
      type: 'character'
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to send message');
  }

  console.log('Character message sent:', data.id);
  return data;
}

export async function sendNarratorMessage(
  storyId: string,
  content: string
): Promise<Message> {
  console.log('Sending narrator message:', { storyId });

  const { data, error } = await supabase
    .from('story_messages')
    .insert({
      story_id: storyId,
      content,
      type: 'narrator'
    })
    .select()
    .single();

  if (error || !data) {
    throw new Error('Failed to send narrator message');
  }

  console.log('Narrator message sent:', data.id);
  return data;
}