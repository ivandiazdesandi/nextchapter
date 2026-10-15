import { readShelf, saveBook, updateBook, STATUSES } from './storage.js';
import { element } from './ui.js';

export function shelfControls(book, { editing = false, onSave } = {}) {
  const form = element('form', 'shelf-editor');
  const prefix = book.key.replaceAll('/', '-');
  const initial = readShelf();
  const existing = initial.books.find(entry => entry.key === book.key);
  const statusLabel = element('label', '', 'Reading status');
  const status = element('select');
  status.id = `status${prefix}`;
  statusLabel.htmlFor = status.id;
  for (const name of STATUSES) {
    const option = element('option', '', name);
    option.value = name;
    status.append(option);
  }
  status.value = existing?.status || 'Want to Read';
  const noteLabel = element('label', '', 'My notes');
  const note = element('textarea');
  note.id = `note${prefix}`;
  noteLabel.htmlFor = note.id;
  note.maxLength = 1000;
  note.rows = 3;
  note.placeholder = 'What made you pick this book?';
  note.value = existing?.note || '';
  const hint = element('p', 'form-help', 'Up to 1,000 characters. Saved only in this browser.');
  hint.id = `hint${prefix}`;
  note.setAttribute('aria-describedby', hint.id);
  const button = element('button', 'button', existing ? 'Save changes' : 'Save to my shelf');
  button.type = 'submit';
  const message = element('p', 'editor-message');
  message.setAttribute('role', 'status');
  if (initial.warning) { message.textContent = initial.warning; button.disabled = true; }
  form.append(statusLabel, status, noteLabel, note, hint, button, message);
  form.addEventListener('submit', event => {
    event.preventDefault();
    try {
      const entry = editing
        ? updateBook(book.key, status.value, note.value)
        : saveBook(book, status.value, note.value);
      button.textContent = 'Save changes';
      message.classList.remove('validation');
      message.textContent = `Saved to ${entry.status}.`;
      onSave?.(entry);
    } catch (error) {
      message.classList.add('validation');
      message.textContent = error.message;
    }
  });
  form.addEventListener('input', () => { if (!initial.warning) message.textContent = ''; });
  return form;
}
