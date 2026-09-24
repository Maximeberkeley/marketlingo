export const DISPLAY_NAME_FALLBACK = 'Scholar';
export function normalizeDisplayName(value) {
    const clean = value?.trim().replace(/\s+/g, ' ').slice(0, 40);
    return clean || DISPLAY_NAME_FALLBACK;
}
