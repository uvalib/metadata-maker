import { html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { RepeatableFieldBase } from './repeatable-field-base.js';

const FALSE_VALUES = new Set(['false', '0', 'off', 'no']);

function normalizeBoolean(value, defaultValue = true) {
  if (value === null) {
    return defaultValue;
  }
  if (value === '') {
    return true;
  }
  return !FALSE_VALUES.has(String(value).trim().toLowerCase());
}

export class CorporateOrganizationInput extends RepeatableFieldBase {
  static properties = {
    ...RepeatableFieldBase.properties,
    heading: { type: String },
    insertClass: { type: String, attribute: 'insert-class' },
    insertLabel: { type: String, attribute: 'insert-label' },
    helpText: { type: String, attribute: 'help-text' },
    transliteration: { attribute: 'transliteration' },
    required: { attribute: 'required' }
  };

  constructor() {
    super();
    this.heading = 'Corporate/Organization';
    this.insertClass = 'insert insert_corporate_name';
    this.insertLabel = 'Insert other Characters';
    this.helpText = 'Enter the name of creators or contributors listed on the piece and select the appropriate role from the drop down menu.';
    this.transliteration = null;
    this.required = null;
    this.addButtonLabel = '+';
    this.addButtonId = 'add-corporate';
    this.addButtonAriaLabel = 'Add another corporate or organization name';
    this.counterNames = ['corporateCounter', 'cCounter'];
  }

  createInitialKeys() {
    return [''];
  }

  getNextEntryKey() {
    return this.entries.length - 1;
  }

  render() {
    const primaryKey = this.entries[0];
    const additionalKeys = this.entries.slice(1);
    const [primaryTop, primaryBottom] = this.renderPrimarySections(primaryKey);
    const addControl = this.allowAdd ? this.renderAddControl() : nothing;
    return html`<div id="corporate-block">
      ${primaryTop}
      ${addControl}
      ${this.allowAdd ? html`<br>` : nothing}
      ${primaryBottom}
      ${additionalKeys.map((key) => this.renderAdditionalEntry(key))}
    </div>`;
  }

  renderPrimarySections(_key) {
    const nameId = 'corporate_name';
    const roleId = 'corporate_role';
    const insertId = 'insert-corporate_name';
    const translitId = 'translit_corporate_name';
    const translitBlockId = 'translit-corporate_name-block';
    const translitClass = 'translit-corporate_name';

    const top = html`
      <label for="${nameId}" class="heading">${this.heading}</label>
      <label for="${nameId}" class="${this.insertClass}" @click=${() => this.handleInsertClick(nameId)}>${this.insertLabel}</label><br>
      <div id="${insertId}"></div>
      <input type="text" class="corporate conditional translit-listen" id="${nameId}" ?required=${this.isRequired}>
      <select name="role" id="${roleId}">
        <option value="ctb" selected>contributor</option>
        <option value="cre">creator</option>
      </select>
      <label title="${this.helpText}"><span class="question-mark">?</span></label>
    `;

    const bottom = html`
      <span class="unlisted">Unlisted</span><input type="checkbox" id="${nameId}_listed" class="listed">
      ${this.renderTransliterationBlock(translitBlockId, translitId, translitClass)}
    `;

    return [top, bottom];
  }

  renderAdditionalEntry(key) {
    const nameId = `corporate_name${key}`;
    const roleId = `corporate_role${key}`;
    const insertId = `insert-corporate_name${key}`;
    const translitId = `translit_corporate_name${key}`;
    const translitBlockId = `translit-corporate_name${key}-block`;
    const translitClass = `translit_corporate_name${key}`;
    return html`
      <div class="added-corporate">
        <label for="${nameId}" class="${this.insertClass}" @click=${() => this.handleInsertClick(nameId)}>${this.insertLabel}</label><br>
        <div id="${insertId}"></div>
        <span class="added-corporate">
          <input type="text" class="corporate translit-listen" id="${nameId}">
          <select name="role${key}" id="${roleId}">
            <option value="cre" selected>creator</option>
            <option value="ctb">contributor</option>
          </select>
        </span>
        ${this.renderTransliterationBlock(translitBlockId, translitId, translitClass)}
      </div>
    `;
  }

  renderTransliterationBlock(blockId, fieldId, className) {
    if (!this.showTransliteration) {
      return nothing;
    }
    return html`
      <div id="${blockId}" class="${blockId} translit-block ${className} hidden">
        <label for="${fieldId}" class="hidden translit heading ${className}">Transliterated name</label>
        <label for="${fieldId}" class="insert insert_translit_corporate_name hidden translit ${className}" @click=${() => this.handleInsertClick(fieldId)}>${this.insertLabel}</label><br>
        <div id="insert-${fieldId}"></div>
        <input type="text" id="${fieldId}" class="hidden translit ${className}">
      </div>
    `;
  }

  get isRequired() {
    return normalizeBoolean(this.required, true);
  }

  get showTransliteration() {
    return normalizeBoolean(this.transliteration, true);
  }

  handleInsertClick(id) {
    if (typeof window.insertMenu === 'function') {
      window.insertMenu(id);
    }
  }

  onEntryAdded(key, index) {
    const targetId = index === 0 ? 'corporate_name' : `corporate_name${key}`;
    const input = this.querySelector(`#${targetId}`);
    if (input) {
      input.focus();
    }
  }

  get additionalEntryCount() {
    return Math.max(0, this.entries.length - this.initialEntryCount);
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('corporate-organization-input')) {
  window.customElements.define('corporate-organization-input', CorporateOrganizationInput);
}
