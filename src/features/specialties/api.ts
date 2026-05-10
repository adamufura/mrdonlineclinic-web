import { api } from '@/lib/api/client';
import { unwrapData } from '@/lib/api/unpack';
import type { ApiEnvelope } from '@/types/api';

export type SpecialtyDto = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
};

/** GET /api/v1/specialties — public, no auth. */
export async function listPublicSpecialties(): Promise<SpecialtyDto[]> {
  const { data } = await api.get<ApiEnvelope<SpecialtyDto[]>>('/specialties');
  return unwrapData(data, 'Failed to load specialties');
}
