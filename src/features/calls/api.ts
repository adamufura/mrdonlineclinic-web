import { api } from '@/lib/api/client';
import { unwrapData } from '@/lib/api/unpack';
import type { ApiEnvelope } from '@/types/api';

export type CallTokenResponse = {
  token: string;
  channelName: string;
  uid: number;
  appId: string;
  callType: 'audio' | 'video';
};

export type CallEndPayload = {
  appointmentId: string;
  outcome?: 'completed' | 'rejected' | 'missed' | 'cancelled';
  durationSeconds?: number;
  callType?: 'audio' | 'video';
};

export async function getCallToken(appointmentId: string, callType: 'audio' | 'video'): Promise<CallTokenResponse> {
  const { data } = await api.post<ApiEnvelope<CallTokenResponse>>('/calls/token', { appointmentId, callType });
  return unwrapData(data, 'Failed to get call token');
}

export async function startCall(appointmentId: string, callType: 'audio' | 'video'): Promise<void> {
  await api.post('/calls/start', { appointmentId, callType });
}

export async function acceptCallApi(appointmentId: string): Promise<void> {
  await api.post('/calls/accept', { appointmentId });
}

export async function endCallApi(payload: CallEndPayload): Promise<void> {
  await api.post('/calls/end', payload);
}

export async function rejectCallApi(appointmentId: string, callType?: 'audio' | 'video'): Promise<void> {
  await api.post('/calls/reject', { appointmentId, callType });
}
