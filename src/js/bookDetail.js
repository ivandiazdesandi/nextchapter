import { getWork, workKey } from './api/openLibrary.js';
import { cachedBook } from './storage.js';
import { cover, element, showMessage } from './ui.js';

const container = document.querySelector('#book-detail');
const key = workKey(new URLSearchParams(location.search).get('key'));
async function load() {
  if (!key) {
    showMessage(container, 'Choose a book first', 'Return to search and open a title to see its details.');
    return;
  }
  showMessage(container, 'Opening the book', 'Loading its information from Open Library.');
  try {
    const work = await getWork(key);
    const cached = cachedBook(key);
    const book = {
      key, title: work.title || cached?.title || 'Untitled book', authors: cached?.authors || [],
      year: cached?.year || null, coverId: work.covers?.find(x => x > 0) || cached?.coverId || null,
    };
    document.title = `${book.title} | NextChapter`;
    const panel = element('article', 'detail-panel');
    const content = element('div', 'detail-copy');
    content.append(element('p', 'eyebrow', 'OPEN LIBRARY'), element('h1', '', book.title));
    content.append(element('p', 'lead', book.authors.join(', ') || 'Author information is available at the source link below.'));
    if (book.year) content.append(element('p', 'muted', `First published ${book.year}`));
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
    content.append(source, element('p', 'development-note', 'The personal shelf and Google Books information are planned for the next update.'));
    panel.append(cover(book), content);
    container.replaceChildren(panel);
  } catch (error) {
    showMessage(container, 'This book could not be loaded', error.message, load);
  }
}
load();
