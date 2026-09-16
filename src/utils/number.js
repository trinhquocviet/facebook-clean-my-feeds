/**
 * Number parsing and formatting utilities for social media metrics.
 * @module utils/number
 */

/**
 * Converts abbreviated social media number strings (e.g. "1.2K", "1,5K", "3.4M", "323")
 * into full integer numbers.
 *
 * Supports both dot and comma decimal notations.
 *
 * @param {string|number} value - The raw number string or numeric value.
 * @returns {number} The parsed integer value, or 0 if unparseable.
 *
 * @example
 * getFullNumber('323'); // 323
 * getFullNumber('1.2K'); // 1200
 * getFullNumber('1,5K'); // 1500
 * getFullNumber('1.4M'); // 1400000
 * getFullNumber('invalid'); // 0
 */
export function getFullNumber(value) {
  if (value === null || value === undefined || value === '') {
    return 0;
  }

  if (typeof value === 'number') {
    return isNaN(value) ? 0 : Math.round(value);
  }

  const str = String(value).trim().toUpperCase();
  if (str === '') {
    return 0;
  }

  if (str.endsWith('K') || str.endsWith('M')) {
    const isMillion = str.endsWith('M');
    const multiplier = isMillion ? 1_000_000 : 1_000;
    const powY = isMillion ? 6 : 3;

    const normalized = str.replace(/[KM]/g, '').replace(',', '.');
    const bits = normalized.split('.');

    let intPart = parseInt(bits[0], 10);
    if (isNaN(intPart)) {
      intPart = 0;
    }

    let nvalue = intPart * multiplier;

    if (bits.length > 1 && bits[1].length > 0) {
      const decPart = parseInt(bits[1], 10);
      if (!isNaN(decPart)) {
        const exponent = Math.max(0, powY - bits[1].length);
        nvalue += decPart * Math.pow(10, exponent);
      }
    }

    return isNaN(nvalue) ? 0 : Math.round(nvalue);
  }

  const parsed = parseInt(str.replace(/,/g, ''), 10);
  return isNaN(parsed) ? 0 : parsed;
}
