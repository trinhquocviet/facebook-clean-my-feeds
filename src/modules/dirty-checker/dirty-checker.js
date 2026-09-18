/**
 * Dirty Checker Module
 * Part of FB - Clean My Feeds
 *
 * Detects whether the feed container or active dialogs have changed in size
 * using innerHTML length comparisons.
 *
 * @module modules/dirty-checker
 */

import { hasSizeChanged } from '@/utils/index.js';
import { mainColumnAtt } from '@/constants/index.js';

/**
 * Checks if News Feed main column or article modal dialog has changed in size.
 *
 * ## Mechanism
 * Instead of observing thousands of micro-mutations via MutationObserver, the userscript
 * queries key root feed landmarks and compares their `innerHTML.length` against the value
 * stamped on `mainColumnAtt`.
 *
 * Uses `hasSizeChanged(previousLength, currentLength)` which enforces a 16-character tolerance
 * threshold: minor fluctuations (e.g. timestamp updates like "1m" -> "2m" or like counter increments)
 * are ignored to prevent unnecessary full-feed scan sweeps.
 *
 * @param {Object} VARS - Application state (increments `noChangeCounter` on clean ticks)
 * @param {Document} [doc=document] - DOM document
 * @returns {Array<HTMLElement|null>} `[mainColumn, elDialog]` tuple where non-null indicates dirty
 */
export function isTheHouseDirty(VARS, doc = document) {
  const arrReturn = [null, null];

  // Primary News Feed stream column (adjacent to navigation)
  const mainColumnQuery = 'div[role="navigation"] ~ div[role="main"]';
  const mainColumn = doc.querySelector(mainColumnQuery);
  if (mainColumn) {
    if (mainColumn.hasAttribute(mainColumnAtt) === false) {
      arrReturn[0] = mainColumn;
    } else if (hasSizeChanged(mainColumn.getAttribute(mainColumnAtt), mainColumn.innerHTML.length)) {
      arrReturn[0] = mainColumn;
    }
  }

  // Active photo/post media dialog overlay
  const elDialog = doc.querySelector('div[role="dialog"]');
  if (elDialog) {
    if (elDialog.hasAttribute(mainColumnAtt) === false) {
      arrReturn[1] = elDialog;
    } else if (hasSizeChanged(elDialog.getAttribute(mainColumnAtt), elDialog.innerHTML.length)) {
      arrReturn[1] = elDialog;
    }
  }

  VARS.noChangeCounter++;
  return arrReturn;
}

/**
 * Checks if Groups Feed main column or dialog has changed in size.
 *
 * Supports both multi-group aggregated feeds (`div[role="navigation"] ~ div[role="main"]`)
 * and dedicated single group wall pages (`div[role="main"] div[role="feed"]`).
 *
 * @param {Object} VARS - Application state
 * @param {Document} [doc=document] - DOM document
 * @returns {Array<HTMLElement|null>} `[mainColumn, elDialog]` tuple
 */
export function gf_isTheHouseDirty(VARS, doc = document) {
  const arrReturn = [null, null];

  const mainColumnQuery = 'div[role="navigation"] ~ div[role="main"]';
  const mainColumn = doc.querySelector(mainColumnQuery);
  if (mainColumn) {
    if (mainColumn.hasAttribute(mainColumnAtt) === false) {
      arrReturn[0] = mainColumn;
    } else if (hasSizeChanged(mainColumn.getAttribute(mainColumnAtt), mainColumn.innerHTML.length)) {
      arrReturn[0] = mainColumn;
    }
  } else {
    // Single group profile feed container
    const mainColumnQueryGP = 'div[role="main"] div[role="feed"]';
    const mainColumnGP = doc.querySelector(mainColumnQueryGP);
    if (mainColumnGP) {
      if (mainColumnGP.hasAttribute(mainColumnAtt) === false) {
        arrReturn[0] = mainColumnGP;
      } else if (hasSizeChanged(mainColumnGP.getAttribute(mainColumnAtt), mainColumnGP.innerHTML.length)) {
        arrReturn[0] = mainColumnGP;
      }
    }
  }

  // Check active modal dialog
  const elDialog = doc.querySelector('div[role="dialog"]');
  if (elDialog) {
    if (elDialog.hasAttribute(mainColumnAtt) === false) {
      arrReturn[1] = elDialog;
    } else if (hasSizeChanged(elDialog.getAttribute(mainColumnAtt), elDialog.innerHTML.length)) {
      arrReturn[1] = elDialog;
    }
  }

  VARS.noChangeCounter++;
  return arrReturn;
}

/**
 * Checks if Marketplace feed or viewing item container has changed in size.
 *
 * ## Item View Dialog Quirks
 * When inspecting a Marketplace item, Facebook often sets `[hidden]` on the background
 * container and mounts a sibling dialog: `div[hidden] ~ div[class*="__"] div[role="dialog"]`.
 * This checker probes both the floating dialog and the persistent main column.
 *
 * @param {Object} VARS - Application state
 * @param {Document} [doc=document] - DOM document
 * @returns {HTMLElement|null} Changed container element, or null if clean
 */
export function mp_isTheHouseDirty(VARS, doc = document) {
  if (VARS.mpType === 'item') {
    // Floating item details dialog mounted over hidden background
    const mainColumnDM = doc.querySelector('div[hidden] ~ div[class*="__"] div[role="dialog"]');
    if (mainColumnDM) {
      if (mainColumnDM.hasAttribute(mainColumnAtt)) {
        if (hasSizeChanged(mainColumnDM.getAttribute(mainColumnAtt), mainColumnDM.innerHTML.length)) {
          return mainColumnDM;
        }
      } else {
        return mainColumnDM;
      }
    }

    // Fallback: persistent Marketplace item layout
    const mainColumnPM = doc.querySelector('div[role="navigation"] ~ div[role="main"]');
    if (mainColumnPM) {
      if (mainColumnPM.hasAttribute(mainColumnAtt)) {
        if (hasSizeChanged(mainColumnPM.getAttribute(mainColumnAtt), mainColumnPM.innerHTML.length.toString())) {
          return mainColumnPM;
        }
      } else {
        return mainColumnPM;
      }
    }
  } else {
    // Browse / Category / Landing feed
    const mainColumn = doc.querySelector(`[${mainColumnAtt}]`);
    if (mainColumn) {
      if (hasSizeChanged(mainColumn.getAttribute(mainColumnAtt), mainColumn.innerHTML.length)) {
        return mainColumn;
      }
    } else {
      const query = 'div[role="navigation"] ~ div[role="main"]';
      const mainColumnEl = doc.querySelector(query);
      if (mainColumnEl) {
        return mainColumnEl;
      }
    }
  }

  VARS.noChangeCounter++;
  return null;
}

/**
 * Checks if Search Feed results column has changed in size.
 *
 * Search results mount under `div[role="region"] ~ div[role="main"]`.
 *
 * @param {Object} VARS - Application state
 * @param {Document} [doc=document] - DOM document
 * @returns {HTMLElement|null} Changed search container element, or null if clean
 */
export function sf_isTheHouseDirty(VARS, doc = document) {
  const query = 'div[role="region"] ~ div[role="main"]';
  const mainColumn = doc.querySelector(query);
  if (mainColumn) {
    if (mainColumn.hasAttribute(mainColumnAtt) === false) {
      return mainColumn;
    }
    if (hasSizeChanged(mainColumn.getAttribute(mainColumnAtt), mainColumn.innerHTML.length)) {
      return mainColumn;
    }
  }

  VARS.noChangeCounter++;
  return null;
}

/**
 * Checks if Videos Feed main column or item dialog has changed in size.
 *
 * Queries nested video streams and selects the innermost main container
 * (`mainColumns[mainColumns.length - 1]`).
 *
 * @param {Object} VARS - Application state
 * @param {Document} [doc=document] - DOM document
 * @returns {Array<HTMLElement|null>} `[mainColumn, elDialog]` tuple
 */
export function vf_isTheHouseDirty(VARS, doc = document) {
  const arrReturn = [null, null];

  const mainColumnQuery = 'div[role="navigation"] ~ div[role="main"] div[role="main"] > div > div > div > div > div';
  const mainColumns = doc.querySelectorAll(mainColumnQuery);
  let mainColumn = null;
  if (mainColumns.length > 0) {
    mainColumn = mainColumns[mainColumns.length - 1];
  }
  if (mainColumn) {
    if (mainColumn.hasAttribute(mainColumnAtt) === false) {
      arrReturn[0] = mainColumn;
    } else if (hasSizeChanged(mainColumn.getAttribute(mainColumnAtt), mainColumn.innerHTML.length)) {
      arrReturn[0] = mainColumn;
    }
  }

  const elDialog = doc.querySelector('div[role="dialog"] div[role="main"]');
  if (elDialog) {
    if (elDialog.hasAttribute(mainColumnAtt) === false) {
      arrReturn[1] = elDialog;
    } else if (hasSizeChanged(elDialog.getAttribute(mainColumnAtt), elDialog.innerHTML.length)) {
      arrReturn[1] = elDialog;
    }
  }

  VARS.noChangeCounter++;
  return arrReturn;
}

/**
 * Checks if Profile Page feed or dialog has changed in size.
 *
 * Monitors `div[role="main"]` and active media dialogs on user profile timelines.
 *
 * @param {Object} VARS - Application state
 * @param {Document} [doc=document] - DOM document
 * @returns {Array<HTMLElement|null>} `[mainColumn, elDialog]` tuple
 */
export function pp_isTheHouseDirty(VARS, doc = document) {
  const arrReturn = [null, null];

  const mainColumnQuery = 'div[role="main"]';
  const mainColumn = doc.querySelector(mainColumnQuery);
  if (mainColumn) {
    if (mainColumn.hasAttribute(mainColumnAtt) === false) {
      arrReturn[0] = mainColumn;
    } else if (hasSizeChanged(mainColumn.getAttribute(mainColumnAtt), mainColumn.innerHTML.length)) {
      arrReturn[0] = mainColumn;
    }
  }

  const elDialog = doc.querySelector('div[role="dialog"]');
  if (elDialog) {
    if (elDialog.hasAttribute(mainColumnAtt) === false) {
      arrReturn[1] = elDialog;
    } else if (hasSizeChanged(elDialog.getAttribute(mainColumnAtt), elDialog.innerHTML.length)) {
      arrReturn[1] = elDialog;
    }
  }

  VARS.noChangeCounter++;
  return arrReturn;
}
