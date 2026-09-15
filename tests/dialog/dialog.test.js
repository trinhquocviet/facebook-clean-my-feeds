import { describe, test, expect, beforeEach, mock } from 'bun:test';
import { checkInputNumber, getLanguagesComponent, createSingleCB, createMultipeCBs, createRB, createCheckboxAndInput } from '../../src/modules/dialog/components.js';
import { createToggleButton, addLegendEvents } from '../../src/modules/dialog/toggle.js';
import { updateDialog } from '../../src/modules/dialog/updateDialog.js';
import { buildMoppingDialog } from '../../src/modules/dialog/index.js';
import { saveUserOptions, exportUserOptions, importUserOptions, resetUserOptions } from '../../src/modules/dialog/actions.js';

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

    test('createSingleCB builds div containing label and checkbox', () => {
      const mockCtx = {
        VARS: { Options: { NF_SPONSORED: true } },
        KeyWords: { SPONSORED: 'Sponsored', NF_SPONSORED: 'Sponsored' }
      };
      const result = createSingleCB('NF_SPONSORED', mockCtx);
      expect(result.tagName).toBe('DIV');
      expect(result.children.length).toBe(1); // label
      const label = result.children[0];
      expect(label.children.length).toBe(2); // checkbox + text node
      expect(label.children[0].type).toBe('checkbox');
      expect(label.children[0].name).toBe('NF_SPONSORED');
      expect(label.children[0].checked).toBe(true);
    });

    test('createSingleCB supports readOnly mode', () => {
      const mockCtx = {
        VARS: { Options: { NF_SPONSORED: false } },
        KeyWords: { SPONSORED: 'Sponsored' }
      };
      const result = createSingleCB('NF_SPONSORED', mockCtx, true);
      const label = result.children[0];
      const cb = label.children[0];
      expect(cb.checked).toBe(true);
      expect(cb.disabled).toBe(true);
      expect(label.getAttribute('disabled')).toBe('disabled');
    });

    test('createRB builds div with radio button', () => {
      const mockCtx = {
        VARS: { Options: { VERBOSITY_LEVEL: '1' } }
      };
      const result = createRB('VERBOSITY_LEVEL', '1', 'Detailed', mockCtx);
      expect(result.tagName).toBe('DIV');
      const label = result.children[0];
      const rb = label.children[0];
      expect(rb.type).toBe('radio');
      expect(rb.value).toBe('1');
      expect(rb.checked).toBe(true);
    });

    test('createMultipeCBs returns array of div elements and trailing br', () => {
      const mockCtx = {
        VARS: { Options: { NF_BLOCKED_FEED: ['1', '0'] } },
        KeyWords: { NF_BLOCKED_FEED: ['Option A', 'Option B'] }
      };
      const results = createMultipeCBs('NF_BLOCKED_FEED', mockCtx);
      expect(results.length).toBe(3); // 2 divs + 1 br
      expect(results[0].tagName).toBe('DIV');
      expect(results[2].tagName).toBe('BR');
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
});
