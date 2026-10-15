import { searchBooks, PAGE_SIZE } from './api/openLibrary.js?v=final1';
import { bookCard, showMessage } from './ui.js?v=final1';

const form = document.querySelector('#search-form');
const results = document.querySelector('#results');
const status = document.querySelector('#search-status');
const validation = document.querySelector('#search-validation');
const submit = form.querySelector('[type="submit"]');
const sort = document.querySelector('#search-sort');
const more = document.querySelector('#load-more');
const pageError = document.querySelector('#page-error');
let activeRequest;
let requestNumber = 0;
let currentQuery;
let page = 0;
let total = 0;
let books = [];

function queryValues() {
  return Object.fromEntries(['title', 'author', 'subject'].map(name => [name, form.elements[name].value.trim()]));
}

async function search(append = false) {
  const query = append ? currentQuery : { ...queryValues(), sort: sort.value };
  validation.textContent = '';
  if (!['title', 'author', 'subject'].some(name => query?.[name])) {
    validation.textContent = 'Enter a title, author, or subject to start searching.';
    form.elements.title.focus();
    return;
  }
  activeRequest?.abort();
  activeRequest = new AbortController();
  const number = ++requestNumber;
  const nextPage = append ? page + 1 : 1;
  submit.disabled = more.disabled = true;
  submit.textContent = append ? 'Find books' : 'Searching…';
  more.textContent = 'Loading…';
  pageError.textContent = '';
  results.setAttribute('aria-busy', 'true');
  status.textContent = append ? 'Loading more books…' : 'Searching Open Library…';
  if (!append) {
    books = [];
    page = 0;
    more.hidden = true;
    currentQuery = query;
    showMessage(results, 'Looking through the shelves', 'Fetching matching titles from Open Library.');
    const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value));
    history.replaceState(null, '', `${location.pathname}?${params}`);
  }
  try {
    const data = await searchBooks(query, { signal: activeRequest.signal, page: nextPage });
    if (number !== requestNumber) return;
    total = data.total;
    page = nextPage;
    const oldKeys = new Set(books.map(book => book.key));
    const fresh = data.books.filter(book => !oldKeys.has(book.key) && oldKeys.add(book.key));
    books.push(...fresh);
    if (!append) results.replaceChildren();
    const cards = fresh.map(bookCard);
    results.append(...cards);
    if (!books.length) {
      status.textContent = 'No matching books.';
      showMessage(results, 'No books found', 'Try fewer words, check the spelling, or search just an author.');
    } else {
      status.textContent = `Showing ${books.length} of ${total.toLocaleString()} matches · Open Library`;
    }
    more.hidden = page * PAGE_SIZE >= total;
    if (append && cards.length) cards[0].querySelector('a').focus();
  } catch (error) {
    if (number !== requestNumber) return;
    if (append) {
      pageError.textContent = `${error.message} Your current results are still here. Choose Load more to retry.`;
    } else {
      status.textContent = 'Search could not be completed.';
      showMessage(results, 'The books could not be loaded', error.message, () => search());
    }
  } finally {
    if (number === requestNumber) {
      results.setAttribute('aria-busy', 'false');
      submit.disabled = more.disabled = false;
      submit.textContent = 'Find books';
      more.textContent = 'Load more';
    }
  }
}
form.addEventListener('submit', event => { event.preventDefault(); search(); });
sort.addEventListener('change', () => {
  if (['title', 'author', 'subject'].some(name => queryValues()[name])) search();
});
more.addEventListener('click', () => search(true));
for (const button of document.querySelectorAll('[data-subject]')) {
  button.addEventListener('click', () => {
    form.reset();
    form.elements.subject.value = button.dataset.subject;
    search();
  });
}
const params = new URLSearchParams(location.search);
for (const name of ['title', 'author', 'subject']) form.elements[name].value = params.get(name) || '';
sort.value = ['new', 'old'].includes(params.get('sort')) ? params.get('sort') : 'relevance';
if (Object.values(queryValues()).some(Boolean)) search();

