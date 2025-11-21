import { html } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { RepeatableFieldBase } from './repeatable-field-base.js';
import './standard-text-input.js';

/**
 * Repeatable container input component for archival containers
 * Allows adding multiple container entries with type and label
 */
export class RepeatableContainerInput extends RepeatableFieldBase {
    static properties = {
        ...RepeatableFieldBase.properties,
        heading: { type: String },
        fieldPrefix: { type: String, attribute: 'field-prefix' },
        requiredMarker: { type: String, attribute: 'required-marker' }
    };

    constructor() {
        super();
        this.heading = 'Container';
        this.fieldPrefix = 'container';
        this.requiredMarker = '*';
        this.addButtonLabel = '+';
        this.addButtonAriaLabel = 'Add container';
        this.addButtonId = 'add-container';
    }

    createInitialKeys() {
        return ['0'];
    }

    getNextEntryKey() {
        return `${this.entries.length}`;
    }

    renderContainer(entriesContent, addControl) {
        return html`<div class="container-container">
      <label class="heading">${this.heading}<span class="required_marker">${this.requiredMarker}</span></label>
      ${entriesContent}
      <div class="repeatable-add-control">${addControl}</div>
    </div>`;
    }

    renderEntry(key) {
        const typeId = `${this.fieldPrefix}_type_${key}`;
        const labelId = `${this.fieldPrefix}_label_${key}`;
        const wrapperClass = key === '0' ? 'container-entry' : 'container-entry added';

        return html`
      <div class="${wrapperClass}" data-container-index="${key}">
        <div class="container-field">
          <label for="${typeId}" class="heading">Type</label><br>
          <select id="${typeId}" class="container-type" required>
            <option value="" selected disabled hidden></option>
            <option value="box">box</option>
            <option value="folder">folder</option>
            <option value="reel">reel</option>
            <option value="frame">frame</option>
            <option value="volume">volume</option>
            <option value="carton">carton</option>
            <option value="case">case</option>
            <option value="drawer">drawer</option>
            <option value="tube">tube</option>
            <option value="othertype">othertype</option>
          </select>
        </div>
        <standard-text-input
          container-class="container-field"
          field-id="${labelId}"
          heading="Label"
          input-class="container-label"
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
        const select = this.querySelector(`#${this.fieldPrefix}_type_${key}`);
        if (select) {
            select.focus();
        }
        this._notifyChange();
    }

    getEntries() {
        const entries = [];
        Array.from(this.querySelectorAll('.container-entry')).forEach((entry) => {
            const typeSelect = entry.querySelector('.container-type');
            const labelInput = entry.querySelector('.container-label');
            const typeValue = typeSelect ? typeSelect.value.trim() : '';
            const labelValue = labelInput ? labelInput.value.trim() : '';
            if (typeValue !== '' || labelValue !== '') {
                entries.push({ type: typeValue, label: labelValue });
            }
        });
        return entries;
    }
}

if (typeof window !== 'undefined' && !window.customElements.get('repeatable-container-input')) {
    window.customElements.define('repeatable-container-input', RepeatableContainerInput);
}
