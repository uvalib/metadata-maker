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
    reset: {
      additional() {
        $('#level3-subject0').remove();
        $('#level2-subject0').remove();
        $('#level1-subject0').remove();
        $('#verification0').html('Invalid Subject Heading <span style="color: red;">&#x2717;</span>');
        $('#verification0').removeClass('verified');
        $('#verification0').addClass('unverified');
        $('#verification0').removeAttr('value');
        $('#subject0-block').removeClass('valid');
      }
    },
    download: {
      suffixes: {
        onix: '_ONIX'
      },
      extensionOverrides: {
        onix: 'xml'
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

  $("input:radio[name=literature]").click(function() {
    const value = $(this).val();
    if (value === 'yes') {
      $('#literature-dropdown').show();
    } else {
      $('#literature-dropdown').hide();
    }
  });
})(window);
