import { describe, it, expect } from 'bun:test';
import {
  POST_ATT,
  POST_ATT_CPID,
  POST_PROP_DUSTED,
  POST_ATT_CHILD_FLAG,
  POST_ATT_TAB,
  POST_ATT_MP_SKIP,
  REEL_VIDEO_ATT,
  MAIN_COLUMN_ATT,
  ICON_NEW_WINDOW_CLASS,
  postAtt,
  postAttCPID,
  postPropDS,
  postAttChildFlag,
  postAttTab,
  postAttMPSkip,
  rvAtt,
  mainColumnAtt,
  iconNewWindowClass,
  DB_CONFIG,
  SCAN_CONFIG,
  FILTER_SEPARATOR,
  ICON_CLOSE,
  LOGO_HTML,
  ICON_NEW_WINDOW,
} from '../../src/constants/index.js';

describe('Constants Module', () => {
  describe('DOM Attribute Constants', () => {
    it('should export all canonical DOM attribute constants as exact non-empty strings', () => {
      expect(POST_ATT).toBe('cmfr');
      expect(POST_ATT_CPID).toBe('cmfcpid');
      expect(POST_PROP_DUSTED).toBe('cmfDusted');
      expect(POST_ATT_CHILD_FLAG).toBe('cmfcf');
      expect(POST_ATT_TAB).toBe('cmftsb');
      expect(POST_ATT_MP_SKIP).toBe('cmfsmp');
      expect(REEL_VIDEO_ATT).toBe('cmfrv');
      expect(MAIN_COLUMN_ATT).toBe('cmfmc');
      expect(ICON_NEW_WINDOW_CLASS).toBe('cmf-link-new');
    });

    it('should export backward-compatible aliases identically matching canonical constants', () => {
      expect(postAtt).toBe(POST_ATT);
      expect(postAttCPID).toBe(POST_ATT_CPID);
      expect(postPropDS).toBe(POST_PROP_DUSTED);
      expect(postAttChildFlag).toBe(POST_ATT_CHILD_FLAG);
      expect(postAttTab).toBe(POST_ATT_TAB);
      expect(postAttMPSkip).toBe(POST_ATT_MP_SKIP);
      expect(rvAtt).toBe(REEL_VIDEO_ATT);
      expect(mainColumnAtt).toBe(MAIN_COLUMN_ATT);
      expect(iconNewWindowClass).toBe(ICON_NEW_WINDOW_CLASS);
    });
  });

  describe('Database Configuration', () => {
    it('should export frozen DB_CONFIG with valid IndexedDB parameters', () => {
      expect(DB_CONFIG.DB_NAME).toBe('dbCMF');
      expect(DB_CONFIG.DB_STORE).toBe('Mopping');
      expect(DB_CONFIG.DB_KEY).toBe('Options');
      expect(Object.isFrozen(DB_CONFIG)).toBe(true);
    });
  });

  describe('Scanner & Filter Configuration', () => {
    it('should export valid loop iteration thresholds and separator', () => {
      expect(SCAN_CONFIG.SCAN_COUNT_START).toBe(0);
      expect(SCAN_CONFIG.SCAN_COUNT_MAX_LOOP).toBe(15);
      expect(Object.isFrozen(SCAN_CONFIG)).toBe(true);
      expect(FILTER_SEPARATOR).toBe('¦¦');
    });
  });

  describe('SVG Assets', () => {
    it('should export non-empty valid SVG strings', () => {
      expect(ICON_CLOSE.startsWith('<svg')).toBe(true);
      expect(ICON_CLOSE.endsWith('</svg>')).toBe(true);

      expect(LOGO_HTML.startsWith('<svg')).toBe(true);
      expect(LOGO_HTML.endsWith('</svg>')).toBe(true);

      expect(ICON_NEW_WINDOW.startsWith('<svg')).toBe(true);
      expect(ICON_NEW_WINDOW.endsWith('</svg>')).toBe(true);
    });
  });
});
