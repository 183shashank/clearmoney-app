// Indian number format: ₹1,23,456
export function formatINR(amount, compact = false) {
  const num = Math.abs(Math.round(Number(amount) || 0));

  if (compact) {
    if (num >= 10_00_000) return `₹${(num / 10_00_000).toFixed(1)}L`;
    if (num >= 1_00_000) return `₹${(num / 1_00_000).toFixed(1)}L`;
    if (num >= 1_000) return `₹${(num / 1_000).toFixed(1)}K`;
    return `₹${num}`;
  }

  const str = num.toString();
  if (str.length <= 3) return `₹${str}`;

  const lastThree = str.slice(-3);
  const remaining = str.slice(0, -3);
  const withCommas = remaining.replace(/\B(?=(\d{2})+(?!\d))/g, ',');

  const sign = Number(amount) < 0 ? '-' : '';
  return `${sign}₹${withCommas},${lastThree}`;
}

export function formatDate(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function formatMonthYear(date) {
  return new Date(date).toLocaleDateString('en-IN', {
    month: 'long',
    year: 'numeric',
  });
}

export function formatPercent(value, decimals = 1) {
  return `${Number(value).toFixed(decimals)}%`;
}

export function getIncomeAmount(range) {
  const map = {
    'Under ₹25K': 20000,
    '₹25K–50K': 37500,
    '₹50K–1L': 65000,
    '₹1L–2L': 150000,
    'Above ₹2L': 250000,
  };
  return map[range] || 65000;
}
