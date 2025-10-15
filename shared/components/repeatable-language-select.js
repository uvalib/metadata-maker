import { html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { RepeatableFieldBase } from './repeatable-field-base.js';
import './language-select.js';

export class RepeatableLanguageSelect extends RepeatableFieldBase {
  static properties = {
    heading: { type: String },
    fieldPrefix: { type: String, attribute: 'field-prefix' },
    selectClass: { type: String, attribute: 'select-class' },
    required: { type: Boolean, reflect: true },
    requiredMarker: { type: String, attribute: 'required-marker' },
    containerClass: { type: String, attribute: 'container-class' }
  };

  constructor() {
    super();
    this.heading = 'Language';
    this.fieldPrefix = 'language';
    this.selectClass = 'language-input';
    this.required = false;
    this.requiredMarker = '*';
    this.containerClass = 'standard-block';
    this.addButtonLabel = '+';
    this.addButtonAriaLabel = 'Add language';
    this.addButtonId = 'add-language';
    this.entries = this.createInitialKeys();
  }

  createRenderRoot() {
    return this;
  }

  createInitialKeys() {
    return ['0'];
  }

  renderContainer(entriesContent, addControl) {
    const marker = this.required ? html`<span class="required_marker">${this.requiredMarker}</span>` : nothing;
    return html`
      <div class="${this.containerClass}">
        <label class="heading">${this.heading}${marker}</label>
        ${entriesContent}
        ${this.allowAdd ? html`<div class="repeatable-add-control">${addControl}</div>` : nothing}
      </div>
    `;
  }

  renderEntry(key, isFirst) {
    const selectId = `${this.fieldPrefix}_${key}`;
    const nameAttr = `${this.fieldPrefix}_${key}`;
    const wrapperClass = isFirst ? 'language-entry' : 'language-entry added';
    return html`
      <div class="${wrapperClass}">
        <language-select
          heading="${this.heading}"
          field-id="${selectId}"
          name="${nameAttr}"
          container-id="${selectId}_container"
          container-class="language-select-entry"
          select-class="${this.selectClass}"
          ?required=${this.required}
          show-heading="false"
        ></language-select>
      </div>
    `;
  }

  onEntryAdded(key) {
    const select = this.querySelector(`#${this.fieldPrefix}_${key}`);
    if (select && typeof select.focus === 'function') {
      select.focus();
    }
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('repeatable-language-select')) {
  window.customElements.define('repeatable-language-select', RepeatableLanguageSelect);
}
