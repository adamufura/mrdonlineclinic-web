import { api } from '@/lib/api/client';
import { unwrapData, unwrapList } from '@/lib/api/unpack';
import type { ApiEnvelope, ApiMeta } from '@/types/api';

export type Medication = {
  drugName: string;
  dosage: string;
  frequency: string;
  duration: string;
  route?: string;
  instructions?: string;
};

export type IssuePrescriptionBody = {
  appointmentId: string;
  diagnosis: string;
  medications: Medication[];
  additionalNotes?: string;
};

/** POST /api/v1/prescriptions — practitioner only; appointment must be COMPLETED. */
export async function issuePrescription(body: IssuePrescriptionBody): Promise<Record<string, unknown>> {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/prescriptions', body);
  return unwrapData(data, 'Failed to issue prescription');
}

/** GET /api/v1/prescriptions/:id — patient, practitioner, or admin. */
export async function getPrescription(id: string): Promise<Record<string, unknown>> {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>(`/prescriptions/${id}`);
  return unwrapData(data, 'Prescription not found');
}

/** GET /api/v1/prescriptions/me/practitioner — practitioner's issued prescriptions. */
export async function listPractitionerPrescriptions(query: {
  page?: number;
  limit?: number;
}): Promise<{ items: Record<string, unknown>[]; meta: ApiMeta }> {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>('/prescriptions/me/practitioner', {
    params: { page: query.page ?? 1, limit: query.limit ?? 20 },
  });
  const { items, meta } = unwrapList(data, 'Failed to load prescriptions');
  if (!meta) throw new Error('Expected pagination meta');
  return { items, meta };
}
