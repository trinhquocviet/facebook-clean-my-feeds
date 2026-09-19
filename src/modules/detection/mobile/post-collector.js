/**
 * Mobile feed cell collector.
 * Discovers top-level feed elements in the m.facebook.com WebLite DOM tree.
 *
 * @module modules/detection/mobile/post-collector
 */

/**
 * Collects all direct top-level cell elements under the mobile virtual scroller.
 * Intentionally does NOT filter on `.displayed` to ensure off-screen and buffered
 * cells are pre-classified and obscured before entering the viewport.
 *
 * @param {Document|HTMLElement} [doc=document] - DOM document or root node
 * @returns {Array<HTMLElement>} List of top-level feed cell elements
 */
export function m_getCollectionOfCells(doc = (typeof document !== 'undefined' ? document : null)) {
  if (!doc) return [];

  // Primary: direct vscroller container
  const vscroller =
    doc.querySelector?.('div[data-type="vscroller"][data-mcomponent="MContainer"]') ||
    doc.querySelector?.('div[data-type="vscroller"]') ||
    doc.querySelector?.('[data-type="vscroller"]');

  if (vscroller && vscroller.children) {
    return Array.from(vscroller.children).filter(
      (el) => el.nodeType === 1 && el.tagName === 'DIV' && el.classList?.contains?.('m')
    );
  }

  // Fallback: search within screen-root
  const screenRoot = doc.getElementById?.('screen-root') || doc.querySelector?.('#screen-root');
  if (screenRoot) {
    const innerVscroller = screenRoot.querySelector?.('div[data-type="vscroller"]');
    if (innerVscroller && innerVscroller.children) {
      return Array.from(innerVscroller.children).filter(
        (el) => el.nodeType === 1 && el.tagName === 'DIV' && el.classList?.contains?.('m')
      );
    }
  }

  return [];
}
