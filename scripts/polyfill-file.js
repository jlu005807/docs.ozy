try {
  const { File } = require('fetch-blob/file.js') || require('fetch-blob');
  if (File && !globalThis.File) globalThis.File = File;
} catch (e) {
  // polyfill failed or not needed
}
