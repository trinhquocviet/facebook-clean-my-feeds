/**
 * Mobile Reels Shelf & Suggested Reel Detection Rule
 * Part of FB - Clean My Feeds
 *
 * ## Signal Architecture on m.facebook.com
 * In WebLite mobile DOM, Reels units appear either as a horizontal tray shelf or
 * as an in-feed standalone recommended Reel video card.
 *
 * Distinctive Signals:
 * 1. Actionable video card button has:
 *    `aria-label="View reel video from {Name} with {Count} views ."` (or localized)
 * 2. Header row has `<h2>Reels</h2>` or contains a label for Reels.
 *
 * @module modules/detection/mobile/reels
 */

const REEL_CARD_RE = /^(View reel video from .+ with .+ views? \.?|Xem thước phim từ .+ với .+ lượt xem)/i;

/**
 * Checks if a mobile cell is a Reels shelf or in-feed standalone Reel suggestion.
 *
 * @param {HTMLElement} cell - Mobile feed cell element
 * @param {Object} KeyWords - Translations / keywords dictionary
 * @returns {string} Rejection reason string if reel shelf/card, or empty string
 */
export function m_isReelsTray(cell, KeyWords = {}) {
  if (!cell || typeof cell.querySelector !== 'function') return '';

  // 1. Check for dedicated Reels section header
  const h2 = cell.querySelector('h2');
  if (h2 && /Reels|Thước phim/i.test(h2.textContent || '')) {
    return KeyWords.NF_REELS || 'Reels';
  }

  // 2. Check for action cards matching Reel video aria-label
  if (typeof cell.querySelectorAll === 'function') {
    const cards = cell.querySelectorAll('[role="button"][aria-label]');
    for (const card of cards) {
      const label = typeof card.getAttribute === 'function'
        ? card.getAttribute('aria-label')
        : (card.ariaLabel || '');

      if (REEL_CARD_RE.test(label || '')) {
        return KeyWords.NF_REELS || 'Reels';
      }
    }
  }

  return '';
}

/**
 * Standalone in-feed suggested reel detection (alias).
 *
 * @param {HTMLElement} cell - Mobile feed cell element
 * @param {Object} KeyWords - Translations / keywords dictionary
 * @returns {string} Rejection reason string if reel, or empty string
 */
export function m_isSingleReelSuggestion(cell, KeyWords = {}) {
  return m_isReelsTray(cell, KeyWords);
}
