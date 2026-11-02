import { supabase } from './supabase';
import type { Comment } from '../types';

export async function fetchComments(pickId: string): Promise<Comment[]> {
  const { data, error } = await supabase
    .from('comments')
    .select('id, user_id, parent_id, text, created_at, author:profiles(username)')
    .eq('pick_id', pickId)
    .order('created_at');

  if (error) throw new Error('Die Kommentare konnten nicht geladen werden.');
  return data as unknown as Comment[];
}

// parentId gesetzt: Antwort auf diesen Kommentar. Sonst ein Kommentar zum Pick.
export async function addComment(pickId: string, text: string, parentId: string | null = null) {
  const { error } = await supabase
    .from('comments')
    .insert({ pick_id: pickId, text: text.trim(), parent_id: parentId });
  if (error) throw new Error('Der Kommentar konnte nicht gespeichert werden.');
}

export async function deleteComment(id: string) {
  const { error } = await supabase.from('comments').delete().eq('id', id);
  if (error) throw new Error('Der Kommentar konnte nicht gelöscht werden.');
}
