import { supabase } from './supabase';

export type FeedbackKind = 'bug' | 'feedback' | 'feature';

// Ohne .select() danach, denn Mitglieder dürfen Feedback nur schreiben, nicht lesen.
export async function sendFeedback(kind: FeedbackKind, text: string, page: string | null) {
  const { error } = await supabase.from('feedback').insert({
    kind,
    text: text.trim(),
    page,
    user_agent: navigator.userAgent,
  });
  if (error) throw new Error('Das Feedback konnte nicht gesendet werden.');
}
