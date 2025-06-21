import { z } from 'zod';

export const createLeagueSchema = z.object({
  name: z
    .string()
    .min(3, 'League name must be at least 3 characters')
    .max(100, 'League name must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'League name can only contain letters, numbers, spaces, hyphens, and underscores')
    .trim(),
});

export const joinLeagueSchema = z.object({
  inviteCode: z
    .string()
    .length(6, 'Invite code must be exactly 6 characters')
    .regex(/^[A-Z0-9]+$/, 'Invite code can only contain uppercase letters and numbers')
    .transform(val => val.toUpperCase()),
});

export const leagueSettingsSchema = z.object({
  name: z
    .string()
    .min(3, 'League name must be at least 3 characters')
    .max(100, 'League name must not exceed 100 characters')
    .regex(/^[a-zA-Z0-9\s\-_]+$/, 'League name can only contain letters, numbers, spaces, hyphens, and underscores')
    .trim(),
  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional(),
});

export const memberRoleSchema = z.object({
  role: z.enum(['admin', 'member'], {
    errorMap: () => ({ message: 'Role must be either admin or member' }),
  }),
});

export type CreateLeagueFormData = z.infer<typeof createLeagueSchema>;
export type JoinLeagueFormData = z.infer<typeof joinLeagueSchema>;
export type LeagueSettingsFormData = z.infer<typeof leagueSettingsSchema>;
export type MemberRoleFormData = z.infer<typeof memberRoleSchema>;