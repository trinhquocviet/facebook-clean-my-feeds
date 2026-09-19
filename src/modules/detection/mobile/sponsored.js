/**
 * Mobile Sponsored / Advertisement Post Detection Rule
 * Part of FB - Clean My Feeds
 *
 * ## Signal Architecture on m.facebook.com
 * In WebLite mobile DOM, advertisements do not render desktop-style "Sponsored" strings
 * with nested hidden spans or SVG xlink symbols. Instead:
 * 1. The header subtitle row (which in organic posts holds the timestamp e.g. "1d, Public")
 *    contains ONLY the literal word "Ad" (followed by private-use audience icon glyphs).
 * 2. The avatar button's aria-label ends with lowercase "profile picture"
 *    (e.g. "Singapore Airlines profile picture"), whereas organic posts use uppercase "Profile Picture"
 *    or "Unseen story from {Name}".
 *
 * @module modules/detection/mobile/sponsored
 */

import { m_getHeaderRow } from './actor.js';

/**
 * Checks if a mobile cell is a sponsored / advertisement post.
 *
 * @param {HTMLElement} cell - Mobile feed cell element
 * @param {Object} KeyWords - Active translations / keywords dictionary
 * @returns {string} Rejection reason string if sponsored, or empty string
 */
export function m_isSponsored(cell, KeyWords = {}) {
  if (!cell || typeof cell.querySelector !== 'function') return '';

  const headerRow = m_getHeaderRow(cell) || cell;
  const adLabels = KeyWords.MOBILE_AD_LABELS || ['Ad'];
  const textCandidates = typeof headerRow.querySelectorAll === 'function'
    ? headerRow.querySelectorAll('[data-mcomponent="TextArea"] .native-text, [data-mcomponent="TextArea"] span, .native-text, span')
    : (typeof cell.querySelectorAll === 'function' ? cell.querySelectorAll('.native-text, span') : []);

  for (const el of textCandidates) {
    const text = el.textContent?.trim() || '';
    // Exact word match: "Ad", "Được tài trợ", or in mobile dictionary
    if (adLabels.includes(text) || text === 'Ad') {
      return KeyWords.SPONSORED || 'Sponsored';
    }
    // Also check if text starts with "Ad " or "Ad" followed only by non-alphanumeric icon glyphs
    for (const label of adLabels) {
      if (text.startsWith(label)) {
        const remainder = text.slice(label.length).trim();
        // If remainder is empty or only icon glyphs / punctuation (no alphanumeric text)
        if (remainder === '' || !/[a-zA-Z0-9]/.test(remainder)) {
          return KeyWords.SPONSORED || 'Sponsored';
        }
      }
    }
  }

  // 2. Corroborating signal: avatar aria-label ending in lowercase "profile picture"
  const avatar = headerRow.querySelector?.('[role="button"][aria-label$=" profile picture"]');
  if (avatar) {
    const avatarLabel = typeof avatar.getAttribute === 'function'
      ? avatar.getAttribute('aria-label')
      : (avatar.ariaLabel || '');

    if (avatarLabel && avatarLabel.endsWith(' profile picture') && !avatarLabel.endsWith(' Profile Picture')) {
      const subtitleRow = headerRow.querySelector?.('[tabindex="0"][aria-label]');
      const subtitleLabel = typeof subtitleRow?.getAttribute === 'function'
        ? subtitleRow.getAttribute('aria-label')
        : (subtitleRow?.ariaLabel || '');

      if (!subtitleLabel || (!/\b\d+[mhd]\b/i.test(subtitleLabel) && !/ago|trước/i.test(subtitleLabel))) {
        return KeyWords.SPONSORED || 'Sponsored';
      }
    }
  }

  return '';
}
