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
    global.corporateCounter = general.corporateCounter;
    global.cCounter = general.corporateCounter;
  };
  syncCounters();
  const illustrationsMaxSelections = 4;
  const $illustrationsSelect = $('#illustrations-types');
  const $illustrationsContainer = $('#illustrations-types-container');

  const applyIllustrationsState = () => {
    const yesSelected = $('#illustrations-yes').is(':checked');
    if (yesSelected) {
      $illustrationsSelect.prop('disabled', false);
      $illustrationsSelect.data('prev', $illustrationsSelect.val() || []);
    } else {
      $illustrationsSelect.prop('disabled', true);
      $illustrationsSelect.val([]);
      $illustrationsSelect.data('prev', []);
    }
  };

  const handleIllustrationsChange = () => {
    const selected = $illustrationsSelect.val() || [];
    if (selected.length > illustrationsMaxSelections) {
      const previous = $illustrationsSelect.data('prev') || selected.slice(0, illustrationsMaxSelections);
      $illustrationsSelect.val(previous);
      $illustrationsSelect.data('prev', previous);
      return;
    }
    $illustrationsSelect.data('prev', selected);
  };

  const handleReset = () => {
    setTimeout(() => {
      syncCounters();
      applyIllustrationsState();
    }, 0);
  };
  $(document).on('click', ':reset', handleReset);

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

  $("input:radio[name=literature]").click(function() {
    const value = $(this).val();
    if (value === 'yes') {
      $('#literature-dropdown').show();
    } else {
      $('#literature-dropdown').hide();
    }
  });

  $("input:radio[name=illustrations]").on('change', applyIllustrationsState);
  $illustrationsSelect.on('change', handleIllustrationsChange);
  applyIllustrationsState();
})(window);
