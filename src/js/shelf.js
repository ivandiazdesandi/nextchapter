import { readShelf } from './storage.js';
import { bookCard, showMessage } from './ui.js';
const container = document.querySelector('#shelf-books');
const { books, warning } = readShelf();
if (warning) document.querySelector('#shelf-status').textContent = warning;
if (books.length) container.replaceChildren(...books.map(bookCard));
else showMessage(container, 'A little space for your next reads', 'Shelf saving, reading statuses, and personal notes are coming in the next update. For now, explore a title through Search.');
