import { z } from 'zod';

/**
 * Schema compartilhado entre cliente (react-hook-form) e servidor (tRPC).
 * Mantê-lo em um único lugar evita divergência entre a validação do formulário
 * e a validação do endpoint.
 */
export const signUpSchema = z
  .object({
    firstName: z.string().trim().min(1, 'Nome é obrigatório'),
    lastName: z.string().trim().min(1, 'Sobrenome é obrigatório'),
    email: z.string().trim().email('Email inválido'),
    password: z.string().min(6, 'Senha deve ter pelo menos 6 caracteres'),
    confirmPassword: z.string().min(1, 'Confirmação de senha é obrigatória'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'As senhas não coincidem',
    path: ['confirmPassword'],
  });

export type SignUpInput = z.infer<typeof signUpSchema>;
