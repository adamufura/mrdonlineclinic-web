import { api } from '@/lib/api/client';
import { unwrapData } from '@/lib/api/unpack';
import type { ApiEnvelope } from '@/types/api';
import type { AppLanguage } from '@/types/language';

export async function translateText(text: string, targetLanguage: AppLanguage) {
  const { data } = await api.post<
    ApiEnvelope<{
      originalText: string;
      translatedText: string;
      targetLanguage: AppLanguage;
      fromCache: boolean;
    }>
  >('/translate', { text, targetLanguage });
  return unwrapData(data, 'Translation failed');
}

export async function translateBatch(texts: string[], targetLanguage: AppLanguage) {
  const { data } = await api.post<
    ApiEnvelope<{
      items: Array<{ originalText: string; translatedText: string; fromCache: boolean }>;
      targetLanguage: AppLanguage;
    }>
  >('/translate/batch', { texts, targetLanguage });
  return unwrapData(data, 'Batch translation failed');
}
