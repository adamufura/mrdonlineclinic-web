import { api } from '@/lib/api/client';
import { unwrapData, unwrapList } from '@/lib/api/unpack';
import type { ApiEnvelope, ApiMeta } from '@/types/api';

export type DirectorySort = 'rating' | 'experience' | 'createdAt';

export type ListPractitionersParams = {
  page?: number;
  limit?: number;
  specialtyId?: string;
  search?: string;
  /** City, state, or country substring (matches practitioner practice location). */
  location?: string;
  /** YYYY-MM-DD — practitioners with at least one open slot that day (UTC). */
  date?: string;
  sort?: DirectorySort;
};

/** Public directory — matches GET /api/v1/practitioners (no auth). */
export async function listPractitionersDirectory(params: ListPractitionersParams): Promise<{
  items: PractitionerDirectoryItem[];
  meta: ApiMeta;
}> {
  const merged = { page: 1, limit: 20, ...params };
  const query = Object.fromEntries(
    Object.entries(merged).filter(([, v]) => v !== undefined && v !== ''),
  ) as Record<string, string | number>;
  const { data } = await api.get<ApiEnvelope<PractitionerDirectoryItem[]>>('/practitioners', { params: query });
  const { items, meta } = unwrapList(data, 'Failed to load practitioners');
  if (!meta) {
    throw new Error('Expected pagination meta from practitioners list');
  }
  return { items, meta };
}

export type PractitionerDirectoryItem = {
  _id: string;
  firstName: string;
  lastName: string;
  bio?: string;
  yearsOfExperience?: number;
  averageRating?: number;
  totalReviews?: number;
  profilePhotoUrl?: string;
  consultationLanguages?: string[];
  specialties?: { _id: string; name: string; slug: string }[];
  practiceLocation?: { city?: string; state?: string; country?: string };
};

/** GET /api/v1/practitioners/:id */
export async function getPractitionerPublicProfile(practitionerId: string): Promise<PractitionerPublicProfileResponse> {
  const { data } = await api.get<ApiEnvelope<PractitionerPublicProfileResponse>>(`/practitioners/${practitionerId}`);
  return unwrapData(data, 'Practitioner not found');
}

export type PractitionerPublicProfileResponse = {
  practitioner: Record<string, unknown>;
  reviews: Record<string, unknown>[];
};

/** GET /api/v1/practitioners/:id/slots — `from` / `to` required (coerced as dates on server). */
export async function getPractitionerPublicSlots(
  practitionerId: string,
  from: Date,
  to: Date,
): Promise<unknown[]> {
  const { data } = await api.get<ApiEnvelope<unknown[]>>(`/practitioners/${practitionerId}/slots`, {
    params: { from: from.toISOString(), to: to.toISOString() },
  });
  return unwrapData(data, 'Failed to load slots');
}
