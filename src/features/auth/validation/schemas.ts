import { z } from 'zod';

export const loginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email richiesta')
    .email('Email non valida')
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'Password deve essere di almeno 6 caratteri'),
});

export const registerSchema = z.object({
  email: z
    .string()
    .min(1, 'Email richiesta')
    .email('Email non valida')
    .toLowerCase(),
  password: z
    .string()
    .min(6, 'Password deve essere di almeno 6 caratteri')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password deve contenere almeno una maiuscola, una minuscola e un numero'
    ),
  confirmPassword: z.string(),
  displayName: z
    .string()
    .min(2, 'Nome deve essere di almeno 2 caratteri')
    .max(50, 'Nome troppo lungo')
    .trim(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non coincidono',
  path: ['confirmPassword'],
});

export const forgotPasswordSchema = z.object({
  email: z
    .string()
    .min(1, 'Email richiesta')
    .email('Email non valida')
    .toLowerCase(),
});

export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(6, 'Password deve essere di almeno 6 caratteri')
    .regex(
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
      'Password deve contenere almeno una maiuscola, una minuscola e un numero'
    ),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Le password non coincidono',
  path: ['confirmPassword'],
});

export type LoginFormData = z.infer<typeof loginSchema>;
export type RegisterFormData = z.infer<typeof registerSchema>;
export type ForgotPasswordFormData = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;