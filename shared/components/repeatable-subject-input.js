import { html } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { RepeatableFieldBase } from './repeatable-field-base.js';
import './standard-text-input.js';

const SUBJECT_TYPES = [
  'topic',
  'corpName',
  'famName',
  'persName',
  'geogName',
  'occupation',
  'genreForm',
  'function'
];

export class RepeatableSubjectInput extends RepeatableFieldBase {
  constructor() {
    super();
    this.addButtonLabel = '+';
    this.addButtonAriaLabel = 'Add subject';
    this.addButtonId = 'add-subject';
  }

  createInitialKeys() {
    return ['0'];
  }

  getNextEntryKey() {
    return `${this.entries.length}`;
  }

  renderContainer(entriesContent, addControl) {
    return html`<div class="subject-container">
      <label class="heading">Subject</label>
      ${entriesContent}
      <div class="repeatable-add-control">${addControl}</div>
    </div>`;
  }

  renderEntry(key, isFirst) {
    const termId = `subject_term_${key}`;
    const typeId = `subject_type_${key}`;
    const sourceId = `subject_source_${key}`;
    const wrapperClass = isFirst ? 'subject-entry' : 'subject-entry added';

    return html`
      <div class="${wrapperClass}" data-subject-index="${key}">
        <standard-text-input
          container-class="subject-field"
          field-id="${termId}"
          heading="Term"
          input-class="subject-term"
          required
          required-marker="*"
        ></standard-text-input>

        <div class="subject-field">
          <label for="${typeId}" class="heading">Type<span class="required_marker">*</span></label><br>
          <select id="${typeId}" class="subject-type" required>
            ${SUBJECT_TYPES.map((value) => html`<option value="${value}">${value}</option>`)}
          </select>
        </div>

        <standard-text-input
          container-class="subject-field"
          field-id="${sourceId}"
          heading="Source"
          input-class="subject-source"
          required-marker=""
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
    const input = this.querySelector(`#subject_term_${key}`);
    if (input) {
      input.focus();
    }
    this._notifyChange();
  }

  getEntries() {
    const entries = [];
    Array.from(this.querySelectorAll('.subject-entry')).forEach((entry) => {
      const termInput = entry.querySelector('.subject-term');
      const typeInput = entry.querySelector('.subject-type');
      const sourceInput = entry.querySelector('.subject-source');
      const term = termInput ? termInput.value.trim() : '';
      const type = typeInput ? typeInput.value : '';
      const source = sourceInput ? sourceInput.value.trim() : '';
      if (term !== '' || source !== '') {
        entries.push({ term, type, source });
      }
    });
    return entries;
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('repeatable-subject-input')) {
  window.customElements.define('repeatable-subject-input', RepeatableSubjectInput);
}
