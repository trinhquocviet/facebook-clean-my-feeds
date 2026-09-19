/**
 * Mobile Suggested Pages / Accounts Detection Rule
 * Part of FB - Clean My Feeds
 *
 * ## Signal Architecture on m.facebook.com
 * Suggested pages or profiles that the user does not currently follow are displayed
 * with a prominent "Follow" call-to-action button in the post header row:
 * `<div role="button" ...><span ... style="color:#1877f2;">Follow</span></div>`
 *
 * @module modules/detection/mobile/suggested-follow
 */

import { m_getHeaderRow } from './actor.js';

/**
 * Checks if a mobile cell is a suggested page or account with a Follow CTA.
 *
 * @param {HTMLElement} cell - Mobile feed cell element
 * @param {Object} KeyWords - Translations / keywords dictionary
 * @returns {string} Rejection reason string if suggested follow, or empty string
 */
export function m_isSuggestedFollow(cell, KeyWords = {}) {
  if (!cell || typeof cell.querySelector !== 'function') return '';

  const headerRow = m_getHeaderRow(cell) || cell;
  const followLabels = KeyWords.MOBILE_FOLLOW_LABELS || ['Follow'];

  // Check buttons or actionable text elements in the header area
  const ctaCandidates = typeof headerRow.querySelectorAll === 'function'
    ? headerRow.querySelectorAll('[role="button"], [data-action-id], [data-mcomponent="TextArea"]')
    : (typeof cell.querySelectorAll === 'function' ? cell.querySelectorAll('[role="button"], [data-action-id]') : []);

  for (const el of ctaCandidates) {
    const text = el.textContent?.trim() || '';
    if (followLabels.includes(text) || text === 'Follow') {
      return KeyWords.NF_FOLLOW || 'Suggested: Follow';
    }
  }

  return '';
}
