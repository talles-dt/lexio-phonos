/* eslint-disable @typescript-eslint/no-require-imports -- Next ESLint loads this synchronous adapter through CommonJS. */
const { isAbsolute } = require('node:path');
const { globSync: glob } = require('tinyglobby');

// Next 16.3.8 only calls globSync(string, { onlyDirectories: true }).
// Fail explicitly if an upstream update starts relying on another API.
exports.globSync = (pattern, options) => {
  if (typeof pattern !== 'string' || options?.onlyDirectories !== true ||
      Object.keys(options).some((key) => key !== 'onlyDirectories')) {
    throw new TypeError('Unsupported Next ESLint glob contract; review the dependency override.');
  }
  return glob(pattern, {
    onlyDirectories: true,
    expandDirectories: false,
    absolute: isAbsolute(pattern),
  }).map((directory) => directory.length > 1 ? directory.replace(/\/$/, '') : directory);
};
