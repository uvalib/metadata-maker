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
    corporate: {
      enabled: true
    }
  });

  const syncCounters = () => {
    global.keywordCounter = general.keywordCounter;
    global.counter = general.keywordCounter;
    global.authorCounter = general.authorCounter;
    global.aCounter = general.authorCounter;
    global.corporateCounter = general.corporateCounter;
    global.cCounter = general.corporateCounter;
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
  const addCorporateOriginal = general.addCorporate.bind(general);
  global.addCorporate = function() {
    const result = addCorporateOriginal();
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
