import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeBook, searchUrl, workKey, searchBooks } from '../src/js/api/openLibrary.js';
import { SHELF_KEY, readShelf, writeShelf, makeShelfEntry } from '../src/js/storage.js';

function storage() {
  const values = new Map();
  return { getItem: key => values.get(key) ?? null, setItem: (key, value) => values.set(key, value) };
}
test('search encodes combined title, author, and subject without changing their meaning', () => {
  const url = searchUrl({ title: 'A & B', author: 'R. F. Kuang', subject: 'dark fantasy' });
  assert.equal(url.searchParams.get('title'), 'A & B');
  assert.equal(url.searchParams.get('author'), 'R. F. Kuang');
  assert.equal(url.searchParams.get('subject'), 'dark fantasy');
  assert.throws(() => searchUrl({ title: '   ' }));
});
test('normalization tolerates missing fields and rejects invalid work IDs', () => {
  assert.deepEqual(normalizeBook({ key: 'OL123W' }), {
    key: '/works/OL123W', title: 'Untitled book', authors: [], year: null, coverId: null, isbns: [], subjects: [],
  });
  assert.equal(normalizeBook({ key: 'javascript:alert(1)' }), null);
  assert.equal(workKey('/works/OL123W'), '/works/OL123W');
});
test('author and subject arrays retain only text; unusable covers are omitted', () => {
  const book = normalizeBook({ key: 'OL123W', author_name: ['Author', null], subject: ['Fantasy', 8], cover_i: -1 });
  assert.deepEqual(book.authors, ['Author']);
  assert.deepEqual(book.subjects, ['Fantasy']);
  assert.equal(book.coverId, null);
});
test('shelf round trip preserves notes, reading status, and stable work key', () => {
  const local = storage();
  const book = normalizeBook({ key: 'OL123W', title: 'Test', author_name: ['A'] });
  const entry = makeShelfEntry(book, 'Reading', 'Read chapter two');
  writeShelf([entry], local);
  assert.deepEqual(readShelf(local).books, [entry]);
  assert.equal(readShelf(local).warning, '');
});
test('corrupt shelf is reported and never silently overwritten', () => {
  const local = storage();
  local.setItem(SHELF_KEY, '{broken');
  assert.equal(readShelf(local).books.length, 0);
  assert.ok(readShelf(local).warning);
  assert.equal(local.getItem(SHELF_KEY), '{broken');
  local.setItem(SHELF_KEY, JSON.stringify([{ key: 'OL123W', status: 'other' }]));
  assert.ok(readShelf(local).warning);
});
test('missing and blocked storage have separate outcomes', () => {
  assert.deepEqual(readShelf(storage()), { books: [], warning: '' });
  assert.ok(readShelf({ getItem() { throw new Error('Blocked'); } }).warning);
  assert.throws(() => writeShelf([], { setItem() { throw new Error('Full'); } }), /could not be saved/);
});
test('failed API responses are errors rather than empty successful results', async () => {
  const previous = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false, status: 503 });
    await assert.rejects(searchBooks({ author: 'Test' }), /503/);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ unexpected: true }) });
    await assert.rejects(searchBooks({ author: 'Test' }), /unexpected response/);
  } finally { globalThis.fetch = previous; }
});
test('API supports legacy count names and skips entries without a work key', async () => {
  const previous = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ num_found: 2, docs: [{ key: 'OL1W', title: 'Book' }, {}] }) });
    const result = await searchBooks({ title: 'Book' });
    assert.equal(result.total, 2);
    assert.equal(result.books.length, 1);
  } finally { globalThis.fetch = previous; }
});
