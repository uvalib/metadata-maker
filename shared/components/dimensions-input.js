import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@3.2.1/+esm';

export class DimensionsInput extends LitElement {
    static properties = {
        label: { type: String },
        required: { type: Boolean },
        helpText: { type: String, attribute: 'help-text' }
    };

    constructor() {
        super();
        this.label = 'Dimensions';
        this.required = false;
        this.helpText = '';
    }

    createRenderRoot() {
        return this;
    }

    render() {
        const marker = this.required ? html`<span class="required_marker">*</span>` : '';
        const help = this.helpText
            ? html`
                <label title="${this.helpText}">
                    <span class="question-mark text-uva-orange cursor-help ml-2">?</span>
                </label>`
            : '';

        return html`
            <div class="standard-block">
                <label class="heading">${this.label}${marker}</label>
                <div class="flex gap-4">
                    <input type="text" id="dimensions_text" class="input-base w-2/3" ?required=${this.required} placeholder="Value">
                    <select id="dimensions_units" class="input-base w-1/3" ?required=${this.required}>
                        <option value="" disabled selected hidden>Unit</option>
                        <option value="cm">cm</option>
                        <option value="in">in</option>
                        <option value="mm">mm</option>
                        <option value="ft">ft</option>
                    </select>
                </div>
                ${help}
            </div>
        `;
    }
}

if (typeof window !== 'undefined' && !window.customElements.get('dimensions-input')) {
    window.customElements.define('dimensions-input', DimensionsInput);
}
