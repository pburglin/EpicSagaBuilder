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
}

export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string;
  createdAt: string;
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