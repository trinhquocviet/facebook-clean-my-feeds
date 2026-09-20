import { describe, test, expect } from 'bun:test';
import {
  generateUserscriptHeader,
  cleanVersion,
  resolveTargetVersion,
} from '../../scripts/utils/userscript.js';

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

  describe('cleanVersion', () => {
    test('strips leading v prefix and trims whitespace', () => {
      expect(cleanVersion('v5.03.01')).toBe('5.03.01');
      expect(cleanVersion('V1.2.0 ')).toBe('1.2.0');
      expect(cleanVersion('5.03.00')).toBe('5.03.00');
    });

    test('strips refs/tags/ prefix and optional v', () => {
      expect(cleanVersion('refs/tags/v5.04.00')).toBe('5.04.00');
      expect(cleanVersion('refs/tags/5.04.00')).toBe('5.04.00');
    });

    test('handles empty or non-string inputs safely', () => {
      expect(cleanVersion('')).toBe('');
      expect(cleanVersion(null)).toBe('');
      expect(cleanVersion(undefined)).toBe('');
    });
  });

  describe('resolveTargetVersion', () => {
    test('resolves from CLI argument --version', () => {
      const version = resolveTargetVersion('1.0.0', {
        argv: ['--version', 'v2.3.4'],
      });
      expect(version).toBe('2.3.4');
    });

    test('resolves from CLI argument -v', () => {
      const version = resolveTargetVersion('1.0.0', {
        argv: ['-v', '3.0.0'],
      });
      expect(version).toBe('3.0.0');
    });

    test('resolves from CLI argument --version=<ver>', () => {
      const version = resolveTargetVersion('1.0.0', {
        argv: ['--version=v4.1.2'],
      });
      expect(version).toBe('4.1.2');
    });

    test('resolves from USERSCRIPT_VERSION env var', () => {
      const version = resolveTargetVersion('1.0.0', {
        env: { USERSCRIPT_VERSION: 'v5.0.0' },
      });
      expect(version).toBe('5.0.0');
    });

    test('resolves from BUILD_VERSION env var', () => {
      const version = resolveTargetVersion('1.0.0', {
        env: { BUILD_VERSION: '5.1.0' },
      });
      expect(version).toBe('5.1.0');
    });

    test('resolves from GitHub Actions tag env (GITHUB_REF_NAME)', () => {
      const version = resolveTargetVersion('1.0.0', {
        env: {
          GITHUB_REF_TYPE: 'tag',
          GITHUB_REF_NAME: 'v5.03.01',
        },
      });
      expect(version).toBe('5.03.01');
    });

    test('resolves from GitHub Actions ref tag (refs/tags/v...)', () => {
      const version = resolveTargetVersion('1.0.0', {
        env: {
          GITHUB_REF: 'refs/tags/v5.03.02',
        },
      });
      expect(version).toBe('5.03.02');
    });

    test('resolves from git tag function when provided', () => {
      const version = resolveTargetVersion('1.0.0', {
        getGitTag: () => 'v6.0.0',
      });
      expect(version).toBe('6.0.0');
    });

    test('falls back to defaultVersion when no tag, env, or cli arg is present', () => {
      const version = resolveTargetVersion('5.03.00', {
        argv: [],
        env: {},
        getGitTag: () => '',
      });
      expect(version).toBe('5.03.00');
    });
  });
});

