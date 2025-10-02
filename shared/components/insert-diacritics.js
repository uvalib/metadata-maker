import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { SPECIAL_CHARACTERS } from '../data/special-characters.js';

export class InsertDiacritics extends LitElement {
  static properties = {
    target: { type: String },
    label: { type: String },
    menuClasses: { type: String, attribute: 'menu-classes' },
    open: { state: true }
  };

  static activeInstance = null;

  constructor() {
    super();
    this.label = 'Insert Special Characters';
    this.open = false;
    this.menuClasses = '';
    this._selectionStart = 0;
    this._selectionEnd = 0;
    this._targetEl = null;
    this._boundOutsideClick = this._handleDocumentClick.bind(this);
    this._boundKeydown = this._handleKeydown.bind(this);
    this._previousFocus = null;
    this._previousBodyOverflow = null;
    this._characters = SPECIAL_CHARACTERS;
    this._hoverName = '';
  }

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.style.display) {
      this.style.display = 'inline-block';
    }
  }

  disconnectedCallback() {
    super.disconnectedCallback();
    this.closeMenu();
  }

  get targetElement() {
    if (this._targetEl && this._targetEl.id === this.target) {
      return this._targetEl;
    }
    this._targetEl = this.target ? document.getElementById(this.target) : null;
    return this._targetEl;
  }

  get menuClassList() {
    const classes = ['diacritics-popup'];
    if (this.menuClasses) {
      this.menuClasses.split(' ').filter(Boolean).forEach(cls => classes.push(cls));
    }
    return classes.join(' ');
  }

  onTriggerClick(event) {
    event.preventDefault();
    event.stopPropagation();
    if (this.open) {
      this.closeMenu();
    } else {
      this.openMenu();
    }
  }

  openMenu() {
    const target = this.targetElement;
    if (!target) {
      console.warn(`[insert-diacritics] Target element with id "${this.target}" not found.`);
      return;
    }

    if (InsertDiacritics.activeInstance && InsertDiacritics.activeInstance !== this) {
      InsertDiacritics.activeInstance.closeMenu();
    }

    if (typeof target.focus === 'function') {
      target.focus({ preventScroll: true });
    }

    const value = typeof target.value === 'string' ? target.value : '';
    const start = typeof target.selectionStart === 'number' ? target.selectionStart : value.length;
    const end = typeof target.selectionEnd === 'number' ? target.selectionEnd : value.length;

    this._selectionStart = start;
    this._selectionEnd = end;
    this._previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (document && document.body) {
      this._previousBodyOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }

    this.open = true;
    InsertDiacritics.activeInstance = this;

    document.addEventListener('click', this._boundOutsideClick);
    document.addEventListener('keydown', this._boundKeydown, true);

    if (typeof this.updateComplete?.then === 'function') {
      this.updateComplete.then(() => this._focusFirstButton());
    }
  }

  closeMenu() {
    if (!this.open) {
      return;
    }

    this.open = false;
    if (InsertDiacritics.activeInstance === this) {
      InsertDiacritics.activeInstance = null;
    }
    document.removeEventListener('click', this._boundOutsideClick);
    document.removeEventListener('keydown', this._boundKeydown, true);

    if (document && document.body && this._previousBodyOverflow !== null) {
      document.body.style.overflow = this._previousBodyOverflow;
      this._previousBodyOverflow = null;
    }

    if (this._previousFocus && typeof this._previousFocus.focus === 'function') {
      try {
        this._previousFocus.focus({ preventScroll: true });
      } catch (err) {
        this._previousFocus.focus();
      }
    }

    if (this._hoverName) {
      this._hoverName = '';
      this.requestUpdate();
    }
  }

  _handleDocumentClick(event) {
    if (!this.contains(event.target)) {
      this.closeMenu();
    }
  }

  _handleKeydown(event) {
    if (event.key === 'Escape' || event.key === 'Esc') {
      this.closeMenu();
    }
  }

  _focusFirstButton() {
    const firstButton = this.querySelector('.diacritics-grid button');
    if (firstButton && typeof firstButton.focus === 'function') {
      try {
        firstButton.focus({ preventScroll: true });
      } catch (err) {
        firstButton.focus();
      }
    }
  }

  _setHoverDetail(entry) {
    const label = entry ? `${entry.name} (U+${entry.code})` : '';
    if (this._hoverName !== label) {
      this._hoverName = label;
      this.requestUpdate();
    }
  }

  _clearHoverDetail() {
    if (this._hoverName) {
      this._hoverName = '';
      this.requestUpdate();
    }
  }

  handleInsert(event, code) {
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    const target = this.targetElement;
    if (!target) {
      this.closeMenu();
      return;
    }

    const insertValue = String.fromCodePoint(parseInt(code, 16));
    const value = typeof target.value === 'string' ? target.value : '';
    const start = this._selectionStart ?? value.length;
    const end = this._selectionEnd ?? value.length;
    const before = value.substring(0, start);
    const after = value.substring(end);

    target.value = before + insertValue + after;

    const caret = start + insertValue.length;
    if (typeof target.setSelectionRange === 'function') {
      target.setSelectionRange(caret, caret);
    }

    if (typeof target.dispatchEvent === 'function') {
      target.dispatchEvent(new Event('input', { bubbles: true }));
      target.dispatchEvent(new Event('change', { bubbles: true }));
    }

    try {
      target.focus({ preventScroll: true });
    } catch (err) {
      target.focus();
    }
    this._selectionStart = caret;
    this._selectionEnd = caret;
    this.closeMenu();
  }

  renderMenu() {
    if (!this.open) {
      return null;
    }

  const entries = Array.isArray(this._characters) ? this._characters : [];
  const hasEntries = entries.length > 0;

    return html`
      <style>
        .diacritics-modal-overlay {
          position: fixed;
          inset: 0;
          z-index: 10000;
        }

        .diacritics-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.45);
        }

        .diacritics-modal-overlay {
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .diacritics-modal {
          background: #fff;
          border-radius: 8px;
          box-shadow: 0 12px 32px rgba(0, 0, 0, 0.35);
          padding: 20px 24px;
          max-height: 80vh;
          width: min(520px, calc(100vw - 32px));
          overflow-y: auto;
          overflow-x: hidden;
        }

        .diacritics-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 16px;
          gap: 16px;
        }

        .diacritics-header h2 {
          margin: 0;
          font-size: 1.25rem;
          font-weight: 600;
        }

        .diacritics-close {
          background: none;
          border: none;
          font-size: 1rem;
          cursor: pointer;
          padding: 4px 8px;
        }

        .diacritics-hover {
          margin-bottom: 16px;
          font-size: 0.95rem;
          color: #333;
          min-height: 1.2em;
        }

        .diacritics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(44px, 1fr));
          gap: 6px;
        }

        .diacritics-grid button {
          width: 100%;
          min-width: 0;
          padding: 8px 4px;
          border: 1px solid #ccc;
          border-radius: 4px;
          background: #fff;
          cursor: pointer;
          font-size: 1.1rem;
        }

        .diacritics-grid button:hover,
        .diacritics-grid button:focus {
          outline: none;
          border-color: #005a9c;
          box-shadow: 0 0 0 2px rgba(0, 90, 156, 0.2);
        }

        .diacritics-loading {
          font-size: 0.95rem;
          color: #555;
          text-align: center;
        }
      </style>
      <div class="diacritics-modal-overlay" role="presentation">
        <div class="diacritics-backdrop" @click=${() => this.closeMenu()}></div>
        <div
          id="insert-popup"
          class="${this.menuClassList} diacritics-modal"
          role="dialog"
          aria-modal="true"
          aria-label="Insert special characters picker"
        >
          <div class="diacritics-header">
            <h2>Insert Special Characters</h2>
            <button type="button" class="diacritics-close" @click=${() => this.closeMenu()} aria-label="Close special characters picker">✕</button>
          </div>
          <div class="diacritics-hover" aria-live="polite">
            ${this._hoverName || 'Hover or focus a character to see its name.'}
          </div>
          ${hasEntries ? html`
            <div class="diacritics-grid">
              ${entries.map(entry => html`
                <button
                  type="button"
                  class="${['diacritics', 'diacritics-button', entry.classes || ''].filter(Boolean).join(' ')}"
                  value="${entry.char}"
                  title="${entry.name} (U+${entry.code})"
                  aria-label="${entry.name}"
                  @click=${event => this.handleInsert(event, entry.code)}
                  @mouseenter=${() => this._setHoverDetail(entry)}
                  @mouseleave=${() => this._clearHoverDetail()}
                  @focus=${() => this._setHoverDetail(entry)}
                  @blur=${() => this._clearHoverDetail()}
                >${entry.char}</button>
              `)}
            </div>
          ` : html`
            <div class="diacritics-loading">Loading special characters…</div>
          `}
        </div>
      </div>
    `;
  }

  render() {
    return html`
      <button
        type="button"
        class="diacritics-trigger"
        aria-haspopup="true"
        aria-expanded="${this.open ? 'true' : 'false'}"
        style="background:none;border:none;padding:0;font:inherit;color:inherit;cursor:pointer;"
        @click=${this.onTriggerClick}
      >${this.label}</button>
      ${this.renderMenu()}
    `;
  }
}

customElements.define('insert-diacritics', InsertDiacritics);

if (typeof window !== 'undefined' && !window.insertMenu) {
  const escapeAttributeValue = value => {
    if (typeof value !== 'string') {
      return '';
    }
    return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
  };

  window.insertMenu = function(field) {
    if (typeof window.upgradeInsertLabels === 'function') {
      try {
        window.upgradeInsertLabels(document);
      } catch (err) {
        console.warn('[insert-diacritics] upgradeInsertLabels failed during legacy insertMenu bridge.', err);
      }
    }

    const selector = `insert-diacritics[target="${escapeAttributeValue(field)}"]`;
    const picker = document.querySelector(selector);

    if (picker && typeof picker.openMenu === 'function') {
      picker.openMenu();
    } else {
      console.warn(`[insert-diacritics] Unable to locate picker for target "${field}".`);
    }
  };
}
