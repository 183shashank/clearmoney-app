import { formatINR } from './formatters.js';

function buildPrompt(metrics, profile) {
  const topCategories = (metrics.categoryMonthly || [])
    .filter(c => c.name !== 'Income')
    .slice(0, 6)
    .map(c => `${c.name}: ${formatINR(c.monthly)}/month`)
    .join(', ');

  return `You are a warm, non-judgmental personal finance advisor for an Indian millennial or Gen Z user. Based on the following financial data, generate 8 insight cards. Each insight must be specific to this user's numbers — never generic.

USER FINANCIAL PROFILE:
- Monthly income: ${formatINR(metrics.monthlyIncome)}
- Monthly expenses: ${formatINR(metrics.monthlyExpenses)}
- Monthly savings: ${formatINR(metrics.monthlySavings)}
- Savings rate: ${metrics.savingsRate.toFixed(1)}%
- Emergency fund coverage: ${metrics.emergencyCoverage.toFixed(1)} months
- Investment activity: ${formatINR(metrics.monthlyInvestment)}/month (${metrics.investmentRate.toFixed(1)}% of income)
- Monthly EMI load: ${formatINR(metrics.monthlyEMI)} (${metrics.debtRate.toFixed(1)}% of income)
- Top spending categories: ${topCategories}
- Financial Health Score: ${metrics.overall}/100
- Primary goal: ${profile.primaryGoal || 'Save more'}

Generate exactly 8 insights as a JSON array. Each insight object must have:
- "category": one of [Food, Transport, Entertainment, Savings, Investment, Debt, Income, Projection, Spending]
- "headline": a punchy, specific, plain-English headline (max 12 words)
- "supporting_data": one sentence with actual ₹ numbers from the profile
- "action_prompt": one short action the user can take right now (max 10 words)
- "education_snippet": 2–3 sentences explaining why this matters, woven around the user's own numbers. Non-preachy. Conversational tone.

Return ONLY valid JSON array. No preamble, no markdown fences, no explanation.`;
}

// Generate insights locally from real metrics — used when no API key is provided
function generateLocalInsights(metrics) {
  const {
    savingsRate, monthlySavings, monthlyIncome, monthlyExpenses,
    investmentRate, monthlyInvestment, debtRate, monthlyEMI,
    emergencyCoverage, categoryMonthly,
  } = metrics;

  const top = (categoryMonthly || [])
    .filter(c => c.name !== 'Income' && c.name !== 'Others')
    .slice(0, 4);

  const insights = [];

  // 1. Top spending category
  if (top[0]) {
    const t = top[0];
    insights.push({
      id: 'local-1',
      category: t.name,
      headline: `${t.name} is your biggest spending category`,
      supporting_data: `You spend ${formatINR(t.monthly)}/month on ${t.name} on average — your single largest discretionary outflow.`,
      action_prompt: `Set a monthly ${t.name} budget`,
      education_snippet: `Awareness is the first step. Cutting ${t.name} by just 20% saves you ${formatINR(t.monthly * 0.2 * 12)}/year — enough to fund several months of SIP contributions.`,
    });
  }

  // 2. Savings rate
  if (savingsRate < 20) {
    const gap = monthlyIncome * 0.2 - monthlySavings;
    insights.push({
      id: 'local-2',
      category: 'Savings',
      headline: `Savings rate of ${savingsRate.toFixed(0)}% — below the 20% target`,
      supporting_data: `You save ${formatINR(monthlySavings)} of ${formatINR(monthlyIncome)} per month. Saving ${formatINR(Math.ceil(gap))} more closes the gap to 20%.`,
      action_prompt: `Auto-transfer ${formatINR(Math.ceil(gap))} on salary day`,
      education_snippet: `The 20% rule exists because it's the minimum needed to build wealth while covering life's needs. From your income of ${formatINR(monthlyIncome)}, the target is ${formatINR(monthlyIncome * 0.2)}/month — you're ${formatINR(gap)} short. Automating this on payday makes it invisible.`,
    });
  } else {
    insights.push({
      id: 'local-2',
      category: 'Savings',
      headline: `${savingsRate.toFixed(0)}% savings rate — above benchmark`,
      supporting_data: `You save ${formatINR(monthlySavings)} from ${formatINR(monthlyIncome)} per month — above the recommended 20% floor.`,
      action_prompt: `Push to ${Math.ceil(savingsRate / 5) * 5 + 5}% next month`,
      education_snippet: `You're already in the top tier of savers. Going from ${savingsRate.toFixed(0)}% to 25% means just ${formatINR(monthlyIncome * 0.05)} more per month — but over 10 years at 12% returns, that compounds to over ${formatINR(monthlyIncome * 0.05 * 230)}.`,
    });
  }

  // 3. Investment
  if (monthlyInvestment === 0) {
    insights.push({
      id: 'local-3',
      category: 'Investment',
      headline: 'No investments detected — time to start a SIP',
      supporting_data: `Zero investment activity found. Even ${formatINR(monthlyIncome * 0.05)}/month (5% of income) started today compounds significantly.`,
      action_prompt: 'Open a Groww or Kuvera account today',
      education_snippet: `Every month without investing is compounding lost forever. ${formatINR(monthlyIncome * 0.05)}/month at 12% annual return becomes ${formatINR(monthlyIncome * 0.05 * 232)} in 10 years. The best day to start was yesterday — the second best is today.`,
    });
  } else if (investmentRate < 10) {
    const gap = monthlyIncome * 0.10 - monthlyInvestment;
    insights.push({
      id: 'local-3',
      category: 'Investment',
      headline: `Investing ${formatINR(monthlyInvestment)}/month — just below the 10% target`,
      supporting_data: `Your investment rate is ${investmentRate.toFixed(1)}% of income. Adding ${formatINR(Math.ceil(gap))}/month reaches the recommended 10%.`,
      action_prompt: `Step up SIP by ${formatINR(Math.ceil(gap))}`,
      education_snippet: `You already have the SIP habit — that's the hardest part. A step-up of ${formatINR(Math.ceil(gap))}/month, left untouched for 10 years at 12%, creates an additional ${formatINR(Math.ceil(gap) * 232)} in wealth.`,
    });
  } else {
    insights.push({
      id: 'local-3',
      category: 'Investment',
      headline: `${investmentRate.toFixed(0)}% investment rate — well above target`,
      supporting_data: `${formatINR(monthlyInvestment)}/month invested — your wealth is compounding at pace.`,
      action_prompt: 'Review fund allocation and rebalance',
      education_snippet: `At ${formatINR(monthlyInvestment)}/month and 12% returns, you're on track for ${formatINR(monthlyInvestment * 232)} in 10 years. Consider diversifying across large-cap, mid-cap, and a debt fund if you haven't already.`,
    });
  }

  // 4. EMI / Debt
  if (monthlyEMI > 0) {
    insights.push({
      id: 'local-4',
      category: 'Debt',
      headline: debtRate < 40
        ? `EMI load of ${debtRate.toFixed(0)}% — comfortably within limits`
        : `EMI load of ${debtRate.toFixed(0)}% — approaching the danger zone`,
      supporting_data: `Your ${formatINR(monthlyEMI)}/month in EMIs is ${debtRate.toFixed(1)}% of income. The safe ceiling is 40%.`,
      action_prompt: debtRate >= 40 ? 'Avoid all new debt this year' : 'Check if prepayment saves interest',
      education_snippet: debtRate < 40
        ? `Your debt load is healthy. Making one extra EMI payment per year can reduce a 20-year loan to under 17 years, saving a significant amount in total interest paid.`
        : `At ${debtRate.toFixed(0)}% of income in EMIs, you have limited flexibility. Prioritise the highest-interest debt and avoid any new borrowing until the ratio drops below 35%.`,
    });
  } else {
    insights.push({
      id: 'local-4',
      category: 'Debt',
      headline: 'No EMIs detected — you have full financial flexibility',
      supporting_data: `Zero loan repayments found in your transactions. This gives you maximum room for saving and investing.`,
      action_prompt: 'Put the headroom into your SIP',
      education_snippet: `Being EMI-free is a genuine financial superpower. The flexibility to redirect that money into investments means your wealth can compound without any drag. Protect this status before taking on any new credit.`,
    });
  }

  // 5. Emergency fund
  if (emergencyCoverage < 3) {
    const needed = (3 - emergencyCoverage) * monthlyExpenses;
    insights.push({
      id: 'local-5',
      category: 'Projection',
      headline: `Emergency fund covers ${emergencyCoverage.toFixed(1)} months — target is 3`,
      supporting_data: `You need ${formatINR(monthlyExpenses * 3)} for full 3-month coverage. You're approximately ${formatINR(needed)} short.`,
      action_prompt: `Park ${formatINR(Math.ceil(needed / 6))}/month in a liquid fund`,
      education_snippet: `An emergency fund isn't pessimism — it's the foundation that makes every other financial goal reachable. Without it, a medical bill or job gap could force a credit card swipe at 36% APR or premature FD redemption.`,
    });
  } else {
    insights.push({
      id: 'local-5',
      category: 'Savings',
      headline: 'Emergency fund fully covered — solid foundation',
      supporting_data: `${emergencyCoverage.toFixed(1)} months of expenses covered — above the recommended 3-month minimum.`,
      action_prompt: 'Move surplus to higher-return investments',
      education_snippet: `Your emergency buffer is fully built. Any savings beyond 6 months in a liquid fund is probably being under-utilised. Consider moving the excess into equity MFs for better long-term growth.`,
    });
  }

  // 6. Second top category
  if (top[1]) {
    const t = top[1];
    insights.push({
      id: 'local-6',
      category: t.name,
      headline: `${t.name} is your #2 spend — ${formatINR(t.monthly)}/month`,
      supporting_data: `Combined, your top 2 categories account for ${formatINR((top[0]?.monthly || 0) + t.monthly)}/month.`,
      action_prompt: `Set a ${t.name} spending limit`,
      education_snippet: `Your top two spending categories often hold the most optimisation potential. A 15% trim across both saves you ${formatINR(((top[0]?.monthly || 0) + t.monthly) * 0.15 * 12)}/year — money that could go straight into your SIP.`,
    });
  }

  // 7. Expense ratio
  const expenseRatio = monthlyIncome > 0 ? (monthlyExpenses / monthlyIncome) * 100 : 0;
  insights.push({
    id: 'local-7',
    category: 'Spending',
    headline: `You spend ${expenseRatio.toFixed(0)}% of income — here's the breakdown`,
    supporting_data: `${formatINR(monthlyExpenses)} spent of ${formatINR(monthlyIncome)} earned, leaving ${formatINR(monthlySavings)} net per month.`,
    action_prompt: 'Try the 50/30/20 budget rule',
    education_snippet: `The 50/30/20 rule: 50% on needs, 30% on wants, 20% on savings/investments. Your current spending is ${expenseRatio.toFixed(0)}% of income. Identifying which "wants" can move to the savings bucket is the fastest path to financial improvement.`,
  });

  // 8. 10-year projection
  const tenYrInvest = monthlyInvestment > 0 ? monthlyInvestment * 232 : 0;
  const tenYrSave = monthlySavings * 120;
  insights.push({
    id: 'local-8',
    category: 'Projection',
    headline: 'Your 10-year wealth trajectory at current pace',
    supporting_data: `${formatINR(monthlySavings)}/month saved + ${formatINR(monthlyInvestment)}/month invested at current rates.`,
    action_prompt: 'Model scenarios in Goal Simulator',
    education_snippet: `Your SIP of ${formatINR(monthlyInvestment)}/month compounds to roughly ${formatINR(tenYrInvest)} in 10 years at 12% returns. Your uncompounded savings total ${formatINR(tenYrSave)}. The gap between the two — ${formatINR(Math.abs(tenYrInvest - tenYrSave))} — is what investing buys you over just keeping cash.`,
  });

  return insights.filter(Boolean).slice(0, 8);
}

export async function generateInsights(metrics, profile) {
  const apiKey = profile.apiKey?.trim();

  // No API key → generate dynamically from real metrics (not hardcoded demo text)
  if (!apiKey) return generateLocalInsights(metrics);

  try {
    const prompt = buildPrompt(metrics, profile);
    const res = await fetch('/api/insights', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, apiKey }),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);

    const data = await res.json();
    const text = data?.content?.[0]?.text || '';
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((ins, i) => ({ ...ins, id: `ai-${i}` }));
    }
  } catch (err) {
    console.warn('[ClearMoney] Claude API failed, falling back to local insights:', err.message);
  }

  // API failed → still use real metrics, not hardcoded demo text
  return generateLocalInsights(metrics);
}
