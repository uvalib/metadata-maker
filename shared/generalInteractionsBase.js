(function(global) {
  const NON_ROMAN_REGEX = /[^\u0000-\u024F\u0263\u02B9\u02BA\u02DD\u0300\u0301\u0302\u0303\u0304\u0306\u0308\u0309\u030A\u030C\u0310\u0313\u0315\u0321\u0322\u0323\u0324\u0325\u0327\u0328\u032E\u0332\u0333\u0351\u0357\u0366\u03B1\u04D4\u04D5\u2020\u2070\u2074\u2075\u2076\u2077\u2078\u2079\u207A\u207B\u207D\u207E\u2080\u2081\u2082\u2083\u2084\u2085\u2086\u2087\u2088\u2089\u20AC\u220E\u2113\u01C2\u2117\u266D\u266F\uFE20\uFE21\uFE22\uFE23\u02C7\u0307\u208E\u208D\u208B\u208A]/;

  function deepMerge(target, source) {
    const output = Array.isArray(target) ? target.slice() : { ...target };
    if (!source) {
      return output;
    }
    Object.keys(source).forEach((key) => {
      const value = source[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        output[key] = deepMerge(output[key] || {}, value);
      } else {
        output[key] = value;
      }
    });
    return output;
  }

  function buildDefaultKeywordMarkup(index) {
    return '\t<br><input type="text" class="fastID hidden" id="fastID' + index + '\"><input type="text" class="fastType hidden" id="fastType' + index + '\"><input type="text" class="fastInd hidden" id="fastInd' + index + '\"><input type="text" class="keyword" id="keyword' + index + '\">';
  }

  function buildDefaultAuthorMarkup(index, options) {
    const roleOptions = (options.roles || [
      { value: 'art', label: 'artist' },
      { value: 'aut', label: 'author', selected: true },
      { value: 'ctb', label: 'contributor' },
      { value: 'edt', label: 'editor' },
      { value: 'ill', label: 'illustrator' },
      { value: 'trl', label: 'translator' }
    ]).map((role) => {
      const selected = role.selected ? ' selected' : '';
      return '<option value="' + role.value + '"' + selected + '>' + role.label + '</option>';
    }).join('');

    const familyId = options.blockIdPrefix + index;
    const familyPlaceholder = options.familyPlaceholder || 'Family Name';
    const givenPlaceholder = options.givenPlaceholder || 'Given Name';

    let markup = '';
  markup += '<label for="' + familyId + '" class="insert insert_family_name additional_insert" onClick=\'insertMenu("' + familyId + '");\'>Insert other chars</label>';
  markup += '<label for="given_name' + index + '" class="insert insert_given_name additional_insert" onClick=\'insertMenu("given_name' + index + '");\'>Insert other chars</label><br>';
    markup += '<div id="insert-' + familyId + '" class="additional_menu"></div><div id="insert-given_name' + index + '" class="insert-given_name additional_menu"></div>';
    markup += '<span class="added-author"><input type="text" class="author translit-listen" id="' + familyId + '" placeholder="' + familyPlaceholder + '">, ';
    markup += '<input type="text" class="author translit-listen" id="given_name' + index + '" placeholder="' + givenPlaceholder + '"> ';
    markup += '<select name="role' + index + '" id="role' + index + '">' + roleOptions + '</select></span>';

    markup += '<div class="translit-' + familyId + '-block translit-block translit-author hidden" id="translit-' + familyId + '-block">';
  markup += '<label for="translit_' + familyId + '" class="insert insert_family_name hidden translit translit-' + familyId + '" onClick=\'insertMenu("translit_' + familyId + '");\'>Insert other chars</label>';
  markup += '<label for="translit_given_name' + index + '" class="insert insert_given_name hidden translit translit-' + familyId + '" onClick=\'insertMenu("translit_given_name' + index + '");\'>Insert other chars</label><br>';
    markup += '<div id="insert-translit_' + familyId + '"></div><div id="insert-translit_given_name' + index + '" class="insert-given_name"></div>';
    markup += '<input type="text" id="translit_' + familyId + '" class="hidden translit translit-' + familyId + '" placeholder="Transliterated Family Name"><span class="hidden translit-' + familyId + '">, </span>';
    markup += '<input type="text" id="translit_given_name' + index + '" class="hidden translit translit-' + familyId + '" placeholder="Transliterated Given Name">';
    markup += '</div>';

    return markup;
  }

  function buildDefaultCorporateMarkup(index, options) {
    const blockId = options.blockIdPrefix + index;
    const roleOptions = (options.roles || [
      { value: 'cre', label: 'creator', selected: true },
      { value: 'ctb', label: 'contributor' }
    ]).map((role) => {
      const selected = role.selected ? ' selected' : '';
      return '<option value="' + role.value + '"' + selected + '>' + role.label + '</option>';
    }).join('');

    let markup = '';
  markup += '<label for="' + blockId + '" class="insert insert_corporate_name" onClick=\'insertMenu("' + blockId + '");\'>Insert other chars</label><br>';
    markup += '<div id="insert-' + blockId + '" class="additional_corporate_menu"></div>';
    markup += '<span class="added-corporate"><input type="text" class="corporate translit-listen" id="' + blockId + '"> ';
    markup += '<select name="role' + index + '" id="corporate_role' + index + '">' + roleOptions + '</select></span>';
    markup += '<div class="translit-' + blockId + '-block translit-block translit-' + blockId + ' hidden" id="translit-' + blockId + '-block">';
  markup += '<label for="translit_' + blockId + '" class="insert insert_translit_corporate_name hidden translit translit-' + blockId + '" onClick=\'insertMenu("translit_' + blockId + '");\'>Insert other chars</label><br>';
    markup += '<div id="insert-translit_' + blockId + '"></div>';
    markup += '<input type="text" id="translit_' + blockId + '" class="hidden translit translit-' + blockId + '">';
    markup += '</div>';
    return markup;
  }

  const DEFAULTS = {
    rootSelector: '#marc-maker',
    filenameSelector: '#filename',
    scheduleInsertLabelUpgrade: null,
    setUpInstitution: null,
    setUpPage: null,
    dateMax: { mode: 'constant', value: 1000000 },
    keyword: {
      enabled: true,
      containerSelector: '#keywords',
      max: 50,
      counterStart: 1,
      className: 'added added-keyword',
      buildMarkup: buildDefaultKeywordMarkup,
      afterAdd: null
    },
    author: {
      enabled: true,
      containerSelector: '#author-block',
      max: 50,
      counterStart: 0,
      blockClassName: 'added',
      blockIdPrefix: 'family_name',
      buildMarkup: (index, options) => buildDefaultAuthorMarkup(index, options),
      options: {},
      afterAdd: null
    },
    corporate: {
      enabled: false,
      containerSelector: '#corporate-block',
      max: 50,
      counterStart: 0,
      blockClassName: 'added_corporate',
      blockIdPrefix: 'corporate_name',
      buildMarkup: (index, options) => buildDefaultCorporateMarkup(index, options),
      options: {},
      afterAdd: null
    },
    transliteration: {
      nonRomanRegex: NON_ROMAN_REGEX
    },
    fastReset: {
      enabled: true,
      eventSelector: '#marc-maker',
      delegateSelector: null,
      keyCodes: [8, 46],
      keywordPrefix: 'keyword',
      fastIdPrefix: 'fastID',
      fastTypePrefix: 'fastType',
      fastIndPrefix: 'fastInd'
    },
    authorRequirement: {
      enabled: true,
      selector: '.author',
      pairedFields: true
    },
    listed: {
      enabled: true,
      selector: '.listed',
      skipGivenCheck: false
    },
    reset: {
      enabled: true,
      removeSelectors: ['.added', '.added_corporate'],
      hideSelectors: ['.hidden'],
      paddingSelectors: ['.translit-block'],
      paddingResetValue: '0px',
      requiredSelector: '.conditional',
      keywordCounter: true,
      authorCounter: true,
      corporateCounter: true,
      additional: null
    },
    download: {
      headers: {
        mrc: 'data:application/marc;charset=utf-8,',
        html: 'data:text/html;charset=utf-8,'
      },
      defaultHeader: 'data:text/plain;charset=utf-8,',
      suffixes: {
        xml: '_MARCXML',
        mods: '_MODS'
      },
      extensionOverrides: {
        mods: 'xml'
      }
    },
    additionalHandlers: []
  };

  class GeneralInteractions {
    constructor(config) {
      this.config = deepMerge(DEFAULTS, config || {});
      this.keywordCounter = this.config.keyword.counterStart || 0;
      this.authorCounter = this.config.author.counterStart || 0;
      this.corporateCounter = this.config.corporate.counterStart || 0;

      this.requestInsertLabelUpgrade = this.requestInsertLabelUpgrade.bind(this);
      this.toggleTranslit = this.toggleTranslit.bind(this);
      this.addKeyword = this.addKeyword.bind(this);
      this.addAuthor = this.addAuthor.bind(this);
      this.addCorporate = this.addCorporate.bind(this);
      this.checkExists = this.checkExists.bind(this);
      this.downloadFile = this.downloadFile.bind(this);
      this.getTimestamp = this.getTimestamp.bind(this);
      this.escapeXML = this.escapeXML.bind(this);

      this.initialize();
    }

    initialize() {
      this.initDocumentReady();
      this.registerTranslitHandler();
      this.registerFastKeywordReset();
      this.registerAuthorRequirementHandler();
      this.registerDateMax();
      this.registerResetHandler();
      this.registerListedHandler();
      if (Array.isArray(this.config.additionalHandlers)) {
        this.config.additionalHandlers.forEach((handler) => {
          if (typeof handler === 'function') {
            handler(this);
          }
        });
      }
    }

    initDocumentReady() {
      $(document).ready(() => {
        if (typeof this.config.setUpInstitution === 'function') {
          this.config.setUpInstitution();
        }
        if (typeof this.config.setUpPage === 'function') {
          this.config.setUpPage(0);
        }
        if (typeof this.config.scheduleInsertLabelUpgrade === 'function') {
          this.config.scheduleInsertLabelUpgrade(document);
        }
      });
    }

    requestInsertLabelUpgrade(root) {
      if (typeof this.config.scheduleInsertLabelUpgrade === 'function') {
        this.config.scheduleInsertLabelUpgrade(root);
      }
    }

    toggleTranslit(id) {
      if (!id) {
        return;
      }
      const regex = this.config.transliteration.nonRomanRegex || NON_ROMAN_REGEX;
      const value = $('#' + id).val();
      const needsTranslit = regex.test(value || '');

      if (id.substring(0, 5) === 'given') {
        const familyId = 'family' + id.substring(5);
        const familyValue = $('#' + familyId).val();
        if (!needsTranslit && regex.test(familyValue || '')) {
          return;
        }
        id = familyId;
      }

      if (needsTranslit) {
        $('.translit-' + id).show();
        $('#translit-' + id + '-block').show();
        $('.translit-' + id + '-block').css('padding', '3px');
      } else {
        if (id.substring(0, 6) === 'family' && !this.config.listed.skipGivenCheck) {
          const givenValue = $('#given' + id.substring(6)).val();
          if (regex.test(givenValue || '')) {
            return;
          }
        }
        $('.translit-' + id).hide();
        $('#translit-' + id + '-block').hide();
        $('.translit-' + id + '-block').css('padding', '0px');
      }
    }

    registerTranslitHandler() {
      const root = this.config.rootSelector;
      if (!root) {
        return;
      }
      $(root).on('blur', '.translit-listen', (event) => {
        this.toggleTranslit(event.target.id);
      });
    }

    registerFastKeywordReset() {
      const conf = this.config.fastReset;
      if (!conf || !conf.enabled) {
        return;
      }
      const root = conf.eventSelector ? $(conf.eventSelector) : $(this.config.rootSelector);
      if (!root.length) {
        return;
      }
      const handler = (event) => {
        if (conf.keyCodes && conf.keyCodes.indexOf(event.keyCode) === -1) {
          return;
        }
        let active = document.activeElement;
        if (conf.delegateSelector) {
          active = event.currentTarget;
        }
        if (!active || !active.id) {
          return;
        }
        if (conf.keywordPrefix && active.id.indexOf(conf.keywordPrefix) !== 0) {
          return;
        }
        const suffix = active.id.substring(conf.keywordPrefix.length);
        const prefixes = [conf.fastIdPrefix, conf.fastTypePrefix, conf.fastIndPrefix];
        prefixes.forEach((prefix) => {
          if (prefix) {
            $('#' + prefix + suffix).val('');
          }
        });
      };

      if (conf.delegateSelector) {
        root.on(conf.eventName || 'keyup', conf.delegateSelector, handler);
      } else {
        root.on(conf.eventName || 'keyup', handler);
      }
    }

    registerAuthorRequirementHandler() {
      const conf = this.config.authorRequirement;
      if (!conf || !conf.enabled) {
        return;
      }
      const selector = conf.selector || '.author';
      $(selector).change((event) => {
        const fieldId = event.target.id;
        if (!fieldId) {
          return;
        }
        let other;
        if (fieldId === 'family_name') {
          other = '#given_name';
        } else if (fieldId === 'given_name') {
          other = '#family_name';
        } else {
          return;
        }
        if ($(event.target).val() === '') {
          $(other).attr('required', 'true');
        } else {
          $(other).removeAttr('required');
        }
      });
    }

    registerDateMax() {
      const conf = this.config.dateMax;
      if (!conf || conf.mode === 'none') {
        return;
      }
      if (conf.mode === 'yearPlus1') {
        const present = new Date().getFullYear();
        $('.date').attr('max', present + 1);
      } else if (conf.mode === 'constant') {
        $('.date').attr('max', conf.value);
      }
    }

    registerResetHandler() {
      const conf = this.config.reset;
      if (!conf || !conf.enabled) {
        return;
      }
      $(document).on('click', ':reset', () => {
        $(conf.requiredSelector).attr('required', 'true');
        $(conf.requiredSelector).removeAttr('disabled');
        conf.hideSelectors.forEach((selector) => {
          $(selector).hide();
        });
        conf.removeSelectors.forEach((selector) => {
          $(selector).remove();
        });
        conf.paddingSelectors.forEach((selector) => {
          $(selector).css('padding', conf.paddingResetValue);
        });
        if (conf.keywordCounter) {
          this.keywordCounter = this.config.keyword.counterStart || 0;
        }
        if (conf.authorCounter) {
          this.authorCounter = this.config.author.counterStart || 0;
        }
        if (conf.corporateCounter) {
          this.corporateCounter = this.config.corporate.counterStart || 0;
        }
        if (typeof conf.additional === 'function') {
          conf.additional(this);
        }
      });
    }

    registerListedHandler() {
      const conf = this.config.listed;
      if (!conf || !conf.enabled) {
        return;
      }
      $(conf.selector).click(function() {
        let field = $(this).attr('id');
        field = field.substring(0, field.length - 7);
        if (field !== 'author') {
          field = '#' + field;
        } else {
          field = '.' + field;
          if (!conf.skipGivenCheck) {
            if ($('#family_name').val() !== '' || $('#given_name').val() !== '') {
              return;
            }
          } else {
            if ($('#family_name').val() !== '') {
              return;
            }
          }
        }
        if ($(this).is(':checked')) {
          $(field).removeAttr('required');
          $(field).attr('disabled', 'true');
        } else {
          $(field).attr('required', 'true');
          $(field).removeAttr('disabled');
        }
      });
    }

    addKeyword() {
      const conf = this.config.keyword;
      if (!conf || !conf.enabled) {
        return null;
      }
      if (this.keywordCounter >= conf.max) {
        return null;
      }
      const container = document.querySelector(conf.containerSelector);
      if (!container) {
        return null;
      }
      const index = this.keywordCounter;
      const newDiv = document.createElement('div');
      newDiv.className = conf.className || '';
      newDiv.innerHTML = conf.buildMarkup(index, conf.options || {});
      container.appendChild(newDiv);
      if (typeof conf.afterAdd === 'function') {
        conf.afterAdd(this, index, newDiv);
      }
      this.keywordCounter += 1;
      return newDiv;
    }

    addAuthor() {
      const conf = this.config.author;
      if (!conf || !conf.enabled) {
        return null;
      }
      if (this.authorCounter >= conf.max) {
        return null;
      }
      const container = document.querySelector(conf.containerSelector);
      if (!container) {
        return null;
      }
      const index = this.authorCounter;
      const newDiv = document.createElement('div');
      newDiv.className = conf.blockClassName || '';
      if (conf.blockIdPrefix) {
        newDiv.setAttribute('id', conf.blockIdPrefix + index + '-block');
      }
      newDiv.innerHTML = conf.buildMarkup(index, deepMerge({ blockIdPrefix: conf.blockIdPrefix }, conf.options || {}));
      container.appendChild(newDiv);
      this.requestInsertLabelUpgrade(newDiv);
      if (typeof conf.afterAdd === 'function') {
        conf.afterAdd(this, index, newDiv);
      }
      this.authorCounter += 1;
      return newDiv;
    }

    addCorporate() {
      const conf = this.config.corporate;
      if (!conf || !conf.enabled) {
        return null;
      }
      if (this.corporateCounter >= conf.max) {
        return null;
      }
      const container = document.querySelector(conf.containerSelector);
      if (!container) {
        return null;
      }
      const index = this.corporateCounter;
      const newDiv = document.createElement('div');
      newDiv.className = conf.blockClassName || '';
      if (conf.blockIdPrefix) {
        newDiv.setAttribute('id', conf.blockIdPrefix + index + '-block');
      }
      newDiv.innerHTML = conf.buildMarkup(index, deepMerge({ blockIdPrefix: conf.blockIdPrefix }, conf.options || {}));
      container.appendChild(newDiv);
      this.requestInsertLabelUpgrade(newDiv);
      if (typeof conf.afterAdd === 'function') {
        conf.afterAdd(this, index, newDiv);
      }
      this.corporateCounter += 1;
      return newDiv;
    }

    checkExists(attr) {
      return typeof attr !== 'undefined' && attr !== '' && attr !== null;
    }

    getFilename() {
      const selector = this.config.filenameSelector || '#filename';
      return $(selector).val();
    }

    downloadFile(text, filetype) {
      const downloadFile = document.createElement('a');
      const headers = this.config.download.headers || {};
      const header = headers[filetype] || this.config.download.defaultHeader || 'data:text/plain;charset=utf-8,';
      downloadFile.setAttribute('href', header + encodeURIComponent(text));
      let filename = this.getFilename();
      if (!this.checkExists(filename)) {
        filename = 'record';
      }
      const suffixes = this.config.download.suffixes || {};
      if (suffixes[filetype]) {
        filename += suffixes[filetype];
      }
      let extension = filetype;
      if (this.config.download.extensionOverrides && this.config.download.extensionOverrides[filetype]) {
        extension = this.config.download.extensionOverrides[filetype];
      }
      downloadFile.setAttribute('download', filename + '.' + extension);
      const clickReplacement = new MouseEvent('click', {
        view: window,
        bubbles: true,
        cancleable: false
      });
      downloadFile.dispatchEvent(clickReplacement);
    }

    getTimestamp() {
      const date = new Date().toISOString();
      return date.substring(0, 4) + date.substring(5, 7) + date.substring(8, 10) + date.substring(11, 13) + date.substring(14, 16) + date.substring(17, 21);
    }

    escapeXML(content) {
      if (typeof content !== 'string') {
        return content;
      }
      return content
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
    }
  }

  function createDiacriticsHelper(options) {
    const config = Object.assign({
      codes: ['0301','04D5','04D4','0357','0351','0306','00A3','0310','0327','030A','0325','0302','005E','00A9','0111','0110','0366','0323','00B7','02DD','0324','FE22','FE23','0333','00DF','00F0','00D0','20AC','220E','0060','0300','030C','0313','0315','0328','00A1','00BF','0142','0141','007B','0321','FE20','FE21','0304','02B9','266D','266F','01A1','01A0','00F8','00D8','0153','0152','2117','00B1','0309','007D','0322','2113','01C2','2080','2081','2082','2083','2084','2085','2086','2087','2088','2089','208D','208B','00AE','208A','208E','0307','2070','00B9','00B2','00B3','2074','2075','2076','2077','2078','2079','207D','207B','207A','207E','00FE','00DE','0303','007E','0131','02BA','01B0','01AF','0308','0332','005F','032E'],
      buttonClass: 'diacritics',
      containerId: 'insert-popup',
      minWidth: 10,
      maxWidth: 20,
      scheduleInsertLabelUpgrade: null
    }, options || {});

    function findClosestDimensions(length, minWidth, maxWidth) {
      let bestWidth = minWidth;
      let smallestGap = Number.MAX_SAFE_INTEGER;
      for (let width = minWidth; width <= maxWidth; width++) {
        const remainder = length % width;
        if (remainder === 0) {
          return { width, height: Math.ceil(length / width) };
        }
        const gap = width - remainder;
        if (gap < smallestGap) {
          smallestGap = gap;
          bestWidth = width;
        }
      }
      return { width: bestWidth, height: Math.ceil(length / bestWidth) };
    }

    function insertChar(field, insertValue, insertAt) {
      const input = $('#' + field);
      const current = input.val() || '';
      const position = typeof insertAt === 'number' ? insertAt : current.length;
      const updated = current.substring(0, position) + insertValue + current.substring(position);
      input.val(updated);
      input.focus();
      $('#' + config.containerId).remove();
    }

    function constructMenu(field, insertAt) {
      const dimensions = findClosestDimensions(config.codes.length, config.minWidth, config.maxWidth);
      const containerStyle = 'width: ' + (dimensions.width * 35) + 'px; margin-bottom: -' + (dimensions.height * 35) + 'px;';
      let markup = "\t<div id='buttons' style='" + containerStyle + "'>\n";
      for (let i = 0; i < config.codes.length; i++) {
        const code = config.codes[i];
        let buttonClass = config.buttonClass + ' ';
        const col = i % dimensions.width;
        const row = Math.floor(i / dimensions.width);
        const lastRow = row === dimensions.height - 1;
        const lastColumn = col === dimensions.width - 1;
        if (lastRow && lastColumn) {
          buttonClass += 'bottom-right';
        } else if (lastRow) {
          buttonClass += 'last-row';
        } else if (lastColumn) {
          buttonClass += 'row-end';
        } else {
          buttonClass += 'normal-button';
        }
        const character = String.fromCharCode(parseInt(code, 16));
        markup += "<button value='" + character + "' id='" + code + "' class='" + buttonClass + "' type='button' onClick=\"insertChar('" + field + "','" + character + "'," + insertAt + ")\">&#x" + code + "</button>";
        if (lastColumn) {
          markup += "<br>\n";
        }
      }
      markup += "\t</div>";
      return markup;
    }

    function openMenu(field) {
      if (typeof config.scheduleInsertLabelUpgrade === 'function') {
        config.scheduleInsertLabelUpgrade(document);
      } else if (typeof window.scheduleInsertLabelUpgrade === 'function') {
        window.scheduleInsertLabelUpgrade(document);
      } else if (typeof window.upgradeInsertLabels === 'function') {
        window.upgradeInsertLabels(document);
      }

      const picker = document.querySelector('insert-diacritics[target="' + field + '"]');
      if (picker && typeof picker.openMenu === 'function') {
        picker.openMenu();
        return;
      }

      const existing = document.getElementById(config.containerId);
      if (existing) {
        existing.remove();
        return;
      }

      const element = document.getElementById(field);
      const insertAt = element && typeof element.selectionStart === 'number' ? element.selectionStart : (element && element.value ? element.value.length : 0);
      const wrapper = document.createElement('div');
      wrapper.setAttribute('id', config.containerId);
      wrapper.innerHTML = constructMenu(field, insertAt);
      $('#insert-' + field).append(wrapper);
    }

    if (!global.__diacriticsEscHandlerBound) {
      $(document).on('keyup', function(event) {
        if (event.keyCode === 27) {
          const popup = document.getElementById(config.containerId);
          if (popup) {
            popup.remove();
          }
        }
      });
      global.__diacriticsEscHandlerBound = true;
    }

    return {
      insertChar,
      insertMenu: openMenu
    };
  }

  global.GeneralInteractionsBase = {
    GeneralInteractions,
    NON_ROMAN_REGEX,
    createDiacriticsHelper
  };
})(window);
