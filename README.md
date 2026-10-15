# NextChapter

My WDD330 individual project: find a book, keep a reading shelf, and learn about its author. Book data comes from Open Library and author background comes from Wikipedia. This is separate from the SleepOutside team application.

## Search foundation

- Separate repository with a Vite multipage setup.
- Responsive search form with three combinable fields and subject shortcuts.
- Open Library requests with selected fields, response normalization, and a 15-second timeout.
- Result cards with title, author, publication year, cover, and missing-field fallbacks.
- Blank-query validation, loading, empty-result, API error, and retry states.
- Book detail page using Open Library works, plus search/details/shelf navigation.
- Versioned shelf schema and safe read/write helpers with tests.
- Keyboard focus styles, labels, skip link, status announcements, and reduced-motion support.

## Week 6 update

- Save a book from its detail page to Want to Read, Reading, or Finished.
- Edit reading status and notes (up to 1,000 characters), filter by status, and sort the shelf by title or recent update.
- Confirm removal before deleting a saved book and its notes.
- Keep one entry per Open Library work; re-read storage before each mutation to preserve other books.
- Block writes when existing shelf data is corrupt; report blocked/full storage rather than claiming success.
- Search by relevance, newest, or oldest first. Load more requests the next 12 results, omits duplicate works, and preserves existing cards if that request fails.
- Fifteen automated tests and the production build pass.

## Week 7 final update

- Nine normalized book attributes: key, title, authors, year, cover ID, ISBNs, subjects, languages, and edition count. Cards/details show edition metadata when supplied.
- Two independent data sources: Open Library for books and Wikipedia's MediaWiki Action API for author excerpts. Wikipedia replaced the planned Google Books enrichment after anonymous Google Books requests returned a quota error.
- The detail page looks up an exact author name, follows redirects, rejects missing/disambiguation pages, and provides article/license attribution. Author lookup failures have their own retry and never hide the book or shelf form.
- Direct book URLs can obtain the first author name from the Open Library author record.
- Shelf cards use a single column on phones, two on tablets, and three on wide screens. Card entry, cover lift, button lift/shadow, subject-chip motion, and editor focus transitions respect reduced-motion preferences.
- ESLint recommended rules, 21 automated tests, and the Vite production build pass.
- A 375px frame-based check is available at `tests/responsive.html`. This is a test utility, not an extra app feature.

## Run locally

Requires Node 20.19+ or 22.12+.

```sh
npm install
npm run dev
npm test
npm run lint
npm run build
npm run preview
```

GitHub Pages serves the source pages from `main` at the repository root. They also work without a build because HTML uses relative URLs and browser-native JavaScript modules. Vite can produce a separate optimized `dist` build for another static host.

## Data and privacy

[Open Library Search API](https://openlibrary.org/dev/docs/api/search) supplies search results; `/works/{id}.json` supplies the description and subjects. Covers are served by `covers.openlibrary.org`. Searches are sent on submit, subject selection, sort changes, and Load more. No API key is needed. A query remains in the page URL so it can be reopened.

Search metadata is cached for this browser session to carry author/year into the initial detail view. The shelf uses `nextchapter.shelf.v1` in localStorage: work key, title, authors, cover ID, year, reading status, note, and update timestamp. A corrupt shelf is reported without overwriting it. Notes and statuses are stored only in this browser and are not sent to Open Library. Clearing browser storage removes the shelf; there is no account sync.

## Scope and known limitations

Google Books and ISBN-based edition enrichment were dropped in favor of Wikipedia author background. The app does not promise page counts or previews it cannot provide. Exact-name lookups can miss an author or lead to an article for a namesake; the article title and source are shown so the reader can check it. Wikipedia disambiguation pages are not displayed as biographies. Only the first author receives an excerpt.

The shelf is device/browser-specific. It has no account or cloud sync. Peer feedback, a comprehensive screen-reader review, and Lighthouse auditing have not been completed and remain open on the board. The student still needs to record and host the required video.

## Wikipedia attribution

Author excerpts are shortened from Wikipedia contributors' articles, with a link to each article and the [CC BY-SA 4.0 license](https://creativecommons.org/licenses/by-sa/4.0/). The API requests plain text; it never inserts API-supplied HTML. No Wikipedia images are used.

## Manual verification

Use the public site for title/author/subject searches, sorting, Load more, book details, author attribution, and shelf save/edit/filter/remove. Use `tests/responsive.html` for the three app views at 375px. Unit tests exercise provider errors/timeouts, missing author data, corruption, blocked storage, duplicate saves, and page/sort parameters. A passing unit test is not a claim that a real provider outage was induced in the live browser.

## Planning

[Trello project board](https://trello.com/b/zgfcoJrB/nextchapter-final-project)
