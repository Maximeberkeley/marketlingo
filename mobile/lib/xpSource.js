const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function transactionSource(sourceId, description) {
  if (!sourceId || UUID_PATTERN.test(sourceId)) return { source_id: sourceId || null, description: description ?? null };
  return { source_id: null, description: description ? `${description} \xB7 ${sourceId}` : sourceId };
}
export {
  transactionSource
};
