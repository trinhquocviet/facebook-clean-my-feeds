import { describe, it, expect } from 'bun:test';
import { resolveLanguage, applyDefaultOptions } from '../../src/modules/user/defaults.js';
import { masterKeyWords } from '../../src/i18n/index.js';

describe('modules/user/defaults', () => {
  describe('resolveLanguage', () => {
    const translations = {
      en: { NAME: 'English' },
      vi: { NAME: 'Tiếng Việt' },
      de: { NAME: 'Deutsch' },
    };

    it('returns stored language if valid in translations table', () => {
      expect(resolveLanguage('vi', 'en', translations)).toBe('vi');
      expect(resolveLanguage('de', 'vi', translations)).toBe('de');
    });

    it('falls back to document language if stored language is missing or unsupported', () => {
      expect(resolveLanguage(undefined, 'vi', translations)).toBe('vi');
      expect(resolveLanguage('', 'de', translations)).toBe('de');
      expect(resolveLanguage('unsupported_lang', 'vi', translations)).toBe('vi');
    });

    it('falls back to default fallback language ("en") if neither is supported', () => {
      expect(resolveLanguage('unknown1', 'unknown2', translations, 'en')).toBe('en');
      expect(resolveLanguage(undefined, undefined, translations, 'en')).toBe('en');
    });
  });

  describe('applyDefaultOptions', () => {
    it('populates missing defaults and flags changed as true for empty options', () => {
      const { options, changed, hideAnInfoBox } = applyDefaultOptions({}, masterKeyWords.defaults);

      expect(changed).toBe(true);
      expect(hideAnInfoBox).toBe(false);

      // Sponsored flags
      expect(options.NF_SPONSORED).toBe(true);
      expect(options.GF_SPONSORED).toBe(true);
      expect(options.VF_SPONSORED).toBe(true);
      expect(options.MP_SPONSORED).toBe(true);

      // Text fields
      expect(options.NF_BLOCKED_TEXT).toBe('');
      expect(options.GF_BLOCKED_TEXT).toBe('');
      expect(options.VF_BLOCKED_TEXT).toBe('');
      expect(options.MP_BLOCKED_TEXT).toBe('');
      expect(options.MP_BLOCKED_TEXT_DESCRIPTION).toBe('');
      expect(options.PP_BLOCKED_TEXT).toBe('');
      expect(options.NF_LIKES_MAXIMUM_COUNT).toBe('');

      // Verbosity
      expect(options.VERBOSITY_LEVEL).toBe('1');
      expect(options.VERBOSITY_DEBUG).toBe(false);
    });

    it('preserves existing options and marks changed as false when all keys present', () => {
      const initial = {
        ...masterKeyWords.defaults,
        NF_SPONSORED: false,
        GF_SPONSORED: false,
        VF_SPONSORED: false,
        MP_SPONSORED: false,
        VERBOSITY_LEVEL: '2',
        VERBOSITY_DEBUG: true,
        NF_BLOCKED_TEXT: 'spam',
        GF_BLOCKED_TEXT: 'ads',
        VF_BLOCKED_TEXT: '',
        MP_BLOCKED_TEXT: 'free',
        MP_BLOCKED_TEXT_DESCRIPTION: 'shipping',
        PP_BLOCKED_TEXT: '',
        NF_LIKES_MAXIMUM_COUNT: '500',
      };

      const { options, changed } = applyDefaultOptions(initial, masterKeyWords.defaults);

      expect(changed).toBe(false);
      expect(options.NF_SPONSORED).toBe(false);
      expect(options.VERBOSITY_LEVEL).toBe('2');
      expect(options.VERBOSITY_DEBUG).toBe(true);
      expect(options.NF_BLOCKED_TEXT).toBe('spam');
    });

    it('detects when OTHER_INFO_* flags are enabled and sets hideAnInfoBox to true', () => {
      const { hideAnInfoBox: disabled } = applyDefaultOptions({
        OTHER_INFO_BOX_CORONAVIRUS: false,
        OTHER_INFO_BOX_CLIMATE_SCIENCE: false,
      }, masterKeyWords.defaults);
      expect(disabled).toBe(false);

      const { hideAnInfoBox: enabled } = applyDefaultOptions({
        OTHER_INFO_BOX_CORONAVIRUS: true,
      }, masterKeyWords.defaults);
      expect(enabled).toBe(true);
    });
  });
});
