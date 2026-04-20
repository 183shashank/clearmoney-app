import { categorizeTransaction } from './categorize.js';

// ── Step 1: Extract rows preserving X-position per item ───────────────────────
async function extractRowItems(file) {
  if (!window.pdfjsLib) throw new Error('pdf.js not loaded');

  const arrayBuffer = await file.arrayBuffer();
  const pdf = await window.pdfjsLib.getDocument({ data: arrayBuffer }).promise;

  const allRows = [];

  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();

    // Group text items by Y coordinate (rounded to handle sub-pixel jitter)
    const rowMap = {};
    for (const item of content.items) {
      const text = item.str?.trim();
      if (!text) continue;
      const y = Math.round(item.transform[5]);
      if (!rowMap[y]) rowMap[y] = [];
      rowMap[y].push({ x: item.transform[4], text });
    }

    // Sort rows top-to-bottom; items within each row left-to-right
    Object.entries(rowMap)
      .sort((a, b) => Number(b[0]) - Number(a[0]))
      .forEach(([, items]) => {
        items.sort((a, b) => a.x - b.x);
        allRows.push(items);
      });
  }

  return allRows;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const AMOUNT_RE = /^\d{1,3}(?:,\d{2,3})*(?:\.\d{0,2})?$|^\d{4,}(?:\.\d{0,2})?$/;

function isAmountStr(s) {
  return AMOUNT_RE.test(s.trim());
}

function parseAmount(s) {
  return parseFloat((s || '').replace(/,/g, '')) || 0;
}

function parseDate(s) {
  if (!s) return null;
  const t = s.trim();

  // DD/MM/YYYY or DD-MM-YYYY
  let m = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (m) return new Date(+m[3], +m[2] - 1, +m[1]);

  // DD/MM/YY or DD-MM-YY
  m = t.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2})$/);
  if (m) {
    const yr = +m[3] + (+m[3] > 50 ? 1900 : 2000);
    return new Date(yr, +m[2] - 1, +m[1]);
  }

  // DDMmmYYYY or DDMmmYY (e.g. 01Jan2025 or 01Jan25)
  m = t.match(/^(\d{1,2})([A-Za-z]{3})(\d{2,4})$/);
  if (m) { const d = new Date(`${m[1]} ${m[2]} ${m[3]}`); if (!isNaN(d)) return d; }

  // DD MMM YYYY (e.g. 01 Jan 2025)
  m = t.match(/^(\d{1,2})\s+([A-Za-z]{3})\s+(\d{4})$/);
  if (m) { const d = new Date(`${m[1]} ${m[2]} ${m[3]}`); if (!isNaN(d)) return d; }

  // YYYY-MM-DD
  m = t.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) return new Date(+m[1], +m[2] - 1, +m[3]);

  return null;
}

const SKIP_PATTERNS = /\b(date|narration|description|particulars|chq|ref no|value dt|withdrawal|deposit|balance|opening|closing|total|brought forward|carried forward|page|statement period|account no|ifsc|branch)\b/i;

// ── Step 2: Parse rows using balance-change tracking ──────────────────────────
function parseRows(allRows) {
  const transactions = [];
  let txId = 0;
  let prevBalance = null;

  const now = new Date();
  const cutoff = new Date(now.getFullYear() - 3, 0, 1);

  for (const items of allRows) {
    if (items.length < 2) continue;

    const rowText = items.map(i => i.text).join(' ');

    // Skip header/summary rows
    if (SKIP_PATTERNS.test(rowText)) {
      continue;
    }

    // ── Find a date in the first 4 tokens ──────────────────────────────────
    let date = null;
    let dateIdx = -1;

    for (let i = 0; i < Math.min(items.length, 5); i++) {
      // Try single token
      let d = parseDate(items[i].text);
      if (d && d > cutoff && d <= now) { date = d; dateIdx = i; break; }

      // Try two consecutive tokens (e.g. "01" "Jan 2025" or "01 Jan" "2025")
      if (i < items.length - 1) {
        d = parseDate(`${items[i].text} ${items[i + 1].text}`);
        if (d && d > cutoff && d <= now) { date = d; dateIdx = i; break; }
      }

      // Try three consecutive tokens (e.g. "01" "Jan" "2025")
      if (i < items.length - 2) {
        d = parseDate(`${items[i].text} ${items[i + 1].text} ${items[i + 2].text}`);
        if (d && d > cutoff && d <= now) { date = d; dateIdx = i; break; }
      }
    }

    if (!date) continue;

    // ── Collect monetary amount items sorted by X position (left→right) ────
    const amtItems = items
      .filter(i => isAmountStr(i.text))
      .map(i => ({ x: i.x, value: parseAmount(i.text) }))
      .filter(i => i.value >= 0.01)
      .sort((a, b) => a.x - b.x);

    if (amtItems.length === 0) continue;

    // ── Determine type + transaction amount ────────────────────────────────
    let type, txAmount;

    // The rightmost amount is almost always the running balance
    const balanceCandidate = amtItems[amtItems.length - 1].value;

    if (prevBalance !== null && amtItems.length >= 2) {
      // PRIMARY: balance-change tracking
      const diff = balanceCandidate - prevBalance;

      // Skip rows where balance didn't meaningfully change (likely a header or
      // sub-total row that slipped through)
      if (Math.abs(diff) < 0.5) continue;

      type = diff > 0 ? 'credit' : 'debit';
      const balanceDiff = Math.abs(diff);

      // Find the amount item closest to the balance diff (avoids using the balance itself)
      const nonBalance = amtItems.slice(0, -1);
      const best = nonBalance.reduce((b, a) =>
        Math.abs(a.value - balanceDiff) < Math.abs(b.value - balanceDiff) ? a : b,
        nonBalance[0]
      );

      // Accept the matched item if within 1% tolerance, else use the diff directly
      txAmount = (Math.abs(best.value - balanceDiff) / balanceDiff < 0.01)
        ? best.value
        : balanceDiff;

    } else {
      // FALLBACK (no balance context): use Dr/Cr tokens + keywords
      const lc = rowText.toLowerCase();
      const hasCr = /\b(cr|credit|credited|salary|neft cr|imps cr|by neft|by transfer|by clearing|by imps|deposit|received|cashback|refund|reversal|interest credited)\b/.test(lc);
      const hasDr = /\b(dr|debit|debited|withdrawal|withdrawn|payment|purchase|transfer to|to neft|to imps|to upi)\b/.test(lc);

      if (hasCr && !hasDr) type = 'credit';
      else if (hasDr && !hasCr) type = 'debit';
      else type = 'debit'; // safe default

      // Amount: second from right (rightmost assumed to be balance)
      txAmount = amtItems.length >= 2
        ? amtItems[amtItems.length - 2].value
        : amtItems[0].value;
    }

    prevBalance = balanceCandidate;

    if (!txAmount || txAmount <= 0 || txAmount > 10_000_000) continue;

    // ── Build description from non-date, non-amount tokens ─────────────────
    const amtXSet = new Set(amtItems.map(a => a.x));
    const descTokens = items
      .filter((item, idx) => {
        if (idx === dateIdx) return false;
        if (amtXSet.has(item.x) && isAmountStr(item.text)) return false;
        if (item.text.length <= 1) return false;
        // Filter pure numbers that aren't amounts (cheque/ref numbers)
        if (/^\d+$/.test(item.text) && item.text.length >= 5) return false;
        return true;
      })
      .map(i => i.text)
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 80);

    const description = descTokens || 'Transaction';

    transactions.push({
      id: `pdf-${++txId}`,
      date,
      description,
      amount: txAmount,
      type,
      category: categorizeTransaction(description, type),
    });
  }

  return transactions;
}

// ── Dedup identical consecutive transactions ──────────────────────────────────
function dedup(txns) {
  const seen = new Set();
  return txns.filter(t => {
    const key = `${t.date.toDateString()}-${t.amount.toFixed(2)}-${t.type}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ── Public entry point ────────────────────────────────────────────────────────
export async function parsePDF(file, onProgress) {
  onProgress?.(10);

  let rowItems;
  try {
    rowItems = await extractRowItems(file);
  } catch (err) {
    console.warn('[PDF Parser] Extraction failed:', err.message);
    return [];
  }

  onProgress?.(55);

  let transactions = parseRows(rowItems);

  onProgress?.(88);

  transactions = dedup(transactions);

  onProgress?.(100);
  console.log(`[PDF Parser] Extracted ${transactions.length} transactions from ${rowItems.length} rows`);
  return transactions;
}
