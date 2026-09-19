/**
 * DOM attribute and property constants used for Facebook feed post detection,
 * hiding, dusting, and UI element marking.
 *
 * @module constants/dom
 */

/**
 * Attribute placed on hidden Facebook post elements and details wrappers.
 * Stores the sanitised reason for hiding the post.
 * @type {string}
 */
export const POST_ATT = 'cmfr';

/**
 * Attribute placed on post content and echo banner to group consecutive hidden posts.
 * @type {string}
 */
export const POST_ATT_CPID = 'cmfcpid';

/**
 * DOM element property storing the number of dusting/scanning passes performed.
 * @type {string}
 */
export const POST_PROP_DUSTED = 'cmfDusted';

/**
 * Flag attribute placed on child elements (tablist, survey buttons, stories)
 * to indicate they have already been processed.
 * @type {string}
 */
export const POST_ATT_CHILD_FLAG = 'cmfcf';

/**
 * Attribute placed on post mini-captions and toggle state bars.
 * @type {string}
 */
export const POST_ATT_TAB = 'cmftsb';

/**
 * Attribute placed on Marketplace items storing previous innerHTML length
 * to skip scanning unchanged cards.
 * @type {string}
 */
export const POST_ATT_MP_SKIP = 'cmfsmp';

/**
 * Attribute placed on scanned Reel <video> elements.
 * @type {string}
 */
export const REEL_VIDEO_ATT = 'cmfrv';

/**
 * Attribute placed on the main feed column and dialog container to track size changes.
 * @type {string}
 */
export const MAIN_COLUMN_ATT = 'cmfmc';

/**
 * CSS class name applied to external link icons.
 * @type {string}
 */
export const ICON_NEW_WINDOW_CLASS = 'cmf-link-new';

/**
 * Attribute placed on the internal hidden wrapper of an obscured mobile cell.
 * @type {string}
 */
export const MOBILE_CONTENT_ATT = 'data-cmf-mobile-content';

/**
 * Attribute placed on the touch summary bar of an obscured mobile cell.
 * @type {string}
 */
export const MOBILE_SUMMARY_ATT = 'data-cmf-mobile-summary';

/**
 * Attribute placed on the outer cell of an obscured mobile post to enforce height: auto !important.
 * @type {string}
 */
export const MOBILE_COLLAPSED_ATT = 'data-cmf-mobile-collapsed';

/**
 * Attribute placed on adjacent 1px/2px spacer dividers when coupled with an obscured post.
 * @type {string}
 */
export const MOBILE_DIVIDER_COLLAPSED_ATT = 'data-cmf-mobile-divider-collapsed';

// ============================================================================
// Backward Compatibility Bindings (camelCase matching historical userscript vars)
// ============================================================================
export const postAtt = POST_ATT;
export const postAttCPID = POST_ATT_CPID;
export const postPropDS = POST_PROP_DUSTED;
export const postAttChildFlag = POST_ATT_CHILD_FLAG;
export const postAttTab = POST_ATT_TAB;
export const postAttMPSkip = POST_ATT_MP_SKIP;
export const rvAtt = REEL_VIDEO_ATT;
export const mainColumnAtt = MAIN_COLUMN_ATT;
export const iconNewWindowClass = ICON_NEW_WINDOW_CLASS;
export const mobileContentAtt = MOBILE_CONTENT_ATT;
export const mobileSummaryAtt = MOBILE_SUMMARY_ATT;
export const mobileCollapsedAtt = MOBILE_COLLAPSED_ATT;
export const mobileDividerCollapsedAtt = MOBILE_DIVIDER_COLLAPSED_ATT;
