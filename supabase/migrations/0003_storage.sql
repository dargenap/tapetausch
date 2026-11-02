insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'pick-photos',
  'pick-photos',
  false,
  2097152,
  array['image/jpeg', 'image/webp']
);


create policy "Mitglieder lesen Fotos"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'pick-photos'
    and public.is_member()
  );


  create policy "Mitglieder laden in eigenen Ordner hoch"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'pick-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
    and public.is_member()
  );


create policy "Eigene Fotos löschen"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'pick-photos'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );