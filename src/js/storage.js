export const SHELF_KEY = 'nextchapter.shelf.v1';
export const STATUSES = ['Want to Read', 'Reading', 'Finished'];

function validEntry(entry) {
  return entry && /^\/works\/OL\d+W$/.test(entry.key) && typeof entry.title === 'string'
    && Array.isArray(entry.authors) && entry.authors.every(x => typeof x === 'string')
    && STATUSES.includes(entry.status) && typeof entry.note === 'string'
    && typeof entry.updatedAt === 'string';
}

export function readShelf(storage) {
  try {
    storage ??= globalThis.localStorage;
    const raw = storage.getItem(SHELF_KEY);
    if (!raw) return { books: [], warning: '' };
    const value = JSON.parse(raw);
    if (!Array.isArray(value) || !value.every(validEntry)) {
      return { books: [], warning: 'Your saved shelf could not be read. Your stored data has not been changed.' };
    }
    return { books: value, warning: '' };
  } catch {
    return { books: [], warning: 'This browser could not read your shelf. Your stored data has not been changed.' };
  }
}

export function writeShelf(books, storage) {
  if (!Array.isArray(books) || !books.every(validEntry)) throw new Error('Invalid shelf data.');
  try {
    storage ??= globalThis.localStorage;
    storage.setItem(SHELF_KEY, JSON.stringify(books));
  } catch {
    throw new Error('Your shelf could not be saved. Browser storage may be full or disabled.');
  }
}

export function makeShelfEntry(book, status = 'Want to Read', note = '') {
  if (!STATUSES.includes(status)) throw new Error('Invalid reading status.');
  const entry = {
    key: book.key, title: book.title, authors: book.authors,
    coverId: book.coverId ?? null, year: book.year ?? null,
    isbns: Array.isArray(book.isbns) ? book.isbns.filter(x => typeof x === 'string').slice(0, 5) : [],
    status, note: String(note).slice(0, 1000), updatedAt: new Date().toISOString(),
  };
  if (!validEntry(entry)) throw new Error('Invalid book data.');
  return entry;
}

// Re-read before changing a book, preserving changes made by another page.
function editableShelf(storage) {
  const result = readShelf(storage);
  if (result.warning) throw new Error(result.warning);
  return result.books;
}

export function saveBook(book, status = 'Want to Read', note = '', storage) {
  const books = editableShelf(storage);
  const existing = books.find(entry => entry.key === book.key);
  const entry = makeShelfEntry({ ...book, ...existing }, status, note);
  writeShelf([...books.filter(item => item.key !== entry.key), entry], storage);
  return entry;
}

export function updateBook(key, status, note, storage) {
  const books = editableShelf(storage);
  const existing = books.find(entry => entry.key === key);
  if (!existing) throw new Error('This book is no longer on your shelf. Refresh the page to see your latest shelf.');
  const entry = makeShelfEntry(existing, status, note);
  writeShelf(books.map(item => item.key === key ? entry : item), storage);
  return entry;
}

export function removeBook(key, storage) {
  const books = editableShelf(storage);
  writeShelf(books.filter(book => book.key !== key), storage);
}

export function selectShelf(books, status = 'all', sort = 'updated') {
  const filtered = books.filter(book => status === 'all' || book.status === status);
  return filtered.sort((a, b) => sort === 'title'
    ? a.title.localeCompare(b.title)
    : b.updatedAt.localeCompare(a.updatedAt));
}

// Short-lived search metadata makes the first detail view useful before edition enrichment.
export function cacheBook(book) {
  try { sessionStorage.setItem(`nextchapter.book.${book.key}`, JSON.stringify(book)); } catch { /* Optional cache. */ }
}
export function cachedBook(key) {
  try {
    const book = JSON.parse(sessionStorage.getItem(`nextchapter.book.${key}`));
    return book?.key === key && typeof book.title === 'string' && Array.isArray(book.authors) ? book : null;
  } catch { return null; }
}
