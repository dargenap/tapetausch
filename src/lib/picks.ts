import { currentWeekStart } from "./format";
import { deletePhoto } from "./photos";
import { supabase } from "./supabase";
import type { Pick, Track } from "../types";

const PICK_FIELDS = "*, author:profiles!picks_user_id_fkey(username)";

export async function fetchFeed(): Promise<Pick[]> {
  const { data, error } = await supabase
    .from("picks")
    .select(PICK_FIELDS)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw new Error("Der Feed konnte nicht geladen werden.");
  return data as Pick[];
}

export async function fetchPick(id: string): Promise<Pick | null> {
  const { data, error } = await supabase
    .from("picks")
    .select(PICK_FIELDS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error("Der Pick konnte nicht geladen werden.");
  return data as Pick | null;
}

export async function hasPickedThisWeek(userId: string) {
  const { data, error } = await supabase
    .from("picks")
    .select("id")
    .eq("user_id", userId)
    .eq("week_start", currentWeekStart())
    .maybeSingle();

  if (error) throw new Error("Die Picks konnten nicht geladen werden.");
  return data !== null;
}

type NewPick = {
  track: Track;
  note: string;
  photoPath: string | null;
  quality: number;
  emotion: number;
};

// Legt Pick und eigene Wertung zusammen an und gibt die ID des neuen Picks zurück.
export async function createPick({
  track,
  note,
  photoPath,
  quality,
  emotion,
}: NewPick): Promise<string> {
  const { data, error } = await supabase.rpc("create_pick", {
    p_itunes_track_id: track.trackId,
    p_title: track.title,
    p_artist: track.artist,
    p_artwork_url: track.artworkUrl || null,
    p_track_url: track.trackUrl,
    p_note: note.trim() || null,
    p_photo_path: photoPath,
    p_quality: quality,
    p_emotion: emotion,
  });

  if (error?.message.includes("already_picked_this_week")) {
    throw new Error("Du hast diese Woche schon einen Pick gepostet.");
  }
  if (error) throw new Error("Der Pick konnte nicht gespeichert werden.");
  return data as string;
}

export async function deletePick(pick: Pick) {
  const { error } = await supabase.from("picks").delete().eq("id", pick.id);
  if (error) throw new Error("Der Pick konnte nicht gelöscht werden.");
  if (pick.photo_path) await deletePhoto(pick.photo_path);
}
