const CONTENT_TAG = {
    join_industry: 'career',
    career: 'career',
    invest: 'invest',
    build_startup: 'build_startup',
    curiosity: 'curiosity',
};
/** The `goal:` tag used on authored content for a stored learning goal. */
export function goalContentTag(goal) {
    return `goal:${CONTENT_TAG[goal || 'curiosity'] || 'curiosity'}`;
}
