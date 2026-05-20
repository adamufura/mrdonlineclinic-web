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

/** POST /api/v1/practitioners/me/photo — multipart field name `file`. */
export async function uploadPractitionerPhoto(file: File): Promise<{ profilePhotoUrl: string }> {
  const form = new FormData();
  form.append('file', file, file.name || 'profile.jpg');
  const { data } = await api.post<ApiEnvelope<{ profilePhotoUrl: string }>>('/practitioners/me/photo', form, {
    transformRequest: [
      (body, headers) => {
        if (headers && typeof headers.delete === 'function') {
          headers.delete('Content-Type');
        }
        return body;
      },
    ],
  });
  return unwrapData(data, 'Upload failed');
}

/** POST /api/v1/practitioners/me/signature — PNG/JPG signature for prescriptions (field `file`). */
export async function uploadPractitionerSignature(file: File): Promise<{ signatureUrl: string }> {
  const form = new FormData();
  form.append('file', file, file.name || 'signature.png');
  const { data } = await api.post<ApiEnvelope<{ signatureUrl: string }>>('/practitioners/me/signature', form, {
    transformRequest: [
      (body, headers) => {
        if (headers && typeof headers.delete === 'function') {
          headers.delete('Content-Type');
        }
        return body;
      },
    ],
  });
  return unwrapData(data, 'Upload failed');
}

/** POST /api/v1/practitioners/me/credentials — license document (PDF or image). */
export async function uploadPractitionerCredentials(file: File): Promise<{
  licenseDocumentUrl: string;
  verificationStatus: string;
}> {
  const form = new FormData();
  form.append('file', file, file.name || 'license.pdf');
  const { data } = await api.post<
    ApiEnvelope<{ licenseDocumentUrl: string; verificationStatus: string }>
  >('/practitioners/me/credentials', form, {
    transformRequest: [
      (body, headers) => {
        if (headers && typeof headers.delete === 'function') {
          headers.delete('Content-Type');
        }
        return body;
      },
    ],
  });
  return unwrapData(data, 'Upload failed');
}

export type PractitionerAppointmentsQuery = {
  page?: number;
  limit?: number;
  status?: string;
  from?: Date;
  to?: Date;
};

/** GET /api/v1/practitioners/me/patients — distinct patients from shared appointments (deduped). */
export async function listPractitionerPatients(): Promise<Record<string, unknown>[]> {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>('/practitioners/me/patients');
  return unwrapData(data, 'Failed to load patients');
}

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
