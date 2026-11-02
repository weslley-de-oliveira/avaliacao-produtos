-- Schema da tabela de contas
-- Conforme requisitos do sign-up (specs/sign-up.md)

CREATE TABLE IF NOT EXISTS accounts (
  id TEXT PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  password TEXT NOT NULL,
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Índice para busca por email
CREATE INDEX IF NOT EXISTS idx_accounts_email ON accounts(email);

-- Função para atualizar updated_at automaticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger para atualizar updated_at (recriado para ser idempotente)
DROP TRIGGER IF EXISTS update_accounts_updated_at ON accounts;
CREATE TRIGGER update_accounts_updated_at
    BEFORE UPDATE ON accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Papel da conta: apenas administradores cadastram produtos
-- Espelha database/migrations/20261103000100_add_accounts_role_and_product_images_bucket.sql
ALTER TABLE accounts ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'user';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'accounts_role_check') THEN
    ALTER TABLE accounts
      ADD CONSTRAINT accounts_role_check CHECK (role IN ('user', 'admin'));
  END IF;
END;
$$;

-- Bucket público das imagens de produtos (escrita só pelo servidor)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'product-images',
  'product-images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE
  SET public = EXCLUDED.public,
      file_size_limit = EXCLUDED.file_size_limit,
      allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Produtos (specs/home.md)
-- Espelha database/migrations/20261029000100_create_products.sql
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  external_link TEXT NOT NULL,
  score BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índice para paginação por cursor (created_at desc, id desc)
CREATE INDEX IF NOT EXISTS idx_products_created_at_id
  ON products (created_at DESC, id DESC);

-- Um produto por link externo
-- Espelha database/migrations/20261102000100_add_products_external_link_unique.sql
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_external_link_key'
  ) THEN
    ALTER TABLE products
      ADD CONSTRAINT products_external_link_key UNIQUE (external_link);
  END IF;
END;
$$;

DROP TRIGGER IF EXISTS update_products_updated_at ON products;
CREATE TRIGGER update_products_updated_at
    BEFORE UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Todo acesso passa pelo servidor com service role; não há policy pública
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Avaliações de produtos (specs/feedback.md)
-- Espelha database/migrations/20261029000200_create_products_feedbacks.sql
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS products_feedbacks (
  id TEXT PRIMARY KEY,
  score INTEGER NOT NULL CHECK (score BETWEEN 1 AND 5),
  comment TEXT NOT NULL CHECK (char_length(comment) BETWEEN 1 AND 1000),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_by TEXT NOT NULL REFERENCES accounts(id) ON DELETE CASCADE,
  product_id TEXT NOT NULL REFERENCES products(id) ON DELETE CASCADE
);

-- Índice para listagem paginada por produto
CREATE INDEX IF NOT EXISTS idx_products_feedbacks_product_created
  ON products_feedbacks (product_id, created_at DESC, id DESC);

ALTER TABLE products_feedbacks ENABLE ROW LEVEL SECURITY;

-- ---------------------------------------------------------------------------
-- Resumo das avaliações gerado por IA (cache por produto)
-- Espelha database/migrations/20261104000100_create_product_review_summaries.sql
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS product_review_summaries (
  product_id TEXT PRIMARY KEY REFERENCES products(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  feedback_count INTEGER NOT NULL CHECK (feedback_count >= 0),
  model TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE product_review_summaries ENABLE ROW LEVEL SECURITY;
