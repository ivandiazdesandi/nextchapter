import test from 'node:test';
import assert from 'node:assert/strict';
import { SHELF_KEY, readShelf, saveBook, updateBook, removeBook, selectShelf } from '../src/js/storage.js';
import { searchBooks, searchUrl } from '../src/js/api/openLibrary.js';

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
const book = { key: '/works/OL1W', title: 'Book A', authors: ['Author'], isbns: ['9780000000000'] };

test('saving the same work updates one entry and preserves other books', () => {
  const local = storage();
  saveBook(book, 'Want to Read', '', local);
  saveBook({ ...book, key: '/works/OL2W', title: 'Book B' }, 'Reading', 'Keep this note', local);
  saveBook(book, 'Finished', 'Finished chapter', local);
  const { books } = readShelf(local);
  assert.equal(books.length, 2);
  assert.equal(books.find(b => b.key === book.key).status, 'Finished');
  assert.equal(books.find(b => b.key === '/works/OL2W').note, 'Keep this note');
  assert.deepEqual(books.find(b => b.key === book.key).isbns, book.isbns);
});
test('editing and removing re-read storage and do not restore a deleted book', () => {
  const local = storage();
  saveBook(book, 'Reading', 'Before', local);
  updateBook(book.key, 'Finished', 'After', local);
  assert.equal(readShelf(local).books[0].note, 'After');
  removeBook(book.key, local);
  assert.deepEqual(readShelf(local).books, []);
  assert.throws(() => updateBook(book.key, 'Reading', 'Stale form', local), /no longer/);
});
test('corrupt data blocks every mutation without overwriting the original', () => {
  const local = storage();
  local.setItem(SHELF_KEY, '{broken');
  for (const mutate of [() => saveBook(book, 'Reading', '', local),
    () => updateBook(book.key, 'Finished', '', local), () => removeBook(book.key, local)]) {
    assert.throws(mutate, /stored data has not been changed/);
    assert.equal(local.getItem(SHELF_KEY), '{broken');
  }
});
test('failed saves and invalid statuses never report or store success', () => {
  const local = storage();
  assert.throws(() => saveBook(book, 'Unknown', '', local), /Invalid reading status/);
  assert.deepEqual(readShelf(local).books, []);
  assert.throws(() => saveBook(book, 'Reading', '', { getItem: () => null, setItem() { throw Error('Full'); } }), /could not be saved/);
});
test('notes are bounded and status filters/title sorting do not mutate the shelf', () => {
  const local = storage();
  saveBook({ ...book, title: 'Zulu' }, 'Reading', 'x'.repeat(1500), local);
  saveBook({ ...book, key: '/works/OL2W', title: 'Alpha' }, 'Finished', '', local);
  const books = readShelf(local).books;
  assert.equal(books[0].note.length, 1000);
  assert.deepEqual(selectShelf(books, 'Reading').map(b => b.title), ['Zulu']);
  assert.deepEqual(selectShelf(books, 'all', 'title').map(b => b.title), ['Alpha', 'Zulu']);
  assert.equal(books[0].title, 'Zulu');
  assert.deepEqual(selectShelf(books, 'Want to Read'), []);
});
test('access to a blocked localStorage getter is handled safely', () => {
  const previous = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw Error('Blocked'); } });
  try {
    assert.ok(readShelf().warning);
    assert.throws(() => saveBook(book), /could not read/);
  } finally {
    if (previous) Object.defineProperty(globalThis, 'localStorage', previous);
    else delete globalThis.localStorage;
  }
});
test('search pages preserve query and sort and use the requested page', async () => {
  const previous = globalThis.fetch;
  let requested;
  globalThis.fetch = async url => {
    requested = url;
    return { ok: true, json: async () => ({ docs: [], numFound: 30 }) };
  };
  try {
    await searchBooks({ author: 'R. F. Kuang', sort: 'new' }, { page: 2 });
    assert.equal(requested.searchParams.get('author'), 'R. F. Kuang');
    assert.equal(requested.searchParams.get('sort'), 'new');
    assert.equal(requested.searchParams.get('page'), '2');
    assert.equal(searchUrl({ title: 'Book', sort: 'bad' }).searchParams.has('sort'), false);
  } finally { globalThis.fetch = previous; }
});
