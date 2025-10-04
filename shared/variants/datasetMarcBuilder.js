import { MarcBuilder } from '../marcBuilder.js';

export class DatasetMarcBuilder extends MarcBuilder {
  constructor(options = {}) {
    super({
      marcLeaderType: 'mam',
      xmlLeaderType: 'mam',
      ...options
    });
  }

  create008Field(record) {
    const base = super.create008Field(record).split('');
    base[26] = 'j';
    return base.join('');
  }

  fillTitle(record, head, fieldFunc, subfieldFunc) {
    const tag = '245';
    const hasAuthor =
      (checkExists(record.author) &&
        checkExists(record.author[0]) &&
        (checkExists(record.author[0]['family']) || checkExists(record.author[0]['given']))) ||
      (checkExists(record.corporate_author) &&
        checkExists(record.corporate_author[0]) &&
        checkExists(record.corporate_author[0]['corporate']));

    const titleInd1 = hasAuthor ? '1' : '0';
    const latinIndex =
      checkExists(record.title) &&
      checkExists(record.title[1]) &&
      (checkExists(record.title[1]['title']) || checkExists(record.title[1]['subtitle']))
        ? 1
        : 0;

    let titleInd2 = '0';
    if (record.language === 'eng' || record.language === 'fre') {
      titleInd2 = this.getNonfilingCount(record.title[latinIndex]['title'], record.language);
    }

    const titleSubfields = [];
    if (checkExists(record.title[0]['subtitle'])) {
      titleSubfields.push(
        subfieldFunc('a', `${record.title[latinIndex]['title']} :`),
        subfieldFunc('b', `${record.title[latinIndex]['subtitle']}.`)
      );
    } else {
      titleSubfields.push(subfieldFunc('a', `${record.title[latinIndex]['title']}.`));
    }

    if (latinIndex === 1) {
      titleSubfields.push(subfieldFunc('6', '880-01'));
    }

    const title = fieldFunc(tag, titleInd1, titleInd2, titleSubfields);
    return this.returnSingleEntry(tag, title, head);
  }

  fillCorporateAuthor(record, head, fieldFunc, subfieldFunc) {
    const tag = '110';
    if (!checkExists(record.corporate_author) || !checkExists(record.corporate_author[0])) {
      return head !== null ? ['', ''] : '';
    }

    const latinIndex =
      checkExists(record.corporate_author[1]) &&
      checkExists(record.corporate_author[1]['corporate'])
        ? 1
        : 0;

    if (!checkExists(record.corporate_author[latinIndex]['corporate'])) {
      return head !== null ? ['', ''] : '';
    }

    const roleIndex = { cre: 'creator', ctb: 'contributor' };
    const role = record.corporate_author[0]['role'] || 'cre';
    const authorSubfields = [
      subfieldFunc('a', record.corporate_author[latinIndex]['corporate']),
      subfieldFunc('e', `${roleIndex[role] || 'creator'}.`),
      subfieldFunc('4', role)
    ];

    if (latinIndex === 1) {
      authorSubfields.push(subfieldFunc('6', '880-04'));
    }

    const author = fieldFunc(tag, '1', ' ', authorSubfields);
    return this.returnSingleEntry(tag, author, head);
  }

  fillSize(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.size)) {
      const size = fieldFunc('300', ' ', ' ', [subfieldFunc('a', record.size)]);
      return this.returnSingleEntry('300', size, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillDateCollected(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.datecollected)) {
      const dateCollected = fieldFunc('500', ' ', ' ', [subfieldFunc('a', `Data was collected in ${record.datecollected}.`)]);
      return this.returnSingleEntry('500', dateCollected, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillAccessTerms(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.access_terms)) {
      const accessTerms = fieldFunc('506', ' ', ' ', [subfieldFunc('a', record.access_terms)]);
      return this.returnSingleEntry('506', accessTerms, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillGeographicCoverage(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.gcoverage)) {
      const coverage = fieldFunc('522', ' ', ' ', [subfieldFunc('a', record.gcoverage)]);
      return this.returnSingleEntry('522', coverage, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillFormat(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.format)) {
      const format = fieldFunc('538', ' ', ' ', [subfieldFunc('a', `Data in ${record.format} format.`)]);
      return this.returnSingleEntry('538', format, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillUseTerms(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.use_terms)) {
      const useTerms = fieldFunc('540', ' ', ' ', [subfieldFunc('a', record.use_terms)]);
      return this.returnSingleEntry('540', useTerms, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillDateRange(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.daterange)) {
      const dateRange = fieldFunc('648', ' ', '0', [subfieldFunc('a', record.daterange)]);
      return this.returnSingleEntry('648', dateRange, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillWebURL(record, head, fieldFunc, subfieldFunc) {
    const webUrl = fieldFunc('856', '4', '0', [subfieldFunc('u', record.web_url)]);
    return this.returnSingleEntry('856', webUrl, head);
  }

  fillAdditionalCorporateNames(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.additional_corporate_names)) {
      return head !== null ? ['', '', head] : '';
    }

    let authors = '';
    let authorsDirectory = '';
    let translitCounter = 5;
    if (checkExists(record.additional_authors)) {
      translitCounter += record.additional_authors.length;
    }

    const roleIndex = { cre: 'creator', ctb: 'contributor' };

    for (let i = 0; i < record.additional_corporate_names.length; i++) {
      const corporateSet = record.additional_corporate_names[i];
      if (!checkExists(corporateSet) || !checkExists(corporateSet[0]) || !checkExists(corporateSet[0]['corporate'])) {
        continue;
      }

      const latinIndex = checkExists(corporateSet[1]) && checkExists(corporateSet[1]['corporate']) ? 1 : 0;
      const subfields = [
        subfieldFunc('a', corporateSet[latinIndex]['corporate']),
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

      if (head !== null) {
        const newDirectory = this.createDirectory('710', newContent, head);
        head += this.getByteLength(newContent);
        authorsDirectory += newDirectory;
      }
    }

    return this.returnMultipleEntries(authorsDirectory, authors, head);
  }

  fillTranslitCorporateAuthor(record, head, fieldFunc, subfieldFunc) {
    if (
      !checkExists(record.corporate_author) ||
      !checkExists(record.corporate_author[1]) ||
      !checkExists(record.corporate_author[1]['corporate'])
    ) {
      return head !== null ? ['', ''] : '';
    }

    const content = fieldFunc('880', '1', ' ', [
      subfieldFunc('6', '110-04'),
      subfieldFunc('a', record.corporate_author[1]['corporate'])
    ]);
    return this.returnSingleEntry('880', content, head);
  }

  fillTranslitAdditionalCorporateAuthors(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.additional_corporate_names)) {
      return head !== null ? ['', '', head] : '';
    }

    let authors880 = '';
    let authors880Directory = '';
    let translitCounter = 5;
    if (checkExists(record.additional_authors)) {
      translitCounter += record.additional_authors.length;
    }

    for (let i = 0; i < record.additional_corporate_names.length; i++) {
      const corporateSet = record.additional_corporate_names[i];
      if (!checkExists(corporateSet) || !checkExists(corporateSet[1]) || !checkExists(corporateSet[1]['corporate'])) {
        continue;
      }

      const authorsContent = corporateSet[0]['corporate'];
      const translitIndex = translitCounter < 10 ? `0${translitCounter}` : `${translitCounter}`;
      translitCounter++;

      const newContent = fieldFunc('880', '1', ' ', [
        subfieldFunc('6', `710-${translitIndex}`),
        subfieldFunc('a', authorsContent)
      ]);
      authors880 += newContent;

      if (head !== null) {
        const newDirectory = this.createDirectory('880', newContent, head);
        head += this.getByteLength(newContent);
        authors880Directory += newDirectory;
      }
    }

    return this.returnMultipleEntries(authors880Directory, authors880, head);
  }

  downloadMARC(record, institutionInfo) {
    let head = 0;
    const contentFill = this.createContentFill.bind(this);
    const subfield = this.createSubfield.bind(this);

    const timestampContent = String.fromCharCode(30) + getTimestamp();
    const timestampDirectory = this.createDirectory('005', timestampContent, head);
    head += timestampContent.length;

    const controlfield008Content = String.fromCharCode(30) + this.create008Field(record);
    const controlfield008Directory = this.createDirectory('008', controlfield008Content, head);
    head += controlfield008Content.length;

    const default1Content = this.createContent('  ', [
      subfield('a', institutionInfo['marc']),
      subfield('b', 'eng'),
      subfield('e', 'rda'),
      subfield('c', institutionInfo['marc'])
    ]);
    const default1Directory = this.createDirectory('040', default1Content, head);
    head += default1Content.length;

    const author = this.fillAuthor(record, head, contentFill, subfield);
    head += this.getByteLength(author[1]);

    const corporateAuthor = this.fillCorporateAuthor(record, head, contentFill, subfield);
    head += this.getByteLength(corporateAuthor[1]);

    const title = this.fillTitle(record, head, contentFill, subfield);
    head += this.getByteLength(title[1]);

    const pub = this.fillPublication(record, head, contentFill, subfield);
    head += this.getByteLength(pub[1]);

    const copyright = this.fillCopyright(record, head, contentFill, subfield);
    head += this.getByteLength(copyright[1]);

    const size = this.fillSize(record, head, contentFill, subfield);
    head += this.getByteLength(size[1]);

    const default2Content = this.createContent('  ', [subfield('a', '1 data file')]);
    const default2Directory = this.createDirectory('300', default2Content, head);
    head += default2Content.length;

    const default3Content = this.createContent('  ', [
      subfield('a', 'computer dataset'),
      subfield('b', 'cod'),
      subfield('2', 'rdacontent')
    ]);
    const default3Directory = this.createDirectory('336', default3Content, head);
    head += default3Content.length;

    const default4Content = this.createContent('  ', [
      subfield('a', 'computer'),
      subfield('b', 'c'),
      subfield('2', 'rdamedia')
    ]);
    const default4Directory = this.createDirectory('337', default4Content, head);
    head += default4Content.length;

    const default5Content = this.createContent('  ', [
      subfield('a', 'online resource'),
      subfield('b', 'cr'),
      subfield('2', 'rdacarrier')
    ]);
    const default5Directory = this.createDirectory('338', default5Content, head);
    head += default5Content.length;

    const contents = this.fillContents(record, head, contentFill, subfield);
    head += this.getByteLength(contents[1]);

    const notes = this.fillNotes(record, head, contentFill, subfield);
    head += this.getByteLength(notes[1]);

    const dateCollected = this.fillDateCollected(record, head, contentFill, subfield);
    head += this.getByteLength(dateCollected[1]);

    const accessTerms = this.fillAccessTerms(record, head, contentFill, subfield);
    head += this.getByteLength(accessTerms[1]);

    const geographicCoverage = this.fillGeographicCoverage(record, head, contentFill, subfield);
    head += this.getByteLength(geographicCoverage[1]);

    const fileFormat = this.fillFormat(record, head, contentFill, subfield);
    head += this.getByteLength(fileFormat[1]);

    const useTerms = this.fillUseTerms(record, head, contentFill, subfield);
    head += this.getByteLength(useTerms[1]);

    const dateRange = this.fillDateRange(record, head, contentFill, subfield);
    head += this.getByteLength(dateRange[1]);

    const default7Content = this.createContent('  ', [subfield('a', 'Mode of access: World Wide Web.')]);
    const default7Directory = this.createDirectory('538', default7Content, head);
    head += default7Content.length;

    const keywords = this.fillKeywords(record, head, contentFill, subfield);
    head = keywords[2];

    const default8Content = this.createContent(' 4', [subfield('a', 'Online databases')]);
    const default8Directory = this.createDirectory('655', default8Content, head);
    head += default8Content.length;

    const fast = this.fillFAST(record, head, contentFill, subfield);
    head = fast[2];

    const additionalAuthors = this.fillAdditionalAuthors(record, head, contentFill, subfield);
    head = additionalAuthors[2];

    const additionalCorporateAuthors = this.fillAdditionalCorporateNames(record, head, contentFill, subfield);
    head = additionalCorporateAuthors[2];

    const webUrl = this.fillWebURL(record, head, contentFill, subfield);
    head += this.getByteLength(webUrl[1]);

    const title880 = this.fillTranslitTitle(record, head, contentFill, subfield);
    head += this.getByteLength(title880[1]);

    const publisher880 = this.fillTranslitPublisher(record, head, contentFill, subfield);
    head += this.getByteLength(publisher880[1]);

    const author880 = this.fillTranslitAuthor(record, head, contentFill, subfield);
    head += this.getByteLength(author880[1]);

    const corporate880 = this.fillTranslitCorporateAuthor(record, head, contentFill, subfield);
    head += this.getByteLength(corporate880[1]);

    const authors880 = this.fillTranslitAdditionalAuthors(record, head, contentFill, subfield);
    head = authors880[2];

    const corporations880 = this.fillTranslitAdditionalCorporateAuthors(record, head, contentFill, subfield);
    head = corporations880[2];

    const end = String.fromCharCode(30) + String.fromCharCode(29);

    const directoryParts = [
      timestampDirectory,
      controlfield008Directory,
      default1Directory,
      author[0],
      corporateAuthor[0],
      title[0],
      pub[0],
      copyright[0],
      size[0],
      default2Directory,
      default3Directory,
      default4Directory,
      default5Directory,
      contents[0],
      notes[0],
      dateCollected[0],
      accessTerms[0],
      geographicCoverage[0],
      fileFormat[0],
      useTerms[0],
      dateRange[0],
      default7Directory,
      keywords[0],
      default8Directory,
      fast[0],
      additionalAuthors[0],
      additionalCorporateAuthors[0],
      webUrl[0],
      title880[0],
      publisher880[0],
      author880[0],
      corporate880[0],
      authors880[0],
      corporations880[0]
    ];

    const contentParts = [
      timestampContent,
      controlfield008Content,
      default1Content,
      author[1],
      corporateAuthor[1],
      title[1],
      pub[1],
      copyright[1],
      size[1],
      default2Content,
      default3Content,
      default4Content,
      default5Content,
      contents[1],
      notes[1],
      dateCollected[1],
      accessTerms[1],
      geographicCoverage[1],
      fileFormat[1],
      useTerms[1],
      dateRange[1],
      default7Content,
      keywords[1],
      default8Content,
      fast[1],
      additionalAuthors[1],
      additionalCorporateAuthors[1],
      webUrl[1],
      title880[1],
      publisher880[1],
      author880[1],
      corporate880[1],
      authors880[1],
      corporations880[1],
      end
    ];

    const textParts = [...directoryParts, ...contentParts];
    const finalizedTextParts = this.beforeFinalizeMarcText(textParts, record, institutionInfo, { head });
    const text = finalizedTextParts.join('');

    const directoryLen = 25 + directoryParts.reduce((sum, part) => sum + part.length, 0);
    const leaderLen = this.getByteLength(text) + 24;
    const leader = this.buildMarcLeader(leaderLen, directoryLen);

    this.afterBuildMarc(record, institutionInfo, { leader, text });
    downloadFile(leader + text, 'mrc');
  }

  downloadXML(record, institutionInfo) {
    let text = '<?xml version="1.0" encoding="utf-8"?>\n';
    text += '<record xmlns="http://www.loc.gov/MARC21/slim">\n';
    text += `  <leader>${this.buildXmlLeader()}</leader>\n`;

    const formattedDate = getTimestamp();
    text += `  <controlfield tag="005">${formattedDate}</controlfield>\n`;
    text += `  <controlfield tag="008">${this.create008Field(record)}</controlfield>\n`;

    text += this.createMARCXMLField('040', ' ', ' ', [
      this.createMARCXMLSubfield('a', institutionInfo['marc']),
      this.createMARCXMLSubfield('b', 'eng'),
      this.createMARCXMLSubfield('e', 'rda'),
      this.createMARCXMLSubfield('c', institutionInfo['marc'])
    ]);
    text += this.fillAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillCorporateAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTitle(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillPublication(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillCopyright(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillSize(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.createMARCXMLField('300', ' ', ' ', [
      this.createMARCXMLSubfield('a', '1 data file')
    ]);
    text += this.createMARCXMLField('336', ' ', ' ', [
      this.createMARCXMLSubfield('a', 'computer dataset'),
      this.createMARCXMLSubfield('b', 'cod'),
      this.createMARCXMLSubfield('2', 'rdacontent')
    ]);
    text += this.createMARCXMLField('337', ' ', ' ', [
      this.createMARCXMLSubfield('a', 'computer'),
      this.createMARCXMLSubfield('b', 'c'),
      this.createMARCXMLSubfield('2', 'rdamedia')
    ]);
    text += this.createMARCXMLField('338', ' ', ' ', [
      this.createMARCXMLSubfield('a', 'online resource'),
      this.createMARCXMLSubfield('b', 'cr'),
      this.createMARCXMLSubfield('2', 'rdacarrier')
    ]);
    text += this.fillContents(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillNotes(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillDateCollected(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAccessTerms(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillGeographicCoverage(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillFormat(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillUseTerms(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillDateRange(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.createMARCXMLField('538', ' ', ' ', [
      this.createMARCXMLSubfield('a', 'Mode of access: World Wide Web.')
    ]);
    text += this.fillKeywords(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.createMARCXMLField('655', ' ', '4', [
      this.createMARCXMLSubfield('a', 'Online databases')
    ]);
    text += this.fillFAST(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAdditionalAuthors(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAdditionalCorporateNames(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillWebURL(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitTitle(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitPublisher(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitCorporateAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitAdditionalAuthors(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTranslitAdditionalCorporateAuthors(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += '</record>\n';

    downloadFile(text, 'xml');
  }
}
