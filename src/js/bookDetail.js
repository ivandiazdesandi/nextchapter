import { getWork, workKey, getAuthorName } from './api/openLibrary.js?v=final1';
import { getAuthorBiography } from './api/wikipedia.js?v=final1';
import { cachedBook, readShelf } from './storage.js?v=final1';
import { shelfControls } from './shelfControls.js?v=final1';
import { cover, element, showMessage } from './ui.js?v=final1';

const container = document.querySelector('#book-detail');
const key = workKey(new URLSearchParams(location.search).get('key'));

async function loadBiography(book, work, section, authorLine) {
  section.replaceChildren(element('h2', '', 'About the author'), element('p', 'muted', 'Looking up author information on Wikipedia…'));
  section.setAttribute('aria-busy', 'true');
  try {
    if (!book.authors.length) {
      const name = await getAuthorName(work.authors?.[0]?.author?.key || '');
      if (name) { book.authors = [name]; authorLine.textContent = name; }
    }
    const author = book.authors[0];
    const biography = author ? await getAuthorBiography(author) : null;
    section.replaceChildren(element('h2', '', 'About the author'));
    if (!biography) {
      section.append(element('p', 'muted', 'No specific author article was found on Wikipedia. You can still save this book to your shelf.'));
      return;
    }
    section.append(element('h3', '', biography.title), element('p', '', biography.extract));
    const source = element('a', '', 'Read the full article on Wikipedia');
    source.href = biography.url; source.target = '_blank'; source.rel = 'noopener noreferrer';
    const credit = element('p', 'form-help', 'Excerpt from Wikipedia contributors, shortened for this view. Text licensed under ');
    const license = element('a', '', 'CC BY-SA 4.0');
    license.href = 'https://creativecommons.org/licenses/by-sa/4.0/';
    credit.append(license, '.');
    section.append(source, credit);
  } catch (error) {
    section.replaceChildren(element('h2', '', 'About the author'), element('p', 'muted', `${error.message} The book and shelf controls are still available.`));
    const retry = element('button', 'button secondary', 'Retry author lookup');
    retry.type = 'button';
    retry.addEventListener('click', () => loadBiography(book, work, section, authorLine));
    section.append(retry);
  } finally { section.setAttribute('aria-busy', 'false'); }
}
async function load() {
  if (!key) {
    showMessage(container, 'Choose a book first', 'Return to search and open a title to see its details.');
    return;
  }
  showMessage(container, 'Opening the book', 'Loading its information from Open Library.');
  try {
    const work = await getWork(key);
    const cached = cachedBook(key) || readShelf().books.find(book => book.key === key);
    const book = {
      key, title: work.title || cached?.title || 'Untitled book', authors: cached?.authors || [],
      year: cached?.year || null, coverId: work.covers?.find(x => x > 0) || cached?.coverId || null,
      isbns: cached?.isbns || [],
      languages: cached?.languages || [], editionCount: cached?.editionCount ?? null,
    };
    document.title = `${book.title} | NextChapter`;
    const panel = element('article', 'detail-panel');
    const content = element('div', 'detail-copy');
    content.append(element('p', 'eyebrow', 'OPEN LIBRARY'), element('h1', '', book.title));
    const authorLine = element('p', 'lead', book.authors.join(', ') || 'Author information is available at the source link below.');
    content.append(authorLine);
    if (book.year) content.append(element('p', 'muted', `First published ${book.year}`));
    if (book.editionCount !== null) content.append(element('p', 'muted', `${book.editionCount.toLocaleString()} catalog editions`));
    if (book.languages.length) {
      const names = { eng: 'English', spa: 'Spanish', fre: 'French', ger: 'German', ita: 'Italian', por: 'Portuguese', chi: 'Chinese', jpn: 'Japanese' };
      content.append(element('p', 'muted', `Catalog languages include ${book.languages.map(code => names[code] || code.toUpperCase()).join(', ')}`));
    }
    const description = typeof work.description === 'string' ? work.description : work.description?.value;
    content.append(element('h2', '', 'About this book'), element('p', 'description', description || 'Open Library has not provided a description for this book.'));
    const subjects = Array.isArray(work.subjects) ? work.subjects.filter(x => typeof x === 'string').slice(0, 8) : [];
    if (subjects.length) {
      const tags = element('div', 'tags');
      subjects.forEach(subject => tags.append(element('span', 'tag', subject)));
      content.append(tags);
    }
    const source = element('a', 'button', 'Read more on Open Library');
    source.href = `https://openlibrary.org${key}`;
    source.target = '_blank'; source.rel = 'noopener noreferrer';
    content.append(source, element('h2', '', 'Keep it on your shelf'), shelfControls(book));
    const biography = element('section', 'author-panel');
    biography.setAttribute('aria-label', 'Wikipedia author information');
    biography.setAttribute('aria-live', 'polite');
    content.append(biography);
    panel.append(cover(book), content);
    container.replaceChildren(panel);
    loadBiography(book, work, biography, authorLine);
  } catch (error) {
    showMessage(container, 'This book could not be loaded', error.message, load);
  }
}
load();
