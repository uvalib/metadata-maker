import { LitElement, html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.2.1/+esm';

export class RepeatableFieldBase extends LitElement {
  static properties = {
    addButtonLabel: { type: String, attribute: 'add-button-label' },
    addButtonId: { type: String, attribute: 'add-button-id' },
    addButtonAriaLabel: { type: String, attribute: 'add-button-aria-label' },
    allowAdd: { type: Boolean, attribute: 'allow-add', reflect: true },
    entries: { state: true }
  };

  constructor() {
    super();
    this.addButtonLabel = '+';
    this.addButtonId = '';
    this.addButtonAriaLabel = '';
    this.allowAdd = true;
    this.entries = this.createInitialKeys();
    this.initialEntryCount = this.entries.length;
    this.counterNames = [];
    this._onFormReset = this._handleFormReset.bind(this);
  }

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    const form = this.closest('form');
    if (form) {
      form.addEventListener('reset', this._onFormReset);
    }
    this.updateGlobalCounters();
  }

  disconnectedCallback() {
    const form = this.closest('form');
    if (form) {
      form.removeEventListener('reset', this._onFormReset);
    }
    super.disconnectedCallback();
  }

  createInitialKeys() {
    return [0];
  }

  getNextEntryKey() {
    return this.entries.length;
  }

  async addEntry(event) {
    if (event) {
      event.preventDefault();
    }
    const nextKey = this.getNextEntryKey();
    this.entries = [...this.entries, nextKey];
    await this.updateComplete;
    this.onEntryAdded(nextKey, this.entries.length - 1);
  }

  onEntryAdded(_key, _index) {
    // Subclasses can override to focus the newly-added entry or perform other work.
  }

  renderEntry(_key, _isFirst) {
    throw new Error('RepeatableFieldBase.renderEntry must be implemented by subclasses');
  }

  renderContainer(entriesContent, addControl) {
    return html`${entriesContent}${addControl}`;
  }

  renderAddControl() {
    if (!this.allowAdd) {
      return html``;
    }
    const ariaLabel = this.addButtonAriaLabel || this.addButtonLabel;
    const idValue = this.addButtonId && this.addButtonId.length > 0 ? this.addButtonId : nothing;
    const ariaValue = ariaLabel && ariaLabel.length > 0 ? ariaLabel : nothing;
    return html`<input
      type="button"
      value="${this.addButtonLabel}"
      id=${idValue}
      aria-label=${ariaValue}
      @click=${(event) => this.addEntry(event)}
    >`;
  }

  render() {
    const entriesContent = this.entries.map((key, index) => this.renderEntry(key, index === 0));
    const addControl = this.renderAddControl();
    return this.renderContainer(entriesContent, addControl);
  }

  updated(changed) {
    if (changed.has('entries')) {
      this.updateGlobalCounters();
      this.upgradeInsertLabels();
    }
  }

  updateGlobalCounters() {
    if (!Array.isArray(this.counterNames) || this.counterNames.length === 0) {
      return;
    }
    const additionalCount = Math.max(0, this.entries.length - this.initialEntryCount);
    this.counterNames.forEach((name) => {
      window[name] = additionalCount;
    });
  }

  upgradeInsertLabels() {
    const upgrade = window.requestInsertLabelUpgrade || window.scheduleInsertLabelUpgrade || window.upgradeInsertLabels;
    if (typeof upgrade === 'function') {
      upgrade(this);
    }
  }

  _handleFormReset() {
    this.entries = this.createInitialKeys();
  }
}
