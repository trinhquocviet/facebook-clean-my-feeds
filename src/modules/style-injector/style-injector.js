/**
 * Style Injector Module
 * Part of FB - Clean My Feeds
 *
 * Handles stylesheet creation, dynamic randomized attribute assignment,
 * and button/dialog placement positioning.
 *
 * @module modules/style-injector
 */

import { generateRandomString, buildStylesheet } from '@/utils/index.js';
import { ICON_NEW_WINDOW_CLASS } from '@/constants/index.js';
import {
  getPostHideRules,
  getDialogRules,
  getToggleRules
} from '@/styles/index.js';

/**
 * Creates or updates the dynamic stylesheet with randomized attribute names.
 *
 * @param {Object} VARS - Application state object
 * @param {Document} [doc=document] - DOM document
 */
export function addCSS(VARS, doc = document) {
  let head;
  let elStylesheet;
  let isNewCSS = true;

  if (VARS.cssID !== '') {
    // - Reset the existing Stylesheet
    elStylesheet = doc.getElementById(VARS.cssID);
    if (elStylesheet) {
      elStylesheet.replaceChildren();
      isNewCSS = false;
    }
  }

  if (isNewCSS) {
    // - Create the new Stylesheet head + classnames
    VARS.cssID = generateRandomString().toUpperCase();
    elStylesheet = doc.createElement('style');
    elStylesheet.setAttribute('type', 'text/css');
    elStylesheet.setAttribute('id', VARS.cssID);
    head = doc.getElementsByTagName('head')[0];
    if (head) {
      head.appendChild(elStylesheet);
    }

    // - remember <element> attribute names (for other functions to use)
    VARS.hideAtt = generateRandomString(); // - the parent element - hides the nth level down element
    VARS.hideWithNoCaptionAtt = generateRandomString(); // - the element to hide - where there's no child element
    VARS.cssHideEl = generateRandomString(); // - the element to hide - where there's no child element
    VARS.cssHideNumberOfShares = generateRandomString(); // - hide "# shares" on posts.
    VARS.showAtt = generateRandomString(); // - for revealing hidden elements.
  }

  // Build all CSS rules from declarative modules
  const rules = [
    ...getPostHideRules({
      hideAtt: VARS.hideAtt,
      hideWithNoCaptionAtt: VARS.hideWithNoCaptionAtt,
      showAtt: VARS.showAtt,
      cssHideNumberOfShares: VARS.cssHideNumberOfShares,
    }),
    ...getDialogRules({
      showAtt: VARS.showAtt,
      iconNewWindowClass: ICON_NEW_WINDOW_CLASS,
    }),
    ...getToggleRules({
      showAtt: VARS.showAtt,
    }),
  ];

  const cssText = buildStylesheet(rules, { merge: true });
  if (elStylesheet) {
    elStylesheet.appendChild(doc.createTextNode(cssText));
  }
}

/**
 * Amends stylesheet and DOM elements with button/dialog positioning styles.
 *
 * @param {Object} VARS - Application state object
 * @param {Object} masterKeyWords - Defaults keywords object
 * @param {Document} [doc=document] - DOM document
 */
export function addExtraCSS(VARS, masterKeyWords, doc = document) {
  // -- button location
  let cmfBtnLocation = masterKeyWords?.defaults?.CMF_BTN_OPTION ?? '0';
  // -- dialog location
  let cmfDlgLocation = masterKeyWords?.defaults?.CMF_DIALOG_OPTION ?? '0';

  // -- read in the settings
  if (VARS.Options && Object.prototype.hasOwnProperty.call(VARS.Options, 'CMF_BTN_OPTION')) {
    if (VARS.Options.CMF_BTN_OPTION.toString() !== '') {
      cmfBtnLocation = VARS.Options.CMF_BTN_OPTION;
    }
  }
  if (VARS.Options && Object.prototype.hasOwnProperty.call(VARS.Options, 'CMF_DIALOG_OPTION')) {
    if (VARS.Options.CMF_DIALOG_OPTION.toString() !== '') {
      cmfDlgLocation = VARS.Options.CMF_DIALOG_OPTION;
    }
  }
  cmfBtnLocation = cmfBtnLocation.toString();
  cmfDlgLocation = cmfDlgLocation.toString();

  // Grab the existing Stylesheet and amend it
  const elStylesheet = doc.getElementById(VARS.cssID);

  // --- Set data attributes for CSS position classes ---
  const btnEl = doc.querySelector('.fb-cmf-toggle');
  if (btnEl) {
    const posMap = { '0': 'bottom-left', '1': 'top-right', '2': 'disabled' };
    btnEl.setAttribute('data-cmf-pos', posMap[cmfBtnLocation] || 'bottom-left');
  }

  const dlgEl = doc.getElementById('fbcmf');
  if (dlgEl) {
    dlgEl.setAttribute('data-cmf-dlg', cmfDlgLocation === '1' ? 'right' : 'left');
  }

  // --- Banner navigation fallback (conditional, requires DOM check) ---
  if (cmfBtnLocation === '1' && doc.querySelector('[role="banner"]')) {
    const bannerCSS = buildStylesheet([{
      selector: 'div[role="banner"] > div:last-of-type div[role="navigation"]',
      styles: 'margin-right: 42px;'
    }]);
    if (bannerCSS.length > 0 && elStylesheet) {
      elStylesheet.appendChild(doc.createTextNode(bannerCSS));
    }
  }
}
