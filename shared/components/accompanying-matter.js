import { LitElement, html, css } from 'https://cdn.jsdelivr.net/npm/lit@3.2.1/+esm';
import { accompanyingMatterList } from '../accompanying-matter-list.js';

export class AccompanyingMatter extends LitElement {
    static styles = css`
        :host {
            display: block;
        }
        .standard-block {
            margin-bottom: 1rem;
        }
        .heading {
            font-weight: bold;
            display: block;
            margin-bottom: 0.5rem;
        }
        .note {
            font-size: 10px;
            font-weight: normal;
        }
        .checkbox-group {
            display: flex;
            flex-direction: column;
            gap: 0.25rem;
        }
        .checkbox-item {
            display: flex;
            align-items: center;
            gap: 0.5rem;
        }
    `;

    render() {
        return html`
            <div id="accompanying-matter-block" class="standard-block">
                <label for="accompanying-matter-block" class="heading">
                    Accompanying matter <span class="note">(choose up to 6 values)</span>
                </label>
                <div class="checkbox-group">
                    ${accompanyingMatterList.map(item => html`
                        <div class="checkbox-item">
                            <input type="checkbox" 
                                   class="accompanying-matter" 
                                   id="${item.id}" 
                                   value="${item.value}">
                            <label for="${item.id}">${item.label}</label>
                        </div>
                    `)}
                </div>
            </div>
        `;
    }
}

customElements.define('accompanying-matter', AccompanyingMatter);
