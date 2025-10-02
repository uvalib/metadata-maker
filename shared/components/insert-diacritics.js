import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import { SPECIAL_CHARACTERS } from '../data/special-characters.js';

const INSERT_LABEL_SELECTOR = 'label.insert';

function getInsertTarget(label) {
  if (!label) {
    return null;
  }
  const forAttr = label.getAttribute('for');
  if (forAttr && forAttr.trim().length > 0) {
    return forAttr.trim();
  }
  const onClick = label.getAttribute('onClick') || label.getAttribute('onclick');
  if (onClick) {
    const match = onClick.match(/insertMenu\("([^"\\]+)"\)/);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

function createInsertComponent(target, className, menuClasses, doc) {
  const element = (doc || document).createElement('insert-diacritics');
  element.setAttribute('target', target);
  if (className && className.length > 0) {
    element.setAttribute('class', className);
  }
  if (menuClasses && menuClasses.length > 0) {
    element.setAttribute('menu-classes', menuClasses);
  }
  return element;
}

function upgradeInsertLabel(label, doc) {
  if (!label || !label.parentNode) {
    return;
  }

  const target = getInsertTarget(label);
  if (!target) {
    return;
  }

  const documentRef = doc || label.ownerDocument || document;
  const menuContainer = documentRef.getElementById('insert-' + target);
  const menuClasses = menuContainer ? (menuContainer.getAttribute('class') || '') : '';
  const className = label.getAttribute('class') || '';
  const component = createInsertComponent(target, className, menuClasses, documentRef);

  label.insertAdjacentElement('beforebegin', component);

  if (menuContainer && menuContainer.parentNode) {
    menuContainer.parentNode.removeChild(menuContainer);
  }

  if (label.parentNode) {
    label.parentNode.removeChild(label);
  }
}

function upgradeInsertLabels(root) {
  const scope = root && typeof root.querySelectorAll === 'function' ? root : document;
  if (!scope) {
    return;
  }
  const labels = scope.querySelectorAll ? scope.querySelectorAll(INSERT_LABEL_SELECTOR) : [];
  if (!labels || labels.length === 0) {
    return;
  }

  const doc = scope.ownerDocument || document;
  for (let i = 0; i < labels.length; i++) {
    upgradeInsertLabel(labels[i], doc);
  }
}

function scheduleInsertLabelUpgrade(root) {
  const scope = root || document;
  upgradeInsertLabels(scope);

  if (typeof window !== 'undefined' && window.customElements && typeof window.customElements.whenDefined === 'function') {
    window.customElements.whenDefined('insert-diacritics').then(function() {
      upgradeInsertLabels(scope);
    }).catch(function(error) {
      console.warn('[insert-diacritics] Failed waiting for component definition; applying upgrade immediately.', error);
      upgradeInsertLabels(scope);
    });
  } else {
    upgradeInsertLabels(scope);
  }
}

function startAutoUpgrade() {
  if (startAutoUpgrade._started || typeof document === 'undefined') {
    return;
  }
  startAutoUpgrade._started = true;

  scheduleInsertLabelUpgrade(document);

  if (typeof MutationObserver === 'function' && document.body) {
    const observer = new MutationObserver(function(mutations) {
      for (let i = 0; i < mutations.length; i++) {
        const mutation = mutations[i];
        for (let j = 0; j < mutation.addedNodes.length; j++) {
          const node = mutation.addedNodes[j];
          if (!node || node.nodeType !== 1) {
            continue;
          }

          if (typeof node.matches === 'function' && node.matches(INSERT_LABEL_SELECTOR)) {
            upgradeInsertLabels(node.parentNode || document);
            continue;
          }

          if (typeof node.querySelectorAll === 'function') {
            const nested = node.querySelectorAll(INSERT_LABEL_SELECTOR);
            if (nested && nested.length > 0) {
              upgradeInsertLabels(node);
            }
          }
        }
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }
}

if (typeof window !== 'undefined') {
  window.upgradeInsertLabels = upgradeInsertLabels;
  window.scheduleInsertLabelUpgrade = scheduleInsertLabelUpgrade;
}

if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startAutoUpgrade, { once: true });
  } else {
    startAutoUpgrade();
  }
}

export class InsertDiacritics extends LitElement {
  static properties = {
    target: { type: String },
    label: { type: String },
    menuClasses: { type: String, attribute: 'menu-classes' },
    open: { state: true }
  };

  static RECENT_STORAGE_KEY = 'insert-diacritics-recent';
  static RECENT_LIMIT = 12;

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
    this._characterMap = new Map();
    if (Array.isArray(this._characters)) {
      for (const entry of this._characters) {
        if (entry && typeof entry.code === 'string') {
          this._characterMap.set(entry.code.toUpperCase(), entry);
        }
      }
    }
    this._recentCodes = this._loadRecentCodes();
    this._recentEntries = this._buildRecentEntries();
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

    this._refreshRecentsFromStorage();

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

  _refreshRecentsFromStorage() {
    const latest = this._loadRecentCodes();
    if (!Array.isArray(latest)) {
      return;
    }

    const prev = Array.isArray(this._recentCodes) ? this._recentCodes : [];
    const changed = latest.length !== prev.length || latest.some((code, index) => prev[index] !== code);
    if (changed) {
      this._recentCodes = latest;
      this._recentEntries = this._buildRecentEntries();
      this.requestUpdate();
    } else if (!Array.isArray(this._recentEntries) || this._recentEntries.length !== latest.length) {
      this._recentEntries = this._buildRecentEntries();
      this.requestUpdate();
    }
  }

  _rememberRecent(code) {
    if (!code) {
      return;
    }

    const normalized = String(code).toUpperCase();
    const existing = Array.isArray(this._recentCodes) ? this._recentCodes : [];
    const next = [normalized, ...existing.filter(stored => stored !== normalized)];
    const limited = next.slice(0, InsertDiacritics.RECENT_LIMIT);

    const changed = limited.length !== existing.length || limited.some((value, index) => existing[index] !== value);
    if (!changed) {
      return;
    }

    this._recentCodes = limited;
    this._recentEntries = this._buildRecentEntries();
    this._saveRecentCodes();
    this.requestUpdate();
  }

  _buildRecentEntries() {
    if (!Array.isArray(this._recentCodes)) {
      return [];
    }
    const results = [];
    const seen = new Set();
    for (const code of this._recentCodes) {
      const normalized = typeof code === 'string' ? code.toUpperCase() : '';
      if (!normalized || seen.has(normalized)) {
        continue;
      }
      const entry = this._characterMap.get(normalized);
      if (entry) {
        results.push(entry);
        seen.add(normalized);
      }
    }
    return results;
  }

  _loadRecentCodes() {
    const storage = this._getLocalStorage();
    if (!storage) {
      return [];
    }
    try {
      const raw = storage.getItem(InsertDiacritics.RECENT_STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) {
        return [];
      }
      return parsed
        .filter(code => typeof code === 'string')
        .map(code => code.toUpperCase())
        .slice(0, InsertDiacritics.RECENT_LIMIT);
    } catch (err) {
      console.warn('[insert-diacritics] Unable to read recent characters from localStorage.', err);
      return [];
    }
  }

  _saveRecentCodes() {
    const storage = this._getLocalStorage();
    if (!storage) {
      return;
    }
    try {
      storage.setItem(InsertDiacritics.RECENT_STORAGE_KEY, JSON.stringify(this._recentCodes));
    } catch (err) {
      console.warn('[insert-diacritics] Unable to store recent characters in localStorage.', err);
    }
  }

  _getLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) {
      return null;
    }
    try {
      return window.localStorage;
    } catch (err) {
      console.warn('[insert-diacritics] localStorage is not accessible.', err);
      return null;
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
    this._rememberRecent(code);
    this.closeMenu();
  }

  renderMenu() {
    if (!this.open) {
      return null;
    }

    const entries = Array.isArray(this._characters) ? this._characters : [];
    const hasEntries = entries.length > 0;
    const recentEntries = Array.isArray(this._recentEntries) ? this._recentEntries : [];
    const hasRecents = recentEntries.length > 0;

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

        .diacritics-recents {
          background: #f3f4f6;
          border-radius: 6px;
          padding: 12px;
          margin-bottom: 16px;
        }

        .diacritics-recents-header {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 0.95rem;
          font-weight: 600;
          margin: 0;
        }

        .diacritics-recents-list {
          margin-top: 8px;
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
        }

        .diacritics-recents-empty-copy {
          margin-top: 8px;
          font-size: 0.9rem;
          color: #4d4d4d;
        }

        .diacritics-recents button {
          min-width: 44px;
          padding: 6px 10px;
          border: 1px solid #bfc6ce;
          border-radius: 4px;
          background: #fff;
          cursor: pointer;
          font-size: 1.05rem;
        }

        .diacritics-recents button:hover,
        .diacritics-recents button:focus {
          outline: none;
          border-color: #005a9c;
          box-shadow: 0 0 0 2px rgba(0, 90, 156, 0.2);
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
          <section class="diacritics-recents" aria-label="Recently used characters">
            <div class="diacritics-recents-header">Recently used</div>
            ${hasRecents ? html`
              <div class="diacritics-recents-list">
                ${recentEntries.map(entry => html`
                  <button
                    type="button"
                    class="${['diacritics', 'diacritics-button', 'diacritics-recent-button', entry.classes || ''].filter(Boolean).join(' ')}"
                    value="${entry.char}"
                    title="${entry.name} (U+${entry.code})"
                    aria-label="${entry.name}"
                    @click=${event => this.handleInsert(event, entry.code)}
                  >${entry.char}</button>
                `)}
              </div>
            ` : html`
              <div class="diacritics-recents-empty-copy">Recently used characters will appear here.</div>
            `}
          </section>
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
