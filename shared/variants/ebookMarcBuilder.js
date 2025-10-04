import { MarcBuilder } from '../marcBuilder.js';

export class EbookMarcBuilder extends MarcBuilder {
  create006Field() {
    const field = new Array(18).fill(' ');
    field[0] = 'm';
    field[6] = 'o';
    field[9] = 'd';
    return field.join('');
  }

  create007Field() {
    const field = new Array(14).fill('|');
    field[0] = 'c';
    field[1] = 'r';
    field[3] = 'c';
    field[4] = 'n';
    return field.join('');
  }

  create008Field(record) {
    const base = super.create008Field(record).split('');
    base[23] = 'o';
    return base.join('');
  }

  fillPhysical(record, head, fieldFunc, subfieldFunc) {
    const tag = '300';
    const pagesString = '1 online resource';
    const subfields = [];

    if (checkExists(record.illustrations_yes) && record.illustrations_yes === true) {
      subfields.push(subfieldFunc('a', `${pagesString} :`));
      subfields.push(subfieldFunc('b', 'illustrations ;'));
    } else {
      subfields.push(subfieldFunc('a', `${pagesString} ;`));
    }

    const physical = fieldFunc(tag, ' ', ' ', subfields);
    return this.returnSingleEntry(tag, physical, head);
  }

  fillSubjectCategory(record, head, fieldFunc, subfieldFunc) {
    const tag = '072';

    if (record.subjects.length > 0) {
      let categoriesContent = '';
      let categoriesDirectory = '';
      for (let index = 0; index < record.subjects.length; index++) {
        const info = record.subjects[index];
        const subfields = [];
        const idNumber = info['id_number'];
        subfields.push(subfieldFunc('a', idNumber.substring(0, 3)));
        subfields.push(subfieldFunc('x', idNumber));
        subfields.push(subfieldFunc('x', idNumber.substring(3)));
        subfields.push(subfieldFunc('2', 'bisacsh'));

        const newContent = fieldFunc(tag, ' ', ' ', subfields);
        categoriesContent += newContent;

        if (head !== null) {
          const newDirectory = this.createDirectory(tag, newContent, head);
          head += this.getByteLength(newContent);
          categoriesDirectory += newDirectory;
        }
      }

      return this.returnMultipleEntries(categoriesDirectory, categoriesContent, head);
    }

    return head !== null ? ['', '', head] : '';
  }

  fillSubjects(record, head, fieldFunc, subfieldFunc) {
    const tag = '650';

    if (record.subjects.length > 0) {
      let subjectsContent = '';
      let subjectDirectory = '';

      for (let index = 0; index < record.subjects.length; index++) {
        const info = record.subjects[index];
        const subfields = [];
        subfields.push(subfieldFunc('a', info['root']));
        subfields.push(subfieldFunc('x', info['level1']));

        if ('level2' in info) {
          subfields.push(subfieldFunc('x', info['level2']));
          if ('level3' in info) {
            subfields.push(subfieldFunc('x', info['level3']));
          }
        }

        subfields.push(subfieldFunc('2', 'bisacsh'));

        const newContent = fieldFunc(tag, '0', '7', subfields);
        subjectsContent += newContent;

        if (head !== null) {
          const newDirectory = this.createDirectory(tag, newContent, head);
          head += this.getByteLength(newContent);
          subjectDirectory += newDirectory;
        }
      }

      return this.returnMultipleEntries(subjectDirectory, subjectsContent, head);
    }

    return head !== null ? ['', '', head] : '';
  }

  fillWebURL(record, head, fieldFunc, subfieldFunc) {
    const tag = '856';
    const webUrl = fieldFunc(tag, '4', '0', [
      subfieldFunc('u', record.web_url),
      subfieldFunc('3', 'Full text')
    ]);
    return this.returnSingleEntry(tag, webUrl, head);
  }

  downloadMARC(record, institutionInfo) {
    let head = 0;

    const timestampContent = String.fromCharCode(30) + getTimestamp();
    const timestampDirectory = this.createDirectory('005', timestampContent, head);
    head += timestampContent.length;

    const controlfield006Content = String.fromCharCode(30) + this.create006Field();
    const controlfield006Directory = this.createDirectory('006', controlfield006Content, head);
    head += controlfield006Content.length;

    const controlfield007Content = String.fromCharCode(30) + this.create007Field();
    const controlfield007Directory = this.createDirectory('007', controlfield007Content, head);
    head += controlfield007Content.length;

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

    const subjectCategories = this.fillSubjectCategory(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = subjectCategories[2];

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
      this.createSubfield('a', 'computer'),
      this.createSubfield('b', 'c'),
      this.createSubfield('2', 'rdamedia')
    ]);
    const default3Directory = this.createDirectory('337', default3Content, head);
    head += default3Content.length;

    const default4Content = this.createContent('  ', [
      this.createSubfield('a', 'online resource'),
      this.createSubfield('b', 'cr'),
      this.createSubfield('2', 'rdacarrier')
    ]);
    const default4Directory = this.createDirectory('338', default4Content, head);
    head += default4Content.length;

    const contents = this.fillContents(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(contents[1]);

    const notes = this.fillNotes(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head += this.getByteLength(notes[1]);

    const subjects = this.fillSubjects(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = subjects[2];

    const keywords = this.fillKeywords(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = keywords[2];

    const fast = this.fillFAST(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = fast[2];

    const additionalAuthors = this.fillAdditionalAuthors(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = additionalAuthors[2];

    const additionalCorporateNames = this.fillAdditionalCorporateNames(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = additionalCorporateNames[2];

    const webUrl = this.fillWebURL(record, head, this.createContentFill.bind(this), this.createSubfield.bind(this));
    head = this.getByteLength(webUrl[1]);

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

    const text =
      timestampDirectory + controlfield006Directory + controlfield007Directory + controlfield008Directory +
      isbn[0] + default1Directory + subjectCategories[0] + author[0] + corporateAuthor[0] + title[0] + edition[0] + pub[0] +
      copyright[0] + physical[0] + default2Directory + default3Directory + default4Directory + contents[0] + notes[0] +
      subjects[0] + keywords[0] + fast[0] + additionalAuthors[0] + additionalCorporateNames[0] + webUrl[0] + title880[0] + edition880[0] +
      publisher880[0] + author880[0] + corporate880[0] + authors880[0] + additionalCorporate880[0] + timestampContent + controlfield006Content +
      controlfield007Content + controlfield008Content + isbn[1] + default1Content + subjectCategories[1] +
      author[1] + corporateAuthor[1] + title[1] + edition[1] + pub[1] + copyright[1] + physical[1] + default2Content + default3Content +
      default4Content + contents[1] + notes[1] + subjects[1] + keywords[1] + fast[1] + additionalAuthors[1] + additionalCorporateNames[1] + webUrl[1] +
      title880[1] + edition880[1] + publisher880[1] + author880[1] + authors880[1] + end;

    const leaderLen = this.getByteLength(text) + 24;
    const directoryLen = 25 +
      timestampDirectory.length + controlfield006Directory.length + controlfield007Directory.length +
      controlfield008Directory.length + isbn[0].length + default1Directory.length + subjectCategories[0].length +
      author[0].length + corporateAuthor[0].length + title[0].length + edition[0].length + pub[0].length + copyright[0].length + physical[0].length +
      default2Directory.length + default3Directory.length + default4Directory.length + contents[0].length + notes[0].length +
      subjects[0].length + keywords[0].length + fast[0].length + additionalAuthors[0].length + additionalCorporateNames[0].length + webUrl[0].length +
      title880[0].length + edition880[0].length + publisher880[0].length + author880[0].length + corporate880[0].length + authors880[0].length + additionalCorporate880[0].length;

    const leader = this.buildMarcLeader(leaderLen, directoryLen);
    downloadFile(leader + text, 'mrc');
  }

  downloadXML(record, institutionInfo) {
    let text = '<?xml version="1.0" encoding="utf-8"?>\n';
    text += '<record xmlns="http://www.loc.gov/MARC21/slim">\n';
    text += `  <leader>${this.buildXmlLeader()}</leader>\n`;

    const formattedDate = getTimestamp();
    text += `  <controlfield tag="005">${formattedDate}</controlfield>\n`;
    text += `  <controlfield tag="006">${this.create006Field()}</controlfield>\n`;
    text += `  <controlfield tag="007">${this.create007Field()}</controlfield>\n`;
    text += `  <controlfield tag="008">${this.create008Field(record)}</controlfield>\n`;

    text += this.createMARCXMLField('040', ' ', ' ', [
      this.createMARCXMLSubfield('a', institutionInfo['marc']),
      this.createMARCXMLSubfield('b', 'eng'),
      this.createMARCXMLSubfield('e', 'rda'),
      this.createMARCXMLSubfield('c', institutionInfo['marc'])
    ]);
    text += this.fillSubjectCategory(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
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
    text += this.fillSubjects(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillKeywords(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillFAST(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAdditionalAuthors(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillAdditionalCorporateNames(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
    text += this.fillWebURL(record, null, this.createMARCXMLField.bind(this), this.createMARCXMLSubfield.bind(this));
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
