import { MarcBuilder } from '../marcBuilder.js';

const ROLE_LABELS = {
  art: 'artist',
  aut: 'author',
  ctb: 'contributor',
  edt: 'editor',
  ill: 'illustrator',
  trl: 'translator'
};

const SUBFIELDS_BD = ['b', 'c', 'd'];

function getRoleLabel(role) {
  return ROLE_LABELS[role] || 'creator';
}

export class MonoviafMarcBuilder extends MarcBuilder {
  constructor(options = {}) {
    super({
      ...options
    });
  }

  fillAuthor(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.author) || !Array.isArray(record.author) || !checkExists(record.author[0])) {
      return head !== null ? ['', ''] : '';
    }

    const primaryEntry = record.author[0] || {};
    const translitEntry = record.author[1] || {};
    const latinIndex = checkExists(translitEntry.family) || checkExists(translitEntry.given) ? 1 : 0;
    const displayEntry = record.author[latinIndex] || primaryEntry;

    let authorContent = '';
    if (checkExists(displayEntry.family)) {
      authorContent = displayEntry.family;
    } else if (checkExists(displayEntry.given)) {
      authorContent = displayEntry.given;
    } else {
      return head !== null ? ['', ''] : '';
    }

    const roleCode = primaryEntry.role || 'aut';
    const roleLabel = getRoleLabel(roleCode);
    const viaf = primaryEntry.viaf || '';
    const lc = primaryEntry.lc || '';
    const subbd = Array.isArray(primaryEntry.subbd) ? primaryEntry.subbd : [];

    const subfields = [];

    if (viaf) {
      subfields.push(subfieldFunc('a', authorContent));
      subbd.forEach((value, index) => {
        if (checkExists(value) && SUBFIELDS_BD[index]) {
          subfields.push(subfieldFunc(SUBFIELDS_BD[index], value));
        }
      });
      subfields.push(subfieldFunc('e', roleLabel));
      if (lc) {
        subfields.push(subfieldFunc('0', lc));
      }
      subfields.push(subfieldFunc('1', viaf));
      subfields.push(subfieldFunc('4', roleCode));
    } else {
      const nameValue = authorContent.endsWith(',') ? authorContent : `${authorContent},`;
      subfields.push(subfieldFunc('a', nameValue));
      subfields.push(subfieldFunc('e', roleLabel));
      subfields.push(subfieldFunc('4', roleCode));
    }

    if (latinIndex === 1) {
      subfields.push(subfieldFunc('6', '880-03'));
    }

    const ind1 = lc && checkExists(primaryEntry.ind1) ? primaryEntry.ind1 : '1';
    const authorField = fieldFunc('100', ind1, ' ', subfields);
    return this.returnSingleEntry('100', authorField, head);
  }

  fillAdditionalAuthors(record, head, fieldFunc, subfieldFunc) {
    if (!checkExists(record.additional_authors)) {
      return head !== null ? ['', '', head] : '';
    }

    let authors = '';
    let directory = '';
    let currentHead = head;
    let translitCounter = 5;

    for (let i = 0; i < record.additional_authors.length; i++) {
      const authorSet = record.additional_authors[i];
      if (!checkExists(authorSet) || !Array.isArray(authorSet) || !checkExists(authorSet[0])) {
        continue;
      }

      const primaryEntry = authorSet[0] || {};
      if (!checkExists(primaryEntry.family) && !checkExists(primaryEntry.given)) {
        continue;
      }

      const translitEntry = authorSet[1] || {};
      const latinIndex = checkExists(translitEntry.family) || checkExists(translitEntry.given) ? 1 : 0;
      const displayEntry = authorSet[latinIndex] || primaryEntry;

      let authorContent = '';
      if (checkExists(displayEntry.family)) {
        authorContent = displayEntry.family;
      } else if (checkExists(displayEntry.given)) {
        authorContent = displayEntry.given;
      } else {
        continue;
      }

      const roleCode = primaryEntry.role || 'ctb';
      const roleLabel = getRoleLabel(roleCode);
      const viaf = primaryEntry.viaf || '';
      const lc = primaryEntry.lc || '';
      const subbd = Array.isArray(primaryEntry.subbd) ? primaryEntry.subbd : [];

      const subfields = [];

      if (viaf) {
        subfields.push(subfieldFunc('a', authorContent));
        subbd.forEach((value, index) => {
          if (checkExists(value) && SUBFIELDS_BD[index]) {
            subfields.push(subfieldFunc(SUBFIELDS_BD[index], value));
          }
        });
        subfields.push(subfieldFunc('e', roleLabel));
        if (lc) {
          subfields.push(subfieldFunc('0', lc));
        }
        subfields.push(subfieldFunc('1', viaf));
        subfields.push(subfieldFunc('4', roleCode));
      } else {
        const nameValue = authorContent.endsWith(',') ? authorContent : `${authorContent},`;
        subfields.push(subfieldFunc('a', nameValue));
        subfields.push(subfieldFunc('e', roleLabel));
        subfields.push(subfieldFunc('4', roleCode));
      }

      if (latinIndex === 1) {
        const translitIndex = translitCounter < 10 ? `0${translitCounter}` : `${translitCounter}`;
        subfields.push(subfieldFunc('6', `880-${translitIndex}`));
        translitCounter++;
      }

      const ind1 = lc && checkExists(primaryEntry.ind1) ? primaryEntry.ind1 : '1';
      const newContent = fieldFunc('700', ind1, ' ', subfields);
      authors += newContent;

      if (currentHead !== null) {
        const newDirectory = this.createDirectory('700', newContent, currentHead);
        currentHead += this.getByteLength(newContent);
        directory += newDirectory;
      }
    }

    return this.returnMultipleEntries(directory, authors, currentHead);
  }

  fillKeywords(record, head, fieldFunc, subfieldFunc) {
    const appendKeyword = (content, directory, currentHead, keyword, uri) => {
      const subfields = [subfieldFunc('a', keyword)];
      if (checkExists(uri)) {
        subfields.push(subfieldFunc('0', uri));
      }
      const field = fieldFunc('653', ' ', ' ', subfields);
      let newContent = content + field;
      let newDirectory = directory;
      let newHead = currentHead;

      if (currentHead !== null) {
        const directoryEntry = this.createDirectory('653', field, currentHead);
        newHead += this.getByteLength(field);
        newDirectory += directoryEntry;
      }

      return { content: newContent, directory: newDirectory, head: newHead };
    };

    let keywordsContent = '';
    let keywordsDirectory = '';
    let currentHead = head;

    if (Array.isArray(record.keywords)) {
      for (let i = 0; i < record.keywords.length; i++) {
        const keyword = record.keywords[i];
        if (!checkExists(keyword) || keyword === '') {
          continue;
        }
        const uri = Array.isArray(record.keywordshtml) ? record.keywordshtml[i] : undefined;
        const result = appendKeyword(keywordsContent, keywordsDirectory, currentHead, keyword, uri);
        keywordsContent = result.content;
        keywordsDirectory = result.directory;
        currentHead = result.head;
      }
    }

    if (Array.isArray(record.lcshvalue)) {
      for (let i = 0; i < record.lcshvalue.length; i++) {
        const keyword = record.lcshvalue[i];
        if (!checkExists(keyword) || keyword === '') {
          continue;
        }
        const uri = Array.isArray(record.lcshuri) ? record.lcshuri[i] : undefined;
        const result = appendKeyword(keywordsContent, keywordsDirectory, currentHead, keyword, uri);
        keywordsContent = result.content;
        keywordsDirectory = result.directory;
        currentHead = result.head;
      }
    }

    return this.returnMultipleEntries(keywordsDirectory, keywordsContent, currentHead);
  }
}
