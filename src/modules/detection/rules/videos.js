/**
 * Videos Feed Detection Rules
 * Part of FB - Clean My Feeds
 *
 * Classifies posts in Videos Feed: Live videos, Instagram videos,
 * and detects duplicate videos by video ID.
 *
 * @module modules/detection/rules/videos
 */

/**
 * Detects "LIVE" broadcast indicator badge on video posts.
 *
 * @param {HTMLElement} post - Video post element
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @returns {string} Trigger reason (VF_LIVE) or empty string
 */
export function vf_isVideoLive(post, KeyWords) {
  const liveRule = 'div[role="presentation"] ~ div > div:nth-of-type(1) > span';
  const elLive = post.querySelectorAll(liveRule);
  return elLive.length > 0 ? KeyWords.VF_LIVE : '';
}

/**
 * Detects Instagram video reposts embedded into the Watch Feed.
 * Usually marked by author headers linking to `href="#"` with an embedded SVG badge.
 *
 * @param {HTMLElement} post - Video post element
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @returns {string} Trigger reason (VF_INSTAGRAM) or empty string
 */
export function vf_isInstagram(post, KeyWords) {
  const instagramRule = 'div > div > div > div > div > a[href="#"] > div > svg';
  const elInstagram = post.querySelectorAll(instagramRule);
  return elInstagram.length > 0 ? KeyWords.VF_INSTAGRAM : '';
}

/**
 * Scans the active document for multiple occurrences of the same video URL.
 * When duplicate occurrences are detected (>= 2), all instances beyond the first
 * (index 1 to N) are hidden to prevent repeated clips during continuous scrolling.
 *
 * @param {string} urlQuery - Selector querying links with specific video ID
 * @param {string} postQuery - Selector resolving parent post container
 * @param {string} patternUsed - Debug identifier for URL pattern ('1' or '2')
 * @param {Function} vf_hidePost - Post hiding action callback
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @param {string} [log=''] - Logging prefix
 * @param {Document} [doc=document] - DOM document
 */
export function findDuplicateVideos(urlQuery, postQuery, patternUsed, vf_hidePost, KeyWords, log = '', doc = document) {
  const watchVideos = doc.querySelectorAll(urlQuery);
  if (watchVideos.length < 2) {
    return;
  }

  // Iterate from index 1 to preserve the original (first) instance
  for (let i = 1; i < watchVideos.length; i++) {
    const videoPost = watchVideos[i].closest ? watchVideos[i].closest(postQuery) : null;
    if (videoPost) {
      if (log) {
        console.info(`${log}findDuplicateVideos(); duplicate: `, urlQuery, postQuery, patternUsed, videoPost);
      }
      vf_hidePost(videoPost, KeyWords.VF_DUPLICATE_VIDEOS, '');
    }
  }
}

/**
 * Identifies video posts and extracts the video ID to trigger duplicate elimination.
 * Inspects two distinct Facebook video URL patterns:
 * - Pattern 1: `/watch/?v=<video_id>&...` (extracted via URLSearchParams `v`)
 * - Pattern 2: `/<publisher>/videos/<video_id>/` (extracted from pathname split)
 *
 * @param {HTMLElement} post - Video post element
 * @param {string} postQuery - Selector resolving parent video post
 * @param {Function} vf_hidePost - Post hiding action callback
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @param {string} [log=''] - Logging prefix
 * @param {Document} [doc=document] - DOM document
 */
export function vf_hideDuplicateVideos(post, postQuery, vf_hidePost, KeyWords, log = '', doc = document) {
  // Pattern 1: Standard Watch feed link `/watch/?v=...`
  const elWatchVideo = post.querySelector('div > span > a[href*="/watch/?v="]');
  if (elWatchVideo && elWatchVideo.href) {
    try {
      const watchVideoVID = new URL(elWatchVideo.href).searchParams.get('v');
      if (watchVideoVID) {
        findDuplicateVideos(
          `div > span > a[href*="/watch/?v=${watchVideoVID}&"]`,
          postQuery,
          '1',
          vf_hidePost,
          KeyWords,
          log,
          doc
        );
      }
    } catch {
      // Ignore URL parsing errors
    }
  } else {
    // Pattern 2: Profile / page video link `/<profile>/videos/<video_id>/`
    const elUserVideo = post.querySelector('div > span > a[href*="/videos/"]');
    if (elUserVideo && elUserVideo.href) {
      const parts = elUserVideo.href.split('/videos/');
      if (parts.length > 1) {
        const watchVideoVID = parts[1].split('/')[0];
        if (watchVideoVID) {
          findDuplicateVideos(
            `div > span > a[href*="/videos/${watchVideoVID}/"]`,
            postQuery,
            '2',
            vf_hidePost,
            KeyWords,
            log,
            doc
          );
        }
      }
    }
  }
}

