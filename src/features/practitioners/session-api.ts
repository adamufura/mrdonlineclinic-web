import { api } from '@/lib/api/client';
import { unwrapData, unwrapList } from '@/lib/api/unpack';
import type { ApiEnvelope, ApiMeta } from '@/types/api';

/** GET /api/v1/practitioners/me — authenticated practitioner (full profile doc). */
export async function getPractitionerMe(): Promise<Record<string, unknown>> {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>('/practitioners/me');
  return unwrapData(data, 'Failed to load practitioner profile');
}

export type PractitionerAppointmentsQuery = {
  page?: number;
  limit?: number;
  status?: string;
  from?: Date;
  to?: Date;
};

/** GET /api/v1/practitioners/me/appointments */
export async function listPractitionerAppointments(
  query: PractitionerAppointmentsQuery,
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
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>('/practitioners/me/appointments', { params });
  const { items, meta } = unwrapList(data, 'Failed to load appointments');
  if (!meta) {
    throw new Error('Expected pagination meta');
  }
  return { items, meta };
}
