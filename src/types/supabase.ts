export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          avatar_url: string | null
          created_at: string
        }
        Insert: {
          id?: string
          username: string
          avatar_url?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          username?: string
          avatar_url?: string | null
          created_at?: string
        }
      }
      stories: {
        Row: {
          id: string
          title: string
          description: string
          status: string
          max_authors: number
          current_authors: number
          created_at: string
          image_url: string | null
          character_classes: string[]
          character_races: string[]
          starting_scene: string
          main_quest: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          status?: string
          max_authors: number
          current_authors?: number
          created_at?: string
          image_url?: string | null
          character_classes: string[]
          character_races: string[]
          starting_scene: string
          main_quest: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          status?: string
          max_authors?: number
          current_authors?: number
          created_at?: string
          image_url?: string | null
          character_classes?: string[]
          character_races?: string[]
          starting_scene?: string
          main_quest?: string
        }
      }
      characters: {
        Row: {
          id: string
          name: string
          class: string
          race: string
          description: string
          image_url: string | null
          user_id: string
          story_id: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          class: string
          race: string
          description: string
          image_url?: string | null
          user_id: string
          story_id: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          class?: string
          race?: string
          description?: string
          image_url?: string | null
          user_id?: string
          story_id?: string
          created_at?: string
        }
      }
      story_messages: {
        Row: {
          id: string
          story_id: string
          character_id: string | null
          content: string
          type: string
          created_at: string
        }
        Insert: {
          id?: string
          story_id: string
          character_id?: string | null
          content: string
          type: string
          created_at?: string
        }
        Update: {
          id?: string
          story_id?: string
          character_id?: string | null
          content?: string
          type?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}