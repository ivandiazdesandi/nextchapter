import { searchBooks } from './api/openLibrary.js';
import { bookCard, showMessage } from './ui.js';

const form = document.querySelector('#search-form');
const results = document.querySelector('#results');
const status = document.querySelector('#search-status');
const validation = document.querySelector('#search-validation');
const submit = form.querySelector('[type="submit"]');
let activeRequest;
let requestNumber = 0;

function queryValues() {
  return Object.fromEntries(['title', 'author', 'subject'].map(name => [name, form.elements[name].value.trim()]));
}

async function search() {
  const query = queryValues();
  validation.textContent = '';
  if (!Object.values(query).some(Boolean)) {
    validation.textContent = 'Enter a title, author, or subject to start searching.';
    form.elements.title.focus();
    return;
  }
  activeRequest?.abort();
  activeRequest = new AbortController();
  const number = ++requestNumber;
  submit.disabled = true;
  submit.textContent = 'Searching…';
  results.setAttribute('aria-busy', 'true');
  status.textContent = 'Searching Open Library…';
  showMessage(results, 'Looking through the shelves', 'Fetching matching titles from Open Library.');
  const params = new URLSearchParams(Object.entries(query).filter(([, value]) => value));
  history.replaceState(null, '', `${location.pathname}?${params}`);
  try {
    const { books, total } = await searchBooks(query, { signal: activeRequest.signal });
    if (number !== requestNumber) return;
    if (!books.length) {
      status.textContent = 'No matching books.';
      showMessage(results, 'No books found', 'Try fewer words, check the spelling, or search just an author.');
    } else {
      results.replaceChildren(...books.map(bookCard));
      status.textContent = `Showing ${books.length} of ${total.toLocaleString()} matches · Open Library`;
    }
  } catch (error) {
    if (number !== requestNumber) return;
    status.textContent = 'Search could not be completed.';
    showMessage(results, 'The books could not be loaded', error.message, search);
  } finally {
    if (number === requestNumber) {
      results.setAttribute('aria-busy', 'false');
      submit.disabled = false;
      submit.textContent = 'Find books';
    }
  }
}
form.addEventListener('submit', event => { event.preventDefault(); search(); });
for (const button of document.querySelectorAll('[data-subject]')) {
  button.addEventListener('click', () => {
    form.reset();
    form.elements.subject.value = button.dataset.subject;
    search();
  });
}
const params = new URLSearchParams(location.search);
for (const name of ['title', 'author', 'subject']) form.elements[name].value = params.get(name) || '';
if (Object.values(queryValues()).some(Boolean)) search();
