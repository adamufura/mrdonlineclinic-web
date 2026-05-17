import { z } from 'zod';

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === 'object' && v !== null;
}

/** Personal fields for PATCH /practitioners/me (matches backend identity rules). */
export const practitionerPersonalProfileSchema = z.object({
  firstName: z.string().min(1).max(100),
  middleName: z.string().min(1, 'Middle name is required').max(100),
  lastName: z.string().min(1).max(100),
  phoneNumber: z.string().min(5).max(30),
});

export type PractitionerPersonalProfileValues = z.infer<typeof practitionerPersonalProfileSchema>;

export const practitionerProfessionalProfileSchema = z.object({
  bio: z.string().max(5000),
  yearsOfExperience: z.number().min(0).max(80),
  practiceCity: z.string().max(120),
  practiceState: z.string().max(120),
  practiceCountry: z.string().max(120),
  consultationLanguages: z.string().max(500),
  specialtyIds: z.array(z.string().regex(/^[a-fA-F0-9]{24}$/)),
});

export type PractitionerProfessionalProfileValues = z.infer<typeof practitionerProfessionalProfileSchema>;

export const practitionerCredentialsSchema = z.object({
  licenseNumber: z.string().min(2, 'License number is required').max(80),
});

export type PractitionerCredentialsValues = z.infer<typeof practitionerCredentialsSchema>;

export function practitionerDocToPersonalForm(p: Record<string, unknown>): PractitionerPersonalProfileValues {
  return {
    firstName: String(p.firstName ?? ''),
    middleName: p.middleName != null ? String(p.middleName) : '',
    lastName: String(p.lastName ?? ''),
    phoneNumber: String(p.phoneNumber ?? ''),
  };
}

export function practitionerDocToProfessionalForm(p: Record<string, unknown>): PractitionerProfessionalProfileValues {
  const loc = isRecord(p.practiceLocation) ? p.practiceLocation : {};
  const langs = Array.isArray(p.consultationLanguages)
    ? (p.consultationLanguages as unknown[]).map(String).filter(Boolean)
  : [];
  const specialtyIds: string[] = [];
  if (Array.isArray(p.specialties)) {
    for (const s of p.specialties) {
      if (typeof s === 'string' && /^[a-fA-F0-9]{24}$/.test(s)) specialtyIds.push(s);
      else if (isRecord(s)) {
        const id = s._id != null ? String(s._id) : s.id != null ? String(s.id) : '';
        if (/^[a-fA-F0-9]{24}$/.test(id)) specialtyIds.push(id);
      }
    }
  }
  return {
    bio: p.bio != null ? String(p.bio) : '',
    yearsOfExperience: typeof p.yearsOfExperience === 'number' ? p.yearsOfExperience : Number(p.yearsOfExperience) || 0,
    practiceCity: loc.city != null ? String(loc.city) : '',
    practiceState: loc.state != null ? String(loc.state) : '',
    practiceCountry: loc.country != null ? String(loc.country) : 'Nigeria',
    consultationLanguages: langs.join(', '),
    specialtyIds,
  };
}

export function professionalFormToPatch(v: PractitionerProfessionalProfileValues): Record<string, unknown> {
  const languages = v.consultationLanguages
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return {
    bio: v.bio.trim() || undefined,
    yearsOfExperience: v.yearsOfExperience,
    consultationLanguages: languages.length ? languages : undefined,
    specialties: v.specialtyIds.length ? v.specialtyIds : undefined,
    practiceLocation: {
      city: v.practiceCity.trim() || undefined,
      state: v.practiceState.trim() || undefined,
      country: v.practiceCountry.trim() || undefined,
    },
  };
}

export function practitionerDocToCredentialsForm(p: Record<string, unknown>): PractitionerCredentialsValues {
  return {
    licenseNumber: p.licenseNumber != null ? String(p.licenseNumber) : '',
  };
}
