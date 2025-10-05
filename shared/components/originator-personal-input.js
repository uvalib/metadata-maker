import { html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { RepeatableFieldBase } from './repeatable-field-base.js';

export class OriginatorPersonalInput extends RepeatableFieldBase {
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
        <label for="${familyId}" class="heading">Family name</label>
        <label for="${familyId}" class="insert insert_normal" @click=${() => this.handleInsertClick(familyId)}>Insert Special Characters</label><br>
        <div id="insert-${familyId}"></div>
        <input type="text" id="${familyId}" class="originator-personal-family translit-listen" placeholder="Family name" ?required=${isFirst}>

        <label for="${givenId}" class="heading">Given name</label>
        <label for="${givenId}" class="insert insert_normal" @click=${() => this.handleInsertClick(givenId)}>Insert Special Characters</label><br>
        <div id="insert-${givenId}"></div>
        <input type="text" id="${givenId}" class="originator-personal-given translit-listen" placeholder="Given name" ?required=${isFirst}>

        <label for="${birthId}" class="heading">Birth date</label><br>
        <input type="date" id="${birthId}" class="originator-personal-birth">

        <label for="${deathId}" class="heading">Death date</label><br>
        <input type="date" id="${deathId}" class="originator-personal-death">
      </div>
    `;
  }

  handleInsertClick(id) {
    if (typeof window.insertMenu === 'function') {
      window.insertMenu(id);
    }
  }

  onEntryAdded(key) {
    const input = this.querySelector(`#originator_family_name_${key}`);
    if (input) {
      input.focus();
    }
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('originator-personal-input')) {
  window.customElements.define('originator-personal-input', OriginatorPersonalInput);
}
