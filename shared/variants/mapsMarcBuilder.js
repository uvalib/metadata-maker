import { MarcBuilder } from '../marcBuilder.js';

export class MapsMarcBuilder extends MarcBuilder {
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

  fillCorporateAuthor(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.corporate_author)) {
      return head !== null ? ['', ''] : '';
    }

    const corporateArray = Array.isArray(record.corporate_author)
      ? record.corporate_author
      : [record.corporate_author];
    const primary = corporateArray[0] || {};
    const translitEntry = corporateArray[1];
    const latinIndex = checkExists(translitEntry) && checkExists(translitEntry['corporate']) ? 1 : 0;
    const entry = corporateArray[latinIndex] || primary;

    if (!checkExists(entry) || !checkExists(entry['corporate'])) {
      return head !== null ? ['', ''] : '';
    }

    const roleIndex = { cre: 'creator', ctb: 'contributor' };
    const role = primary['role'] || 'cre';
    const subfields = [
      subfieldFunc('a', entry['corporate']),
      subfieldFunc('e', `${roleIndex[role] || 'creator'}.`),
      subfieldFunc('4', role)
    ];

    if (latinIndex === 1) {
      subfields.push(subfieldFunc('6', '880-04'));
    }

    const author = fieldFunc('110', '1', ' ', subfields);
    return this.returnSingleEntry('110', author, head);
  }

  fillScale(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.scale)) {
      const scale = fieldFunc('255', ' ', ' ', [subfieldFunc('a', record.scale)]);
      return this.returnSingleEntry('255', scale, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillPhysical(record, head, fieldFunc, subfieldFunc) {
    const subfields = [];

    if (checkExists(record.color)) {
      subfields.push(subfieldFunc('a', '1 map :'));
      subfields.push(subfieldFunc('b', `${record.color} ;`));
    } else {
      subfields.push(subfieldFunc('a', '1 map ;'));
    }

    if (checkExists(record.dimensions)) {
      subfields.push(subfieldFunc('c', `${record.dimensions} cm`));
    }

    if (subfields.length === 0) {
      return head !== null ? ['', ''] : '';
    }

    const physical = fieldFunc('300', ' ', ' ', subfields);
    return this.returnSingleEntry('300', physical, head);
  }

  fillDescription(record, head, fieldFunc, subfieldFunc) {
    if (checkExists(record.description)) {
      const description = fieldFunc('500', ' ', ' ', [subfieldFunc('a', record.description)]);
      return this.returnSingleEntry('500', description, head);
    }
    return head !== null ? ['', ''] : '';
  }

  fillAdditionalCorporateAuthors(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.additional_corporate_authors)) {
      return head !== null ? ['', '', head] : '';
    }

    let authors = '';
    let directory = '';
    let translitCounter = 5;
    if (checkExists(record.additional_authors)) {
      translitCounter += record.additional_authors.length;
    }

    const roleIndex = { cre: 'creator', ctb: 'contributor' };

    for (let i = 0; i < record.additional_corporate_authors.length; i++) {
      const corpEntry = record.additional_corporate_authors[i];
      if (!checkExists(corpEntry) || !checkExists(corpEntry[0]) || !checkExists(corpEntry[0]['corporate'])) {
        continue;
      }

      const latinIndex = checkExists(corpEntry[1]) && checkExists(corpEntry[1]['corporate']) ? 1 : 0;
      const role = corpEntry[0]['role'] || 'cre';
      const subfields = [
        subfieldFunc('a', corpEntry[latinIndex]['corporate']),
        subfieldFunc('e', `${roleIndex[role] || 'creator'}.`),
        subfieldFunc('4', role)
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
        directory += newDirectory;
      }
    }

    return this.returnMultipleEntries(directory, authors, head);
  }

  fillTranslitCorporateAuthor(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.corporate_author)) {
      return head !== null ? ['', ''] : '';
    }

    const corporateArray = Array.isArray(record.corporate_author)
      ? record.corporate_author
      : [record.corporate_author];
    const translitEntry = corporateArray[1];

    if (!checkExists(translitEntry) || !checkExists(translitEntry['corporate'])) {
      return head !== null ? ['', ''] : '';
    }

    const content = fieldFunc('880', '1', ' ', [
      subfieldFunc('6', '110-04'),
      subfieldFunc('a', translitEntry['corporate'])
    ]);

    return this.returnSingleEntry('880', content, head);
  }

  fillTranslitAdditionalCorporateAuthors(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.additional_corporate_authors)) {
      return head !== null ? ['', '', head] : '';
    }

    let authors880 = '';
    let directory880 = '';
    let translitCounter = 5;
    if (checkExists(record.additional_authors)) {
      translitCounter += record.additional_authors.length;
    }

    for (let i = 0; i < record.additional_corporate_authors.length; i++) {
      const corpEntry = record.additional_corporate_authors[i];
      if (!checkExists(corpEntry) || !checkExists(corpEntry[1]) || !checkExists(corpEntry[1]['corporate'])) {
        continue;
      }

      const baseEntry = corpEntry[0];
      if (!checkExists(baseEntry) || !checkExists(baseEntry['corporate'])) {
        continue;
      }

      const translitIndex = translitCounter < 10 ? `0${translitCounter}` : `${translitCounter}`;
      translitCounter++;

      const newContent = fieldFunc('880', '1', ' ', [
        subfieldFunc('6', `710-${translitIndex}`),
        subfieldFunc('a', baseEntry['corporate'])
      ]);
      authors880 += newContent;

      if (head !== null) {
        const newDirectory = this.createDirectory('880', newContent, head);
        head += this.getByteLength(newContent);
        directory880 += newDirectory;
      }
    }

    return this.returnMultipleEntries(directory880, authors880, head);
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

    const isbn = this.fillISBN(record, head, contentFill, subfield);
    head += this.getByteLength(isbn[1]);

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

    const edition = this.fillEdition(record, head, contentFill, subfield);
    head += this.getByteLength(edition[1]);

    const scale = this.fillScale(record, head, contentFill, subfield);
    head += this.getByteLength(scale[1]);

    const pub = this.fillPublication(record, head, contentFill, subfield);
    head += this.getByteLength(pub[1]);

    const copyright = this.fillCopyright(record, head, contentFill, subfield);
    head += this.getByteLength(copyright[1]);

    const physical = this.fillPhysical(record, head, contentFill, subfield);
    head += this.getByteLength(physical[1]);

    const default3Content = this.createContent('  ', [
      subfield('a', 'cartographic image'),
      subfield('b', 'cri'),
      subfield('2', 'rdacontent')
    ]);
    const default3Directory = this.createDirectory('336', default3Content, head);
    head += default3Content.length;

    const default4Content = this.createContent('  ', [
      subfield('a', 'unmediated'),
      subfield('b', 'n'),
      subfield('2', 'rdamedia')
    ]);
    const default4Directory = this.createDirectory('337', default4Content, head);
    head += default4Content.length;

    const default5Content = this.createContent('  ', [
      subfield('a', 'sheet'),
      subfield('b', 'nb'),
      subfield('2', 'rdacarrier')
    ]);
    const default5Directory = this.createDirectory('338', default5Content, head);
    head += default5Content.length;

    const description = this.fillDescription(record, head, contentFill, subfield);
    head += this.getByteLength(description[1]);

    const notes = this.fillNotes(record, head, contentFill, subfield);
    head += this.getByteLength(notes[1]);

    const keywords = this.fillKeywords(record, head, contentFill, subfield);
    head = keywords[2];

    const fast = this.fillFAST(record, head, contentFill, subfield);
    head = fast[2];

    const additionalAuthors = this.fillAdditionalAuthors(record, head, contentFill, subfield);
    head = additionalAuthors[2];

    const additionalCorporateAuthors = this.fillAdditionalCorporateAuthors(record, head, contentFill, subfield);
    head = additionalCorporateAuthors[2];

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
      isbn[0],
      default1Directory,
      author[0],
      corporateAuthor[0],
      title[0],
      edition[0],
      scale[0],
      pub[0],
      copyright[0],
      physical[0],
      default3Directory,
      default4Directory,
      default5Directory,
      description[0],
      notes[0],
      keywords[0],
      fast[0],
      additionalAuthors[0],
      additionalCorporateAuthors[0],
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
      isbn[1],
      default1Content,
      author[1],
      corporateAuthor[1],
      title[1],
      edition[1],
      scale[1],
      pub[1],
      copyright[1],
      physical[1],
      default3Content,
      default4Content,
      default5Content,
      description[1],
      notes[1],
      keywords[1],
      fast[1],
      additionalAuthors[1],
      additionalCorporateAuthors[1],
      title880[1],
      publisher880[1],
      author880[1],
      corporate880[1],
      authors880[1],
      corporations880[1],
      end
    ];

    const textParts = this.beforeFinalizeMarcText([...directoryParts, ...contentParts], record, institutionInfo, { head });
    const text = textParts.join('');

    const leaderLen = this.getByteLength(text) + 24;
    const directoryLen = 25 + directoryParts.reduce((sum, part) => sum + part.length, 0);
    const leader = this.buildMarcLeader(leaderLen, directoryLen);

    this.afterBuildMarc(record, institutionInfo, { leader, text });
    downloadFile(leader + text, 'mrc');
  }

  downloadXML(record, institutionInfo) {
    let text = '<?xml version="1.0" encoding="utf-8"?>\n';
    text += '<record xmlns="http://www.loc.gov/MARC21/slim" xsi:schemaLocation="http://www.loc.gov/MARC21/slim http://www.loc.gov/standards/marcxml/schema/MARC21slim.xsd" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance">\n';
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
    text += this.fillISBN(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillCorporateAuthor(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillTitle(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillEdition(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillScale(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillPublication(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillCopyright(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillPhysical(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.createMARCXMLField('336', ' ', ' ', [
      this.createMARCXMLSubfield('a', 'cartographic image'),
      this.createMARCXMLSubfield('b', 'cri'),
      this.createMARCXMLSubfield('2', 'rdacontent')
    ]);
    text += this.createMARCXMLField('337', ' ', ' ', [
      this.createMARCXMLSubfield('a', 'unmediated'),
      this.createMARCXMLSubfield('b', 'n'),
      this.createMARCXMLSubfield('2', 'rdamedia')
    ]);
    text += this.createMARCXMLField('338', ' ', ' ', [
      this.createMARCXMLSubfield('a', 'sheet'),
      this.createMARCXMLSubfield('b', 'nb'),
      this.createMARCXMLSubfield('2', 'rdacarrier')
    ]);
    text += this.fillDescription(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillNotes(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillKeywords(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillFAST(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAdditionalAuthors(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAdditionalCorporateAuthors(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
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
