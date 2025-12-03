import { LitElement, html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.2.1/+esm';
import './edtf-date-input.js';
import { countryList } from '../country-list.js';
import { stateList } from '../state-list.js';

const FALSE_VALUES = new Set(['false', '0', 'off', 'no']);

function normalizeBoolean(value, defaultValue = false) {
    if (value === null) {
        return defaultValue;
    }
    if (value === '') {
        return true;
    }
    return !FALSE_VALUES.has(String(value).trim().toLowerCase());
}

export class MetaInput extends LitElement {
    static properties = {
        label: { type: String },
        fieldId: { type: String, attribute: 'field-id' },
        helpText: { type: String, attribute: 'help-text' },
        spChars: { type: Boolean, attribute: 'sp-chars' },
        unlistedOption: { type: Boolean, attribute: 'unlisted-option' },
        required: { type: Boolean },
        requiredMarker: { type: String, attribute: 'required-marker' },
        inputClass: { type: String, attribute: 'input-class' },
        containerClass: { type: String, attribute: 'container-class' },
        containerId: { type: String, attribute: 'container-id' },
        value: { type: String },
        date: { type: Boolean },
        url: { type: Boolean },
        country: { type: Boolean },
        stateSelect: { type: Boolean, attribute: 'state-select' },
        placeholder: { type: String }
    };

    constructor() {
        super();
        this.label = '';
        this.fieldId = '';
        this.helpText = '';
        this.spChars = false;
        this.unlistedOption = false;
        this.required = false;
        this.requiredMarker = '*';
        this.inputClass = '';
        this.containerClass = 'standard-block';
        this.containerId = '';
        this.value = '';
        this.date = false;
        this.url = false;
        this.country = false;
        this.stateSelect = false;
        this.placeholder = '';
        this.style.display = 'block';
    }

    createRenderRoot() {
        return this;
    }

    handleInput(e) {
        this.value = e.target.value;
        this.dispatchEvent(new CustomEvent('input', {
            detail: { value: this.value },
            bubbles: true,
            composed: true
        }));
    }

    render() {
        const id = this.fieldId;
        const containerId = this.containerId || `${id}-block`;
        const marker = this.required ? html`<span class="required_marker">*</span>` : '';

        const spCharsLink = this.spChars
            ? html`
                <label for="${id}" class="insert insert_normal hidden" onClick='insertMenu("${id}")'>
                    Insert Special Characters
                </label>`
            : '';

        const help = this.helpText
            ? html`
                <label title="${this.helpText}">
                    <span class="question-mark text-uva-orange cursor-help ml-2">?</span>
                </label>`
            : '';

        const unlistedCheckbox = (this.unlistedOption && this.required)
            ? html`
                <div class="mt-2">
                    <span class="unlisted text-sm text-gray-600">Unlisted</span>
                    <input type="checkbox" id="${id}_listed" class="listed ml-2">
                </div>`
            : '';

        let inputContent;

        if (this.country) {
            inputContent = html`
            <select
                id="${id}"
                class="${this.inputClass} input-base"
                ?required=${this.required}
                .value=${this.value}
                @change=${this.handleInput}
            >
                <option value="" disabled selected hidden></option>
                ${countryList.map(c => html`<option value="${c.value}">${c.label}</option>`)}
            </select>
            `;
        } else if (this.stateSelect) {
            inputContent = html`
            <select
                id="${id}"
                class="${this.inputClass} input-base"
                ?required=${this.required}
                .value=${this.value}
                @change=${this.handleInput}
            >
                <option value="" disabled selected hidden></option>
                ${stateList.map(s => html`<option value="${s.value}">${s.label}</option>`)}
            </select>
            `;
        } else if (this.date) {
            inputContent = html`
            <edtf-date-input
                id="${id}"
                class="${this.inputClass}"
                ?required=${this.required}
                .value=${this.value}
                @input=${this.handleInput}
            ></edtf-date-input>
            `;
        } else {
            const inputElement = html`
            <input
              type="text"
              id="${id}"
              class="${this.inputClass} input-base"
              ?required=${this.required}
              .value=${this.value}
              placeholder="${this.placeholder}"
              @input=${this.handleInput}
            >
            `;

            inputContent = this.url
                ? html`<div class="flex items-center gap-2"><span>http://</span>${inputElement}</div>`
                : inputElement;
        }

        return html`
      <div id="${containerId}" class="standard-block">
        <label for="${id}" class="heading">${this.label}${marker}</label>
        ${spCharsLink}
        <div id="insert-${id}"></div>
        ${inputContent}
        ${help}
        ${unlistedCheckbox}
      </div>
    `;
    }

    // The original handleInput is replaced by the one above.
    // handleInput(e) {
    //     this.value = e.target.value;
    //     this.dispatchEvent(new CustomEvent('input', { detail: this.value }));
    // }

    handleInsertClick(id) {
        if (typeof window.insertMenu === 'function') {
            window.insertMenu(id);
        }
    }

    handleKeydown(e, id) {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            this.handleInsertClick(id);
        }
    }

    handleUnlistedChange(e) {
        const isUnlisted = e.target.checked;
        const input = this.querySelector(`#${this.fieldId}`);

        if (input) {
            if (isUnlisted) {
                input.disabled = true;
                input.value = ''; // Optional: clear value when unlisted
                input.classList.add('bg-gray-100', 'cursor-not-allowed');
                if (this.required) input.removeAttribute('required');
            } else {
                input.disabled = false;
                input.classList.remove('bg-gray-100', 'cursor-not-allowed');
                if (this.required) input.setAttribute('required', '');
            }
        }
    }
}

if (typeof window !== 'undefined' && !window.customElements.get('meta-input')) {
    window.customElements.define('meta-input', MetaInput);
}
