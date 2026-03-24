#!/usr/bin/env node
/**
 * Propagate mobile i18n keys from en.json to all other locale files (except fr.json).
 * Deep-merges: keeps existing translations, adds missing keys with English fallback values.
 */

const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'src', 'i18n', 'locales');
const SKIP = new Set(['en.json', 'fr.json']);

// Deep count of leaf keys
function countLeaves(obj, prefix = '') {
  let count = 0;
  for (const key of Object.keys(obj)) {
    if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
      count += countLeaves(obj[key], `${prefix}${key}.`);
    } else {
      count++;
    }
  }
  return count;
}

// Deep merge: target gets all keys from source that it doesn't already have.
// Returns the number of leaf keys added.
function deepMerge(target, source) {
  let added = 0;
  for (const key of Object.keys(source)) {
    if (!(key in target)) {
      // Entire subtree is missing — add it all
      target[key] = JSON.parse(JSON.stringify(source[key]));
      if (typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key])) {
        added += countLeaves(source[key]);
      } else {
        added++;
      }
    } else if (
      typeof source[key] === 'object' && source[key] !== null && !Array.isArray(source[key]) &&
      typeof target[key] === 'object' && target[key] !== null && !Array.isArray(target[key])
    ) {
      // Both are objects — recurse
      added += deepMerge(target[key], source[key]);
    }
    // If key exists and is a leaf in target, keep the existing translation
  }
  return added;
}

// Main
const enData = JSON.parse(fs.readFileSync(path.join(LOCALES_DIR, 'en.json'), 'utf8'));
const mobileSrc = enData.mobile;

if (!mobileSrc) {
  console.error('ERROR: No "mobile" key found in en.json');
  process.exit(1);
}

const totalEnKeys = countLeaves(mobileSrc);
console.log(`English mobile section has ${totalEnKeys} leaf keys.\n`);

const files = fs.readdirSync(LOCALES_DIR).filter(f => f.endsWith('.json') && !SKIP.has(f)).sort();
let totalAdded = 0;

for (const file of files) {
  const filePath = path.join(LOCALES_DIR, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));

  if (!data.mobile) {
    data.mobile = {};
  }

  const added = deepMerge(data.mobile, mobileSrc);
  totalAdded += added;

  // Write back with 2-space indent and trailing newline
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n', 'utf8');

  const status = added === totalEnKeys ? '(NEW - full section added)' :
                 added === 0 ? '(already complete)' :
                 `(${added} keys added)`;
  console.log(`  ${file.padEnd(14)} ${status}`);
}

console.log(`\nDone. Total keys added across ${files.length} locales: ${totalAdded}`);
