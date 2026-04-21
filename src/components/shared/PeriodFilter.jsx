import { useMemo } from 'react';
import { useApp } from '../../context/AppContext.jsx';

const PRESETS = [
  { label: 'All Time',    value: 'all' },
  { label: 'This Month',  value: 'this_month' },
  { label: 'Last Month',  value: 'last_month' },
  { label: '3 Months',    value: '3m' },
  { label: '6 Months',    value: '6m' },
];

export default function PeriodFilter({ compact = false }) {
  const { transactions, selectedPeriod, setSelectedPeriod } = useApp();

  // Build list of unique months present in the data
  const availableMonths = useMemo(() => {
    const seen = new Set();
    transactions.forEach(t => {
      const d = new Date(t.date);
      seen.add(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`);
    });
    return Array.from(seen).sort().reverse();
  }, [transactions]);

  const all = [
    ...PRESETS,
    ...availableMonths.map(m => ({
      label: new Date(m + '-02').toLocaleDateString('en-IN', { month: 'short', year: 'numeric' }),
      value: m,
    })),
  ];

  if (compact) {
    return (
      <select
        value={selectedPeriod}
        onChange={e => setSelectedPeriod(e.target.value)}
        className="text-sm font-medium px-3 py-1.5 rounded-xl border border-gray-200 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-300 cursor-pointer"
      >
        {all.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    );
  }

  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
      {all.map(({ label, value }) => (
        <button
          key={value}
          onClick={() => setSelectedPeriod(value)}
          className={`
            px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0
            transition-all duration-200
            ${selectedPeriod === value
              ? 'bg-indigo-500 text-white shadow-sm'
              : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
            }
          `}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
