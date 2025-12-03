import { html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.2.1/+esm';
import { RepeatableFieldBase } from './repeatable-field-base.js';
import './edtf-date-input.js';

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
    required: { attribute: 'required' },
    requiredMarker: { type: String, attribute: 'required-marker' },
    includeDates: { type: Boolean, attribute: 'include-dates' },
    includeRole: { type: Boolean, attribute: 'include-role' },
    baseId: { type: String, attribute: 'base-id' }
  };

  constructor() {
    super();
    this.heading = 'Corporate/Organization';
    this.insertClass = 'insert insert_corporate_name';
    this.insertLabel = 'Insert other Characters';
    this.helpText = 'Enter the name of creators or contributors listed on the piece and select the appropriate role from the drop down menu.';
    this.transliteration = null;
    this.required = null;
    this.requiredMarker = '*';
    this.addButtonLabel = '+';
    this.addButtonId = 'add-corporate';
    this.addButtonAriaLabel = 'Add another corporate or organization name';
    this.counterNames = ['corporateCounter', 'cCounter'];
    this.includeDates = false;
    this.includeRole = true;
    this.baseId = 'corporate_name';
    this.style.display = 'block';
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
    const nameId = this.baseId;
    const roleId = this.baseId.replace('name', 'role');
    const insertId = `insert-${this.baseId}`;
    const translitId = `translit_${this.baseId}`;
    const translitBlockId = `translit-${this.baseId}-block`;
    const translitClass = `translit-${this.baseId}`;

    // Date IDs for primary entry (if dates enabled)
    // Originator usage: originator_corporate_start_0, originator_corporate_end_0
    // Standard usage: N/A
    // If we use baseId 'originator_corporate_name', we want 'originator_corporate_start_0'
    // But standard usage uses 'corporate_name' (no suffix for first entry).
    // Let's stick to standard pattern: if baseId is 'corporate_name', first entry is 'corporate_name'.
    // If dates are enabled, we probably want consistent suffixing or specific IDs.
    // Originator input uses 0-based index for ALL entries, including the first one?
    // Let's check originator-corporate-input.js:
    // renderEntry(key) where key comes from createInitialKeys() -> [0].
    // nameId = `originator_corporate_name_${key}` -> originator_corporate_name_0.
    // So Originator uses suffix 0 for the first entry.
    // Standard uses NO suffix for the first entry.

    // We need to support both patterns.
    // If includeDates is true (Originator mode), maybe we should treat the first entry as indexed?
    // Or we can just use the baseId logic.

    // Let's look at how RepeatableFieldBase handles keys.
    // Standard: createInitialKeys returns ['']. entries[0] is ''.
    // Originator: createInitialKeys returns [0]. entries[0] is 0.

    // If I change createInitialKeys to return [0] when includeDates is true, that might solve it.
    // But RepeatableFieldBase constructor runs before properties are set? No, properties are set by Lit.
    // But constructor initializes entries.

    // Actually, I can just check the key.
    // If key is '' (standard), use baseId.
    // If key is 0 (originator), use baseId + '_0'.

    // Wait, standard usage expects 'corporate_name' for the first one.
    // Originator usage expects 'originator_corporate_name_0'.

    // I can override createInitialKeys based on a property, but constructor runs early.
    // I might need to re-initialize entries in connectedCallback or firstUpdated if needed, but that's messy.

    // Alternative: Just use the key passed to renderPrimarySections.
    // In standard, key is ''. In originator (if I change it), key could be 0.
    // But I need to change createInitialKeys.

    // Let's stick to the standard pattern for now (['']) and just handle the ID generation.
    // If includeDates is true, we might want to force a suffix even for the first entry if that's what originator expects.
    // Originator expects `originator_corporate_name_0`.
    // If I set baseId to `originator_corporate_name`, and key is `_0`, I get `originator_corporate_name_0`.

    // So if I use `originator-input`, I should probably pass `initial-keys='[0]'`? No, that's not a property.

    // Let's just handle it in the ID generation logic.
    // If includeDates is true, append '_0' to baseId for the primary entry?
    // Or better, let's make `createInitialKeys` dynamic or overridable via property? No.

    // Let's look at `originator-corporate-input.js` again.
    // createInitialKeys() { return [0]; }
    // renderEntry(key) ... nameId = `originator_corporate_name_${key}`

    // `corporate-organization-input.js`:
    // createInitialKeys() { return ['']; }
    // renderPrimarySections(_key) ... nameId = 'corporate_name'

    // If I merge them, I need to support both ID schemes.
    // I can add a property `useIndexedIds` (boolean, default false).
    // If true, createInitialKeys returns [0].
    // But again, constructor.

    // Maybe I can just detect if it's being used as originator?
    // Or I can just support the standard pattern and update `originator-input` to handle `originator_corporate_name` (no suffix) for the first entry?
    // `originator-input.js` uses `getEntries()` which reads from the DOM.
    // As long as `getEntries()` finds the inputs, the exact ID might not matter for the logic, 
    // BUT it might matter for the backend/form submission if it relies on specific ID names.
    // The `submitForm.js` for collections/archives might expect specific IDs.
    // `collections/metadatamaker/submitForm.js`:
    // var originatorComponent = document.querySelector('originator-input');
    // ... originatorComponent.getValue()
    // It relies on `getValue()`, which calls `getEntries()`.
    // `getEntries()` queries by class: `.originator-corporate-name`.
    // So the IDs might NOT matter for data collection in `originator-input` context!

    // However, `originator-corporate-input` uses `standard-text-input` which generates labels with `for` attributes matching IDs.
    // So IDs need to be unique and match labels.

    // So, if I use the standard pattern (no suffix for first), it should be fine as long as `getEntries` works.
    // AND `originator-input` doesn't care about the IDs.

    // Let's assume standard pattern is fine.
    // baseId = 'originator_corporate_name'.
    // First entry ID = 'originator_corporate_name'.
    // Additional entry 1 ID = 'originator_corporate_name1'.

    // Wait, `originator-corporate-input` used `_0`, `_1`.
    // `corporate-organization-input` uses `` (empty), `1`, `2`.
    // This is a difference in suffixing style (`_N` vs `N`).
    // I should probably add a `suffixStyle` or just stick to one if possible.
    // Standard: `corporate_name`, `corporate_name1`
    // Originator: `originator_corporate_name_0`, `originator_corporate_name_1`

    // If I change Originator to use Standard style:
    // `originator_corporate_name`, `originator_corporate_name1`
    // Does this break anything?
    // Only if CSS or external JS relies on specific IDs.
    // `originator-input` uses classes.

    // I will proceed with Standard style for IDs, but with `baseId` configurable.
    // I will add `includeDates` logic.

    const requiredMarker = this.isRequired && this.requiredMarker ? html`<span class="required_marker">${this.requiredMarker}</span>` : nothing;

    const roleSelect = this.includeRole ? html`
      <select name="${roleId}" id="${roleId}" class="border rounded px-2 py-1 ml-2">
        <option value="ctb" selected>contributor</option>
        <option value="cre">creator</option>
      </select>
    ` : nothing;

    const dateInputs = this.includeDates ? html`
      <edtf-date-input
        container-class="inline-block ml-2"
        field-id="${this.baseId}_start"
        heading="Start date"
        input-class="originator-corporate-start border rounded px-2 py-1 w-32"
      ></edtf-date-input>
      <edtf-date-input
        container-class="inline-block ml-2"
        field-id="${this.baseId}_end"
        heading="End date"
        input-class="originator-corporate-end border rounded px-2 py-1 w-32"
      ></edtf-date-input>
    ` : nothing;

    const top = html`
      <label for="${nameId}" class="heading font-semibold">${this.heading}${requiredMarker}</label>
      <label for="${nameId}" class="${this.insertClass} text-blue-600 cursor-pointer text-sm ml-2" @click=${() => this.handleInsertClick(nameId)}>Ω</label><br>
      <div id="${insertId}"></div>
      <div class="flex flex-wrap items-end gap-2">
        <input type="text" class="corporate conditional translit-listen border rounded px-2 py-1 w-64 originator-corporate-name" id="${nameId}" ?required=${this.isRequired}>
        ${roleSelect}
        ${dateInputs}
        <label title="${this.helpText}"><span class="question-mark text-gray-500 ml-2 cursor-help">?</span></label>
      </div>
    `;

    const bottom = html`
      <span class="unlisted">Unlisted</span><input type="checkbox" id="${nameId}_listed" class="listed">
      ${this.renderTransliterationBlock(translitBlockId, translitId, translitClass)}
    `;

    return [top, bottom];
  }

  renderAdditionalEntry(key) {
    const suffix = key; // Standard: 1, 2, 3...
    const nameId = `${this.baseId}${suffix}`;
    const roleId = `${this.baseId.replace('name', 'role')}${suffix}`;
    const insertId = `insert-${nameId}`;
    const translitId = `translit_${nameId}`;
    const translitBlockId = `translit-${nameId}-block`;
    const translitClass = `translit_${nameId}`;

    const roleSelect = this.includeRole ? html`
      <select name="role${key}" id="${roleId}" class="border rounded px-2 py-1">
        <option value="cre" selected>creator</option>
        <option value="ctb">contributor</option>
      </select>
    ` : nothing;

    const dateInputs = this.includeDates ? html`
      <edtf-date-input
        container-class="inline-block"
        field-id="${nameId}_start"
        heading="Start date"
        input-class="originator-corporate-start border rounded px-2 py-1 w-32"
      ></edtf-date-input>
      <edtf-date-input
        container-class="inline-block"
        field-id="${nameId}_end"
        heading="End date"
        input-class="originator-corporate-end border rounded px-2 py-1 w-32"
      ></edtf-date-input>
    ` : nothing;

    return html`
      <div class="added-corporate my-2 originator-corporate-entry">
        <label for="${nameId}" class="${this.insertClass} text-blue-600 cursor-pointer text-sm" @click=${() => this.handleInsertClick(nameId)}>Ω</label><br>
        <div id="${insertId}"></div>
        <span class="added-corporate flex items-center gap-2 flex-wrap">
          <input type="text" class="corporate translit-listen border rounded px-2 py-1 w-64 originator-corporate-name" id="${nameId}">
          ${roleSelect}
          ${dateInputs}
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
    return normalizeBoolean(this.required, false);
  }

  get showTransliteration() {
    return normalizeBoolean(this.transliteration, true);
  }

  handleInsertClick(id) {
    if (typeof window.insertMenu === 'function') {
      window.insertMenu(id);
    }
  }

  firstUpdated() {
    const nameId = this.baseId;
    const inputElement = this.querySelector(`#${nameId}`);
    const unlistedCheckbox = this.querySelector(`#${nameId}_listed`);

    if (inputElement && unlistedCheckbox) {
      unlistedCheckbox.addEventListener('change', () => {
        if (unlistedCheckbox.checked) {
          inputElement.removeAttribute('required');
        } else if (this.isRequired) {
          inputElement.setAttribute('required', '');
        }
      });
    }

    // Notify change for originator-input integration
    this.addEventListener('input', (event) => {
      if (event.target === this) return;
      this._notifyChange();
    });
    this.addEventListener('change', (event) => {
      if (event.target === this) return;
      this._notifyChange();
    });
  }

  onEntryAdded(key, index) {
    const targetId = index === 0 ? this.baseId : `${this.baseId}${key}`;
    const input = this.querySelector(`#${targetId}`);
    if (input) {
      input.focus();
    }
    this._notifyChange();
  }

  get additionalEntryCount() {
    return Math.max(0, this.entries.length - this.initialEntryCount);
  }

  _notifyChange() {
    this.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
  }

  getEntries() {
    const entries = [];
    // Query for inputs with class 'originator-corporate-name' which I added to the inputs
    // Also 'originator-corporate-start' and 'originator-corporate-end'

    // I need to iterate over the logical entries.
    // The DOM structure has primary entry and then additional entries.
    // Primary entry is directly in #corporate-block (or wrapped in div in my new render?)
    // My new render puts primaryTop and primaryBottom directly in #corporate-block.
    // Additional entries are in .added-corporate divs.

    // This is a bit unstructured for easy iteration.
    // But I can query for all inputs with a specific class.
    const nameInputs = Array.from(this.querySelectorAll('.originator-corporate-name'));

    nameInputs.forEach((nameInput) => {
      // Find sibling date inputs
      // They are in the same container (div or span)
      const container = nameInput.parentElement; // .flex or .added-corporate
      // Actually for primary, they are in a .flex div now.
      // For additional, they are in .added-corporate > span.
      // So finding siblings should work.

      const startInput = container.querySelector('.originator-corporate-start');
      const endInput = container.querySelector('.originator-corporate-end');

      const nameValue = nameInput.value.trim();
      const startValue = startInput ? startInput.value : '';
      const endValue = endInput ? endInput.value : '';

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

if (typeof window !== 'undefined' && !window.customElements.get('corporate-organization-input')) {
  window.customElements.define('corporate-organization-input', CorporateOrganizationInput);
}
