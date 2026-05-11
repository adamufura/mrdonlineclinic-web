import { api } from '@/lib/api/client';
import { unwrapData, unwrapList } from '@/lib/api/unpack';
import type { ApiEnvelope, ApiMeta } from '@/types/api';

export async function listChatRooms(query: { page?: number; limit?: number }): Promise<{
  items: Record<string, unknown>[];
  meta: ApiMeta;
}> {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>(`/chat/rooms`, {
    params: { page: query.page ?? 1, limit: query.limit ?? 40 },
  });
  const { items, meta } = unwrapList(data, 'Failed to load conversations');
  if (!meta) throw new Error('Expected pagination meta');
  return { items, meta };
}

export async function getChatRoom(roomId: string): Promise<Record<string, unknown>> {
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>>>(`/chat/rooms/${roomId}`);
  return unwrapData(data, 'Chat room not found');
}

export async function markChatRoomReadAll(roomId: string): Promise<{ marked: number }> {
  const { data } = await api.post<ApiEnvelope<{ marked: number }>>(`/chat/rooms/${roomId}/read-all`, {});
  return unwrapData(data, 'Failed to mark read');
}

export async function listChatMessages(
  roomId: string,
  query: { page?: number; limit?: number; before?: string },
): Promise<{ items: Record<string, unknown>[]; meta: ApiMeta }> {
  const params = Object.fromEntries(
    Object.entries({
      page: query.page ?? 1,
      limit: query.limit ?? 50,
      before: query.before,
    }).filter(([, v]) => v !== undefined && v !== ''),
  );
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>(`/chat/rooms/${roomId}/messages`, {
    params,
  });
  const { items, meta } = unwrapList(data, 'Failed to load messages');
  if (!meta) throw new Error('Expected pagination meta');
  return { items, meta };
}

export async function postChatMessage(roomId: string, content: string): Promise<Record<string, unknown>> {
  const { data } = await api.post<ApiEnvelope<Record<string, unknown>>>(`/chat/rooms/${roomId}/messages`, {
    content,
    messageType: 'TEXT',
  });
  return unwrapData(data, 'Failed to send message');
}
