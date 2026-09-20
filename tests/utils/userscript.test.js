import { describe, test, expect } from 'bun:test';
import { generateUserscriptHeader } from '../../scripts/utils/userscript.js';

describe('scripts/utils/userscript', () => {
  describe('generateUserscriptHeader', () => {
    test('generates full header with standard delimiters and formatting', () => {
      const config = {
        name: 'Test Script',
        description: 'A test userscript',
        namespace: 'https://example.com',
        homepageURL: 'https://github.com/trinhquocviet/facebook-clean-my-feeds',
        supportURL: 'https://github.com/trinhquocviet/facebook-clean-my-feeds/issues',
        downloadURL: 'https://github.com/trinhquocviet/facebook-clean-my-feeds/releases/latest/download/fb-clean-my-feeds.user.js',
        updateURL: 'https://github.com/trinhquocviet/facebook-clean-my-feeds/releases/latest/download/fb-clean-my-feeds.user.js',
        version: '1.0.0',
        author: [
          'trinhquocviet (https://github.com/trinhquocviet)',
          'zbluebugz (https://github.com/zbluebugz/)'
        ],
        match: [
          'https://www.facebook.com/*',
          'https://web.facebook.com/*'
        ],
        noframes: '',
        grant: ['unsafeWindow']
      };

      const header = generateUserscriptHeader(config);

      expect(header.startsWith('// ==UserScript==\n')).toBe(true);
      expect(header.endsWith('// ==/UserScript==\n')).toBe(true);

      expect(header).toContain('// @name           Test Script');
      expect(header).toContain('// @description    A test userscript');
      expect(header).toContain('// @homepageURL    https://github.com/trinhquocviet/facebook-clean-my-feeds');
      expect(header).toContain('// @supportURL     https://github.com/trinhquocviet/facebook-clean-my-feeds/issues');
      expect(header).toContain('// @downloadURL    https://github.com/trinhquocviet/facebook-clean-my-feeds/releases/latest/download/fb-clean-my-feeds.user.js');
      expect(header).toContain('// @updateURL      https://github.com/trinhquocviet/facebook-clean-my-feeds/releases/latest/download/fb-clean-my-feeds.user.js');
      expect(header).toContain('// @author         trinhquocviet (https://github.com/trinhquocviet)');
      expect(header).toContain('// @author         zbluebugz (https://github.com/zbluebugz/)');
      expect(header).toContain('// @noframes');
      expect(header).toContain('// @grant          unsafeWindow');
    });

    test('falls back to defaultVersion when version is not in userscriptJson', () => {
      const config = {
        name: 'Version Test'
      };
      const header = generateUserscriptHeader(config, '5.03.00');
      expect(header).toContain('// @version        5.03.00');
    });

    test('prefers explicitly defined version over defaultVersion', () => {
      const config = {
        name: 'Explicit Version',
        version: '9.9.9'
      };
      const header = generateUserscriptHeader(config, '1.0.0');
      expect(header).toContain('// @version        9.9.9');
    });

    test('handles single author string correctly', () => {
      const config = {
        name: 'Single Author',
        author: 'trinhquocviet'
      };
      const header = generateUserscriptHeader(config);
      expect(header).toContain('// @author         trinhquocviet');
    });

    test('handles boolean flags and ignores falsy values', () => {
      const config = {
        name: 'Flags Test',
        noframes: true,
        disabledFlag: false,
        nullFlag: null,
        undefinedFlag: undefined
      };
      const header = generateUserscriptHeader(config);
      expect(header).toContain('// @noframes');
      expect(header).not.toContain('disabledFlag');
      expect(header).not.toContain('nullFlag');
      expect(header).not.toContain('undefinedFlag');
    });

    test('appends custom/unknown tags after standard tags', () => {
      const config = {
        name: 'Custom Tag',
        customTag: 'customValue'
      };
      const header = generateUserscriptHeader(config);
      expect(header).toContain('// @customTag      customValue');
      const nameIndex = header.indexOf('@name');
      const customIndex = header.indexOf('@customTag');
      expect(nameIndex).toBeLessThan(customIndex);
    });

    test('returns empty string when userscriptJson is invalid', () => {
      expect(generateUserscriptHeader(null)).toBe('');
      expect(generateUserscriptHeader(undefined)).toBe('');
      expect(generateUserscriptHeader('invalid')).toBe('');
    });
  });
});
