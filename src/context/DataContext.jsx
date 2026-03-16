import React, { createContext, useContext, useState, useEffect } from 'react';
import { budgetCategories as initialCategories, transactions as initialTransactions, accounts as initialAccounts, forecasts as initialForecasts, savings as initialSavings } from '../data/mockData';
import { supabase } from '../supabase';

const DataContext = createContext();

export const useData = () => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

export const DataProvider = ({ children }) => {
  // --- Local Fallback Logic ---
  const getLocal = (key, initial) => {
    try {
      const saved = localStorage.getItem(key);
      return saved ? JSON.parse(saved) : initial;
    } catch {
      return initial;
    }
  };

  const [categories, setCategories] = useState(() => getLocal('money_categories', initialCategories));
  const [transactions, setTransactions] = useState(() => getLocal('money_transactions', initialTransactions));
  const [accounts, setAccounts] = useState(() => getLocal('money_accounts', initialAccounts));
  const [savingsItems, setSavingsItems] = useState(() => getLocal('money_savings', initialSavings));
  const [forecasts, setForecasts] = useState(() => getLocal('money_forecasts', initialForecasts));
  const [goal, setGoal] = useState(() => getLocal('money_goal', {
    name: 'Objectif Vacances',
    targetAmount: 500,
    manualAmount: 315,
    deadline: '',
    icon: '🏖️',
    color: 'green',
    isManual: true
  }));
  const [globalRecurrences, setGlobalRecurrences] = useState(() => getLocal('money_global_recurrences', { revenus: [], fixes: [], variables: [] }));
  
  const [loading, setLoading] = useState(true);
  const [usingSupabase, setUsingSupabase] = useState(false);

  // --- Supabase Data Sync ---

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [
        { data: cats, error: errCats },
        { data: txs, error: errTxs },
        { data: accs, error: errAccs },
        { data: svs, error: errSvs },
        { data: fcs, error: errFcs },
        { data: gl, error: errGl },
        { data: state, error: errState }
      ] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('accounts').select('*'),
        supabase.from('savings').select('*'),
        supabase.from('forecasts').select('*').order('id', { ascending: true }),
        supabase.from('goal').select('*').limit(1).single(),
        supabase.from('app_state').select('*').eq('key', 'globalRecurrences').single()
      ]);

      // If we got significant errors (like 404 tables), we skip Supabase
      if (errCats || errTxs || errAccs) {
        console.warn('Supabase tables missing or connection error. Using LocalStorage fallback.', { errCats, errTxs, errAccs });
        setUsingSupabase(false);
        return;
      }

      setUsingSupabase(true);

      // If Supabase is empty, check for LocalStorage migration
      if (!cats?.length && !txs?.length && !accs?.length) {
        await migrateFromLocal();
        return;
      }

      if (cats) setCategories(cats);
      if (txs) {
        // Handle grouping if needed, but for now app expects flat? 
        // Wait, app logic expects transactions to be array of date-groups.
        // Let's regroup if they are flat in Supabase.
        const grouped = [];
        txs.forEach(tx => {
           const label = tx.dateLabel || "Inconnu";
           let group = grouped.find(g => g.date === label);
           if (!group) {
             group = { id: Date.now() + Math.random(), date: label, items: [] };
             grouped.push(group);
           }
           group.items.push(tx);
        });
        setTransactions(grouped);
      }
      
      if (accs) setAccounts(accs);
      if (svs) setSavingsItems(svs);
      if (fcs) setForecasts(fcs);
      if (gl) setGoal(gl);
      if (state?.value) setGlobalRecurrences(state.value);

    } catch (error) {
      console.error('Critical failure in fetchAllData:', error);
    } finally {
      setLoading(false);
    }
  };

  const migrateFromLocal = async () => {
    console.log('Attempting migration from LocalStorage to Supabase...');
    
    // We already have local data in state because of our initializers
    const flatTxs = [];
    transactions.forEach(group => {
      group.items.forEach(tx => {
        flatTxs.push({ ...tx, dateLabel: group.date });
      });
    });

    try {
      const results = await Promise.all([
        categories.length && supabase.from('categories').insert(categories),
        flatTxs.length && supabase.from('transactions').insert(flatTxs),
        accounts.length && supabase.from('accounts').insert(accounts),
        savingsItems.length && supabase.from('savings').insert(savingsItems),
        forecasts.length && supabase.from('forecasts').insert(forecasts),
        supabase.from('goal').insert([goal]),
        supabase.from('app_state').upsert({ key: 'globalRecurrences', value: globalRecurrences })
      ]);
      
      const errors = results.filter(r => r && r.error);
      if (errors.length > 0) {
        console.error('Some migration steps failed, likely missing tables:', errors);
      } else {
        console.log('Migration successful.');
      }
      
    } catch (error) {
      console.error('Migration crashed:', error);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- Persistence Hooks ---
  useEffect(() => {
    if (!loading) {
      localStorage.setItem('money_categories', JSON.stringify(categories));
      if (usingSupabase) {
        // In a real app we'd do precise updates
      }
    }
  }, [categories, loading]);

  useEffect(() => {
    if (!loading) {
      localStorage.setItem('money_transactions', JSON.stringify(transactions));
    }
  }, [transactions, loading]);

  useEffect(() => {
    if (!loading) localStorage.setItem('money_accounts', JSON.stringify(accounts));
  }, [accounts, loading]);

  useEffect(() => {
    if (!loading) localStorage.setItem('money_savings', JSON.stringify(savingsItems));
  }, [savingsItems, loading]);

  useEffect(() => {
    if (!loading) localStorage.setItem('money_forecasts', JSON.stringify(forecasts));
  }, [forecasts, loading]);

  useEffect(() => {
    if (!loading) localStorage.setItem('money_goal', JSON.stringify(goal));
  }, [goal, loading]);

  useEffect(() => {
    if (!loading) localStorage.setItem('money_global_recurrences', JSON.stringify(globalRecurrences));
  }, [globalRecurrences, loading]);

  // Actions
  const addTransaction = (tx) => {
    setTransactions(prev => {
      let updated = [...prev];
      const dateLabel = tx.dateLabel || "Aujourd'hui";
      const existingGroupIndex = updated.findIndex(g => g.date === dateLabel);
      
      if (existingGroupIndex > -1) {
        updated[existingGroupIndex] = {
          ...updated[existingGroupIndex],
          items: [tx, ...updated[existingGroupIndex].items]
        };
      } else {
        updated.push({
          id: Date.now(),
          date: dateLabel,
          dateOrder: -1,
          items: [tx]
        });
        updated.sort((a, b) => a.dateOrder - b.dateOrder);
      }
      
      if (usingSupabase) {
        supabase.from('transactions').insert([{ ...tx, dateLabel }]).then();
      }
      
      return updated;
    });
  };

  const deleteAccount = (id) => {
    console.log('DataContext: Deleting account with ID:', id);
    setAccounts(prev => {
      const filtered = prev.filter(acc => String(acc.id) !== String(id));
      console.log(`DataContext: Account deletion. Count before: ${prev.length}, after: ${filtered.length}`);
      return filtered;
    });
    if (usingSupabase) {
      supabase.from('accounts').delete().eq('id', id).then();
    }
  };

  const deleteSaving = (id) => {
    console.log('DataContext: Deleting saving with ID:', id);
    setSavingsItems(prev => {
      const filtered = prev.filter(s => String(s.id) !== String(id));
      console.log(`DataContext: Saving deletion. Count before: ${prev.length}, after: ${filtered.length}`);
      return filtered;
    });
    if (usingSupabase) {
      supabase.from('savings').delete().eq('id', id).then();
    }
  };

  const addAccount = (acc) => {
    setAccounts(prev => {
      const updated = [...prev, { ...acc, id: acc.id || Date.now() }];
      if (usingSupabase) {
        supabase.from('accounts').insert([updated[updated.length - 1]]).then();
      }
      return updated;
    });
  };

  const addSaving = (s) => {
    setSavingsItems(prev => {
      const updated = [...prev, { ...s, id: s.id || Date.now() }];
      if (usingSupabase) {
        supabase.from('savings').insert([updated[updated.length - 1]]).then();
      }
      return updated;
    });
  };

  const updateAccount = (acc) => {
    setAccounts(prev => {
      const updated = prev.map(a => String(a.id) === String(acc.id) ? acc : a);
      if (usingSupabase) {
        supabase.from('accounts').update(acc).eq('id', acc.id).then();
      }
      return updated;
    });
  };

  const updateSaving = (s) => {
    setSavingsItems(prev => {
      const updated = prev.map(item => String(item.id) === String(s.id) ? s : item);
      if (usingSupabase) {
        supabase.from('savings').update(s).eq('id', s.id).then();
      }
      return updated;
    });
  };

  const updateGlobalRecurrences = (newRecs) => {
    const oldRecsFlat = [...globalRecurrences.revenus, ...globalRecurrences.fixes, ...globalRecurrences.variables];
    const newRecsFlat = [...(newRecs.revenus || []), ...(newRecs.fixes || []), ...(newRecs.variables || [])];

    newRecsFlat.forEach(newR => {
      const oldR = oldRecsFlat.find(r => r.id === newR.id);
      if (oldR && oldR.label !== newR.label) {
        setTransactions(prev => prev.map(group => ({
          ...group,
          items: group.items.map(tx => tx.category === oldR.label ? { ...tx, category: newR.label } : tx)
        })));
      }
    });

    oldRecsFlat.forEach(oldR => {
      const exists = newRecsFlat.some(r => r.id === oldR.id);
      if (!exists) {
        setTransactions(prev => prev.map(group => ({
          ...group,
          items: group.items.map(tx => tx.category === oldR.label ? { ...tx, category: 'Divers' } : tx)
        })));
      }
    });

    setGlobalRecurrences(newRecs);
    if (usingSupabase) {
      supabase.from('app_state').upsert({ key: 'globalRecurrences', value: newRecs }).then();
    }
    
    const newCategories = [
      ...(newRecs.fixes || []).map(r => ({
        id: r.id,
        name: r.label,
        icon: r.icon || 'lock',
        spent: 0,
        limit: parseFloat(r.amount) || 0,
        color: 'var(--color-primary)',
        bg: 'var(--color-primary-bg)',
        type: 'fixe'
      })),
      ...(newRecs.variables || []).map(r => ({
        id: r.id,
        name: r.label,
        icon: r.icon || 'shopping_bag',
        spent: 0,
        limit: parseFloat(r.amount) || 0,
        color: 'var(--color-primary)',
        bg: 'var(--color-primary-bg)',
        type: 'variable'
      }))
    ];
    setCategories(newCategories);
  };

  const value = {
    categories,
    setCategories,
    transactions,
    setTransactions,
    accounts,
    setAccounts,
    savingsItems,
    setSavingsItems,
    forecasts,
    setForecasts,
    globalRecurrences,
    setGlobalRecurrences: updateGlobalRecurrences,
    addTransaction,
    deleteAccount,
    deleteSaving,
    addAccount,
    addSaving,
    updateAccount,
    updateSaving,
    goal,
    setGoal,
    loading,
    usingSupabase
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
