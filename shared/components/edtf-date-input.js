import { LitElement, html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import parseEdtf from 'https://cdn.jsdelivr.net/npm/edtf@4.4.2/+esm';

const FALSE_VALUES = new Set(['false', '0', 'off', 'no']);

function normalizeBoolean(value, defaultValue = false) {
  if (value === null) {
    return defaultValue;
  }
  if (value === '') {
    return true;
  }
  return !FALSE_VALUES.has(String(value).trim().toLowerCase());
}

export class EdtfDateInput extends LitElement {
  static properties = {
    heading: { type: String },
    fieldId: { type: String, attribute: 'field-id' },
    containerClass: { type: String, attribute: 'container-class' },
    containerId: { type: String, attribute: 'container-id' },
    inputClass: { type: String, attribute: 'input-class' },
    required: { attribute: 'required' },
    requiredMarker: { type: String, attribute: 'required-marker' },
    helpText: { type: String, attribute: 'help-text' }
  };

  constructor() {
    super();
    this.heading = '';
    this.fieldId = '';
    this.containerClass = 'standard-block';
    this.containerId = '';
    this.inputClass = '';
    this.required = null;
    this.requiredMarker = '*';
    this.helpText = '';
    this.invalidMessage = 'Enter a valid EDTF date.';
  }

  createRenderRoot() {
    return this;
  }

  get isRequired() {
    return normalizeBoolean(this.required, false);
  }

  render() {
    const id = this.fieldId || 'edtf_date_input';
    const containerClass = this.containerClass && this.containerClass.trim().length > 0 ? this.containerClass : nothing;
    const containerId = this.containerId && this.containerId.trim().length > 0 ? this.containerId : nothing;
    const marker = this.isRequired && this.requiredMarker ? html`<span class="required_marker">${this.requiredMarker}</span>` : nothing;
    const help = this.helpText ? html`<label title="${this.helpText}"><span class="question-mark">?</span></label>` : nothing;
    const inputClasses = this.inputClass || '';

    return html`<div id=${containerId} class=${containerClass}>
      <label for="${id}" class="heading">${this.heading}${marker}</label><br>
      <input
        type="text"
        id="${id}"
        class="${inputClasses}"
        inputmode="text"
        autocomplete="off"
        spellcheck="false"
        ?required=${this.isRequired}
        @input=${this._handleInput}
        @blur=${this._handleBlur}
      >
      ${help}
    </div>`;
  }

  _handleInput(event) {
    const target = event.target;
    if (!target) {
      return;
    }
    this._setValidity(target, { report: false });
  }

  _handleBlur(event) {
    const target = event.target;
    if (!target) {
      return;
    }
    this._setValidity(target, { report: true });
  }

  _setValidity(input, { report }) {
    const value = input.value.trim();
    if (value === '') {
      input.setCustomValidity('');
      if (report) {
        input.reportValidity();
      }
      return;
    }

    if (this._isValidEdtf(value)) {
      input.setCustomValidity('');
    } else {
      input.setCustomValidity(this.invalidMessage);
    }

    if (report) {
      input.reportValidity();
    }
  }

  _isValidEdtf(value) {
    if (typeof parseEdtf !== 'function') {
      return true;
    }
    try {
      const parsed = parseEdtf(value);
      return parsed !== null && parsed !== undefined;
    } catch (error) {
      return false;
    }
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('edtf-date-input')) {
  window.customElements.define('edtf-date-input', EdtfDateInput);
}
