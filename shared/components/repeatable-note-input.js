import { html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.2.1/+esm';
import { RepeatableFieldBase } from './repeatable-field-base.js';

export class RepeatableNoteInput extends RepeatableFieldBase {
    static properties = {
        ...RepeatableFieldBase.properties,
        heading: { type: String },
        fieldPrefix: { type: String, attribute: 'field-prefix' },
        required: { attribute: 'required' }
    };

    constructor() {
        super();
        this.heading = 'Note';
        this.fieldPrefix = 'note';
        this.required = null;
        this.addButtonLabel = '+';
        this.addButtonId = 'add-note';
        this.addButtonAriaLabel = 'Add another note';
        this.counterNames = ['noteCounter', 'nCounter'];
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
        const addControl = this.allowAdd ? this.renderAddControl() : nothing;

        return html`<div id="${this.fieldPrefix}-block" class="standard-block">
      <label for="${this.fieldPrefix}" class="heading">${this.heading}</label><br>
      ${this.renderPrimaryEntry(primaryKey)}
      ${addControl}
      ${additionalKeys.map((key) => this.renderAdditionalEntry(key))}
    </div>`;
    }

    renderPrimaryEntry(_key) {
        const fieldId = this.fieldPrefix;
        return html`<textarea id="${fieldId}" class="${this.fieldPrefix}-input"></textarea>`;
    }

    renderAdditionalEntry(key) {
        const fieldId = `${this.fieldPrefix}${key}`;
        return html`
      <div class="added-${this.fieldPrefix}">
        <textarea id="${fieldId}" class="${this.fieldPrefix}-input"></textarea>
      </div>
    `;
    }

    onEntryAdded(key, index) {
        const targetId = index === 0 ? this.fieldPrefix : `${this.fieldPrefix}${key}`;
        const textarea = this.querySelector(`#${targetId}`);
        if (textarea) {
            textarea.focus();
        }
    }

    get additionalEntryCount() {
        return Math.max(0, this.entries.length - this.initialEntryCount);
    }
}

if (typeof window !== 'undefined' && !window.customElements.get('repeatable-note-input')) {
    window.customElements.define('repeatable-note-input', RepeatableNoteInput);
}
