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
 * Checks if News Feed main column or article dialog has changed.
 *
 * @param {Object} VARS - Application state
 * @param {Document} [doc=document] - DOM document
 * @returns {Array<HTMLElement|null>} [mainColumn, elDialog]
 */
export function isTheHouseDirty(VARS, doc = document) {
  const arrReturn = [null, null];

  // -- main column / content (feed)
  const mainColumnQuery = 'div[role="navigation"] ~ div[role="main"]';
  const mainColumn = doc.querySelector(mainColumnQuery);
  if (mainColumn) {
    if (mainColumn.hasAttribute(mainColumnAtt) === false) {
      arrReturn[0] = mainColumn;
    } else if (hasSizeChanged(mainColumn.getAttribute(mainColumnAtt), mainColumn.innerHTML.length)) {
      arrReturn[0] = mainColumn;
    }
  }

  // -- dialog (article popup)
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
 * Checks if Groups Feed main column or dialog has changed.
 *
 * @param {Object} VARS - Application state
 * @param {Document} [doc=document] - DOM document
 * @returns {Array<HTMLElement|null>} [mainColumn, elDialog]
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
    // -- inside a group profile ...
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

  // -- dialog (article popup)
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
 * Checks if Marketplace feed or viewing item container has changed.
 *
 * @param {Object} VARS - Application state
 * @param {Document} [doc=document] - DOM document
 * @returns {HTMLElement|null}
 */
export function mp_isTheHouseDirty(VARS, doc = document) {
  if (VARS.mpType === 'item') {
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
 * Checks if Search Feed results column has changed.
 *
 * @param {Object} VARS - Application state
 * @param {Document} [doc=document] - DOM document
 * @returns {HTMLElement|null}
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
 * Checks if Videos Feed main column or item dialog has changed.
 *
 * @param {Object} VARS - Application state
 * @param {Document} [doc=document] - DOM document
 * @returns {Array<HTMLElement|null>} [mainColumn, elDialog]
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
 * Checks if Profile Page feed or dialog has changed.
 *
 * @param {Object} VARS - Application state
 * @param {Document} [doc=document] - DOM document
 * @returns {Array<HTMLElement|null>} [mainColumn, elDialog]
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
