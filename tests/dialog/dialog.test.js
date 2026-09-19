import { describe, test, expect, beforeEach } from 'bun:test';
import {
  checkInputNumber,
  getLanguagesComponent,
  createSingleCB,
  createRB,
  createCheckboxAndInput,
  createSection,
  createFilterPanel,
  createNote,
} from '@/modules/dialog/components.js';
import { createToggleButton, addLegendEvents } from '@/modules/dialog/toggle.js';
import { updateDialog } from '@/modules/dialog/updateDialog.js';
import { buildMoppingDialog, bindDialogKeys } from '@/modules/dialog/index.js';
import { saveUserOptions, exportUserOptions, importUserOptions, resetUserOptions } from '@/modules/dialog/actions.js';

describe('modules/dialog/components', () => {
  describe('checkInputNumber', () => {
    test('returns true for empty string', () => {
      const event = { target: { value: '' } };
      expect(checkInputNumber(event)).toBe(true);
    });

    test('extracts digits and converts to integer', () => {
      const event = { target: { value: '123abc456' } };
      checkInputNumber(event);
      expect(event.target.value).toBe(123456);
    });

    test('sets empty string if no digits found', () => {
      const event = { target: { value: 'abc' } };
      checkInputNumber(event);
      expect(event.target.value).toBe('');
    });
  });

  describe('DOM builders with mock document', () => {
    let mockElements;

    beforeEach(() => {
      mockElements = [];
      globalThis.document = {
        body: {
          children: [],
          appendChild(child) {
            this.children.push(child);
            return child;
          }
        },
        createElement: (tag) => {
          const el = {
            tagName: tag.toUpperCase(),
            children: [],
            childNodes: [],
            attributes: {},
            classList: {
              classes: new Set(),
              add(c) { this.classes.add(c); },
              remove(c) { this.classes.delete(c); },
              toggle(c) {
                if (this.classes.has(c)) this.classes.delete(c);
                else this.classes.add(c);
              }
            },
            setAttribute(k, v) { this.attributes[k] = v; },
            getAttribute(k) { return this.attributes[k]; },
            hasAttribute(k) { return k in this.attributes; },
            removeAttribute(k) { delete this.attributes[k]; },
            appendChild(child) {
              this.children.push(child);
              this.childNodes.push(child);
              child.parentElement = this;
              child.parentNode = this;
              return child;
            },
            removeChild(child) {
              const idx = this.children.indexOf(child);
              if (idx !== -1) this.children.splice(idx, 1);
              return child;
            },
            addEventListener: () => {},
            querySelectorAll: () => []
          };
          mockElements.push(el);
          return el;
        },
        createTextNode: (text) => ({ textContent: text, text }),
        getElementById: () => null,
        querySelector: () => null,
        querySelectorAll: () => []
      };
    });

    test('createSingleCB builds label containing text span and checkbox', () => {
      const mockCtx = {
        VARS: { Options: { NF_SPONSORED: true } },
        KeyWords: { SPONSORED: 'Sponsored', NF_SPONSORED: 'Sponsored' }
      };
      const result = createSingleCB('NF_SPONSORED', mockCtx);
      expect(result.tagName).toBe('LABEL');
      expect(result.className).toContain('cmf-row');
      expect(result.children.length).toBe(2); // span + checkbox
      const span = result.children[0];
      const cb = result.children[1];
      expect(span.textContent).toBe('Sponsored');
      expect(cb.type).toBe('checkbox');
      expect(cb.name).toBe('NF_SPONSORED');
      expect(cb.checked).toBe(true);
    });

    test('createSingleCB supports readOnly mode', () => {
      const mockCtx = {
        VARS: { Options: { NF_SPONSORED: false } },
        KeyWords: { SPONSORED: 'Sponsored' }
      };
      const result = createSingleCB('NF_SPONSORED', mockCtx, true);
      expect(result.tagName).toBe('LABEL');
      expect(result.className).toContain('cmf-row--locked');
      const cb = result.children[1];
      expect(cb.checked).toBe(true);
      expect(cb.disabled).toBe(true);
    });

    test('createRB builds label with radio button', () => {
      const mockCtx = {
        VARS: { Options: { VERBOSITY_LEVEL: '1' } }
      };
      const result = createRB('VERBOSITY_LEVEL', '1', 'Detailed', mockCtx);
      expect(result.tagName).toBe('LABEL');
      expect(result.className).toContain('cmf-row');
      const span = result.children[0];
      const rb = result.children[1];
      expect(span.textContent).toBe('Detailed');
      expect(rb.type).toBe('radio');
      expect(rb.value).toBe('1');
      expect(rb.checked).toBe(true);
    });

    test('createCheckboxAndInput builds split row with checkbox and number text input', () => {
      const mockCtx = {
        VARS: { Options: { NF_LIKES_MAXIMUM: true, NF_LIKES_MAXIMUM_COUNT: '500' } },
        KeyWords: { NF_LIKES_MAXIMUM: 'Max likes' }
      };
      const result = createCheckboxAndInput('NF_LIKES_MAXIMUM', 'NF_LIKES_MAXIMUM_COUNT', mockCtx);
      expect(result.tagName).toBe('DIV');
      expect(result.className).toContain('cmf-row--split');
      expect(result.children.length).toBe(2);
      const lead = result.children[0];
      const input = result.children[1];
      expect(lead.tagName).toBe('LABEL');
      expect(input.tagName).toBe('INPUT');
      expect(input.type).toBe('text'); // INVARIANT §2.2
      expect(input.value).toBe('500');
    });

    test('createSection builds details element with summary and rows container', () => {
      const mockCtx = { VARS: { iconChevron: '<svg></svg>' } };
      const { section, rows } = createSection('NF', 'News Feed', mockCtx);
      expect(section.tagName).toBe('DETAILS');
      expect(section.className).toBe('cmf-section');
      expect(section.children[0].tagName).toBe('SUMMARY');
      expect(rows.className).toBe('cmf-section__rows');
    });

    test('createFilterPanel builds filter panel with toggle and regex flags', () => {
      const mockCtx = {
        VARS: { Options: { NF_BLOCKED_ENABLED: true, NF_BLOCKED_RE: false, NF_BLOCKED_TEXT: 'cat¦¦dog' }, SEP: '¦¦' },
        KeyWords: { DLG_BLOCK_TEXT_FILTER_TITLE: 'Keywords', DLG_FILTER_ENABLED: 'Enabled', DLG_FILTER_REGEX: 'RegEx' }
      };
      const panel = createFilterPanel('NF', [{ name: 'NF_BLOCKED_TEXT' }], mockCtx);
      expect(panel.tagName).toBe('DIV');
      expect(panel.className).toBe('cmf-filter');
      expect(panel.children.length).toBe(2); // head + textarea
    });

    test('createFilterPanel builds labeled textareas with titles for Marketplace dual fields', () => {
      const mockCtx = {
        VARS: {
          Options: {
            MP_BLOCKED_TEXT: '100\n200',
            MP_BLOCKED_TEXT_DESCRIPTION: 'scam',
          },
          SEP: '\n',
        },
        KeyWords: {
          DLG_BLOCK_TEXT_FILTER_TITLE: 'Text filter',
          DLG_FILTER_ENABLED: 'Enabled',
          DLG_FILTER_REGEX: 'RegEx',
          DLG_MP_PRICES: 'Prices',
          DLG_MP_DESCRIPTION: 'Description',
        },
      };
      const fields = [
        { name: 'MP_BLOCKED_TEXT', labelKey: 'DLG_MP_PRICES', rows: 2 },
        { name: 'MP_BLOCKED_TEXT_DESCRIPTION', labelKey: 'DLG_MP_DESCRIPTION', rows: 2 },
      ];
      const panel = createFilterPanel('MP', fields, mockCtx);
      expect(panel.children.length).toBe(3); // head + field1 + field2

      const priceField = panel.children[1];
      expect(priceField.className).toBe('cmf-field');
      const priceLabel = priceField.children[0];
      const priceTextarea = priceField.children[1];
      expect(priceLabel.textContent).toBe('Prices');
      expect(priceTextarea.title).toBe('Prices');
      expect(priceTextarea.getAttribute('aria-label')).toBe('Prices');
      expect(priceTextarea.name).toBe('MP_BLOCKED_TEXT');

      const descField = panel.children[2];
      expect(descField.className).toBe('cmf-field');
      const descLabel = descField.children[0];
      const descTextarea = descField.children[1];
      expect(descLabel.textContent).toBe('Description');
      expect(descTextarea.title).toBe('Description');
      expect(descTextarea.getAttribute('aria-label')).toBe('Description');
      expect(descTextarea.name).toBe('MP_BLOCKED_TEXT_DESCRIPTION');
    });

    test('createNote builds static note div', () => {
      const note = createNote('Test note', 'cmf-tips');
      expect(note.tagName).toBe('DIV');
      expect(note.className).toBe('cmf-tips');
      expect(note.textContent).toBe('Test note');
    });

    test('getLanguagesComponent creates select element with supported languages', () => {
      const mockCtx = {
        VARS: { language: 'en' },
        getSupportedLanguages: () => [
          { code: 'en', name: 'English', direction: 'ltr' },
          { code: 'vi', name: 'Tiếng Việt', direction: 'ltr' },
        ],
      };
      const select = getLanguagesComponent(mockCtx);
      expect(select.tagName).toBe('SELECT');
      expect(select.name).toBe('CMF_DIALOG_LANGUAGE');
      expect(select.children.length).toBe(2);
      expect(select.children[0].value).toBe('en');
      expect(select.children[0].textContent).toBe('English');
      expect(select.children[0].attributes.selected).toBeDefined();
    });
  });
});

describe('modules/dialog/actions', () => {
  test('exports action functions', () => {
    expect(typeof saveUserOptions).toBe('function');
    expect(typeof exportUserOptions).toBe('function');
    expect(typeof importUserOptions).toBe('function');
    expect(typeof resetUserOptions).toBe('function');
  });

  test('exportUserOptions creates download anchor and clicks it', () => {
    let clicked = false;
    let removed = false;
    globalThis.window = {
      URL: {
        createObjectURL: (blob) => 'blob:mock-url'
      }
    };
    globalThis.document = {
      createElement: (tag) => ({
        href: '',
        download: '',
        click: () => { clicked = true; },
        remove: () => { removed = true; }
      }),
      querySelector: () => ({ textContent: '' })
    };

    const mockCtx = {
      VARS: { Options: { NF_SPONSORED: true } }
    };
    exportUserOptions(mockCtx);
    expect(clicked).toBe(true);
    expect(removed).toBe(true);
  });
});

describe('modules/dialog/index', () => {
  test('exports buildMoppingDialog function', () => {
    expect(typeof buildMoppingDialog).toBe('function');
  });

  test('exports bindDialogKeys function', () => {
    expect(typeof bindDialogKeys).toBe('function');
  });
});

describe('modules/dialog/createDialog schema', () => {
  test('includes GLOBAL section in SECTIONS', async () => {
    const { SECTIONS } = await import('@/modules/dialog/createDialog.js');
    const globalSection = SECTIONS.find((s) => s.key === 'GLOBAL');
    expect(globalSection).toBeDefined();
    expect(globalSection.titleKey).toBe('DLG_GLOBAL');
    expect(globalSection.filter).toEqual([{ name: 'GLOBAL_BLOCKED_TEXT' }]);
  });
});

describe('modules/dialog/toggle', () => {
  test('createToggleButton creates and appends toggle button to document.body', () => {
    let clicked = false;
    const bodyChildren = [];
    const attrs = {};
    globalThis.document = {
      createElement: (tag) => ({
        tagName: tag.toUpperCase(),
        innerHTML: '',
        id: '',
        title: '',
        className: '',
        addEventListener: () => {},
        setAttribute: (k, v) => { attrs[k] = v; },
        getAttribute: (k) => attrs[k],
      }),
      body: {
        appendChild: (el) => bodyChildren.push(el),
      },
    };
    const mockCtx = {
      VARS: {
        logoHTML: '<svg id="logo"></svg>',
        Options: { CMF_BTN_OPTION: '1' },
      },
      KeyWords: { DLG_TITLE: 'Clean my feeds' },
      toggleDialog: () => {
        clicked = true;
      },
    };
    createToggleButton(mockCtx);
    expect(mockCtx.VARS.btnToggleEl).toBeDefined();
    expect(mockCtx.VARS.btnToggleEl.id).toBe('fbcmfToggle');
    expect(mockCtx.VARS.btnToggleEl.className).toBe('fb-cmf-toggle fb-cmf-icon');
    expect(mockCtx.VARS.btnToggleEl.title).toBe('Clean my feeds');
    expect(attrs['data-cmf-pos']).toBe('top-right');
    expect(bodyChildren).toContain(mockCtx.VARS.btnToggleEl);
  });

  test('addLegendEvents wires section open states based on defaultOpenKey', () => {
    const mockSection = {
      tagName: 'DETAILS',
      dataset: { cmfSection: 'NF' },
      open: false,
      querySelectorAll: () => [],
    };
    const mockRoot = {
      querySelectorAll: (sel) => (sel.includes('.cmf-section') ? [mockSection] : []),
      querySelector: () => null,
    };
    globalThis.document.getElementById = (id) => (id === 'fbcmf' ? mockRoot : null);
    addLegendEvents({});
    expect(mockSection.open).toBe(true);
  });
});

describe('modules/dialog/updateDialog', () => {
  test('updateDialog synchronizes inputs with VARS.Options', () => {
    const cb = {
      tagName: 'INPUT',
      type: 'checkbox',
      name: 'NF_SPONSORED',
      checked: false,
      attributes: { cbtype: 'T' },
    };
    const ta = {
      tagName: 'TEXTAREA',
      name: 'NF_BLOCKED_TEXT',
      value: '',
    };
    const content = {
      querySelectorAll: (sel) => {
        if (sel.includes('input[type="checkbox"]')) return [cb];
        if (sel.includes('textarea')) return [ta];
        return [];
      },
    };
    const root = {
      querySelector: (sel) => (sel === '.content' ? content : null),
      querySelectorAll: () => [],
    };
    globalThis.document.getElementById = (id) => (id === 'fbcmf' ? root : null);

    const mockCtx = {
      VARS: {
        Options: {
          NF_SPONSORED: true,
          NF_BLOCKED_TEXT: 'bad¦¦ugly',
        },
        SEP: '¦¦',
      },
    };

    updateDialog(mockCtx);
    expect(cb.checked).toBe(true);
    expect(ta.value).toBe('bad\nugly');
  });
});
