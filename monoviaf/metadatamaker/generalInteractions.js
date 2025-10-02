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

  function buildMonoviafAuthorMarkup(index) {
    let markup = '';
    markup += '<label for="family_name' + index + '" class="insert insert_family_name additional_insert" onClick=\'insertMenu("family_name' + index + '");\'>Insert Special Characters</label><br>';
    markup += '<div id="insert-family_name' + index + '" class="additional_menu"></div>';
    markup += '<span class="added-author"><input type="text" class="author translit-listen" id="family_name' + index + '" placeholder="Family Name, Given Name"> ';
    markup += '<select name="role' + index + '" id="role' + index + '"><option value="art">artist</option><option selected value="aut">author</option><option value="ctb">contributor</option><option value="edt">editor</option><option value="ill">illustrator</option><option value="trl">translator</option></select></span>';
    markup += '<div class="Hviafdiv" id="hiddenviafdiv' + index + '" style="display: none;"><a class="Hviaf" id="hiddenviaf' + index + '" target="_blank" rel="noopener noreferrer" href="">VIAF Link</a></div>';
    markup += '<div class="Hlcdiv" id="hiddenlcdiv' + index + '" style="display: none;"><a class="Hlc" id="hiddenlc' + index + '" target="_blank" rel="noopener noreferrer" href="">LC Link</a></div>';
    markup += '<div class="translit-family_name' + index + '-block translit-block translit-author hidden" id="translit-family_name' + index + '-block">';
    markup += '<label>Please fill out the name in its original language on the resource again:</label><br>';
    markup += '<label for="translit_family_name' + index + '" class="insert insert_family_name hidden translit translit-family_name' + index + '" onClick=\'insertMenu("translit_family_name' + index + '");\'>Insert Special Characters</label><br>';
    markup += '<div id="insert-translit_family_name' + index + '"></div>';
    markup += '<input type="text" id="translit_family_name' + index + '" class="hidden translit translit-family_name' + index + '" placeholder="Family Name, Given Name"><span class="hidden translit-family_name' + index + '">, </span>';
    markup += '</div>';
    return markup;
  }

  const general = new base.GeneralInteractions({
    setUpInstitution: callSetUpInstitution,
    setUpPage: callSetUpPage,
    scheduleInsertLabelUpgrade: scheduleUpgrade,
    dateMax: { mode: 'yearPlus1' },
    keyword: {
      afterAdd(instance, index) {
        callSetUpPage(index);
      }
    },
    authorRequirement: {
      enabled: false
    },
    listed: {
      enabled: true,
      selector: '.listed',
      skipGivenCheck: true
    },
    author: {
      enabled: true,
      buildMarkup: buildMonoviafAuthorMarkup
    },
    download: {
      suffixes: {
        bibframe: '_BIBFRAME'
      },
      extensionOverrides: {
        bibframe: 'xml'
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

  $("input:radio[name=literature]").click(function() {
    const value = $(this).val();
    if (value === 'yes') {
      $('#literature-dropdown').show();
    } else {
      $('#literature-dropdown').hide();
    }
  });
})(window);
