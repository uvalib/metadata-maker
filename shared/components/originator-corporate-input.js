import { html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { RepeatableFieldBase } from './repeatable-field-base.js';
import './standard-text-input.js';
import './edtf-date-input.js';

export class OriginatorCorporateInput extends RepeatableFieldBase {
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

  constructor() {
    super();
    this.addButtonLabel = '+';
    this.addButtonAriaLabel = 'Add another corporate originator';
    this.addButtonId = 'add-originator-corporate';
  }

  createInitialKeys() {
    return [0];
  }

  getNextEntryKey() {
    return this.entries.length;
  }

  renderContainer(entriesContent, addControl) {
    return html`
      <div class="originator-corporate-container">
        <label class="heading">Corporate name</label>
        ${entriesContent}
        <div class="originator-add-control">${addControl}</div>
      </div>
    `;
  }

  renderEntry(key) {
    const nameId = `originator_corporate_name_${key}`;
    const startId = `originator_corporate_start_${key}`;
    const endId = `originator_corporate_end_${key}`;

    return html`
      <div class="originator-corporate-entry" data-originator-index="${key}">
        <standard-text-input
          container-class="originator-field"
          field-id="${nameId}"
          heading="Name"
          input-class="originator-corporate-name translit-listen"
        ></standard-text-input>

        <edtf-date-input
          container-class="originator-field"
          field-id="${startId}"
          heading="Start date"
          input-class="originator-corporate-start"
        ></edtf-date-input>

        <edtf-date-input
          container-class="originator-field"
          field-id="${endId}"
          heading="End date"
          input-class="originator-corporate-end"
        ></edtf-date-input>
      </div>
    `;
  }

  _notifyChange() {
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  }

  onEntryAdded(key) {
    const input = this.querySelector(`#originator_corporate_name_${key}`);
    if (input) {
      input.focus();
    }
    this._notifyChange();
  }

  getEntries() {
    const entries = [];
    Array.from(this.querySelectorAll('.originator-corporate-entry')).forEach((entry) => {
      const name = entry.querySelector('.originator-corporate-name');
      const start = entry.querySelector('.originator-corporate-start');
      const end = entry.querySelector('.originator-corporate-end');
      const nameValue = name ? name.value.trim() : '';
      const startValue = start ? start.value : '';
      const endValue = end ? end.value : '';
      if (nameValue !== '' || startValue !== '' || endValue !== '') {
        entries.push({
          name: nameValue,
          start_date: startValue,
          end_date: endValue
        });
      }
    });
    return entries;
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('originator-corporate-input')) {
  window.customElements.define('originator-corporate-input', OriginatorCorporateInput);
}
