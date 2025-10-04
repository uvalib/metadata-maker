import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';

const BOOLEAN_FALSE_VALUES = new Set(['false', '0', 'off', 'no']);

function normalizeBooleanAttribute(value, defaultValue) {
  if (value === null) {
    return defaultValue;
  }
  if (value === '') {
    return true;
  }
  const normalized = String(value).trim().toLowerCase();
  if (BOOLEAN_FALSE_VALUES.has(normalized)) {
    return false;
  }
  return true;
}

export class CorporateOrganizationInput extends LitElement {
  static properties = {
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
  }

  createRenderRoot() {
    return this;
  }

  get showTransliteration() {
    return normalizeBooleanAttribute(this.transliteration, true);
  }

  get isRequired() {
    return normalizeBooleanAttribute(this.required, true);
  }

  render() {
    return html`
      <div id="corporate-block">
        <label for="corporate_name" class="heading">${this.heading}</label><label for="corporate_name" class="${this.insertClass}" onClick='insertMenu("corporate_name");'>${this.insertLabel}</label><br>
        <div id="insert-corporate_name"></div>
        <input type="text" class="corporate conditional translit-listen" id="corporate_name" ?required=${this.isRequired}>
        <select name="role" id="corporate_role">
          <option value="cre" selected>creator</option>
          <option value="ctb">contributor</option>
        </select>
        <label title="${this.helpText}"><span class="question-mark">?</span></label>
        <input type="button" value="+" id="add-corporate" onClick="addCorporate();">
        <br>
        <span class="unlisted">Unlisted</span><input type="checkbox" id="corporate_name_listed" class="listed">
        ${this.showTransliteration ? html`
          <div id="translit-corporate_name-block" class="translit-corporate_name-block translit-block translit-corporate_name hidden">
            <label for="translit_corporate_name" class="hidden translit heading translit-corporate_name">Transliterated name</label><label for="translit_corporate_name" class="insert insert_translit_corporate_name hidden translit translit-corporate_name" onClick='insertMenu("translit_corporate_name");'>Insert other Characters</label><br>
            <div id="insert-translit_corporate_name"></div>
            <input type="text" id="translit_corporate_name" class="hidden translit translit-corporate_name">
          </div>
        ` : null}
      </div>
    `;
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('corporate-organization-input')) {
  window.customElements.define('corporate-organization-input', CorporateOrganizationInput);
}
