import { supabase } from './supabase';

export const BUCKET_MIDIA_TENANT = 'barbearia-media';

/**
 * Extrai o caminho relativo de um arquivo dentro de um bucket do Supabase a partir de sua URL pública.
 * Exemplo:
 * URL: https://xyz.supabase.co/storage/v1/object/public/barbearia-media/uuid/logo/123.jpg
 * Retorno: uuid/logo/123.jpg
 */
export function extrairCaminhoStorage(urlOuCaminho: string | null | undefined, bucket: string = BUCKET_MIDIA_TENANT): string | null {
  if (!urlOuCaminho || typeof urlOuCaminho !== 'string') return null;

  const urlLimpa = urlOuCaminho.trim();
  if (!urlLimpa.startsWith('http://') && !urlLimpa.startsWith('https://')) {
    return urlLimpa;
  }

  const divisor = `/${bucket}/`;
  const indice = urlLimpa.indexOf(divisor);
  if (indice === -1) return null;

  const caminhoComQuery = urlLimpa.slice(indice + divisor.length);
  const caminhoSemQuery = caminhoComQuery.split('?')[0];
  return decodeURIComponent(caminhoSemQuery);
}

/**
 * Remove com segurança um ou mais arquivos do bucket de mídia do Supabase.
 */
export async function removerMidiaStorage(
  urlsOuCaminhos: (string | null | undefined)[] | string | null | undefined,
  bucket: string = BUCKET_MIDIA_TENANT
): Promise<{ removidos: string[]; erro: any }> {
  const lista = Array.isArray(urlsOuCaminhos) ? urlsOuCaminhos : [urlsOuCaminhos];
  const caminhosValidos = lista
    .map((item) => extrairCaminhoStorage(item, bucket))
    .filter((caminho): caminho is string => Boolean(caminho && caminho.length > 0));

  if (!caminhosValidos.length) {
    return { removidos: [], erro: null };
  }

  try {
    const { data, error } = await supabase.storage.from(bucket).remove(caminhosValidos);
    if (error) {
      console.warn('[Storage] Falha ao remover mídias:', { caminhosValidos, erro: error.message });
      return { removidos: [], erro: error };
    }
    return { removidos: (data ?? []).map((d) => d.name), erro: null };
  } catch (err: any) {
    console.warn('[Storage] Exceção ao remover mídias:', err);
    return { removidos: [], erro: err };
  }
}

/**
 * Faz upload de imagem para o bucket do tenant com caminho estritamente no padrão:
 * <barbearia_id>/<logo|banner|fotos>/<timestamp>-<indice>.<extensao>
 */
export async function uploadImagemTenant(
  barbeariaId: string,
  tipo: 'logo' | 'banner' | 'fotos',
  assetUri: string,
  mimeType?: string,
  indice = 0
): Promise<{ publicUrl: string; caminho: string }> {
  if (!barbeariaId) {
    throw new Error('ID da barbearia é obrigatório para upload.');
  }

  const resposta = await fetch(assetUri);
  if (!resposta.ok) {
    throw new Error(`Não foi possível ler o arquivo selecionado (status ${resposta.status}).`);
  }

  const arquivo = await resposta.arrayBuffer();
  const extensaoMime = mimeType?.split('/')[1]?.toLowerCase();
  const extensao = extensaoMime === 'jpeg' ? 'jpg' : extensaoMime || 'jpg';
  const caminho = `${barbeariaId}/${tipo}/${Date.now()}-${indice}.${extensao}`;

  const contentTypeFinal = mimeType || (extensao === 'png' ? 'image/png' : extensao === 'webp' ? 'image/webp' : 'image/jpeg');

  const { error: erroUpload } = await supabase.storage
    .from(BUCKET_MIDIA_TENANT)
    .upload(caminho, arquivo, {
      contentType: contentTypeFinal,
      cacheControl: '3600',
      upsert: false,
    });

  if (erroUpload) {
    throw new Error(`Storage: ${erroUpload.message || 'Falha no upload do arquivo.'}`);
  }

  const { data: dataUrl } = supabase.storage.from(BUCKET_MIDIA_TENANT).getPublicUrl(caminho);
  return {
    publicUrl: dataUrl.publicUrl,
    caminho,
  };
}
