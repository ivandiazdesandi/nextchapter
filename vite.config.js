import { defineConfig } from 'vite';
import { resolve } from 'node:path';

export default defineConfig({
  base: './',
  build: {
    rollupOptions: {
      input: {
        search: resolve(import.meta.dirname, 'index.html'),
        book: resolve(import.meta.dirname, 'book.html'),
        shelf: resolve(import.meta.dirname, 'shelf.html'),
      },
    },
  },
});
