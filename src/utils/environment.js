/**
 * Environment, device, and viewport detection utilities.
 * Pure functions with safe fallbacks for SSR, Node, and browser environments.
 * @module utils/environment
 */

/**
 * Checks if the current document/window is running on a mobile Facebook hostname.
 *
 * @param {Document} [doc=document] - DOM document
 * @returns {boolean} True if the hostname matches mobile Facebook domains
 *
 * @example
 * isMobileHost(); // true on m.facebook.com
 */
export function isMobileHost(doc = (typeof document !== 'undefined' ? document : null)) {
  const win = doc?.defaultView || (typeof window !== 'undefined' ? window : null);
  const host = (win?.location || (typeof location !== 'undefined' ? location : null))?.hostname || '';
  return /^(m|touch|mobile)\.facebook\.com$/i.test(host);
}

/**
 * Checks if the current execution environment is a mobile device or narrow viewport.
 * Considers mobile Facebook hostnames, user-agent indicators, and viewport width (<= 768px).
 *
 * @param {Document} [doc=document] - DOM document
 * @returns {boolean} True if running on a mobile device or narrow viewport
 *
 * @example
 * isMobileDevice(); // true on mobile browsers or screen width <= 768px
 */
export function isMobileDevice(doc = (typeof document !== 'undefined' ? document : null)) {
  if (isMobileHost(doc)) return true;

  const win = doc?.defaultView || (typeof window !== 'undefined' ? window : null);
  const ua = (win?.navigator || (typeof navigator !== 'undefined' ? navigator : null))?.userAgent || '';
  if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(ua)) {
    return true;
  }

  if (win?.matchMedia && typeof win.matchMedia === 'function') {
    return win.matchMedia('(max-width: 768px)').matches;
  }

  return false;
}

/**
 * Checks if the DOM tree contains Facebook Mobile layout markers (e.g. #screen-root or vscroller).
 *
 * @param {Document} [doc=document] - DOM document
 * @returns {boolean} True if mobile DOM architecture is detected
 *
 * @example
 * isMobileDOM(); // true if #screen-root or div[data-type="vscroller"] exists
 */
export function isMobileDOM(doc = (typeof document !== 'undefined' ? document : null)) {
  if (!doc) return false;
  return Boolean(
    doc.getElementById?.('screen-root') ||
    doc.querySelector?.('div[data-type="vscroller"][data-mcomponent="MContainer"]') ||
    doc.querySelector?.('div[data-type="vscroller"]')
  );
}
