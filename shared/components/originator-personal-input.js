import { html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { RepeatableFieldBase } from './repeatable-field-base.js';
import './standard-text-input.js';
import './standard-date-input.js';

export class OriginatorPersonalInput extends RepeatableFieldBase {
  firstUpdated() {
    this.addEventListener('input', () => this._notifyChange(), true);
    this.addEventListener('change', () => this._notifyChange(), true);
  }

  constructor() {
    super();
    this.addButtonLabel = '+';
    this.addButtonAriaLabel = 'Add another personal or family name originator';
    this.addButtonId = 'add-originator-personal';
  }

  createInitialKeys() {
    return [0];
  }

  getNextEntryKey() {
    return this.entries.length;
  }

  renderContainer(entriesContent, addControl) {
    return html`
      <div class="originator-personal-container">
        <label class="heading">Personal/Family name</label>
        ${entriesContent}
        <div class="originator-add-control">${addControl}</div>
      </div>
    `;
  }

  renderEntry(key, isFirst) {
    const suffix = `_${key}`;
    const familyId = `originator_family_name${suffix}`;
    const givenId = `originator_given_name${suffix}`;
    const birthId = `originator_birth_date${suffix}`;
    const deathId = `originator_death_date${suffix}`;

    return html`
      <div class="originator-personal-entry" data-originator-index="${key}">
        <standard-text-input
          container-class="originator-field"
          field-id="${familyId}"
          heading="Family name"
          input-class="originator-personal-family translit-listen"
        ></standard-text-input>

        <standard-text-input
          container-class="originator-field"
          field-id="${givenId}"
          heading="Given name"
          input-class="originator-personal-given translit-listen"
        ></standard-text-input>

        <standard-date-input
          container-class="originator-field"
          field-id="${birthId}"
          heading="Birth date"
          input-class="originator-personal-birth"
        ></standard-date-input>

        <standard-date-input
          container-class="originator-field"
          field-id="${deathId}"
          heading="Death date"
          input-class="originator-personal-death"
        ></standard-date-input>
      </div>
    `;
  }

  _notifyChange() {
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  }

  onEntryAdded(key) {
    const input = this.querySelector(`#originator_family_name_${key}`);
    if (input) {
      input.focus();
    }
    this._notifyChange();
  }

  getEntries() {
    const entries = [];
    Array.from(this.querySelectorAll('.originator-personal-entry')).forEach((entry) => {
      const family = entry.querySelector('.originator-personal-family');
      const given = entry.querySelector('.originator-personal-given');
      const birth = entry.querySelector('.originator-personal-birth');
      const death = entry.querySelector('.originator-personal-death');
      const familyValue = family ? family.value.trim() : '';
      const givenValue = given ? given.value.trim() : '';
      const birthValue = birth ? birth.value : '';
      const deathValue = death ? death.value : '';
      if (familyValue !== '' || givenValue !== '' || birthValue !== '' || deathValue !== '') {
        entries.push({
          family: familyValue,
          given: givenValue,
          birth_date: birthValue,
          death_date: deathValue
        });
      }
    });
    return entries;
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('originator-personal-input')) {
  window.customElements.define('originator-personal-input', OriginatorPersonalInput);
}
