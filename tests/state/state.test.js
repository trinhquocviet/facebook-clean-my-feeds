import { describe, it, expect } from 'bun:test';
import {
  createInitialState,
  resetFeedFlags,
  resetEchoState,
} from '@/state/index.js';

describe('State Module', () => {
  describe('createInitialState', () => {
    it('should create an independent state object with proper primitive defaults', () => {
      const state1 = createInitialState();
      const state2 = createInitialState();

      expect(state1).not.toBe(state2);
      expect(state1.scanCountStart).toBe(0);
      expect(state1.scanCountMaxLoop).toBe(15);
      expect(state1.noChangeCounter).toBe(0);
      expect(state1.language).toBe('');
      expect(state1.Options).toEqual({});
      expect(state1.optionsReady).toBe(false);
      expect(state1.Filters).toEqual({});
      expect(state1.SEP).toBe('¦¦');
      expect(state1.hideAnInfoBox).toBe(false);
      expect(state1.dictionarySponsored).toEqual({});
      expect(state1.dictionaryReelsAndShortVideos).toEqual({});
      expect(state1.echoEl).toBeNull();
      expect(state1.echoCount).toBe(0);
      expect(state1.echoCPID).toBe('');
      expect(state1.isDarkMode).toBeNull();
      expect(state1.isChromium).toBe(false);
      expect(state1.btnToggleEl).toBeNull();
    });

    it('should explicitly define all previously dynamic properties', () => {
      const state = createInitialState();

      expect(state.hideAnInfoBox).toBe(false);
      expect(state.hideWithNoCaptionAtt).toBe('');
      expect(state.prevQuery).toBe('');
    });

    it('should purge all dead properties from state', () => {
      const state = createInitialState();

      expect(state.tempStyleSheetCode).toBeUndefined();
      expect(state.b1Att).toBeUndefined();
      expect(state.b2Att).toBeUndefined();
      expect(state.cssOID).toBeUndefined();
      expect(state.cssEcho).toBeUndefined();
      expect(state.echoElFirstNote).toBeUndefined();
      expect(state.echoElCreatedCount).toBeUndefined();
      expect(state.echoELFirstPost).toBeUndefined();
      expect(state.echoElFirst).toBeUndefined();
    });

    it('should not store static SVG assets and link class on runtime state', () => {
      const state = createInitialState();

      expect(state.iconClose).toBeUndefined();
      expect(state.logoHTML).toBeUndefined();
      expect(state.iconNewWindow).toBeUndefined();
      expect(state.iconNewWindowClass).toBeUndefined();
      expect(state.iconChevron).toBeUndefined();
    });
  });

  describe('resetFeedFlags', () => {
    it('should reset all 8 feed flags to false', () => {
      const state = createInitialState();
      state.isNF = true;
      state.isGF = true;
      state.isVF = true;
      state.isMF = true;
      state.isAF = true;
      state.isSF = true;
      state.isRF = true;
      state.isPP = true;

      const result = resetFeedFlags(state);

      expect(result).toBe(state);
      expect(state.isNF).toBe(false);
      expect(state.isGF).toBe(false);
      expect(state.isVF).toBe(false);
      expect(state.isMF).toBe(false);
      expect(state.isAF).toBe(false);
      expect(state.isSF).toBe(false);
      expect(state.isRF).toBe(false);
      expect(state.isPP).toBe(false);
    });

    it('should handle falsy state safely', () => {
      expect(resetFeedFlags(null)).toBeNull();
      expect(resetFeedFlags(undefined)).toBeUndefined();
    });
  });

  describe('resetEchoState', () => {
    it('should reset echoCount to 0 and echoCPID to empty string', () => {
      const state = createInitialState();
      state.echoCount = 42;
      state.echoCPID = 'cpid-test-123';

      const result = resetEchoState(state);

      expect(result).toBe(state);
      expect(state.echoCount).toBe(0);
      expect(state.echoCPID).toBe('');
    });

    it('should handle falsy state safely', () => {
      expect(resetEchoState(null)).toBeNull();
      expect(resetEchoState(undefined)).toBeUndefined();
    });
  });
});
