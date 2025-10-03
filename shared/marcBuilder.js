export class MarcBuilder {
  constructor(options = {}) {
    this.options = {
      marcLeaderType: 'nam',
      xmlLeaderType: 'nam',
      leaderRecordLengthPrefix: '01447',
      xmlLeaderRecordLengthPrefix: '01447',
      ...options
    };
  }

  addZeros(content, type) {
    const str = content.toString();
    const length = type === 'length' ? 4 : 5;
    const numZeros = length - str.length;
    return `${'0'.repeat(Math.max(numZeros, 0))}${str}`;
  }

  getByteLength(text) {
    let byteLength = 0;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (c <= '\u007F' && c >= '\u0000') {
        byteLength += 1;
      } else if (c >= '\u0080' && c <= '\u07FF') {
        byteLength += 2;
      } else if (c >= '\u0800' && c <= '\uFFFF') {
        byteLength += 3;
      } else if (c >= '\u10000' && c <= '\u1FFFFF') {
        byteLength += 4;
      }
    }
    return byteLength;
  }

  create008Field(record) {
    if (typeof this.options.create008Field === 'function') {
      return this.options.create008Field.call(this, record);
    }

    const arrayOf008 = new Array(40).fill(' ');
    let timestamp = getTimestamp();
    timestamp = timestamp.substring(2, 8);

    for (let i = 0; i < 6; i++) {
      arrayOf008[i] = timestamp[i];
    }

    let yearOne;
    let yearTwo;
    if (checkExists(record.publication_year) && checkExists(record.copyright_year)) {
      arrayOf008[6] = 't';
      yearOne = record.publication_year;
      yearTwo = record.copyright_year;
    } else if (checkExists(record.publication_year)) {
      arrayOf008[6] = 's';
      yearOne = record.publication_year;
      yearTwo = '    ';
    } else if (checkExists(record.copyright_year)) {
      arrayOf008[6] = 't';
      yearOne = record.copyright_year;
      yearTwo = record.copyright_year;
    } else {
      arrayOf008[6] = 'n';
      yearOne = 'uuuu';
      yearTwo = 'uuuu';
    }

    for (let i = 7; i < 11; i++) {
      arrayOf008[i] = yearOne[i - 7];
    }

    for (let i = 11; i < 15; i++) {
      arrayOf008[i] = yearTwo[i - 11];
    }

    if (checkExists(record.publication_country)) {
      for (let i = 15; i < 15 + record.publication_country.length; i++) {
        arrayOf008[i] = record.publication_country[i - 15];
      }
    } else {
      arrayOf008[15] = 'x';
      arrayOf008[16] = 'x';
    }

    if (checkExists(record.illustrations_yes) && record.illustrations_yes === true) {
      arrayOf008[18] = 'a';
    }

    arrayOf008[29] = '0';
    arrayOf008[30] = '0';
    arrayOf008[31] = '0';

    if (checkExists(record.literature_yes) && checkExists(record.literature_dropdown)) {
      arrayOf008[33] = record.literature_dropdown;
    } else {
      arrayOf008[33] = '0';
    }

    for (let i = 35; i < 38 && checkExists(record.language); i++) {
      arrayOf008[i] = record.language[i - 35];
    }
    arrayOf008[39] = 'd';

    return arrayOf008.join('');
  }

  createSubfield(code, content) {
    return String.fromCharCode(31) + code + content;
  }

  createContent(ind, subfields) {
    let content = String.fromCharCode(30) + ind;
    for (let i = 0; i < subfields.length; i++) {
      content += subfields[i];
    }
    return content;
  }

  createContentFill(tag, ind1, ind2, subfields) {
    if (typeof this.options.createContentFill === 'function') {
      return this.options.createContentFill.call(this, tag, ind1, ind2, subfields);
    }
    return this.createContent(ind1 + ind2, subfields);
  }

  createDirectory(number, content, head) {
    return number + this.addZeros(this.getByteLength(content), 'length') + this.addZeros(head, 'head');
  }

  createMARCXMLSubfield(code, content) {
    const safeContent = typeof escapeXML === 'function' ? escapeXML(content) : content;
    return `    <subfield code="${code}">${safeContent}</subfield>\n`;
  }

  createMARCXMLField(tag, ind1, ind2, subfields) {
    let datafield = `  <datafield tag="${tag}" ind1="${ind1}" ind2="${ind2}">\n`;
    for (let i = 0; i < subfields.length; i++) {
      datafield += subfields[i];
    }
    datafield += '  </datafield>\n';
    return datafield;
  }

  returnSingleEntry(tag, content, head) {
    if (head !== null) {
      const contentDirectory = this.createDirectory(tag, content, head);
      return [contentDirectory, content];
    }
    return content;
  }

  returnMultipleEntries(directory, content, head) {
    if (head !== null) {
      return [directory, content, head];
    }
    return content;
  }

  fillISBN(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.isbn)) {
      const isbn = fieldFunc('020', ' ', ' ', [subfieldFunc('a', record.isbn)]);
      return this.returnSingleEntry('020', isbn, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillAuthor(record, head, fieldFunc, subfieldFunc) {
    const tag = '100';
    const latinIndex = (checkExists(record.author[1]['family']) || checkExists(record.author[1]['given'])) ? 1 : 0;
    const roleIndex = { art: 'artist', aut: 'author', ctb: 'contributor', edt: 'editor', ill: 'illustrator', trl: 'translator' };

    let authorContent = '';
    if (checkExists(record.author[latinIndex]['family']) && checkExists(record.author[latinIndex]['given'])) {
      authorContent = `${record.author[latinIndex]['family']}, ${record.author[latinIndex]['given']},`;
    } else if (checkExists(record.author[latinIndex]['family']) || checkExists(record.author[latinIndex]['given'])) {
      if (checkExists(record.author[latinIndex]['family'])) {
        authorContent = `${record.author[latinIndex]['family']},`;
      } else {
        authorContent = `${record.author[latinIndex]['given']},`;
      }
    } else {
      return head !== null ? ['', ''] : '';
    }

    const authorSubfields = [
      subfieldFunc('a', authorContent),
      subfieldFunc('e', `${roleIndex[record.author[0]['role']]}.`),
      subfieldFunc('4', record.author[0]['role'])
    ];
    if (latinIndex === 1) {
      authorSubfields.push(subfieldFunc('6', '880-03'));
    }
    const author = fieldFunc(tag, '1', ' ', authorSubfields);
    return this.returnSingleEntry(tag, author, head);
  }

  getNonfilingCount(title, lang) {
    if (lang === 'eng') {
      if (title.substring(0, 2) === 'A ') {
        return '2';
      }
      if (title.substring(0, 3) === 'An ') {
        return '3';
      }
      if (title.substring(0, 4) === 'The ') {
        return '4';
      }
      return '0';
    }

    if (title.substring(0, 2) === "L'") {
      return '2';
    }
    if (title.substring(0, 3) === 'Le ' || title.substring(0, 3) === 'La ') {
      return '3';
    }
    if (title.substring(0, 4) === 'Les ') {
      return '4';
    }
    return '0';
  }

  fillTitle(record, head, fieldFunc, subfieldFunc) {
    const tag = '245';
    const hasPersonalAuthor =
      checkExists(record.author) &&
      Array.isArray(record.author) &&
      checkExists(record.author[0]) &&
      (checkExists(record.author[0]['family']) || checkExists(record.author[0]['given']));
    const hasCorporateAuthor =
      checkExists(record.corporate_author) &&
      Array.isArray(record.corporate_author) &&
      checkExists(record.corporate_author[0]) &&
      checkExists(record.corporate_author[0]['corporate']);
    const titleInd1 = (hasPersonalAuthor || hasCorporateAuthor) ? '1' : '0';
    const latinIndex =
      checkExists(record.title) &&
      Array.isArray(record.title) &&
      checkExists(record.title[1]) &&
      (checkExists(record.title[1]['title']) || checkExists(record.title[1]['subtitle']))
        ? 1
        : 0;

    let titleInd2 = '0';
    if ((record.language === 'eng' || record.language === 'fre') &&
      checkExists(record.title) &&
      Array.isArray(record.title) &&
      checkExists(record.title[latinIndex]) &&
      checkExists(record.title[latinIndex]['title'])) {
      titleInd2 = this.getNonfilingCount(record.title[latinIndex]['title'], record.language);
    }

    const titleSubfields = [];
    if (checkExists(record.title) && Array.isArray(record.title) && checkExists(record.title[0]) && checkExists(record.title[0]['subtitle'])) {
      titleSubfields.push(
        subfieldFunc('a', `${record.title[latinIndex]['title']} :`),
        subfieldFunc('b', `${record.title[latinIndex]['subtitle']}.`)
      );
    } else if (checkExists(record.title) && Array.isArray(record.title) && checkExists(record.title[0])) {
      titleSubfields.push(subfieldFunc('a', `${record.title[latinIndex]['title']}.`));
    } else {
      return head !== null ? ['', ''] : '';
    }

    if (latinIndex === 1) {
      titleSubfields.push(subfieldFunc('6', '880-01'));
    }

    const title = fieldFunc(tag, titleInd1, titleInd2, titleSubfields);
    return this.returnSingleEntry(tag, title, head);
  }

  fillEdition(record, head, fieldFunc, subfieldFunc) {
    if (typeof this.options.fillEdition === 'function') {
      return this.options.fillEdition.call(this, record, head, fieldFunc, subfieldFunc);
    }

    const tag = '250';
    if (checkExists(record.edition)) {
      const subfields = [];
      if (checkExists(record.translit_edition)) {
        if (record.translit_edition.substring(record.translit_edition.length - 1) === '.') {
          record.translit_edition = record.translit_edition.substring(0, record.translit_edition.length - 1);
        }
        subfields.push(subfieldFunc('a', `${record.translit_edition}.`));
        subfields.push(subfieldFunc('6', '880-04'));
      } else {
        if (record.edition.substring(record.edition.length - 1) === '.') {
          record.edition = record.edition.substring(0, record.edition.length - 1);
        }
        subfields.push(subfieldFunc('a', `${record.edition}.`));
      }
      const edition = fieldFunc(tag, ' ', ' ', subfields);
      return this.returnSingleEntry(tag, edition, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillPublication(record, head, fieldFunc, subfieldFunc) {
    const tag = '264';
    const pubSubfields = [];

    if (checkExists(record.publication_place)) {
      if (checkExists(record.translit_place)) {
        pubSubfields.push(subfieldFunc('a', `${record.translit_place} :`));
      } else {
        pubSubfields.push(subfieldFunc('a', `${record.publication_place} :`));
      }
    } else {
      pubSubfields.push(subfieldFunc('a', '[Place of publication not identified] :'));
    }

    if (checkExists(record.publisher)) {
      if (checkExists(record.translit_publisher)) {
        pubSubfields.push(subfieldFunc('b', `${record.translit_publisher},`));
      } else {
        pubSubfields.push(subfieldFunc('b', `${record.publisher},`));
      }
    } else {
      pubSubfields.push(subfieldFunc('b', '[publisher not identified],'));
    }

    if (checkExists(record.publication_year)) {
      pubSubfields.push(subfieldFunc('c', `${record.publication_year}.`));
    } else if (checkExists(record.copyright_year)) {
      pubSubfields.push(subfieldFunc('c', `[${record.copyright_year}]`));
    } else {
      pubSubfields.push(subfieldFunc('c', '[date of publication not identified]'));
    }

    if (checkExists(record.translit_publisher) || checkExists(record.translit_place)) {
      pubSubfields.push(subfieldFunc('6', '880-02'));
    }

    const pub = fieldFunc(tag, ' ', '1', pubSubfields);
    return this.returnSingleEntry(tag, pub, head);
  }

  fillCopyright(record, head, fieldFunc, subfieldFunc) {
    const tag = '264';
    if (checkExists(record.copyright_year)) {
      const copyright = fieldFunc(tag, ' ', '4', [subfieldFunc('c', `\u00A9${record.copyright_year}`)]);
      return this.returnSingleEntry(tag, copyright, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillPhysical(record, head, fieldFunc, subfieldFunc) {
    if (typeof this.options.fillPhysical === 'function') {
      return this.options.fillPhysical.call(this, record, head, fieldFunc, subfieldFunc);
    }

    const tag = '300';
    const physicalSubfields = [];
    let pagesString;

    if (record.pages === '0' || record.unpaged || (record.volume_or_page === 'volumes' && record.pages === '1')) {
      pagesString = '1 volume (unpaged)';
    } else if (record.pages === '1') {
      pagesString = '1 page';
    } else {
      pagesString = `${record.pages} ${record.volume_or_page}`;
    }

    if (checkExists(record.illustrations_yes) && record.illustrations_yes === true) {
      physicalSubfields.push(subfieldFunc('a', `${pagesString} :`), subfieldFunc('b', 'illustrations ;'));
    } else {
      physicalSubfields.push(subfieldFunc('a', `${pagesString} ;`));
    }
    physicalSubfields.push(subfieldFunc('c', `${record.dimensions} cm`));

    const physical = fieldFunc(tag, ' ', ' ', physicalSubfields);
    return this.returnSingleEntry(tag, physical, head);
  }

  fillNotes(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.notes)) {
      const notes = fieldFunc('500', ' ', ' ', [subfieldFunc('a', record.notes)]);
      return this.returnSingleEntry('500', notes, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillKeywords(record, head, fieldFunc, subfieldFunc) {
    const tag = '653';
    let keywordsContent = '';
    let keywordsDirectory = '';

    for (let c = 0; c < record.keywords.length; c++) {
      if (record.keywords[c] !== '') {
        const newContent = fieldFunc(tag, ' ', ' ', [subfieldFunc('a', record.keywords[c])]);
        keywordsContent += newContent;
        if (head !== null) {
          const newDirectory = this.createDirectory(tag, newContent, head);
          head += this.getByteLength(newContent);
          keywordsDirectory += newDirectory;
        }
      }
    }

    return this.returnMultipleEntries(keywordsDirectory, keywordsContent, head);
  }

  handleSpecialFAST(fullString, check, separatingCharacter, secondField, fastSubfield, subfieldFunc) {
    const separator = fullString.lastIndexOf(separatingCharacter);
    if (separator !== check) {
      const adjustment = separatingCharacter === '/' ? 1 : 0;
      const first = fullString.substring(0, separator - adjustment);
      const second = fullString.substring(separator).trim();
      fastSubfield.push(subfieldFunc('a', first));
      fastSubfield.push(subfieldFunc(secondField, second));
    } else {
      fastSubfield.push(subfieldFunc('a', fullString));
    }
  }

  fillFAST(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.fast)) {
      let FAST = '';
      let fastDirectory = '';
      for (let i = 0; i < record.fast.length; i++) {
        const contentType = record.fast[i][2].substring(1);
        const fastSubfield = [];
        if (contentType === '00') {
          this.handleSpecialFAST(record.fast[i][0], record.fast[i][0].indexOf(','), ',', 'd', fastSubfield, subfieldFunc);
        } else if (contentType === '30') {
          this.handleSpecialFAST(record.fast[i][0], -1, '.', 'p', fastSubfield, subfieldFunc);
        } else if (contentType === '51') {
          this.handleSpecialFAST(record.fast[i][0], -1, '/', 'z', fastSubfield, subfieldFunc);
        } else {
          fastSubfield.push(subfieldFunc('a', record.fast[i][0]));
        }

        fastSubfield.push(subfieldFunc('2', 'fast'));
        fastSubfield.push(subfieldFunc('0', `(OCoLC)${record.fast[i][1]}`));

        const newContent = fieldFunc(`6${contentType}`, record.fast[i][3], '7', fastSubfield);
        FAST += newContent;

        if (head !== null) {
          const newDirectory = this.createDirectory(`6${contentType}`, newContent, head);
          head += this.getByteLength(newContent);
          fastDirectory += newDirectory;
        }
      }

      return this.returnMultipleEntries(fastDirectory, FAST, head);
    }

    return head !== null ? ['', '', head] : '';
  }

  hasCorporateAuthor(record) {
    return checkExists(record.corporate_author) &&
      Array.isArray(record.corporate_author) &&
      checkExists(record.corporate_author[0]) &&
      checkExists(record.corporate_author[0]['corporate']);
  }

  hasCorporateTransliteration(record) {
    return this.hasCorporateAuthor(record) &&
      checkExists(record.corporate_author[1]) &&
      checkExists(record.corporate_author[1]['corporate']);
  }

  getAdditionalAuthorTranslitBase(record) {
    return this.hasCorporateTransliteration(record) ? 6 : 5;
  }

  countAdditionalAuthorTransliterations(record) {
    if (!checkExists(record.additional_authors)) {
      return 0;
    }
    let count = 0;
    for (let i = 0; i < record.additional_authors.length; i++) {
      const entry = record.additional_authors[i];
      if (!Array.isArray(entry) || !checkExists(entry[1])) {
        continue;
      }
      if (checkExists(entry[1]['family']) || checkExists(entry[1]['given'])) {
        count += 1;
      }
    }
    return count;
  }

  fillAdditionalAuthors(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.additional_authors)) {
      let authors = '';
      let authorsDirectory = '';
      let translitCounter = this.getAdditionalAuthorTranslitBase(record);
      const roleIndex = { art: 'artist', aut: 'author', ctb: 'contributor', edt: 'editor', ill: 'illustrator', trl: 'translator' };

      for (let i = 0; i < record.additional_authors.length; i++) {
        if (checkExists(record.additional_authors[i][0]['family']) || checkExists(record.additional_authors[i][0]['given'])) {
          const latinIndex = (checkExists(record.additional_authors[i][1]['family']) || checkExists(record.additional_authors[i][1]['given'])) ? 1 : 0;
          let authorsContent;
          if (checkExists(record.additional_authors[i][latinIndex]['family']) && checkExists(record.additional_authors[i][latinIndex]['given'])) {
            authorsContent = `${record.additional_authors[i][latinIndex]['family']}, ${record.additional_authors[i][latinIndex]['given']},`;
          } else if (checkExists(record.additional_authors[i][latinIndex]['family']) || checkExists(record.additional_authors[i][latinIndex]['given'])) {
            if (checkExists(record.additional_authors[i][latinIndex]['family'])) {
              authorsContent = `${record.additional_authors[i][latinIndex]['family']},`;
            } else {
              authorsContent = `${record.additional_authors[i][latinIndex]['given']},`;
            }
          }

          const authorsSubfield = [
            subfieldFunc('a', authorsContent),
            subfieldFunc('e', `${roleIndex[record.additional_authors[i][0]['role']]}.`),
            subfieldFunc('4', record.additional_authors[i][0]['role'])
          ];
          if (latinIndex === 1) {
            const translitIndex = translitCounter < 10 ? `0${translitCounter}` : `${translitCounter}`;
            authorsSubfield.push(subfieldFunc('6', `880-${translitIndex}`));
            translitCounter++;
          }
          const newContent = fieldFunc('700', '1', ' ', authorsSubfield);
          authors += newContent;

          if (head !== null) {
            const newDirectory = this.createDirectory('700', newContent, head);
            head += this.getByteLength(newContent);
            authorsDirectory += newDirectory;
          }
        }
      }

      return this.returnMultipleEntries(authorsDirectory, authors, head);
    }
    return head !== null ? ['', '', head] : '';
  }

  fillCorporateAuthor(record, head, fieldFunc, subfieldFunc) {
    const tag = '110';
    if (!this.hasCorporateAuthor(record)) {
      return head !== null ? ['', ''] : '';
    }

    const latinIndex =
      checkExists(record.corporate_author[1]) &&
      checkExists(record.corporate_author[1]['corporate'])
        ? 1
        : 0;

    if (!checkExists(record.corporate_author[latinIndex]) || !checkExists(record.corporate_author[latinIndex]['corporate'])) {
      return head !== null ? ['', ''] : '';
    }

    const roleIndex = { cre: 'creator', ctb: 'contributor' };
    const role = (record.corporate_author[0] && record.corporate_author[0]['role']) || 'cre';
    const authorSubfields = [
      subfieldFunc('a', record.corporate_author[latinIndex]['corporate']),
      subfieldFunc('e', `${roleIndex[role] || 'creator'}.`),
      subfieldFunc('4', role)
    ];

    if (latinIndex === 1) {
      authorSubfields.push(subfieldFunc('6', '880-05'));
    }

    const author = fieldFunc(tag, '1', ' ', authorSubfields);
    return this.returnSingleEntry(tag, author, head);
  }

  fillAdditionalCorporateNames(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.additional_corporate_authors)) {
      return head !== null ? ['', '', head] : '';
    }

    let authors = '';
    let authorsDirectory = '';
    let currentHead = head;
    let translitCounter = this.getAdditionalAuthorTranslitBase(record);

    translitCounter += this.countAdditionalAuthorTransliterations(record);

    const roleIndex = { cre: 'creator', ctb: 'contributor' };

    for (let i = 0; i < record.additional_corporate_authors.length; i++) {
      const corporateSet = record.additional_corporate_authors[i];
      if (!Array.isArray(corporateSet) || !checkExists(corporateSet[0]) || !checkExists(corporateSet[0]['corporate'])) {
        continue;
      }

      const latinIndex =
        checkExists(corporateSet[1]) &&
        checkExists(corporateSet[1]['corporate'])
          ? 1
          : 0;

      const corporateName = corporateSet[latinIndex] && corporateSet[latinIndex]['corporate'];
      if (!checkExists(corporateName)) {
        continue;
      }

      const subfields = [
        subfieldFunc('a', corporateName),
        subfieldFunc('e', `${roleIndex[corporateSet[0]['role']] || 'creator'}.`),
        subfieldFunc('4', corporateSet[0]['role'] || 'cre')
      ];

      if (latinIndex === 1) {
        const translitIndex = translitCounter < 10 ? `0${translitCounter}` : `${translitCounter}`;
        subfields.push(subfieldFunc('6', `880-${translitIndex}`));
        translitCounter++;
      }

      const newContent = fieldFunc('710', '1', ' ', subfields);
      authors += newContent;

      if (currentHead !== null) {
        const newDirectory = this.createDirectory('710', newContent, currentHead);
        currentHead += this.getByteLength(newContent);
        authorsDirectory += newDirectory;
      }
    }

    return this.returnMultipleEntries(authorsDirectory, authors, currentHead);
  }

  fillTranslitCorporateAuthor(record, head, fieldFunc, subfieldFunc) {
    if (!this.hasCorporateTransliteration(record)) {
      return head !== null ? ['', ''] : '';
    }

    const subfields = [
      subfieldFunc('6', '110-05'),
      subfieldFunc('a', record.corporate_author[1]['corporate'])
    ];
    const corporate880 = fieldFunc('880', ' ', ' ', subfields);
    return this.returnSingleEntry('880', corporate880, head);
  }

  fillTranslitAdditionalCorporateNames(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.additional_corporate_authors)) {
      return head !== null ? ['', '', head] : '';
    }

    let authors = '';
    let authorsDirectory = '';
    let currentHead = head;
    let translitCounter = this.getAdditionalAuthorTranslitBase(record);

    translitCounter += this.countAdditionalAuthorTransliterations(record);

    for (let i = 0; i < record.additional_corporate_authors.length; i++) {
      const corporateSet = record.additional_corporate_authors[i];
      if (!Array.isArray(corporateSet) || !checkExists(corporateSet[1]) || !checkExists(corporateSet[1]['corporate'])) {
        continue;
      }

      const translitIndex = translitCounter < 10 ? `0${translitCounter}` : `${translitCounter}`;
      const subfields = [
        subfieldFunc('6', `710-${translitIndex}`),
        subfieldFunc('a', corporateSet[1]['corporate'])
      ];

      const corporate880 = fieldFunc('880', ' ', ' ', subfields);
      authors += corporate880;

      if (currentHead !== null) {
        const newDirectory = this.createDirectory('880', corporate880, currentHead);
        currentHead += this.getByteLength(corporate880);
        authorsDirectory += newDirectory;
      }

      translitCounter++;
    }

    return this.returnMultipleEntries(authorsDirectory, authors, currentHead);
  }

  fillTranslitTitle(record, head, fieldFunc, subfieldFunc) {
    const tag = '880';
    const hasPersonalAuthor =
      checkExists(record.author) &&
      Array.isArray(record.author) &&
      checkExists(record.author[0]) &&
      (checkExists(record.author[0]['family']) || checkExists(record.author[0]['given']));
    const hasCorporateAuthor = this.hasCorporateAuthor(record);
    const titleInd1 = (hasPersonalAuthor || hasCorporateAuthor) ? '1' : '0';

    if (checkExists(record.title[1]['title'])) {
      const translitSubfields = [subfieldFunc('6', '245-01')];
      if (checkExists(record.title[1]['subtitle'])) {
        translitSubfields.push(subfieldFunc('a', `${record.title[0]['title']} :`));
        translitSubfields.push(subfieldFunc('b', `${record.title[0]['subtitle']}.`));
      } else {
        translitSubfields.push(subfieldFunc('a', `${record.title[0]['title']}.`));
      }
      const title880 = fieldFunc(tag, titleInd1, '0', translitSubfields);
      return this.returnSingleEntry(tag, title880, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillTranslitEdition(record, head, fieldFunc, subfieldFunc) {
    const tag = '880';
    if (checkExists(record.translit_edition)) {
      const translitContent = [subfieldFunc('6', '250-04'), subfieldFunc('a', `${record.edition}.`)];
      const edition880 = fieldFunc(tag, ' ', ' ', translitContent);
      return this.returnSingleEntry(tag, edition880, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillTranslitPublisher(record, head, fieldFunc, subfieldFunc) {
    const tag = '880';
    if (checkExists(record.translit_publisher) || checkExists(record.translit_place)) {
      const translitContent = [subfieldFunc('6', '264-02')];

      if (checkExists(record.translit_place)) {
        translitContent.push(subfieldFunc('a', `${record.publication_place} :`));
      }

      if (checkExists(record.translit_publisher)) {
        translitContent.push(subfieldFunc('b', `${record.publisher},`));
      }

      if (checkExists(record.publication_year)) {
        translitContent.push(subfieldFunc('c', `${record.publication_year}.`));
      } else if (checkExists(record.copyright_year)) {
        translitContent.push(subfieldFunc('c', `[${record.copyright_year}]`));
      } else {
        translitContent.push(subfieldFunc('c', '[date of publication not identified]'));
      }

      const publisher880 = fieldFunc(tag, ' ', '1', translitContent);
      return this.returnSingleEntry(tag, publisher880, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillTranslitAuthor(record, head, fieldFunc, subfieldFunc) {
    const tag = '880';
    if (checkExists(record.author[1]['family']) || checkExists(record.author[1]['given'])) {
      const translitContent = [subfieldFunc('6', '100-03')];
      if (checkExists(record.author[0]['family']) && checkExists(record.author[0]['given'])) {
        translitContent.push(subfieldFunc('a', `${record.author[0]['family']}, ${record.author[0]['given']}.`));
      } else if (checkExists(record.author[0]['family'])) {
        translitContent.push(subfieldFunc('a', `${record.author[0]['family']}.`));
      } else {
        translitContent.push(subfieldFunc('a', `${record.author[0]['given']}.`));
      }
      const author880 = fieldFunc(tag, '1', ' ', translitContent);
      return this.returnSingleEntry(tag, author880, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillTranslitAdditionalAuthors(record, head, fieldFunc, subfieldFunc) {
    const tag = '880';
    if (checkExists(record.additional_authors)) {
      let authors880 = '';
      let authors880Directory = '';
      let translitCounter = this.getAdditionalAuthorTranslitBase(record);

      for (let i = 0; i < record.additional_authors.length; i++) {
        if ((checkExists(record.additional_authors[i][1]['family']) || checkExists(record.additional_authors[i][1]['given'])) &&
            (checkExists(record.additional_authors[i][0]['family']) || checkExists(record.additional_authors[i][0]['given']))) {
          let authorsContent;
          if (checkExists(record.additional_authors[i][0]['family']) && checkExists(record.additional_authors[i][0]['given'])) {
            authorsContent = `${record.additional_authors[i][0]['family']}, ${record.additional_authors[i][0]['given']}.`;
          } else if (checkExists(record.additional_authors[i][0]['family'])) {
            authorsContent = `${record.additional_authors[i][0]['family']}.`;
          } else {
            authorsContent = `${record.additional_authors[i][0]['given']}.`;
          }

          const translitIndex = translitCounter < 10 ? `0${translitCounter}` : `${translitCounter}`;
          translitCounter++;

          const newContent = fieldFunc(tag, '1', ' ', [
            subfieldFunc('6', `700-${translitIndex}`),
            subfieldFunc('a', authorsContent)
          ]);
          authors880 += newContent;

          if (head !== null) {
            const newDirectory = this.createDirectory(tag, newContent, head);
            head += this.getByteLength(newContent);
            authors880Directory += newDirectory;
          }
        }
      }

      return this.returnMultipleEntries(authors880Directory, authors880, head);
    }
    return head !== null ? ['', '', head] : '';
  }

  buildMarcLeader(leaderLength, directoryLength) {
    const type = this.options.marcLeaderType || 'nam';
    return `${this.addZeros(leaderLength, 'leader')}${type} a22${this.addZeros(directoryLength, 'leader')}5i 4500`;
  }

  buildXmlLeader() {
    const type = this.options.xmlLeaderType || 'nam';
    const prefix = this.options.xmlLeaderRecordLengthPrefix || '01447';
    return `${prefix}${type} a22003975i 4500`;
  }

  beforeFinalizeMarcText(textParts) {
    if (typeof this.options.beforeFinalizeMarcText === 'function') {
      return this.options.beforeFinalizeMarcText.call(this, textParts);
    }
    return textParts;
  }

  afterBuildMarc(record, institutionInfo, context) {
    if (typeof this.options.afterBuildMarc === 'function') {
      this.options.afterBuildMarc.call(this, record, institutionInfo, context);
    }
  }

  downloadMARC(record, institutionInfo) {
    if (typeof this.options.downloadMARC === 'function') {
      return this.options.downloadMARC.call(this, record, institutionInfo);
    }

    let head = 0;

    const timestampContent = String.fromCharCode(30) + getTimestamp();
    let timestampDirectory = this.createDirectory('005', timestampContent, head);
    head += timestampContent.length;

    const controlfield008Content = String.fromCharCode(30) + this.create008Field(record);
    const controlfield008Directory = this.createDirectory('008', controlfield008Content, head);
    head += controlfield008Content.length;

    const isbn = this.fillISBN(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += isbn[1].length;

    const default1Content = this.createContent('  ', [
      this.createSubfield('a', institutionInfo['marc']),
      this.createSubfield('b', 'eng'),
      this.createSubfield('e', 'rda'),
      this.createSubfield('c', institutionInfo['marc'])
    ]);
    const default1Directory = this.createDirectory('040', default1Content, head);
    head += default1Content.length;

    const author = this.fillAuthor(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(author[1]);

    const corporateAuthor = this.fillCorporateAuthor(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(corporateAuthor[1]);

    const title = this.fillTitle(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(title[1]);

    const edition = this.fillEdition(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(edition[1]);

    const pub = this.fillPublication(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(pub[1]);

    const copyright = this.fillCopyright(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(copyright[1]);

    const physical = this.fillPhysical(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(physical[1]);

    const default2Content = this.createContent('  ', [
      this.createSubfield('a', 'text'),
      this.createSubfield('b', 'txt'),
      this.createSubfield('2', 'rdacontent')
    ]);
    const default2Directory = this.createDirectory('336', default2Content, head);
    head += default2Content.length;

    const default3Content = this.createContent('  ', [
      this.createSubfield('a', 'unmediated'),
      this.createSubfield('b', 'n'),
      this.createSubfield('2', 'rdamedia')
    ]);
    const default3Directory = this.createDirectory('337', default3Content, head);
    head += default3Content.length;

    const default4Content = this.createContent('  ', [
      this.createSubfield('a', 'volume'),
      this.createSubfield('b', 'nc'),
      this.createSubfield('2', 'rdacarrier')
    ]);
    const default4Directory = this.createDirectory('338', default4Content, head);
    head += default4Content.length;

    const notes = this.fillNotes(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(notes[1]);

    const keywords = this.fillKeywords(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = keywords[2];

    const fast = this.fillFAST(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = fast[2];

    const additionalAuthors = this.fillAdditionalAuthors(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = additionalAuthors[2];

    const additionalCorporateNames = this.fillAdditionalCorporateNames(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = additionalCorporateNames[2];

    const title880 = this.fillTranslitTitle(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(title880[1]);

    const edition880 = this.fillTranslitEdition(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(edition880[1]);

    const publisher880 = this.fillTranslitPublisher(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(publisher880[1]);

    const author880 = this.fillTranslitAuthor(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(author880[1]);

    const authors880 = this.fillTranslitAdditionalAuthors(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = authors880[2];

    const corporate880 = this.fillTranslitCorporateAuthor(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(corporate880[1]);

    const additionalCorporate880 = this.fillTranslitAdditionalCorporateNames(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = additionalCorporate880[2];

    const end = String.fromCharCode(30) + String.fromCharCode(29);

    const textParts = [
      timestampDirectory,
      controlfield008Directory,
      isbn[0],
      default1Directory,
      author[0],
      corporateAuthor[0],
      title[0],
      edition[0],
      pub[0],
      copyright[0],
      physical[0],
      default2Directory,
      default3Directory,
      default4Directory,
      notes[0],
      keywords[0],
      fast[0],
      additionalAuthors[0],
      additionalCorporateNames[0],
      title880[0],
      edition880[0],
      publisher880[0],
      author880[0],
      corporate880[0],
      authors880[0],
      additionalCorporate880[0],
      timestampContent,
      controlfield008Content,
      isbn[1],
      default1Content,
      author[1],
      corporateAuthor[1],
      title[1],
      edition[1],
      pub[1],
      copyright[1],
      physical[1],
      default2Content,
      default3Content,
      default4Content,
      notes[1],
      keywords[1],
      fast[1],
      additionalAuthors[1],
      additionalCorporateNames[1],
      title880[1],
      edition880[1],
      publisher880[1],
      author880[1],
      corporate880[1],
      authors880[1],
      additionalCorporate880[1],
      end
    ];

    const finalizedTextParts = this.beforeFinalizeMarcText(textParts, record, institutionInfo, { head });
    const text = finalizedTextParts.join('');

    const leaderLen = this.getByteLength(text) + 24;
    const directoryLen = 25 +
      timestampDirectory.length + controlfield008Directory.length + isbn[0].length + default1Directory.length +
      author[0].length + corporateAuthor[0].length + title[0].length + edition[0].length + pub[0].length + copyright[0].length + physical[0].length +
      default2Directory.length + default3Directory.length + default4Directory.length + notes[0].length + keywords[0].length +
      fast[0].length + additionalAuthors[0].length + additionalCorporateNames[0].length + title880[0].length + edition880[0].length + publisher880[0].length +
      author880[0].length + corporate880[0].length + authors880[0].length + additionalCorporate880[0].length;

    const leader = this.buildMarcLeader(leaderLen, directoryLen);
    this.afterBuildMarc(record, institutionInfo, { leader, text });
    downloadFile(leader + text, 'mrc');
  }

  downloadXML(record, institutionInfo) {
    if (typeof this.options.downloadXML === 'function') {
      return this.options.downloadXML.call(this, record, institutionInfo);
    }

    let text = '<?xml version="1.0" encoding="utf-8"?>\n';
    text += '<record xmlns="http://www.loc.gov/MARC21/slim">\n';
    text += `  <leader>${this.buildXmlLeader()}</leader>\n`;

    const formattedDate = getTimestamp();
    text += `  <controlfield tag="005">${formattedDate}</controlfield>\n`;

    const controlfield008 = this.create008Field(record);
    text += `  <controlfield tag="008">${controlfield008}</controlfield>\n`;

    text += this.createMARCXMLField('040', ' ', ' ', [
      this.createMARCXMLSubfield('a', institutionInfo['marc']),
      this.createMARCXMLSubfield('b', 'eng'),
      this.createMARCXMLSubfield('e', 'rda'),
      this.createMARCXMLSubfield('c', institutionInfo['marc'])
    ]);
    text += this.fillISBN(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillCorporateAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTitle(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillEdition(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillPublication(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillCopyright(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillPhysical(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.createMARCXMLField('336', ' ', ' ', [
      this.createMARCXMLSubfield('a', 'text'),
      this.createMARCXMLSubfield('b', 'txt'),
      this.createMARCXMLSubfield('2', 'rdacontent')
    ]);
    text += this.createMARCXMLField('337', ' ', ' ', [
      this.createMARCXMLSubfield('a', 'unmediated'),
      this.createMARCXMLSubfield('b', 'n'),
      this.createMARCXMLSubfield('2', 'rdamedia')
    ]);
    text += this.createMARCXMLField('338', ' ', ' ', [
      this.createMARCXMLSubfield('a', 'volume'),
      this.createMARCXMLSubfield('b', 'nc'),
      this.createMARCXMLSubfield('2', 'rdacarrier')
    ]);
    text += this.fillNotes(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillKeywords(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillFAST(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAdditionalAuthors(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAdditionalCorporateNames(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitTitle(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitEdition(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitPublisher(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitCorporateAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitAdditionalAuthors(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitAdditionalCorporateNames(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += '</record>\n';

    downloadFile(text, 'xml');
  }
}
