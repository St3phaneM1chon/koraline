const en = require('../src/i18n/locales/en.json');
const keys = [
  'shop.giftCard.giftCardLabel', 'shop.giftCard.messageLabel', 'shop.giftCard.peptidePlusLabel',
  'shop.giftCard.placeholderAmount', 'shop.giftCard.placeholderCode', 'shop.giftCard.placeholderMessage',
  'shop.giftCard.placeholderRecipientEmail', 'shop.giftCard.placeholderRecipientName', 'shop.giftCard.toLabel',
  'shop.stockAlert.emailPlaceholder', 'shop.trackOrder.placeholderEmail', 'shop.trackOrder.placeholderOrderNumber',
  'common.aria.googleLogo', 'footer.companyName', 'footer.companyNeq',
  'footer.paymentApplePay', 'footer.paymentGooglePay', 'footer.paymentMastercard',
  'footer.paymentPaypal', 'footer.paymentVisa', 'footer.placeholder.email',
  'auth.emailPlaceholder', 'auth.mfaPlaceholder'
];
function get(o, k) { const p = k.split('.'); let c = o; for (const s of p) { if (!c || typeof c !== 'object') return undefined; c = c[s]; } return c; }
for (const k of keys) console.log(k + ' = "' + get(en, k) + '"');
