/**
 * Scanner loop configuration thresholds and filter token separators.
 *
 * @module constants/config
 */

/**
 * Delimiter string used to separate blocked text keywords.
 * @type {string}
 */
export const FILTER_SEPARATOR = '¦¦';

/**
 * Loop iteration settings for post scanning and mopping routines.
 * @readonly
 * @type {{ SCAN_COUNT_START: number, SCAN_COUNT_MAX_LOOP: number }}
 */
export const SCAN_CONFIG = Object.freeze({
  /** Starting index for scanning a post */
  SCAN_COUNT_START: 0,
  /** Maximum loops before giving up on scanning a post */
  SCAN_COUNT_MAX_LOOP: 15,
});
