/**
 * Groups Feed Detection Rules
 * Part of FB - Clean My Feeds
 *
 * Classifies posts in Groups Feed: group suggestions and short reel videos.
 *
 * @module modules/detection/rules/groups
 */

export function gf_isSuggested(post, KeyWords) {
  let results = '';
  let blocksQuery =
    'div[aria-posinset] > div > div > div > div > div > div > div > div, div[aria-describedby] > div > div > div > div > div > div > div > div';
  let blocks = post.querySelectorAll(blocksQuery);
  if (blocks.length <= 1) {
    blocksQuery =
      'div[aria-posinset] > div > div > div > div > div > div > div > div > div, div[aria-describedby] > div > div > div > div > div > div > div > div > div';
    blocks = post.querySelectorAll(blocksQuery);
  }

  if (blocks.length > 1) {
    const suggIcon = blocks[0].querySelector('i[data-visualcompletion="css-img"][style]');
    if (suggIcon) {
      results = KeyWords.GF_SUGGESTIONS;
    } else {
      const query = 'h3 > div > span ~ span > span > div > div';
      const sneakyGroupPost = blocks[1].querySelector(query);
      if (sneakyGroupPost) {
        results = KeyWords.GF_SUGGESTIONS;
      }
    }
  }

  return results;
}

export function gf_isShortReelVideo(post, KeyWords) {
  const querySRV = 'a[href*="/reel/"]';
  const elementsSRV = Array.from(post.querySelectorAll(querySRV));
  return elementsSRV.length !== 1 ? '' : KeyWords.GF_SHORT_REEL_VIDEO;
}
