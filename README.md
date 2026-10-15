# NextChapter

My WDD330 individual project: find a book by title, author, or subject and open its Open Library information. This is separate from the SleepOutside team application.

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

## Run locally

Requires Node 20.19+ or 22.12+.

```sh
npm install
npm run dev
npm test
npm run build
npm run preview
```

GitHub Pages serves the source pages from `main` at the repository root. They also work without a build because HTML uses relative URLs and browser-native JavaScript modules. Vite can produce a separate optimized `dist` build for another static host.

## Data and privacy

[Open Library Search API](https://openlibrary.org/dev/docs/api/search) supplies search results; `/works/{id}.json` supplies the description and subjects. Covers are served by `covers.openlibrary.org`. Searches are sent on submit, subject selection, sort changes, and Load more. No API key is needed. A query remains in the page URL so it can be reopened.

Search metadata is cached for this browser session to carry author/year into the initial detail view. The shelf uses `nextchapter.shelf.v1` in localStorage: work key, title, authors, cover ID, year, reading status, note, and update timestamp. A corrupt shelf is reported without overwriting it. Notes and statuses are stored only in this browser and are not sent to Open Library. Clearing browser storage removes the shelf; there is no account sync.

## Remaining work

Google Books enrichment, API credentials, ISBN/title-author matching, and two-provider error handling remain open on Trello. The final requirement for two independent API sources is not complete yet. Direct detail links may lack author/year until opened from a search or saved shelf. Broader phone-width, accessibility, failure testing, and peer feedback remain Week 7 work. This is the Week 6 shelf/search release, not the finished final project.

## Planning

[Trello project board](https://trello.com/b/zgfcoJrB/nextchapter-final-project)
