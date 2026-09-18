/**
 * Navigation Redirects Module
 * Part of FB - Clean My Feeds
 *
 * Handles automatic redirection to 'Most Recent' feed view when configured.
 *
 * @module modules/feed-router/redirects
 */

/**
 * Redirects to the Most Recent feed if enabled and on home root URL.
 *
 * @param {Object} context
 * @param {Object} context.VARS - Application state
 * @param {Window} [context.windowObj=window] - Window object
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
