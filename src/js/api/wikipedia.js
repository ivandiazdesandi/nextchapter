import { requestJson } from './openLibrary.js?v=final1';

export function authorUrl(name) {
  if (typeof name !== 'string' || !name.trim()) throw new Error('Choose a book with an author first.');
  const url = new URL('https://en.wikipedia.org/w/api.php');
  const params = {
    action: 'query', format: 'json', formatversion: '2', origin: '*', redirects: '1',
    titles: name.trim(), prop: 'extracts|pageprops|info', exintro: '1', explaintext: '1',
    exsentences: '4', inprop: 'url', ppprop: 'disambiguation',
  };
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);
  return url;
}

export function normalizeAuthor(data) {
  if (!Array.isArray(data?.query?.pages)) throw new Error('Wikipedia returned an unexpected response.');
  const page = data.query.pages[0];
  if (!page || page.missing || page.invalid || page.ns !== 0
    || Object.hasOwn(page.pageprops || {}, 'disambiguation')) return null;
  if (typeof page.title !== 'string' || typeof page.extract !== 'string' || !page.extract.trim()) return null;
  // Use a canonical, fixed-host URL rather than trusting a link from third-party JSON.
  return {
    title: page.title,
    extract: page.extract.length > 1000 ? `${page.extract.slice(0, 997)}…` : page.extract,
    url: `https://en.wikipedia.org/wiki/${encodeURIComponent(page.title.replaceAll(' ', '_'))}`,
  };
}

export async function getAuthorBiography(name, options = {}) {
  const data = await requestJson(authorUrl(name), { ...options, provider: 'Wikipedia' });
  if (data.error) throw new Error('Wikipedia could not complete the author lookup. Please try again.');
  return normalizeAuthor(data);
}
