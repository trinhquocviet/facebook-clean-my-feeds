/**
 * Visibility Toggle Submodule
 * Part of FB - Clean My Feeds
 *
 * Provides batch DOM query and visibility attribute toggling for debug mode.
 */

/**
 * Builds the combined CSS selector targeting hidden post containers.
 * @param {Object} VARS - Application state
 * @returns {string} Selector query string
 */
function buildHiddenElementsSelector(VARS) {
  return [VARS.hideAtt, VARS.cssHideEl, VARS.cssHideNumberOfShares]
    .filter(Boolean)
    .map((attr) => `[${attr}]`)
    .join(', ');
}

/**
 * Toggles debug visibility attribute across all obscured containers, blocks, and shares
 * using an optimized single-pass DOM query.
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
