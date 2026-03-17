import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { 
  budgetCategories as initialCategories, 
  transactions as initialTransactions, 
  accounts as initialAccounts, 
  forecasts as initialForecasts, 
  savings as initialSavings 
} from '../data/mockData';
import { supabase } from '../supabase';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error('useData must be used within a DataProvider');
  return context;
};

const getLocal = (key, initial) => {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : initial;
  } catch { return initial; }
};

export const DataProvider = ({ children }) => {
  const [categories, setCategories] = useState(() => getLocal('money_categories', initialCategories));
  const [transactions, setTransactions] = useState(() => getLocal('money_transactions', initialTransactions));
  const [accounts, setAccounts] = useState(() => getLocal('money_accounts', initialAccounts));
  const [savingsItems, setSavingsItems] = useState(() => getLocal('money_savings', initialSavings));
  const [forecasts, setForecasts] = useState(() => {
    const local = getLocal('money_forecasts', initialForecasts);
    const validForecasts = local && local.length > 0 ? local : initialForecasts;
    const currentYear = new Date().getFullYear();
    return validForecasts.map(f => ({ ...f, month: f.month ? f.month.replace(/\d{4}/, currentYear) : f.month }));
  });
  const [goal, setGoal] = useState(() => getLocal('money_goal', { id: 'default-goal', name: 'Objectif', targetAmount: 500, manualAmount: 100, icon: '🏖️' }));
  const [globalRecurrences, setGlobalRecurrences] = useState(() => getLocal('money_global_recurrences', { revenus: [], fixes: [], variables: [] }));
  const [monthsState, setMonthsState] = useState(() => getLocal('money_forecasts_detail', {}));
  
  const hasFetchedRef = useRef(false);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingSupabase, setUsingSupabase] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => setSession(sess));
    return () => subscription.unsubscribe();
  }, []);

  const fetchAllData = async () => {
    if (hasFetchedRef.current || !session?.user) {
      if (!session?.user) setLoading(false);
      return;
    }
    hasFetchedRef.current = true;
    setLoading(true);

    try {
      const [{ data: cats }, { data: txs }, { data: accs }, { data: svs }, { data: fcs }, { data: gl }, { data: st }] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('accounts').select('*'),
        supabase.from('savings').select('*'),
        supabase.from('forecasts').select('*').order('id', { ascending: true }),
        supabase.from('goal').select('*').limit(1).maybeSingle(),
        supabase.from('app_state').select('*').in('key', ['globalRecurrences', 'forecasts_detail'])
      ]);

      const safeCats = cats || [];
      const safeTxs = txs || [];
      const safeAccs = accs || [];
      const safeSvs = svs || [];
      const safeFcs = fcs || [];
      const safeSt = st || [];

      if (!safeCats.length && !safeTxs.length && !safeAccs.length) {
        await migrateFromLocal();
      } else {
        setUsingSupabase(true);
        if (safeCats.length) setCategories(safeCats);
        if (safeAccs.length) setAccounts(safeAccs);
        if (safeSvs.length) setSavingsItems(safeSvs);
        if (gl) setGoal(gl);
        
        if (safeTxs.length) {
          const grouped = [];
          safeTxs.forEach(tx => {
            const label = tx.dateLabel || "Inconnu";
            let g = grouped.find(gr => gr.dateLabel === label);
            if (!g) { g = { dateLabel: label, items: [] }; grouped.push(g); }
            g.items.push(tx);
          });
          setTransactions(grouped);
        }

        if (safeFcs.length) {
          const year = new Date().getFullYear();
          setForecasts(safeFcs.map(f => ({ ...f, month: f.month ? f.month.replace(/\d{4}/, year) : f.month })));
        }

        if (safeSt.length) {
          const gr = safeSt.find(s => s.key === 'globalRecurrences');
          const fd = safeSt.find(s => s.key === 'forecasts_detail');
          if (gr?.value) setGlobalRecurrences(gr.value);
          if (fd?.value) setMonthsState(fd.value);
        }
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const migrateFromLocal = async () => {
    const flatTxs = [];
    transactions.forEach(g => g.items.forEach(tx => flatTxs.push({ ...tx, dateLabel: g.dateLabel })));
    try {
      await Promise.all([
        categories.length && supabase.from('categories').upsert(categories),
        flatTxs.length && supabase.from('transactions').upsert(flatTxs),
        accounts.length && supabase.from('accounts').upsert(accounts),
        savingsItems.length && supabase.from('savings').upsert(savingsItems),
        forecasts.length && supabase.from('forecasts').upsert(forecasts),
        supabase.from('goal').upsert([goal]),
        supabase.from('app_state').upsert([{ key: 'globalRecurrences', value: globalRecurrences }, { key: 'forecasts_detail', value: monthsState }])
      ]);
      setUsingSupabase(true);
    } catch (e) { console.error('Migration failed:', e); }
  };

  useEffect(() => { if (session) fetchAllData(); }, [session]);

  const addTransaction = (tx) => {
    setTransactions(prev => {
      const label = tx.dateLabel || "Aujourd'hui";
      const updated = [...prev];
      const idx = updated.findIndex(g => g.dateLabel === label);
      if (idx > -1) updated[idx].items = [tx, ...updated[idx].items];
      else updated.push({ dateLabel: label, items: [tx] });
      if (usingSupabase) supabase.from('transactions').insert([{ ...tx, dateLabel: label }]).catch(console.error);
      return updated;
    });
  };

  const deleteAccount = (id) => {
    setAccounts(prev => prev.filter(a => String(a.id) !== String(id)));
    if (usingSupabase) supabase.from('accounts').delete().eq('id', String(id)).catch(console.error);
  };

  const updateMonthForecast = (id, income, expenses) => {
    setForecasts(prev => prev.map(f => String(f.id) === String(id) ? { ...f, income, expenses } : f));
    if (usingSupabase) {
      const f = forecasts.find(i => String(i.id) === String(id));
      if (f) supabase.from('forecasts').upsert([{ ...f, user_id: session.user.id, income, expenses }]).catch(console.error);
    }
  };

  const addAccount = (acc) => {
    const newAcc = { ...acc, id: String(Date.now() + Math.random()) };
    setAccounts(prev => [...prev, newAcc]);
    if (usingSupabase) supabase.from('accounts').insert([{ ...newAcc, user_id: session?.user?.id }]).catch(console.error);
  };

  const updateAccount = (acc) => {
    setAccounts(prev => prev.map(a => String(a.id) === String(acc.id) ? acc : a));
    if (usingSupabase) supabase.from('accounts').upsert([{ ...acc, user_id: session?.user?.id }]).catch(console.error);
  };

  const addSaving = (sav) => {
    const newSav = { ...sav, id: String(Date.now() + Math.random()) };
    setSavingsItems(prev => [...prev, newSav]);
    if (usingSupabase) supabase.from('savings').insert([{ ...newSav, user_id: session?.user?.id }]).catch(console.error);
  };

  const updateSaving = (sav) => {
    setSavingsItems(prev => prev.map(s => String(s.id) === String(sav.id) ? sav : s));
    if (usingSupabase) supabase.from('savings').upsert([{ ...sav, user_id: session?.user?.id }]).catch(console.error);
  };

  const deleteSaving = (id) => {
    setSavingsItems(prev => prev.filter(s => String(s.id) !== String(id)));
    if (usingSupabase) supabase.from('savings').delete().eq('id', String(id)).catch(console.error);
  };

  const value = {
    categories, transactions, setTransactions, accounts, savingsItems, forecasts, 
    setForecasts: updateMonthForecast, monthsState, setMonthsState,
    globalRecurrences, setGlobalRecurrences, addTransaction, 
    addAccount, updateAccount, addSaving, updateSaving, deleteSaving,
    deleteAccount, goal, setGoal, loading, usingSupabase, session, user: session?.user
  };

  return (
    <DataContext.Provider value={value}>
      <ErrorBoundary>{children}</ErrorBoundary>
    </DataContext.Provider>
  );
};

class ErrorBoundary extends React.Component {
  state = { hasError: false, error: null };
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 20, background: '#fff0f0', border: '1px solid red' }}>
          <h2>Désolé, une erreur est survenue</h2>
          <pre>{this.state.error?.toString()}</pre>
          <button onClick={() => window.location.reload()}>Recharger</button>
        </div>
      );
    }
    return this.props.children;
  }
}
