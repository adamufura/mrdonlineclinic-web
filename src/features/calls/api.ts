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

export async function getCallToken(appointmentId: string, callType: 'audio' | 'video'): Promise<CallTokenResponse> {
  const { data } = await api.post<ApiEnvelope<CallTokenResponse>>('/calls/token', { appointmentId, callType });
  return unwrapData(data, 'Failed to get call token');
}

export async function startCall(appointmentId: string, callType: 'audio' | 'video'): Promise<void> {
  await api.post('/calls/start', { appointmentId, callType });
}

export async function endCallApi(appointmentId: string): Promise<void> {
  await api.post('/calls/end', { appointmentId });
}

export async function rejectCallApi(appointmentId: string): Promise<void> {
  await api.post('/calls/reject', { appointmentId });
}
