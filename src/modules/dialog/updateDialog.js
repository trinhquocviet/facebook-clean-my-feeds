/**
 * Dialog State Synchronization Module
 * Syncs DOM controls with current VARS.Options state
 * Part of FB - Clean My Feeds
 */

/**
 * Updates all dialog input elements to match VARS.Options values
 * @param {Object} ctx - Context object
 */
export function updateDialog(ctx) {
  const { VARS } = ctx;
  let content = document.getElementById('fbcmf')?.querySelector('.content');
  if (content) {
    // -- toggle checkboxes
    let cbs = Array.from(content.querySelectorAll('input[type="checkbox"][cbtype="T"]'));
    cbs.forEach(cb => {
      if (VARS.Options.hasOwnProperty(cb.name)) {
        cb.checked = VARS.Options[cb.name];
      }
    });
    // -- multiple values checkboxes
    cbs = Array.from(content.querySelectorAll('input[type="checkbox"][cbtype="M"]'));
    cbs.forEach(cb => {
      if (VARS.Options.hasOwnProperty(cb.name)) {
        cb.checked = VARS.Options[cb.name][parseInt(cb.value)] === '1';
      }
    });
    // -- radios
    let rbs = content.querySelectorAll('input[type="radio"]');
    rbs.forEach(rb => {
      if (VARS.Options.hasOwnProperty(rb.name) && (rb.value === VARS.Options[rb.name])) {
        rb.checked = VARS.Options[rb.name];
      }
    });
    // -- textareas
    let tas = Array.from(content.querySelectorAll('textarea'));
    tas.forEach(ta => {
      if (VARS.Options.hasOwnProperty(ta.name)) {
        ta.value = VARS.Options[ta.name].replaceAll(VARS.SEP, '\n');
      }
    });
    // -- plain inputs
    let inputs = Array.from(content.querySelectorAll('input[type="text"]'));
    inputs.forEach(inp => {
      if (VARS.Options.hasOwnProperty(inp.name)) {
        inp.value = VARS.Options[inp.name];
      }
    });
    // -- selects
    let selects = Array.from(content.querySelectorAll('select'));
    selects.forEach(select => {
      if (VARS.Options.hasOwnProperty(select.name)) {
        for (let i = 0; i < select.options.length; i++) {
          const option = select.options[i];
          if (option.value === VARS.Options[select.name]) {
            option.selected = true;
          } else {
            option.selected = false;
          }
        }
      }
    });
  }
}
