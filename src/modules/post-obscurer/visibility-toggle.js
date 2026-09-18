/**
 * Visibility Toggle Submodule
 * Part of FB - Clean My Feeds
 *
 * ## Live Debug Mode Switching
 * When a user toggles "Debug Mode" in the configuration dialog, this submodule executes
 * an immediate, single-pass DOM traversal across all currently hidden elements (posts, blocks,
 * share counters) to apply or remove `showAtt`. This eliminates the need to refresh or
 * re-parse the entire feed.
 *
 * @module modules/post-obscurer/visibility-toggle
 */

/**
 * Builds the combined CSS selector targeting all currently hidden elements and blocks.
 *
 * Combines `hideAtt`, `cssHideEl`, and `cssHideNumberOfShares` into a single query.
 *
 * @param {Object} VARS - Application state
 * @returns {string} Combined CSS selector query string
 */
function buildHiddenElementsSelector(VARS) {
  return [VARS.hideAtt, VARS.cssHideEl, VARS.cssHideNumberOfShares]
    .filter(Boolean)
    .map((attr) => `[${attr}]`)
    .join(', ');
}

/**
 * Toggles debug visibility attributes across all obscured containers, blocks, and share counters
 * using an optimized single-pass DOM query.
 *
 * - When debug mode is active: applies `showAtt` to reveal hidden elements with diagnostic styling.
 * - When debug mode is inactive: removes `showAtt`, returning elements to standard hidden state.
 *
 * @param {Object} ctx - Obscurer context { VARS }
 */
export function toggleHiddenElements(ctx) {
  const { VARS } = ctx;
  if (!VARS) return;

  const selector = buildHiddenElementsSelector(VARS);
  if (!selector) return;

  const elements = document.querySelectorAll(selector);
  const isDebug = Boolean(VARS.Options && VARS.Options.VERBOSITY_DEBUG);

  for (const element of elements) {
    if (isDebug) {
      element.setAttribute(VARS.showAtt, '');
    } else {
      element.removeAttribute(VARS.showAtt);
    }
  }
}
