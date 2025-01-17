import { supabase } from './supabase';
import { validateInviteCode, markInviteCodeUsed } from './invite-service';

const INVITE_CODE_MODE = import.meta.env.VITE_INVITE_CODE_MODE || 'none';

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (!error && data.user) {
    // Ensure user profile exists
    const { data: profile } = await supabase
      .from('users')
      .select()
      .eq('id', data.user.id)
      .single();

    if (!profile) {
      // Create profile if it doesn't exist
      await supabase
        .from('users')
        .insert({
          id: data.user.id,
          username: `${email.split('@')[0]}-${Math.floor(100000 + Math.random() * 900000)}`,
          created_at: new Date().toISOString(),
        });
    }
  }

  return { data, error };
}

export async function signUp(email: string, password: string, inviteCode?: string) {
  // Validate invite code based on mode
  if (INVITE_CODE_MODE !== 'none') {
    if (!inviteCode) {
      return {
        data: { user: null, session: null },
        error: new Error('Invite code is required')
      };
    }

    const isValid = await validateInviteCode(inviteCode);
    if (!isValid) {
      return {
        data: { user: null, session: null },
        error: new Error('Invalid invite code')
      };
    }
  }

  const response = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin
    }
  });

  // Create user profile first
  if (!response.error && response.data.user) {
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: response.data.user.id,
        username: `${email.split('@')[0]}-${Math.floor(100000 + Math.random() * 900000)}`,
        created_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Failed to create user profile:', profileError);
      await signOut();
      return {
        data: { user: null, session: null },
        error: new Error('Failed to create user profile')
      };
    }

    // Mark invite code as used after profile creation
    if (INVITE_CODE_MODE === 'single_use' && inviteCode) {
      try {
        await markInviteCodeUsed(inviteCode, response.data.user.id);
      } catch (error) {
        console.error('Failed to mark invite code as used:', error);
        await signOut();
        return {
          data: { user: null, session: null },
          error: new Error('Failed to process invite code')
        };
      }
    }
  }

  return response;
}

export async function signOut() {
  console.log('Signing out');
  return await supabase.auth.signOut();
}

export async function ensureUserProfile(userId: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('users')
    .select()
    .eq('id', userId)
    .single();

  return !error && !!data;
}