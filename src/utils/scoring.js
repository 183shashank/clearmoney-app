import { getIncomeAmount } from './formatters.js';

function clamp(val, min = 0, max = 100) {
  return Math.max(min, Math.min(max, val));
}

export function computeMetrics(transactions, profile) {
  const income = getIncomeAmount(profile.incomeRange || '₹50K–1L');

  // Detect actual statement duration from transaction dates
  const dates = transactions.map(t => new Date(t.date).getTime()).filter(Boolean);
  const spanMs = dates.length >= 2 ? Math.max(...dates) - Math.min(...dates) : 0;
  const months = Math.max(1, Math.round(spanMs / (30.44 * 24 * 60 * 60 * 1000))) || 1;

  // Split credits / debits
  const credits = transactions.filter(t => t.type === 'credit');
  const debits  = transactions.filter(t => t.type === 'debit');

  const totalCredit = credits.reduce((s, t) => s + t.amount, 0);
  const totalDebit  = debits.reduce((s, t) => s + t.amount, 0);

  const monthlyIncome   = totalCredit / months || income;
  const monthlyExpenses = totalDebit  / months;
  const monthlySavings  = monthlyIncome - monthlyExpenses;

  // ── Savings Rate ─────────────────────────────────────────────
  const savingsRate = monthlyIncome > 0 ? (monthlySavings / monthlyIncome) * 100 : 0;
  const savingsScore = clamp((savingsRate / 20) * 100);

  // ── Investment Exposure ──────────────────────────────────────
  const investDebits = debits.filter(t => t.category === 'Investment');
  const monthlyInvestment = investDebits.reduce((s, t) => s + t.amount, 0) / months;
  const investmentRate = monthlyIncome > 0 ? (monthlyInvestment / monthlyIncome) * 100 : 0;
  const investmentScore = clamp((investmentRate / 10) * 100);

  // ── Debt Load ────────────────────────────────────────────────
  const emiDebits = debits.filter(t => t.category === 'EMI / Loan');
  const monthlyEMI = emiDebits.reduce((s, t) => s + t.amount, 0) / months;
  const debtRate = monthlyIncome > 0 ? (monthlyEMI / monthlyIncome) * 100 : 0;
  const debtScore = clamp((1 - debtRate / 40) * 100);

  // ── Emergency Fund ───────────────────────────────────────────
  const savedMonthly = profile.monthlySavings || 0;
  const estimatedBalance = savedMonthly * 6; // assume 6 months of saving
  const emergencyCoverage = monthlyExpenses > 0 ? estimatedBalance / monthlyExpenses : 0;
  const emergencyScore = clamp((emergencyCoverage / 3) * 100);

  // ── Overall ──────────────────────────────────────────────────
  const overall = Math.round(
    savingsScore   * 0.30 +
    emergencyScore * 0.30 +
    investmentScore * 0.25 +
    debtScore      * 0.15
  );

  // ── Category breakdown ───────────────────────────────────────
  const categoryTotals = {};
  debits.forEach(t => {
    categoryTotals[t.category] = (categoryTotals[t.category] || 0) + t.amount;
  });

  const categoryMonthly = Object.entries(categoryTotals).map(([name, total]) => ({
    name,
    total,
    monthly: total / months,
  })).sort((a, b) => b.total - a.total);

  return {
    // monthly averages
    monthlyIncome,
    monthlyExpenses,
    monthlySavings,

    // rates
    savingsRate,
    investmentRate,
    debtRate,
    emergencyCoverage,

    // sub-scores (0–100)
    savingsScore,
    investmentScore,
    debtScore,
    emergencyScore,

    // overall
    overall: clamp(overall, 0, 100),

    // extra detail
    monthlyEMI,
    monthlyInvestment,
    estimatedBalance,
    categoryMonthly,
  };
}

export function getScoreLabel(score) {
  if (score >= 81) return { label: 'Excellent',      color: 'text-emerald-600', bg: 'bg-emerald-50', border: 'border-emerald-200' };
  if (score >= 61) return { label: 'On Track',       color: 'text-indigo-600',  bg: 'bg-indigo-50',  border: 'border-indigo-200' };
  if (score >= 41) return { label: 'Getting There',  color: 'text-amber-600',   bg: 'bg-amber-50',   border: 'border-amber-200' };
  return              { label: 'Needs Attention', color: 'text-red-600',     bg: 'bg-red-50',     border: 'border-red-200' };
}

export function getSubScoreStatus(score, type) {
  if (type === 'debt') {
    if (score >= 70) return { color: 'bg-emerald-500', text: 'text-emerald-700' };
    if (score >= 40) return { color: 'bg-amber-500',   text: 'text-amber-700'   };
    return                 { color: 'bg-red-500',      text: 'text-red-700'     };
  }
  if (score >= 70) return { color: 'bg-emerald-500', text: 'text-emerald-700' };
  if (score >= 40) return { color: 'bg-amber-500',   text: 'text-amber-700'   };
  return                 { color: 'bg-red-500',      text: 'text-red-700'     };
}
