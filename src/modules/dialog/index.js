/**
 * Dialog Module Entry Point
 * Part of FB - Clean My Feeds
 */

import { createToggleButton, addLegendEvents } from './toggle.js';
import { createDialog } from './createDialog.js';

/**
 * Builds the mopping dialog box component and toggle button
 * @param {Object} ctx - Application context containing variables and functions
 */
export function buildMoppingDialog(ctx) {
  createToggleButton(ctx);
  createDialog(false, ctx);
  addLegendEvents();
}

export {
  createToggleButton,
  addLegendEvents,
  createDialog
};
