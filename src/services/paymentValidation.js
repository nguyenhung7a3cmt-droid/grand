/**
 * Real Payment Card & Gateway Validation Service
 */

// Luhn Algorithm Card Checksum
export function validateLuhn(cardNumber) {
  const clean = cardNumber.replace(/\D/g, '');
  if (clean.length < 13 || clean.length > 19) return false;

  let sum = 0;
  let shouldDouble = false;

  for (let i = clean.length - 1; i >= 0; i--) {
    let digit = parseInt(clean.charAt(i), 10);

    if (shouldDouble) {
      digit *= 2;
      if (digit > 9) digit -= 9;
    }

    sum += digit;
    shouldDouble = !shouldDouble;
  }

  return sum % 10 === 0;
}

// Detect Card Brand
export function detectCardBrand(cardNumber) {
  const clean = cardNumber.replace(/\D/g, '');
  if (/^4/.test(clean)) return { name: 'Visa', icon: 'VISA', color: 'text-blue-400' };
  if (/^(5[1-5]|2[2-7])/.test(clean)) return { name: 'Mastercard', icon: 'MC', color: 'text-orange-400' };
  if (/^3[47]/.test(clean)) return { name: 'American Express', icon: 'AMEX', color: 'text-emerald-400' };
  if (/^6(?:011|5)/.test(clean)) return { name: 'Discover', icon: 'DISC', color: 'text-amber-400' };
  return { name: 'Card', icon: 'CARD', color: 'text-gs-light' };
}

// Validate Expiration MM/YY
export function validateExpiry(expiryStr) {
  const match = expiryStr.match(/^(\d{2})\/(\d{2}|\d{4})$/);
  if (!match) return { valid: false, message: 'Format MM/YY required' };

  const month = parseInt(match[1], 10);
  let year = parseInt(match[2], 10);
  if (year < 100) year += 2000;

  if (month < 1 || month > 12) {
    return { valid: false, message: 'Invalid month (01-12)' };
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear || (year === currentYear && month < currentMonth)) {
    return { valid: false, message: 'Card has expired' };
  }

  return { valid: true };
}

// Validate CVV / CVC
export function validateCVV(cvv, cardBrand = 'Card') {
  const clean = cvv.replace(/\D/g, '');
  if (cardBrand === 'American Express') {
    return clean.length === 4;
  }
  return clean.length === 3 || clean.length === 4;
}

// Generate Real PayPal Direct Checkout Link
export function getPayPalPaymentUrl(totalUSD, orderId, itemName = 'GrandStock Roblox Items') {
  const amount = parseFloat(totalUSD).toFixed(2);
  return `https://www.paypal.com/cgi-bin/webscr?cmd=_xclick&business=payments@grandstock.net&item_name=${encodeURIComponent(itemName)}&amount=${amount}&currency_code=USD&custom=${encodeURIComponent(orderId)}`;
}

// Generate Real Cash App Pay Link
export function getCashAppPaymentUrl(cashTag, totalUSD) {
  const cleanTag = (cashTag || 'GrandStock').replace(/[^a-zA-Z0-9_]/g, '');
  const amount = parseFloat(totalUSD).toFixed(2);
  return `https://cash.app/$${cleanTag}/${amount}`;
}
