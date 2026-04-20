import { categorizeTransaction } from './categorize.js';

// Extract text from PDF preserving row structure via Y-position grouping
async function extractRows(file) {
  if (!window.pdfjsLib) throw new Error('pdf.js not loaded');

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allRows = [];

  for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
    const page = await pdf.getPage(pageNum);
    const content = await page.getTextContent();

    // Group items by rounded Y coordinate → same row
    const rowMap = {};
    for (const item of content.items) {
      if (!item.str?.trim()) continue;
      const y = Math.round(item.transform[5]);
      if (!rowMap[y]) rowMap[y] = [];
      rowMap[y].push({ x: item.transform[4], text: item.str.trim() });
    }

    // Sort rows top→bottom (higher Y = higher on page in PDF coords)
    const sortedRows = Object.entries(rowMap)
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .map(([, items]) => {
        items.sort((a, b) => a.x - b.x);
        return items.map(i => i.text).join('  ');
      });

    allRows.push(...sortedRows);
  }

  return allRows;
}

// ── Date parsing ─────────────────────────────────────────────────────────────
function parseDate(str) {
  if (!str) return null;
  const s = str.trim();

  // DD/MM/YYYY or DD-MM-YYYY
  let m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);

  // DD/MM/YY or DD-MM-YY
  m = s.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (m) {
    const yr = +m[3] + (+m[3] > 50 ? 1900 : 2000);
    return new Date(yr, +m[2] - 1, +m[1]);
  }

  // DD MMM YYYY  e.g. "05 Mar 2025"
  m = s.match(/^(\d{1,2})\s+(\w{3})\s+(\d{4})$/i);
  if (m) return new Date(`${m[1]} ${m[2]} ${m[3]}`);

  // DDMmmYY  e.g. "05Mar25"
  m = s.match(/^(\d{2})([A-Za-z]{3})(\d{2,4})$/);
  if (m) return new Date(`${m[1]} ${m[2]} ${m[3]}`);

  // YYYY-MM-DD
  m = s.match(/^(\d{4})[\/\-](\d{2})[\/\-](\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

  return null;
}

function parseAmount(str) {
  if (!str) return 0;
  return parseFloat(str.replace(/,/g, '').replace(/[^\d.]/g, '')) || 0;
}

// Find a date token anywhere in a string
function extractDate(row) {
  const tokens = row.split(/\s{2,}|\t/).map(t => t.trim()).filter(Boolean);
  for (const tok of tokens) {
    // Try full token
    const d = parseDate(tok);
    if (d && !isNaN(d.getTime())) return { date: d, token: tok };
    // Try sub-matches
    const m = tok.match(/\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4}/) ||
              tok.match(/\d{2}[A-Za-z]{3}\d{2,4}/) ||
              tok.match(/\d{1,2}\s+\w{3}\s+\d{4}/);
    if (m) {
      const d2 = parseDate(m[0]);
      if (d2 && !isNaN(d2.getTime())) return { date: d2, token: m[0] };
    }
  }
  return null;
}

// Extract all numeric amounts from a string
function extractAmounts(str) {
  const matches = str.match(/\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?/g) || [];
  return matches
    .map(m => parseFloat(m.replace(/,/g, '')))
    .filter(n => n >= 1 && n < 10_000_000);
}

// ── Main row-level parser ─────────────────────────────────────────────────────
function parseRows(rows) {
  const transactions = [];
  let id = 0;

  // Detect if this looks like a structured bank statement
  // by checking for header keywords
  const fullText = rows.join(' ').toLowerCase();
  const hasDebitCredit = /\b(debit|withdrawal|credit|deposit)\b/.test(fullText);

  for (const row of rows) {
    if (row.length < 8) continue;

    // Must contain a date
    const dateResult = extractDate(row);
    if (!dateResult) continue;
    const { date } = dateResult;

    // Sanity-check date range (last 3 years)
    const now = new Date();
    if (date > now || date < new Date(now.getFullYear() - 3, 0, 1)) continue;

    const lc = row.toLowerCase();
    const amounts = extractAmounts(row);
    if (amounts.length === 0) continue;

    // Skip header/summary rows
    if (/\b(opening|closing|balance b\/f|total|brought forward)\b/.test(lc)) continue;

    // Determine description: everything between date token and first large number
    const afterDate = row.slice(row.indexOf(dateResult.token) + dateResult.token.length)
      .replace(/\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);
    const description = afterDate || 'Transaction';

    // Determine type using keywords or column heuristics
    const isCreditKeyword = /\b(cr|credit|credited|deposit|deposited|salary|neft cr|imps cr|received|refund|cashback)\b/.test(lc);
    const isDebitKeyword  = /\b(dr|debit|debited|withdrawal|withdrawn|payment|purchase|transfer out)\b/.test(lc);

    let type;
    if (isCreditKeyword && !isDebitKeyword) {
      type = 'credit';
    } else if (isDebitKeyword && !isCreditKeyword) {
      type = 'debit';
    } else {
      // Heuristic: for statements with 3+ amounts (withdrawal, deposit, balance),
      // if second amount > 0 → credit; if first > 0 → debit
      // For statements with 2 amounts: first = txn amount, second = balance
      // We use the smallest non-zero amount as the transaction amount
      // and try to guess type from description
      const descLc = description.toLowerCase();
      const likelyCreditDesc = /salary|refund|cashback|reward|interest|dividend|reversal/.test(descLc);
      type = likelyCreditDesc ? 'credit' : 'debit';
    }

    // Pick the transaction amount (not the running balance)
    // Running balance is usually the largest number; transaction is smaller
    let amount;
    if (amounts.length === 1) {
      amount = amounts[0];
    } else if (amounts.length === 2) {
      // Second is likely balance; first is the transaction
      amount = amounts[0];
    } else {
      // 3 columns: withdrawal | deposit | balance
      // For credit: deposit column (index 1) is non-zero
      // For debit: withdrawal column (index 0) is non-zero
      if (type === 'credit') {
        amount = amounts[1] || amounts[0];
      } else {
        amount = amounts[0];
      }
    }

    if (!amount || amount <= 0) continue;

    transactions.push({
      id: `pdf-${++id}`,
      date,
      description: description.trim(),
      amount,
      type,
      category: categorizeTransaction(description, type),
    });
  }

  return transactions;
}

// ── Dedup consecutive identical transactions ──────────────────────────────────
function dedup(txns) {
  const seen = new Set();
  return txns.filter(t => {
    const key = `${t.date.toDateString()}-${t.amount}-${t.type}-${t.description.slice(0, 20)}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Public entry point ────────────────────────────────────────────────────────
export async function parsePDF(file, onProgress) {
  onProgress?.(10);

  let rows;
  try {
    rows = await extractRows(file);
  } catch (err) {
    console.warn('[PDF Parser] Extraction failed:', err.message);
    return [];
  }

  onProgress?.(55);

  let transactions = parseRows(rows);
  onProgress?.(85);

  transactions = dedup(transactions);

  // Remove outliers (amounts > 99th percentile are likely balance figures that slipped through)
  if (transactions.length > 5) {
    const sorted = [...transactions].map(t => t.amount).sort((a, b) => a - b);
    const p99 = sorted[Math.floor(sorted.length * 0.99)];
    transactions = transactions.filter(t => t.amount <= p99 * 2);
  }

  onProgress?.(100);
  console.log(`[PDF Parser] Extracted ${transactions.length} transactions from ${rows.length} rows`);
  return transactions;
}
