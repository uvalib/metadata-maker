import { LitElement, html } from 'https://cdn.jsdelivr.net/npm/lit@3.2.1/+esm';

const VERSION_DETAILS = {
  dataset: { id: 'dataset', label: 'Data Sets', href: '/dataset/' },
  ebooks: { id: 'ebooks', label: 'E-Books', href: '/ebooks/' },
  govdocs: { id: 'govdocs', label: 'Government Documents', href: '/govdocs/' },
  archives: { id: 'archives', label: 'Archival Collections', href: '/archives/' },
  collections: { id: 'collections', label: 'Collection Components', href: '/collections/' },
  maps: { id: 'maps', label: 'Maps', href: '/maps/' },
  microfilms: { id: 'microfilms', label: 'Microfilms', href: '/microfilms/' },
  mixedMedia: { id: 'mixedMedia', label: 'Mixed Media', href: '/mixedMedia/' },
  monographs: { id: 'monographs', label: 'Monographs', href: '/' },
  monoviaf: { id: 'monoviaf', label: 'Monograph (LD)', href: '/monoviaf/' },
  scores: { id: 'scores', label: 'Notated Music', href: '/scores/' },
  serials: { id: 'serials', label: 'Serials', href: '/serials/' },
  theses: { id: 'theses', label: 'Theses & Dissertations', href: '/theses/' }
};

const DEFAULT_VERSION_ORDER = [
  'dataset',
  'ebooks',
  'govdocs',
  'archives',
  'collections',
  'maps',
  'mixedMedia',
  'monographs',
  'monoviaf',
  'scores',
  'serials',
  'theses'
];

const VERSION_LIST_CONVERTER = {
  fromAttribute(value) {
    if (value == null) {
      return undefined;
    }
    return value
      .split(',')
      .map((part) => part.trim())
      .filter(Boolean);
  }
};

class TopNavigation extends LitElement {
  static properties = {
    currentVersion: { type: String, attribute: 'current-version' },
    versionLabel: { type: String, attribute: 'version-label' },
    versionIds: { attribute: 'versions', converter: VERSION_LIST_CONVERTER },
    showInstitution: {
      attribute: 'show-institution',
      converter: {
        fromAttribute(value) {
          if (value === null) {
            return true;
          }
          return value !== 'false';
        }
      }
    },
    versionMenuOpen: { state: true },
    institutionMenuOpen: { state: true }
  };

  constructor() {
    super();
    this.currentVersion = 'monographs';
    this.versionLabel = 'Monographs';
    this.versionIds = undefined; // Will use DEFAULT_VERSION_ORDER as fallback
    this.showInstitution = true;
    this.versionMenuOpen = false;
    this.institutionMenuOpen = false;
    this._popstateHandler = this._handlePopState.bind(this);
  }

  createRenderRoot() {
    return this;
  }

  connectedCallback() {
    super.connectedCallback();
    window.addEventListener('popstate', this._popstateHandler);
  }

  disconnectedCallback() {
    window.removeEventListener('popstate', this._popstateHandler);
    super.disconnectedCallback();
  }

  firstUpdated() {
    this._ensureVersionInList();
    this.applyParametersToLinks();
    this.setUpInstitutionFromQuery();
  }

  updated(changedProps) {
    if (changedProps.has('versionIds')) {
      this._ensureVersionInList();
    }
    this.applyParametersToLinks();
  }

  render() {
    const versionMenuClass = this.versionMenuOpen ? '' : 'hidden';
    const institutionMenuClass = this.institutionMenuOpen ? '' : 'hidden';

    return html`
      <div id="top_navigation">
        <slot name="leading"></slot>
        <div id="version_title" class="noselect">
          <div id="version_static">Metadata Maker for</div>
          <div id="version_selector" @click=${this.toggleVersionMenu}>
            <div id="version_name" value=${this.currentVersion}>${this.versionLabel}</div>
            <img src=${this.versionMenuOpen ? '/arrow1.svg' : '/arrow2.svg'} id="arrow" alt="Toggle version list">
            <div id="version_menu" class=${versionMenuClass}>
              <ul id="version_menu_content">
                ${this.displayedVersionIds.map((versionId) => this._renderVersionItem(versionId))}
              </ul>
            </div>
          </div>
        </div>
        ${this.showInstitution
          ? html`
              <div id="institution" class="noselect" @click=${this.toggleInstitutionMenu}>
                <div id="institution_content">
                  <div id="institution_text">Creating record at:</div>
                  <div id="institution_name"></div>
                </div>
                <img src=${this.institutionMenuOpen ? '/arrow1.svg' : '/arrow2.svg'} id="institution_arrow" alt="Toggle institution form">
              </div>
            `
          : null}
      </div>
      ${this.showInstitution
        ? html`
            <form id="institution_menu" class=${institutionMenuClass} @submit=${this.handleInstitutionSubmit}>
              <label for="marc_code">MARC code or the name of the organization</label><br>
              <input type="text" id="marc_code" data-default-placeholder="ViU" placeholder="ViU"><br>
              <label for="physicalLocation">Physical Location</label><br>
              <input type="text" id="physicalLocation" data-default-placeholder="University of Virginia. Library" placeholder="University of Virginia. Library"><br>
              <label for="recordContentSource">Record Content Source</label><br>
              <input type="text" id="recordContentSource" data-default-placeholder="ViU" placeholder="ViU"><br>
              <label for="lcno">Organization's LC Authority Number</label><br>
              <input type="text" id="lcno" data-default-placeholder="n79127895" placeholder="n79127895"><br>
              <label for="org_name">Organization's Name</label><br>
              <input type="text" id="org_name" data-default-placeholder="University of Virginia" placeholder="University of Virginia"><br>
              <input type="submit" id="submit_institution_info" value="Change Institution">
            </form>
          `
        : null}
    `;
  }

  get displayedVersionIds() {
    const provided = Array.isArray(this.versionIds) && this.versionIds.length > 0
      ? this.versionIds
      : DEFAULT_VERSION_ORDER;
    const unique = [];
    const seen = new Set();
    provided.forEach((id) => {
      if (VERSION_DETAILS[id] && !seen.has(id)) {
        unique.push(id);
        seen.add(id);
      }
    });
    if (!seen.has(this.currentVersion) && VERSION_DETAILS[this.currentVersion]) {
      unique.unshift(this.currentVersion);
    }
    return unique;
  }

  toggleVersionMenu(event) {
    event?.stopPropagation?.();
    this.versionMenuOpen = !this.versionMenuOpen;
  }

  toggleInstitutionMenu(event) {
    if (!this.showInstitution) {
      return;
    }
    event?.stopPropagation?.();
    this.institutionMenuOpen = !this.institutionMenuOpen;
  }

  handleInstitutionSubmit(event) {
    event.preventDefault();
    const params = new URLSearchParams(window.location.search);
    const fieldMap = [
      { id: 'marc_code', key: 'marc' },
      { id: 'physicalLocation', key: 'physicalLocation' },
      { id: 'recordContentSource', key: 'recordContentSource' },
      { id: 'lcno', key: 'lcn' },
      { id: 'org_name', key: 'n' }
    ];

    fieldMap.forEach(({ id, key }) => {
      const input = this.querySelector('#' + id);
      if (!input) {
        return;
      }
      const value = (input.value || '').trim();
      if (value) {
        params.set(key, value);
        input.placeholder = value;
        input.value = '';
      }
    });

    const search = params.toString();
    const newUrl = search ? `${window.location.pathname}?${search}` : window.location.pathname;
    window.history.replaceState(null, '', newUrl);
    this.applyParametersToLinks();
    this.setUpInstitutionFromQuery();
  }

  applyParametersToLinks() {
    const search = window.location.search || '';
    const anchors = this.querySelectorAll('a.dropdown');
    anchors.forEach((anchor) => {
      const baseHref = anchor.dataset.baseHref || anchor.getAttribute('href') || '';
      anchor.dataset.baseHref = baseHref.split('?')[0];
      const hrefBase = anchor.dataset.baseHref;
      anchor.setAttribute('href', hrefBase + search);
    });
  }

  setUpInstitutionFromQuery() {
    if (!this.showInstitution) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const fallbackName = 'University of Virginia';
    const fieldDefaults = [
      { id: 'marc_code', key: 'marc' },
      { id: 'physicalLocation', key: 'physicalLocation' },
      { id: 'recordContentSource', key: 'recordContentSource' },
      { id: 'lcno', key: 'lcn' }
    ];

    fieldDefaults.forEach(({ id, key }) => {
      const input = this.querySelector('#' + id);
      if (!input) {
        return;
      }
      const value = params.get(key);
      if (value) {
        input.placeholder = value;
      } else {
        const defaultPlaceholder = input.dataset.defaultPlaceholder || '';
        input.placeholder = defaultPlaceholder;
      }
    });

    const nameInput = this.querySelector('#org_name');
    const institutionDisplay = this.querySelector('#institution_name');
    const nameValue = params.get('n');
    if (nameInput) {
      if (nameValue) {
        nameInput.placeholder = nameValue;
      } else {
        nameInput.placeholder = nameInput.dataset.defaultPlaceholder || fallbackName;
      }
    }
    if (institutionDisplay) {
      institutionDisplay.textContent = nameValue || fallbackName;
    }
  }

  _handlePopState() {
    this.applyParametersToLinks();
    this.setUpInstitutionFromQuery();
  }

  _ensureVersionInList() {
    if (!Array.isArray(this.versionIds) || this.versionIds.length === 0) {
      this.versionIds = DEFAULT_VERSION_ORDER.slice();
    }
  }

  _renderVersionItem(versionId) {
    const details = VERSION_DETAILS[versionId];
    if (!details) {
      return null;
    }
    const isCurrent = versionId === this.currentVersion;
    const listItem = html`
      <li id=${details.id} class=${isCurrent ? 'current_version' : ''}>
        ${details.label}
        ${isCurrent ? html`<span id="checkmark">&#10003;</span>` : null}
      </li>
    `;
    const href = details.href;
    if (isCurrent) {
      return html`<a class="dropdown" data-base-href=${href} href=${href} @click=${this._preventNavigation}>${listItem}</a>`;
    }
    return html`<a class="dropdown" data-base-href=${href} href=${href}>${listItem}</a>`;
  }

  _preventNavigation(event) {
    event.preventDefault();
  }
}

customElements.define('uv-top-navigation', TopNavigation);

function getTopNavigationInstance() {
  return document.querySelector('uv-top-navigation');
}

window.pushParametersToLinks = function pushParametersToLinks() {
  const nav = getTopNavigationInstance();
  if (nav) {
    nav.applyParametersToLinks();
  }
};

window.setUpInstitution = function setUpInstitution() {
  const nav = getTopNavigationInstance();
  if (nav) {
    nav.setUpInstitutionFromQuery();
  }
};
