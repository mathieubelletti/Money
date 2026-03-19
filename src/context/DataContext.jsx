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

const getLocal = (key, initial, userId = null) => {
  try {
    const finalKey = userId ? `${key}_${userId}` : key;
    const saved = localStorage.getItem(finalKey);
    return saved ? JSON.parse(saved) : initial;
  } catch { return initial; }
};

const setLocal = (key, value, userId = null) => {
  try {
    const finalKey = userId ? `${key}_${userId}` : key;
    localStorage.setItem(finalKey, JSON.stringify(value));
  } catch (e) { console.error('Local storage save failed', e); }
};

export const DataProvider = ({ children }) => {
  const [categories, setCategories] = useState(() => getLocal('money_categories', initialCategories));
  const [transactions, setTransactions] = useState(() => getLocal('money_transactions', initialTransactions));
  const [accounts, setAccounts] = useState(() => getLocal('money_accounts', initialAccounts));
  const [savingsItems, setSavingsItems] = useState(() => getLocal('money_savings', initialSavings));
  const [monthsState, setMonthsState] = useState(() => {
    const local = getLocal('money_forecasts_detail', {});
    const userId = getLocal('money_session', null)?.user?.id;
    const currentYear = new Date().getFullYear();
    const migrated = {};
    // Migration: If keys are "1", "2" or "YYYY-MM", migrate them to "userId_YYYY-MM"
    Object.keys(local).forEach(key => {
      let monthPart = key;
      if (!isNaN(key) && parseInt(key) <= 12) {
        monthPart = `${currentYear}-${key.padStart(2, '0')}`;
      }
      if (userId && !key.startsWith(userId)) {
        migrated[`${userId}_${monthPart}`] = local[key];
      } else {
        migrated[key] = local[key];
      }
    });
    return migrated;
  });
  const [forecasts, setForecasts] = useState(() => {
    const local = getLocal('money_forecasts', initialForecasts);
    const userId = getLocal('money_session', null)?.user?.id;
    const validForecasts = local && local.length > 0 ? local : initialForecasts;
    const currentYear = new Date().getFullYear();
    return validForecasts.map((f, idx) => {
      const monthNum = String(idx + 1).padStart(2, '0');
      const standardSlug = `${currentYear}-${monthNum}`;
      return { 
        ...f, 
        id: userId ? `${userId}_${standardSlug}` : standardSlug,
        month: (f.month && typeof f.month === 'string') ? f.month.replace(/\d{4}/, currentYear) : f.month 
      };
    });
  });
  const [goal, setGoal] = useState(() => getLocal('money_goal', { id: 'default-goal', name: 'Objectif', targetAmount: 500, manualAmount: 100, icon: '🏖️' }));
  const [globalRecurrences, setGlobalRecurrences] = useState(() => getLocal('money_global_recurrences', { revenus: [], fixes: [], variables: [] }));
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const userId = getLocal('money_session', null)?.user?.id;
    const slug = new Date().toISOString().substring(0, 7);
    return userId ? `${userId}_${slug}` : slug;
  });
  
  // Dynamic balance calculation
  const accountsWithBalances = React.useMemo(() => {
    // 1. Flatten all transactions across groups
    const flatTxs = transactions.reduce((acc, group) => [...acc, ...group.items], []);
    
    // 2. Map and compute balance for each account
    return accounts.map(acc => {
      const startDate = acc.initialBalanceDate || '1970-01-01';
      
      const txSum = flatTxs
        .filter(tx => {
          const isSameAccount = (tx.account_id && String(tx.account_id) === String(acc.id)) || 
                               (!tx.account_id && tx.account === acc.name);
          if (!isSameAccount) return false;
          
          // Only include transactions >= initialBalanceDate
          return (tx.date || '9999-12-31') >= startDate;
        })
        .reduce((sum, tx) => sum + (tx.amount || 0), 0);
      
      return {
        ...acc,
        balance: (acc.initialBalance || 0) + txSum
      };
    });
  }, [accounts, transactions]);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [usingSupabase, setUsingSupabase] = useState(false);
  const [syncStatus, setSyncStatus] = useState('idle');
  const hasFetchedRef = useRef(false);
  const lastUserIdRef = useRef(null);
  const [fetchingPrevisions, setFetchingPrevisions] = useState(false);
  const syncTimeoutRef = useRef(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      if (sess?.user?.id) lastUserIdRef.current = sess.user.id;
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      
      const newUserId = sess?.user?.id;
      if (newUserId !== lastUserIdRef.current) {
        // User changed or logged out
        hasFetchedRef.current = false;
        lastUserIdRef.current = newUserId;
        
        // Reset state to initial or user-specific local storage
        setCategories(getLocal('money_categories', initialCategories, newUserId));
        setTransactions(getLocal('money_transactions', initialTransactions, newUserId));
        setAccounts(getLocal('money_accounts', initialAccounts, newUserId));
        setSavingsItems(getLocal('money_savings', initialSavings, newUserId));
        setForecasts(getLocal('money_forecasts', initialForecasts, newUserId));
        setGoal(getLocal('money_goal', { id: 'default-goal', name: 'Objectif', targetAmount: 500, manualAmount: 100, icon: '🏖️' }, newUserId));
        setGlobalRecurrences(getLocal('money_global_recurrences', { revenus: [], fixes: [], variables: [] }, newUserId));
        setMonthsState(getLocal('money_forecasts_detail', {}, newUserId));
        
        if (!newUserId) {
          setUsingSupabase(false);
          setLoading(false);
        }
      }
    });
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

      if (safeCats.length || safeTxs.length || safeAccs.length || safeSvs.length) {
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
            if (!g) { 
              g = { id: `g_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, dateLabel: label, items: [] }; 
              grouped.push(g); 
            }
            g.items.push(tx);
          });
          setTransactions(grouped);
        }

        if (safeFcs.length) {
          const userId = session?.user?.id;
          const year = new Date().getFullYear();
          
          // Helper to extract index from ID (handles numeric and prefixed IDs)
          const getIdx = (id) => {
            const parts = String(id).split('_');
            const slug = parts[parts.length - 1];
            if (slug.includes('-')) {
              return parseInt(slug.split('-')[1], 10) - 1;
            }
            return parseInt(slug, 10) - 1;
          };

          const sortedFcs = [...safeFcs].sort((a, b) => getIdx(a.id) - getIdx(b.id));

          // Deduplicate: keep only one forecast per month position (0–11)
          const deduplicatedFcs = [];
          const seenMonths = new Set();
          for (const f of sortedFcs) {
            const idx = getIdx(f.id);
            if (idx >= 0 && idx < 12 && !seenMonths.has(idx)) {
              seenMonths.add(idx);
              deduplicatedFcs.push({ ...f, _monthIdx: idx });
            }
          }
          deduplicatedFcs.sort((a, b) => a._monthIdx - b._monthIdx);

          // Fill missing months (0-11) from initialForecasts to always have 12 entries
          const fullFcs = [];
          for (let i = 0; i < 12; i++) {
            const existing = deduplicatedFcs.find(f => f._monthIdx === i);
            if (existing) {
              fullFcs.push(existing);
            } else {
              // Use the initialForecasts fallback for this month
              fullFcs.push({ ...initialForecasts[i], _monthIdx: i });
            }
          }
          
          setForecasts(fullFcs.map((f, idx) => {
            const monthNum = String(idx + 1).padStart(2, '0');
            const standardSlug = `${year}-${monthNum}`;
            return { 
              ...f, 
              id: userId ? `${userId}_${standardSlug}` : standardSlug,
              month: (f.month && typeof f.month === 'string') ? f.month.replace(/\d{4}/, year) : f.month 
            };
          }));
        }

        if (safeSt.length) {
          const gr = safeSt.find(s => s.key === 'globalRecurrences');
          const fd = safeSt.find(s => s.key === 'forecasts_detail');
          if (gr?.value) setGlobalRecurrences(gr.value);
          if (fd?.value) setMonthsState(fd.value);
        }
      } else {
        // Truly empty on Supabase - only then check local migration
        await migrateFromLocal();
      }
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const migrateFromLocal = async () => {
    const flatTxs = [];
    transactions.forEach(g => g.items.forEach(tx => flatTxs.push({ ...tx, dateLabel: g.dateLabel, user_id: session?.user?.id })));
    try {
      await Promise.all([
        categories.length && supabase.from('categories').upsert(categories.map(c => ({ ...c, user_id: session?.user?.id }))),
        flatTxs.length && supabase.from('transactions').upsert(flatTxs),
        accounts.length && supabase.from('accounts').upsert(accounts.map(a => ({ ...a, user_id: session?.user?.id }))),
        savingsItems.length && supabase.from('savings').upsert(savingsItems.map(s => ({ ...s, user_id: session?.user?.id }))),
        forecasts.length && supabase.from('forecasts').upsert(forecasts.map(f => ({ ...f, user_id: session?.user?.id }))),
        supabase.from('goal').upsert([{ ...goal, user_id: session?.user?.id }]),
        supabase.from('app_state').upsert([
          { key: 'globalRecurrences', value: globalRecurrences, user_id: session?.user?.id },
          { key: 'forecasts_detail', value: monthsState, user_id: session?.user?.id }
        ])
      ].filter(Boolean));
      setUsingSupabase(true);
    } catch (e) { console.error('Migration failed:', e); }
  };

  useEffect(() => { if (session) fetchAllData(); }, [session]);

  const addTransactions = React.useCallback((txs) => {
    setTransactions(prev => {
      const updated = [...prev];
      txs.forEach(tx => {
        const label = tx.dateLabel || "Aujourd'hui";
        const idx = updated.findIndex(g => g.dateLabel === label);
        if (idx > -1) {
          updated[idx] = { ...updated[idx], items: [tx, ...updated[idx].items] };
        } else {
          updated.push({ id: `g_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, dateLabel: label, items: [tx] });
        }
      });
      return updated;
    });
    if (usingSupabase) {
      const inserts = txs.map(tx => ({ ...tx, dateLabel: tx.dateLabel || "Aujourd'hui", user_id: session?.user?.id }));
      supabase.from('transactions').insert(inserts).then(({ error }) => { if (error) console.error(error); });
    }
  }, [usingSupabase, session]);

  const addTransaction = React.useCallback((tx) => {
    addTransactions([tx]);
  }, [addTransactions]);

  const deleteTransaction = React.useCallback((id) => {
    setTransactions(prev => {
      return prev.map(group => ({
        ...group,
        items: group.items.filter(item => String(item.id) !== String(id))
      })).filter(group => group.items.length > 0);
    });
    if (usingSupabase) {
      supabase.from('transactions').delete().eq('id', id).then(({ error }) => { if (error) console.error(error); });
    }
  }, [usingSupabase]);

  const updateTransaction = React.useCallback((tx) => {
    setTransactions(prev => {
      return prev.map(group => ({
        ...group,
        items: group.items.map(item => String(item.id) === String(tx.id) ? { ...tx, user_id: session?.user?.id } : item)
      }));
    });
    if (usingSupabase) {
      supabase.from('transactions').upsert([{ ...tx, user_id: session?.user?.id }]).then(({ error }) => { if (error) console.error(error); });
    }
  }, [usingSupabase, session]);

  const deleteAccount = React.useCallback((id) => {
    setAccounts(prev => prev.filter(a => String(a.id) !== String(id)));
    if (usingSupabase) supabase.from('accounts').delete().eq('id', String(id)).then(({ error }) => { if (error) console.error(error); });
  }, [usingSupabase]);

  const updateMonthForecast = React.useCallback((id, income, expenses) => {
    setForecasts(prev => prev.map(f => String(f.id) === String(id) ? { ...f, income, expenses } : f));
    if (usingSupabase) {
      const f = forecasts.find(i => String(i.id) === String(id));
      if (f) supabase.from('forecasts').upsert([{ ...f, user_id: session.user.id, income, expenses }]).then(({ error }) => { if (error) console.error(error); });
    }
  }, [usingSupabase, forecasts, session?.user?.id]);

  const addAccount = React.useCallback((acc) => {
    const today = new Date().toISOString().split('T')[0];
    const newAcc = { 
      ...acc, 
      id: `acc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
      user_id: session?.user?.id,
      initialBalanceDate: acc.initialBalanceDate || today
    };
    setAccounts(prev => [...prev, newAcc]);
    if (usingSupabase) supabase.from('accounts').insert([newAcc]).then(({ error }) => { if (error) console.error(error); });
  }, [usingSupabase, session?.user?.id]);

  const updateAccount = React.useCallback((acc) => {
    setAccounts(prev => prev.map(a => String(a.id) === String(acc.id) ? { ...acc, user_id: session?.user?.id } : a));
    
    // If updating the first account, sync its balance to the first month's manual report
    if (accounts.length > 0 && String(accounts[0].id) === String(acc.id)) {
      setMonthsState(prev => {
        const firstId = forecasts[0]?.id;
        if (!firstId) return prev;
        return {
          ...prev,
          [firstId]: { ...(prev[firstId] || { revenus: [], fixes: [], variables: [] }), manualReport: acc.initialBalance }
        };
      });
    }

    if (usingSupabase) supabase.from('accounts').upsert([{ ...acc, user_id: session?.user?.id }]).then(({ error }) => { if (error) console.error(error); });
  }, [usingSupabase, session?.user?.id, accounts, forecasts]);

  const addSaving = React.useCallback((sav) => {
    const newSav = { ...sav, id: `sav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, user_id: session?.user?.id };
    setSavingsItems(prev => [...prev, newSav]);
    if (usingSupabase) supabase.from('savings').insert([newSav]).then(({ error }) => { if (error) console.error(error); });
  }, [usingSupabase, session?.user?.id]);

  const updateSaving = React.useCallback((sav) => {
    setSavingsItems(prev => prev.map(s => String(s.id) === String(sav.id) ? { ...sav, user_id: session?.user?.id } : s));
    if (usingSupabase) supabase.from('savings').upsert([{ ...sav, user_id: session?.user?.id }]).then(({ error }) => { if (error) console.error(error); });
  }, [usingSupabase, session?.user?.id]);

  const deleteSaving = React.useCallback((id) => {
    setSavingsItems(prev => prev.filter(s => String(s.id) !== String(id)));
    if (usingSupabase) supabase.from('savings').delete().eq('id', String(id)).then(({ error }) => { if (error) console.error(error); });
  }, [usingSupabase]);

  const saveGlobalConfig = React.useCallback(async (specificMonthsState) => {
    const userId = session?.user?.id;
    if (!usingSupabase || !userId) return;

    const targetMonthsState = specificMonthsState || monthsState;
    if (Object.keys(targetMonthsState).length === 0 && categories.length === 0 && forecasts.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    setSyncStatus('syncing');
    try {
      const firstForecastId = forecasts[0]?.id;
      const startBalance = firstForecastId ? parseFloat(targetMonthsState[firstForecastId]?.manualReport || 0) : 0;
      
      let accountsToUpsert = [...accounts];
      if (accountsToUpsert.length === 0) {
        accountsToUpsert = [{
          id: `acc_${Date.now()}_main`,
          name: 'Compte Principal',
          bank: 'Ma Banque',
          balance: startBalance,
          initialBalance: startBalance,
          initialBalanceDate: today,
          type: 'Courant',
          color: 'var(--color-primary)',
          icon: 'account_balance_wallet',
          domain: 'google.com',
          accountNumber: 'FR76 ...',
          user_id: userId
        }];
      } else {
        // Only update if it actually changed to avoid redundant state cycles
        const newBalance = parseFloat(startBalance || 0);
        if (accountsToUpsert[0].initialBalance !== newBalance) {
          accountsToUpsert[0] = { ...accountsToUpsert[0], initialBalance: newBalance, user_id: userId };
        }
      }

      const promises = [
        supabase.from('app_state').upsert([
          { key: 'globalRecurrences', value: globalRecurrences, user_id: userId },
          { key: 'forecasts_detail', value: targetMonthsState, user_id: userId }
        ]),
        categories.length > 0 && supabase.from('categories').upsert(categories.map(c => ({ ...c, user_id: userId }))),
        forecasts.length > 0 && supabase.from('forecasts').upsert(forecasts.map(f => ({ ...f, user_id: userId }))),
        supabase.from('accounts').upsert(accountsToUpsert.map(a => ({ ...a, user_id: userId })))
      ].filter(Boolean);

      const results = await Promise.all(promises);
      const errors = results.filter(r => r?.error).map(r => r.error);
      
      if (errors.length > 0) throw errors[0];
      
      // Perform local state update ONLY if count or content changed, or if it was empty
      if (accounts.length !== accountsToUpsert.length || accounts[0]?.initialBalance !== startBalance) {
        setAccounts(accountsToUpsert);
      }
      
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
      console.log('Global configuration synced');
    } catch (err) {
      console.error('Auto-sync error:', err);
      setSyncStatus('error');
    }
  }, [usingSupabase, globalRecurrences, monthsState, categories, forecasts, accounts, session]);

  const fetchPrevisions = React.useCallback(async () => {
    if (!session?.user?.id) return;
    setFetchingPrevisions(true);
    try {
      const { data, error } = await supabase
        .from('previsions')
        .select('*')
        .eq('annee', 2026);
      
      if (error) throw error;
      
      // If we want to sync this with monthsState, we could do it here
      // But according to instructions, we just need the function
      return data;
    } catch (err) {
      console.error('Error fetching previsions:', err);
      return [];
    } finally {
      setFetchingPrevisions(false);
    }
  }, [session?.user?.id]);

  const updatePrevision = React.useCallback(async (mois, montant) => {
    if (!session?.user?.id) return;
    try {
      const { error } = await supabase
        .from('previsions')
        .upsert({
          user_id: session.user.id,
          mois,
          annee: 2026,
          montant_previsionnel: montant,
          statut: montant >= 0 ? 'Excedent' : 'Déficit'
        }, { onConflict: 'user_id,mois,annee' });
      
      if (error) throw error;
    } catch (err) {
      console.error('Error updating prevision:', err);
    }
  }, [session?.user?.id]);

  // Automatic watcher for real-time save of categories, goal, and recurrences
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }
    
    // Clear previous timeout
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);

    if (usingSupabase && session?.user?.id) {
      syncTimeoutRef.current = setTimeout(() => {
        saveGlobalConfig();
      }, 2000); // 2s debounce
    }

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [categories, goal, globalRecurrences, monthsState, usingSupabase, session?.user?.id, saveGlobalConfig]);

  // Persist to user-specific local storage
  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId) return;

    setLocal('money_categories', categories, userId);
    setLocal('money_transactions', transactions, userId);
    setLocal('money_accounts', accounts, userId);
    setLocal('money_savings', savingsItems, userId);
    setLocal('money_forecasts', forecasts, userId);
    setLocal('money_goal', goal, userId);
    setLocal('money_global_recurrences', globalRecurrences, userId);
    setLocal('money_forecasts_detail', monthsState, userId);
  }, [categories, transactions, accounts, savingsItems, forecasts, goal, globalRecurrences, monthsState, session?.user?.id]);

  const value = React.useMemo(() => ({
    categories, setCategories, transactions, setTransactions, accounts: accountsWithBalances, savingsItems, forecasts, 
    setForecasts: updateMonthForecast, monthsState, setMonthsState,
    globalRecurrences, setGlobalRecurrences, addTransaction, addTransactions, deleteTransaction, updateTransaction,
    addAccount, updateAccount, addSaving, updateSaving, deleteSaving,
    deleteAccount, goal, setGoal, loading, usingSupabase, session, user: session?.user,
    saveGlobalConfig, syncStatus, selectedPeriod, setSelectedPeriod,
    fetchingPrevisions, fetchPrevisions, updatePrevision
  }), [
    categories, transactions, accountsWithBalances, savingsItems, forecasts, updateMonthForecast, monthsState, 
    globalRecurrences, addTransaction, addTransactions, deleteTransaction, updateTransaction,
    addAccount, updateAccount, addSaving, updateSaving, deleteSaving,
    deleteAccount, goal, setGoal, loading, usingSupabase, session, saveGlobalConfig, syncStatus, selectedPeriod, setSelectedPeriod,
    fetchingPrevisions, fetchPrevisions, updatePrevision
  ]);

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
