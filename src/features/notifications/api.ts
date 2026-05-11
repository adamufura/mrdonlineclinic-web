import { api } from '@/lib/api/client';
import { unwrapList } from '@/lib/api/unpack';
import type { ApiEnvelope, ApiMeta } from '@/types/api';

export type ListNotificationsQuery = {
  page?: number;
  limit?: number;
  unreadOnly?: boolean;
};

/** GET /api/v1/notifications */
export async function listNotifications(
  query: ListNotificationsQuery,
): Promise<{ items: Record<string, unknown>[]; meta: ApiMeta }> {
  const params = Object.fromEntries(
    Object.entries({
      page: query.page ?? 1,
      limit: query.limit ?? 20,
      unreadOnly: query.unreadOnly,
    }).filter(([, v]) => v !== undefined),
  );
  const { data } = await api.get<ApiEnvelope<Record<string, unknown>[]>>(`/notifications`, { params });
  const { items, meta } = unwrapList(data, 'Failed to load notifications');
  if (!meta) {
    throw new Error('Expected pagination meta');
  }
  return { items, meta };
}
