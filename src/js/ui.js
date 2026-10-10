import { cacheBook } from './storage.js';

export function element(tag, className, text) {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}

export function cover(book) {
  const frame = element('div', 'cover');
  const placeholder = element('span', 'cover-placeholder', 'Cover unavailable');
  frame.append(placeholder);
  if (book.coverId) {
    const img = document.createElement('img');
    img.src = `https://covers.openlibrary.org/b/id/${book.coverId}-M.jpg?default=false`;
    img.alt = `Cover of ${book.title}`;
    img.loading = 'lazy';
    img.addEventListener('load', () => { placeholder.hidden = true; });
    img.addEventListener('error', () => { img.remove(); placeholder.hidden = false; }, { once: true });
    frame.append(img);
  }
  return frame;
}

export function bookCard(book) {
  const card = element('article', 'book-card');
  const link = element('a', 'book-link');
  link.href = `./book.html?key=${encodeURIComponent(book.key)}`;
  link.addEventListener('click', () => cacheBook(book));
  link.append(cover(book));
  const heading = element('h3', '', book.title);
  const author = element('p', 'book-author', book.authors.join(', ') || 'Author unavailable');
  const year = element('p', 'book-year', book.year ? `First published ${book.year}` : 'Publication year unavailable');
  link.append(heading, author, year);
  card.append(link);
  return card;
}

export function showMessage(container, heading, message, retry) {
  const panel = element('div', 'state-panel');
  panel.append(element('p', 'state-symbol', '⌁'), element('h2', '', heading), element('p', '', message));
  if (retry) {
    const button = element('button', 'button secondary', 'Try again');
    button.type = 'button';
    button.addEventListener('click', retry);
    panel.append(button);
  }
  container.replaceChildren(panel);
}
