/**
 * Dialog UI Components
 * DOM element generators for checkboxes, radios, language selector, and inputs.
 * Part of FB - Clean My Feeds
 */

/**
 * Validates text inputs to accept digits only
 * @param {Event} event - Input event
 * @returns {boolean|void}
 */
export function checkInputNumber(event) {
  // -- accept numbers/digits only.
  const el = event.target;
  if (el.value === '') {
    return true;
  }
  const digitsValues = el.value.replace(/\D/g, '');
  el.value = digitsValues.length > 0 ? parseInt(digitsValues) : '';
}

/**
 * Builds the language selection dropdown component
 * @param {Object} ctx - Context object
 * @returns {HTMLSelectElement}
 */
export function getLanguagesComponent(ctx) {
  const { VARS, getSupportedLanguages } = ctx;
  const elSelect = document.createElement('select');
  elSelect.name = 'CMF_DIALOG_LANGUAGE';
  getSupportedLanguages().forEach(({ code, name }) => {
    const elOption = document.createElement('option');
    elOption.value = code;
    elOption.textContent = name;
    if (code === VARS.language) {
      elOption.setAttribute('selected', '');
    }
    elSelect.appendChild(elOption);
  });

  return elSelect;
}

/**
 * Creates toggle-style single checkbox wrapped in div
 * @param {string} cbName - Name/Key of the option
 * @param {Object} ctx - Context object
 * @param {boolean} [cbReadOnly=false] - Whether checkbox is disabled/read-only
 * @returns {HTMLDivElement}
 */
export function createSingleCB(cbName, ctx, cbReadOnly = false) {
  const { VARS, KeyWords } = ctx;
  // -- create toggle style checkboxes
  const CBTYPE = 'T'; // checkbox, single value, Toggle style
  let cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.setAttribute('cbType', CBTYPE);
  cb.name = cbName;
  cb.value = cbName;
  cb.checked = VARS.Options[cbName];
  let label = document.createElement('label');
  if (cbReadOnly) {
    cb.checked = true;
    cb.disabled = true;
    label.setAttribute('disabled', 'disabled');
  }
  label.appendChild(cb);
  if (KeyWords[cbName]) {
    if (Array.isArray(KeyWords[cbName]) === false) {
      label.appendChild(document.createTextNode(KeyWords[cbName]));
    }
    else {
      label.appendChild(document.createTextNode(Array.from(KeyWords[cbName]).join(', ')));
    }
  }
  else if (['NF_SPONSORED', 'GF_SPONSORED', 'VF_SPONSORED', 'MP_SPONSORED'].includes(cbName)) {
    label.appendChild(document.createTextNode(KeyWords.SPONSORED));
  }
  else {
    label.appendChild(document.createTextNode(cbName));
  }
  let div = document.createElement('div');
  div.appendChild(label);
  return div;
}

/**
 * Creates multiple-values checkbox group
 * @param {string} cbName - Name/Key of the option array
 * @param {Object} ctx - Context object
 * @param {number} [cbReadOnlyIdx=-1] - Index of item to make read-only
 * @returns {HTMLElement[]} Array of div elements and trailing br
 */
export function createMultipeCBs(cbName, ctx, cbReadOnlyIdx = -1) {
  const { KeyWords, VARS } = ctx;
  // -- create multiple values checkboxes
  const CBTYPE = 'M'; // checkbox, Multiple values
  let arrElements = [];
  for (let i = 0; i < KeyWords[cbName].length; i++) {
    let div = document.createElement('div');
    let cbKeyWord = KeyWords[cbName][i];
    let cb = document.createElement('input');
    cb.type = 'checkbox';
    cb.setAttribute('cbType', CBTYPE);
    cb.name = cbName;
    cb.value = i;
    cb.checked = VARS.Options[cbName][i] === '1';
    let label = document.createElement('label');
    if (i === cbReadOnlyIdx) {
      cb.checked = true;
      cb.disabled = true;
      label.setAttribute('disabled', 'disabled');
    }
    label.appendChild(cb);
    label.appendChild(document.createTextNode(cbKeyWord));
    div.appendChild(label);
    arrElements.push(div);
  }
  let br = document.createElement('br');
  arrElements.push(br);
  return arrElements;
}

/**
 * Creates a single radio button wrapped in a div
 * @param {string} rbName - Name attribute of radio group
 * @param {string} rbValue - Value of this radio option
 * @param {string} rbLabelText - Label text
 * @param {Object} ctx - Context object
 * @returns {HTMLDivElement}
 */
export function createRB(rbName, rbValue, rbLabelText, ctx) {
  const { VARS } = ctx;
  let div = document.createElement('div');
  let rb = document.createElement('input');
  rb.type = 'radio';
  rb.name = rbName;
  rb.value = rbValue;
  rb.checked = (VARS.Options[rbName] === rbValue);
  let label = document.createElement('label');
  label.appendChild(rb);
  label.appendChild(document.createTextNode(rbLabelText));
  div.appendChild(label);
  return div;
}

/**
 * Creates language selection component wrapped in div
 * @param {Object} ctx - Context object
 * @returns {HTMLDivElement}
 */
export function createSelectLanguage(ctx) {
  const { KeyWords } = ctx;
  let div = document.createElement('div');
  let select = getLanguagesComponent(ctx);
  let label = document.createElement('label');
  label.appendChild(document.createTextNode(`${KeyWords.CMF_DIALOG_LANGUAGE_LABEL}:`));
  label.appendChild(document.createElement('br'));
  label.appendChild(select);
  div.appendChild(label);
  return div;
}

/**
 * Creates checkbox paired with numeric input
 * @param {string} cbName - Name/Key of the checkbox option
 * @param {string} iName - Name/Key of the numeric input option
 * @param {Object} ctx - Context object
 * @returns {HTMLDivElement}
 */
export function createCheckboxAndInput(cbName, iName, ctx) {
  const { VARS, KeyWords } = ctx;
  // -- checkbox with input box.
  // -- no read-only attributes
  // -- no multiple keyword values.

  // -- create checkbox first.
  const CBTYPE = 'T';
  let cb = document.createElement('input');
  cb.type = 'checkbox';
  cb.setAttribute('cbType', CBTYPE);
  cb.name = cbName;
  cb.value = cbName;
  cb.checked = VARS.Options[cbName];

  // -- create input box
  let input = document.createElement('input');
  input.type = 'text';
  input.name = iName;
  input.value = VARS.Options[iName];
  input.placeholder = '1000';
  input.size = 6;
  input.addEventListener('input', checkInputNumber, false);

  // -- wrap checkbox and input inside a label
  let label = document.createElement('label');
  label.appendChild(cb);
  label.appendChild(document.createTextNode(`${KeyWords[cbName]}: `));
  label.appendChild(input);

  // -- wrap inside a div container ..
  let div = document.createElement('div');
  div.appendChild(label);
  return div;
}
