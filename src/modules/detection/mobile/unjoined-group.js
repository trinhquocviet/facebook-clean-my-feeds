/**
 * Mobile Unjoined Group Post Detection Rule
 * Part of FB - Clean My Feeds
 *
 * ## Signal Architecture on m.facebook.com
 * When Facebook serves suggested posts from groups the user has not joined:
 * 1. The header row features the Group name followed by a "Join" call-to-action button:
 *    `<span ... style="color:#0866ff;">Join</span>`
 * 2. The author and group status appear in the subtitle's aria-label:
 *    `aria-label="AuthorName, Timestamp, Public group"`
 * 3. Crucial Positive Control: Posts from groups the user HAS already joined also show
 *    "Public group" in the subtitle, but NEVER have a "Join" button.
 *
 * @module modules/detection/mobile/unjoined-group
 */

import { m_getHeaderRow } from './actor.js';

/**
 * Checks if a mobile cell is a suggested post from an unjoined group.
 *
 * @param {HTMLElement} cell - Mobile feed cell element
 * @param {Object} KeyWords - Translations / keywords dictionary
 * @returns {string} Rejection reason string if unjoined group post, or empty string
 */
export function m_isUnjoinedGroupPost(cell, KeyWords = {}) {
  if (!cell || typeof cell.querySelector !== 'function') return '';

  const headerRow = m_getHeaderRow(cell) || cell;
  const joinLabels = KeyWords.MOBILE_JOIN_LABELS || ['Join'];

  // 1. Locate Join CTA in header
  const ctaCandidates = typeof headerRow.querySelectorAll === 'function'
    ? headerRow.querySelectorAll('[role="button"], [data-action-id], [data-mcomponent="TextArea"]')
    : (typeof cell.querySelectorAll === 'function' ? cell.querySelectorAll('[role="button"], [data-action-id]') : []);

  let hasJoinCTA = false;
  for (const el of ctaCandidates) {
    const text = el.textContent?.trim() || '';
    if (joinLabels.includes(text) || text === 'Join') {
      hasJoinCTA = true;
      break;
    }
  }

  if (!hasJoinCTA) return '';

  // 2. Corroborate group context from subtitle or group aria-label
  const groupSuffixes = KeyWords.MOBILE_GROUP_SUFFIXES || [
    'Public group',
    'Private group',
    'group',
    'Nhóm công khai',
    'Nhóm riêng tư',
    'nhóm'
  ];

  const labels = [];
  if (typeof headerRow.querySelectorAll === 'function') {
    const labelled = headerRow.querySelectorAll('[aria-label]');
    for (const el of labelled) {
      const l = typeof el.getAttribute === 'function'
        ? el.getAttribute('aria-label')
        : (el.ariaLabel || '');
      if (l) labels.push(l.toLowerCase());
    }
  }

  const isGroup = groupSuffixes.some((suffix) =>
    labels.some((l) => l.includes(suffix.toLowerCase()))
  );

  // If Join CTA is present in header, even if subtitle label format differs slightly, flag as unjoined group
  if (hasJoinCTA && (isGroup || labels.length === 0)) {
    return KeyWords.NF_UNJOINED_GROUP || 'Unjoined Group';
  }

  return '';
}
