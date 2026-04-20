import { formatINR } from './formatters.js';
import { DEMO_INSIGHTS } from './demoData.js';

function buildPrompt(metrics, profile) {
  const topCategories = (metrics.categoryMonthly || [])
    .filter(c => !['Income'].includes(c.name))
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

export async function generateInsights(metrics, profile) {
  const apiKey = profile.apiKey?.trim();
  if (!apiKey) return DEMO_INSIGHTS;

  try {
    // Try via Vercel serverless proxy first (avoids CORS in production)
    const endpoint = '/api/insights';
    const prompt = buildPrompt(metrics, profile);

    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, apiKey }),
    });

    if (!res.ok) throw new Error(`API proxy error: ${res.status}`);

    const data = await res.json();
    const text = data?.content?.[0]?.text || '';

    // Parse JSON — strip any accidental markdown fences
    const cleaned = text.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.map((ins, i) => ({ ...ins, id: `ai-${i}` }));
    }
  } catch (err) {
    console.warn('[ClearMoney] Claude API call failed, using demo insights:', err.message);
  }

  return DEMO_INSIGHTS;
}
