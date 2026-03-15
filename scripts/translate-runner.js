const fs = require('fs');
const path = require('path');

const L = ['ar','de','es','it','pt','ru','zh','ko','hi','pl','sv','vi','tl','pa','ta','ht','gcr'];
const dialects = {'ar-dz':'ar','ar-lb':'ar','ar-ma':'ar'};

function set(o,k,v){const p=k.split('.');let c=o;for(let i=0;i<p.length-1;i++){if(!c[p[i]]||typeof c[p[i]]!=='object')c[p[i]]={};c=c[p[i]];}c[p[p.length-1]]=v;}

// Load all data files from scripts/i18n-data/
const dataDir = path.join(__dirname, 'i18n-data');
const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.js'));
let allT = [];
for (const f of files) {
  const mod = require(path.join(dataDir, f));
  allT = allT.concat(mod);
}

let total = 0;
for (const loc of [...L, ...Object.keys(dialects)]) {
  const fp = path.join(__dirname, '../src/i18n/locales', loc + '.json');
  const d = JSON.parse(fs.readFileSync(fp, 'utf8'));
  const src = dialects[loc] || loc;
  const li = L.indexOf(src);
  let c = 0;
  for (const r of allT) {
    if (r[li+1] != null && r[li+1] !== '') { set(d, r[0], r[li+1]); c++; }
  }
  fs.writeFileSync(fp, JSON.stringify(d, null, 2) + '\n');
  console.log(loc + ': ' + c + ' keys');
  total += c;
}
console.log('\nTotal: ' + total + ' translations applied');
