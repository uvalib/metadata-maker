(function(global) {
  const base = global.GeneralInteractionsBase;
  if (!base || !base.GeneralInteractions) {
    console.error('GeneralInteractionsBase is not available.');
    return;
  }

  const ADDITIONAL_AUTHOR_ROLES = [
    { value: 'csp', label: 'consultant to a project' },
    { value: 'ctb', label: 'contributor', selected: true },
    { value: 'dtc', label: 'data contributor' },
    { value: 'dte', label: 'dedicatee' },
    { value: 'dgc', label: 'degree committee member' },
    { value: 'dgs', label: 'degree supervisor' },
    { value: 'fnd', label: 'funder' },
    { value: 'rtm', label: 'research team member' },
    { value: 'spn', label: 'sponsor' },
    { value: 'tad', label: 'technical advisor' }
  ];

  const buildThesisAuthorMarkup = (index, options = {}) => {
    const blockIdPrefix = options.blockIdPrefix || 'family_name';
    const familyId = `${blockIdPrefix}${index}`;
    const givenId = `given_name${index}`;
    const roleId = `role${index}`;
    const roles = options.additionalRoles || [];
    const roleOptions = roles.map((role) => {
      const selected = role.selected ? ' selected' : '';
      return `<option value="${role.value}"${selected}>${role.label}</option>`;
    }).join('');

    let markup = '';
    markup += `<label for="${familyId}" class="insert insert_family_name additional_insert" onClick='insertMenu("${familyId}");'>Insert Special Characters</label>`;
    markup += `<label for="${givenId}" class="insert insert_given_name additional_insert" onClick='insertMenu("${givenId}");'>Insert Special Characters</label><br>`;
    markup += `<div id="insert-${familyId}" class="additional_menu"></div><div id="insert-given_name${index}" class="insert-given_name additional_menu"></div>`;
    markup += `<span class="added-author"><input type="text" class="author conditional" id="${familyId}" placeholder="Family Name">, `;
    markup += `<input type="text" class="author conditional" id="${givenId}" placeholder="Given Name"> `;
    markup += `<select name="${roleId}" id="${roleId}">${roleOptions}</select></span>`;
    markup += '<br>';
    return markup;
  };

  const callSetUpInstitution = () => {
    if (typeof global.setUpInstitution === 'function') {
      global.setUpInstitution();
    }
  };
  const callSetUpPage = (page) => {
    if (typeof global.setUpPage === 'function') {
      global.setUpPage(page);
    }
  };
  const scheduleUpgrade = (target) => {
    if (typeof global.scheduleInsertLabelUpgrade === 'function') {
      global.scheduleInsertLabelUpgrade(target);
    }
  };

  const general = new base.GeneralInteractions({
    setUpInstitution: callSetUpInstitution,
    setUpPage: callSetUpPage,
    scheduleInsertLabelUpgrade: scheduleUpgrade,
    keyword: {
      afterAdd(instance, index) {
        callSetUpPage(index);
      }
    },
    author: {
      enabled: true,
      containerSelector: '#author-block',
      max: 50,
      counterStart: 0,
      blockClassName: 'added',
      blockIdPrefix: 'family_name',
      buildMarkup: (index, opts) => buildThesisAuthorMarkup(index, opts),
      options: {
        blockIdPrefix: 'family_name',
        additionalRoles: ADDITIONAL_AUTHOR_ROLES
      }
    }
  });

  const syncCounters = () => {
    global.keywordCounter = general.keywordCounter;
    global.counter = general.keywordCounter;
    global.authorCounter = general.authorCounter;
    global.aCounter = general.authorCounter;
    const corporateElement = document.querySelector('corporate-organization-input');
    const corporateCount = corporateElement && typeof corporateElement.additionalEntryCount === 'number'
      ? corporateElement.additionalEntryCount
      : (typeof window.cCounter === 'number' ? window.cCounter : 0);
    global.corporateCounter = corporateCount;
    global.cCounter = corporateCount;
  };
  syncCounters();
  $(document).on('click', ':reset', syncCounters);


  const diacritics = base.createDiacriticsHelper({
    scheduleInsertLabelUpgrade: scheduleUpgrade
  });

  

global.requestInsertLabelUpgrade = general.requestInsertLabelUpgrade;
  global.toggleTranslit = general.toggleTranslit;
  const addKeywordOriginal = general.addKeyword.bind(general);
  global.addKeyword = function() {
    const result = addKeywordOriginal();
    syncCounters();
    return result;
  };
  const addAuthorOriginal = general.addAuthor.bind(general);
  global.addAuthor = function() {
    const result = addAuthorOriginal();
    syncCounters();
    return result;
  };
  global.checkExists = general.checkExists;
  global.downloadFile = general.downloadFile;
  global.getTimestamp = general.getTimestamp;
  global.escapeXML = general.escapeXML;
  global.insertChar = diacritics.insertChar;
  global.insertMenu = diacritics.insertMenu;
})(window);
