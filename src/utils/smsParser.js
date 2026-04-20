import { categorizeTransaction } from './categorize.js';

// Patterns that cover most Indian bank SMS formats
const SMS_PATTERNS = [
  // "Rs.450.00 debited from A/c XX1234 to Swiggy on 12-04-25"
  {
    re: /Rs\.?\s*([\d,]+\.?\d{0,2})\s+(?:is\s+)?debited\s+from\s+.*?(?:to\s+(.+?))?\s+on\s+([\d\-\/]+)/i,
    type: 'debit',
    groups: { amount: 1, desc: 2, date: 3 },
  },
  // "INR 1,200.00 credited to A/c XXXX1234 on 01-03-2025 (SALARY)"
  {
    re: /(?:INR|Rs\.?)\s*([\d,]+\.?\d{0,2})\s+(?:is\s+)?credited\s+to\s+.*?(?:[\(\/](.+?)[\)\/])?\s+on\s+([\d\-\/]+)/i,
    type: 'credit',
    groups: { amount: 1, desc: 2, date: 3 },
  },
  // "Your A/c XX1234 is debited with Rs 2500 on 05Mar25 info: NETFLIX"
  {
    re: /(?:debited|deducted)\s+with\s+Rs\.?\s*([\d,]+\.?\d{0,2})\s+on\s+([\w\d\-\/]+).*?(?:info:|for|to)\s+(.+)/i,
    type: 'debit',
    groups: { amount: 1, date: 2, desc: 3 },
  },
  // UPI: "Sent Rs 350 to merchant@upi on 08-04-2025"
  {
    re: /sent\s+Rs\.?\s*([\d,]+\.?\d{0,2})\s+to\s+([^\s]+@[^\s]+)\s+on\s+([\d\-\/]+)/i,
    type: 'debit',
    groups: { amount: 1, desc: 2, date: 3 },
  },
  // UPI received: "Received Rs 5000 from someone@upi on 01-03-2025"
  {
    re: /received\s+Rs\.?\s*([\d,]+\.?\d{0,2})\s+from\s+([^\s]+)\s+on\s+([\d\-\/]+)/i,
    type: 'credit',
    groups: { amount: 1, desc: 2, date: 3 },
  },
  // Generic: "Debit: INR 1500.00 at AMAZON on 13APR2025"
  {
    re: /debit[:\s]+(?:INR|Rs\.?)\s*([\d,]+\.?\d{0,2})\s+(?:at|to|for)\s+(.+?)\s+on\s+([\w\d\-\/]+)/i,
    type: 'debit',
    groups: { amount: 1, desc: 2, date: 3 },
  },
  {
    re: /credit[:\s]+(?:INR|Rs\.?)\s*([\d,]+\.?\d{0,2})\s+(?:from)\s+(.+?)\s+on\s+([\w\d\-\/]+)/i,
    type: 'credit',
    groups: { amount: 1, desc: 2, date: 3 },
  },
];

function parseDate(str) {
  if (!str) return new Date();
  const cleaned = str.trim();

  // DD-MM-YYYY or DD/MM/YYYY
  let m = cleaned.match(/^(\d{2})[-\/](\d{2})[-\/](\d{4})$/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);

  // DD-MM-YY
  m = cleaned.match(/^(\d{2})[-\/](\d{2})[-\/](\d{2})$/);
  if (m) {
    const yr = parseInt(m[3]) + (parseInt(m[3]) > 50 ? 1900 : 2000);
    return new Date(`${yr}-${m[2]}-${m[1]}`);
  }

  // DDMmmYYYY e.g. 05Mar25
  m = cleaned.match(/^(\d{2})(\w{3})(\d{2,4})$/);
  if (m) return new Date(`${m[1]} ${m[2]} ${m[3]}`);

  return new Date();
}

function parseAmount(str) {
  return parseFloat((str || '0').replace(/,/g, '')) || 0;
}

function cleanDescription(str) {
  if (!str) return 'UPI Transaction';
  // Remove UPI VPA noise, keep merchant name
  return str
    .replace(/@[a-z]+/gi, '')
    .replace(/[_\-\.]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 60) || 'UPI Transaction';
}

export function parseSMS(rawText) {
  if (!rawText || !rawText.trim()) return [];

  const transactions = [];
  const lines = rawText.split(/\n+/).map(l => l.trim()).filter(l => l.length > 10);

  let id = 0;
  for (const line of lines) {
    let matched = false;

    for (const pattern of SMS_PATTERNS) {
      const m = line.match(pattern.re);
      if (!m) continue;

      const { amount: aIdx, desc: dIdx, date: dtIdx } = pattern.groups;
      const amount = parseAmount(m[aIdx]);
      if (!amount || amount <= 0) continue;

      const description = cleanDescription(m[dIdx]);
      const date = parseDate(m[dtIdx]);
      const type = pattern.type;

      transactions.push({
        id: `sms-${++id}`,
        date,
        description,
        amount,
        type,
        category: categorizeTransaction(description, type),
      });
      matched = true;
      break;
    }

    // Fallback: look for any monetary amount in the line
    if (!matched) {
      const amtMatch = line.match(/(?:Rs\.?|₹|INR)\s*([\d,]+\.?\d{0,2})/i);
      if (!amtMatch) continue;

      const amount = parseAmount(amtMatch[1]);
      if (!amount || amount <= 0 || amount > 1_000_000) continue;

      const lc = line.toLowerCase();
      const type = /\b(credit|credited|received|salary|cashback)\b/.test(lc) ? 'credit' : 'debit';
      const description = line.replace(/[^\w\s]/g, ' ').replace(/\s+/g, ' ').slice(0, 60);

      transactions.push({
        id: `sms-${++id}`,
        date: new Date(),
        description: description || 'Transaction',
        amount,
        type,
        category: categorizeTransaction(description, type),
      });
    }
  }

  return transactions;
}
