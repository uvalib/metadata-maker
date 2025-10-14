import { LitElement, html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.1.0/+esm';
import './originator-personal-input.js';
import './originator-corporate-input.js';

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

export class OriginatorInput extends LitElement {
  static properties = {
    required: { attribute: 'required', reflect: true }
  };

  constructor() {
    super();
    this.required = null;
    this.hiddenInput = null;
  }

  createRenderRoot() {
    return this;
  }

  get isRequired() {
    return normalizeBoolean(this.required, false);
  }

  firstUpdated() {
    this.hiddenInput = this.querySelector('.originator-required-flag');
    const revalidate = () => {
      this.updateValidity();
    };
    this.addEventListener('input', revalidate, true);
    this.addEventListener('change', revalidate, true);
    this.updateValidity();
  }

  render() {
    const marker = this.isRequired ? html`<span class="required_marker">*</span>` : nothing;
    return html`
      <div id="originator-block" class="standard-block">
        <label class="heading">Originator${marker}</label>
        <input type="text" class="originator-required-flag" aria-hidden="true" tabindex="-1" style="position:absolute;opacity:0;width:1px;height:1px;border:0;padding:0;margin:0;">
        <originator-personal-input></originator-personal-input>
        <originator-corporate-input></originator-corporate-input>
      </div>
    `;
  }

  getValue() {
    const personalComponent = this.querySelector('originator-personal-input');
    const corporateComponent = this.querySelector('originator-corporate-input');
    const personalOriginators = personalComponent && typeof personalComponent.getEntries === 'function'
      ? personalComponent.getEntries()
      : [];
    const corporateOriginators = corporateComponent && typeof corporateComponent.getEntries === 'function'
      ? corporateComponent.getEntries()
      : [];

    return { personalOriginators, corporateOriginators };
  }

  updateValidity() {
    const hidden = this.hiddenInput;
    if (!hidden) {
      return true;
    }

    const { personalOriginators, corporateOriginators } = this.getValue();
    const hasOriginator = personalOriginators.length > 0 || corporateOriginators.length > 0;
    hidden.value = hasOriginator ? 'valid' : '';
    return !this.isRequired || hasOriginator;
  }

  validate() {
    const hidden = this.hiddenInput;
    const valid = this.updateValidity();
    if (!valid && hidden) {
      hidden.setCustomValidity('Please provide at least one originator.');
      try {
        hidden.focus({ preventScroll: true });
      } catch (e) {
        // focus may fail silently for hidden inputs
      }
      hidden.reportValidity();
      hidden.setCustomValidity('');
      const personalField = this.querySelector('.originator-personal-family');
      if (personalField && typeof personalField.focus === 'function') {
        try {
          personalField.focus({ preventScroll: false });
        } catch (e) {
          personalField.focus();
        }
      }
    }
    return valid;
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('originator-input')) {
  window.customElements.define('originator-input', OriginatorInput);
}
