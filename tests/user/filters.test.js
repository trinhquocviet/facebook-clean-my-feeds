import { describe, it, expect } from 'bun:test';
import { compileFilterRules } from '@/modules/user/filters.js';

describe('modules/user/filters', () => {
  describe('compileFilterRules', () => {
    it('returns empty disabled filters for default/empty options', () => {
      const filters = compileFilterRules({});

      expect(filters.NF_BLOCKED_ENABLED).toBe(false);
      expect(filters.NF_BLOCKED_TEXT).toEqual([]);
      expect(filters.NF_BLOCKED_TEXT_LC).toEqual([]);

      expect(filters.GF_BLOCKED_ENABLED).toBe(false);
      expect(filters.GF_BLOCKED_TEXT).toEqual([]);

      expect(filters.VF_BLOCKED_ENABLED).toBe(false);
      expect(filters.VF_BLOCKED_TEXT).toEqual([]);

      expect(filters.MP_BLOCKED_ENABLED).toBe(false);
      expect(filters.MP_BLOCKED_TEXT).toEqual([]);
      expect(filters.MP_BLOCKED_TEXT_DESCRIPTION).toEqual([]);

      expect(filters.PP_BLOCKED_ENABLED).toBe(false);
      expect(filters.PP_BLOCKED_TEXT).toEqual([]);
    });

    it('splits blocked words by separator and computes lowercase tokens', () => {
      const options = {
        NF_BLOCKED_ENABLED: true,
        NF_BLOCKED_TEXT: 'Crypto¦¦NFT¦¦BITCOIN',
      };

      const filters = compileFilterRules(options, '¦¦');

      expect(filters.NF_BLOCKED_ENABLED).toBe(true);
      expect(filters.NF_BLOCKED_TEXT).toEqual(['Crypto', 'NFT', 'BITCOIN']);
      expect(filters.NF_BLOCKED_TEXT_LC).toEqual(['crypto', 'nft', 'bitcoin']);
    });

    it('enforces per-section isolation so feeds do not leak terms to each other', () => {
      const options = {
        NF_BLOCKED_ENABLED: true,
        NF_BLOCKED_TEXT: 'nf_word',

        GF_BLOCKED_ENABLED: true,
        GF_BLOCKED_TEXT: 'gf_word',

        VF_BLOCKED_ENABLED: true,
        VF_BLOCKED_TEXT: 'vf_word',
      };

      const filters = compileFilterRules(options, '\n');

      expect(filters.NF_BLOCKED_TEXT).toEqual(['nf_word']);
      expect(filters.GF_BLOCKED_TEXT).toEqual(['gf_word']);
      expect(filters.VF_BLOCKED_TEXT).toEqual(['vf_word']);
    });

    it('does not populate filter text if feed is disabled', () => {
      const options = {
        NF_BLOCKED_ENABLED: true,
        NF_BLOCKED_TEXT: 'nf_word',

        GF_BLOCKED_ENABLED: false, // Disabled
        GF_BLOCKED_TEXT: 'gf_word',
      };

      const filters = compileFilterRules(options, '\n');

      expect(filters.NF_BLOCKED_TEXT).toEqual(['nf_word']);
      expect(filters.GF_BLOCKED_ENABLED).toBe(false);
      expect(filters.GF_BLOCKED_TEXT).toEqual([]);
    });

    it('populates Marketplace and Profile page filters independently', () => {
      const options = {
        MP_BLOCKED_ENABLED: true,
        MP_BLOCKED_TEXT: 'Free¦¦$0',
        MP_BLOCKED_TEXT_DESCRIPTION: 'shipping¦¦delivery',

        PP_BLOCKED_ENABLED: true,
        PP_BLOCKED_TEXT: 'ProfileSpam',
      };

      const filters = compileFilterRules(options, '¦¦');

      expect(filters.MP_BLOCKED_ENABLED).toBe(true);
      expect(filters.MP_BLOCKED_TEXT).toEqual(['Free', '$0']);
      expect(filters.MP_BLOCKED_TEXT_LC).toEqual(['free', '$0']);
      expect(filters.MP_BLOCKED_TEXT_DESCRIPTION).toEqual(['shipping', 'delivery']);
      expect(filters.MP_BLOCKED_TEXT_DESCRIPTION_LC).toEqual(['shipping', 'delivery']);

      expect(filters.PP_BLOCKED_ENABLED).toBe(true);
      expect(filters.PP_BLOCKED_TEXT).toEqual(['ProfileSpam']);
      expect(filters.PP_BLOCKED_TEXT_LC).toEqual(['profilespam']);
    });

    it('populates Global text filter independently and computes lowercase tokens', () => {
      const options = {
        GLOBAL_BLOCKED_ENABLED: true,
        GLOBAL_BLOCKED_TEXT: 'Scam¦¦Promotion¦¦SponsorMe',
        NF_BLOCKED_ENABLED: false,
      };

      const filters = compileFilterRules(options, '¦¦');

      expect(filters.GLOBAL_BLOCKED_ENABLED).toBe(true);
      expect(filters.GLOBAL_BLOCKED_TEXT).toEqual(['Scam', 'Promotion', 'SponsorMe']);
      expect(filters.GLOBAL_BLOCKED_TEXT_LC).toEqual(['scam', 'promotion', 'sponsorme']);
      expect(filters.NF_BLOCKED_ENABLED).toBe(false);
      expect(filters.NF_BLOCKED_TEXT).toEqual([]);
    });
  });
});
