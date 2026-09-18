/**
 * Groups Feed Detection Rules
 * Part of FB - Clean My Feeds
 *
 * Classifies posts in Groups Feed: group suggestions and short reel videos.
 *
 * @module modules/detection/rules/groups
 */

/**
 * Detects suggestion/recommendation posts in the Groups Feed.
 *
 * Structural detection logic:
 * 1. Resolves post blocks using a multi-tier query selector ladder. Some users
 *    have `aria-posinset` attributes while others have `aria-describedby`.
 * 2. If the initial query returns <= 1 block, it falls back to a deeper nesting
 *    selector (accommodating Facebook's December 2022 DOM hierarchy update).
 * 3. With multiple blocks present:
 *    - Standard suggestions: The 1st block contains a CSS image icon
 *      (`i[data-visualcompletion="css-img"][style]`).
 *    - Sneaky group suggestions: Posts lacking standard recommendation headers
 *      display a distinct header hierarchy in the 2nd block (`h3 > div > span ~ span > span > div > div`).
 *
 * @param {HTMLElement} post - Groups feed post element
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @returns {string} Trigger reason (GF_SUGGESTIONS) or empty string
 */
export function gf_isSuggested(post, KeyWords) {
  let results = '';
  let blocksQuery =
    'div[aria-posinset] > div > div > div > div > div > div > div > div, div[aria-describedby] > div > div > div > div > div > div > div > div';
  let blocks = post.querySelectorAll(blocksQuery);
  if (blocks.length <= 1) {
    // Deeper hierarchy fallback for Facebook DOM variations
    blocksQuery =
      'div[aria-posinset] > div > div > div > div > div > div > div > div > div, div[aria-describedby] > div > div > div > div > div > div > div > div > div';
    blocks = post.querySelectorAll(blocksQuery);
  }

  if (blocks.length > 1) {
    const suggIcon = blocks[0].querySelector('i[data-visualcompletion="css-img"][style]');
    if (suggIcon) {
      results = KeyWords.GF_SUGGESTIONS;
    } else {
      // Sneaky group post without standard suggestion/recommendation header
      const query = 'h3 > div > span ~ span > span > div > div';
      const sneakyGroupPost = blocks[1].querySelector(query);
      if (sneakyGroupPost) {
        results = KeyWords.GF_SUGGESTIONS;
      }
    }
  }

  return results;
}

/**
 * Detects a standalone short Reel video post in the Groups Feed.
 * Verifies that exactly one reel link exists in the post.
 *
 * @param {HTMLElement} post - Groups feed post element
 * @param {Object} KeyWords - Active localized keywords dictionary
 * @returns {string} Trigger reason (GF_SHORT_REEL_VIDEO) or empty string
 */
export function gf_isShortReelVideo(post, KeyWords) {
  const querySRV = 'a[href*="/reel/"]';
  const elementsSRV = Array.from(post.querySelectorAll(querySRV));
  return elementsSRV.length !== 1 ? '' : KeyWords.GF_SHORT_REEL_VIDEO;
}

