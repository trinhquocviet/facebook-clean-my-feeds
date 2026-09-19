import { describe, it, expect } from 'bun:test';
import fs from 'fs';
import path from 'path';
import { m_mopUpTheNewsFeed } from '@/modules/feed-cleaners/mobile/news-feed-cleaner.js';
import { createPostObscurer } from '@/modules/post-obscurer/post-obscurer.js';
import { getMobileKeywords } from '@/i18n/mobile/index.js';
import {
  mobileCollapsedAtt,
  mobileContentAtt,
  mobileSummaryAtt,
  mobileDividerCollapsedAtt,
  postAtt
} from '@/constants/index.js';

/**
 * Lightweight mock element supporting full DOM operations needed for mobile feed inspection.
 */
class MockElement {
  constructor(tagName, ownerDoc) {
    this.nodeType = 1;
    this.tagName = tagName.toUpperCase();
    this.attributes = {};
    this.children = [];
    this.childNodes = [];
    this.parentNode = null;
    this.ownerDocument = ownerDoc;
    const styleObj = {
      setProperty(k, v, p) {
        styleObj[k] = v;
        styleObj[k + '_priority'] = p || '';
      },
      getPropertyValue(k) {
        return styleObj[k] || '';
      },
      getPropertyPriority(k) {
        return styleObj[k + '_priority'] || '';
      }
    };
    this.style = styleObj;
    this._listeners = {};
    const self = this;
    this.classList = {
      contains(c) {
        return (self.className || '').split(/\s+/).includes(c);
      },
      add(c) {
        const classes = (self.className || '').split(/\s+/).filter(Boolean);
        if (!classes.includes(c)) classes.push(c);
        self.className = classes.join(' ');
      },
      remove(c) {
        self.className = (self.className || '').split(/\s+/).filter((x) => x !== c).join(' ');
      }
    };
  }

  get className() {
    return this.getAttribute('class') || '';
  }

  set className(val) {
    this.setAttribute('class', val);
  }

  get firstChild() {
    return this.childNodes[0] || null;
  }

  getAttribute(name) {
    return this.attributes[name.toLowerCase()] ?? null;
  }

  setAttribute(name, val) {
    this.attributes[name.toLowerCase()] = String(val);
    if (name.toLowerCase() === 'style') {
      this.parseStyle(String(val));
    }
  }

  parseStyle(styleStr) {
    const parts = styleStr.split(';');
    for (const part of parts) {
      const idx = part.indexOf(':');
      if (idx !== -1) {
        const k = part.substring(0, idx).trim();
        const v = part.substring(idx + 1).trim();
        this.style[k] = v;
      }
    }
  }

  hasAttribute(name) {
    return name.toLowerCase() in this.attributes;
  }

  removeAttribute(name) {
    delete this.attributes[name.toLowerCase()];
  }

  get textContent() {
    return this.childNodes.map((n) => (n.nodeType === 3 ? n.textContent : n.textContent)).join('');
  }

  set textContent(val) {
    this.childNodes = [{ nodeType: 3, textContent: val, parentNode: this, ownerDocument: this.ownerDocument }];
    this.children = [];
  }

  appendChild(child) {
    if (child.parentNode) child.parentNode.removeChild(child);
    child.parentNode = this;
    child.ownerDocument = this.ownerDocument;
    this.childNodes.push(child);
    if (child.nodeType === 1) this.children.push(child);
    return child;
  }

  removeChild(child) {
    const idx = this.childNodes.indexOf(child);
    if (idx !== -1) this.childNodes.splice(idx, 1);
    const cIdx = this.children.indexOf(child);
    if (cIdx !== -1) this.children.splice(cIdx, 1);
    child.parentNode = null;
    return child;
  }

  insertBefore(newChild, refChild) {
    if (!refChild) return this.appendChild(newChild);
    if (newChild.parentNode) newChild.parentNode.removeChild(newChild);
    newChild.parentNode = this;
    newChild.ownerDocument = this.ownerDocument;
    const idx = this.childNodes.indexOf(refChild);
    if (idx !== -1) this.childNodes.splice(idx, 0, newChild);
    else this.childNodes.push(newChild);
    if (newChild.nodeType === 1) {
      const cIdx = this.children.indexOf(refChild);
      if (cIdx !== -1) this.children.splice(cIdx, 0, newChild);
      else this.children.push(newChild);
    }
    return newChild;
  }

  querySelector(selector) {
    return this.querySelectorAll(selector)[0] || null;
  }

  querySelectorAll(selector) {
    const results = [];
    const selectors = selector.split(',').map((s) => s.trim());
    const match = (el) => {
      for (const sel of selectors) {
        if (matchesSimple(el, sel)) return true;
      }
      return false;
    };
    const traverse = (node) => {
      for (const child of node.children) {
        if (match(child)) results.push(child);
        traverse(child);
      }
    };
    traverse(this);
    return results;
  }

  closest(selector) {
    let cur = this;
    while (cur && cur.nodeType === 1) {
      const selectors = selector.split(',').map((s) => s.trim());
      for (const sel of selectors) {
        if (matchesSimple(cur, sel)) return cur;
      }
      cur = cur.parentNode;
    }
    return null;
  }

  addEventListener(evt, fn) {
    if (!this._listeners[evt]) this._listeners[evt] = [];
    this._listeners[evt].push(fn);
  }

  click() {
    const event = {
      type: 'click',
      preventDefault() {},
      stopPropagation() {},
      stopImmediatePropagation() {}
    };
    if (this._listeners.click) {
      this._listeners.click.forEach((fn) => fn(event));
    }
  }
}

function matchesSimple(el, selector) {
  let s = selector;
  const attrMatches = [...s.matchAll(/\[([a-zA-Z0-9\-_:@.]+)(?:([*~^$]?=)(?:"([^"]*)"|'([^']*)'|([^\]]+)))?\]/g)];
  for (const m of attrMatches) {
    const attrName = m[1];
    const op = m[2];
    const val = m[3] ?? m[4] ?? m[5];
    if (!el.hasAttribute(attrName)) return false;
    if (op === '=' && el.getAttribute(attrName) !== val) return false;
    if (op === '*=' && !el.getAttribute(attrName)?.includes(val)) return false;
    s = s.replace(m[0], '');
  }
  const classMatches = [...s.matchAll(/\.([a-zA-Z0-9\-_]+)/g)];
  for (const m of classMatches) {
    if (!el.classList.contains(m[1])) return false;
    s = s.replace(m[0], '');
  }
  s = s.trim();
  if (s && s !== '*' && el.tagName.toLowerCase() !== s.toLowerCase()) return false;
  return true;
}

const tagRegex = /<\/?([a-zA-Z0-9\-]+)((?:\s+[a-zA-Z0-9\-_:@.]+(?:\s*=\s*(?:"[^"]*"|'[^']*'|[^\s>]+))?)*)\s*(\/?)>/g;
const attrRegex = /([a-zA-Z0-9\-_:@.]+)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/g;

function parseHTML(html) {
  const doc = {
    createElement(tag) {
      return new MockElement(tag, doc);
    },
    createTextNode(txt) {
      return { nodeType: 3, textContent: txt, ownerDocument: doc };
    }
  };
  const root = new MockElement('root', doc);
  doc.root = root;
  doc.querySelector = (sel) => root.querySelector(sel);
  doc.querySelectorAll = (sel) => root.querySelectorAll(sel);
  doc.getElementById = (id) => root.querySelector('#' + id);

  const stack = [root];
  let lastIndex = 0;
  let match;

  while ((match = tagRegex.exec(html)) !== null) {
    const textBetween = html.substring(lastIndex, match.index);
    if (textBetween) {
      const text = textBetween
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');
      stack[stack.length - 1].childNodes.push({
        nodeType: 3,
        textContent: text,
        parentNode: stack[stack.length - 1],
        ownerDocument: doc
      });
    }
    lastIndex = tagRegex.lastIndex;

    const isClosing = match[0].startsWith('</');
    const tagName = match[1];
    const rawAttrs = match[2];
    const selfClosing =
      match[3] === '/' || ['img', 'input', 'br', 'hr', 'meta', 'link'].includes(tagName.toLowerCase());

    if (isClosing) {
      while (stack.length > 1) {
        const top = stack.pop();
        if (top.tagName.toLowerCase() === tagName.toLowerCase()) break;
      }
    } else {
      const el = new MockElement(tagName, doc);
      if (rawAttrs) {
        let attrMatch;
        attrRegex.lastIndex = 0;
        while ((attrMatch = attrRegex.exec(rawAttrs)) !== null) {
          const name = attrMatch[1];
          const val = attrMatch[2] ?? attrMatch[3] ?? attrMatch[4] ?? '';
          el.setAttribute(name, val);
        }
      }
      stack[stack.length - 1].appendChild(el);
      if (!selfClosing) {
        stack.push(el);
      }
    }
  }
  return doc;
}

describe('tests/integration/mobile-fixture-2.test.js - Real DOM Fixture Validation', () => {
  const fixturePath = path.resolve(import.meta.dir, '../../temp/fb-mobile-2.html');
  const fixtureHtml = fs.readFileSync(fixturePath, 'utf-8');

  it('runs complete m_mopUpTheNewsFeed pipeline and accurately filters all target items', () => {
    const doc = parseHTML(fixtureHtml);
    const vscroller = doc.querySelector('[data-type="vscroller"]');
    expect(vscroller).toBeTruthy();
    expect(vscroller.children.length).toBe(57);

    const VARS = {
      isMobile: true,
      hideAtt: 'data-cmf-hide',
      showAtt: 'data-cmf-show',
      cssHideEl: 'data-cmf-css-hide',
      Filters: { GLOBAL_BLOCKED_ENABLED: false, GLOBAL_BLOCKED_TERMS: [] },
      Options: {
        VERBOSITY_LEVEL: '1',
        VERBOSITY_DEBUG: false,
        SPONSORED: true,
        NF_FOLLOW: true,
        NF_UNJOINED_GROUP: true,
        NF_STORIES: true,
        NF_SHORT_REEL_VIDEO: true
      }
    };

    const KeyWords = getMobileKeywords('en');
    const postObscurer = createPostObscurer(VARS, () => KeyWords);

    const ctx = {
      VARS,
      KeyWords,
      postObscurer,
      isTheHouseDirty: () => [vscroller, vscroller],
      doc
    };

    // Execute full cleaning pipeline
    m_mopUpTheNewsFeed(ctx);

    const children = vscroller.children;

    // Helper to inspect collapsed state
    function getSummaryText(cell) {
      const summary = cell.querySelector('.cmf-mobile-summary');
      return summary?.textContent?.trim() || '';
    }

    // 1. Stories Tray (Cell [5])
    expect(children[5].hasAttribute(mobileCollapsedAtt)).toBe(true);
    expect(getSummaryText(children[5])).toBe('Stories');

    // 2. Ads & Sponsored posts from fb-mobile-2.md:
    // - Panasonic Vietnam (Cell [13])
    expect(children[13].hasAttribute(mobileCollapsedAtt)).toBe(true);
    expect(getSummaryText(children[13])).toBe('Sponsored');

    // - Singapore Airlines (Cell [21])
    expect(children[21].hasAttribute(mobileCollapsedAtt)).toBe(true);
    expect(getSummaryText(children[21])).toBe('Sponsored');

    // - Uniqlo Vietnam (Cell [29])
    expect(children[29].hasAttribute(mobileCollapsedAtt)).toBe(true);
    expect(getSummaryText(children[29])).toBe('Sponsored');

    // 3. Suggested Follow pages from fb-mobile-2.md:
    // - Hay Nhức Nhói (Cell [11])
    expect(children[11].hasAttribute(mobileCollapsedAtt)).toBe(true);
    expect(getSummaryText(children[11])).toBe('Suggested: Follow');

    // - Nghi Huynh Quoc (Cell [19])
    expect(children[19].hasAttribute(mobileCollapsedAtt)).toBe(true);
    expect(getSummaryText(children[19])).toBe('Suggested: Follow');

    // - Trần Vy Vy (Cell [23])
    expect(children[23].hasAttribute(mobileCollapsedAtt)).toBe(true);
    expect(getSummaryText(children[23])).toBe('Suggested: Follow');

    // - MCV Network US (Cell [25])
    expect(children[25].hasAttribute(mobileCollapsedAtt)).toBe(true);
    expect(getSummaryText(children[25])).toBe('Suggested: Follow');

    // - Linux Inside (Cell [27])
    expect(children[27].hasAttribute(mobileCollapsedAtt)).toBe(true);
    expect(getSummaryText(children[27])).toBe('Suggested: Follow');

    // - Sài Gòn 24H (Cell [31])
    expect(children[31].hasAttribute(mobileCollapsedAtt)).toBe(true);
    expect(getSummaryText(children[31])).toBe('Suggested: Follow');

    // - Yêu là cưới? (Cell [33])
    expect(children[33].hasAttribute(mobileCollapsedAtt)).toBe(true);
    expect(getSummaryText(children[33])).toBe('Suggested: Follow');

    // 4. Groups that I did not join from fb-mobile-2.md:
    // - Hội máy hàn cell pin tự chế (author Lê Đức, Cell [15])
    expect(children[15].hasAttribute(mobileCollapsedAtt)).toBe(true);
    expect(getSummaryText(children[15])).toBe('Unjoined Group');

    // 5. Reels shelf from fb-mobile-2.md:
    // - Johnny with 86 thousand views (Cell [17])
    expect(children[17].hasAttribute(mobileCollapsedAtt)).toBe(true);
    expect(getSummaryText(children[17])).toBe('Reels');

    // 6. Positive Controls: Organic posts MUST remain visible & untouched
    // - Cell [9] (FabulousPeacock1721 - joined public group)
    expect(children[9].hasAttribute(mobileCollapsedAtt)).toBe(false);
    expect(children[9].hasAttribute(postAtt)).toBe(false);

    // - Cell [35] (Huu Canh - joined public group)
    expect(children[35].hasAttribute(mobileCollapsedAtt)).toBe(false);
    expect(children[35].hasAttribute(postAtt)).toBe(false);

    // - Cell [47] (Ngô Văn Hoàng - joined private group)
    expect(children[47].hasAttribute(mobileCollapsedAtt)).toBe(false);
    expect(children[47].hasAttribute(postAtt)).toBe(false);

    // 7. Structural Invariants:
    // Every cell must remain a direct child of vscroller to prevent breaking WebLite virtualization
    expect(vscroller.children.length).toBe(57);
    for (const cell of vscroller.children) {
      expect(cell.parentNode).toBe(vscroller);
    }

    // Obscured cells must contain a details.cmf-mobile-details with content wrapper
    const obscuredSample = children[13];
    const details = obscuredSample.querySelector('details.cmf-mobile-details');
    expect(details).toBeTruthy();
    // Attribute key cmfr is stamped on details and cell!
    expect(details.getAttribute('cmfr')).toBe('Sponsored');
    expect(details.getAttribute(postAtt)).toBe('Sponsored');
    expect(obscuredSample.getAttribute('cmfr')).toBe('Sponsored');
    expect(obscuredSample.style.getPropertyValue('height')).toBe('auto');

    const content = details.querySelector('div[data-cmf-mobile-content]');
    expect(content).toBeTruthy();

    // Verify click on summary reliably triggers expand / collapse
    const summary = details.querySelector('.cmf-mobile-summary');
    expect(summary).toBeTruthy();
    expect(details.hasAttribute('open')).toBe(false);

    // Expand
    summary.click();
    expect(details.hasAttribute('open')).toBe(true);
    expect(content.style.display).toBe('block');

    // Collapse
    summary.click();
    expect(details.hasAttribute('open')).toBe(false);
    expect(content.style.display).toBe('none');
  });

  it('supports silent purge mode (VERBOSITY_LEVEL = 0) collapsing posts without details wrapper', () => {
    const doc = parseHTML(fixtureHtml);
    const vscroller = doc.querySelector('[data-type="vscroller"]');

    const VARS = {
      isMobile: true,
      hideAtt: 'data-cmf-hide',
      showAtt: 'data-cmf-show',
      cssHideEl: 'data-cmf-css-hide',
      Filters: { GLOBAL_BLOCKED_ENABLED: false, GLOBAL_BLOCKED_TERMS: [] },
      Options: {
        VERBOSITY_LEVEL: '0',
        VERBOSITY_DEBUG: false,
        SPONSORED: true,
        NF_FOLLOW: true,
        NF_UNJOINED_GROUP: true,
        NF_STORIES: true,
        NF_SHORT_REEL_VIDEO: true
      }
    };

    const KeyWords = getMobileKeywords('en');
    const postObscurer = createPostObscurer(VARS, () => KeyWords);

    const ctx = {
      VARS,
      KeyWords,
      postObscurer,
      isTheHouseDirty: () => [vscroller, vscroller],
      doc
    };

    m_mopUpTheNewsFeed(ctx);

    const children = vscroller.children;

    // Panasonic Vietnam ad (Cell [13]) in silent purge mode
    expect(children[13].hasAttribute(VARS.hideAtt)).toBe(true);
    expect(children[13].hasAttribute(mobileCollapsedAtt)).toBe(true);
    expect(children[13].querySelector('details')).toBeNull();

    // Organic post (Cell [9]) remains visible
    expect(children[9].hasAttribute(VARS.hideAtt)).toBe(false);
    expect(children[9].hasAttribute(mobileCollapsedAtt)).toBe(false);
  });
});
