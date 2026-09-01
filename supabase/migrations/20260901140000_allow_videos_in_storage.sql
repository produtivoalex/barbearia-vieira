-- Libera o envio de vídeos (MP4, MOV, WEBM, M4V, etc.) e fotos no Storage barbearia-media
-- e aumenta o limite de tamanho para 50MB por arquivo.

begin;

update storage.buckets
set allowed_mime_types = null, -- Permite todos os tipos de imagens e vídeos
    file_size_limit = 52428800 -- 50 MB por vídeo/foto
where id = 'barbearia-media';

commit;
