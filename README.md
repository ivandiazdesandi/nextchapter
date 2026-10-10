# NextChapter

My WDD330 individual project: find a book by title, author, or subject and open its Open Library information. This is separate from the SleepOutside team application.

## Week 5 progress

- Separate repository with a Vite multipage setup.
- Responsive search form with three combinable fields and subject shortcuts.
- Open Library requests with selected fields, response normalization, and a 15-second timeout.
- Result cards with title, author, publication year, cover, and missing-field fallbacks.
- Blank-query validation, loading, empty-result, API error, and retry states.
- Book detail page using Open Library works, plus search/details/shelf navigation.
- Versioned shelf schema and safe read/write helpers with tests. Shelf saving/editing is not available in this release.
- Keyboard focus styles, labels, skip link, status announcements, and reduced-motion support.

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

[Open Library Search API](https://openlibrary.org/dev/docs/api/search) supplies search results; `/works/{id}.json` supplies the description and subjects. Covers are served by `covers.openlibrary.org`. Searches are sent only when submitted or when a subject shortcut is selected. No API key is needed. A query remains in the page URL so it can be reopened.

Search metadata is cached for this browser session to carry author/year into the initial detail view. The future shelf schema uses `nextchapter.shelf.v1` in localStorage: work key, title, authors, cover ID, year, reading status, note, and update timestamp. A corrupt shelf is reported without overwriting it.

## Remaining work

Google Books enrichment and ISBN/title-author matching are planned for Week 6, along with shelf saving, reading statuses, notes, sorting, and load-more pagination. The current search shows up to 12 matches. Directly opened detail links may lack author/year until they have been opened from a search. This is a working Week 5 release, not the finished final project.

## Planning

[Trello project board](https://trello.com/b/zgfcoJrB/nextchapter-final-project)
