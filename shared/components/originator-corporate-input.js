import { html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { RepeatableFieldBase } from './repeatable-field-base.js';

export class OriginatorCorporateInput extends RepeatableFieldBase {
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
    const suffix = `_${key}`;
    const nameId = `originator_corporate_name${suffix}`;
    const startId = `originator_corporate_start${suffix}`;
    const endId = `originator_corporate_end${suffix}`;

    return html`
      <div class="originator-corporate-entry" data-originator-index="${key}">
        <label for="${nameId}" class="heading">Name</label>
        <label for="${nameId}" class="insert insert_normal" @click=${() => this.handleInsertClick(nameId)}>Insert Special Characters</label><br>
        <div id="insert-${nameId}"></div>
        <input type="text" id="${nameId}" class="originator-corporate-name translit-listen" placeholder="Name" ?required=${key === 0}>

        <label for="${startId}" class="heading">Start date</label><br>
        <input type="date" id="${startId}" class="originator-corporate-start">

        <label for="${endId}" class="heading">End date</label><br>
        <input type="date" id="${endId}" class="originator-corporate-end">
      </div>
    `;
  }

  handleInsertClick(id) {
    if (typeof window.insertMenu === 'function') {
      window.insertMenu(id);
    }
  }

  onEntryAdded(key) {
    const input = this.querySelector(`#originator_corporate_name_${key}`);
    if (input) {
      input.focus();
    }
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('originator-corporate-input')) {
  window.customElements.define('originator-corporate-input', OriginatorCorporateInput);
}
