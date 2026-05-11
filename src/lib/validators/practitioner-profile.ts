import { z } from 'zod';

/** Personal fields for PATCH /practitioners/me (matches backend identity rules). */
export const practitionerPersonalProfileSchema = z.object({
  firstName: z.string().min(1).max(100),
  middleName: z.string().min(1, 'Middle name is required').max(100),
  lastName: z.string().min(1).max(100),
  phoneNumber: z.string().min(5).max(30),
});

export type PractitionerPersonalProfileValues = z.infer<typeof practitionerPersonalProfileSchema>;

export function practitionerDocToPersonalForm(p: Record<string, unknown>): PractitionerPersonalProfileValues {
  return {
    firstName: String(p.firstName ?? ''),
    middleName: p.middleName != null ? String(p.middleName) : '',
    lastName: String(p.lastName ?? ''),
    phoneNumber: String(p.phoneNumber ?? ''),
  };
}
