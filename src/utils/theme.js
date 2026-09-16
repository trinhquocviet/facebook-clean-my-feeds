/**
 * Theme and display mode detection utilities.
 * @module utils/theme
 */

/**
 * Calculates ITU-R BT.601 relative luminance from RGB color components.
 *
 * @param {number} red - Red component (0-255).
 * @param {number} green - Green component (0-255).
 * @param {number} blue - Blue component (0-255).
 * @returns {number} Calculated luminance (0-255).
 */
export function calculateLuminance(red, green, blue) {
  return 0.299 * red + 0.587 * green + 0.114 * blue;
}

/**
 * Determines whether the current Facebook page is in dark mode or light mode.
 * Evaluates both explicit class names (`__fb-dark-mode`, `__fb-light-mode`)
 * and falls back to computed body background luminance (< 128 indicates dark mode).
 *
 * @param {Document} [doc=document] - Document context (supports dependency injection for testing).
 * @param {Window} [win=window] - Window context for getComputedStyle.
 * @returns {boolean} True if dark mode is active, false otherwise.
 *
 * @example
 * if (isDarkMode()) {
 *   applyDarkThemeStyles();
 * }
 */
export function isDarkMode(
  doc = (typeof document !== 'undefined' ? document : null),
  win = (typeof window !== 'undefined' ? window : null)
) {
  if (!doc) {
    return false;
  }

  // Explicit Facebook theme classes
  if (doc.documentElement && doc.documentElement.classList) {
    if (doc.documentElement.classList.contains('__fb-light-mode')) {
      return false;
    }
    if (doc.documentElement.classList.contains('__fb-dark-mode')) {
      return true;
    }
  }

  // Automatic / System dark mode fallback via body background luminance
  if (doc.body && win && typeof win.getComputedStyle === 'function') {
    try {
      const bodyBackgroundColour = win.getComputedStyle(doc.body).backgroundColor;
      const rgb = bodyBackgroundColour ? bodyBackgroundColour.match(/\d+/g) : null;
      if (rgb && rgb.length >= 3) {
        const red = parseInt(rgb[0], 10);
        const green = parseInt(rgb[1], 10);
        const blue = parseInt(rgb[2], 10);
        return calculateLuminance(red, green, blue) < 128;
      }
    } catch {
      // Fallback if computed style cannot be read
    }
  }

  return false;
}
