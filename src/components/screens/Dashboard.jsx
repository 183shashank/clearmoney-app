import { useState } from 'react';
import {
  PiggyBank, Shield, TrendingUp, CreditCard,
  ArrowRight, BarChart2, RefreshCw, Info, Share2, Loader2
} from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatINR, formatPercent } from '../../utils/formatters.js';
import { getScoreLabel, getSubScoreStatus } from '../../utils/scoring.js';
import { getCategoryMeta } from '../../utils/categorize.js';
import HealthScoreRing from '../shared/HealthScoreRing.jsx';
import InsightCard from '../shared/InsightCard.jsx';
import { SkeletonInsightCard } from '../shared/SkeletonCard.jsx';

// ── Sub-score tile ────────────────────────────────────────────────────────────
function SubScoreTile({ icon: Icon, label, score, value, target, message, colorScheme, staggerClass }) {
  const status = getSubScoreStatus(score, colorScheme);

  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 p-5 hover:shadow-md transition-all duration-200 ${staggerClass}`}>
      <div className="flex items-center gap-2 mb-3">
        <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center">
          <Icon size={18} className="text-gray-500" />
        </div>
        <span className="text-sm font-medium text-gray-700">{label}</span>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-100 rounded-full h-1.5 mb-2">
        <div
          className={`h-1.5 rounded-full transition-all duration-700 ${status.color}`}
          style={{ width: `${Math.min(score, 100)}%` }}
        />
      </div>

      <div className="flex items-baseline justify-between mb-2">
        <span className={`text-lg font-bold ${status.text}`}>{value}</span>
        <span className="text-xs text-gray-400">Target: {target}</span>
      </div>

      <p className="text-xs text-gray-500 leading-relaxed">{message}</p>
    </div>
  );
}

// ── Month comparison modal ────────────────────────────────────────────────────
function MonthComparisonModal({ transactions, onClose }) {
  // Build per-month income, spending, savings
  const monthMap = {};
  transactions.forEach(t => {
    const key = `${t.date.getFullYear()}-${String(t.date.getMonth() + 1).padStart(2, '0')}`;
    if (!monthMap[key]) monthMap[key] = { income: 0, spending: 0 };
    if (t.type === 'credit') monthMap[key].income   += t.amount;
    else                     monthMap[key].spending += t.amount;
  });

  const sorted = Object.entries(monthMap)
    .sort((a, b) => b[0].localeCompare(a[0]))
    .slice(0, 3)
    .map(([key, { income, spending }]) => {
      const [year, month] = key.split('-');
      const label = new Date(Number(year), Number(month) - 1, 1)
        .toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
      const savings = income - spending;
      const savingsRate = income > 0 ? Math.round((savings / income) * 100) : 0;
      return { key, label, income, spending, savings, savingsRate };
    });

  // Month-over-month spending change (latest vs previous)
  const spendingDelta = sorted.length >= 2
    ? sorted[0].spending - sorted[1].spending
    : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h3 className="font-semibold text-gray-900">Month-by-Month Breakdown</h3>
            <p className="text-xs text-gray-400 mt-0.5">Income · Spending · Savings per month</p>
          </div>
          <button
            onClick={onClose}
            className="w-7 h-7 rounded-full flex items-center justify-center text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors text-lg leading-none"
          >
            &times;
          </button>
        </div>

        {/* Month-over-month delta banner */}
        {spendingDelta !== null && (
          <div className={`flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-xl mb-4 ${
            spendingDelta > 0
              ? 'bg-red-50 text-red-600'
              : 'bg-emerald-50 text-emerald-600'
          }`}>
            <span>{spendingDelta > 0 ? '↑' : '↓'}</span>
            <span>
              Spending {spendingDelta > 0 ? 'up' : 'down'}{' '}
              <span className="font-bold">{formatINR(Math.abs(spendingDelta))}</span>{' '}
              vs previous month
            </span>
          </div>
        )}

        {/* Per-month rows */}
        <div className="space-y-3">
          {sorted.map(({ key, label, income, spending, savings, savingsRate }, i) => (
            <div
              key={key}
              className={`rounded-xl border p-4 ${
                i === 0 ? 'border-indigo-200 bg-indigo-50/40' : 'border-gray-100 bg-gray-50/50'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-semibold text-gray-800">{label}</span>
                {i === 0 && (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-600">
                    Latest
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2 text-center">
                {/* Income */}
                <div className="bg-white rounded-lg py-2 px-1">
                  <div className="text-xs text-gray-400 mb-1">Income</div>
                  <div className="text-sm font-bold text-emerald-600">
                    {income > 0 ? formatINR(income) : '—'}
                  </div>
                </div>
                {/* Spending */}
                <div className="bg-white rounded-lg py-2 px-1">
                  <div className="text-xs text-gray-400 mb-1">Spending</div>
                  <div className="text-sm font-bold text-red-500">
                    {formatINR(spending)}
                  </div>
                </div>
                {/* Savings */}
                <div className="bg-white rounded-lg py-2 px-1">
                  <div className="text-xs text-gray-400 mb-1">Saved</div>
                  <div className={`text-sm font-bold ${savings >= 0 ? 'text-indigo-600' : 'text-red-500'}`}>
                    {income > 0 ? `${savingsRate}%` : formatINR(savings)}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full mt-4 px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 hover:-translate-y-0.5 hover:shadow-md transition-all duration-200"
        >
          Got it
        </button>
      </div>
    </div>
  );
}

// ── Category spending chart (simple bars) ─────────────────────────────────────
function SpendingCategories({ metrics }) {
  const top5 = (metrics?.categoryMonthly || [])
    .filter(c => c.name !== 'Income' && c.name !== 'Others')
    .slice(0, 5);

  const max = Math.max(...top5.map(c => c.monthly), 1);

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 stagger-4">
      <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <BarChart2 size={18} className="text-indigo-500" />
        Spending breakdown
      </h3>
      <div className="space-y-3">
        {top5.map(cat => {
          const meta = getCategoryMeta(cat.name);
          const pct = (cat.monthly / max) * 100;
          return (
            <div key={cat.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm text-gray-600 flex items-center gap-1.5">
                  <span>{meta.emoji}</span> {cat.name}
                </span>
                <span className="text-sm font-medium text-gray-800">{formatINR(cat.monthly, true)}/mo</span>
              </div>
              <div className="w-full bg-gray-100 rounded-full h-1.5">
                <div
                  className="h-1.5 rounded-full transition-all duration-700"
                  style={{ width: `${pct}%`, backgroundColor: meta.color }}
                />
              </div>
            </div>
          );
        })}
        {top5.length === 0 && (
          <p className="text-sm text-gray-400 text-center py-4">No spending data yet</p>
        )}
      </div>
    </div>
  );
}

// ── Main Dashboard ─────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { metrics, insights, isLoadingInsights, navigateTo, transactions, refreshInsights, dataSource, txCount } = useApp();
  const [showModal, setShowModal] = useState(null);

  const scoreLabel = getScoreLabel(metrics?.overall || 0);

  const savingsMsg = () => {
    const r = metrics?.savingsRate || 0;
    if (r >= 20) return `Great — ${formatPercent(r)} is at or above the 20% target.`;
    const gap = metrics?.monthlyIncome * 0.2 - metrics?.monthlySavings;
    return `${formatPercent(r)} rate — ${formatINR(gap)} more/month hits the 20% target.`;
  };

  const emergencyMsg = () => {
    const c = metrics?.emergencyCoverage || 0;
    if (c >= 3) return `${c.toFixed(1)} months covered — you're in the green.`;
    const needed = (3 - c) * (metrics?.monthlyExpenses || 0);
    return `${c.toFixed(1)} months covered — ${formatINR(needed)} more closes the gap.`;
  };

  const investMsg = () => {
    const r = metrics?.investmentRate || 0;
    if (r >= 10) return `${formatPercent(r)} invested — above the 10% target. `;
    if (r === 0) return `No investments detected. Starting a ₹2,000 SIP changes everything.`;
    return `${formatPercent(r)} — increase SIP by ${formatINR(metrics?.monthlyIncome * 0.10 - metrics?.monthlyInvestment)} to hit 10%.`;
  };

  const debtMsg = () => {
    const r = metrics?.debtRate || 0;
    if (r === 0) return 'No EMI/loan payments detected. Excellent flexibility.';
    if (r < 40) return `${formatPercent(r)} debt load — well within the safe 40% ceiling.`;
    return `${formatPercent(r)} of income goes to EMIs — consider prepayment.`;
  };

  return (
    <div className="pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6 space-y-6">

        {/* ── Data source banner ──────────────────────────────────────────── */}
        {dataSource === 'demo' ? (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm text-amber-700 stagger-1">
            <span className="text-base">⚠️</span>
            <span>
              <span className="font-semibold">Showing demo data.</span> Upload your bank statement or paste UPI SMSes in onboarding to see your real numbers.
            </span>
            <button
              onClick={() => navigateTo('onboarding')}
              className="ml-auto flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 transition-colors"
            >
              Upload now →
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-sm text-emerald-700 stagger-1">
            <span className="text-base">✅</span>
            <span>
              <span className="font-semibold">Your real data is loaded</span> — {txCount} transactions from your {dataSource === 'pdf' ? 'bank statement PDF' : 'UPI SMSes'}.
            </span>
          </div>
        )}

        {/* ── Zone 1: Health Score ─────────────────────────────────────────── */}
        <div className="bg-white rounded-2xl shadow-sm border-l-4 border-indigo-500 stagger-1">
          <div className="p-6 md:p-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              {/* Left: number + label */}
              <div className="flex-1">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                  Your Financial Health Score
                </p>
                <div className="count-up">
                  <span className="text-8xl font-black text-gray-900 leading-none">
                    {metrics?.overall ?? '—'}
                  </span>
                </div>
                <div className={`inline-flex items-center gap-1.5 mt-3 px-3 py-1.5 rounded-full text-sm font-semibold ${scoreLabel.bg} ${scoreLabel.color}`}>
                  {scoreLabel.label}
                </div>
                <p className="text-xs text-gray-400 mt-2">Updated this month</p>
              </div>

              {/* Right: ring */}
              <div className="flex justify-center">
                <HealthScoreRing score={metrics?.overall ?? 0} size={200} />
              </div>
            </div>
          </div>
        </div>

        {/* ── Sub-score tiles ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <SubScoreTile
            icon={PiggyBank}
            label="Savings Rate"
            score={metrics?.savingsScore ?? 0}
            value={formatPercent(metrics?.savingsRate ?? 0)}
            target="20%"
            message={savingsMsg()}
            colorScheme="default"
            staggerClass="stagger-1"
          />
          <SubScoreTile
            icon={Shield}
            label="Emergency Fund"
            score={metrics?.emergencyScore ?? 0}
            value={`${(metrics?.emergencyCoverage ?? 0).toFixed(1)} mo`}
            target="3 months"
            message={emergencyMsg()}
            colorScheme="default"
            staggerClass="stagger-2"
          />
          <SubScoreTile
            icon={TrendingUp}
            label="Investment Exposure"
            score={metrics?.investmentScore ?? 0}
            value={formatPercent(metrics?.investmentRate ?? 0)}
            target="10%"
            message={investMsg()}
            colorScheme="default"
            staggerClass="stagger-3"
          />
          <SubScoreTile
            icon={CreditCard}
            label="Debt Load"
            score={metrics?.debtScore ?? 0}
            value={formatPercent(metrics?.debtRate ?? 0)}
            target="< 40%"
            message={debtMsg()}
            colorScheme="debt"
            staggerClass="stagger-4"
          />
        </div>

        {/* ── Zone 2: This Month's Story ───────────────────────────────────── */}
        <div className="stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your money this month</h2>
            <button
              onClick={refreshInsights}
              disabled={isLoadingInsights}
              className="flex items-center gap-1.5 text-sm text-indigo-500 hover:text-indigo-700 transition-colors disabled:opacity-50"
            >
              {isLoadingInsights
                ? <Loader2 size={14} className="spinner" />
                : <RefreshCw size={14} />
              }
              Refresh insights
            </button>
          </div>

          <div className="flex gap-4 overflow-x-auto hide-scrollbar pb-2">
            {isLoadingInsights
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonInsightCard key={i} />)
              : insights.slice(0, 5).map((ins, i) => (
                  <InsightCard
                    key={ins.id}
                    insight={ins}
                    index={i}
                    onDismiss={() => {}}
                  />
                ))
            }
          </div>
        </div>

        {/* ── Zone 3: Quick Actions + Spending ────────────────────────────── */}
        <div className="grid md:grid-cols-2 gap-6 stagger-4">
          {/* Quick actions */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: 'Simulate a Goal',      action: () => navigateTo('goals'),     icon: '🎯' },
                { label: 'Review Last Month',    action: () => setShowModal('compare'), icon: '📅' },
                { label: 'Understand my Score',  action: () => navigateTo('insights'),  icon: '💡' },
                { label: 'Share my Score',       action: () => setShowModal('share'),   icon: '🔗' },
              ].map(({ label, action, icon }) => (
                <button
                  key={label}
                  onClick={action}
                  className="flex items-center gap-2 px-3 py-3 rounded-xl bg-gray-50 hover:bg-indigo-50 hover:text-indigo-700 text-sm font-medium text-gray-600 transition-all duration-200 text-left"
                >
                  <span>{icon}</span>
                  <span className="leading-tight">{label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Spending breakdown */}
          <SpendingCategories metrics={metrics} />
        </div>
      </div>

      {/* Month comparison modal */}
      {showModal === 'compare' && (
        <MonthComparisonModal transactions={transactions} onClose={() => setShowModal(null)} />
      )}

      {/* Share modal */}
      {showModal === 'share' && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="w-24 h-24 rounded-2xl bg-indigo-500 flex items-center justify-center mx-auto mb-4">
              <div className="text-center">
                <div className="text-3xl font-black text-white">{metrics?.overall}</div>
                <div className="text-xs text-indigo-200">/ 100</div>
              </div>
            </div>
            <h3 className="font-semibold text-gray-900 mb-1">Financial Health Score</h3>
            <p className={`text-sm font-medium mb-1 ${scoreLabel.color}`}>{scoreLabel.label}</p>
            <p className="text-xs text-gray-400 mb-4">Powered by ClearMoney</p>
            <button onClick={() => setShowModal(null)} className="w-full px-4 py-2.5 rounded-xl bg-indigo-500 text-white text-sm font-medium hover:bg-indigo-600 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
