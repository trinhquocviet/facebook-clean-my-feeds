/**
 * Dialog Actions Module
 * Handles save, export, import, and reset operations for user options.
 * Part of FB - Clean My Feeds
 */

import { set, del } from 'idb-keyval';
import { createDialog } from './createDialog.js';
import { updateDialog } from './updateDialog.js';

/**
 * Saves current dialog options to IndexedDB and triggers re-filtering
 * @param {Event|null} event - Triggering event
 * @param {Object} ctx - Context object
 * @param {string} [source='dialog'] - Source of save ('dialog', 'file', 'reset')
 * @returns {Promise<void>}
 */
export async function saveUserOptions(event, ctx, source = 'dialog') {
  const {
    VARS,
    KeyWords,
    DBVARS,
    postAtt,
    postAttTab,
    postAttCPID,
    postAttChildFlag,
    mainColumnAtt,
    log,
    getUserOptions,
    setFeedSettings,
    addCSS,
    addExtraCSS,
    toggleHiddenElements,
    mopUpTheNewsFeed,
    mopUpTheGroupsFeed,
    mopUpTheWatchVideosFeed,
    mopUpTheMarketplaceFeed,
    mopUpTheSearchFeed,
    mopUpTheReelFeed
  } = ctx;

  // -- save Options in indexeddb as JSON.
  let languageChanged = false;
  if (source === 'dialog') {
    let md, cbs, rbs, tas, inputs, selects;

    // -- grab the dialog box and get the various options.
    md = document.getElementById('fbcmf');

    // -- input validation for NF_LIKES_MAXIMUM_COUNT
    const elLikesMaximum = md.querySelector('input[name="NF_LIKES_MAXIMUM"]');
    if (elLikesMaximum && elLikesMaximum.checked) {
      const elLikesMaximumCount = md.querySelector('input[name="NF_LIKES_MAXIMUM_COUNT"]');
      if (elLikesMaximumCount && elLikesMaximumCount.value.length === 0) {
        alert(KeyWords.NF_LIKES_MAXIMUM + '?');
        elLikesMaximumCount.focus();
        return;
      }
    }

    // -- checkboxes (toggle variations)
    cbs = Array.from(md.querySelectorAll('input[type="checkbox"][cbtype="T"]'));
    cbs.forEach(cb => {
      VARS.Options[cb.name] = cb.checked;
    });
    // -- checkboxes (multipe values variations)
    let cbName = 'NF_BLOCKED_FEED';
    cbs = Array.from(md.querySelectorAll(`input[type="checkbox"][name="${cbName}"]`));
    cbs.forEach(cb => {
      VARS.Options[cbName][parseInt(cb.value)] = (cb.checked) ? '1' : '0';
    });
    cbName = 'GF_BLOCKED_FEED';
    cbs = Array.from(md.querySelectorAll(`input[type="checkbox"][name="${cbName}"]`));
    cbs.forEach(cb => {
      VARS.Options[cbName][parseInt(cb.value)] = (cb.checked) ? '1' : '0';
    });
    cbName = 'VF_BLOCKED_FEED';
    cbs = Array.from(md.querySelectorAll(`input[type="checkbox"][name="${cbName}"]`));
    cbs.forEach(cb => {
      VARS.Options[cbName][parseInt(cb.value)] = (cb.checked) ? '1' : '0';
    });
    cbName = 'MP_BLOCKED_FEED';
    cbs = Array.from(md.querySelectorAll(`input[type="checkbox"][name="${cbName}"]`));
    cbs.forEach(cb => {
      VARS.Options[cbName][parseInt(cb.value)] = (cb.checked) ? '1' : '0';
    });
    cbName = 'PP_BLOCKED_FEED';
    cbs = Array.from(md.querySelectorAll(`input[type="checkbox"][name="${cbName}"]`));
    cbs.forEach(cb => {
      VARS.Options[cbName][parseInt(cb.value)] = (cb.checked) ? '1' : '0';
    });

    // -- radios
    rbs = md.querySelectorAll('input[type="radio"]:checked');
    rbs.forEach(rb => {
      VARS.Options[rb.name] = rb.value;
    });
    // -- text input
    inputs = Array.from(md.querySelectorAll('input[type="text"]'));
    inputs.forEach(inp => {
      VARS.Options[inp.name] = inp.value;
    });
    // -- Blocked text (textareas)
    tas = md.querySelectorAll('textarea');
    tas.forEach(ta => {
      let txtn = ta.value.split('\n');
      let txts = [];
      txtn.forEach(txt => {
        if (txt.trim().length > 0) {
          txts.push(txt); // -- do not trim - retain entry as is.
        }
      });
      VARS.Options[ta.name] = txts.join(VARS.SEP);
    });
    // -- selects
    selects = Array.from(md.querySelectorAll('select'));
    selects.forEach(select => {
      VARS.Options[select.name] = select.value;
    });

    // -- did the ui language change?
    languageChanged = (VARS.language !== VARS.Options.CMF_DIALOG_LANGUAGE);
  }
  else if (source === 'reset') {
    languageChanged = true;
  }


  // -- clear out items that are not valid.
  let md = document.getElementById('fbcmf');
  let inputs = Array.from(md.querySelectorAll('input:not([type="file"]), textarea, select'));
  let validNames = [];
  inputs.forEach(inp => {
    if (!validNames.includes(inp.name)) {
      validNames.push(inp.name);
    }
  });
  for (let key in VARS.Options) {
    if (!validNames.includes(key)) {
      if (VARS.Options.VERBOSITY_DEBUG) {
        console.info(log + 'saveUserOptions(); Deleting key:', key);
      }
      delete VARS.Options[key];
    }
  }

  // -- save options
  let result = await set(DBVARS.DBKey, JSON.stringify(VARS.Options), DBVARS.ostore).then(() => {
    // -- refresh options and split blocks of texts
    let result2 = getUserOptions().then(() => {
      return true;
    });
    return result2;
  }).catch((err) => {
    console.info(`${log}saveUserOptions() > set() -> Error:`, err);
    return false;
  });
  if (VARS.Options.VERBOSITY_DEBUG) {
    console.info(`${log}saveUserOptions() > set() -> Saved:`, result);
  }

  // - update some variables.
  if (result) {

    if (languageChanged) {
      createDialog(true, ctx);
    }

    setFeedSettings(true);
    // - rebuild css - need user's preferences to take effect
    addCSS();
    addExtraCSS();
    // -- reset the main-column watcher ...
    const elements = document.querySelectorAll(`[${mainColumnAtt}]`);
    for (const element of elements) {
      element.removeAttribute(mainColumnAtt);
    }
    // - check if toggling debugging mode.
    toggleHiddenElements();
  }
  const fileResultsEl = document.querySelector('#fbcmf .fileResults');
  if (fileResultsEl) {
    fileResultsEl.textContent = `Last Saved @ ${(new Date()).toTimeString().slice(0, 8)}`;
  }

  // -- reset the posts and do the cleaning/mopping up again ...
  if (VARS.isAF) {
    // -- "reset" scan counts
    VARS.scanCountStart += 100;
    VARS.scanCountMaxLoop += 100;

    // -- purge the hidden post captions
    // -- however, need to move the div out of the <detais> ...
    let details = document.querySelectorAll(`details[${postAtt}]`);
    for (const element of details) {
      const elParent = element.parentElement;
      const elContent = element.lastElementChild;
      if (elContent && elContent.tagName === 'DIV') {
        elParent.appendChild(elContent);
      }
      // -- no need to copy the classes from <details> to parent - parent already have them.
      elParent.removeChild(element);
    }

    // -- purge the mini-captions
    let miniCaptions = document.querySelectorAll(`h6[${postAttTab}]`);
    for (const miniCaption of miniCaptions) {
      const elParent = miniCaption.parentElement;
      elParent.removeChild(miniCaption);
    }

    // -- remove attribute
    let elements = document.querySelectorAll(`[${postAtt}]`);
    for (const element of elements) {
      element.removeAttribute(postAtt);
      element.removeAttribute(VARS.hideAtt);
      element.removeAttribute(VARS.cssHideEl);
      element.removeAttribute(VARS.cssHideNumberOfShares);
      element.removeAttribute(VARS.showAtt);
    }
    // -- remove other attributes
    elements = document.querySelectorAll(`[${postAttCPID}], [${postAttChildFlag}]`);
    for (const element of elements) {
      if (element.hasAttribute(postAttCPID)) {
        element.removeAttribute(postAttCPID);
      }
      if (element.hasAttribute(postAttChildFlag)) {
        element.removeAttribute(postAttChildFlag);
      }
    }
    // -- remove some more attributes
    // -- (don't add cssShow to query, the button needs it ...)
    elements = document.querySelectorAll(`[${VARS.hideAtt}], [${VARS.cssHideEl}], [${VARS.cssHideNumberOfShares}]`);
    for (const element of elements) {
      element.removeAttribute(VARS.hideAtt);
      element.removeAttribute(VARS.cssHideEl);
      element.removeAttribute(VARS.cssHideNumberOfShares);
      element.removeAttribute(VARS.showAtt);
    }

    if (VARS.isNF) {
      mopUpTheNewsFeed();
    }
    else if (VARS.isGF) {
      mopUpTheGroupsFeed();
    }
    else if (VARS.isVF) {
      mopUpTheWatchVideosFeed();
    }
    else if (VARS.isMF) {
      mopUpTheMarketplaceFeed();
    }
    else if (VARS.isSF) {
      mopUpTheSearchFeed();
    }
    else if (VARS.isRF) {
      mopUpTheReelFeed('saveUserOptions');
    }
  }
}

/**
 * Exports current options to a downloadable JSON file
 * @param {Object} ctx - Context object
 */
export function exportUserOptions(ctx) {
  const { VARS } = ctx;
  // -- export user's options into a text file.
  let exportOptions = document.createElement("a");
  exportOptions.href = window.URL.createObjectURL(new Blob([JSON.stringify(VARS.Options)], { type: "text/plain" }));
  exportOptions.download = 'fb - clean my feeds - settings.json';
  exportOptions.click();
  exportOptions.remove();
  const fileResultsEl = document.querySelector('#fbcmf .fileResults');
  if (fileResultsEl) {
    fileResultsEl.textContent = 'Exported: fb - clean my feeds - settings.json';
  }
}

/**
 * Imports options from a user-provided JSON file
 * @param {Event} event - File input change event
 * @param {Object} ctx - Context object
 */
export function importUserOptions(event, ctx) {
  const { VARS } = ctx;
  let fileResults = document.querySelector('#fbcmf .fileResults');
  if (!event?.target?.files || !event.target.files[0]) {
    return;
  }
  let file = event.target.files[0];
  let fileN = event.target.files[0].name;
  // -- setup reader for reading in the file
  let reader = new FileReader();
  // -- what to do when reader is called.
  reader.onload = (fileEvent) => {
    try {
      let fileContent = JSON.parse(fileEvent.target.result);
      if (
        fileContent.hasOwnProperty('NF_SPONSORED') &&
        fileContent.hasOwnProperty('GF_SPONSORED') &&
        fileContent.hasOwnProperty('VF_SPONSORED') &&
        fileContent.hasOwnProperty('MP_SPONSORED')
      ) {
        VARS.Options = fileContent;
        // -- save the file to the db
        // -- save will run getUserOptions();
        saveUserOptions(null, ctx, 'file').then(() => {
          updateDialog(ctx);
          if (fileResults) {
            fileResults.textContent = `File imported: ${fileN}`;
          }
          return true;
        });
      }
      else {
        if (fileResults) {
          fileResults.textContent = `File NOT imported: ${fileN}`;
        }
      }
    }
    catch (e) {
      if (fileResults) {
        fileResults.textContent = `File NOT imported: ${fileN}`;
      }
    }
  };
  // -- call reader to read in the file ...
  reader.readAsText(file);
}

/**
 * Resets options to default state by deleting stored preferences in IndexedDB
 * @param {Object} ctx - Context object
 */
export function resetUserOptions(ctx) {
  const { DBVARS, VARS, setLanguageAndOptions, log } = ctx;
  // -- reset the options to original state (before customisations)
  del(DBVARS.DBKey, DBVARS.ostore)
    .then(() => {
      // - reset language - setLanguageAndOptions() > getUserOptions() will correct this value.
      VARS.Options.CMF_DIALOG_LANGUAGE = '';
      setLanguageAndOptions();
      saveUserOptions(null, ctx, 'reset').then(() => {
        updateDialog(ctx);
        return true;
      });
    })
    .catch((error) => {
      console.info(log + 'resetUserOptions(); Error - unable to delete Data.', error);
    });
}
