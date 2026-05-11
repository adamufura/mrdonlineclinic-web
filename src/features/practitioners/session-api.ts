import { api } from '@/lib/api/client';
import { unwrapData, unwrapList } from '@/lib/api/unpack';
import type { ApiEnvelope, ApiMeta } from '@/types/api';

/** GET /api/v1/practitioners/me — authenticated practitioner (full profile doc). */
export async function getPractitionerMe(): Promise<Record<string, unknown>> {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>('/practitioners/me');
  return unwrapData(data, 'Failed to load practitioner profile');
}

/** PATCH /api/v1/practitioners/me — body matches backend `updatePractitionerProfileSchema`. */
export async function patchPractitionerProfile(body: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data } = await api.patch<ApiEnvelope<Record<string, unknown>>>('/practitioners/me', body);
  return unwrapData(data, 'Failed to update profile');
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

export type PractitionerSlotsQuery = {
  page?: number;
  limit?: number;
  from?: Date;
  to?: Date;
  status?: string;
};

/** GET /api/v1/practitioners/me/slots — paginated; supports `from` / `to` / `status`. */
export async function listPractitionerSlots(
  query: PractitionerSlotsQuery,
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
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>('/practitioners/me/slots', { params });
  const { items, meta } = unwrapList(data, 'Failed to load slots');
  if (!meta) {
    throw new Error('Expected pagination meta');
  }
  return { items, meta };
}

/** POST /api/v1/practitioners/me/slots — one-off open slot. */
export async function createPractitionerSlot(body: { startTime: Date; endTime: Date }): Promise<Record<string, unknown>> {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/practitioners/me/slots', {
    startTime: body.startTime.toISOString(),
    endTime: body.endTime.toISOString(),
  });
  return unwrapData(data, 'Failed to create slot');
}

/** DELETE /api/v1/practitioners/me/slots/:slotId — only when status is OPEN. */
export async function deletePractitionerSlot(slotId: string): Promise<void> {
  const { data } = await api.delete<ApiEnvelope<Record<string, unknown>>>(`/practitioners/me/slots/${slotId}`);
  unwrapData(data, 'Failed to remove slot');
}
