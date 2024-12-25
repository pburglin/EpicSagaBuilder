import { supabase } from './supabase';

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
          username: email.split('@')[0],
          created_at: new Date().toISOString(),
        });
    }
  }

  return { data, error };
}

export async function signUp(email: string, password: string) {
  const response = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: window.location.origin
    }
  });

  if (!response.error && response.data.user) {
    // Create user profile
    const { error: profileError } = await supabase
      .from('users')
      .insert({
        id: response.data.user.id,
        username: email.split('@')[0],
        created_at: new Date().toISOString(),
      });

    if (profileError) {
      console.error('Failed to create user profile:', profileError);
      // Sign out the user if profile creation fails
      await signOut();
      return { 
        data: { user: null, session: null }, 
        error: new Error('Failed to create user profile') 
      };
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