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
      enabled: true,
      buildMarkup(index) {
        return '<label for="corporate_name' + index + '" class="insert insert_corporate" onClick=\'insertMenu("corporate_name' + index + '");\'>Insert Special Characters</label><br>' +
          '<div id="insert-corporate_name' + index + '" class="additional_corporate_menu"></div>' +
          '<span class="added-corporate"><input type="text" class="corporate translit-listen" id="corporate_name' + index + '"> ' +
          '<select name="role' + index + '" id="corporate_role' + index + '"><option selected value="cre">creator</option><option value="ctb">contributor</option></select></span>';
      }
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


  

global.requestInsertLabelUpgrade = general.requestInsertLabelUpgrade;
  global.toggleTranslit = general.toggleTranslit;
  const addKeywordOriginal = general.addKeyword.bind(general);
  global.addKeyword = function() {
    const result = addKeywordOriginal();
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
})(window);
