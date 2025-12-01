(function (global) {
  const base = global.GeneralInteractionsBase;
  if (!base || !base.GeneralInteractions) {
    console.error('GeneralInteractionsBase is not available.');
    return;
  }

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
    listed: {
      enabled: true,
      selector: '.listed',
      skipGivenCheck: false
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
  const illustrationsMaxSelections = 4;
  const illustrationsSelect = document.getElementById('illustrations-types');
  const illustrationsContainer = document.getElementById('illustrations-types-container');
  let illustrationsPrev = [];

  const applyIllustrationsState = () => {
    const yesSelected = document.getElementById('illustrations-yes')?.checked;
    if (yesSelected && illustrationsSelect) {
      illustrationsSelect.disabled = false;
      illustrationsPrev = Array.from(illustrationsSelect.selectedOptions).map(opt => opt.value);
    } else if (illustrationsSelect) {
      illustrationsSelect.disabled = true;
      Array.from(illustrationsSelect.options).forEach(opt => opt.selected = false);
      illustrationsPrev = [];
    }
  };

  const handleIllustrationsChange = () => {
    if (!illustrationsSelect) return;
    const selected = Array.from(illustrationsSelect.selectedOptions).map(opt => opt.value);
    if (selected.length > illustrationsMaxSelections) {
      const previous = illustrationsPrev.length > 0 ? illustrationsPrev : selected.slice(0, illustrationsMaxSelections);
      Array.from(illustrationsSelect.options).forEach(opt => {
        opt.selected = previous.includes(opt.value);
      });
      illustrationsPrev = previous;
      return;
    }
    illustrationsPrev = selected;
  };

  const handleReset = () => {
    setTimeout(() => {
      syncCounters();
      applyIllustrationsState();
    }, 0);
  };
  document.addEventListener('click', (event) => {
    if (event.target.type === 'reset') {
      handleReset();
    }
  });

  global.requestInsertLabelUpgrade = general.requestInsertLabelUpgrade;
  global.toggleTranslit = general.toggleTranslit;
  const addKeywordOriginal = general.addKeyword.bind(general);
  global.addKeyword = function () {
    const result = addKeywordOriginal();
    syncCounters();
    return result;
  };
  const addAuthorOriginal = general.addAuthor.bind(general);
  global.addAuthor = function () {
    const result = addAuthorOriginal();
    syncCounters();
    return result;
  };
  global.checkExists = general.checkExists;
  global.downloadFile = general.downloadFile;
  global.getTimestamp = general.getTimestamp;
  global.escapeXML = general.escapeXML;

  const literatureRadios = document.querySelectorAll('input[type="radio"][name="literature"]');
  literatureRadios.forEach(radio => {
    radio.addEventListener('click', function () {
      const litDropdown = document.getElementById('literature-dropdown');
      if (litDropdown) {
        litDropdown.style.display = this.value === 'yes' ? 'block' : 'none';
      }
    });
  });

  const illustrationsRadios = document.querySelectorAll('input[type="radio"][name="illustrations"]');
  illustrationsRadios.forEach(radio => {
    radio.addEventListener('change', applyIllustrationsState);
  });
  if (illustrationsSelect) {
    illustrationsSelect.addEventListener('change', handleIllustrationsChange);
  }
  applyIllustrationsState();
})(window);
