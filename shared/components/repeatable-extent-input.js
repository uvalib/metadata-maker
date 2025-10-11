import { html } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { RepeatableFieldBase } from './repeatable-field-base.js';
import './standard-text-input.js';

export class RepeatableExtentInput extends RepeatableFieldBase {
  static properties = {
    ...RepeatableFieldBase.properties,
    heading: { type: String },
    fieldPrefix: { type: String, attribute: 'field-prefix' },
    textHeading: { type: String, attribute: 'text-heading' },
    unitsHeading: { type: String, attribute: 'units-heading' },
    requiredMarker: { type: String, attribute: 'required-marker' }
  };

  constructor() {
    super();
    this.heading = 'Extent';
    this.fieldPrefix = 'extent';
    this.textHeading = 'Text';
    this.unitsHeading = 'Units';
    this.requiredMarker = '*';
    this.addButtonLabel = '+';
    this.addButtonAriaLabel = 'Add extent entry';
    this.addButtonId = 'add-extent';
  }

  createInitialKeys() {
    return ['0'];
  }

  getNextEntryKey() {
    return `${this.entries.length}`;
  }

  renderContainer(entriesContent, addControl) {
    return html`<div class="extent-container">
      <label class="heading">${this.heading}<span class="required_marker">${this.requiredMarker}</span></label>
      ${entriesContent}
      <div class="repeatable-add-control">${addControl}</div>
    </div>`;
  }

  renderEntry(key) {
    const textId = `${this.fieldPrefix}_text_${key}`;
    const unitsId = `${this.fieldPrefix}_units_${key}`;
    const wrapperClass = key === '0' ? 'extent-entry' : 'extent-entry added';

    return html`
      <div class="${wrapperClass}" data-extent-index="${key}">
        <standard-text-input
          container-class="extent-field"
          field-id="${textId}"
          heading="${this.textHeading}"
          input-class="extent-text translit-listen"
          required
          required-marker="${this.requiredMarker}"
        ></standard-text-input>
        <standard-text-input
          container-class="extent-field"
          field-id="${unitsId}"
          heading="${this.unitsHeading}"
          input-class="extent-units translit-listen"
          required
          required-marker="${this.requiredMarker}"
        ></standard-text-input>
      </div>
    `;
  }

  firstUpdated() {
    this.addEventListener(
      'input',
      (event) => {
        if (event.target === this) {
          return;
        }
        this._notifyChange();
      },
      true
    );
    this.addEventListener(
      'change',
      (event) => {
        if (event.target === this) {
          return;
        }
        this._notifyChange();
      },
      true
    );
  }

  _notifyChange() {
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  }

  onEntryAdded(key) {
    const input = this.querySelector(`#${this.fieldPrefix}_text_${key}`);
    if (input) {
      input.focus();
    }
    this._notifyChange();
  }

  getEntries() {
    const entries = [];
    Array.from(this.querySelectorAll('.extent-entry')).forEach((entry) => {
      const textInput = entry.querySelector('.extent-text');
      const unitsInput = entry.querySelector('.extent-units');
      const textValue = textInput ? textInput.value.trim() : '';
      const unitsValue = unitsInput ? unitsInput.value.trim() : '';
      if (textValue !== '' || unitsValue !== '') {
        entries.push({ text: textValue, units: unitsValue });
      }
    });
    return entries;
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('repeatable-extent-input')) {
  window.customElements.define('repeatable-extent-input', RepeatableExtentInput);
}
