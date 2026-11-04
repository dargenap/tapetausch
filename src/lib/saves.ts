import { PICK_FIELDS } from "./picks";
import { supabase } from "./supabase";
import type { Pick } from "../types";

export async function savePick(pickId: string): Promise<void> {
  const { error } = await supabase.from("saves").insert({ pick_id: pickId });

  if (error && error.code !== "23505") {
    // 23505 = unique_violation
    throw new Error("Der Pick konnte nicht überspielt werden.");
  }
}

export async function unsavePick(pickId: string): Promise<void> {
  const { error } = await supabase.from("saves").delete().eq("pick_id", pickId);

  if (error) {
    throw new Error("Der Pick konnte nicht entfernt werden.");
  }
}

export async function fetchCollection(userId: string): Promise<Pick[]> {
  const { error, data } = await supabase
    .from("saves")
    .select(`created_at, pick:picks(${PICK_FIELDS})`)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error("Die Sammlung konnte nicht geladen werden.");
  }
  return data.map((row) => row.pick) as unknown as Pick[];
}
