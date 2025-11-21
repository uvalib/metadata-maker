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

  // Replace jQuery reset handler
  document.addEventListener('click', (event) => {
    if (event.target.type === 'reset') {
      // Allow the reset to happen first, then sync
      setTimeout(syncCounters, 0);
    }
  });


  const diacritics = base.createDiacriticsHelper({
    scheduleInsertLabelUpgrade: scheduleUpgrade
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
  global.insertChar = diacritics.insertChar;
  global.insertMenu = diacritics.insertMenu;

  // Handle Literature radio buttons
  const literatureRadios = document.querySelectorAll("input[type='radio'][name='literature']");
  literatureRadios.forEach(radio => {
    radio.addEventListener('click', function () {
      const value = this.value;
      const dropdown = document.getElementById('literature-dropdown');
      if (dropdown) {
        if (value === 'yes') {
          dropdown.style.display = 'block';
        } else {
          dropdown.style.display = 'none';
        }
      }
    });
  });

  // Handle Level select change to show/hide "Other level" input
  const levelSelect = document.getElementById("level");
  if (levelSelect) {
    levelSelect.addEventListener('change', function () {
      const value = this.value;
      const otherLevelBlock = document.getElementById('other-level-block');
      const otherLevelInput = document.getElementById('other_level');

      if (otherLevelBlock && otherLevelInput) {
        if (value === 'otherlevel') {
          otherLevelBlock.classList.remove('hidden');
          otherLevelBlock.style.display = 'block';
          otherLevelInput.required = true;
          otherLevelInput.classList.add('required');
        } else {
          otherLevelBlock.classList.add('hidden');
          otherLevelBlock.style.display = 'none';
          otherLevelInput.required = false;
          otherLevelInput.classList.remove('required');
          otherLevelInput.value = '';
        }
      }
    });
  }
})(window);
