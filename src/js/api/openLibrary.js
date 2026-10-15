const SEARCH_URL = 'https://openlibrary.org/search.json';
const FIELDS = 'key,title,author_name,first_publish_year,cover_i,isbn,subject';
export const PAGE_SIZE = 12;

export function workKey(value) {
  const key = typeof value === 'string' ? value.replace(/^\/works\//, '') : '';
  return /^OL\d+W$/.test(key) ? `/works/${key}` : null;
}

export function normalizeBook(doc) {
  const key = workKey(doc?.key);
  if (!key) return null;
  return {
    key,
    title: typeof doc.title === 'string' && doc.title.trim() ? doc.title : 'Untitled book',
    authors: Array.isArray(doc.author_name) ? doc.author_name.filter(x => typeof x === 'string') : [],
    year: Number.isInteger(doc.first_publish_year) ? doc.first_publish_year : null,
    coverId: Number.isInteger(doc.cover_i) && doc.cover_i > 0 ? doc.cover_i : null,
    isbns: Array.isArray(doc.isbn) ? doc.isbn.filter(x => typeof x === 'string').slice(0, 5) : [],
    subjects: Array.isArray(doc.subject) ? doc.subject.filter(x => typeof x === 'string').slice(0, 8) : [],
  };
}

export function searchUrl({ title = '', author = '', subject = '', sort = 'relevance' }, page = 1) {
  const url = new URL(SEARCH_URL);
  for (const [name, value] of Object.entries({ title, author, subject })) {
    if (value.trim()) url.searchParams.set(name, value.trim());
  }
  if (![title, author, subject].some(x => x.trim())) throw new Error('Enter a title, author, or subject.');
  url.searchParams.set('fields', FIELDS);
  url.searchParams.set('limit', String(PAGE_SIZE));
  url.searchParams.set('page', String(page));
  if (['new', 'old'].includes(sort)) url.searchParams.set('sort', sort);
  return url;
}

export async function requestJson(url, { signal } = {}) {
  const timeout = new AbortController();
  const timer = setTimeout(() => timeout.abort(new Error('The request took too long. Please try again.')), 15000);
  const requestSignal = signal ? AbortSignal.any([signal, timeout.signal]) : timeout.signal;
  try {
    const response = await fetch(url, { signal: requestSignal });
    if (!response.ok) throw new Error(`Open Library is unavailable (${response.status}). Please try again.`);
    return await response.json();
  } catch (error) {
    if (signal?.aborted) throw error;
    if (timeout.signal.aborted) throw timeout.signal.reason;
    if (error instanceof TypeError) throw new Error('Could not reach Open Library. Check your connection and try again.');
    throw error;
  } finally {
    clearTimeout(timer);
  }
}

export async function searchBooks(query, options = {}) {
  const data = await requestJson(searchUrl(query, options.page || 1), options);
  if (!Array.isArray(data.docs)) throw new Error('Open Library returned an unexpected response. Please try again.');
  const books = data.docs.map(normalizeBook).filter(Boolean);
  const total = Number(data.numFound ?? data.num_found);
  return { books, total: Number.isFinite(total) ? total : books.length };
}

export async function getWork(key) {
  const safeKey = workKey(key);
  if (!safeKey) throw new Error('This book link is not valid. Return to search and choose a book.');
  return requestJson(`https://openlibrary.org${safeKey}.json`);
}
