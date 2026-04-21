import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppContext } from './context/AppContext.jsx';
import { DEMO_TRANSACTIONS, DEMO_PROFILE, DEMO_INSIGHTS } from './utils/demoData.js';
import { loadOverrides, saveOverride } from './utils/categoryOverrides.js';
import { computeMetrics } from './utils/scoring.js';
import { generateInsights } from './utils/claudeApi.js';
import Navigation from './components/Navigation.jsx';
import Onboarding from './components/screens/Onboarding.jsx';
import Dashboard from './components/screens/Dashboard.jsx';
import Insights from './components/screens/Insights.jsx';
import GoalSimulator from './components/screens/GoalSimulator.jsx';
import EducationHub from './components/screens/EducationHub.jsx';
import Transactions from './components/screens/Transactions.jsx';

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('onboarding');
  const [profile, setProfile]             = useState(DEMO_PROFILE);
  const [transactions, setTransactions]   = useState([]);
  const [metrics, setMetrics]             = useState(null);
  const [insights, setInsights]           = useState([]);
  const [isLoadingInsights, setIsLoadingInsights] = useState(false);
  const [goals, setGoals]                 = useState([]);
  const [dataSource, setDataSource]       = useState('demo'); // 'demo' | 'pdf' | 'sms'
  const [txCount, setTxCount]             = useState(0);
  const [selectedPeriod, setSelectedPeriod] = useState('all');
  const [categoryOverrides, setCategoryOverridesState] = useState(() => loadOverrides());

  const setCategoryOverride = useCallback((description, category) => {
    const updated = saveOverride(description, category);
    setCategoryOverridesState({ ...updated });
  }, []);

  // Filter transactions by selected period
  const filteredTransactions = useMemo(() => {
    if (!transactions.length) return transactions;
    const now = new Date();

    if (selectedPeriod === 'all') return transactions;

    if (selectedPeriod === 'this_month') {
      return transactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth();
      });
    }
    if (selectedPeriod === 'last_month') {
      const lm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      return transactions.filter(t => {
        const d = new Date(t.date);
        return d.getFullYear() === lm.getFullYear() && d.getMonth() === lm.getMonth();
      });
    }
    if (selectedPeriod === '3m') {
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      return transactions.filter(t => new Date(t.date) >= cutoff);
    }
    if (selectedPeriod === '6m') {
      const cutoff = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      return transactions.filter(t => new Date(t.date) >= cutoff);
    }
    // Specific month: 'YYYY-MM'
    const [yr, mo] = selectedPeriod.split('-').map(Number);
    return transactions.filter(t => {
      const d = new Date(t.date);
      return d.getFullYear() === yr && d.getMonth() + 1 === mo;
    });
  }, [transactions, selectedPeriod]);

  // Recompute metrics whenever transactions or profile change
  useEffect(() => {
    if (transactions.length > 0) {
      const m = computeMetrics(transactions, profile);
      setMetrics(m);
    }
  }, [transactions, profile]);

  // processTransactions: called from onboarding step 2
  const processTransactions = useCallback(async (txns, source) => {
    const isReal = txns && txns.length > 0;
    const finalTxns = isReal ? txns : DEMO_TRANSACTIONS;
    setDataSource(isReal ? source : 'demo');
    setTxCount(finalTxns.length);
    setTransactions(finalTxns);

    const m = computeMetrics(finalTxns, profile);
    setMetrics(m);

    // Generate insights
    setIsLoadingInsights(true);
    try {
      const ins = await generateInsights(m, profile);
      setInsights(ins);
    } catch {
      setInsights(DEMO_INSIGHTS);
    } finally {
      setIsLoadingInsights(false);
    }

    // Small delay so the loading animation shows
    await new Promise(r => setTimeout(r, 3000));
    setCurrentScreen('dashboard');
  }, [profile]);

  // Refresh insights (callable from Dashboard / Insights)
  const refreshInsights = useCallback(async () => {
    if (!metrics || isLoadingInsights) return;
    setIsLoadingInsights(true);
    try {
      const ins = await generateInsights(metrics, profile);
      setInsights(ins);
    } catch {
      setInsights(DEMO_INSIGHTS);
    } finally {
      setIsLoadingInsights(false);
    }
  }, [metrics, profile, isLoadingInsights]);

  const navigateTo = useCallback((screen) => {
    setCurrentScreen(screen);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const ctx = {
    currentScreen,
    profile,
    setProfile,
    transactions,
    setTransactions,
    metrics,
    insights,
    isLoadingInsights,
    goals,
    setGoals,
    navigateTo,
    processTransactions,
    refreshInsights,
    dataSource,
    txCount,
    selectedPeriod,
    setSelectedPeriod,
    filteredTransactions,
    categoryOverrides,
    setCategoryOverride,
  };

  const showNav = currentScreen !== 'onboarding';

  return (
    <AppContext.Provider value={ctx}>
      <div className="min-h-screen bg-[#FAFAFA]" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        {showNav && <Navigation />}

        <main className={showNav ? 'max-w-[1440px] mx-auto' : ''}>
          {currentScreen === 'onboarding'    && <Onboarding />}
          {currentScreen === 'dashboard'     && <Dashboard />}
          {currentScreen === 'transactions'  && <Transactions />}
          {currentScreen === 'insights'      && <Insights />}
          {currentScreen === 'goals'         && <GoalSimulator />}
          {currentScreen === 'education'     && <EducationHub />}
        </main>
      </div>
    </AppContext.Provider>
  );
}
