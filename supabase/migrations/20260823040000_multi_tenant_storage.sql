-- Parte 8: Storage isolado por tenant.
-- Contrato de caminho: <barbearia_id>/<logo|banner|fotos>/<arquivo>.

begin;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'barbearia-media',
  'barbearia-media',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists barbearia_media_public_read on storage.objects;
create policy barbearia_media_public_read
on storage.objects for select
using (
  bucket_id = 'barbearia-media'
  and public.barbearia_publicada(case when (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$' then ((storage.foldername(name))[1])::uuid else null end)
);

drop policy if exists barbearia_media_gestor_insert on storage.objects;
create policy barbearia_media_gestor_insert
on storage.objects for insert to authenticated
with check (
  bucket_id = 'barbearia-media'
  and (storage.foldername(name))[1] is not null
  and (storage.foldername(name))[2] in ('logo', 'banner', 'fotos')
  and public.usuario_e_gestor(case when (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$' then ((storage.foldername(name))[1])::uuid else null end)
);

drop policy if exists barbearia_media_gestor_update on storage.objects;
create policy barbearia_media_gestor_update
on storage.objects for update to authenticated
using (
  bucket_id = 'barbearia-media'
  and public.usuario_e_gestor(case when (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$' then ((storage.foldername(name))[1])::uuid else null end)
)
with check (
  bucket_id = 'barbearia-media'
  and (storage.foldername(name))[2] in ('logo', 'banner', 'fotos')
  and public.usuario_e_gestor(case when (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$' then ((storage.foldername(name))[1])::uuid else null end)
);

drop policy if exists barbearia_media_gestor_delete on storage.objects;
create policy barbearia_media_gestor_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'barbearia-media'
  and public.usuario_e_gestor(case when (storage.foldername(name))[1] ~* '^[0-9a-f-]{36}$' then ((storage.foldername(name))[1])::uuid else null end)
);

commit;
