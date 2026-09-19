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
 * Creates or updates the dynamic userscript stylesheet with randomized attribute names.
 *
 * ## Anti-Detection & Stealth Design
 * Facebook scripts actively monitor the DOM for known adblocking or extension markers.
 * If static attribute names (like `data-hidden` or `data-cmf-ad`) were used, Facebook's scripts
 * could query them, hide extension controls, or alert users.
 *
 * To remain stealthy:
 * 1. Each session generates cryptographically isolated random alphanumeric attribute names:
 *    - `VARS.hideAtt`: Marks parent post container to hide internal contents via CSS.
 *    - `VARS.hideWithNoCaptionAtt`: Hides container elements directly (e.g. Marketplace item cards).
 *    - `VARS.cssHideEl`: Hides secondary ad blocks and banners.
 *    - `VARS.cssHideNumberOfShares`: Hides share count counters.
 *    - `VARS.showAtt`: Overrides hiding rules during debug inspection mode.
 * 2. Compiles declarative CSS rules from `styles/index.js`, interpolating the randomized attributes.
 * 3. Injects or replaces the stylesheet inside `document.head`.
 *
 * @param {Object} VARS - Application state object
 * @param {Document} [doc=document] - DOM document
 */
export function addCSS(VARS, doc = document) {
  let head;
  let elStylesheet;
  let isNewCSS = true;

  if (VARS.cssID !== '') {
    // Reset the existing stylesheet without removing node from DOM
    elStylesheet = doc.getElementById(VARS.cssID);
    if (elStylesheet) {
      elStylesheet.replaceChildren();
      isNewCSS = false;
    }
  }

  if (isNewCSS) {
    // Generate new random stylesheet ID and attribute tokens
    VARS.cssID = generateRandomString().toUpperCase();
    elStylesheet = doc.createElement('style');
    elStylesheet.setAttribute('type', 'text/css');
    elStylesheet.setAttribute('id', VARS.cssID);
    head = doc.getElementsByTagName('head')[0];
    if (head) {
      head.appendChild(elStylesheet);
    }

    // Assign randomized attributes for session stealth
    VARS.hideAtt = generateRandomString(); // Parent post hide attribute
    VARS.hideWithNoCaptionAtt = generateRandomString(); // Direct element hide (no caption)
    VARS.cssHideEl = generateRandomString(); // Generic block hide attribute
    VARS.cssHideNumberOfShares = generateRandomString(); // Shares counter hide attribute
    VARS.showAtt = generateRandomString(); // Debug reveal attribute
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
 * Amends stylesheet and DOM elements with button and dialog positioning styles.
 *
 * ## Layout Offsets
 * - Maps `CMF_BTN_OPTION` (0: bottom-left, 1: top-right, 2: disabled) to `data-cmf-pos`.
 * - Maps `CMF_DIALOG_OPTION` (0: left, 1: right) to `data-cmf-dlg`.
 * - When top-right placement is selected, dynamically injects a `margin-right: 42px;` offset
 *   into Facebook's top banner navigation (`[role="banner"]`) so the toggle button does not
 *   overlap the user's notification bell or account menu.
 *
 * @param {Object} VARS - Application state object
 * @param {Object} masterKeyWords - Defaults keywords object containing option defaults
 * @param {Document} [doc=document] - DOM document
 */
export function addExtraCSS(VARS, masterKeyWords, doc = document) {
  // Read configured or default button location (0: bottom-left, 1: top-right, 2: disabled)
  let cmfBtnLocation = masterKeyWords?.defaults?.CMF_BTN_OPTION ?? '0';
  // Read configured or default dialog location (0: left, 1: right)
  let cmfDlgLocation = masterKeyWords?.defaults?.CMF_DIALOG_OPTION ?? '0';

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

  // Grab the existing stylesheet to append conditional offset rules
  const elStylesheet = doc.getElementById(VARS.cssID);

  // Set data attributes for CSS positioning classes
  const posMap = { '0': 'bottom-left', '1': 'top-right', '2': 'disabled' };
  const posValue = posMap[cmfBtnLocation] || 'bottom-left';

  const btnEl = doc.querySelector('.fb-cmf-toggle');
  if (btnEl) {
    btnEl.setAttribute('data-cmf-pos', posValue);
  }
  if (doc.documentElement) {
    doc.documentElement.setAttribute('data-cmf-pos', posValue);
  }

  const dlgEl = doc.getElementById('fbcmf');
  if (dlgEl) {
    dlgEl.setAttribute('data-cmf-dlg', cmfDlgLocation === '1' ? 'right' : 'left');
  }

  // If top-right button location is chosen, shift FB banner icons left by 42px to prevent collision
  if (cmfBtnLocation === '1' && elStylesheet) {
    const bannerSelector = 'div[role="banner"] > div:last-of-type div[role="navigation"]';
    const stylesheetContent = elStylesheet.textContent || '';
    if (!stylesheetContent.includes(bannerSelector)) {
      const bannerCSS = buildStylesheet([{
        selector: bannerSelector,
        styles: 'margin-right: 42px;'
      }]);
      if (bannerCSS.length > 0) {
        elStylesheet.appendChild(doc.createTextNode(bannerCSS));
      }
    }
  }
}
