import { RepositoryError } from '../errors';
import type { SupabaseAdminClient } from '../repositories/supabase-helpers';

export type ImageStorage = {
  /** Grava o arquivo em `path` e devolve a URL pública. */
  upload(path: string, bytes: Uint8Array, contentType: string): Promise<string>;
};

export function createSupabaseImageStorage(
  supabase: SupabaseAdminClient,
  bucket: string,
): ImageStorage {
  return {
    async upload(path, bytes, contentType) {
      const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
        contentType,
        cacheControl: '31536000',
        upsert: false,
      });

      if (error) {
        throw new RepositoryError('enviar imagem', { cause: error });
      }

      return supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
    },
  };
}
