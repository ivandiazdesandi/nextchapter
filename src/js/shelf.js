import { readShelf, removeBook, selectShelf } from './storage.js?v=final1';
import { bookCard, element, showMessage } from './ui.js?v=final1';
import { shelfControls } from './shelfControls.js?v=final1';

const container = document.querySelector('#shelf-books');
const message = document.querySelector('#shelf-status');
const filter = document.querySelector('#shelf-filter');
const sort = document.querySelector('#shelf-sort');

function render(focusKey) {
  const { books, warning } = readShelf();
  message.textContent = warning || `${books.length} ${books.length === 1 ? 'book' : 'books'} on your shelf.`;
  container.replaceChildren();
  if (warning) { showMessage(container, 'Your shelf needs attention', warning); return; }
  const visible = selectShelf(books, filter.value, sort.value);
  if (!visible.length) {
    showMessage(container, books.length ? 'No books in this section yet' : 'Your next reads start here',
      books.length ? 'Choose another reading status to see your saved books.' : 'Open a book from Search and save it to your shelf.');
    return;
  }
  for (const book of visible) {
    const card = bookCard(book);
    card.dataset.bookKey = book.key;
    card.append(element('p', 'status-badge', book.status));
    card.append(shelfControls(book, { editing: true, onSave(entry) {
      render(entry.key);
      message.textContent = `Saved changes to ${entry.title}.`;
    } }));
    const remove = element('button', 'text-button danger', 'Remove from shelf');
    remove.type = 'button';
    const confirmation = element('div', 'remove-confirmation');
    confirmation.hidden = true;
    confirmation.append(element('p', '', `Remove ${book.title} and its notes?`));
    const yes = element('button', 'button secondary', 'Yes, remove');
    const cancel = element('button', 'text-button', 'Keep book');
    yes.type = cancel.type = 'button';
    confirmation.append(yes, cancel);
    remove.addEventListener('click', () => { confirmation.hidden = false; remove.hidden = true; cancel.focus(); });
    cancel.addEventListener('click', () => { confirmation.hidden = true; remove.hidden = false; remove.focus(); });
    yes.addEventListener('click', () => {
      try { removeBook(book.key); render(); message.textContent = `Removed ${book.title} from your shelf.`; filter.focus(); }
      catch (error) { message.textContent = error.message; }
    });
    card.append(remove, confirmation);
    container.append(card);
  }
  if (focusKey) {
    const card = [...container.children].find(node => node.dataset.bookKey === focusKey);
    (card?.querySelector('select') || filter).focus();
  }
}
filter.addEventListener('change', () => render());
sort.addEventListener('change', () => render());
window.addEventListener('storage', () => render());
render();
