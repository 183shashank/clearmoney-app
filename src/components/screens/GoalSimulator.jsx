import { useState, useMemo, useCallback } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { Plus, Target, Trash2 } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatINR } from '../../utils/formatters.js';

const INSTRUMENTS = [
  { label: 'Savings Account', rate: 3,   id: 'savings' },
  { label: 'Fixed Deposit',   rate: 7,   id: 'fd' },
  { label: 'Liquid Fund',     rate: 7.5, id: 'liquid' },
  { label: 'Equity MF',       rate: 12,  id: 'equity' },
];

function computeGoal(targetAmount, months, annualRate, currentSavings, presentValue) {
  const r = annualRate / 100 / 12;
  const n = months;
  const PV = presentValue || 0;

  let monthlySaving;
  if (r === 0) {
    monthlySaving = Math.max(0, (targetAmount - PV) / n);
  } else {
    const fvPV = PV * Math.pow(1 + r, n);
    if (fvPV >= targetAmount) {
      monthlySaving = 0;
    } else {
      monthlySaving = Math.max(0, (targetAmount - fvPV) * r / (Math.pow(1 + r, n) - 1));
    }
  }

  // Chart data: month-by-month balance
  const chartData = [];
  let balanceSave = PV;
  let balanceInvest = PV;

  for (let m = 0; m <= n; m++) {
    chartData.push({
      month: m,
      label: m === 0 ? 'Now' : `M${m}`,
      'Just Saving':   Math.round(balanceSave),
      'With Returns':  Math.round(balanceInvest),
    });
    balanceSave   += monthlySaving;
    balanceInvest  = (balanceInvest + monthlySaving) * (1 + r);
  }

  const finalInvested = balanceInvest;

  // Late start penalty (6 months)
  const nLate = Math.max(1, n - 6);
  let monthlySavingLate;
  if (r === 0) {
    monthlySavingLate = Math.max(0, (targetAmount - PV) / nLate);
  } else {
    const fvPVLate = PV * Math.pow(1 + r, nLate);
    monthlySavingLate = fvPVLate >= targetAmount
      ? 0
      : Math.max(0, (targetAmount - fvPVLate) * r / (Math.pow(1 + r, nLate) - 1));
  }

  return { monthlySaving, chartData, finalInvested, monthlySavingLate };
}

function GoalChart({ data, height = 220 }) {
  const CustomTooltip = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null;
    return (
      <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-md text-xs">
        <p className="text-gray-500 mb-1">{label}</p>
        {payload.map(p => (
          <p key={p.name} style={{ color: p.color }} className="font-medium">
            {p.name}: {formatINR(p.value)}
          </p>
        ))}
      </div>
    );
  };

  return (
    <ResponsiveContainer width="100%" height={height}>
      <AreaChart data={data} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
        <defs>
          <linearGradient id="colorSave" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#E5E7EB" stopOpacity={0.8} />
            <stop offset="95%" stopColor="#E5E7EB" stopOpacity={0} />
          </linearGradient>
          <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
            <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6" />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          tickLine={false}
          interval="preserveStartEnd"
        />
        <YAxis
          tick={{ fontSize: 11, fill: '#9CA3AF' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={v => formatINR(v, true)}
        />
        <Tooltip content={<CustomTooltip />} />
        <Legend
          wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
        />
        <Area
          type="monotone"
          dataKey="Just Saving"
          stroke="#9CA3AF"
          strokeWidth={2}
          fill="url(#colorSave)"
        />
        <Area
          type="monotone"
          dataKey="With Returns"
          stroke="#6366f1"
          strokeWidth={2}
          fill="url(#colorInvest)"
        />
      </AreaChart>
    </ResponsiveContainer>
  );
}

function SavedGoalCard({ goal, onDelete }) {
  const { monthlySaving } = computeGoal(
    goal.targetAmount, goal.months,
    INSTRUMENTS.find(i => i.id === goal.instrument)?.rate || 7,
    goal.currentSavings, goal.presentValue
  );
  const progress = goal.presentValue / goal.targetAmount * 100;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-500 flex-shrink-0">
        <Target size={18} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between">
          <span className="font-semibold text-gray-900 truncate">{goal.name}</span>
          <span className="text-sm font-medium text-indigo-600 ml-2 flex-shrink-0">
            {formatINR(goal.targetAmount)}
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-1 mt-2 mb-1">
          <div
            className="bg-indigo-500 h-1 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>{goal.months} months</span>
          <span>{formatINR(monthlySaving)}/mo needed</span>
        </div>
      </div>
      <button onClick={() => onDelete(goal.id)} className="p-2 text-gray-300 hover:text-red-400 transition-colors">
        <Trash2 size={15} />
      </button>
    </div>
  );
}

export default function GoalSimulator() {
  const { metrics, goals, setGoals } = useApp();

  const [goalName, setGoalName]           = useState('');
  const [targetAmount, setTargetAmount]   = useState(200000);
  const [months, setMonths]               = useState(12);
  const [instrument, setInstrument]       = useState('equity');
  const [presentValue, setPresentValue]   = useState(0);

  const selectedInstrument = INSTRUMENTS.find(i => i.id === instrument);
  const monthlySavingsAvail = metrics?.monthlySavings || 0;

  const result = useMemo(() =>
    computeGoal(targetAmount, months, selectedInstrument.rate, monthlySavingsAvail, presentValue),
    [targetAmount, months, selectedInstrument, monthlySavingsAvail, presentValue]
  );

  const targetDate = useMemo(() => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    return d.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
  }, [months]);

  const saveGoal = useCallback(() => {
    if (!goalName.trim() || !targetAmount) return;
    const newGoal = {
      id: `goal-${Date.now()}`,
      name: goalName,
      targetAmount,
      months,
      instrument,
      currentSavings: monthlySavingsAvail,
      presentValue,
    };
    setGoals(prev => [newGoal, ...prev]);
    setGoalName('');
  }, [goalName, targetAmount, months, instrument, monthlySavingsAvail, presentValue, setGoals]);

  const deleteGoal = useCallback((id) => {
    setGoals(prev => prev.filter(g => g.id !== id));
  }, [setGoals]);

  const latePenalty = result.monthlySavingLate - result.monthlySaving;

  return (
    <div className="pb-20 md:pb-8">
      <div className="max-w-6xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-6 stagger-1">
          <h1 className="text-2xl font-bold text-gray-900">What are you working towards?</h1>
          <p className="text-gray-500 text-sm mt-1">See exactly what it takes to get there.</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-6">
          {/* ── Left: Inputs ─────────────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 space-y-5 stagger-2">
            <h2 className="font-semibold text-gray-800">Goal Details</h2>

            {/* Goal name */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Goal name</label>
              <input
                type="text"
                value={goalName}
                onChange={e => setGoalName(e.target.value)}
                placeholder="e.g. Europe Trip, New Laptop, Emergency Fund"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
              />
            </div>

            {/* Target amount */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">Target amount</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-semibold text-lg">₹</span>
                <input
                  type="number"
                  value={targetAmount}
                  onChange={e => setTargetAmount(Number(e.target.value) || 0)}
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-xl font-bold focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>

            {/* Timeline slider */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-600">Timeline</label>
                <span className="text-sm font-semibold text-indigo-600">
                  {months < 12
                    ? `in ${months} months`
                    : `in ${(months / 12).toFixed(1)} years`
                  } — by {targetDate}
                </span>
              </div>
              <input
                type="range" min="3" max="60" step="1"
                value={months}
                onChange={e => setMonths(Number(e.target.value))}
                className="w-full accent-indigo-500"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>3 months</span>
                <span>5 years</span>
              </div>
            </div>

            {/* Instrument */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-2">Expected return</label>
              <div className="grid grid-cols-2 gap-2">
                {INSTRUMENTS.map(inst => (
                  <button
                    key={inst.id}
                    onClick={() => setInstrument(inst.id)}
                    className={`px-3 py-2.5 rounded-xl text-xs font-medium border text-left transition-all duration-200 ${
                      instrument === inst.id
                        ? 'border-indigo-400 bg-indigo-50 text-indigo-700'
                        : 'border-gray-200 text-gray-600 hover:border-indigo-200'
                    }`}
                  >
                    <div>{inst.label}</div>
                    <div className={`text-xs font-semibold mt-0.5 ${instrument === inst.id ? 'text-indigo-500' : 'text-gray-400'}`}>
                      {inst.rate}% p.a.
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Present value */}
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1.5">
                Current savings for this goal
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">₹</span>
                <input
                  type="number"
                  value={presentValue}
                  onChange={e => setPresentValue(Number(e.target.value) || 0)}
                  placeholder="0"
                  className="w-full pl-8 pr-4 py-2.5 rounded-xl border border-gray-200 text-gray-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
                />
              </div>
            </div>

            {/* Save button */}
            <button
              onClick={saveGoal}
              disabled={!goalName.trim()}
              className={`w-full flex items-center justify-center gap-2 px-6 py-3 rounded-xl font-semibold text-white transition-all duration-200 ${
                goalName.trim()
                  ? 'bg-indigo-500 hover:bg-indigo-600 hover:-translate-y-0.5 hover:shadow-md'
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              <Plus size={18} /> Save this Goal
            </button>
          </div>

          {/* ── Right: Results ────────────────────────────────────────────────── */}
          <div className="space-y-4 stagger-3">
            {/* Primary result */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
              <p className="text-sm text-gray-500 mb-1">You need to save</p>
              <div className="text-4xl font-black text-indigo-600 mb-1">
                {result.monthlySaving === 0
                  ? 'Already funded! 🎉'
                  : formatINR(Math.ceil(result.monthlySaving)) + ' / month'
                }
              </div>

              {/* Gap bar */}
              {monthlySavingsAvail > 0 && result.monthlySaving > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-xs text-gray-400 mb-1">
                    <span>Currently saving {formatINR(monthlySavingsAvail)}/mo</span>
                    <span>
                      {result.monthlySaving <= monthlySavingsAvail
                        ? '✓ Within budget'
                        : `${formatINR(result.monthlySaving - monthlySavingsAvail)} gap`
                      }
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-700 ${
                        result.monthlySaving <= monthlySavingsAvail ? 'bg-emerald-500' : 'bg-indigo-500'
                      }`}
                      style={{ width: `${Math.min(monthlySavingsAvail / Math.max(result.monthlySaving, 1) * 100, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Compounding summary */}
              <div className="mt-4 bg-emerald-50 rounded-xl p-3 text-sm text-emerald-700">
                With <span className="font-semibold">{selectedInstrument.label}</span> at{' '}
                <span className="font-semibold">{selectedInstrument.rate}%</span>, your money grows to{' '}
                <span className="font-semibold">{formatINR(result.finalInvested)}</span> by {targetDate}
              </div>

              {/* Late start warning */}
              {latePenalty > 0 && (
                <div className="mt-3 bg-amber-50 rounded-xl p-3 text-sm text-amber-700">
                  If you start 6 months later, you'll need{' '}
                  <span className="font-semibold">{formatINR(latePenalty)} more/month</span>. Don't wait.
                </div>
              )}
            </div>

            {/* Growth chart */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
              <h3 className="font-medium text-gray-700 text-sm mb-4">Growth projection</h3>
              <GoalChart data={result.chartData} height={200} />
            </div>
          </div>
        </div>

        {/* ── Saved Goals ──────────────────────────────────────────────────── */}
        {goals.length > 0 && (
          <div className="mt-8 stagger-4">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Saved Goals</h2>
            <div className="space-y-3">
              {goals.map(goal => (
                <SavedGoalCard key={goal.id} goal={goal} onDelete={deleteGoal} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
