/**
 * URL parsing and manipulation utilities.
 * @module utils/url
 */

/**
 * Extracts the canonical publisher profile path from a Facebook Watch video URL.
 * Strips tracking parameters and replaces '/watch/' with '/'.
 *
 * @param {string} videoURL - The full video href URL.
 * @returns {string} The canonical publisher URL, or empty string if not a watch URL.
 *
 * @example
 * getVideoPublisherPathFromURL('https://www.facebook.com/watch/accesshollywood/?__cft__[0]=...');
 * // returns 'https://www.facebook.com/accesshollywood/'
 */
export function getVideoPublisherPathFromURL(videoURL) {
  if (typeof videoURL !== 'string' || videoURL === '') {
    return '';
  }

  const beginURL = videoURL.split('?')[0];
  if (!beginURL) {
    return '';
  }

  if (beginURL.includes('/watch/')) {
    return beginURL.replace('/watch/', '/');
  }

  return '';
}
