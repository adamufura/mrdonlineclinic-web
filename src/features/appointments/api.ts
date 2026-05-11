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

/** POST /api/v1/appointments/:id/confirm — practitioner accepts a pending request. */
export async function practitionerConfirmAppointment(appointmentId: string): Promise<Record<string, unknown>> {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/appointments/${appointmentId}/confirm`, {});
  return unwrapData(data, 'Could not confirm appointment');
}

/** POST /api/v1/appointments/:id/reject — practitioner declines a pending request. */
export async function practitionerRejectAppointment(appointmentId: string): Promise<Record<string, unknown>> {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/appointments/${appointmentId}/reject`, {});
  return unwrapData(data, 'Could not reject appointment');
}

/** GET /api/v1/appointments/:id — patient or practitioner on that appointment. */
export async function getAppointment(appointmentId: string): Promise<Record<string, unknown>> {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>(`/appointments/${appointmentId}`);
  return unwrapData(data, 'Appointment not found');
}

/** POST /api/v1/appointments/:id/start — practitioner marks visit in progress. */
export async function practitionerStartAppointment(appointmentId: string): Promise<Record<string, unknown>> {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/appointments/${appointmentId}/start`, {});
  return unwrapData(data, 'Could not start visit');
}

/** POST /api/v1/appointments/:id/complete — practitioner completes visit. */
export async function practitionerCompleteAppointment(appointmentId: string): Promise<Record<string, unknown>> {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/appointments/${appointmentId}/complete`, {});
  return unwrapData(data, 'Could not complete visit');
}

/** POST /api/v1/appointments/:id/no-show — practitioner marks no-show (from confirmed). */
export async function practitionerNoShowAppointment(appointmentId: string): Promise<Record<string, unknown>> {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/appointments/${appointmentId}/no-show`, {});
  return unwrapData(data, 'Could not update status');
}

/** POST /api/v1/appointments/:id/cancel — patient or practitioner with reason. */
export async function cancelAppointment(
  appointmentId: string,
  cancellationReason: string,
): Promise<Record<string, unknown>> {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/appointments/${appointmentId}/cancel`, {
    cancellationReason,
  });
  return unwrapData(data, 'Could not cancel appointment');
}

/** @deprecated Use cancelAppointment — same endpoint for both roles. */
export const practitionerCancelAppointment = cancelAppointment;

/** PATCH /api/v1/appointments/:id/practitioner-notes */
export async function practitionerPatchAppointmentNotes(
  appointmentId: string,
  practitionerNotes: string,
): Promise<Record<string, unknown>> {
  const { data } = await api.patch<ApiEnvelope<Record<string, unknown>>>(
    `/appointments/${appointmentId}/practitioner-notes`,
    { practitionerNotes },
  );
  return unwrapData(data, 'Could not save notes');
}
