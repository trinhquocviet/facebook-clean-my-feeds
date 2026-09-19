/**
 * Mobile post author and header row resolution utilities.
 * Handles DOM traversal within m.facebook.com WebLite cells.
 *
 * @module modules/detection/mobile/actor
 */

/**
 * Extracts author/actor name from a mobile feed cell.
 * Primary signal: aria-label="More options for {Name}" on the context button.
 * Fallback: aria-label="{Name} profile picture" on avatar or text in role="link".
 *
 * @param {HTMLElement} cell - Mobile feed cell element
 * @returns {string} Extracted actor/page name, or empty string
 */
export function m_getActorName(cell) {
  if (!cell || typeof cell.querySelector !== 'function') return '';

  // 1. Primary: "More options for {Name}" button
  const moreBtn = cell.querySelector('[aria-label^="More options for "]');
  if (moreBtn) {
    const label = moreBtn.getAttribute('aria-label') || moreBtn.ariaLabel || '';
    const name = label.replace(/^More options for /i, '').trim();
    if (name) return name;
  }

  // 2. Avatar aria-label: "{Name} profile picture" or "Unseen story from {Name}"
  const avatarBtn = cell.querySelector('[role="button"][aria-label*="profile picture" i], [role="button"][aria-label^="Unseen story from " i]');
  if (avatarBtn) {
    const label = avatarBtn.getAttribute('aria-label') || avatarBtn.ariaLabel || '';
    const name = label
      .replace(/ profile picture$/i, '')
      .replace(/^Unseen story from /i, '')
      .trim();
    if (name) return name;
  }

  // 3. Header row primary link
  const linkSpan = cell.querySelector('span[role="link"]');
  if (linkSpan) {
    const text = linkSpan.textContent?.trim();
    if (text) return text;
  }

  return '';
}

/**
 * Resolves the header row container element within a mobile feed cell.
 * The header row contains the avatar, author name, CTA button (Follow/Join), and subtitle.
 *
 * @param {HTMLElement} cell - Mobile feed cell element
 * @returns {HTMLElement|null} Header container element, or null
 */
export function m_getHeaderRow(cell) {
  if (!cell || typeof cell.querySelector !== 'function') return null;

  // Locate by presence of the options button ("More options for ..." or "More")
  const optionsBtn = cell.querySelector(
    '[aria-label^="More options for "], [aria-label="More options"], [aria-label="More"]'
  );
  if (optionsBtn) {
    // Walk up until we reach a container spanning at least the author area
    let curr = optionsBtn.parentNode;
    while (curr && curr !== cell) {
      if (
        curr.querySelector?.('[role="link"]') ||
        curr.querySelector?.('[aria-label*="profile picture" i]')
      ) {
        return curr;
      }
      curr = curr.parentNode;
    }
  }

  // Fallback: container holding the avatar image
  const avatar = cell.querySelector('[aria-label*="profile picture" i], [aria-label^="Unseen story from "]');
  if (avatar) {
    let curr = avatar.parentNode;
    while (curr && curr !== cell) {
      if (curr.querySelector?.('span[role="link"]')) {
        return curr;
      }
      curr = curr.parentNode;
    }
  }

  return cell;
}
