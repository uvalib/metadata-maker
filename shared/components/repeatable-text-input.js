import { html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.2.1/+esm';
import { RepeatableFieldBase } from './repeatable-field-base.js';

export class RepeatableTextInput extends RepeatableFieldBase {
  static properties = {
    ...RepeatableFieldBase.properties,
    heading: { type: String },
    fieldPrefix: { type: String, attribute: 'field-prefix' },
    insertLabel: { type: String, attribute: 'insert-label' },
    insertClass: { type: String, attribute: 'insert-class' },
    inputClass: { type: String, attribute: 'input-class' },
    helpText: { type: String, attribute: 'help-text' },
    required: { type: Boolean, reflect: true },
    requiredMarker: { type: String, attribute: 'required-marker' },
    containerClass: { type: String, attribute: 'container-class' }
  };

  constructor() {
    super();
    this.heading = '';
    this.fieldPrefix = 'repeatable';
    this.insertLabel = 'Insert Special Characters';
    this.insertClass = 'insert insert_normal';
    this.inputClass = 'repository-address-input translit-listen';
    this.helpText = '';
    this.required = false;
    this.requiredMarker = '*';
    this.containerClass = 'standard-block';
    this.addButtonLabel = '+';
    this.addButtonAriaLabel = 'Add another entry';
    this.addButtonId = '';
  }

  createInitialKeys() {
    return ['0'];
  }

  getNextEntryKey() {
    return `${this.entries.length}`;
  }

  renderContainer(entriesContent, addControl) {
    return html`<div class="${this.containerClass}">
      ${entriesContent}
      ${this.allowAdd ? html`<div class="repeatable-add-control">${addControl}</div>` : nothing}
    </div>`;
  }

  renderEntry(key, isFirst) {
    const id = `${this.fieldPrefix}_${key}`;
    const insertId = `insert-${id}`;
    const requiredMarker = this.required && this.requiredMarker ? this.requiredMarker : nothing;
    const headingLabel = isFirst && this.heading
      ? html`<label for="${id}" class="heading">${this.heading}${requiredMarker !== nothing ? html`<span class="required_marker">${requiredMarker}</span>` : nothing}</label>`
      : nothing;
    const insert = html`<label for="${id}" class="${this.insertClass} text-uva-orange cursor-pointer text-sm font-semibold hover:underline ml-2" @click=${() => this.handleInsertClick(id)}>${this.insertLabel}</label>`;
    const help = isFirst && this.helpText ? html`<label title="${this.helpText}"><span class="question-mark">?</span></label>` : nothing;
    const classes = this.inputClass ? this.inputClass : '';
    const requiredAttr = this.required;
    const wrapperClass = isFirst ? 'repeatable-entry' : 'repeatable-entry added mt-2';
    return html`
      <div class="${wrapperClass}">
        ${headingLabel}
        ${insert}
        <div id="${insertId}"></div>
        <input type="text" id="${id}" class="${classes} input-base" ?required=${requiredAttr}>
        ${help}
      </div>
    `;
  }

  handleInsertClick(id) {
    if (typeof window.insertMenu === 'function') {
      window.insertMenu(id);
    }
  }

  onEntryAdded(key, index) {
    const input = this.querySelector(`#${this.fieldPrefix}_${key}`);
    if (input) {
      input.focus();
    }
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('repeatable-text-input')) {
  window.customElements.define('repeatable-text-input', RepeatableTextInput);
}
