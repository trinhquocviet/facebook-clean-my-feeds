/**
 * Mobile Stories Tray Detection Rule
 * Part of FB - Clean My Feeds
 *
 * ## Signal Architecture on m.facebook.com
 * The Stories shelf is rendered as a top-level feed cell containing a horizontal scroller:
 * `div.m[data-is-h-scrollable="true"].hscroller`
 *
 * Individual cards inside this tray have:
 * - `aria-label="Create story"` (or localized "Tạo tin")
 * - `aria-label="View {Name}'s story. {N} unseen stor(y|ies)"` (or localized "{N} tin chưa xem")
 *
 * Crucial Safeguard: Ad units (e.g. Singapore Airlines) also use `class="m hscroller"`
 * for product image carousels. To prevent misclassifying ad carousels, this rule requires
 * that at least 50% of actionable card buttons match the Stories vocabulary.
 *
 * @module modules/detection/mobile/stories
 */

const STORY_CARD_RE = /^(Create story|Tạo tin|View .+'s story\. \d+ unseen stor(y|ies)|.+ \d+ tin chưa xem)/i;

/**
 * Checks if a mobile cell is a Stories horizontal tray.
 *
 * @param {HTMLElement} cell - Mobile feed cell element
 * @param {Object} KeyWords - Translations / keywords dictionary
 * @returns {string} Rejection reason string if stories tray, or empty string
 */
export function m_isStoriesTray(cell, KeyWords = {}) {
  if (!cell || typeof cell.querySelector !== 'function') return '';

  const hscroller = cell.querySelector('.hscroller, [data-is-h-scrollable="true"]');
  if (!hscroller || typeof hscroller.querySelectorAll !== 'function') return '';

  const cards = hscroller.querySelectorAll('[role="button"][aria-label]');
  if (cards.length === 0) return '';

  let matchCount = 0;
  for (const card of cards) {
    const label = typeof card.getAttribute === 'function'
      ? card.getAttribute('aria-label')
      : (card.ariaLabel || '');

    if (STORY_CARD_RE.test(label || '')) {
      matchCount++;
    }
  }

  // Require majority match (>= 50%) to guarantee it's not a general media carousel
  if (matchCount > 0 && matchCount / cards.length >= 0.5) {
    return KeyWords.NF_STORIES || 'Stories';
  }

  return '';
}
