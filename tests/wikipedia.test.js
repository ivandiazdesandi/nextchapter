import test from 'node:test';
import assert from 'node:assert/strict';
import { authorUrl, normalizeAuthor, getAuthorBiography } from '../src/js/api/wikipedia.js';
import { requestJson } from '../src/js/api/openLibrary.js';

test('author query uses CORS, redirects and an encoded exact title', () => {
  const url = authorUrl(' R. F. Kuang ');
  assert.equal(url.origin, 'https://en.wikipedia.org');
  assert.equal(url.searchParams.get('titles'), 'R. F. Kuang');
  assert.equal(url.searchParams.get('origin'), '*');
  assert.equal(url.searchParams.get('redirects'), '1');
  assert.throws(() => authorUrl('  '));
});
test('author data is bounded plain text with a fixed-host source link', () => {
  const author = normalizeAuthor({ query: { pages: [{ ns: 0, title: 'R. F. Kuang', extract: 'x'.repeat(1100), fullurl: 'javascript:alert(1)' }] } });
  assert.equal(author.extract.length, 998);
  assert.equal(author.url, 'https://en.wikipedia.org/wiki/R._F._Kuang');
});
test('missing, disambiguation and non-article pages are not presented as an author', () => {
  for (const page of [{ missing: true }, { ns: 1, title: 'Talk:A', extract: 'Text' },
    { ns: 0, title: 'A', extract: 'Many people', pageprops: { disambiguation: '' } },
    { ns: 0, title: 'A', extract: '' }]) {
    assert.equal(normalizeAuthor({ query: { pages: [page] } }), null);
  }
  assert.throws(() => normalizeAuthor({ malformed: true }), /unexpected/);
});
test('Wikipedia failures are separate errors, not a successful empty biography', async () => {
  const previous = globalThis.fetch;
  try {
    globalThis.fetch = async () => ({ ok: false, status: 503 });
    await assert.rejects(getAuthorBiography('A'), /Wikipedia is unavailable \(503\)/);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ error: { info: 'Failed' } }) });
    await assert.rejects(getAuthorBiography('A'), /could not complete/);
    globalThis.fetch = async () => ({ ok: true, json: async () => ({ query: { pages: [{ ns: 0, title: 'A', extract: 'An author.' }] } }) });
    assert.equal((await getAuthorBiography('A')).title, 'A');
  } finally { globalThis.fetch = previous; }
});
test('a stalled provider times out and an aborted caller remains cancelled', async () => {
  const previous = globalThis.fetch;
  globalThis.fetch = (_url, { signal }) => new Promise((_, reject) => {
    if (signal.aborted) reject(signal.reason);
    else signal.addEventListener('abort', () => reject(signal.reason), { once: true });
  });
  try {
    await assert.rejects(requestJson('https://example.com', { provider: 'Wikipedia', timeoutMs: 5 }), /Wikipedia took too long/);
    const caller = new AbortController();
    caller.abort(new Error('Newer search'));
    await assert.rejects(requestJson('https://example.com', { signal: caller.signal }), /Newer search/);
  } finally { globalThis.fetch = previous; }
});
