/**
 * Dialog UI Components
 * DOM element generators for modern sections, rows, checkboxes, radios, language selector, and filter panels.
 * Translated from revamp_sample.html.
 * Part of FB - Clean My Feeds
 */

import { ICON_CHEVRON } from '@/constants/index.js';

/**
 * Validates text inputs to accept digits only
 * @param {Event} event - Input event
 * @returns {boolean|void}
 */
export function checkInputNumber(event) {
  const el = event.target;
  if (!el || el.value === '') {
    return true;
  }
  const digitsValues = String(el.value).replace(/\D/g, '');
  el.value = digitsValues.length > 0 ? parseInt(digitsValues, 10) : '';
}

/**
 * Builds the language selection dropdown component
 * @param {Object} ctx - Context object
 * @returns {HTMLSelectElement}
 */
export function getLanguagesComponent(ctx) {
  const { VARS, getSupportedLanguages } = ctx;
  const elSelect = document.createElement('select');
  elSelect.name = 'CMF_DIALOG_LANGUAGE';
  getSupportedLanguages().forEach(({ code, name }) => {
    const elOption = document.createElement('option');
    elOption.value = code;
    elOption.textContent = name;
    if (code === VARS.language) {
      elOption.setAttribute('selected', '');
    }
    elSelect.appendChild(elOption);
  });
  if (VARS.language) {
    elSelect.value = VARS.language;
  }
  return elSelect;
}

/**
 * Builds standard toggle row: label left, control right.
 * @param {HTMLElement} input - Form control element
 * @param {string} text - Label text
 * @param {{ locked?: boolean }} [options] - Row options
 * @returns {HTMLLabelElement}
 */
function buildRow(input, text, { locked = false } = {}) {
  const label = document.createElement('label');
  label.className = locked ? 'cmf-row cmf-row--locked' : 'cmf-row';
  const span = document.createElement('span');
  span.className = 'cmf-row__text';
  span.textContent = text;
  label.appendChild(span);
  label.appendChild(input);
  return label;
}

/**
 * Resolves user-friendly label for a checkbox key
 * @param {string} cbName - Option key
 * @param {Object} KeyWords - Locale dictionary
 * @returns {string}
 */
function labelFor(cbName, KeyWords) {
  const kw = KeyWords[cbName];
  if (kw) return Array.isArray(kw) ? Array.from(kw).join(', ') : kw;
  if (['NF_SPONSORED', 'GF_SPONSORED', 'VF_SPONSORED', 'MP_SPONSORED'].includes(cbName)) return KeyWords.SPONSORED;
  return cbName;
}

/**
 * Builds a styled native checkbox element
 * @param {string} name - Option key
 * @param {Object} ctx - Context object
 * @param {{ small?: boolean, data?: string|null }} [options]
 * @returns {HTMLInputElement}
 */
function buildCheckbox(name, ctx, { small = false, data = null } = {}) {
  const { VARS } = ctx;
  const cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.className = small ? 'cmf-check cmf-check--sm' : 'cmf-check';
  cb.setAttribute('cbType', 'T');
  cb.name = name;
  cb.value = name;
  cb.checked = !!(VARS.Options && VARS.Options[name]);
  if (data) cb.setAttribute(data, '');
  return cb;
}

/**
 * Creates toggle-style single checkbox row (label left, checkbox right).
 * Per user decision, cbReadOnly defaults to false (Sponsored remains unlocked).
 * @param {string} cbName - Name/Key of the option
 * @param {Object} ctx - Context object
 * @param {boolean} [cbReadOnly=false] - Whether checkbox is disabled/read-only
 * @returns {HTMLLabelElement}
 */
export function createSingleCB(cbName, ctx, cbReadOnly = false) {
  const { KeyWords } = ctx;
  const cb = buildCheckbox(cbName, ctx);
  if (cbReadOnly) {
    cb.checked = true;
    cb.disabled = true;
  }
  return buildRow(cb, labelFor(cbName, KeyWords), { locked: cbReadOnly });
}

/**
 * Creates radio button row (label left, radio right).
 * @param {string} rbName - Name of radio group
 * @param {string} rbValue - Value of this radio option
 * @param {string} rbLabelText - Text label
 * @param {Object} ctx - Context object
 * @returns {HTMLLabelElement}
 */
export function createRB(rbName, rbValue, rbLabelText, ctx) {
  const { VARS } = ctx;
  const rb = document.createElement('input');
  rb.type = 'radio';
  rb.className = 'cmf-radio';
  rb.name = rbName;
  rb.value = rbValue;
  rb.checked = VARS.Options && VARS.Options[rbName] === rbValue;
  return buildRow(rb, rbLabelText);
}

/**
 * Checkbox + number text input split row. Outer element is a DIV so the number field cannot toggle the checkbox.
 * @param {string} cbName - Option checkbox key (e.g. 'NF_LIKES_MAXIMUM')
 * @param {string} iName - Option numeric input key (e.g. 'NF_LIKES_MAXIMUM_COUNT')
 * @param {Object} ctx - Context object
 * @returns {HTMLDivElement}
 */
export function createCheckboxAndInput(cbName, iName, ctx) {
  const { VARS, KeyWords } = ctx;
  const row = document.createElement('div');
  row.className = 'cmf-row cmf-row--split';

  const lead = document.createElement('label');
  lead.className = 'cmf-row__lead';
  lead.appendChild(buildCheckbox(cbName, ctx));
  const span = document.createElement('span');
  span.className = 'cmf-row__text';
  span.textContent = KeyWords[cbName];
  lead.appendChild(span);

  const input = document.createElement('input');
  input.type = 'text'; // INVARIANT §2.2 — NOT type="number"
  input.className = 'cmf-num';
  input.name = iName;
  input.value = (VARS.Options && VARS.Options[iName] !== undefined) ? VARS.Options[iName] : '';
  input.placeholder = '1000';
  input.size = 6;
  input.setAttribute('inputmode', 'numeric');
  input.addEventListener('input', checkInputNumber, false);

  row.appendChild(lead);
  row.appendChild(input);
  return row;
}

/**
 * Builds the language selection dropdown row.
 * @param {Object} ctx - Context object
 * @returns {HTMLDivElement}
 */
export function createSelectLanguage(ctx) {
  const { KeyWords } = ctx;
  const field = document.createElement('div');
  field.className = 'cmf-field';
  const label = document.createElement('label');
  label.className = 'cmf-field__label';
  label.textContent = KeyWords.CMF_DIALOG_LANGUAGE_LABEL;
  field.appendChild(label);
  field.appendChild(getLanguagesComponent(ctx));
  return field;
}

/**
 * Collapsible <details> section container.
 * Returns { section, rows } — option rows are appended to rows.
 * @param {string} key - Section surface key ('NF' | 'GF' | 'VF' | 'MP' | 'PP' | etc.)
 * @param {string} title - Section header title
 * @param {Object} ctx - Context object
 * @returns {{ section: HTMLElement, rows: HTMLElement }}
 */
export function createSection(key, title, ctx) {
  const section = document.createElement('details');
  section.className = 'cmf-section';
  if (section.dataset) {
    section.dataset.cmfSection = key;
  } else {
    section.setAttribute('data-cmf-section', key);
  }

  const summary = document.createElement('summary');
  summary.className = 'cmf-section__summary';

  const titleEl = document.createElement('span');
  titleEl.className = 'cmf-section__title';
  titleEl.textContent = title;

  const chevron = document.createElement('span');
  chevron.className = 'cmf-section__chevron';
  chevron.setAttribute('aria-hidden', 'true');
  chevron.innerHTML = ctx?.VARS?.iconChevron || ICON_CHEVRON;

  summary.appendChild(titleEl);
  summary.appendChild(chevron);

  const rows = document.createElement('div');
  rows.className = 'cmf-section__rows';

  section.appendChild(summary);
  section.appendChild(rows);
  return { section, rows };
}

/**
 * Per-section text-filter panel with live Enabled/RegEx flags.
 * @param {string} prefix - 'NF' | 'GF' | 'VF' | 'MP' | 'PP' | 'GLOBAL'
 * @param {Array<{name:string, labelKey?:string, rows?:number}>} fields
 * @param {Object} ctx - Context object
 * @returns {HTMLDivElement}
 */
export function createFilterPanel(prefix, fields, ctx) {
  const { KeyWords, VARS } = ctx;
  const panel = document.createElement('div');
  panel.className = 'cmf-filter';
  if (panel.dataset) {
    panel.dataset.cmfFilter = prefix;
  } else {
    panel.setAttribute('data-cmf-filter', prefix);
  }

  const head = document.createElement('div');
  head.className = 'cmf-filter__head';
  const label = document.createElement('span');
  label.className = 'cmf-filter__label';
  label.textContent = KeyWords.DLG_BLOCK_TEXT_FILTER_TITLE;
  const flags = document.createElement('div');
  flags.className = 'cmf-filter__flags';
  flags.appendChild(buildFlag(`${prefix}_BLOCKED_ENABLED`, KeyWords.DLG_FILTER_ENABLED || 'Enabled', ctx, 'data-cmf-filter-toggle'));
  flags.appendChild(buildFlag(`${prefix}_BLOCKED_RE`, KeyWords.DLG_FILTER_REGEX || 'RegEx', ctx, 'data-cmf-filter-dependent'));
  head.appendChild(label);
  head.appendChild(flags);
  panel.appendChild(head);

  for (const f of fields) {
    const ta = document.createElement('textarea');
    ta.className = 'cmf-textarea';
    ta.name = f.name; // INVARIANT §2.2
    ta.rows = f.rows || 3;
    ta.placeholder = KeyWords.DLG_BLOCK_NEW_LINE || '';
    ta.setAttribute('data-cmf-filter-dependent', '');
    const val = (VARS.Options && VARS.Options[f.name]) || '';
    ta.value = val.split(VARS.SEP).join('\n');

    if (f.labelKey) {
      const labelText = KeyWords[f.labelKey] || f.labelKey;
      const field = document.createElement('div');
      field.className = 'cmf-field';
      const lb = document.createElement('label');
      lb.className = 'cmf-field__label';
      lb.textContent = labelText;
      ta.title = labelText;
      ta.setAttribute('aria-label', labelText);
      field.appendChild(lb);
      field.appendChild(ta);
      panel.appendChild(field);
    } else {
      const defaultTitle = KeyWords.DLG_BLOCK_TEXT_FILTER_TITLE || '';
      ta.title = defaultTitle;
      ta.setAttribute('aria-label', defaultTitle);
      panel.appendChild(ta);
    }
  }
  return panel;
}

function buildFlag(name, text, ctx, dataAttr) {
  const label = document.createElement('label');
  label.className = 'cmf-flag';
  label.appendChild(buildCheckbox(name, ctx, { small: true, data: dataAttr }));
  const span = document.createElement('span');
  span.textContent = text;
  label.appendChild(span);
  return label;
}

/**
 * Static note block (Profile/Page placeholder, Tips).
 * @param {string} text - Note message
 * @param {string} [cls='cmf-section__note'] - CSS class
 * @returns {HTMLDivElement}
 */
export function createNote(text, cls = 'cmf-section__note') {
  const el = document.createElement('div');
  el.className = cls;
  el.textContent = text;
  return el;
}
