/**
 * Mobile Dirty Checker Module
 * Part of FB - Clean My Feeds
 *
 * Detects whether the mobile virtual scroller or dialogs have changed in size.
 *
 * @module modules/dirty-checker/mobile-dirty-checker
 */

import { hasSizeChanged } from '@/utils/index.js';
import { mainColumnAtt } from '@/constants/index.js';

/**
 * Checks if the mobile virtual scroller or dialog overlay has changed in size.
 *
 * @param {Object} VARS - Application state
 * @param {Document} [doc=document] - DOM document
 * @returns {Array<HTMLElement|null>} `[mainColumn, elDialog]` tuple
 */
export function m_isTheHouseDirty(VARS, doc = (typeof document !== 'undefined' ? document : null)) {
  const arrReturn = [null, null];
  if (!doc) return arrReturn;

  const vscroller =
    doc.querySelector?.('div[data-type="vscroller"][data-mcomponent="MContainer"]') ||
    doc.querySelector?.('div[data-type="vscroller"]') ||
    doc.querySelector?.('[data-type="vscroller"]');

  if (vscroller) {
    if (vscroller.hasAttribute(mainColumnAtt) === false) {
      arrReturn[0] = vscroller;
    } else if (hasSizeChanged(vscroller.getAttribute(mainColumnAtt), vscroller.innerHTML?.length || 0)) {
      arrReturn[0] = vscroller;
    }
  }

  // Mobile modal dialog or photo viewer
  const elDialog = doc.querySelector?.('div[role="dialog"]');
  if (elDialog) {
    if (elDialog.hasAttribute(mainColumnAtt) === false) {
      arrReturn[1] = elDialog;
    } else if (hasSizeChanged(elDialog.getAttribute(mainColumnAtt), elDialog.innerHTML?.length || 0)) {
      arrReturn[1] = elDialog;
    }
  }

  if (VARS) {
    VARS.noChangeCounter = (VARS.noChangeCounter || 0) + 1;
  }
  return arrReturn;
}
