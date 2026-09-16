/**
 * Dialog DOM Assembly Module
 * Builds or refreshes the clean-my-feeds options dialog
 * Part of FB - Clean My Feeds
 */

import {
  createSingleCB,
  createMultipeCBs,
  createRB,
  createSelectLanguage,
  createCheckboxAndInput
} from './components.js';
import { addLegendEvents } from './toggle.js';
import {
  saveUserOptions,
  exportUserOptions,
  importUserOptions,
  resetUserOptions
} from './actions.js';

/**
 * Creates or updates the options dialog DOM
 * @param {boolean} [languageChanged=false] - Whether this is a language switch re-render
 * @param {Object} ctx - Context object
 */
export function createDialog(languageChanged = false, ctx) {
  const {
    VARS,
    KeyWords,
    masterKeyWords,
    SCRIPT_VERSION,
    postAtt,
    cloneKeywords,
    toggleDialog
  } = ctx;

  let dlg, hdr, hdr1, hdr2, hdr3, htxt, stxt, btn, cnt, fs, l, s, ta, div, footer;

  if (languageChanged) {
    VARS.language = VARS.Options.CMF_DIALOG_LANGUAGE;
    cloneKeywords();
  }

  if (languageChanged === false) {
    // -- new dialog-box

    // -- wrapper
    dlg = document.createElement('div');
    dlg.id = 'fbcmf';
    dlg.className = 'fb-cmf';
    // class "show" reveals the dialog.
    // -- header (logo + title + close button)
    hdr = document.createElement('header');
    hdr1 = document.createElement('div');
    hdr1.className = 'fb-cmf-icon';
    hdr1.innerHTML = VARS.logoHTML;

    hdr2 = document.createElement('div');
    hdr2.className = 'fb-cmf-title';

    hdr3 = document.createElement('div');
    hdr3.className = 'fb-cmf-close';
    btn = document.createElement('button');
    btn.innerHTML = VARS.iconClose;
    btn.addEventListener('click', toggleDialog, false);
    hdr3.appendChild(btn);

    hdr.appendChild(hdr1);
    hdr.appendChild(hdr2);
    hdr.appendChild(hdr3);
    dlg.appendChild(hdr);

    // content container
    cnt = document.createElement('div');
    cnt.classList.add('content');

  }
  else {
    // -- existing dialog-box
    // -- UI's language has changed - reset some descriptive text
    dlg = document.getElementById('fbcmf');
    hdr = dlg.querySelector('header');
    hdr2 = hdr.querySelector('.fb-cmf-title');
    while (hdr2.firstChild) {
      hdr2.removeChild(hdr2.firstChild);
    }
    hdr2.classList.remove('fb-cmf-lang-1');
    hdr2.classList.remove('fb-cmf-lang-2');

    cnt = dlg.querySelector('.content');
    while (cnt.firstChild) {
      cnt.removeChild(cnt.firstChild);
    }
  }
  dlg.setAttribute('dir', KeyWords.LANGUAGE_DIRECTION || 'ltr');

  // -- header - title block
  htxt = document.createElement('div');
  htxt.textContent = masterKeyWords.translations.en.DLG_TITLE;
  s = document.createElement('small');
  s.className = 'script-version';
  s.appendChild(document.createTextNode(` (${SCRIPT_VERSION})`));
  htxt.appendChild(s);
  hdr2.appendChild(htxt);
  if (VARS.language !== 'en') {
    stxt = document.createElement('small');
    stxt.textContent = `(${KeyWords.DLG_TITLE})`;
    hdr2.appendChild(stxt);
    hdr2.classList.add('fb-cmf-lang-2');
  }
  else {
    hdr2.classList.add('fb-cmf-lang-1');
  }

  // DocumentFragment optimization: batch fieldsets off-DOM
  const frag = document.createDocumentFragment();

  // -- News Feed options
  fs = document.createElement('fieldset');
  l = document.createElement('legend');
  l.textContent = KeyWords.DLG_NF;
  fs.appendChild(l);
  fs.appendChild(createSingleCB('NF_SPONSORED', ctx, false)); // -- changed to false (Dec 2023)
  for (const key in KeyWords) {
    if (key.slice(0, 3) === 'NF_') {
      if (key.slice(0, 8) === 'NF_BLOCK') {
        continue;
      }
      if (key.slice(0, 8) === 'NF_LIKES') {
        if (key === 'NF_LIKES_MAXIMUM') {
          fs.appendChild(createCheckboxAndInput(key, 'NF_LIKES_MAXIMUM_COUNT', ctx));
        }
      }
      else {
        fs.appendChild(createSingleCB(key, ctx));
      }
    }
  }

  // -- Keywords to block - News Feed
  fs.appendChild(document.createElement('br'));
  l = document.createElement('strong');
  l.textContent = `${KeyWords.DLG_BLOCK_TEXT_FILTER_TITLE}:`;
  fs.appendChild(l);

  createMultipeCBs('NF_BLOCKED_FEED', ctx, 0).forEach(el => {
    fs.appendChild(el);
  });

  fs.appendChild(createSingleCB('NF_BLOCKED_ENABLED', ctx));
  fs.appendChild(createSingleCB('NF_BLOCKED_RE', ctx));
  s = document.createElement('small');
  s.appendChild(document.createTextNode(KeyWords.DLG_BLOCK_NEW_LINE));
  fs.appendChild(s);
  ta = document.createElement('textarea');
  ta.name = 'NF_BLOCKED_TEXT';
  ta.textContent = VARS.Options.NF_BLOCKED_TEXT.split(VARS.SEP).join('\n');
  fs.appendChild(ta);
  frag.appendChild(fs);

  // -- Groups Feed options
  fs = document.createElement('fieldset');
  l = document.createElement('legend');
  l.textContent = KeyWords.DLG_GF;
  fs.appendChild(l);
  fs.appendChild(createSingleCB('GF_SPONSORED', ctx, false)); // -- changed to false (Dec 2023)
  for (const key in KeyWords) {
    if (key.slice(0, 3) === 'GF_' && key.slice(0, 8) !== 'GF_BLOCK') {
      fs.appendChild(createSingleCB(key, ctx));
    }
  }

  // -- Keywords to block - Groups Feed
  fs.appendChild(document.createElement('br'));
  l = document.createElement('strong');
  l.textContent = `${KeyWords.DLG_BLOCK_TEXT_FILTER_TITLE}:`;
  fs.appendChild(l);

  createMultipeCBs('GF_BLOCKED_FEED', ctx, 1).forEach(el => {
    fs.appendChild(el);
  });

  fs.appendChild(createSingleCB('GF_BLOCKED_ENABLED', ctx));
  fs.appendChild(createSingleCB('GF_BLOCKED_RE', ctx));
  s = document.createElement('small');
  s.appendChild(document.createTextNode(KeyWords.DLG_BLOCK_NEW_LINE));
  fs.appendChild(s);
  ta = document.createElement('textarea');
  ta.name = 'GF_BLOCKED_TEXT';
  ta.textContent = VARS.Options.GF_BLOCKED_TEXT.split(VARS.SEP).join('\n');
  fs.appendChild(ta);
  frag.appendChild(fs);

  // -- MarketPlace option(s)
  fs = document.createElement('fieldset');
  l = document.createElement('legend');
  l.textContent = KeyWords.DLG_MP;
  fs.appendChild(l);
  fs.appendChild(createSingleCB('MP_SPONSORED', ctx, false)); // -- changed to false (Dec 2023)

  // -- Keywords to block - Marketplace Feed
  fs.appendChild(document.createElement('br'));
  l = document.createElement('strong');
  l.textContent = `${KeyWords.DLG_BLOCK_TEXT_FILTER_TITLE}:`;
  fs.appendChild(l);

  createMultipeCBs('MP_BLOCKED_FEED', ctx, 0).forEach(el => {
    fs.appendChild(el);
  });
  // -- 2 x textarea boxes; one for prices and one for description
  fs.appendChild(createSingleCB('MP_BLOCKED_ENABLED', ctx));
  fs.appendChild(createSingleCB('MP_BLOCKED_RE', ctx));
  l = document.createElement('strong');
  l.textContent = 'Prices: ';
  fs.appendChild(l);
  fs.appendChild(document.createElement('br'));
  s = document.createElement('small');
  s.appendChild(document.createTextNode(KeyWords.DLG_BLOCK_NEW_LINE));
  fs.appendChild(s);
  ta = document.createElement('textarea');
  ta.name = 'MP_BLOCKED_TEXT';
  ta.textContent = VARS.Options.MP_BLOCKED_TEXT.split(VARS.SEP).join('\n');
  fs.appendChild(ta);
  fs.appendChild(document.createElement('br'));
  fs.appendChild(document.createElement('br'));

  l = document.createElement('strong');
  l.textContent = 'Description: ';
  fs.appendChild(l);
  fs.appendChild(document.createElement('br'));
  s = document.createElement('small');
  s.appendChild(document.createTextNode(KeyWords.DLG_BLOCK_NEW_LINE));
  fs.appendChild(s);
  ta = document.createElement('textarea');
  ta.name = 'MP_BLOCKED_TEXT_DESCRIPTION';
  ta.textContent = VARS.Options.MP_BLOCKED_TEXT_DESCRIPTION.split(VARS.SEP).join('\n');
  fs.appendChild(ta);

  frag.appendChild(fs);


  // -- Watch Videos Feed options
  fs = document.createElement('fieldset');
  l = document.createElement('legend');
  l.textContent = KeyWords.DLG_VF;
  fs.appendChild(l);
  fs.appendChild(createSingleCB('VF_SPONSORED', ctx, false)); // -- changed to false (Dec 2023)
  for (const key in KeyWords) {
    if (key.slice(0, 3) === 'VF_' && key.slice(0, 8) !== 'VF_BLOCK') {
      fs.appendChild(createSingleCB(key, ctx));
    }
  }

  // -- Keywords to block - Watch Videos Feed
  fs.appendChild(document.createElement('br'));
  l = document.createElement('strong');
  l.textContent = `${KeyWords.DLG_BLOCK_TEXT_FILTER_TITLE}:`;
  fs.appendChild(l);

  createMultipeCBs('VF_BLOCKED_FEED', ctx, 2).forEach(el => {
    fs.appendChild(el);
  });

  fs.appendChild(createSingleCB('VF_BLOCKED_ENABLED', ctx));
  fs.appendChild(createSingleCB('VF_BLOCKED_RE', ctx));
  s = document.createElement('small');
  s.appendChild(document.createTextNode(KeyWords.DLG_BLOCK_NEW_LINE));
  fs.appendChild(s);
  ta = document.createElement('textarea');
  ta.name = 'VF_BLOCKED_TEXT';
  ta.textContent = VARS.Options.VF_BLOCKED_TEXT.split(VARS.SEP).join('\n');
  fs.appendChild(ta);
  frag.appendChild(fs);


  // -- Profile Page feed options
  fs = document.createElement('fieldset');
  l = document.createElement('legend');
  l.textContent = KeyWords.DLG_PP;
  fs.appendChild(l);
  // fs.appendChild(createSingleCB('PP_SPONSORED', false));
  for (const key in KeyWords) {
    if (key.slice(0, 3) === 'PP_' && key.slice(0, 8) !== 'PP_BLOCK') {
      fs.appendChild(createSingleCB(key, ctx));
    }
  }

  // -- Keywords to block - Profile page
  fs.appendChild(document.createElement('br'));
  l = document.createElement('strong');
  l.textContent = `${KeyWords.DLG_BLOCK_TEXT_FILTER_TITLE}:`;
  fs.appendChild(l);

  createMultipeCBs('PP_BLOCKED_FEED', ctx, 0).forEach(el => {
    fs.appendChild(el);
  });

  fs.appendChild(createSingleCB('PP_BLOCKED_ENABLED', ctx));
  fs.appendChild(createSingleCB('PP_BLOCKED_RE', ctx));
  s = document.createElement('small');
  s.appendChild(document.createTextNode(KeyWords.DLG_BLOCK_NEW_LINE));
  fs.appendChild(s);
  ta = document.createElement('textarea');
  ta.name = 'PP_BLOCKED_TEXT';
  ta.textContent = VARS.Options.PP_BLOCKED_TEXT.split(VARS.SEP).join('\n');
  fs.appendChild(ta);
  frag.appendChild(fs);


  // -- Other items options
  fs = document.createElement('fieldset');
  l = document.createElement('legend');
  l.textContent = KeyWords.DLG_OTHER;
  fs.appendChild(l);
  for (const key in KeyWords) {
    if (key.slice(0, 10) === 'OTHER_INFO') {
      fs.appendChild(createSingleCB(key, ctx));
    }
  }
  frag.appendChild(fs);

  // -- Reels
  fs = document.createElement('fieldset');
  l = document.createElement('legend');
  l.textContent = KeyWords.REELS_TITLE;
  fs.appendChild(l);
  fs.appendChild(createSingleCB('REELS_CONTROLS', ctx));
  fs.appendChild(l);
  fs.appendChild(createSingleCB('REELS_DISABLE_LOOPING', ctx));
  frag.appendChild(fs);

  // -- Verbosity
  fs = document.createElement('fieldset');
  l = document.createElement('legend');
  l.textContent = KeyWords.DLG_VERBOSITY;
  fs.appendChild(l);
  s = document.createElement('span');
  s.appendChild(document.createTextNode(`${KeyWords.DLG_VERBOSITY_CAPTION}:`));
  fs.appendChild(s);
  fs.appendChild(createRB('VERBOSITY_LEVEL', '0', `${KeyWords.VERBOSITY_MESSAGE[0]}`, ctx));
  fs.appendChild(createRB('VERBOSITY_LEVEL', '1', `${KeyWords.VERBOSITY_MESSAGE[1]}______`, ctx));
  fs.appendChild(createRB('VERBOSITY_LEVEL', '2', `${KeyWords.VERBOSITY_MESSAGE[3]}`, ctx));
  fs.appendChild(document.createElement('br'));
  fs.appendChild(createSingleCB('VERBOSITY_DEBUG', ctx));
  frag.appendChild(fs);

  // -- cmf customisations
  fs = document.createElement('fieldset');
  l = document.createElement('legend');
  l.textContent = KeyWords.CMF_CUSTOMISATIONS;
  fs.appendChild(l);
  s = document.createElement('span');
  s.appendChild(document.createTextNode(`${KeyWords.CMF_BTN_LOCATION}:`));
  fs.appendChild(s);
  let len = KeyWords.CMF_BTN_OPTION.length;
  for (let i = 0; i < len; i++) {
    fs.appendChild(createRB('CMF_BTN_OPTION', i.toString(), KeyWords.CMF_BTN_OPTION[i], ctx));
  }
  fs.appendChild(document.createElement('br'));
  s = document.createElement('span');
  s.appendChild(document.createTextNode(`${KeyWords.CMF_DIALOG_LOCATION}:`));
  fs.appendChild(s);
  fs.appendChild(createRB('CMF_DIALOG_OPTION', '0', KeyWords.CMF_DIALOG_OPTION[0], ctx));
  fs.appendChild(createRB('CMF_DIALOG_OPTION', '1', KeyWords.CMF_DIALOG_OPTION[1], ctx));

  fs.appendChild(document.createElement('br'));
  fs.appendChild(createSelectLanguage(ctx));
  frag.appendChild(fs);


  // -- tips
  fs = document.createElement('fieldset');
  l = document.createElement('legend');
  l.textContent = KeyWords.DLG_TIPS;
  fs.appendChild(l);
  s = document.createElement('span');
  s.appendChild(document.createTextNode(KeyWords.DLG_TIPS_CONTENT));
  fs.appendChild(s);
  frag.appendChild(fs);

  // Append batched fieldsets into content container
  cnt.appendChild(frag);

  if (languageChanged === false) {
    dlg.appendChild(cnt);

    // -- Actions (buttons) + status
    footer = document.createElement('footer');

    // -- Make a list of buttons
    const btnList = [
      {
        id: 'BTNSave', // save
        text: KeyWords.DLG_BUTTONS[0],
        event: (e) => saveUserOptions(e, ctx),
      },
      {
        id: 'BTNExport', // export
        text: KeyWords.DLG_BUTTONS[1],
        event: () => exportUserOptions(ctx),
      },
      {
        id: 'BTNImport', // import
        text: KeyWords.DLG_BUTTONS[2],
        event: (e) => importUserOptions(e, ctx),
      },
      {
        id: 'BTNReset', // reset
        text: KeyWords.DLG_BUTTONS[3],
        event: () => resetUserOptions(ctx),
      }
    ];

    const footerFrag = document.createDocumentFragment();

    for (const btnAttrs of btnList) {
      const btnEl = document.createElement('button');
      btnEl.setAttribute('id', btnAttrs.id);
      btnEl.textContent = btnAttrs.text;
      btnEl.addEventListener('click', btnAttrs.event, false);
      footerFrag.appendChild(btnEl);
    }

    // -- file input field is hidden, but triggered by the Import button.
    const fileImport = document.createElement('input');
    fileImport.setAttribute('type', 'file');
    fileImport.setAttribute('id', `FI${postAtt}`);
    fileImport.classList.add('fileInput');
    footerFrag.appendChild(fileImport);

    // -- save/export/import/reset status/results
    div = document.createElement('div');
    div.classList.add('fileResults');
    div.innerHTML = '&nbsp;';
    footerFrag.appendChild(div);

    footer.appendChild(footerFrag);
    dlg.appendChild(footer);

    document.body.appendChild(dlg);

    // -- add event listeners to the import button and file input field
    let fileInput = document.getElementById(`FI${postAtt}`);
    fileInput.addEventListener('change', (e) => importUserOptions(e, ctx), false);
    // -- make the btn Import trigger file input ...
    let btnImport = document.getElementById('BTNImport');
    btnImport.addEventListener('click', function () {
      fileInput.click();
    }, false);
  }
  else {
    // -- language changed
    const footer = dlg.querySelector('footer');
    let btn = footer.querySelector('#BTNSave');
    btn.textContent = KeyWords.DLG_BUTTONS[0];
    btn = footer.querySelector('#BTNExport');
    btn.textContent = KeyWords.DLG_BUTTONS[1];
    btn = footer.querySelector('#BTNImport');
    btn.textContent = KeyWords.DLG_BUTTONS[2];
    btn = footer.querySelector('#BTNReset');
    btn.textContent = KeyWords.DLG_BUTTONS[3];
    addLegendEvents();
  }
}
