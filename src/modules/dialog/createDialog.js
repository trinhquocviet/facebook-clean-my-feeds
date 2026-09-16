/**
 * Dialog DOM Assembly Module
 * Declarative, schema-driven settings panel for Clean My Feeds
 * Part of FB - Clean My Feeds
 */

import {
  createSingleCB,
  createRB,
  createSelectLanguage,
  createCheckboxAndInput,
  createSection,
  createFilterPanel,
  createNote,
} from './components.js';
import { bindSectionEvents } from './toggle.js';
import {
  saveUserOptions,
  exportUserOptions,
  importUserOptions,
  resetUserOptions,
} from './actions.js';
import {
  ICON_CLOSE,
  LOGO_HTML,
} from '@/constants/index.js';

/**
 * Declarative section configuration schema:
 * - key: Stable section identifier (e.g. 'NF', 'GF', 'VF', 'MP')
 * - titleKey: i18n translation key for section title
 * - prefix: Option key prefix for auto-discovered checkboxes
 * - sponsored: Checkbox key rendered as first row (per user decision: unlocked)
 * - explicit: Explicit list of checkbox option keys
 * - custom: Special render branch ('verbosity' | 'customisations')
 * - filter: Filter panel field descriptors
 */
export const SECTIONS = [
  {
    key: 'NF',
    titleKey: 'DLG_NF',
    prefix: 'NF_',
    sponsored: 'NF_SPONSORED',
    filter: [{ name: 'NF_BLOCKED_TEXT' }],
  },
  {
    key: 'GF',
    titleKey: 'DLG_GF',
    prefix: 'GF_',
    sponsored: 'GF_SPONSORED',
    filter: [{ name: 'GF_BLOCKED_TEXT' }],
  },
  {
    key: 'VF',
    titleKey: 'DLG_VF',
    prefix: 'VF_',
    sponsored: 'VF_SPONSORED',
    filter: [{ name: 'VF_BLOCKED_TEXT' }],
  },
  {
    key: 'MP',
    titleKey: 'DLG_MP',
    prefix: null,
    sponsored: 'MP_SPONSORED',
    filter: [
      { name: 'MP_BLOCKED_TEXT', labelKey: 'DLG_MP_PRICES', rows: 2 },
      { name: 'MP_BLOCKED_TEXT_DESCRIPTION', labelKey: 'DLG_MP_DESCRIPTION', rows: 2 },
    ],
  },
  {
    key: 'PP',
    titleKey: 'DLG_PP',
    prefix: 'PP_',
    sponsored: null,
    filter: [{ name: 'PP_BLOCKED_TEXT' }],
  },
  {
    key: 'REELS',
    titleKey: 'REELS_TITLE',
    explicit: ['REELS_CONTROLS', 'REELS_DISABLE_LOOPING'],
  },
  {
    key: 'GLOBAL',
    titleKey: 'DLG_GLOBAL',
    note: 'DLG_GLOBAL_HINT',
    filter: [{ name: 'GLOBAL_BLOCKED_TEXT' }],
  },
  {
    key: 'OTHER',
    titleKey: 'DLG_OTHER',
    prefix: 'OTHER_INFO',
  },
  {
    key: 'VERB',
    titleKey: 'DLG_VERBOSITY',
    custom: 'verbosity',
  },
  {
    key: 'CUSTOM',
    titleKey: 'CMF_CUSTOMISATIONS',
    custom: 'customisations',
  },
];

function renderVerbosity(rows, ctx) {
  const { KeyWords } = ctx;
  rows.appendChild(createNote(`${KeyWords.DLG_VERBOSITY_CAPTION}:`, 'cmf-field__label'));
  rows.appendChild(createRB('VERBOSITY_LEVEL', '0', `${KeyWords.VERBOSITY_MESSAGE[0]}`, ctx));
  rows.appendChild(createRB('VERBOSITY_LEVEL', '1', `${KeyWords.VERBOSITY_MESSAGE[1]}`, ctx));
  rows.appendChild(createRB('VERBOSITY_LEVEL', '2', `${KeyWords.VERBOSITY_MESSAGE[3]}`, ctx));
  rows.appendChild(document.createElement('br'));
  rows.appendChild(createSingleCB('VERBOSITY_DEBUG', ctx));
}

function renderCustomisations(rows, ctx) {
  const { KeyWords } = ctx;
  rows.appendChild(createNote(`${KeyWords.CMF_BTN_LOCATION}:`, 'cmf-field__label'));
  const len = KeyWords.CMF_BTN_OPTION.length;
  for (let i = 0; i < len; i++) {
    rows.appendChild(createRB('CMF_BTN_OPTION', i.toString(), KeyWords.CMF_BTN_OPTION[i], ctx));
  }
  rows.appendChild(document.createElement('br'));
  rows.appendChild(createNote(`${KeyWords.CMF_DIALOG_LOCATION}:`, 'cmf-field__label'));
  rows.appendChild(createRB('CMF_DIALOG_OPTION', '0', KeyWords.CMF_DIALOG_OPTION[0], ctx));
  rows.appendChild(createRB('CMF_DIALOG_OPTION', '1', KeyWords.CMF_DIALOG_OPTION[1], ctx));
  rows.appendChild(document.createElement('br'));
  rows.appendChild(createSelectLanguage(ctx));
}

function renderSection(cfg, ctx, frag) {
  const { KeyWords } = ctx;
  const { section, rows } = createSection(cfg.key, KeyWords[cfg.titleKey] || cfg.titleKey, ctx);

  if (cfg.note) rows.appendChild(createNote(KeyWords[cfg.note] || cfg.note));

  // Per user decision: Sponsored is kept UNLOCKED (cbReadOnly = false)
  if (cfg.sponsored) {
    rows.appendChild(createSingleCB(cfg.sponsored, ctx, false));
  }

  if (cfg.prefix) {
    for (const key in KeyWords) {
      if (!key.startsWith(cfg.prefix)) continue;
      if (/^(NF|GF|VF|MP|PP)_BLOCK/.test(key)) continue; // Handled in filter panel
      if (key === cfg.sponsored) continue;
      if (key === 'NF_LIKES_MAXIMUM') {
        rows.appendChild(createCheckboxAndInput(key, 'NF_LIKES_MAXIMUM_COUNT', ctx));
        continue;
      }
      if (key === 'NF_LIKES_MAXIMUM_COUNT') continue;
      rows.appendChild(createSingleCB(key, ctx));
    }
  }

  if (cfg.explicit) {
    cfg.explicit.forEach((k) => rows.appendChild(createSingleCB(k, ctx)));
  }

  if (cfg.custom === 'verbosity') renderVerbosity(rows, ctx);
  if (cfg.custom === 'customisations') renderCustomisations(rows, ctx);

  if (cfg.filter) {
    section.appendChild(createFilterPanel(cfg.key, cfg.filter, ctx));
  }

  if (!rows.hasChildNodes()) {
    rows.remove();
  }

  frag.appendChild(section);
}

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
    toggleDialog,
  } = ctx;

  let dlg, hdr, hdr1, hdr2, hdr3, htxt, s, btn, cnt, div, footer;

  if (languageChanged) {
    VARS.language = VARS.Options.CMF_DIALOG_LANGUAGE;
    cloneKeywords();
  }

  if (languageChanged === false) {
    // -- new dialog-box shell
    dlg = document.createElement('div');
    dlg.id = 'fbcmf';
    dlg.className = 'fb-cmf';
    dlg.setAttribute('role', 'dialog');
    dlg.setAttribute('aria-modal', 'true');
    dlg.setAttribute('aria-labelledby', 'cmf-title');

    // -- header (logo + title + close button)
    hdr = document.createElement('header');
    hdr1 = document.createElement('div');
    hdr1.className = 'fb-cmf-icon';
    hdr1.innerHTML = VARS?.logoHTML || LOGO_HTML;
    hdr1.setAttribute('aria-hidden', 'true');

    hdr2 = document.createElement('div');
    hdr2.className = 'fb-cmf-title';
    hdr2.id = 'cmf-title';

    hdr3 = document.createElement('div');
    hdr3.className = 'fb-cmf-close';
    btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cmf-iconbtn';
    btn.setAttribute('aria-label', 'Close');
    btn.innerHTML = VARS?.iconClose || ICON_CLOSE;
    btn.addEventListener('click', toggleDialog, false);
    hdr3.appendChild(btn);

    hdr.appendChild(hdr1);
    hdr.appendChild(hdr2);
    hdr.appendChild(hdr3);
    dlg.appendChild(hdr);

    // content container
    cnt = document.createElement('div');
    cnt.classList.add('content');
  } else {
    // -- existing dialog-box re-render after language switch
    dlg = document.getElementById('fbcmf');
    if (!dlg) return;
    hdr = dlg.querySelector('header');
    hdr2 = hdr.querySelector('.fb-cmf-title');
    while (hdr2.firstChild) {
      hdr2.removeChild(hdr2.firstChild);
    }

    cnt = dlg.querySelector('.content');
    while (cnt.firstChild) {
      cnt.removeChild(cnt.firstChild);
    }
  }

  dlg.setAttribute('dir', KeyWords.LANGUAGE_DIRECTION || 'ltr');

  // -- header - title block
  htxt = document.createElement('div');
  htxt.className = 'cmf-header__title';
  htxt.textContent = masterKeyWords.translations.en.DLG_TITLE;
  hdr2.appendChild(htxt);

  const verWrap = document.createElement('div');
  s = document.createElement('span');
  s.className = 'script-version';
  s.textContent = `${SCRIPT_VERSION}`;
  verWrap.appendChild(s);
  hdr2.appendChild(verWrap);

  if (VARS.language !== 'en') {
    const stxt = document.createElement('small');
    stxt.className = 'cmf-header__subtitle';
    stxt.textContent = KeyWords.DLG_TITLE;
    hdr2.appendChild(stxt);
  }

  // DocumentFragment optimization: batch sections off-DOM
  const frag = document.createDocumentFragment();
  SECTIONS.forEach((cfg) => renderSection(cfg, ctx, frag));
  frag.appendChild(createNote(KeyWords.DLG_TIPS_CONTENT, 'cmf-tips'));
  cnt.appendChild(frag);

  if (languageChanged === false) {
    dlg.appendChild(cnt);

    // -- Actions (buttons) + status footer
    footer = document.createElement('footer');
    const actionsWrap = document.createElement('div');
    actionsWrap.className = 'cmf-footer__actions';

    // -- file input field is hidden, but triggered by the Import button.
    const fileImport = document.createElement('input');
    fileImport.setAttribute('type', 'file');
    fileImport.setAttribute('id', `FI${postAtt}`);
    fileImport.classList.add('fileInput');

    const btnList = [
      {
        id: 'BTNReset',
        text: KeyWords.DLG_RESET_ALL || KeyWords.DLG_BUTTONS[3],
        cls: 'cmf-btn cmf-btn--ghost',
        event: () => resetUserOptions(ctx),
      },
      { spacer: true },
      {
        id: 'BTNExport',
        text: KeyWords.DLG_BUTTONS[1],
        cls: 'cmf-btn cmf-btn--secondary',
        event: () => exportUserOptions(ctx),
      },
      {
        id: 'BTNImport',
        text: KeyWords.DLG_BUTTONS[2],
        cls: 'cmf-btn cmf-btn--secondary',
        event: () => fileImport.click(),
      },
      {
        id: 'BTNSave',
        text: KeyWords.DLG_BUTTONS[0],
        cls: 'cmf-btn cmf-btn--primary',
        event: (e) => saveUserOptions(e, ctx),
      },
    ];

    for (const item of btnList) {
      if (item.spacer) {
        const sp = document.createElement('span');
        sp.className = 'cmf-footer__spacer';
        actionsWrap.appendChild(sp);
        continue;
      }
      const btnEl = document.createElement('button');
      btnEl.type = 'button';
      btnEl.setAttribute('id', item.id);
      btnEl.className = item.cls;
      btnEl.textContent = item.text;
      btnEl.addEventListener('click', item.event, false);
      actionsWrap.appendChild(btnEl);
    }

    footer.appendChild(actionsWrap);
    footer.appendChild(fileImport);

    // -- save/export/import/reset status/results
    div = document.createElement('div');
    div.classList.add('fileResults', 'cmf-status');
    div.setAttribute('role', 'status');
    div.setAttribute('aria-live', 'polite');
    div.innerHTML = '&nbsp;';
    footer.appendChild(div);

    dlg.appendChild(footer);
    document.body.appendChild(dlg);

    // -- add event listener to file input field
    fileImport.addEventListener('change', (e) => importUserOptions(e, ctx), false);
    bindSectionEvents(ctx);
  } else {
    // -- language changed
    const footerEl = dlg.querySelector('footer');
    if (footerEl) {
      let b = footerEl.querySelector('#BTNSave');
      if (b) b.textContent = KeyWords.DLG_BUTTONS[0];
      b = footerEl.querySelector('#BTNExport');
      if (b) b.textContent = KeyWords.DLG_BUTTONS[1];
      b = footerEl.querySelector('#BTNImport');
      if (b) b.textContent = KeyWords.DLG_BUTTONS[2];
      b = footerEl.querySelector('#BTNReset');
      if (b) b.textContent = KeyWords.DLG_RESET_ALL || KeyWords.DLG_BUTTONS[3];
    }
    bindSectionEvents(ctx);
  }
}
