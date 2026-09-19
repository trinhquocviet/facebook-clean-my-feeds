/**
 * Classification and discrimination utilities for mobile feed cells.
 * Identifies spacers, dividers, skeletons, and non-post chrome.
 *
 * @module modules/detection/mobile/cell-classifier
 */

/**
 * Checks if a cell is an empty 1px/2px spacer divider or an unhydrated skeleton.
 *
 * @param {HTMLElement} cell - Candidate mobile DOM node
 * @returns {boolean} True if the cell is a divider or skeleton and should be skipped
 */
export function m_isDividerOrSkeleton(cell) {
  if (!cell || cell.nodeType !== 1) return true;

  // 1. Structural 1px or 2px divider spacers
  const actualHeight = cell.getAttribute?.('data-actual-height');
  if (actualHeight === '1' || actualHeight === '2') {
    return true;
  }

  // 2. Inline height checks (e.g. style="height:1px;" or style="height: 2px")
  const styleAttr = cell.getAttribute?.('style') || cell.style?.cssText || '';
  if (/height\s*:\s*[12]px/i.test(styleAttr)) {
    return true;
  }

  // 3. Filler elements
  if (cell.classList?.contains?.('filler') || cell.classList?.contains?.('pull-to-refresh-spinner-container')) {
    return true;
  }

  // 4. Empty skeleton: lacking buttons, links, and text
  const hasInteractive = Boolean(
    cell.querySelector?.('[role="button"], [role="link"], [data-action-id], a, img, video')
  );
  if (!hasInteractive && (!cell.textContent || cell.textContent.trim().length === 0)) {
    return true;
  }

  return false;
}

/**
 * Checks if a cell represents top-level navigation chrome (header bar, search, tab bar, composer)
 * rather than an algorithmic or organic feed unit.
 *
 * @param {HTMLElement} cell - Mobile feed cell element
 * @returns {boolean} True if the cell is navigation chrome
 */
export function m_isHeaderOrChrome(cell) {
  if (!cell || cell.nodeType !== 1) return true;

  // App logo, search Facebook, or navigation icons
  if (cell.querySelector?.('[aria-label="Facebook logo"], [aria-label="Search Facebook"]')) {
    return true;
  }

  // Navigation tab bar (Home, Friends, Watch, Marketplace, Notifications, Menu)
  if (cell.querySelector?.('[role="tablist"], [data-comp-id="3"]')) {
    return true;
  }

  // "What's on your mind?" composer box
  if (cell.querySelector?.('[aria-label*="What\'s on your mind" i], [aria-label*="Bạn đang nghĩ gì" i]')) {
    return true;
  }

  return false;
}

/**
 * Finds an adjacent 1px/2px spacer divider paired with the given post cell.
 * Looks first at the preceding sibling, then at the following sibling.
 *
 * @param {HTMLElement} cell - Mobile feed cell element
 * @returns {HTMLElement|null} The paired divider element, or null
 */
export function m_getAdjacentDivider(cell) {
  if (!cell) return null;

  const prev = cell.previousElementSibling;
  if (prev && m_isDividerOrSkeleton(prev)) {
    return prev;
  }

  const next = cell.nextElementSibling;
  if (next && m_isDividerOrSkeleton(next)) {
    return next;
  }

  return null;
}
