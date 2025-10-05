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

export class StandardTextInput extends LitElement {
  static properties = {
    heading: { type: String },
    fieldId: { type: String, attribute: 'field-id' },
    insertLabel: { type: String, attribute: 'insert-label' },
    insertClass: { type: String, attribute: 'insert-class' },
    helpText: { type: String, attribute: 'help-text' },
    inputClass: { type: String, attribute: 'input-class' },
    required: { attribute: 'required' },
    requiredMarker: { type: String, attribute: 'required-marker' },
    containerClass: { type: String, attribute: 'container-class' },
    containerId: { type: String, attribute: 'container-id' },
    unlisted: { attribute: 'unlisted' },
    unlistedLabel: { type: String, attribute: 'unlisted-label' },
    unlistedId: { type: String, attribute: 'unlisted-id' }
  };

  constructor() {
    super();
    this.heading = '';
    this.fieldId = '';
    this.insertLabel = 'Insert Special Characters';
    this.insertClass = 'insert insert_normal';
    this.helpText = '';
    this.inputClass = 'translit-listen';
    this.required = null;
    this.requiredMarker = '*';
    this.containerClass = 'standard-block';
    this.containerId = '';
    this.unlisted = null;
    this.unlistedLabel = 'Unlisted';
    this.unlistedId = '';
  }

  createRenderRoot() {
    return this;
  }

  get isRequired() {
    return normalizeBoolean(this.required, false);
  }

  render() {
    const id = this.fieldId || 'standard_input';
    const containerClass = this.containerClass && this.containerClass.trim().length > 0 ? this.containerClass : nothing;
    const containerId = this.containerId && this.containerId.trim().length > 0 ? this.containerId : nothing;
    const marker = this.isRequired && this.requiredMarker ? html`<span class="required_marker">${this.requiredMarker}</span>` : nothing;
    const help = this.helpText ? html`<label title="${this.helpText}"><span class="question-mark">?</span></label>` : nothing;
    const insertLabel = html`<label for="${id}" class="${this.insertClass}" @click=${() => this.handleInsertClick(id)}>${this.insertLabel}</label>`;
    const inputClasses = this.inputClass || '';
    const unlistedId = this.unlistedId && this.unlistedId.trim().length > 0 ? this.unlistedId : `${id}_listed`;
    const unlistedMarkup = this.hasUnlisted ? html`<br><span class="unlisted">${this.unlistedLabel}</span><input type="checkbox" id="${unlistedId}" class="listed">` : nothing;

    return html`<div id=${containerId} class=${containerClass}>
      <label for="${id}" class="heading">${this.heading}${marker}</label>${insertLabel}<br>
      <div id="insert-${id}"></div>
      <input type="text" id="${id}" class="${inputClasses}" ?required=${this.isRequired}>
      ${help}
      ${unlistedMarkup}
    </div>`;
  }

  handleInsertClick(id) {
    if (typeof window.insertMenu === 'function') {
      window.insertMenu(id);
    }
  }

  get hasUnlisted() {
    return normalizeBoolean(this.unlisted, false);
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('standard-text-input')) {
  window.customElements.define('standard-text-input', StandardTextInput);
}
