(function(global) {
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
    fastReset: {
      enabled: true,
      eventSelector: '#marc-maker',
      delegateSelector: '.keyword',
      keyCodes: [8, 46],
      keywordPrefix: 'keyword',
      fastIdPrefix: 'fastID',
      fastTypePrefix: 'fastType',
      fastIndPrefix: 'fastInd'
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

  $("input:radio[name=e-resource]").click(function() {
    const value = $(this).val();
    if (value === 'yes') {
      $('#web-url-block').show();
    } else {
      $('#web-url-block').hide();
    }
  });

  $("input:radio[name=literature]").click(function() {
    const value = $(this).val();
    if (value === 'yes') {
      $('#literature-dropdown').show();
    } else {
      $('#literature-dropdown').hide();
    }
  });
})(window);
