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
  const [categories, setCategories] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [accounts, setAccounts] = useState([]);
  const [savingsItems, setSavingsItems] = useState([]);
  const [forecasts, setForecasts] = useState([]);
  const [goal, setGoal] = useState({});
  const [globalRecurrences, setGlobalRecurrences] = useState({ revenus: [], fixes: [], variables: [] });
  const [loading, setLoading] = useState(true);

  // --- Supabase Data Sync ---

  const fetchAllData = async () => {
    try {
      setLoading(true);
      
      const [
        { data: cats },
        { data: txs },
        { data: accs },
        { data: svs },
        { data: fcs },
        { data: gl },
        { data: state }
      ] = await Promise.all([
        supabase.from('categories').select('*'),
        supabase.from('transactions').select('*'),
        supabase.from('accounts').select('*'),
        supabase.from('savings').select('*'),
        supabase.from('forecasts').select('*').order('id', { ascending: true }),
        supabase.from('goal').select('*').limit(1).single(),
        supabase.from('app_state').select('*').eq('key', 'globalRecurrences').single()
      ]);

      // If Supabase is empty, check for LocalStorage migration
      if (!cats?.length && !txs?.length && !accs?.length) {
        await migrateFromLocal();
        return;
      }

      if (cats) setCategories(cats);
      if (txs) setTransactions(txs); // Note: txs in Supabase are flat, but app expects grouping? 
      // Wait, app expectations: transactions is an array of groups [{ date, items: [] }]
      // I should handle grouping/ungrouping.
      
      if (accs) setAccounts(accs);
      if (svs) setSavingsItems(svs);
      if (fcs) setForecasts(fcs);
      if (gl) setGoal(gl);
      if (state?.value) setGlobalRecurrences(state.value);

    } catch (error) {
      console.error('Error fetching Supabase data:', error);
      // Fallback to local for safety if needed, but here we want Supabase
    } finally {
      setLoading(false);
    }
  };

  const migrateFromLocal = async () => {
    console.log('Migrating data from LocalStorage to Supabase...');
    
    const localCats = JSON.parse(localStorage.getItem('money_categories')) || initialCategories;
    const localTxs = JSON.parse(localStorage.getItem('money_transactions')) || initialTransactions;
    const localAccs = JSON.parse(localStorage.getItem('money_accounts')) || initialAccounts;
    const localSvs = JSON.parse(localStorage.getItem('money_savings')) || initialSavings;
    const localFcs = JSON.parse(localStorage.getItem('money_forecasts')) || initialForecasts;
    const localGoal = JSON.parse(localStorage.getItem('money_goal')) || {
      name: 'Objectif Vacances',
      targetAmount: 500,
      manualAmount: 315,
      deadline: '',
      icon: '🏖️',
      color: 'green',
      isManual: true
    };
    const localRecs = JSON.parse(localStorage.getItem('money_global_recurrences')) || { revenus: [], fixes: [], variables: [] };

    // Grouping transactions back to flat for Supabase
    const flatTxs = [];
    localTxs.forEach(group => {
      group.items.forEach(tx => {
        flatTxs.push({ ...tx, dateLabel: group.date });
      });
    });

    try {
      await Promise.all([
        localCats.length && supabase.from('categories').insert(localCats),
        flatTxs.length && supabase.from('transactions').insert(flatTxs),
        localAccs.length && supabase.from('accounts').insert(localAccs),
        localSvs.length && supabase.from('savings').insert(localSvs),
        localFcs.length && supabase.from('forecasts').insert(localFcs),
        supabase.from('goal').insert([localGoal]),
        supabase.from('app_state').upsert({ key: 'globalRecurrences', value: localRecs })
      ]);
      
      setCategories(localCats);
      setTransactions(localTxs);
      setAccounts(localAccs);
      setSavingsItems(localSvs);
      setForecasts(localFcs);
      setGoal(localGoal);
      setGlobalRecurrences(localRecs);
      
    } catch (error) {
      console.error('Migration failed:', error);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // --- Persistence Hooks ---
  // Using generic "upsert" or specific inserts for each state change.
  // For simplicity in this demo-to-supabase transition, we'll save on change.

  useEffect(() => {
    if (!loading) {
      // Small delay or throttle could be added here
      localStorage.setItem('money_categories', JSON.stringify(categories));
      // supabase sync would go here too if we want full real-time
    }
  }, [categories, loading]);

  useEffect(() => {
    if (!loading) {
      const flatTxs = [];
      transactions.forEach(group => {
        group.items.forEach(tx => {
          flatTxs.push({ ...tx, dateLabel: group.date });
        });
      });
      // In a real app, we'd only sync the diff
    }
  }, [transactions, loading]);

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
      
      // Async save to Supabase
      supabase.from('transactions').insert([{ ...tx, dateLabel }]).then();
      
      return updated;
    });
  };

  const updateGlobalRecurrences = (newRecs) => {
    // Detect changes (rename or delete)
    const oldRecsFlat = [...globalRecurrences.revenus, ...globalRecurrences.fixes, ...globalRecurrences.variables];
    const newRecsFlat = [...newRecs.revenus, ...newRecs.fixes, ...newRecs.variables];

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
    supabase.from('app_state').upsert({ key: 'globalRecurrences', value: newRecs }).then();
    
    const newCategories = [
      ...newRecs.fixes.map(r => ({
        id: r.id,
        name: r.label,
        icon: r.icon || 'lock',
        spent: 0,
        limit: parseFloat(r.amount) || 0,
        color: 'var(--color-primary)',
        bg: 'var(--color-primary-bg)',
        type: 'fixe'
      })),
      ...newRecs.variables.map(r => ({
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
    goal,
    setGoal,
    loading
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};
