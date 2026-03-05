const fs = require('fs');
const path = require('path');
const dir = path.join(__dirname, '..', 'src', 'i18n', 'locales');

// Keys to add: [path, translations_per_locale]
const keysToAdd = [
  {
    path: ['admin', 'emails', 'inbox', 'selectConversation'],
    translations: {
      en: 'Select a message to read',
      fr: 'Sélectionnez un message pour le lire',
      ar: 'حدد رسالة لقراءتها', 'ar-dz': 'حدد رسالة لقراءتها',
      'ar-lb': 'حدد رسالة لقراءتها', 'ar-ma': 'حدد رسالة لقراءتها',
      de: 'Wählen Sie eine Nachricht zum Lesen',
      es: 'Seleccione un mensaje para leer',
      gcr: 'Sélectionnez un message pour le lire',
      hi: 'पढ़ने के लिए एक संदेश चुनें',
      ht: 'Chwazi yon mesaj pou li',
      it: 'Seleziona un messaggio da leggere',
      ko: '읽을 메시지를 선택하세요',
      pa: 'ਪੜ੍ਹਨ ਲਈ ਸੁਨੇਹਾ ਚੁਣੋ',
      pl: 'Wybierz wiadomość do przeczytania',
      pt: 'Selecione uma mensagem para ler',
      ru: 'Выберите сообщение для чтения',
      sv: 'Välj ett meddelande att läsa',
      ta: 'படிக்க ஒரு செய்தியைத் தேர்ந்தெடுக்கவும்',
      tl: 'Pumili ng mensahe na babasahin',
      vi: 'Chọn một tin nhắn để đọc',
      zh: '选择一条消息阅读'
    }
  },
  {
    path: ['admin', 'chat', 'timeNow'],
    translations: {
      en: 'now', fr: 'maintenant', ar: 'الآن', 'ar-dz': 'الآن',
      'ar-lb': 'الآن', 'ar-ma': 'الآن', de: 'jetzt', es: 'ahora',
      gcr: 'astè', hi: 'अभी', ht: 'kounye a', it: 'adesso',
      ko: '지금', pa: 'ਹੁਣੇ', pl: 'teraz', pt: 'agora',
      ru: 'сейчас', sv: 'nu', ta: 'இப்போது', tl: 'ngayon',
      vi: 'bây giờ', zh: '刚刚'
    }
  },
  {
    path: ['admin', 'chat', 'timeMinute'],
    translations: {
      en: 'm', fr: 'min', ar: 'د', 'ar-dz': 'د',
      'ar-lb': 'د', 'ar-ma': 'د', de: 'min', es: 'min',
      gcr: 'min', hi: 'मि', ht: 'min', it: 'min',
      ko: '분', pa: 'ਮਿੰ', pl: 'min', pt: 'min',
      ru: 'мин', sv: 'min', ta: 'நிமி', tl: 'min',
      vi: 'ph', zh: '分'
    }
  },
  {
    path: ['admin', 'chat', 'timeHour'],
    translations: {
      en: 'h', fr: 'h', ar: 'س', 'ar-dz': 'س',
      'ar-lb': 'س', 'ar-ma': 'س', de: 'h', es: 'h',
      gcr: 'h', hi: 'घं', ht: 'h', it: 'h',
      ko: '시간', pa: 'ਘੰ', pl: 'g', pt: 'h',
      ru: 'ч', sv: 'h', ta: 'மணி', tl: 'o',
      vi: 'g', zh: '时'
    }
  }
];

const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
let totalUpdated = 0;

for (const file of files) {
  const locale = file.replace('.json', '');
  const filePath = path.join(dir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
  let modified = false;

  for (const keyDef of keysToAdd) {
    // Navigate to parent object
    let obj = data;
    for (let i = 0; i < keyDef.path.length - 1; i++) {
      if (!obj[keyDef.path[i]]) obj[keyDef.path[i]] = {};
      obj = obj[keyDef.path[i]];
    }

    const leafKey = keyDef.path[keyDef.path.length - 1];
    if (!obj[leafKey]) {
      obj[leafKey] = keyDef.translations[locale] || keyDef.translations.en;
      console.log(`  Added ${keyDef.path.join('.')} to ${file}`);
      modified = true;
    }
  }

  if (modified) {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
    totalUpdated++;
  }
}
console.log(`\nUpdated ${totalUpdated} files`);
