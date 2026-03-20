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
  const [transactions, setTransactions] = useState(() => {
    const local = getLocal('money_transactions', initialTransactions);
    
    // Migration: Handle case where local might be grouped or invalid
    if (Array.isArray(local) && local.length > 0 && local[0] && typeof local[0] === 'object' && 'items' in local[0]) {
      return local.reduce((acc, group) => {
        if (group && Array.isArray(group.items)) {
          return [...acc, ...group.items];
        }
        return acc;
      }, []);
    }
    return Array.isArray(local) ? local : [];
  });

  // Reactive grouping and sorting logic
  const groupedTransactions = React.useMemo(() => {
    if (!Array.isArray(transactions)) return [];
    
    const sorted = [...transactions].sort((a, b) => {
      const da = a?.date ? new Date(a.date) : new Date(0);
      const db = b?.date ? new Date(b.date) : new Date(0);
      return db - da;
    });
    
    const grouped = [];
    const today = new Date().toISOString().split('T')[0];
    const yesterdayOpen = new Date();
    yesterdayOpen.setDate(yesterdayOpen.getDate() - 1);
    const yesterday = yesterdayOpen.toISOString().split('T')[0];

    sorted.forEach(tx => {
      if (!tx) return;
      const dateKey = tx.date || today;
      let g = grouped.find(gr => gr.date === dateKey);
      if (!g) { 
        let label = dateKey;
        if (dateKey === today) label = "Aujourd'hui";
        else if (dateKey === yesterday) label = "Hier";
        else {
          const d = new Date(dateKey);
          label = isNaN(d.getTime()) ? dateKey : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
        }
        g = { 
          id: `g_${dateKey}`, 
          date: dateKey, 
          dateLabel: label, 
          items: [] 
        }; 
        grouped.push(g); 
      }
      g.items.push(tx);
    });
    return grouped;
  }, [transactions]);
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
  const [isRolloverEnabled, setIsRolloverEnabled] = useState(() => getLocal('money_rollover_enabled', true));
  const [selectedPeriod, setSelectedPeriod] = useState(() => {
    const userId = getLocal('money_session', null)?.user?.id;
    const slug = new Date().toISOString().substring(0, 7);
    return userId ? `${userId}_${slug}` : slug;
  });
  
  // Dynamic balance calculation
  const accountsWithBalances = React.useMemo(() => {
    // 1. Transactions are now already flat in the state
    const flatTxs = Array.isArray(transactions) ? transactions : [];
    
    // 2. Map and compute balance for each account
    return (Array.isArray(accounts) ? accounts : []).map(acc => {
      const startDate = acc?.initialBalanceDate || '1970-01-01';
      
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
  const isSyncingFromServerRef = useRef(false);
  const lastLocalWriteRef = useRef(0);

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
        setSyncStatus('idle'); // Clear any previous error indicator during transition
        
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
          setSyncStatus('idle');
        }
      }
    });
    return () => subscription.unsubscribe();
  }, []);

  const fetchAllData = async (force = false) => {
    if ((hasFetchedRef.current && !force) || !session?.user) {
      setLoading(false); // Safety: ensure loading is false if we return early
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
      
      isSyncingFromServerRef.current = true; // Guard starts
      
      if (safeCats.length || safeTxs.length || safeAccs.length || safeSvs.length) {
        setUsingSupabase(true);
        // Always sync categories from Supabase — respects user deletions
        // If user deleted all categories in Supabase, clear local state too
        if (JSON.stringify(categories) !== JSON.stringify(safeCats)) setCategories(safeCats);
        if (safeAccs.length && JSON.stringify(accounts) !== JSON.stringify(safeAccs)) setAccounts(safeAccs);
        if (safeSvs.length && JSON.stringify(savingsItems) !== JSON.stringify(safeSvs)) setSavingsItems(safeSvs);
        if (gl && JSON.stringify(goal) !== JSON.stringify(gl)) setGoal(gl);
        
        if (safeTxs.length) {
          // Sort by actual date descending
          const sorted = [...safeTxs].sort((a, b) => new Date(b.date) - new Date(a.date));
          
          if (JSON.stringify(transactions) !== JSON.stringify(sorted)) setTransactions(sorted);
        }

        if (safeFcs.length) {
          const userId = session?.user?.id;
          const year = new Date().getFullYear();
          
          const monthOrder = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
          const getIdx = (item) => {
            if (!item || !item.month) return -1;
            const mName = String(item.month).toLowerCase().split(' ')[0];
            return monthOrder.indexOf(mName);
          };

          const sortedFcs = [...safeFcs].sort((a, b) => getIdx(a) - getIdx(b));

          // Deduplicate: keep only one forecast per month position (0–11)
          const deduplicatedFcs = [];
          const seenMonths = new Set();
          for (const f of sortedFcs) {
            const idx = getIdx(f);
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
          
          const newForecasts = fullFcs.map((f, idx) => {
            const monthNum = String(idx + 1).padStart(2, '0');
            const standardSlug = `${year}-${monthNum}`;
            const monthName = (f.month && typeof f.month === 'string') ? f.month.replace(/\d{4}/, year) : f.month;
            const shortMonth = monthName ? monthName.substring(0, 3).toUpperCase() : '';
            return { 
              ...f, 
              id: userId ? `${userId}_${standardSlug}` : standardSlug,
              month: monthName,
              shortMonth
            };
          });
          if (JSON.stringify(forecasts) !== JSON.stringify(newForecasts)) setForecasts(newForecasts);
        }

        if (safeSt.length) {
          const gr = safeSt.find(s => s.key === 'globalRecurrences');
          const fd = safeSt.find(s => s.key === 'forecasts_detail');
          if (gr?.value && JSON.stringify(globalRecurrences) !== JSON.stringify(gr.value)) setGlobalRecurrences(gr.value);
          if (fd?.value && JSON.stringify(monthsState) !== JSON.stringify(fd.value)) setMonthsState(fd.value);
        }
      } else {
        // Truly empty on Supabase - only then check local migration
        await migrateFromLocal();
      }
    } catch (e) {
      console.error('Fetch error:', e);
      setSyncStatus('error');
    } finally {
      setTimeout(() => { isSyncingFromServerRef.current = false; }, 500); // Guard ends
      setLoading(false);
    }
  };

  const migrateFromLocal = async () => {
    const flatTxs = transactions.map(tx => ({ ...tx, user_id: session?.user?.id }));
    // Filter categories: don't migrate if it's just the default mock set and nothing else is being migrated
    const isDefaultCategories = categories.length === 6 && categories.every(c => typeof c.id === 'number' && c.id >= 1 && c.id <= 6);
    const hasOtherData = flatTxs.length > 0 || accounts.length > 0 || savingsItems.length > 0;
    
    const categoriesToMigrate = (isDefaultCategories && !hasOtherData) ? [] : categories;

    const shouldMigrateGoal = goal && goal.id !== 'default-goal';

    try {
      await Promise.all([
        categoriesToMigrate.length > 0 && supabase.from('categories').upsert(categoriesToMigrate.map(c => ({ ...c, user_id: session?.user?.id }))),
        flatTxs.length > 0 && supabase.from('transactions').upsert(flatTxs),
        accounts.length > 0 && supabase.from('accounts').upsert(accounts.map(a => ({ ...a, user_id: session?.user?.id }))),
        savingsItems.length > 0 && supabase.from('savings').upsert(savingsItems.map(s => ({ ...s, user_id: session?.user?.id }))),
        forecasts.length > 0 && supabase.from('forecasts').upsert(forecasts.map(f => ({ ...f, user_id: session?.user?.id }))),
        shouldMigrateGoal && supabase.from('goal').upsert([{ ...goal, user_id: session?.user?.id }]),
        supabase.from('app_state').upsert([
          { key: 'globalRecurrences', value: globalRecurrences, user_id: session?.user?.id },
          { key: 'forecasts_detail', value: monthsState, user_id: session?.user?.id }
        ])
      ].filter(Boolean));
      setUsingSupabase(true);
    } catch (e) { console.error('Migration failed:', e); }
  };

  const refreshData = React.useCallback(() => {
    hasFetchedRef.current = false;
    fetchAllData(true);
  }, [session]);

  // Supabase Realtime Listener
  useEffect(() => {
    if (!session?.user?.id || !usingSupabase) return;

    // Throttle/Debounce the sync to avoid multiple rapid refreshes
    let syncTimeout = null;
    const triggerSync = () => {
      if (syncTimeout) clearTimeout(syncTimeout);
      syncTimeout = setTimeout(() => {
        refreshData();
      }, 1000); // 1s debounce
    };

    const channel = supabase
      .channel('app-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public' },
        (payload) => {
          // Guard: Ignore changes we just made ourselves (temporal echo cancellation)
          if (Date.now() - lastLocalWriteRef.current < 4000) {
            console.log('Ignoring self-triggered realtime change');
            return;
          }

          // Only sync if the change belongs to the current user
          if (!payload.new || payload.new.user_id === session.user.id || !payload.new.user_id) {
            triggerSync();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      if (syncTimeout) clearTimeout(syncTimeout);
    };
  }, [session?.user?.id, usingSupabase, refreshData]);

  useEffect(() => { if (session) fetchAllData(); }, [session]);

  const addTransactions = React.useCallback((txs) => {
    const localIds = txs.map(tx => tx.id);
    setTransactions(prev => [...txs, ...prev]);
    if (usingSupabase && session?.user?.id) {
      lastLocalWriteRef.current = Date.now();
      const inserts = txs.map(tx => ({ 
        ...tx, 
        dateLabel: tx.dateLabel || "Aujourd'hui", 
        user_id: session?.user?.id 
      }));
      supabase
        .from('transactions')
        .insert(inserts)
        .select()
        .then(({ data, error }) => { 
          if (error) {
            console.error('Supabase Insert Error:', error);
          } else if (data && data.length > 0) {
            // Synchronize Supabase IDs back to local state
            setTransactions(prev => prev.map(item => {
              const idx = localIds.indexOf(item.id);
              if (idx !== -1 && data[idx]) {
                return { ...item, ...data[idx] };
              }
              return item;
            }));
          }
        });
    }
  }, [usingSupabase, session]);

  const addTransaction = React.useCallback((tx) => {
    addTransactions([tx]);
  }, [addTransactions]);

  const deleteTransaction = React.useCallback((id) => {
    setTransactions(prev => prev.filter(item => String(item.id) !== String(id)));
    if (usingSupabase) {
      lastLocalWriteRef.current = Date.now();
      supabase.from('transactions').delete().eq('id', id).then(({ error }) => { if (error) console.error(error); });
    }
  }, [usingSupabase]);

  const updateTransaction = React.useCallback((tx) => {
    setTransactions(prev => prev.map(item => String(item.id) === String(tx.id) ? { ...item, ...tx, user_id: session?.user?.id } : item));
    if (usingSupabase && session?.user?.id) {
      lastLocalWriteRef.current = Date.now();
      supabase.from('transactions').upsert([{ ...tx, user_id: session?.user?.id }]).then(({ error }) => { if (error) console.error(error); });
    }
  }, [usingSupabase, session]);

  const deleteAccount = React.useCallback((id) => {
    setAccounts(prev => prev.filter(a => String(a.id) !== String(id)));
    if (usingSupabase) {
      lastLocalWriteRef.current = Date.now();
      supabase.from('accounts').delete().eq('id', String(id)).then(({ error }) => { if (error) console.error(error); });
    }
  }, [usingSupabase]);

  const updateMonthForecast = React.useCallback((id, income, expenses) => {
    setForecasts(prev => prev.map(f => String(f.id) === String(id) ? { ...f, income, expenses } : f));
    if (usingSupabase) {
      lastLocalWriteRef.current = Date.now();
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
    if (usingSupabase) {
      lastLocalWriteRef.current = Date.now();
      supabase.from('accounts').insert([newAcc]).then(({ error }) => { if (error) console.error(error); });
    }
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

    if (usingSupabase) {
      lastLocalWriteRef.current = Date.now();
      supabase.from('accounts').upsert([{ ...acc, user_id: session?.user?.id }]).then(({ error }) => { if (error) console.error(error); });
    }
  }, [usingSupabase, session?.user?.id, accounts, forecasts]);

  const addSaving = React.useCallback((sav) => {
    const userId = session?.user?.id;
    const newSav = { 
      ...sav, 
      id: `sav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`, 
      user_id: userId 
    };
    setSavingsItems(prev => [...prev, newSav]);
    if (usingSupabase && userId) {
      lastLocalWriteRef.current = Date.now();
      setSyncStatus('syncing');
      supabase.from('savings')
        .insert([{ 
          id: newSav.id, 
          name: newSav.name, 
          bank: newSav.bank, 
          balance: newSav.balance, 
          domain: newSav.domain, 
          user_id: userId 
        }])
        .then(({ error }) => { 
          if (error) {
            console.error('Savings Insert Error:', error);
            setSyncStatus('error');
          } else {
            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 2000);
          }
        });
    }
  }, [usingSupabase, session?.user?.id]);

  const updateSaving = React.useCallback((sav) => {
    const userId = session?.user?.id;
    setSavingsItems(prev => prev.map(s => String(s.id) === String(sav.id) ? { ...sav, user_id: userId } : s));
    if (usingSupabase && userId) {
      lastLocalWriteRef.current = Date.now();
      setSyncStatus('syncing');
      supabase.from('savings')
        .upsert([{ 
          id: sav.id, 
          name: sav.name, 
          bank: sav.bank, 
          balance: sav.balance, 
          domain: sav.domain, 
          user_id: userId 
        }])
        .then(({ error }) => { 
          if (error) {
            console.error('Savings Update Error:', error);
            setSyncStatus('error');
          } else {
            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 2000);
          }
        });
    }
  }, [usingSupabase, session?.user?.id]);

  const deleteSaving = React.useCallback((id) => {
    setSavingsItems(prev => prev.filter(s => String(s.id) !== String(id)));
    if (usingSupabase && session?.user?.id) {
      lastLocalWriteRef.current = Date.now();
      setSyncStatus('syncing');
      supabase.from('savings')
        .delete()
        .eq('id', String(id))
        .then(({ error }) => { 
          if (error) {
            console.error('Savings Delete Error:', error);
            setSyncStatus('error');
          } else {
            setSyncStatus('success');
            setTimeout(() => setSyncStatus('idle'), 2000);
          }
        });
    }
  }, [usingSupabase, session?.user?.id]);

  const saveGlobalConfig = React.useCallback(async (specificMonthsState) => {
    const userId = session?.user?.id;
    // CRITICAL GUARD: Never sync if we hasn't finished pulling initial data for this user.
    // This prevents "reset-to-defaults" from wiping remote data or causing RLS errors on switch.
    if (!usingSupabase || !userId || !hasFetchedRef.current) return;

    const targetMonthsState = specificMonthsState || monthsState;
    if (Object.keys(targetMonthsState).length === 0 && categories.length === 0 && forecasts.length === 0) return;

    const today = new Date().toISOString().split('T')[0];
    setSyncStatus('syncing');
    lastLocalWriteRef.current = Date.now(); // Mark this push to avoid echo
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

      // Calculate totals for each forecast based on the detail state
      const forecastsToSync = forecasts.map(f => {
        const data = targetMonthsState[f.id] || { revenus: [], fixes: [], variables: [] };
        const income = (data.revenus || []).reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
        const expenseItems = [...(data.fixes || []), ...(data.variables || [])];
        const expenses = expenseItems.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
        
        // Return only the columns that exist in Supabase to avoid 400 errors
        return { 
          id: crypto.randomUUID(),
          month: f.month, 
          income, 
          expenses, 
          user_id: userId 
        };
      });

      // Sync categories: strictly derived from unique labels in globalRecurrences
      // This enforces "Previsions as single source of truth" and cleans up old data
      const labels = new Set();
      Object.values(globalRecurrences).forEach(sect => {
        sect.forEach(r => { if (r.label) labels.add(r.label); });
      });

      const categoriesToSync = Array.from(labels).map(l => {
        const detId = `cat_${l.toLowerCase().trim().replace(/[^a-z0-0]/g, '_')}`;
        // Try to find existing category info (icon, color) else use defaults
        const existing = categories.find(c => c.name === l || c.id === detId);
        return {
          id: detId,
          name: l,
          icon: existing?.icon || 'category',
          color: existing?.color || 'var(--color-primary)',
          user_id: userId
        };
      });

      // Delete all existing categories for this user first, then re-insert clean
      const syncCategories = async () => {
        if (categoriesToSync.length === 0) return { error: null };
        const { error: delError } = await supabase
          .from('categories')
          .delete()
          .eq('user_id', userId);
        if (delError) return { error: delError };
        return supabase.from('categories').insert(categoriesToSync.map(c => ({
          id: c.id,
          name: c.name,
          icon: c.icon,
          color: c.color,
          user_id: userId
        })));
      };

      const syncForecasts = async () => {
        if (forecastsToSync.length === 0) return { error: null };
        const { error: delError } = await supabase
          .from('forecasts')
          .delete()
          .eq('user_id', userId);
        if (delError) return { error: delError };
        return supabase.from('forecasts').insert(forecastsToSync);
      };

      const promises = [
        supabase.from('app_state').upsert([
          { key: 'globalRecurrences', value: globalRecurrences, user_id: userId },
          { key: 'forecasts_detail', value: targetMonthsState, user_id: userId }
        ]),
        syncCategories(),
        syncForecasts(),
        (async () => {
          // New: Also sync the 'previsions' table for balances with CORRECT rollover logic
          let runningBalance = 0;
          const previsionsToSync = forecasts.map((f, index) => {
            const data = targetMonthsState[f.id] || { manualReport: 0, revenus: [], fixes: [], variables: [] };
            const revLines = data.revenus || [];
            const fixLines = data.fixes || [];
            const varLines = data.variables || [];
            
            const income = revLines.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
            const expenses = [...fixLines, ...varLines].reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
            
            const hasManualOverride = data.manualReport !== undefined && data.manualReport !== '' && data.manualReport !== 0;
            const autoReport = index === 0 ? 0 : runningBalance;
            const reportBalance = isRolloverEnabled 
              ? (hasManualOverride ? parseFloat(data.manualReport) : autoReport)
              : (parseFloat(data.manualReport) || 0);
            
            const final = income - expenses + (reportBalance || 0);
            runningBalance = final; // Carry over for next month

            const monthSlug = String(f.id || '').split('_').pop();

            return {
              user_id: userId,
              mois: monthSlug,
              annee: 2026,
              montant_previsionnel: final,
              statut: final >= 0 ? 'Excedent' : 'Déficit'
            };
          });
          const { error: prevError } = await supabase.from('previsions').upsert(previsionsToSync, { onConflict: 'user_id,mois,annee' });
          if (prevError) {
            console.error('❌ Error syncing previsions table:', prevError);
            return { error: prevError };
          }
          return { error: null };
        })(),
        goal && goal.id !== 'default-goal' && supabase.from('goal').upsert([{ 
          id: goal.id, 
          name: goal.name, 
          targetAmount: goal.targetAmount, 
          manualAmount: goal.manualAmount, 
          deadline: goal.deadline, 
          icon: goal.icon, 
          color: goal.color, 
          isManual: goal.isManual, 
          user_id: userId 
        }]),
        supabase.from('accounts').upsert(accountsToUpsert.map(a => ({
          id: a.id,
          name: a.name,
          bank: a.bank,
          balance: a.balance,
          initialBalance: a.initialBalance,
          initialBalanceDate: a.initialBalanceDate,
          type: a.type,
          color: a.color,
          icon: a.icon,
          domain: a.domain,
          accountNumber: a.accountNumber,
          user_id: userId
        })))
      ].filter(Boolean);

      const results = await Promise.all(promises);
      const errors = results.filter(r => r?.error).map(r => r.error);
      
      if (errors.length > 0) throw errors[0];
      
      // Perform local state update ONLY if count or content changed, or if it was empty
      if (accounts.length !== accountsToUpsert.length || accounts[0]?.initialBalance !== startBalance) {
        setAccounts(accountsToUpsert);
      }

      if (JSON.stringify(categories) !== JSON.stringify(categoriesToSync)) {
        setCategories(categoriesToSync);
      }
      
      setSyncStatus('success');
      setTimeout(() => setSyncStatus('idle'), 3000);
      console.log('Global configuration synced');
    } catch (err) {
      console.error('Auto-sync error:', err);
      setSyncStatus('error');
    }
  }, [usingSupabase, globalRecurrences, monthsState, categories, forecasts, accounts, session, isRolloverEnabled]);

  const fetchPrevisions = React.useCallback(async () => {
    if (!session?.user?.id) return;
    setFetchingPrevisions(true);
    try {
      const currentYear = new Date().getFullYear();
      const { data, error } = await supabase
        .from('previsions')
        .select('*')
        .eq('annee', currentYear);
      
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

  const updatePrevision = React.useCallback(async (monthId, montant) => {
    if (!session?.user?.id) return;
    const monthSlug = String(monthId).split('_').pop(); // Get '2026-03' from 'uuid_2026-03'
    const currentYear = new Date().getFullYear();
    lastLocalWriteRef.current = Date.now(); // Mark local write
    try {
      const { error } = await supabase
        .from('previsions')
        .upsert({
          user_id: session.user.id,
          mois: monthSlug,
          annee: currentYear,
          montant_previsionnel: parseFloat(montant) || 0,
          statut: (parseFloat(montant) || 0) >= 0 ? 'Excedent' : 'Déficit'
        }, { onConflict: 'user_id,mois,annee' });
      
      if (error) {
        console.error('Supabase Prevision Sync Error:', error);
        setSyncStatus('error');
      }
    } catch (err) {
      console.error('Internal Prevision updating error:', err);
      setSyncStatus('error');
    }
  }, [session?.user?.id]);

  // Automatic watcher for real-time save of categories, goal, and recurrences
  const isInitialMount = useRef(true);
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false;
      return;
    }

    // Always clear previous timeout first
    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    
    // Guard: Don't sync back if we just loaded this data FROM the server
    if (usingSupabase && session?.user?.id && !isSyncingFromServerRef.current) {
      syncTimeoutRef.current = setTimeout(() => {
        saveGlobalConfig();
      }, 10000); // 10s debounce to avoid too many partial syncs while typing
    }

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [categories, goal, globalRecurrences, monthsState, usingSupabase, session?.user?.id, saveGlobalConfig]);

  // Persist to local storage (Debounced)
  useEffect(() => {
    // Don't persist if we are currently loading or syncing from server
    if (loading || isSyncingFromServerRef.current) return;
    
    // User-specific prefix
    const userId = session?.user?.id || 'local';

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
    categories,
    transactions: groupedTransactions,
    accounts: accountsWithBalances,
    savingsItems,
    setCategories,
    setTransactions,
    setAccounts,
    setSavingsItems,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addAccount,
    updateAccount,
    deleteAccount,
    addSaving,
    updateSaving,
    deleteSaving,
    forecasts,
    setForecasts: updateMonthForecast,
    monthsState,
    setMonthsState,
    globalRecurrences,
    setGlobalRecurrences,
    saveGlobalConfig,
    loading,
    fetchingPrevisions,
    fetchPrevisions,
    updatePrevision,
    session,
    selectedPeriod,
    setSelectedPeriod,
    goal,
    setGoal,
    isRolloverEnabled,
    setIsRolloverEnabled,
    usingSupabase,
    syncStatus,
    user: session?.user,
    refreshData,
  }), [
    categories, transactions, accountsWithBalances, savingsItems, forecasts, updateMonthForecast, monthsState, 
    globalRecurrences, addTransaction, addTransactions, deleteTransaction, updateTransaction,
    addAccount, updateAccount, addSaving, updateSaving, deleteSaving,
    deleteAccount, goal, setGoal, loading, usingSupabase, session, saveGlobalConfig, syncStatus, selectedPeriod, setSelectedPeriod,
      fetchingPrevisions, fetchPrevisions, updatePrevision, isRolloverEnabled, setIsRolloverEnabled,
      refreshData,
      syncStatus
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
