import { z } from 'zod';

const GENDERS = ['MALE', 'FEMALE', 'OTHER', 'PREFER_NOT_SAY'] as const;
const BLOOD = ['A_POS', 'A_NEG', 'B_POS', 'B_NEG', 'AB_POS', 'AB_NEG', 'O_POS', 'O_NEG', 'UNKNOWN'] as const;

/** Mirrors backend `updatePatientProfileSchema` (selects may send "" for unset). */
export const patientProfileFormSchema = z.object({
  firstName: z.string().min(1).max(100),
  middleName: z.string().min(1, 'Middle name is required').max(100),
  lastName: z.string().min(1).max(100),
  phoneNumber: z.string().min(5).max(30),
  dateOfBirth: z.string().optional(),
  gender: z
    .string()
    .optional()
    .refine((s) => s === undefined || s === '' || (GENDERS as readonly string[]).includes(s), 'Invalid gender'),
  bloodGroup: z
    .string()
    .optional()
    .refine((s) => s === undefined || s === '' || (BLOOD as readonly string[]).includes(s), 'Invalid blood group'),
});

export type PatientProfileFormValues = z.infer<typeof patientProfileFormSchema>;

export function profileFormToPatch(values: PatientProfileFormValues): Record<string, unknown> {
  const patch: Record<string, unknown> = {
    firstName: values.firstName,
    middleName: values.middleName.trim(),
    lastName: values.lastName,
    phoneNumber: values.phoneNumber,
  };
  if (values.gender?.trim()) {
    patch.gender = values.gender.trim();
  }
  if (values.bloodGroup?.trim()) {
    patch.bloodGroup = values.bloodGroup.trim();
  }
  if (values.dateOfBirth && values.dateOfBirth.trim()) {
    patch.dateOfBirth = new Date(values.dateOfBirth).toISOString();
  }
  return patch;
}

function linesToArray(text: string | undefined): string[] {
  if (!text?.trim()) return [];
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter(Boolean);
}

/** Health record section — PATCH /patients/me/medical/health-record */
export const healthRecordFormSchema = z.object({
  allergiesText: z.string().optional(),
  chronicConditionsText: z.string().optional(),
  currentMedicationsText: z.string().optional(),
});

export type HealthRecordFormValues = z.infer<typeof healthRecordFormSchema>;

export function healthRecordFormToPatch(values: HealthRecordFormValues) {
  return {
    allergies: linesToArray(values.allergiesText),
    chronicConditions: linesToArray(values.chronicConditionsText),
    currentMedications: linesToArray(values.currentMedicationsText),
  };
}

/** Emergency section — PATCH /patients/me/medical/emergency */
export const emergencyContactFormSchema = z
  .object({
    emergencyName: z.string().optional(),
    emergencyRelationship: z.string().optional(),
    emergencyPhone: z.string().optional(),
  })
  .refine(
    (v) => {
      const n = v.emergencyName?.trim() ?? '';
      const r = v.emergencyRelationship?.trim() ?? '';
      const p = v.emergencyPhone?.trim() ?? '';
      if (!n && !r && !p) return true;
      return n.length > 0 && r.length > 0 && p.length >= 5;
    },
    { message: 'Enter name, relationship, and phone, or clear all fields to remove.', path: ['emergencyName'] },
  );

export type EmergencyContactFormValues = z.infer<typeof emergencyContactFormSchema>;

export function emergencyFormToPatch(values: EmergencyContactFormValues) {
  const n = values.emergencyName?.trim() ?? '';
  const r = values.emergencyRelationship?.trim() ?? '';
  const p = values.emergencyPhone?.trim() ?? '';
  if (!n && !r && !p) {
    return { emergencyContact: null };
  }
  return {
    emergencyContact: {
      name: n,
      relationship: r,
      phoneNumber: p,
    },
  };
}

/** Address section — PATCH /patients/me/medical/address */
export const addressFormSchema = z.object({
  addressStreet: z.string().optional(),
  addressCity: z.string().optional(),
  addressState: z.string().optional(),
  addressCountry: z.string().optional(),
  addressPostalCode: z.string().optional(),
});

export type AddressFormValues = z.infer<typeof addressFormSchema>;

export function addressFormToPatch(values: AddressFormValues) {
  const addr = {
    street: values.addressStreet?.trim() || undefined,
    city: values.addressCity?.trim() || undefined,
    state: values.addressState?.trim() || undefined,
    country: values.addressCountry?.trim() || undefined,
    postalCode: values.addressPostalCode?.trim() || undefined,
  };
  const hasAddr = Object.values(addr).some(Boolean);
  return { address: hasAddr ? addr : null };
}

/** Combined values for legacy helpers — use section schemas in forms. */
export type PatientMedicalFormValues = HealthRecordFormValues &
  EmergencyContactFormValues &
  AddressFormValues;

export function medicalFormToPatch(values: PatientMedicalFormValues): Record<string, unknown> {
  return {
    ...healthRecordFormToPatch(values),
    ...emergencyFormToPatch(values),
    ...addressFormToPatch(values),
  };
}

export function patientDocToProfileForm(p: Record<string, unknown>): PatientProfileFormValues {
  const g = p.gender;
  const b = p.bloodGroup;
  return {
    firstName: String(p.firstName ?? ''),
    middleName: p.middleName != null ? String(p.middleName) : '',
    lastName: String(p.lastName ?? ''),
    phoneNumber: String(p.phoneNumber ?? ''),
    dateOfBirth: p.dateOfBirth ? new Date(String(p.dateOfBirth)).toISOString().slice(0, 10) : '',
    gender: typeof g === 'string' && (GENDERS as readonly string[]).includes(g) ? g : '',
    bloodGroup: typeof b === 'string' && (BLOOD as readonly string[]).includes(b) ? b : '',
  };
}

function arrayToLines(v: unknown): string {
  return Array.isArray(v) ? (v as string[]).join('\n') : '';
}

export function patientDocToHealthRecordForm(p: Record<string, unknown>): HealthRecordFormValues {
  return {
    allergiesText: arrayToLines(p.allergies),
    chronicConditionsText: arrayToLines(p.chronicConditions),
    currentMedicationsText: arrayToLines(p.currentMedications),
  };
}

export function patientDocToEmergencyForm(p: Record<string, unknown>): EmergencyContactFormValues {
  const ec = p.emergencyContact as Record<string, unknown> | undefined;
  return {
    emergencyName: ec?.name != null ? String(ec.name) : '',
    emergencyRelationship: ec?.relationship != null ? String(ec.relationship) : '',
    emergencyPhone: ec?.phoneNumber != null ? String(ec.phoneNumber) : '',
  };
}

export function patientDocToAddressForm(p: Record<string, unknown>): AddressFormValues {
  const addr = p.address as Record<string, unknown> | undefined;
  return {
    addressStreet: addr?.street != null ? String(addr.street) : '',
    addressCity: addr?.city != null ? String(addr.city) : '',
    addressState: addr?.state != null ? String(addr.state) : '',
    addressCountry: addr?.country != null ? String(addr.country) : '',
    addressPostalCode: addr?.postalCode != null ? String(addr.postalCode) : '',
  };
}

export function patientDocToMedicalForm(p: Record<string, unknown>): PatientMedicalFormValues {
  return {
    ...patientDocToHealthRecordForm(p),
    ...patientDocToEmergencyForm(p),
    ...patientDocToAddressForm(p),
  };
}
