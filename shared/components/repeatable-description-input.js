import { html } from 'https://cdn.jsdelivr.net/npm/lit@3.2.1/+esm';
import { RepeatableFieldBase } from './repeatable-field-base.js';

/**
 * Repeatable description input component for EAD descriptions
 * Allows adding multiple description entries with type and text
 */
export class RepeatableDescriptionInput extends RepeatableFieldBase {
    static properties = {
        ...RepeatableFieldBase.properties,
        heading: { type: String },
        fieldPrefix: { type: String, attribute: 'field-prefix' },
        requiredMarker: { type: String, attribute: 'required-marker' }
    };

    constructor() {
        super();
        this.heading = 'Description';
        this.fieldPrefix = 'description';
        this.requiredMarker = '*';
        this.addButtonLabel = '+';
        this.addButtonAriaLabel = 'Add description';
        this.addButtonId = 'add-description';
    }

    createInitialKeys() {
        return ['0'];
    }

    getNextEntryKey() {
        return `${this.entries.length}`;
    }

    renderContainer(entriesContent, addControl) {
        return html`<div class="description-container standard-block">
      <label class="heading">${this.heading}<span class="required_marker">${this.requiredMarker}</span></label>
      ${entriesContent}
      <div class="repeatable-add-control">${addControl}</div>
    </div>`;
    }

    renderEntry(key) {
        const typeId = `${this.fieldPrefix}_type_${key}`;
        const textId = `${this.fieldPrefix}_text_${key}`;
        const wrapperClass = key === '0' ? 'description-entry flex gap-4' : 'description-entry added flex gap-4 mt-2';

        return html`
      <div class="${wrapperClass}" data-description-index="${key}">
        <div class="description-field w-1/3">
          <label for="${typeId}" class="heading">Type</label>
          <select id="${typeId}" class="description-type input-base" required>
            <option value="" selected disabled hidden></option>
            <option value="accessrestrict">accessrestrict</option>
            <option value="accruals">accruals</option>
            <option value="acqinfo">acqinfo</option>
            <option value="altformavail">altformavail</option>
            <option value="appraisal">appraisal</option>
            <option value="arrangement">arrangement</option>
            <option value="bioghist">bioghist</option>
            <option value="custodhist">custodhist</option>
            <option value="note">note</option>
            <option value="originalsloc">originalsloc</option>
            <option value="phystech">phystech</option>
            <option value="prefercite">prefercite</option>
            <option value="processinfo">processinfo</option>
            <option value="relatedmaterial">relatedmaterial</option>
            <option value="scopecontent">scopecontent</option>
            <option value="separatedmaterial">separatedmaterial</option>
            <option value="userestrict">userestrict</option>
          </select>
        </div>
        <div class="description-field w-2/3">
          <label for="${textId}" class="heading">Text</label>
          <textarea 
            id="${textId}" 
            class="description-text input-base" 
            required 
            rows="5"
          ></textarea>
        </div>
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
        const select = this.querySelector(`#${this.fieldPrefix}_type_${key}`);
        if (select) {
            select.focus();
        }
        this._notifyChange();
    }

    getEntries() {
        const entries = [];
        Array.from(this.querySelectorAll('.description-entry')).forEach((entry) => {
            const typeSelect = entry.querySelector('.description-type');
            const textArea = entry.querySelector('.description-text');
            const typeValue = typeSelect ? typeSelect.value.trim() : '';
            const textValue = textArea ? textArea.value.trim() : '';
            if (typeValue !== '' || textValue !== '') {
                entries.push({ type: typeValue, text: textValue });
            }
        });
        return entries;
    }
}

if (typeof window !== 'undefined' && !window.customElements.get('repeatable-description-input')) {
    window.customElements.define('repeatable-description-input', RepeatableDescriptionInput);
}
