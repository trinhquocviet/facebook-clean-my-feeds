/**
 * Dialog Actions Module
 * Handles save, export, import, and reset operations for user options.
 * Part of FB - Clean My Feeds
 */

import { set, del } from 'idb-keyval';
import { createDialog } from './createDialog.js';
import { updateDialog } from './updateDialog.js';

const REQUIRED_CONFIG_KEYS = ['NF_SPONSORED', 'GF_SPONSORED', 'VF_SPONSORED', 'MP_SPONSORED'];

const FEED_REMOP_STRATEGY = [
  ['isNF', 'mopUpTheNewsFeed'],
  ['isGF', 'mopUpTheGroupsFeed'],
  ['isVF', 'mopUpTheWatchVideosFeed'],
  ['isMF', 'mopUpTheMarketplaceFeed'],
  ['isSF', 'mopUpTheSearchFeed'],
  ['isRF', 'mopUpTheReelFeed'],
];

/**
 * Validates likes input if NF_LIKES_MAXIMUM is enabled.
 * @param {HTMLElement} dialogEl - Dialog DOM element
 * @param {Object} KeyWords - Dictionary of translated strings
 * @returns {boolean} True if valid, false if invalid
 */
function validateLikesInput(dialogEl, KeyWords) {
  const elLikesMaximum = dialogEl.querySelector('input[name="NF_LIKES_MAXIMUM"]');
  if (elLikesMaximum && elLikesMaximum.checked) {
    const elLikesMaximumCount = dialogEl.querySelector('input[name="NF_LIKES_MAXIMUM_COUNT"]');
    if (elLikesMaximumCount && elLikesMaximumCount.value.length === 0) {
      alert(`${KeyWords.NF_LIKES_MAXIMUM}?`);
      elLikesMaximumCount.focus();
      return false;
    }
  }
  return true;
}

/**
 * Collects form field values from the dialog and updates VARS.Options in place.
 * @param {HTMLElement} dialogEl - Dialog root element
 * @param {Object} VARS - Application state containing Options and SEP
 */
function collectDialogValues(dialogEl, VARS) {
  // -- Checkboxes
  const cbs = dialogEl.querySelectorAll('input[type="checkbox"][cbtype="T"]');
  cbs.forEach((cb) => {
    VARS.Options[cb.name] = cb.checked;
  });

  // -- Radio buttons
  const rbs = dialogEl.querySelectorAll('input[type="radio"]:checked');
  rbs.forEach((rb) => {
    VARS.Options[rb.name] = rb.value;
  });

  // -- Text inputs
  const inputs = dialogEl.querySelectorAll('input[type="text"]');
  inputs.forEach((inp) => {
    VARS.Options[inp.name] = inp.value;
  });

  // -- Textareas (split by line and filter blank lines, preserve original line spaces)
  const tas = dialogEl.querySelectorAll('textarea');
  tas.forEach((ta) => {
    const lines = ta.value.split('\n').filter((txt) => txt.trim().length > 0);
    VARS.Options[ta.name] = lines.join(VARS.SEP);
  });

  // -- Select dropdowns
  const selects = dialogEl.querySelectorAll('select');
  selects.forEach((select) => {
    VARS.Options[select.name] = select.value;
  });
}

/**
 * Removes obsolete or deleted keys from VARS.Options that are no longer present in the dialog DOM.
 * @param {HTMLElement} dialogEl - Dialog root element
 * @param {Object} VARS - Application state
 * @param {string} logPrefix - Logging prefix
 */
function pruneStaleKeys(dialogEl, VARS, logPrefix) {
  if (!dialogEl) return;
  const elements = dialogEl.querySelectorAll('input:not([type="file"]), textarea, select');
  const validNames = new Set();
  elements.forEach((el) => {
    if (el.name) validNames.add(el.name);
  });

  for (const key in VARS.Options) {
    if (!validNames.has(key)) {
      if (VARS.Options.VERBOSITY_DEBUG) {
        console.info(`${logPrefix}saveUserOptions(); Deleting key:`, key);
      }
      delete VARS.Options[key];
    }
  }
}

/**
 * Persists current options to IndexedDB and refreshes in-memory settings.
 * @param {Object} ctx - Application context
 * @returns {Promise<boolean>} True if successfully saved, false otherwise
 */
async function persistOptions(ctx) {
  const { DBVARS, VARS, getUserOptions, log } = ctx;
  try {
    await set(DBVARS.DBKey, JSON.stringify(VARS.Options), DBVARS.ostore);
    await getUserOptions();
    if (VARS.Options.VERBOSITY_DEBUG) {
      console.info(`${log}saveUserOptions() > set() -> Saved: true`);
    }
    return true;
  } catch (err) {
    console.info(`${log}saveUserOptions() > set() -> Error:`, err);
    return false;
  }
}

/**
 * Purges hidden post artifacts and resets attributes across feed items.
 * @param {Object} ctx - Application context
 */
function purgeHiddenPostArtifacts(ctx) {
  const {
    VARS,
    postAtt,
    postAttTab,
    postAttCPID,
    postAttChildFlag,
  } = ctx;

  // -- Reset scan counts
  VARS.scanCountStart += 100;
  VARS.scanCountMaxLoop += 100;

  // -- Purge hidden post captions (move div out of <details> before removing)
  const details = document.querySelectorAll(`details[${postAtt}]`);
  for (const element of details) {
    const elParent = element.parentElement;
    const elContent = element.lastElementChild;
    if (elContent && elContent.tagName === 'DIV') {
      elParent.appendChild(elContent);
    }
    elParent.removeChild(element);
  }

  // -- Purge mini-captions
  const miniCaptions = document.querySelectorAll(`h6[${postAttTab}]`);
  for (const miniCaption of miniCaptions) {
    miniCaption.parentElement.removeChild(miniCaption);
  }

  // -- Remove post attributes
  const postElements = document.querySelectorAll(`[${postAtt}]`);
  for (const element of postElements) {
    element.removeAttribute(postAtt);
    element.removeAttribute(VARS.hideAtt);
    element.removeAttribute(VARS.cssHideEl);
    element.removeAttribute(VARS.cssHideNumberOfShares);
    element.removeAttribute(VARS.showAtt);
  }

  // -- Remove CPID and ChildFlag attributes
  const cpidElements = document.querySelectorAll(`[${postAttCPID}], [${postAttChildFlag}]`);
  for (const element of cpidElements) {
    element.removeAttribute(postAttCPID);
    element.removeAttribute(postAttChildFlag);
  }

  // -- Remove residual hide/show attributes
  const hiddenElements = document.querySelectorAll(
    `[${VARS.hideAtt}], [${VARS.cssHideEl}], [${VARS.cssHideNumberOfShares}]`
  );
  for (const element of hiddenElements) {
    element.removeAttribute(VARS.hideAtt);
    element.removeAttribute(VARS.cssHideEl);
    element.removeAttribute(VARS.cssHideNumberOfShares);
    element.removeAttribute(VARS.showAtt);
  }
}

/**
 * Triggers mop-up action on the active feed using the strategy pattern.
 * @param {Object} ctx - Application context
 */
function remopCurrentFeed(ctx) {
  const { VARS } = ctx;
  for (const [flag, actionName] of FEED_REMOP_STRATEGY) {
    if (VARS[flag] && typeof ctx[actionName] === 'function') {
      if (flag === 'isRF') {
        ctx[actionName]('saveUserOptions');
      } else {
        ctx[actionName]();
      }
      break;
    }
  }
}

/**
 * Refreshes styles, DOM attributes, and feeds after user options are saved.
 * @param {Object} ctx - Application context
 * @param {boolean} languageChanged - Whether language changed during this save
 */
function refreshAfterSave(ctx, languageChanged) {
  const {
    VARS,
    mainColumnAtt,
    setFeedSettings,
    addCSS,
    addExtraCSS,
    toggleHiddenElements,
  } = ctx;

  if (languageChanged) {
    createDialog(true, ctx);
  }

  setFeedSettings(true);
  addCSS();
  addExtraCSS();

  // -- Reset main-column watcher
  const elements = document.querySelectorAll(`[${mainColumnAtt}]`);
  for (const element of elements) {
    element.removeAttribute(mainColumnAtt);
  }

  toggleHiddenElements();

  const fileResultsEl = document.querySelector('#fbcmf .fileResults');
  if (fileResultsEl) {
    fileResultsEl.textContent = `Last Saved @ ${new Date().toTimeString().slice(0, 8)}`;
  }

  if (VARS.isAF) {
    purgeHiddenPostArtifacts(ctx);
    remopCurrentFeed(ctx);
  }
}

/**
 * Validates whether an imported object contains required options.
 * @param {any} content - Parsed JSON object
 * @returns {boolean} True if valid configuration
 */
function isValidImportConfig(content) {
  return (
    content !== null &&
    typeof content === 'object' &&
    REQUIRED_CONFIG_KEYS.every((key) => Object.prototype.hasOwnProperty.call(content, key))
  );
}

/**
 * Saves current dialog options to IndexedDB and triggers re-filtering.
 * @param {Event|null} event - Triggering event
 * @param {Object} ctx - Context object
 * @param {string} [source='dialog'] - Source of save ('dialog', 'file', 'reset')
 * @returns {Promise<void>}
 */
export async function saveUserOptions(event, ctx, source = 'dialog') {
  const { VARS, KeyWords, log } = ctx;
  let languageChanged = false;

  if (source === 'dialog') {
    const dialogEl = document.getElementById('fbcmf');
    if (!dialogEl) return;

    if (!validateLikesInput(dialogEl, KeyWords)) {
      return;
    }

    collectDialogValues(dialogEl, VARS);
    languageChanged = VARS.language !== VARS.Options.CMF_DIALOG_LANGUAGE;
  } else if (source === 'reset') {
    languageChanged = true;
  }

  const dialogEl = document.getElementById('fbcmf');
  pruneStaleKeys(dialogEl, VARS, log);

  const saved = await persistOptions(ctx);
  if (saved) {
    refreshAfterSave(ctx, languageChanged);
  }
}

/**
 * Exports current options to a downloadable JSON file.
 * @param {Object} ctx - Context object
 */
export function exportUserOptions(ctx) {
  const { VARS } = ctx;
  const exportBlob = new Blob([JSON.stringify(VARS.Options)], { type: 'text/plain' });
  const exportUrl = window.URL.createObjectURL(exportBlob);

  const exportLink = document.createElement('a');
  exportLink.href = exportUrl;
  exportLink.download = 'fb - clean my feeds - settings.json';
  exportLink.click();
  exportLink.remove();
  if (typeof window.URL?.revokeObjectURL === 'function') {
    window.URL.revokeObjectURL(exportUrl);
  }

  const fileResultsEl = document.querySelector('#fbcmf .fileResults');
  if (fileResultsEl) {
    fileResultsEl.textContent = 'Exported: fb - clean my feeds - settings.json';
  }
}

/**
 * Imports options from a user-provided JSON file.
 * @param {Event} event - File input change event
 * @param {Object} ctx - Context object
 */
export function importUserOptions(event, ctx) {
  const { VARS } = ctx;
  const fileResults = document.querySelector('#fbcmf .fileResults');
  const file = event?.target?.files?.[0];
  if (!file) return;

  const fileName = file.name;
  const reader = new FileReader();

  reader.onload = (fileEvent) => {
    try {
      const fileContent = JSON.parse(fileEvent.target.result);
      if (isValidImportConfig(fileContent)) {
        VARS.Options = fileContent;
        saveUserOptions(null, ctx, 'file').then(() => {
          updateDialog(ctx);
          if (fileResults) {
            fileResults.textContent = `File imported: ${fileName}`;
          }
        });
      } else if (fileResults) {
        fileResults.textContent = `File NOT imported: ${fileName}`;
      }
    } catch {
      if (fileResults) {
        fileResults.textContent = `File NOT imported: ${fileName}`;
      }
    }
  };

  reader.readAsText(file);
}

/**
 * Resets options to default state by deleting stored preferences in IndexedDB.
 * @param {Object} ctx - Context object
 */
export function resetUserOptions(ctx) {
  const { DBVARS, VARS, setLanguageAndOptions, log } = ctx;
  del(DBVARS.DBKey, DBVARS.ostore)
    .then(() => {
      VARS.Options.CMF_DIALOG_LANGUAGE = '';
      setLanguageAndOptions();
      saveUserOptions(null, ctx, 'reset').then(() => {
        updateDialog(ctx);
      });
    })
    .catch((error) => {
      console.info(`${log}resetUserOptions(); Error - unable to delete Data.`, error);
    });
}
