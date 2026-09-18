/**
 * Dialog State Synchronization Module
 * Syncs DOM controls with current VARS.Options state
 * Part of FB - Clean My Feeds
 */

import { refreshFilterGates } from './toggle.js';

const SYNC_RULES = [
  {
    selector: 'input[type="checkbox"][cbtype="T"]',
    apply: (el, val) => {
      el.checked = Boolean(val);
    },
  },
  {
    selector: 'input[type="radio"]',
    apply: (el, val) => {
      el.checked = el.value === val;
    },
  },
  {
    selector: 'textarea',
    apply: (el, val, VARS) => {
      el.value = String(val).replaceAll(VARS.SEP, '\n');
    },
  },
  {
    selector: 'input[type="text"]',
    apply: (el, val) => {
      el.value = val;
    },
  },
  {
    selector: 'select',
    apply: (el, val) => {
      el.value = val;
      if (el.value !== val) {
        for (const option of el.options) {
          option.selected = option.value === val;
        }
      }
    },
  },
];

/**
 * Updates all dialog input elements to match VARS.Options values.
 * @param {Object} ctx - Context object
 */
export function updateDialog(ctx) {
  const { VARS } = ctx;
  const root = document.getElementById('fbcmf');
  const content = root?.querySelector('.content');
  if (!content || !VARS?.Options) return;

  SYNC_RULES.forEach(({ selector, apply }) => {
    const elements = content.querySelectorAll(selector);
    elements.forEach((el) => {
      if (Object.prototype.hasOwnProperty.call(VARS.Options, el.name)) {
        apply(el, VARS.Options[el.name], VARS);
      }
    });
  });

  refreshFilterGates(root);
}
