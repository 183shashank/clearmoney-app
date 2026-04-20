import { useState } from 'react';
import { ChevronDown, ChevronUp, BookOpen, Clock } from 'lucide-react';
import { useApp } from '../../context/AppContext.jsx';
import { formatINR } from '../../utils/formatters.js';

function buildArticles(metrics, profile) {
  const monthlyExp = metrics?.monthlyExpenses || 51000;
  const savingsRate = metrics?.savingsRate || 20;
  const coverage = metrics?.emergencyCoverage || 1.4;
  const investRate = metrics?.investmentRate || 7.7;
  const debtRate = metrics?.debtRate || 12;
  const income = metrics?.monthlyIncome || 65000;
  const needed = (3 - coverage) * monthlyExp;

  return [
    // Emergency Fund (priority if coverage < 3)
    {
      id: 'ef',
      priority: coverage < 3 ? 1 : 5,
      tag: 'Emergency Fund',
      tagColor: '#EF4444',
      title: 'Why you need 3 months of expenses before you do anything else',
      readTime: '3 min read',
      teaser: `You currently have ${coverage.toFixed(1)} months of expenses covered — that's ${formatINR(needed)} short of the recommended 3-month buffer. Here's why fixing this is the single best financial move you can make right now.`,
      article: `An emergency fund isn't pessimism — it's the foundation that makes every other financial goal reachable.

Without it, a single unexpected event (a medical bill, a job gap, a car breakdown) forces you into one of three bad choices: break a fixed deposit early and lose interest, swipe a credit card at 36% APR, or borrow from family and strain relationships.

You need ${formatINR(monthlyExp * 3)} parked somewhere liquid. "Liquid" means you can access it within 24 hours without penalty.

The wrong place to keep it: a savings account earning 2.5–3.5%. The right place: a liquid mutual fund. Liquid funds invest in short-term government and corporate bonds and typically return 6–7% annually — 2x a savings account — with same-day redemption via most apps (Groww, Kuvera, Paytm Money).

Here's your action plan: open a liquid fund account today. Set up an automatic transfer of ${formatINR(Math.ceil(needed / 12))}/month. In 12 months, your emergency fund is complete and earning better returns than a savings account.

Once your emergency fund is full, that same SIP can be redirected to equity MFs for wealth creation. The emergency fund is temporary — the peace of mind it buys is permanent.`,
    },

    // SIP & Compounding (if investment < 10%)
    {
      id: 'sip',
      priority: investRate < 10 ? 2 : 6,
      tag: 'SIP & Compounding',
      tagColor: '#10B981',
      title: 'The ₹3,000 SIP that becomes ₹35 lakhs — without you lifting a finger',
      readTime: '4 min read',
      teaser: `You're currently investing ${formatINR(metrics?.monthlyInvestment || 0)}/month (${investRate.toFixed(1)}% of income). The math of compounding means even small increases now create dramatically different outcomes in 10 years.`,
      article: `Compounding is the one financial concept that rewards patience above everything else. Here's the actual math using your income:

If you invest ${formatINR(income * 0.10)} per month (10% of your income) in an equity mutual fund from today, at an assumed 12% annual return:
• After 5 years: ~${formatINR(income * 0.10 * 81)} (roughly)
• After 10 years: ~${formatINR(income * 0.10 * 232)}
• After 20 years: ~${formatINR(income * 0.10 * 960)}

The key insight: the last 5 years of a 20-year SIP produce more wealth than the first 15 years combined. That's the compounding curve in action.

Starting small is fine. A SIP step-up of just 10% per year (increasing your monthly investment by 10% every year) transforms the outcome massively. If you start at ${formatINR(income * 0.07)} and step up 10% annually, you hit the equivalent of a ${formatINR(income * 0.20)} SIP by year 12 — while barely feeling the monthly increase.

Which fund to pick? For most people, a simple Nifty 50 index fund does better than 70% of actively managed funds over a 10-year period, at a fraction of the cost (expense ratio: 0.1% vs 1.5–2%).

The best day to start: today. The second-best day: tomorrow. There is no third-best day.`,
    },

    // Budgeting with UPI (always show)
    {
      id: 'upi',
      priority: 3,
      tag: 'Budgeting',
      tagColor: '#6366F1',
      title: 'How to use your UPI history as a free personal CFO',
      readTime: '3 min read',
      teaser: `Your UPI transaction history is a complete financial record — most people never use it. Here's how to turn it into a budget in under 20 minutes.`,
      article: `UPI has made spending frictionless. That's convenient and dangerous. Every tap is a micro-decision that doesn't feel like money leaving — until you add it up.

The good news: your UPI history is the most detailed spending record ever created. Every app (BHIM, PhonePe, Google Pay, Paytm) lets you download a statement. Do it for the last 3 months.

Category analysis: group your UPI spends into 8 buckets: rent, groceries, food delivery, transport, entertainment, shopping, utilities, and investments. You'll find at least one category where you're spending 2x what you thought.

The 50/30/20 rule adapted for India:
• 50% on needs: rent, groceries, utilities, EMIs
• 30% on wants: food delivery, entertainment, shopping
• 20% on financial goals: savings, investments, emergency fund

Based on your data, your "wants" bucket (food delivery, entertainment, shopping) is approximately ${formatINR((metrics?.categoryMonthly || []).filter(c => ['Food Delivery', 'Entertainment', 'Shopping'].includes(c.name)).reduce((s,c) => s + c.monthly, 0))}/month. Is that number surprising?

The fix isn't deprivation — it's awareness. Set category-level spending alerts in your bank app. Review your UPI history weekly for 4 weeks. Most people reduce discretionary spending by 15–20% just by paying attention.`,
    },

    // Understanding EMIs (if debt > 0)
    {
      id: 'emi',
      priority: debtRate > 0 ? 3 : 7,
      tag: 'Debt Management',
      tagColor: '#F59E0B',
      title: 'The true cost of your EMIs — and when prepayment actually makes sense',
      readTime: '4 min read',
      teaser: `Your EMI load is ${formatINR(metrics?.monthlyEMI || 0)}/month — ${debtRate.toFixed(1)}% of income. Understanding the math of loan costs is the first step to making smarter debt decisions.`,
      article: `EMIs feel manageable because they're small and regular. But the total interest paid over a loan term can be surprisingly large.

A ₹5 lakh personal loan at 14% interest over 3 years: total interest paid = ~₹1.1 lakhs (22% on top of the principal). For a home loan of ₹50 lakhs at 8.5% over 20 years: total interest = ~₹61 lakhs — more than the loan itself.

The debt-to-income ratio (DTI) is the most important number in your debt picture. Your current DTI is ${debtRate.toFixed(1)}%. Guidelines:
• Under 35%: Healthy. You have flexibility.
• 35–50%: Caution zone. New debt is risky.
• Above 50%: Danger zone. Prioritise payoff.

Prepayment math: if you prepay ${formatINR(income * 0.05)} per year on a home loan, you can reduce a 20-year tenure to ~14 years and save lakhs in interest. Most home loans allow up to 25% prepayment per year without penalty.

For high-interest debt (credit cards at 36–42%, personal loans at 14–18%), aggressive prepayment beats any investment return. A 36% debt-free return is guaranteed; a 12% equity return is probabilistic.

The priority sequence: (1) Pay minimum on all EMIs. (2) Build emergency fund. (3) Prepay highest-interest debt. (4) Invest the freed-up cash flow.`,
    },

    // Liquid Funds vs Savings Account (always)
    {
      id: 'liquid',
      priority: 4,
      tag: 'Liquid Funds',
      tagColor: '#8B5CF6',
      title: 'Why your emergency fund should live in a liquid fund, not a savings account',
      readTime: '3 min read',
      teaser: `Most savings accounts pay 2.5–3.5% interest. Liquid funds typically return 6–7%. For an emergency fund of ${formatINR(monthlyExp * 3)}, that's a difference of ${formatINR(monthlyExp * 3 * 0.035)}/year — completely free money.`,
      article: `The savings account is the default place people park their emergency fund. It's safe, familiar, and instantly accessible. But "instantly accessible" is also true for liquid mutual funds — with same-day or next-day redemption via Groww, Kuvera, or most banking apps.

What's a liquid fund? It's a type of debt mutual fund that invests in short-term instruments (treasury bills, commercial paper, certificates of deposit) with maturities under 91 days. They are among the safest category of mutual funds.

Returns comparison (approximate):
• Savings account: 2.5–3.5% per year
• Liquid fund: 6–7% per year
• FD (1 year): 6.5–7.5%

For your estimated emergency fund target of ${formatINR(monthlyExp * 3)}:
• In a savings account: earns ~${formatINR(monthlyExp * 3 * 0.03)}/year
• In a liquid fund: earns ~${formatINR(monthlyExp * 3 * 0.065)}/year
• Difference: ${formatINR(monthlyExp * 3 * 0.035)}/year for doing nothing different

The only catch: liquid fund returns are not fixed. They can drop slightly in rare market conditions, but have never lost principal over any 3-month period in modern history.

How to start: Download Groww or Kuvera. Search "liquid fund". Choose one with AUM > ₹10,000 Cr (Axis Liquid, HDFC Liquid, ICICI Pru Liquid are all solid options). Invest your emergency corpus. Sleep well.`,
    },

    // Tax Saving Basics (always)
    {
      id: 'tax',
      priority: 5,
      tag: 'Tax Planning',
      tagColor: '#6B7280',
      title: 'The ₹1.5 lakh tax deduction everyone leaves on the table',
      readTime: '4 min read',
      teaser: `Section 80C allows you to deduct up to ₹1.5 lakhs from your taxable income every year. For someone earning ${formatINR(income)}/month, this can save ₹15,000–₹46,800 in taxes — depending on your slab.`,
      article: `Tax planning isn't complicated. For most salaried professionals in India, one section covers most of the opportunity: Section 80C.

Under 80C, you can claim deductions up to ₹1,50,000 per financial year (April to March). This amount is subtracted from your gross income before tax is calculated.

Tax saved by income slab (assuming full ₹1.5L utilised):
• ₹5–10L (20% slab): ₹30,000 saved
• ₹10L+ (30% slab): ₹46,800 saved (including cess)

What qualifies under 80C:
• ELSS mutual funds (3-year lock-in, equity returns, highest recommended)
• PPF contributions (15-year lock-in, 7.1% guaranteed, tax-free returns)
• EPF contributions (automatic if employed)
• Life insurance premiums (term insurance only — avoid endowment/ULIP)
• NSC (5-year lock-in, ~7% return)
• 5-year tax-saving FD (5-year lock-in, ~6.5% return)

The smartest 80C move: ELSS funds. They have the shortest lock-in (3 years), equity-level returns (historically 12–15%), and the same ₹1.5L deduction. Compared to PPF's 7.1%, the difference over 15 years is substantial.

One more deduction: Section 80D allows ₹25,000 deduction for health insurance premiums. At ${formatINR(income)}/month, a ₹15,000 health insurance premium saves you ₹3,000–₹4,500 in taxes.

Total tax saving possible with basic planning: ₹30,000–₹60,000/year. That's ${formatINR(2500)}-${formatINR(5000)}/month back in your pocket.`,
    },
  ].sort((a, b) => a.priority - b.priority);
}

function ArticleCard({ article, index }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div
      className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200"
      style={{ animation: `staggerFade 0.4s ease-out ${index * 0.08}s both` }}
    >
      <div className="p-6">
        {/* Meta */}
        <div className="flex items-center gap-3 mb-3">
          <span
            className="text-xs font-semibold px-2.5 py-1 rounded-full"
            style={{ backgroundColor: article.tagColor + '18', color: article.tagColor }}
          >
            {article.tag}
          </span>
          <span className="flex items-center gap-1 text-xs text-gray-400">
            <Clock size={11} />
            {article.readTime}
          </span>
        </div>

        {/* Title */}
        <h3 className="font-semibold text-gray-900 text-base leading-snug mb-3">
          {article.title}
        </h3>

        {/* Teaser */}
        <p className="text-sm text-gray-500 leading-relaxed mb-4">
          {article.teaser}
        </p>

        {/* Expand */}
        <button
          onClick={() => setExpanded(!expanded)}
          className="flex items-center gap-1.5 text-sm font-medium text-indigo-600 hover:text-indigo-800 transition-colors"
        >
          {expanded ? (
            <>Collapse <ChevronUp size={15} /></>
          ) : (
            <>Read More <ChevronDown size={15} /></>
          )}
        </button>

        {expanded && (
          <div className="mt-4 pt-4 border-t border-gray-100">
            {article.article.split('\n\n').map((para, i) => (
              <p key={i} className="text-sm text-gray-600 leading-relaxed mb-3 last:mb-0">
                {para}
              </p>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function EducationHub() {
  const { metrics, profile } = useApp();
  const articles = buildArticles(metrics, profile);

  return (
    <div className="pb-20 md:pb-8">
      <div className="max-w-3xl mx-auto px-4 md:px-6 py-6">
        {/* Header */}
        <div className="mb-6 stagger-1">
          <h1 className="text-2xl font-bold text-gray-900">Learn what your money is doing</h1>
          <p className="text-gray-500 text-sm mt-1">
            Short, practical reads built around your numbers.
          </p>
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mb-6 overflow-x-auto hide-scrollbar stagger-2">
          {[
            { label: 'Articles', value: articles.length },
            { label: 'Read time', value: `${articles.length * 3} min` },
            { label: 'Personalised to', value: 'your data' },
          ].map(({ label, value }) => (
            <div key={label} className="bg-white rounded-2xl border border-gray-100 px-4 py-3 flex-shrink-0">
              <div className="text-sm font-bold text-gray-900">{value}</div>
              <div className="text-xs text-gray-400">{label}</div>
            </div>
          ))}
        </div>

        {/* Articles */}
        <div className="space-y-4">
          {articles.map((article, i) => (
            <ArticleCard key={article.id} article={article} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
