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
    compound: { cb: 'NF_LIKES_MAXIMUM', input: 'NF_LIKES_MAXIMUM_COUNT' },
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
      if (cfg.compound && key === cfg.compound.cb) {
        rows.appendChild(createCheckboxAndInput(key, cfg.compound.input, ctx));
        continue;
      }
      if (cfg.compound && key === cfg.compound.input) continue;
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
 * Creates the outer dialog container with header and empty content body.
 * @param {Object} ctx - Context object
 * @returns {{ dlg: HTMLElement, hdrTitle: HTMLElement, cnt: HTMLElement }}
 */
function createDialogShell(ctx) {
  const { VARS, toggleDialog } = ctx;
  const dlg = document.createElement('div');
  dlg.id = 'fbcmf';
  dlg.className = 'fb-cmf';
  dlg.setAttribute('role', 'dialog');
  dlg.setAttribute('aria-modal', 'true');
  dlg.setAttribute('aria-labelledby', 'cmf-title');

  const hdr = document.createElement('header');

  const hdrIcon = document.createElement('div');
  hdrIcon.className = 'fb-cmf-icon';
  hdrIcon.innerHTML = VARS?.logoHTML || LOGO_HTML;
  hdrIcon.setAttribute('aria-hidden', 'true');

  const hdrTitle = document.createElement('div');
  hdrTitle.className = 'fb-cmf-title';
  hdrTitle.id = 'cmf-title';

  const hdrClose = document.createElement('div');
  hdrClose.className = 'fb-cmf-close';
  const closeBtn = document.createElement('button');
  closeBtn.type = 'button';
  closeBtn.className = 'cmf-iconbtn';
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.innerHTML = VARS?.iconClose || ICON_CLOSE;
  closeBtn.addEventListener('click', toggleDialog, false);
  hdrClose.appendChild(closeBtn);

  hdr.appendChild(hdrIcon);
  hdr.appendChild(hdrTitle);
  hdr.appendChild(hdrClose);
  dlg.appendChild(hdr);

  const cnt = document.createElement('div');
  cnt.classList.add('content');
  dlg.appendChild(cnt);

  return { dlg, hdrTitle, cnt };
}

/**
 * Creates the dialog footer with action buttons and file import input.
 * @param {Object} ctx - Context object
 * @returns {HTMLElement}
 */
function createFooter(ctx) {
  const { KeyWords, postAtt } = ctx;
  const footer = document.createElement('footer');
  const actionsWrap = document.createElement('div');
  actionsWrap.className = 'cmf-footer__actions';

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

  const statusDiv = document.createElement('div');
  statusDiv.classList.add('fileResults', 'cmf-status');
  statusDiv.setAttribute('role', 'status');
  statusDiv.setAttribute('aria-live', 'polite');
  statusDiv.innerHTML = '&nbsp;';
  footer.appendChild(statusDiv);

  fileImport.addEventListener('change', (e) => importUserOptions(e, ctx), false);

  return footer;
}

/**
 * Renders the header title, version, and optional subtitle.
 * @param {HTMLElement} hdrTitle - Header title container element
 * @param {Object} ctx - Context object
 */
function renderHeaderTitle(hdrTitle, ctx) {
  const { masterKeyWords, SCRIPT_VERSION, VARS, KeyWords } = ctx;
  while (hdrTitle.firstChild) {
    hdrTitle.removeChild(hdrTitle.firstChild);
  }

  const htxt = document.createElement('div');
  htxt.className = 'cmf-header__title';
  htxt.textContent = masterKeyWords.translations.en.DLG_TITLE;
  hdrTitle.appendChild(htxt);

  const verWrap = document.createElement('div');
  const s = document.createElement('span');
  s.className = 'script-version';
  s.textContent = `${SCRIPT_VERSION}`;
  verWrap.appendChild(s);
  hdrTitle.appendChild(verWrap);

  if (VARS.language !== 'en') {
    const stxt = document.createElement('small');
    stxt.className = 'cmf-header__subtitle';
    stxt.textContent = KeyWords.DLG_TITLE;
    hdrTitle.appendChild(stxt);
  }
}

/**
 * Updates button labels in the footer on language change.
 * @param {HTMLElement} footer - Footer element
 * @param {Object} KeyWords - Locale dictionary
 */
function updateFooterLabels(footer, KeyWords) {
  if (!footer) return;
  const labels = {
    BTNSave: KeyWords.DLG_BUTTONS[0],
    BTNExport: KeyWords.DLG_BUTTONS[1],
    BTNImport: KeyWords.DLG_BUTTONS[2],
    BTNReset: KeyWords.DLG_RESET_ALL || KeyWords.DLG_BUTTONS[3],
  };
  for (const [id, text] of Object.entries(labels)) {
    const btn = footer.querySelector(`#${id}`);
    if (btn) btn.textContent = text;
  }
}

/**
 * Batches and renders all sections into the content container.
 * @param {HTMLElement} cnt - Content container element
 * @param {Object} ctx - Context object
 */
function renderSectionsContent(cnt, ctx) {
  const { KeyWords } = ctx;
  while (cnt.firstChild) {
    cnt.removeChild(cnt.firstChild);
  }

  const frag = document.createDocumentFragment();
  SECTIONS.forEach((cfg) => renderSection(cfg, ctx, frag));
  frag.appendChild(createNote(KeyWords.DLG_TIPS_CONTENT, 'cmf-tips'));
  cnt.appendChild(frag);
}

/**
 * Creates or updates the options dialog DOM.
 * @param {boolean} [languageChanged=false] - Whether this is a language switch re-render
 * @param {Object} ctx - Context object
 */
export function createDialog(languageChanged = false, ctx) {
  const { VARS, KeyWords, cloneKeywords } = ctx;

  let dlg;
  let hdrTitle;
  let cnt;

  if (languageChanged) {
    VARS.language = VARS.Options.CMF_DIALOG_LANGUAGE;
    cloneKeywords();

    dlg = document.getElementById('fbcmf');
    if (!dlg) return;

    hdrTitle = dlg.querySelector('.fb-cmf-title');
    cnt = dlg.querySelector('.content');
    updateFooterLabels(dlg.querySelector('footer'), KeyWords);
  } else {
    const shell = createDialogShell(ctx);
    dlg = shell.dlg;
    hdrTitle = shell.hdrTitle;
    cnt = shell.cnt;

    const footer = createFooter(ctx);
    dlg.appendChild(footer);
    document.body.appendChild(dlg);
  }

  if (typeof dlg.setAttribute === 'function') {
    dlg.setAttribute('dir', KeyWords.LANGUAGE_DIRECTION || 'ltr');
    const cmfDlgLocation = (ctx?.VARS?.Options?.CMF_DIALOG_OPTION ?? ctx?.masterKeyWords?.defaults?.CMF_DIALOG_OPTION ?? '0').toString();
    dlg.setAttribute('data-cmf-dlg', cmfDlgLocation === '1' ? 'right' : 'left');
  }
  renderHeaderTitle(hdrTitle, ctx);
  renderSectionsContent(cnt, ctx);
  bindSectionEvents(ctx);
}
