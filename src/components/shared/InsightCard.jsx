import { useState } from 'react';
import { ChevronDown, ChevronUp, X, TrendingUp } from 'lucide-react';
import { getCategoryMeta } from '../../utils/categorize.js';

export default function InsightCard({ insight, index = 0, fullWidth = false, onDismiss }) {
  const [expanded, setExpanded] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  const meta = getCategoryMeta(insight.category);
  const delay = `${index * 0.1}s`;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.(insight.id);
  };

  return (
    <div
      className={`
        bg-white rounded-2xl shadow-sm border border-gray-100
        hover:shadow-md transition-all duration-200
        flex flex-col overflow-hidden
        ${fullWidth ? 'w-full' : 'w-80 flex-shrink-0'}
      `}
      style={{
        borderLeftWidth: 4,
        borderLeftColor: meta.color,
        animation: `staggerFade 0.5s ease-out ${delay} both`,
      }}
    >
      <div className="p-5 flex-1">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span className="text-xl">{meta.emoji}</span>
            <span
              className="text-xs font-medium px-2 py-0.5 rounded-full"
              style={{ backgroundColor: meta.color + '18', color: meta.color }}
            >
              {insight.category}
            </span>
          </div>
          {onDismiss && (
            <button
              onClick={handleDismiss}
              className="text-gray-300 hover:text-gray-500 transition-colors p-0.5 rounded"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Headline */}
        <h3 className="font-semibold text-gray-900 text-sm leading-snug mb-2">
          {insight.headline}
        </h3>

        {/* Supporting data */}
        <p className="text-gray-500 text-xs leading-relaxed mb-3">
          {insight.supporting_data}
        </p>

        {/* Action prompt */}
        <div
          className="text-xs font-medium px-3 py-1.5 rounded-lg inline-block"
          style={{ backgroundColor: meta.color + '12', color: meta.color }}
        >
          → {insight.action_prompt}
        </div>

        {/* Expandable education */}
        {insight.education_snippet && (
          <div className="mt-3">
            <button
              onClick={() => setExpanded(!expanded)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
            >
              {expanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
              Why does this matter?
            </button>
            {expanded && (
              <p className="mt-2 text-xs text-gray-500 leading-relaxed border-t border-gray-100 pt-2">
                {insight.education_snippet}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Footer actions */}
      {onDismiss && (
        <div className="px-5 pb-4 flex items-center gap-2">
          <button
            className="text-xs font-medium px-3 py-1.5 rounded-lg border transition-all duration-200 hover:-translate-y-0.5 hover:shadow-sm"
            style={{ borderColor: meta.color, color: meta.color }}
          >
            Take Action
          </button>
          <button
            onClick={handleDismiss}
            className="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
