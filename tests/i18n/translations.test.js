import { describe, it, expect } from 'bun:test';
import {
  masterKeyWords,
  translations,
  defaults,
  pathInfo,
  getTranslation,
  getSupportedLanguages,
  buildSponsoredDictionary,
  buildReelsDictionary,
} from '../../src/i18n/index.js';
import {
  getTranslation as getTranslationHelper,
  getSupportedLanguages as getSupportedLanguagesHelper,
  buildSponsoredDictionary as buildSponsoredDictionaryHelper,
  buildReelsDictionary as buildReelsDictionaryHelper,
} from '../../src/i18n/helpers.js';

describe('i18n Module & Locales', () => {
  describe('Registry Integrity & Locale Completeness', () => {
    it('should export exactly 23 supported locales', () => {
      const expectedCodes = [
        'en', 'ar', 'bg', 'cs', 'de', 'el', 'es', 'fi', 'fr', 'he',
        'id', 'it', 'ja', 'lv', 'nl', 'pl', 'pt', 'ru', 'tr', 'uk',
        'vi', 'zh-Hans', 'zh-Hant',
      ];
      const actualCodes = Object.keys(translations);
      expect(actualCodes.length).toBe(23);
      for (const code of expectedCodes) {
        expect(actualCodes).toContain(code);
      }
    });

    it('should include all required baseline keys in English (81 keys)', () => {
      const enKeys = Object.keys(translations.en);
      expect(enKeys.length).toBe(81);
      expect(translations.en.SPONSORED).toBe('Sponsored');
      expect(translations.en.DLG_TITLE).toBe('Clean my feeds');
      expect(translations.en.LANGUAGE_DIRECTION).toBe('ltr');
    });

    it('should have correct RTL directions for Arabic and Hebrew', () => {
      expect(translations.ar.LANGUAGE_DIRECTION).toBe('rtl');
      expect(translations.he.LANGUAGE_DIRECTION).toBe('rtl');
    });

    it('should include LANGUAGE_DIRECTION for Turkish (fixing previous bug)', () => {
      expect(translations.tr.LANGUAGE_DIRECTION).toBe('ltr');
      expect(translations.tr.SPONSORED).toBe('Sponsorlu');
    });

    it('should include German SPONSORED_EXTRA', () => {
      expect(translations.de.SPONSORED).toBe('Gesponsert');
      expect(translations.de.SPONSORED_EXTRA).toBe('Anzeige');
    });
  });

  describe('Translation Resolution & Fallback (getTranslation)', () => {
    it('should return translation object for valid language code', () => {
      const vi = getTranslation('vi');
      expect(vi.SPONSORED).toBe('Được tài trợ');
      expect(vi.LANGUAGE_DIRECTION).toBe('ltr');
      expect(vi.DLG_TITLE).toBe('Làm sạch nguồn cấp dữ liệu của tôi');
    });

    it('should fall back to English if language code is not found or empty', () => {
      const fallback = getTranslation('unknown-LANG');
      expect(fallback.SPONSORED).toBe('Sponsored');
      expect(fallback.DLG_TITLE).toBe('Clean my feeds');
      expect(Object.keys(fallback).length).toBe(81);

      const emptyFallback = getTranslation('');
      expect(emptyFallback.SPONSORED).toBe('Sponsored');
    });

    it('should fall back missing individual keys to English baseline', () => {
      const mockTranslations = {
        en: {
          KEY_A: 'Base A',
          KEY_B: 'Base B',
          KEY_C: 'Base C',
        },
        custom: {
          KEY_A: 'Custom A',
        },
      };

      const resolved = getTranslationHelper('custom', mockTranslations);
      expect(resolved.KEY_A).toBe('Custom A');
      expect(resolved.KEY_B).toBe('Base B');
      expect(resolved.KEY_C).toBe('Base C');
    });
  });

  describe('Supported Languages Metadata (getSupportedLanguages)', () => {
    it('should return list of 23 languages with code, name, and direction', () => {
      const list = getSupportedLanguages();
      expect(list.length).toBe(23);

      const viEntry = list.find((item) => item.code === 'vi');
      expect(viEntry).toBeDefined();
      expect(viEntry?.name).toBe('Tiếng Việt');
      expect(viEntry?.direction).toBe('ltr');

      const arEntry = list.find((item) => item.code === 'ar');
      expect(arEntry).toBeDefined();
      expect(arEntry?.name).toBe('العربية');
      expect(arEntry?.direction).toBe('rtl');

      const enEntry = list.find((item) => item.code === 'en');
      expect(enEntry).toBeDefined();
      expect(enEntry?.name).toBe('English');
      expect(enEntry?.direction).toBe('ltr');
    });
  });

  describe('Dictionary Builders', () => {
    it('should build sponsored dictionary across all languages without duplicates', () => {
      const dict = buildSponsoredDictionary();
      expect(Array.isArray(dict)).toBe(true);
      expect(dict.length).toBeGreaterThan(20);

      // Check lowercase conversion
      expect(dict).toContain('sponsored');
      expect(dict).toContain('sponsorisé');
      expect(dict).toContain('được tài trợ');
      expect(dict).toContain('anzeige');
      expect(dict).toContain('gesponsert');
      expect(dict).toContain('patrocinado');

      // No duplicates
      const uniqueSet = new Set(dict);
      expect(uniqueSet.size).toBe(dict.length);
    });

    it('should build reels dictionary across all languages', () => {
      const reels = buildReelsDictionary();
      expect(Array.isArray(reels)).toBe(true);
      expect(reels.length).toBeGreaterThanOrEqual(15);
      expect(reels).toContain('Reels and short videos');
      expect(reels).toContain('Reels và video ngắn');
    });
  });

  describe('Backward Compatibility of masterKeyWords', () => {
    it('should maintain masterKeyWords structure with translations, defaults, pathInfo', () => {
      expect(masterKeyWords.translations).toBe(translations);
      expect(masterKeyWords.defaults).toBe(defaults);
      expect(masterKeyWords.pathInfo).toBe(pathInfo);
      expect(Object.keys(masterKeyWords.translations).length).toBe(23);
      expect(Object.keys(masterKeyWords.defaults).length).toBe(56);
    });

    it('should maintain defaults values', () => {
      expect(defaults.SPONSORED).toBe(true);
      expect(defaults.NF_BLOCKED_FEED).toEqual(['1', '0', '0']);
      expect(defaults.CMF_BORDER_COLOUR).toBe('OrangeRed');
    });

    it('should support pathInfo both as string and with .pathMatch property', () => {
      expect(pathInfo.OTHER_INFO_BOX_CORONAVIRUS.pathMatch).toBe('/coronavirus_info/');
      expect(pathInfo.OTHER_INFO_BOX_CLIMATE_SCIENCE.pathMatch).toBe('/climatescienceinfo/');
      expect(pathInfo.OTHER_INFO_BOX_SUBSCRIBE.pathMatch).toBe('/support/');

      // String coercion check
      expect(String(pathInfo.OTHER_INFO_BOX_CLIMATE_SCIENCE)).toBe('/climatescienceinfo/');
      expect(`${pathInfo.OTHER_INFO_BOX_SUBSCRIBE}`).toBe('/support/');
    });
  });
});
