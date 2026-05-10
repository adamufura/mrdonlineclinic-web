import { api } from '@/lib/api/client';
import type { ApiEnvelope } from '@/types/api';

export type SpecialtyDto = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  isActive: boolean;
};

export async function listPublicSpecialties(): Promise<SpecialtyDto[]> {
  const { data } = await api.get<ApiEnvelope<SpecialtyDto[]>>('/specialties');
  if (!data.success || !data.data) {
    throw new Error(data.message || 'Failed to load specialties');
  }
  return data.data;
}
