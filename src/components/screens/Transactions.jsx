import { useState, useMemo, useRef, useEffect } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line,
} from 'recharts';
import { Search, ChevronDown, ChevronUp, Pencil, X } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { getCategoryMeta, CATEGORY_RULES, DEBIT_CATEGORIES } from '../../utils/categorize.js';
import { getEffectiveCategory } from '../../utils/categoryOverrides.js';
import { formatINR } from '../../utils/formatters.js';
import PeriodFilter from '../shared/PeriodFilter.jsx';

// All categories a user can pick from (debit + Income)
const ALL_CATS = [...DEBIT_CATEGORIES, 'Income'];

// ── Helpers ───────────────────────────────────────────────────────────────────
function groupByDate(transactions) {
  const groups = {};
  transactions.forEach(t => {
    const key = new Date(t.date).toDateString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(t);
  });
  return Object.entries(groups).sort((a, b) => new Date(b[0]) - new Date(a[0]));
}

function buildCategoryTotals(transactions) {
  const totals = {};
  transactions.filter(t => t.type === 'debit').forEach(t => {
    totals[t.category] = (totals[t.category] || 0) + t.amount;
  });
  return Object.entries(totals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);
}

function buildMonthlyBreakdown(transactions) {
  const monthMap = {};
  transactions.filter(t => t.type === 'debit').forEach(t => {
    const d = new Date(t.date);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const label = d.toLocaleDateString('en-IN', { month: 'short', year: '2-digit' });
    if (!monthMap[key]) monthMap[key] = { key, label };
    monthMap[key][t.category] = (monthMap[key][t.category] || 0) + t.amount;
  });
  return Object.values(monthMap).sort((a, b) => a.key.localeCompare(b.key));
}

const TOP_N = 6;

// ── Category picker modal ────────────────────────────────────────────────────
function CategoryPicker({ current, onSelect, onClose }) {
  const ref = useRef(null);

  useEffect(() => {
    function handler(e) {
      if (ref.current && !ref.current.contains(e.target)) onClose();
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-end md:items-center justify-center p-0 md:p-4 bg-black/30 backdrop-blur-sm">
      <div
        ref={ref}
        className="bg-white w-full md:max-w-sm rounded-t-2xl md:rounded-2xl shadow-xl p-5"
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-900 text-base">Change category</h3>
          <button onClick={onClose} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <X size={16} />
          </button>
        </div>
        <div className="grid grid-cols-3 gap-2 max-h-72 overflow-y-auto">
          {ALL_CATS.filter(c => c !== 'Income').map(cat => {
            const meta = getCategoryMeta(cat);
            const isSelected = cat === current;
            return (
              <button
                key={cat}
                onClick={() => { onSelect(cat); onClose(); }}
                className={`flex flex-col items-center gap-1.5 px-2 py-3 rounded-xl border text-center transition-all ${
                  isSelected
                    ? 'border-indigo-400 bg-indigo-50'
                    : 'border-gray-100 bg-gray-50 hover:border-gray-300 hover:bg-white'
                }`}
              >
                <span className="text-xl leading-none">{meta.emoji}</span>
                <span className="text-[10px] font-medium text-gray-700 leading-tight">{cat}</span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-3 text-center">
          Applies to all similar transactions
        </p>
      </div>
    </div>
  );
}

// ── Donut chart ───────────────────────────────────────────────────────────────
function CategoryDonut({ data }) {
  const [active, setActive] = useState(null);
  const total = data.reduce((s, d) => s + d.value, 0);

  const CustomTooltip = ({ active, payload }) => {
    if (!active || !payload?.length) return null;
    const { name, value } = payload[0].payload;
    const meta = getCategoryMeta(name);
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-md text-xs">
        <div className="flex items-center gap-1.5 mb-1">
          <span>{meta.emoji}</span>
          <span className="font-medium text-gray-800">{name}</span>
        </div>
        <div className="font-bold text-gray-900">{formatINR(value)}</div>
        <div className="text-gray-400">{total > 0 ? ((value / total) * 100).toFixed(1) : 0}% of spend</div>
      </div>
    );
  };

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center h-48 text-gray-400 text-sm">
        No spending data for this period
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4">
      <div className="flex-shrink-0" style={{ width: 180, height: 180 }}>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data.slice(0, 8)}
              cx="50%"
              cy="50%"
              innerRadius={52}
              outerRadius={78}
              paddingAngle={2}
              dataKey="value"
              onMouseEnter={(_, i) => setActive(i)}
              onMouseLeave={() => setActive(null)}
            >
              {data.slice(0, 8).map((entry, i) => {
                const meta = getCategoryMeta(entry.name);
                return (
                  <Cell
                    key={entry.name}
                    fill={meta.color}
                    opacity={active === null || active === i ? 1 : 0.4}
                    stroke="white"
                    strokeWidth={2}
                  />
                );
              })}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>

      <div className="flex-1 space-y-1.5 min-w-0">
        {data.slice(0, 7).map(item => {
          const meta = getCategoryMeta(item.name);
          const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
          return (
            <div key={item.name} className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: meta.color }} />
              <span className="text-xs text-gray-600 truncate flex-1">{item.name}</span>
              <span className="text-xs font-medium text-gray-800 flex-shrink-0">{formatINR(item.value, true)}</span>
              <span className="text-xs text-gray-400 w-7 text-right flex-shrink-0">{pct}%</span>
            </div>
          );
        })}
        {data.length > 7 && (
          <div className="text-xs text-gray-400">+{data.length - 7} more</div>
        )}
      </div>
    </div>
  );
}

// ── Monthly trend chart ───────────────────────────────────────────────────────
function MonthlyTrendChart({ transactions }) {
  const [chartType, setChartType] = useState('bar');

  const categoryTotals = buildCategoryTotals(transactions);
  const topCats = categoryTotals.slice(0, TOP_N).map(c => c.name);

  const monthlyData = useMemo(() => {
    const raw = buildMonthlyBreakdown(transactions);
    return raw.map(row => {
      const condensed = { ...row };
      let othersTotal = 0;
      Object.keys(row).forEach(k => {
        if (!['key', 'label'].includes(k) && !topCats.includes(k)) {
          othersTotal += row[k];
          delete condensed[k];
        }
      });
      if (othersTotal > 0) condensed['Others'] = othersTotal;
      return condensed;
    });
  }, [transactions, topCats.join(',')]);

  const allCats = [...topCats, ...(monthlyData.some(r => r['Others']) ? ['Others'] : [])];

  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    const sorted = [...payload].sort((a, b) => b.value - a.value);
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-md text-xs min-w-32">
        <p className="font-semibold text-gray-700 mb-2">{label}</p>
        {sorted.filter(p => p.value > 0).map(p => {
          const meta = getCategoryMeta(p.dataKey);
          return (
            <div key={p.dataKey} className="flex items-center justify-between gap-3 mb-1">
              <span className="flex items-center gap-1">
                <span>{meta.emoji}</span>
                <span className="text-gray-600">{p.dataKey}</span>
              </span>
              <span className="font-medium">{formatINR(p.value, true)}</span>
            </div>
          );
        })}
      </div>
    );
  };

  if (monthlyData.length === 0) {
    return <div className="flex items-center justify-center h-48 text-gray-400 text-sm">No data</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-gray-700">Monthly trend</span>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          {['bar', 'line'].map(t => (
            <button
              key={t}
              onClick={() => setChartType(t)}
              className={`px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                chartType === t ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'
              }`}
            >
              {t === 'bar' ? 'Bar' : 'Line'}
            </button>
          ))}
        </div>
      </div>

      <ResponsiveContainer width="100%" height={220}>
        {chartType === 'bar' ? (
          <BarChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" vertical={false} />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false}
              tickFormatter={v => formatINR(v, true)} />
            <Tooltip content={<CustomTooltip />} />
            {allCats.map(cat => {
              const meta = getCategoryMeta(cat);
              return <Bar key={cat} dataKey={cat} stackId="a" fill={meta.color}
                radius={cat === allCats[allCats.length - 1] ? [3, 3, 0, 0] : [0, 0, 0, 0]} />;
            })}
          </BarChart>
        ) : (
          <LineChart data={monthlyData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
            <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} />
            <YAxis tick={{ fontSize: 11, fill: '#9CA3AF' }} tickLine={false} axisLine={false}
              tickFormatter={v => formatINR(v, true)} />
            <Tooltip content={<CustomTooltip />} />
            {allCats.map(cat => {
              const meta = getCategoryMeta(cat);
              return <Line key={cat} type="monotone" dataKey={cat} stroke={meta.color}
                strokeWidth={2} dot={{ r: 3, fill: meta.color }} />;
            })}
          </LineChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}

// ── Category cards ─────────────────────────────────────────────────────────────
function CategoryCards({ data, activeCategory, onSelect }) {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex gap-3 overflow-x-auto hide-scrollbar pb-1">
      <button
        onClick={() => onSelect(null)}
        className={`flex-shrink-0 px-4 py-3 rounded-2xl border text-left transition-all duration-200 ${
          activeCategory === null
            ? 'bg-indigo-500 border-indigo-500 text-white'
            : 'bg-white border-gray-200 hover:border-indigo-300'
        }`}
      >
        <div className={`text-xs mb-1 ${activeCategory === null ? 'text-indigo-200' : 'text-gray-400'}`}>All spending</div>
        <div className={`text-base font-bold ${activeCategory === null ? 'text-white' : 'text-gray-900'}`}>
          {formatINR(total)}
        </div>
      </button>

      {data.map(item => {
        const meta = getCategoryMeta(item.name);
        const pct = total > 0 ? ((item.value / total) * 100).toFixed(0) : 0;
        const isActive = activeCategory === item.name;
        return (
          <button
            key={item.name}
            onClick={() => onSelect(isActive ? null : item.name)}
            className={`flex-shrink-0 px-4 py-3 rounded-2xl border text-left transition-all duration-200 ${
              isActive ? 'shadow-md -translate-y-0.5' : 'bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm'
            }`}
            style={isActive ? { borderColor: meta.color, backgroundColor: meta.color + '10' } : {}}
          >
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-base">{meta.emoji}</span>
              <span className="text-xs text-gray-500 font-medium">{pct}%</span>
            </div>
            <div className="text-xs text-gray-500 mb-0.5 whitespace-nowrap">{item.name}</div>
            <div className="text-sm font-bold" style={isActive ? { color: meta.color } : { color: '#111827' }}>
              {formatINR(item.value)}
            </div>
          </button>
        );
      })}
    </div>
  );
}

// ── Single transaction row ────────────────────────────────────────────────────
function TxRow({ tx, overrides, onOverride }) {
  const [showPicker, setShowPicker] = useState(false);
  const effectiveCat = getEffectiveCategory(tx.description, tx.category, overrides);
  const isOverridden = effectiveCat !== tx.category;
  const meta = getCategoryMeta(effectiveCat);

  return (
    <>
      <div className="flex items-center gap-3 py-2.5 border-b border-gray-50 last:border-0">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 text-base"
          style={{ backgroundColor: meta.color + '15' }}
        >
          {meta.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-900 truncate">{tx.description}</p>
          <button
            onClick={() => setShowPicker(true)}
            className="inline-flex items-center gap-1 mt-0.5 text-xs px-1.5 py-0.5 rounded-md font-medium transition-all hover:opacity-80 active:scale-95"
            style={{ backgroundColor: meta.color + '18', color: meta.color }}
            title="Tap to re-categorise"
          >
            {effectiveCat}
            <Pencil size={9} className="opacity-60" />
            {isOverridden && <span className="text-[9px] opacity-60">✓</span>}
          </button>
        </div>

        <div className="text-right flex-shrink-0">
          <div className={`text-sm font-semibold ${tx.type === 'credit' ? 'text-emerald-600' : 'text-gray-900'}`}>
            {tx.type === 'credit' ? '+' : '−'}{formatINR(tx.amount)}
          </div>
          <div className="text-[10px] text-gray-400">
            {new Date(tx.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </div>
        </div>
      </div>

      {showPicker && (
        <CategoryPicker
          current={effectiveCat}
          onSelect={cat => onOverride(tx.description, cat)}
          onClose={() => setShowPicker(false)}
        />
      )}
    </>
  );
}

// ── Transaction list ──────────────────────────────────────────────────────────
function TransactionList({ transactions, activeCategory, overrides, onOverride }) {
  const [search, setSearch] = useState('');
  const [showCount, setShowCount] = useState(50);

  const filtered = useMemo(() => {
    let txns = [...transactions].sort((a, b) => new Date(b.date) - new Date(a.date));
    if (activeCategory) txns = txns.filter(t =>
      getEffectiveCategory(t.description, t.category, overrides) === activeCategory
    );
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      txns = txns.filter(t =>
        t.description.toLowerCase().includes(q) ||
        getEffectiveCategory(t.description, t.category, overrides).toLowerCase().includes(q)
      );
    }
    return txns;
  }, [transactions, activeCategory, search, overrides]);

  const grouped = useMemo(() => groupByDate(filtered.slice(0, showCount)), [filtered, showCount]);

  // reset pagination when filter changes
  const prevLen = useMemo(() => filtered.length, [filtered]);

  return (
    <div>
      <div className="relative mb-4">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={search}
          onChange={e => { setSearch(e.target.value); setShowCount(50); }}
          placeholder="Search transactions..."
          className="w-full pl-9 pr-4 py-2.5 text-sm rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-indigo-300 bg-white"
        />
      </div>

      <div className="flex items-center justify-between mb-3">
        <span className="text-xs text-gray-400">
          {filtered.length} transaction{filtered.length !== 1 ? 's' : ''}
          {activeCategory ? ` in ${activeCategory}` : ''}
        </span>
        {filtered.length > showCount && (
          <button onClick={() => setShowCount(c => c + 50)}
            className="text-xs text-indigo-500 hover:text-indigo-700 font-medium">
            Show more
          </button>
        )}
      </div>

      {grouped.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          <div className="text-3xl mb-2">🔍</div>
          <p className="text-sm">No transactions found</p>
        </div>
      ) : (
        <div className="space-y-4">
          {grouped.map(([dateStr, txns]) => (
            <div key={dateStr}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-gray-400 uppercase tracking-wide">
                  {new Date(dateStr).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                </span>
                <span className="text-xs text-gray-400">
                  {formatINR(txns.filter(t => t.type === 'debit').reduce((s, t) => s + t.amount, 0))} spent
                </span>
              </div>
              <div className="bg-white rounded-2xl border border-gray-100 px-4">
                {txns.map(tx => (
                  <TxRow
                    key={tx.id}
                    tx={tx}
                    overrides={overrides}
                    onOverride={onOverride}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main Transactions screen ──────────────────────────────────────────────────
export default function Transactions() {
  const { filteredTransactions, categoryOverrides, setCategoryOverride } = useApp();
  const [activeCategory, setActiveCategory] = useState(null);
  const [showCharts, setShowCharts] = useState(true);

  // Apply overrides to all transactions so charts reflect manual tags too
  const effectiveTxns = useMemo(() =>
    filteredTransactions.map(t => ({
      ...t,
      category: getEffectiveCategory(t.description, t.category, categoryOverrides),
    })),
    [filteredTransactions, categoryOverrides]
  );

  const debitTxns  = effectiveTxns.filter(t => t.type === 'debit');
  const creditTxns = effectiveTxns.filter(t => t.type === 'credit');
  const totalSpend  = debitTxns.reduce((s, t) => s + t.amount, 0);
  const totalIncome = creditTxns.reduce((s, t) => s + t.amount, 0);
  const categoryData = buildCategoryTotals(effectiveTxns);

  // Count "Others" so user knows how many need tagging
  const othersCount = debitTxns.filter(t => t.category === 'Others').length;

  return (
    <div className="pb-24 md:pb-8">
      <div className="max-w-4xl mx-auto px-4 md:px-6 py-6 space-y-5">

        {/* Header */}
        <div className="flex items-start justify-between stagger-1">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Transactions</h1>
            <p className="text-gray-500 text-sm mt-1">Every rupee, broken down.</p>
          </div>
          <button
            onClick={() => setShowCharts(v => !v)}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 bg-white border border-gray-200 px-3 py-1.5 rounded-xl transition-colors"
          >
            {showCharts ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {showCharts ? 'Hide charts' : 'Show charts'}
          </button>
        </div>

        {/* Period filter */}
        <div className="stagger-2">
          <PeriodFilter />
        </div>

        {/* "Others" nudge banner */}
        {othersCount > 0 && (
          <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm stagger-2">
            <span className="text-base">🏷️</span>
            <div className="flex-1">
              <span className="font-semibold text-amber-800">{othersCount} transaction{othersCount !== 1 ? 's' : ''} uncategorised.</span>
              <span className="text-amber-700"> Tap any category tag to fix it — changes apply to all matching transactions.</span>
            </div>
            <button
              onClick={() => setActiveCategory('Others')}
              className="flex-shrink-0 text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-100 hover:bg-amber-200 text-amber-800 transition-colors"
            >
              Review →
            </button>
          </div>
        )}

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 stagger-2">
          {[
            { label: 'Total Spent',  value: formatINR(totalSpend),         color: 'text-gray-900' },
            { label: 'Total Income', value: formatINR(totalIncome),        color: 'text-emerald-600' },
            { label: 'Transactions', value: filteredTransactions.length,   color: 'text-indigo-600' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 p-4 text-center">
              <div className={`text-lg font-bold ${color}`}>{value}</div>
              <div className="text-xs text-gray-400 mt-0.5">{label}</div>
            </div>
          ))}
        </div>

        {/* Charts */}
        {showCharts && (
          <div className="grid md:grid-cols-2 gap-4 stagger-3">
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <p className="text-sm font-semibold text-gray-800 mb-4">Spending breakdown</p>
              <CategoryDonut data={categoryData} />
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 p-5">
              <MonthlyTrendChart transactions={effectiveTxns} />
            </div>
          </div>
        )}

        {/* Category cards */}
        <div className="stagger-3">
          <p className="text-sm font-semibold text-gray-700 mb-3">
            {activeCategory ? `Filtered: ${activeCategory}` : 'Filter by category'}
          </p>
          <CategoryCards
            data={categoryData}
            activeCategory={activeCategory}
            onSelect={setActiveCategory}
          />
        </div>

        {/* Transaction list */}
        <div className="stagger-4">
          <TransactionList
            transactions={filteredTransactions}
            activeCategory={activeCategory}
            overrides={categoryOverrides}
            onOverride={setCategoryOverride}
          />
        </div>

      </div>
    </div>
  );
}
