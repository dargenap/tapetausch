import { supabase } from './supabase';
import type { Rating } from '../types';

// Liefert dank RLS vor der eigenen Wertung nur die eigene, danach alle.
export async function fetchRatings(pickId: string): Promise<Rating[]> {
  const { data, error } = await supabase
    .from('ratings')
    .select('user_id, quality, emotion, author:profiles(username)')
    .eq('pick_id', pickId);

  if (error) throw new Error('Die Wertungen konnten nicht geladen werden.');
  return data as unknown as Rating[];
}

export async function submitRating(pickId: string, quality: number, emotion: number) {
  const { error } = await supabase.from('ratings').insert({ pick_id: pickId, quality, emotion });
  if (error) throw new Error('Die Wertung konnte nicht gespeichert werden.');
}
