import { PRODUCT_IMAGES_BUCKET } from '@/lib/images/product-images';
import { createSupabaseAdminClient } from '@/lib/supabase/server';
import { createSupabaseAccountRepository } from './repositories/account-repository';
import { createSupabaseFeedbackRepository } from './repositories/feedback-repository';
import { createSupabaseProductRepository } from './repositories/product-repository';
import type { SupabaseAdminClient } from './repositories/supabase-helpers';
import { bcryptPasswordHasher } from './security/password-hasher';
import { createAuthService } from './services/auth-service';
import { createFeedbackService } from './services/feedback-service';
import { createProductImageService } from './services/product-image-service';
import { createProductService } from './services/product-service';
import { createSupabaseImageStorage } from './storage/image-storage';

/**
 * Raiz de composição: o único lugar que liga serviços às implementações
 * concretas (Supabase, Supabase Storage, bcrypt). Rotas e routers recebem os
 * serviços prontos; testes montam os serviços com repositórios em memória.
 */
export function createServices(supabase: SupabaseAdminClient = createSupabaseAdminClient()) {
  const accounts = createSupabaseAccountRepository(supabase);
  const products = createSupabaseProductRepository(supabase);
  const feedbacks = createSupabaseFeedbackRepository(supabase);

  return {
    auth: createAuthService({ accounts, hasher: bcryptPasswordHasher }),
    products: createProductService({ products }),
    feedbacks: createFeedbackService({ feedbacks, products, accounts }),
    productImages: createProductImageService({
      storage: createSupabaseImageStorage(supabase, PRODUCT_IMAGES_BUCKET),
    }),
  };
}

export type Services = ReturnType<typeof createServices>;
