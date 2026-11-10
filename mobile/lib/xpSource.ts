const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * xp_transactions.source_id is a uuid column. Activity ids such as a Deep Case's
 * "lesson-case-6-<uuid>-c1" are not, and sending one makes the whole insert fail:
 * the XP still reached the total, but the friend race and the crown (which sum
 * xp_transactions) never saw it. Non-uuid ids are kept in the description instead.
 */
export function transactionSource(sourceId?: string, description?: string): { source_id: string | null; description: string | null } {
  if (!sourceId || UUID_PATTERN.test(sourceId)) return { source_id: sourceId || null, description: description ?? null };
  return { source_id: null, description: description ? `${description} · ${sourceId}` : sourceId };
}
