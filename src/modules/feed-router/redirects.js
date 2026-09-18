/**
 * Navigation Redirects Module
 * Part of FB - Clean My Feeds
 *
 * Handles automatic redirection to Facebook's chronological 'Most Recent' feed view (`/?sk=h_chr`).
 *
 * @module modules/feed-router/redirects
 */

/**
 * Redirects to the Most Recent feed if enabled in user options and currently visiting root home.
 *
 * ## Mechanism
 * When `NF_AUTO_REDIR_TO_MOST_RECENT` is active and the user visits the root Facebook domain (`/`)
 * without an active query string, sets `window.location.href = origin + '/?sk=h_chr'` to bypass
 * Facebook's algorithmic Top Stories ranking in favor of reverse-chronological order.
 *
 * @param {Object} context - Context object
 * @param {Object} context.VARS - Application state containing user options
 * @param {Window} [context.windowObj=window] - Browser window object
 */
export function registerRedirToMostRecent({ VARS, windowObj = typeof window !== 'undefined' ? window : null } = {}) {
  if (!windowObj || !VARS?.Options?.NF_AUTO_REDIR_TO_MOST_RECENT) {
    return;
  }

  const { origin, pathname, search } = windowObj.location;
  const targetUrl = `${origin}/?sk=h_chr`;

  if (pathname === '/' && search.length === 0) {
    windowObj.location.href = targetUrl;
  }
}
