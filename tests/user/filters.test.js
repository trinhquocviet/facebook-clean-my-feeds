import { describe, it, expect } from 'bun:test';
import { compileFilterRules } from '../../src/modules/user/filters.js';

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

    it('implements cross-feed blocked text sharing matrix correctly', () => {
      const options = {
        NF_BLOCKED_ENABLED: true,
        NF_BLOCKED_TEXT: 'nf_word',
        NF_BLOCKED_FEED: ['1', '1', '1'], // Share NF with GF (index 1) and VF (index 2)

        GF_BLOCKED_ENABLED: true,
        GF_BLOCKED_TEXT: 'gf_word',
        GF_BLOCKED_FEED: ['1', '1', '0'], // Share GF with NF (index 0)

        VF_BLOCKED_ENABLED: true,
        VF_BLOCKED_TEXT: 'vf_word',
        VF_BLOCKED_FEED: ['1', '0', '1'], // Share VF with NF (index 0)
      };

      const filters = compileFilterRules(options, '\n');

      // NF receives its own + GF (since GF_BLOCKED_FEED[0] === '1') + VF (since VF_BLOCKED_FEED[0] === '1')
      expect(filters.NF_BLOCKED_TEXT).toEqual(['nf_word', 'gf_word', 'vf_word']);

      // GF receives its own + NF (since NF_BLOCKED_FEED[1] === '1')
      expect(filters.GF_BLOCKED_TEXT).toEqual(['gf_word', 'nf_word']);

      // VF receives its own + NF (since NF_BLOCKED_FEED[2] === '1')
      expect(filters.VF_BLOCKED_TEXT).toEqual(['vf_word', 'nf_word']);
    });

    it('does not append shared text if source feed is disabled', () => {
      const options = {
        NF_BLOCKED_ENABLED: true,
        NF_BLOCKED_TEXT: 'nf_word',

        GF_BLOCKED_ENABLED: false, // Disabled!
        GF_BLOCKED_TEXT: 'gf_word',
        GF_BLOCKED_FEED: ['1', '1', '0'],
      };

      const filters = compileFilterRules(options, '\n');

      expect(filters.NF_BLOCKED_TEXT).toEqual(['nf_word']);
      expect(filters.GF_BLOCKED_ENABLED).toBe(false);
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
  });
});
