/**
 * Dialog Toggle and Legend Interaction Module
 * Part of FB - Clean My Feeds
 */

/**
 * Creates and appends the floating toggle button to document body
 * @param {Object} ctx - Context object
 */
export function createToggleButton(ctx) {
  const { VARS, KeyWords, toggleDialog } = ctx;
  let btn = document.createElement('button');
  btn.innerHTML = VARS.logoHTML;
  btn.id = 'fbcmfToggle';
  btn.title = KeyWords.DLG_TITLE;
  btn.className = 'fb-cmf-toggle fb-cmf-icon';
  document.body.appendChild(btn);
  btn.addEventListener('click', toggleDialog, false);
  VARS.btnToggleEl = btn;
}

/**
 * Attaches collapsible click handlers to all legend elements in the dialog
 */
export function addLegendEvents() {
  const elFBCMF = document.getElementById('fbcmf');
  if (elFBCMF) {
    const legends = elFBCMF.querySelectorAll('legend');
    legends.forEach(legend => {
      legend.parentElement.classList.add('hidden');
      legend.addEventListener('click', function () {
        legend.parentElement.classList.toggle('hidden');
        legend.parentElement.classList.toggle('visible');
      });
    });
  }
}
