import { supabase } from './supabase';
import type { User } from '../types';

export async function getProfile(userId: string): Promise<User | null> {
  const { data, error } = await supabase
    .from('users')
    .select()
    .eq('id', userId)
    .single();

  if (error || !data) {
    return null;
  }

  return {
    id: data.id,
    username: data.username,
    email: '', // Email is stored in auth.users
    avatarUrl: data.avatar_url || undefined,
    createdAt: data.created_at
  };
}

export async function createProfile(userId: string, username: string): Promise<User> {
  const { data, error } = await supabase
    .from('users')
    .insert({
      id: userId,
      username,
      created_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error('Failed to create user profile');
  }

  return {
    id: data.id,
    username: data.username,
    email: '',
    avatarUrl: data.avatar_url || undefined,
    createdAt: data.created_at
  };
}

export async function updateProfile(
  userId: string,
  updates: { username?: string; avatarUrl?: string }
): Promise<void> {
  const { error } = await supabase
    .from('users')
    .update({
      ...(updates.username && { username: updates.username }),
      ...(updates.avatarUrl && { avatar_url: updates.avatarUrl })
    })
    .eq('id', userId);

  if (error) {
    throw new Error('Failed to update profile');
  }
}