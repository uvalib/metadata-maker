import { LitElement, html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

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

export class StandardDateInput extends LitElement {
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
  }

  createRenderRoot() {
    return this;
  }

  get isRequired() {
    return normalizeBoolean(this.required, false);
  }

  render() {
    const id = this.fieldId || 'standard_date_input';
    const containerClass = this.containerClass && this.containerClass.trim().length > 0 ? this.containerClass : nothing;
    const containerId = this.containerId && this.containerId.trim().length > 0 ? this.containerId : nothing;
    const marker = this.isRequired && this.requiredMarker ? html`<span class="required_marker">${this.requiredMarker}</span>` : nothing;
    const help = this.helpText ? html`<label title="${this.helpText}"><span class="question-mark">?</span></label>` : nothing;
    const inputClasses = this.inputClass || '';

    return html`<div id=${containerId} class=${containerClass}>
      <label for="${id}" class="heading">${this.heading}${marker}</label><br>
      <input type="date" id="${id}" class="${inputClasses}" ?required=${this.isRequired}>
      ${help}
    </div>`;
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('standard-date-input')) {
  window.customElements.define('standard-date-input', StandardDateInput);
}
