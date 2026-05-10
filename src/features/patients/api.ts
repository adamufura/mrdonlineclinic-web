import { api } from '@/lib/api/client';
import { unwrapData, unwrapList } from '@/lib/api/unpack';
import type { ApiEnvelope, ApiMeta } from '@/types/api';

export type PatientAppointmentsQuery = {
  page?: number;
  limit?: number;
  status?: string;
  from?: Date;
  to?: Date;
};

/** GET /api/v1/patients/me — authenticated patient. */
export async function getPatientMe(): Promise<Record<string, unknown>> {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>('/patients/me');
  return unwrapData(data, 'Failed to load patient profile');
}

/** GET /api/v1/patients/me/appointments */
export async function listPatientAppointments(
  query: PatientAppointmentsQuery,
): Promise<{ items: Record<string, unknown>[]; meta: ApiMeta }> {
  const params = Object.fromEntries(
    Object.entries({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      status: query.status,
      from: query.from?.toISOString(),
      to: query.to?.toISOString(),
    }).filter(([, v]) => v !== undefined && v !== ''),
  );
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>('/patients/me/appointments', { params });
  const { items, meta } = unwrapList(data, 'Failed to load appointments');
  if (!meta) {
    throw new Error('Expected pagination meta');
  }
  return { items, meta };
}

/** GET /api/v1/patients/me/prescriptions */
export async function listPatientPrescriptions(query: {
  page?: number;
  limit?: number;
}): Promise<{ items: Record<string, unknown>[]; meta: ApiMeta }> {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>('/patients/me/prescriptions', {
    params: { page: query.page ?? 1, limit: query.limit ?? 20 },
  });
  const { items, meta } = unwrapList(data, 'Failed to load prescriptions');
  if (!meta) {
    throw new Error('Expected pagination meta');
  }
  return { items, meta };
}

/** PATCH /api/v1/patients/me — body matches backend `updatePatientProfileSchema`. */
export async function patchPatientProfile(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await api.patch<ApiEnvelope<Record<string, unknown>>>('/patients/me', body);
  return unwrapData(data, 'Failed to update profile');
}

/** PATCH /api/v1/patients/me/medical — body matches backend `updatePatientMedicalSchema`. */
export async function patchPatientMedical(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await api.patch<ApiEnvelope<Record<string, unknown>>>('/patients/me/medical', body);
  return unwrapData(data, 'Failed to update medical info');
}

/** POST /api/v1/patients/me/photo — multipart field name `file` (image only, max 5MB). */
export async function uploadPatientPhoto(file: File): Promise<{ profilePhotoUrl: string }> {
  const form = new FormData();
  form.append('file', file);
  const { data } = await api.post<ApiEnvelope<{ profilePhotoUrl: string }>>('/patients/me/photo', form);
  return unwrapData(data, 'Upload failed');
}
