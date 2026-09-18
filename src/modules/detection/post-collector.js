/**
 * Post Collector Module
 * Part of FB - Clean My Feeds
 *
 * Discovers and queries post container elements in the News Feed stream,
 * handling custom tags (e.g. `[a-zA-Z0-9]+-[a-zA-Z0-9]+`) and multi-tier
 * query selector fallbacks across different Facebook layouts.
 *
 * @module modules/detection/post-collector
 */

/**
 * Queries the document to collect active news feed post elements.
 *
 * @param {Document} [doc=document] - DOM document
 * @returns {Array<HTMLElement>} Array of post elements
 */
export function nf_getCollectionOfPosts(doc = document) {
  let posts = [];
  const rootSelector = '[dir=auto]:is(h2, h3) ~ div:not([class])';

  // Detect randomized customTag format (e.g. ybrgmpsb-unlrhoua)
  const customTagSelector = `${rootSelector} [class="x1lliihq"]:is(div, span)~*:not(div, span)`;
  const detectedElement = doc.querySelector(customTagSelector);
  const detectedTagName = detectedElement?.tagName || '';
  const customTag = /[a-zA-Z0-9]+-[a-zA-Z0-9]+/.test(detectedTagName) ? detectedTagName.toLowerCase() : '';

  const queries = [
    ...(customTag.length > 0
      ? [
          Array.from({ length: 10 }, () => '*:is(span, div)').reduce(
            (prv, s) => `${prv} > ${s}`,
            `${rootSelector} ${customTag}`
          )
        ]
      : [
          Array.from({ length: 4 }, () => '*:is(span, div)').reduce(
            (prv, s) => `${prv} > ${s}`,
            `${rootSelector} [class="x1lliihq"]:is(div, span)`
          ),
          Array.from({ length: 5 }, () => '*:is(span, div)').reduce(
            (prv, s) => `${prv} > ${s}`,
            rootSelector
          ),
          Array.from({ length: 5 }, () => '*:is(span, div)').reduce(
            (prv, s) => `${prv} > ${s}`,
            `${rootSelector} > * * * * *`
          )
        ]),

    // Mostly non-English users fallbacks
    'div[role="feed"] > h3[dir="auto"] ~ div:not([class]) > div[data-pagelet*="FeedUnit_"] > div > div > div > div',
    'div[role="feed"] > h2[dir="auto"] ~ div:not([class]) > div[data-pagelet*="FeedUnit_"] > div > div > div > div'
  ];

  for (const query of queries) {
    const nodeList = doc.querySelectorAll(query);
    if (nodeList.length > 0) {
      posts = Array.from(nodeList);
      break;
    }
  }

  return posts;
}
