export interface Story {
  id: string;
  title: string;
  description: string;
  status: 'active' | 'completed';
  maxAuthors: number;
  currentAuthors: number;
  createdAt: string;
  imageUrl: string;
  characterClasses: string[];
  characterRaces: string[];
  startingScene: string;
  mainQuest: string;
  characters: Character[];
  storyMechanics?: string;
  storyContext?: string;
  is_private: boolean;
  created_by?: string;
  cloned_from?: string;
  image_style?: string; // Add image style property
}

export interface Character {
  id: string;
  name: string;
  class: string;
  race: string;
  description: string;
  imageUrl: string;
  userId: string;
  storyId: string;
  status: 'active' | 'archived';
  karmaPoints?: number;
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
  showImages?: boolean;
  enableAudioNarration?: boolean;
}

export interface Message {
  id: string;
  content: string;
  type: 'character' | 'narrator';
  characterId: string | null;
  createdAt: string;
  storyId: string;
  character?: Character;
}
