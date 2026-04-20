import { useState } from 'react';
import { Loader2, RefreshCw, ChevronDown, ChevronUp } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { getCategoryMeta } from '../../utils/categorize.js';
import { SkeletonFullCard } from '../shared/SkeletonCard.jsx';

const FILTERS = ['All', 'Spending', 'Saving', 'Investing', 'Debt'];

const CATEGORY_FILTER_MAP = {
  Spending:  ['Food', 'Transport', 'Entertainment', 'Shopping', 'Spending'],
  Saving:    ['Savings', 'Income', 'Projection'],
  Investing: ['Investment', 'Investing'],
  Debt:      ['Debt'],
};

function FullInsightCard({ insight, index }) {
  const [expanded, setExpanded] = useState(false);
  const meta = getCategoryMeta(insight.category);

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
      style={{
        borderLeftWidth: 4,
        borderLeftColor: meta.color,
        animation: `staggerFade 0.4s ease-out ${index * 0.08}s both`,
      }}
    >
      <div className="p-6">
        {/* Header */}
        <div className="flex items-center gap-2 mb-3">
          <span className="text-lg">{meta.emoji}</span>
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: meta.color + '18', color: meta.color }}
          >
            {insight.category}
          </span>
        </div>

        {/* Headline */}
        <h3 className="text-lg font-semibold text-gray-900 mb-2 leading-snug">
          {insight.headline}
        </h3>

        {/* Supporting data */}
        <p className="text-gray-500 text-sm leading-relaxed mb-3">
          {insight.supporting_data}
        </p>

        {/* Action prompt */}
        <div
          className="inline-flex items-center gap-1.5 text-sm font-medium px-3 py-1.5 rounded-lg mb-4"
          style={{ backgroundColor: meta.color + '12', color: meta.color }}
        >
          <span>→</span> {insight.action_prompt}
        </div>

        {/* Why it matters accordion */}
        {insight.education_snippet && (
          <div className="border-t border-gray-100 pt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-full flex items-center justify-between text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              <span className="font-medium">Why does this matter?</span>
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
            {expanded && (
              <p className="mt-3 text-sm text-gray-600 leading-relaxed bg-gray-50 rounded-xl p-4">
                {insight.education_snippet}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function Insights() {
  const { insights, isLoadingInsights, refreshInsights } = useApp();
  const [activeFilter, setActiveFilter] = useState('All');

  const filtered = insights.filter(ins => {
    if (activeFilter === 'All') return true;
    const allowed = CATEGORY_FILTER_MAP[activeFilter] || [];
    return allowed.some(a => ins.category.toLowerCase().includes(a.toLowerCase()));
  });

  return (
    <div className="pb-20 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6 stagger-1">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Your Insights</h1>
            <p className="text-gray-500 text-sm mt-1">Personalised to your transactions and goals</p>
          </div>
          <button
            onClick={refreshInsights}
            disabled={isLoadingInsights}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-600 hover:border-indigo-300 hover:text-indigo-600 transition-all duration-200 shadow-sm disabled:opacity-50"
          >
            {isLoadingInsights
              ? <Loader2 size={14} className="spinner" />
              : <RefreshCw size={14} />
            }
            Refresh
          </button>
        </div>

        {/* Filters */}
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-6 stagger-2">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
                activeFilter === f
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'bg-white text-gray-500 border border-gray-200 hover:border-indigo-300 hover:text-indigo-600'
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Insight cards */}
        <div className="space-y-4">
          {isLoadingInsights ? (
            Array.from({ length: 5 }).map((_, i) => <SkeletonFullCard key={i} />)
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
              <div className="text-4xl mb-3">🔍</div>
              <h3 className="font-medium text-gray-700 mb-1">No insights in this category</h3>
              <p className="text-sm text-gray-400">Try a different filter or refresh insights</p>
            </div>
          ) : (
            filtered.map((ins, i) => (
              <FullInsightCard key={ins.id} insight={ins} index={i} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
