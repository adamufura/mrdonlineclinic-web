import { api } from '@/lib/api/client';
import { unwrapData } from '@/lib/api/unpack';
import type { ApiEnvelope } from '@/types/api';

export type BookAppointmentBody = {
  slotId: string;
  reasonForVisit: string;
  symptoms?: string[];
};

/** POST /api/v1/appointments — patient only; creates PENDING appointment from an OPEN slot. */
export async function bookAppointment(body: BookAppointmentBody): Promise<Record<string, unknown>> {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>('/appointments', body);
  return unwrapData(data, 'Could not complete booking');
}
