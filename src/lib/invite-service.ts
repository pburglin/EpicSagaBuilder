import { supabase } from './supabase';

const INVITE_CODE_MODE = import.meta.env.VITE_INVITE_CODE_MODE || 'none';

export async function validateInviteCode(code: string): Promise<boolean> {
  let query = supabase
    .from('user_invites')
    .select('id')
    .eq('code', code);

  // Only check for unused codes in single_use mode
  if (INVITE_CODE_MODE === 'single_use') {
    query = query.is('used_by', null);
  }

  const { data, error } = await query.single();

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
