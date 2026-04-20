import { categorizeTransaction } from './categorize.js';

// Extract text from PDF using pdf.js (loaded globally from CDN)
async function extractPDFText(file) {
  if (!window.pdfjsLib) throw new Error('pdf.js not loaded');

  const arrayBuffer = await file.arrayBuffer();
  const loadingTask = window.pdfjsLib.getDocument({ data: arrayBuffer });
  const pdf = await loadingTask.promise;

  let fullText = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    const pageText = content.items.map(item => item.str).join(' ');
    fullText += pageText + '\n';
  }
  return fullText;
}

// Regex patterns for Indian bank statement formats
const DATE_PATTERNS = [
  /(\d{2}[\/\-]\d{2}[\/\-]\d{4})/,  // DD/MM/YYYY or DD-MM-YYYY
  /(\d{2}[\/\-]\d{2}[\/\-]\d{2})/,  // DD/MM/YY
  /(\d{2}\s+\w{3}\s+\d{4})/,        // DD Mon YYYY
  /(\d{4}[\/\-]\d{2}[\/\-]\d{2})/,  // YYYY-MM-DD
];

const AMOUNT_PATTERN = /(?:Rs\.?|₹|INR)?\s*([\d,]+\.?\d{0,2})/g;

function parseDate(str) {
  if (!str) return null;
  const cleaned = str.replace(/\s+/g, ' ').trim();

  // Try DD/MM/YYYY
  let m = cleaned.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{4})$/);
  if (m) return new Date(`${m[3]}-${m[2]}-${m[1]}`);

  // Try DD/MM/YY
  m = cleaned.match(/^(\d{2})[\/\-](\d{2})[\/\-](\d{2})$/);
  if (m) {
    const year = parseInt(m[3]) + (parseInt(m[3]) > 50 ? 1900 : 2000);
    return new Date(`${year}-${m[2]}-${m[1]}`);
  }

  // Try DD Mon YYYY
  m = cleaned.match(/^(\d{2})\s+(\w{3})\s+(\d{4})$/);
  if (m) return new Date(`${m[1]} ${m[2]} ${m[3]}`);

  return new Date(cleaned);
}

function parseAmount(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/,/g, '')) || 0;
}

// Try to parse HDFC-style statement
function parseHDFC(lines) {
  const transactions = [];
  // HDFC format: Date | Narration | Chq/Ref No | Value Dt | Withdrawal | Deposit | Closing Bal
  const rowRegex = /(\d{2}\/\d{2}\/\d{2,4})\s+(.*?)\s+([\d,]+\.?\d{0,2})?\s+([\d,]+\.?\d{0,2})?\s+([\d,]+\.?\d{0,2})/;

  for (const line of lines) {
    const m = line.match(rowRegex);
    if (!m) continue;
    const date = parseDate(m[1]);
    if (!date || isNaN(date.getTime())) continue;

    const description = (m[2] || '').trim();
    const withdrawal  = parseAmount(m[3]);
    const deposit     = parseAmount(m[4]);

    if (!description || (withdrawal === 0 && deposit === 0)) continue;

    if (deposit > 0) {
      transactions.push({
        id: `pdf-${Date.now()}-${Math.random()}`,
        date, description, amount: deposit, type: 'credit',
        category: categorizeTransaction(description, 'credit'),
      });
    }
    if (withdrawal > 0) {
      transactions.push({
        id: `pdf-${Date.now()}-${Math.random()}`,
        date, description, amount: withdrawal, type: 'debit',
        category: categorizeTransaction(description, 'debit'),
      });
    }
  }
  return transactions;
}

// Generic statement parser — tries to extract date + amount pairs
function parseGeneric(lines) {
  const transactions = [];
  let txId = 0;

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.length < 10) continue;

    // Look for a date at the start
    let dateStr = null;
    for (const pat of DATE_PATTERNS) {
      const m = trimmed.match(pat);
      if (m) { dateStr = m[1]; break; }
    }
    if (!dateStr) continue;

    const date = parseDate(dateStr);
    if (!date || isNaN(date.getTime())) continue;

    // Extract all amounts
    const amounts = [];
    let am;
    AMOUNT_PATTERN.lastIndex = 0;
    while ((am = AMOUNT_PATTERN.exec(trimmed)) !== null) {
      const val = parseAmount(am[1]);
      if (val > 0) amounts.push(val);
    }
    if (amounts.length === 0) continue;

    // Heuristic: description is text between date and first amount
    const afterDate = trimmed.slice(dateStr.length).trim();
    const description = afterDate.replace(/[\d,\.₹Rs]+/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 80);

    // Determine debit/credit: keywords or column position
    const lc = trimmed.toLowerCase();
    const isCredit = /\b(cr|credit|deposit|received|salary|refund)\b/.test(lc);
    const isDebit  = /\b(dr|debit|withdrawal|payment|purchase)\b/.test(lc);

    const amount = amounts[0];
    const type = isCredit ? 'credit' : 'debit';

    transactions.push({
      id: `pdf-${++txId}`,
      date,
      description: description || 'Transaction',
      amount,
      type,
      category: categorizeTransaction(description, type),
    });
  }
  return transactions;
}

export async function parsePDF(file, onProgress) {
  onProgress?.(10);
  const rawText = await extractPDFText(file);
  onProgress?.(50);

  const lines = rawText.split('\n').map(l => l.trim()).filter(Boolean);

  // Detect bank format
  const isHDFC = rawText.toLowerCase().includes('hdfc bank');
  const isICICI = rawText.toLowerCase().includes('icici bank');
  const isSBI   = rawText.toLowerCase().includes('state bank of india') || rawText.toLowerCase().includes('sbi');

  let transactions = [];

  if (isHDFC || isICICI || isSBI) {
    transactions = parseHDFC(lines); // try structured first
  }

  if (transactions.length < 3) {
    transactions = parseGeneric(lines);
  }

  onProgress?.(90);

  // Filter out future dates or very old dates
  const now = new Date();
  const oneYearAgo = new Date(now.getFullYear() - 2, now.getMonth(), 1);
  transactions = transactions.filter(t =>
    t.date >= oneYearAgo && t.date <= now && t.amount > 0 && t.amount < 10_000_000
  );

  onProgress?.(100);
  return transactions;
}
