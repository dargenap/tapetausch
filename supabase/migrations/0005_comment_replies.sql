-- Antworten auf Kommentare. parent_id zeigt auf den Kommentar, auf den geantwortet wird.
-- Ohne parent_id ist es ein normaler Kommentar zum Pick.

alter table public.comments
  add constraint comments_id_pick_key unique (id, pick_id);

alter table public.comments
  add column parent_id uuid;

-- Über pick_id mitverknüpft: Eine Antwort gehört immer zum selben Pick wie ihr Kommentar.
-- Wird ein Kommentar gelöscht, verschwinden auch die Antworten darauf.
alter table public.comments
  add constraint comments_parent_fkey
  foreign key (parent_id, pick_id) references public.comments (id, pick_id) on delete cascade;

create index comments_parent_idx on public.comments (parent_id);
