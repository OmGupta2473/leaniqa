import { supabase } from '@/shared/utils/supabase';
import { getKolkataDateString } from '@/shared/utils/timezone';
import type { ChatMessage } from '@/app/store/chatStore';

export async function fetchTodayMessages(userId: string): Promise<ChatMessage[]> {
  const today = getKolkataDateString();
  const { data, error } = await supabase
    .from('chat_messages')
    .select('role, text, data, created_at')
    .eq('user_id', userId)
    .eq('date', today)
    .order('created_at', { ascending: true });

  if (error) throw error;

  return (data ?? []).map((row) => ({
    role: row.role as 'user' | 'ai',
    text: row.text,
    data: row.data ?? undefined,
    weekKey: today,
    timestamp: new Date(row.created_at).getTime(),
  }));
}

export async function saveMessage(
  userId: string,
  message: Pick<ChatMessage, 'role' | 'text' | 'data'>,
): Promise<void> {
  const today = getKolkataDateString();
  const { error } = await supabase.from('chat_messages').insert({
    user_id: userId,
    date: today,
    role: message.role,
    text: message.text,
    data: message.data ?? null,
  });

  if (error) throw error;
}