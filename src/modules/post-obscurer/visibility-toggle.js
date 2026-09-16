/**
 * Visibility Toggle Submodule
 * Part of FB - Clean My Feeds
 *
 * Provides batch DOM query and visibility attribute toggling for debug mode.
 */

/**
 * Toggles debug visibility attribute across all obscured containers, blocks, and shares
 * using an optimized single-pass DOM query.
 * @param {Object} ctx - Obscurer context { VARS }
 */
export function toggleHiddenElements(ctx) {
  const { VARS } = ctx;
  if (!VARS) return;

  const selectorParts = [];
  if (VARS.hideAtt) selectorParts.push(`[${VARS.hideAtt}]`);
  if (VARS.cssHideEl) selectorParts.push(`[${VARS.cssHideEl}]`);
  if (VARS.cssHideNumberOfShares) selectorParts.push(`[${VARS.cssHideNumberOfShares}]`);

  if (selectorParts.length === 0) return;

  const elements = document.querySelectorAll(selectorParts.join(', '));
  const isDebug = Boolean(VARS.Options && VARS.Options.VERBOSITY_DEBUG);

  for (let i = 0; i < elements.length; i++) {
    if (isDebug) {
      elements[i].setAttribute(VARS.showAtt, '');
    } else {
      elements[i].removeAttribute(VARS.showAtt);
    }
  }
}
