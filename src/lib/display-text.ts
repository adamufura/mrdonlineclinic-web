/** Prefer API-enriched display* fields from translation service; fall back to source. */
export function displayTranslatedField(
  record: Record<string, unknown> | null | undefined,
  field: string,
): string {
  if (!record) return '';
  const displayKey = `display${field.charAt(0).toUpperCase()}${field.slice(1)}`;
  const originalKey = `original${field.charAt(0).toUpperCase()}${field.slice(1)}`;
  const display = record[displayKey];
  if (typeof display === 'string' && display.trim()) return display.trim();
  const original = record[originalKey] ?? record[field];
  if (typeof original === 'string') return original.trim();
  return '';
}

export function displayNotificationTitle(n: Record<string, unknown>): string {
  if (typeof n.displayTitle === 'string' && n.displayTitle.trim()) return n.displayTitle.trim();
  return typeof n.title === 'string' ? n.title.trim() : '';
}

export function displayNotificationBody(n: Record<string, unknown>): string {
  if (typeof n.displayBody === 'string' && n.displayBody.trim()) return n.displayBody.trim();
  return typeof n.body === 'string' ? n.body.trim() : '';
}
