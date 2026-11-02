'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { PRODUCT_IMAGE_MAX_BYTES, PRODUCT_IMAGE_TYPES } from '@/lib/images/product-images';
import { type ProductFormInput, productFormSchema } from '@/lib/validations/product';
import { api } from '@/trpc/client';

const GENERIC_ERROR = 'Não foi possível cadastrar o produto. Tente novamente.';
const ACCEPTED_TYPES = Object.keys(PRODUCT_IMAGE_TYPES);
const FORM_FIELDS = ['name', 'externalLink', 'description'] as const;

/** Envia a imagem ao bucket e devolve a URL pública. */
async function uploadProductImage(file: File): Promise<string> {
  const body = new FormData();
  body.append('file', file);

  const response = await fetch('/api/v1/product-images', { method: 'POST', body });
  const payload = (await response.json().catch(() => null)) as {
    data?: { url: string };
    error?: string;
  } | null;

  if (!response.ok || !payload?.data) {
    throw new Error(payload?.error ?? 'Não foi possível enviar a imagem.');
  }

  return payload.data.url;
}

/** Validação prévia no navegador; o servidor confere de novo pelo conteúdo. */
function validateImageFile(file: File): string | null {
  if (!ACCEPTED_TYPES.includes(file.type)) {
    return 'Envie uma imagem JPG, PNG ou WebP.';
  }

  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return 'A imagem deve ter no máximo 5 MB.';
  }

  return null;
}

export function ProductForm() {
  const router = useRouter();
  const utils = api.useUtils();
  const fileInputId = useId();
  const [error, setError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const form = useForm<ProductFormInput>({
    resolver: zodResolver(productFormSchema),
    defaultValues: { name: '', externalLink: '', description: '' },
  });

  // A prévia usa uma URL `blob:` local, liberada ao trocar ou remover o arquivo.
  useEffect(() => {
    if (!file) {
      setPreviewUrl(null);
      return;
    }

    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    return () => URL.revokeObjectURL(url);
  }, [file]);

  const createProduct = api.products.create.useMutation({
    onSuccess: async (product) => {
      await utils.products.list.invalidate();
      router.push(`/products/${product.id}`);
    },
    onError: (mutationError) => {
      const code = mutationError.data?.code;

      if (code === 'CONFLICT') {
        form.setError('externalLink', { message: mutationError.message });
        return;
      }

      if (code === 'UNAUTHORIZED') {
        setError('Sua sessão expirou. Entre novamente para cadastrar o produto.');
        return;
      }

      if (code === 'FORBIDDEN') {
        setError(mutationError.message);
        return;
      }

      if (code === 'BAD_REQUEST') {
        const fieldErrors: Record<string, string[] | undefined> =
          mutationError.data?.zodError?.fieldErrors ?? {};
        let unmatched: string | undefined;

        for (const [field, messages] of Object.entries(fieldErrors)) {
          const message = messages?.find(Boolean);

          if (!message) {
            continue;
          }

          if ((FORM_FIELDS as readonly string[]).includes(field)) {
            form.setError(field as (typeof FORM_FIELDS)[number], { message });
          } else {
            unmatched ??= message;
          }
        }

        setError(unmatched ?? null);
        return;
      }

      setError(GENERIC_ERROR);
    },
  });

  const isSubmitting = isUploading || createProduct.isPending;

  const onSubmit = async (data: ProductFormInput) => {
    setError(null);

    if (fileError) {
      return;
    }

    let imageUrl: string | undefined;

    if (file) {
      setIsUploading(true);

      try {
        imageUrl = await uploadProductImage(file);
      } catch (uploadError) {
        setError(uploadError instanceof Error ? uploadError.message : GENERIC_ERROR);
        return;
      } finally {
        setIsUploading(false);
      }
    }

    createProduct.mutate({ ...data, imageUrl });
  };

  return (
    <section aria-labelledby="product-form-title" className="relative border border-ink bg-paper">
      <div aria-hidden="true" className="h-1.5 bg-accent" />

      <div className="p-6 sm:p-8">
        <header className="mb-6">
          <p className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-ink/55">
            <span aria-hidden="true" className="flex items-end gap-[3px]">
              <span className="w-[3px] bg-accent" style={{ height: 8 }} />
              <span className="w-[3px] bg-accent" style={{ height: 12 }} />
              <span className="w-[3px] bg-accent" style={{ height: 16 }} />
            </span>
            Catálogo
          </p>
          <h1
            id="product-form-title"
            className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl"
          >
            Novo produto
          </h1>
          <p className="mt-1 text-sm text-ink/60">
            O produto aparece no catálogo assim que for cadastrado.
          </p>
        </header>

        {error && (
          <Alert
            className="mb-6 rounded-none border-0 bg-destructive px-4 py-3 text-destructive-foreground"
            aria-live="assertive"
          >
            <AlertTitle>Não foi possível cadastrar</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" noValidate>
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-semibold text-ink">Nome</FormLabel>
                  <FormControl>
                    <Input placeholder="Ex.: Fone Aurora" disabled={isSubmitting} {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="externalLink"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-semibold text-ink">Link da loja</FormLabel>
                  <FormControl>
                    <Input
                      type="url"
                      inputMode="url"
                      placeholder="https://loja.com/produto"
                      disabled={isSubmitting}
                      {...field}
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-ink/55">
                    Usado no botão “Ver na loja”. Cada link só pode ser cadastrado uma vez.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <label htmlFor={fileInputId} className="text-sm font-semibold text-ink">
                Imagem <span className="font-normal text-ink/50">(opcional)</span>
              </label>

              {previewUrl ? (
                <div className="flex items-start gap-4">
                  <div className="w-40 shrink-0 border border-ink/20 bg-ink/5">
                    {/* biome-ignore lint/performance/noImgElement: prévia de arquivo local (URL blob:), que o next/image não otimiza */}
                    <img src={previewUrl} alt="Prévia da imagem" className="block h-auto w-full" />
                  </div>
                  <div className="space-y-2 text-sm">
                    <p className="break-all text-ink/70">{file?.name}</p>
                    <button
                      type="button"
                      onClick={() => {
                        setFile(null);
                        setFileError(null);
                      }}
                      disabled={isSubmitting}
                      className="font-semibold text-brand underline underline-offset-4 hover:text-brand-deep disabled:opacity-50"
                    >
                      Remover imagem
                    </button>
                  </div>
                </div>
              ) : null}

              <input
                id={fileInputId}
                type="file"
                accept={ACCEPTED_TYPES.join(',')}
                disabled={isSubmitting}
                onChange={(event) => {
                  const selected = event.target.files?.[0] ?? null;
                  event.target.value = '';
                  setError(null);

                  if (!selected) {
                    return;
                  }

                  const validationError = validateImageFile(selected);
                  setFileError(validationError);
                  setFile(validationError ? null : selected);
                }}
                className="block w-full text-sm text-ink/70 file:mr-4 file:cursor-pointer file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-semibold file:text-paper hover:file:bg-brand disabled:opacity-50"
              />
              <p className="text-xs text-ink/55">JPG, PNG ou WebP, até 5 MB.</p>
              {fileError && <p className="text-sm font-medium text-destructive">{fileError}</p>}
            </div>

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel className="text-sm font-semibold text-ink">
                    Descrição <span className="font-normal text-ink/50">(opcional)</span>
                  </FormLabel>
                  <FormControl>
                    <textarea
                      {...field}
                      rows={8}
                      disabled={isSubmitting}
                      placeholder={'Marca: Aurora\nBateria: 30 horas'}
                      className="w-full border border-ink/20 bg-paper px-4 py-3 text-sm text-ink placeholder:text-ink/40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper disabled:opacity-50"
                    />
                  </FormControl>
                  <FormDescription className="text-xs text-ink/55">
                    As quebras de linha são mantidas na página do produto.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              size="lg"
              className="rounded-none bg-ink text-base font-semibold text-paper hover:bg-brand hover:border-brand focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper"
              disabled={isSubmitting}
            >
              {isUploading
                ? 'Enviando imagem...'
                : createProduct.isPending
                  ? 'Cadastrando...'
                  : 'Cadastrar produto'}
            </Button>
          </form>
        </Form>
      </div>
    </section>
  );
}
