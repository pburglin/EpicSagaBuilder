import { supabase } from './supabase';

export async function validateInviteCode(code: string): Promise<boolean> {
  const { data, error } = await supabase
    .from('user_invites')
    .select('id')
    .eq('code', code)
    .is('used_by', null)
    .single();

  return !!data && !error;
}

export async function markInviteCodeUsed(code: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('user_invites')
    .update({ used_by: userId, used_at: new Date().toISOString() })
    .eq('code', code);

  console.log('code: ', code);
  console.log('userId: ', userId);
  if (error) throw error;
}
