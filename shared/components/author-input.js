import { html, nothing } from 'https://cdn.jsdelivr.net/npm/lit@3.2.1/+esm';
import { RepeatableFieldBase } from './repeatable-field-base.js';

export class AuthorInput extends RepeatableFieldBase {
  static properties = {
    ...RepeatableFieldBase.properties,
    label: { type: String },
    required: { type: Boolean },
    requiredMarker: { type: String, attribute: 'required-marker' },
    unlistedOption: { type: Boolean, attribute: 'unlisted-option' },
    roles: { type: Array }, // Array of { value, label, selected? }
    helpText: { type: String, attribute: 'help-text' },
    familyPlaceholder: { type: String, attribute: 'family-placeholder' },
    givenPlaceholder: { type: String, attribute: 'given-placeholder' },
    containerClass: { type: String, attribute: 'container-class' }
  };

  constructor() {
    super();
    this.label = 'Names';
    this.required = false;
    this.requiredMarker = '*';
    this.unlistedOption = false;
    this.roles = [
      { value: 'art', label: 'artist' },
      { value: 'aut', label: 'author', selected: true },
      { value: 'ctb', label: 'contributor' },
      { value: 'edt', label: 'editor' },
      { value: 'ill', label: 'illustrator' },
      { value: 'trl', label: 'translator' }
    ];
    this.helpText = 'Enter the name of authors, editors, illustrators, etc. listed on the piece and select the appropriate role from the drop down menu. Authors should be listed first.';
    this.familyPlaceholder = 'Family Name';
    this.givenPlaceholder = 'Given Name';
    this.containerClass = 'standard-block';
    this.addButtonLabel = '+';
    this.addButtonAriaLabel = 'Add another author';
    this.addButtonId = 'add-author';

    // Counter names for global sync (legacy support)
    this.counterNames = ['authorCounter', 'aCounter'];
  }

  // Override to match the specific ID pattern:
  // Entry 0: family_name, given_name
  // Entry 1: family_name0, given_name0
  // Entry 2: family_name1, given_name1
  getSuffix(key) {
    const index = parseInt(key, 10);
    if (index === 0) return '';
    return (index - 1).toString();
  }

  renderEntry(key, isFirst) {
    const suffix = this.getSuffix(key);
    const familyId = `family_name${suffix}`;
    const givenId = `given_name${suffix}`;
    const roleId = `role${suffix}`;

    // Transliteration IDs
    const translitFamilyId = `translit_${familyId}`;
    const translitGivenId = `translit_${givenId}`; // Note: legacy might use translit_given_name0
    // Actually legacy uses: translit_family_name0 and translit_given_name0
    // My logic: family_name0 -> translit_family_name0. Correct.

    const requiredMarker = this.required && this.requiredMarker ? html`<span class="required_marker">${this.requiredMarker}</span>` : nothing;

    const headingLabel = isFirst
      ? html`<label class="heading">${this.label}${requiredMarker}</label>`
      : nothing;

    const insertLinks = html`
      <label for="${familyId}" tabindex="0" class="insert insert_family_name text-orange-700 hover:underline cursor-pointer ml-2 text-sm" @click=${() => this.handleInsertClick(familyId)} @keydown=${(e) => this.handleKeydown(e, familyId)}>Insert Special Characters</label>
      <label for="${givenId}" tabindex="0" class="insert insert_given_name text-orange-700 hover:underline cursor-pointer ml-2 text-sm" @click=${() => this.handleInsertClick(givenId)} @keydown=${(e) => this.handleKeydown(e, givenId)}>Insert Special Characters</label>
    `;

    const currentRoles = (isFirst && this.primaryRoles && this.primaryRoles.length > 0)
      ? this.primaryRoles
      : this.roles;

    const roleOptions = currentRoles.map(role => html`
      <option value="${role.value}" ?selected=${role.selected}>${role.label}</option>
    `);

    const help = isFirst && this.helpText
      ? html`<span tabindex="0" role="button" aria-label="${this.helpText}" class="question-mark text-orange-700 cursor-help" title="${this.helpText}">?</span>`
      : nothing;

    const requiredAttr = this.required; // Only first one? Or all if required? 
    // Legacy behavior: "Enter the dissertant first... Use add button to list committee members..."
    // Usually only the first one is strictly required if the block is required.
    // The legacy code only puts 'required' on the first inputs if they are empty?
    // Let's stick to: if component is required, first entry inputs are required.
    const isEntryRequired = this.required && isFirst;

    return html`
      <div class="${isFirst ? 'author-entry' : 'author-entry added mt-2'}">
        ${headingLabel}
        ${isFirst ? insertLinks : nothing} 
        ${!isFirst ? html`<label for="${familyId}" tabindex="0" class="insert insert_family_name text-orange-700 hover:underline cursor-pointer text-sm" @click=${() => this.handleInsertClick(familyId)} @keydown=${(e) => this.handleKeydown(e, familyId)}>Ω</label>
          <label for="${givenId}" tabindex="0" class="insert insert_given_name text-orange-700 hover:underline cursor-pointer text-sm ml-2" @click=${() => this.handleInsertClick(givenId)} @keydown=${(e) => this.handleKeydown(e, givenId)}>Ω</label>` : nothing}
        
        <div id="insert-${familyId}"></div>
        <div id="insert-${givenId}"></div>
        
        <div class="flex flex-wrap gap-2 mb-2">
          <input type="text" 
            id="${familyId}" 
            class="author conditional translit-listen border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-uva-blue focus:border-transparent flex-1" 
            placeholder="${this.familyPlaceholder}"
            ?required=${isEntryRequired}>
            
          <input type="text" 
            id="${givenId}" 
            class="author conditional translit-listen border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-uva-blue focus:border-transparent flex-1" 
            placeholder="${this.givenPlaceholder}"
            ?required=${isEntryRequired}>
            
          <select name="${roleId}" id="${roleId}" 
            class="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-uva-blue focus:border-transparent w-auto">
            ${roleOptions}
          </select>
        </div>
        ${help}

        <!-- Transliteration Block -->
        <div id="translit-${familyId}-block" class="translit-${familyId}-block translit-block translit-author hidden mt-2 p-2 bg-gray-50 rounded border border-gray-200">
           <label for="${translitFamilyId}" class="hidden translit heading translit-${familyId} block text-sm font-bold text-gray-700">Transliterated name</label>
           <label for="${translitFamilyId}" tabindex="0" class="insert insert_family_name hidden translit translit-${familyId} text-orange-700 hover:underline cursor-pointer text-xs" @click=${() => this.handleInsertClick(translitFamilyId)} @keydown=${(e) => this.handleKeydown(e, translitFamilyId)}>Insert Special Characters</label>
           <label for="${translitGivenId}" tabindex="0" class="insert insert_given_name hidden translit translit-${familyId} text-orange-700 hover:underline cursor-pointer text-xs ml-2" @click=${() => this.handleInsertClick(translitGivenId)} @keydown=${(e) => this.handleKeydown(e, translitGivenId)}>Insert Special Characters</label><br>
           
           <div id="insert-${translitFamilyId}"></div>
           <div id="insert-${translitGivenId}"></div>
           
           <div class="flex gap-2">
             <input type="text" id="${translitFamilyId}" class="hidden translit translit-${familyId} border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-uva-blue focus:border-transparent flex-1" placeholder="Transliterated Family Name">
             <input type="text" id="${translitGivenId}" class="hidden translit translit-${familyId} border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-uva-blue focus:border-transparent flex-1" placeholder="Transliterated Given Name">
           </div>
        </div>
      </div>
    `;
  }

  renderContainer(entriesContent, addControl) {
    // Unlisted checkbox logic
    // Only show if unlistedOption is true AND required is true (matching meta-input logic)
    const showUnlisted = this.unlistedOption && this.required;

    return html`
      <div id="author-block" class="${this.containerClass}">
        ${entriesContent}
        <div class="mt-2 flex items-center">
           ${this.allowAdd ? addControl : nothing}
        </div>
        ${showUnlisted ? html`
          <div class="mt-2">
            <span class="unlisted text-sm text-gray-600">Unlisted</span>
            <input type="checkbox" id="author_listed" class="listed ml-1" @change=${this.handleUnlistedChange}>
          </div>
        ` : nothing}
      </div>
    `;
  }

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
    // Disable all inputs in the block?
    // Legacy behavior: 
    // if ($(this).is(':checked')) {
    //   $(field).removeAttr('required');
    //   $(field).attr('disabled', 'true');
    // }
    // Where field is derived from ID. For author_listed, field is .author (class).

    const inputs = this.querySelectorAll('.author');
    inputs.forEach(input => {
      if (isUnlisted) {
        input.disabled = true;
        input.removeAttribute('required');
        input.classList.add('bg-gray-100', 'cursor-not-allowed');
      } else {
        input.disabled = false;
        input.classList.remove('bg-gray-100', 'cursor-not-allowed');
        // Restore required only for the first ones?
        // My renderEntry sets ?required=${isEntryRequired}.
        // I should probably re-render or manually toggle.
        // Since I'm not using Lit's state for 'required' property to drive this specific interaction (it's DOM manipulation in legacy),
        // I should stick to manual toggle or update the property.
        // But 'required' property on component drives the initial state.

        // If I update the component state, it will re-render.
        // But 'unlisted' state is not tracked in properties other than the checkbox existence.
        // Let's manually toggle for now to match legacy behavior, but cleaner.
        if (this.required && (input.id === 'family_name' || input.id === 'given_name')) {
          input.setAttribute('required', '');
        }
      }
    });

    // Disable/Enable Add Button
    const addButton = this.querySelector(`#${this.addButtonId}`);
    if (addButton) {
      addButton.disabled = isUnlisted;
      if (isUnlisted) {
        addButton.classList.add('opacity-50', 'cursor-not-allowed');
      } else {
        addButton.classList.remove('opacity-50', 'cursor-not-allowed');
      }
    }
  }
}

if (typeof window !== 'undefined' && !window.customElements.get('author-input')) {
  window.customElements.define('author-input', AuthorInput);
}
