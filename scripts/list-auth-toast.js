const en = require('../src/i18n/locales/en.json');
const ar = require('../src/i18n/locales/ar.json');
function unt(e, a, p) {
  let r = {};
  if (!e || !a) return r;
  for (const k of Object.keys(e)) {
    const key = p ? p + '.' + k : k;
    if (typeof e[k] === 'string') {
      if (a[k] === e[k]) r[key] = e[k];
    } else if (typeof e[k] === 'object' && e[k] !== null && !Array.isArray(e[k])) {
      Object.assign(r, unt(e[k], a[k] || {}, key));
    }
  }
  return r;
}
console.log('=== AUTH ===');
const authKeys = unt(en.auth, ar.auth, 'auth');
for (const [k, v] of Object.entries(authKeys)) console.log(k + ' = ' + v);
console.log('\nAUTH total:', Object.keys(authKeys).length);

console.log('\n=== TOAST ===');
const toastKeys = unt(en.toast, ar.toast, 'toast');
for (const [k, v] of Object.entries(toastKeys)) console.log(k + ' = ' + v);
console.log('\nTOAST total:', Object.keys(toastKeys).length);
