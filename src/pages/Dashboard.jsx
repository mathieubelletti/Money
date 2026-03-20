import React, { useState, useEffect } from 'react';
import CompanyLogo from '../components/CompanyLogo';
import PageHeader from '../components/PageHeader';
import { patrimonyChart, insights } from '../data/mockData';
import { useData } from '../context/DataContext';

const Dashboard = () => {
  const { 
    accounts,
    setAccounts,
    savingsItems,
    setSavingsItems,
    transactions, 
    deleteAccount,
    deleteSaving,
    addAccount,
    addSaving,
    updateAccount,
    updateSaving,
    selectedPeriod,
    setSelectedPeriod,
    forecasts,
  } = useData();


  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [manageType, setManageType] = useState('accounts'); // 'accounts' or 'savings'
  const [editingItem, setEditingItem] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showInstallBtn, setShowInstallBtn] = useState(false);

  const [isFiltering, setIsFiltering] = useState(false);

  // Drag and drop state
  const dragSrcRef = React.useRef(null); // { section: 'accounts'|'savings', index: number }
  const [dragOverIdx, setDragOverIdx] = useState(null); // { section, index }

  const handleDragStart = React.useCallback((section, index) => {
    dragSrcRef.current = { section, index };
  }, []);

  const handleDragOver = React.useCallback((e, section, index) => {
    e.preventDefault();
    if (!dragSrcRef.current || dragSrcRef.current.section !== section) return;
    setDragOverIdx({ section, index });
  }, []);

  const handleDrop = React.useCallback((e, section, toIndex) => {
    e.preventDefault();
    if (!dragSrcRef.current || dragSrcRef.current.section !== section) return;
    const fromIndex = dragSrcRef.current.index;
    if (fromIndex === toIndex) { dragSrcRef.current = null; setDragOverIdx(null); return; }

    const reorder = (list) => {
      const copy = [...list];
      const [moved] = copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, moved);
      return copy;
    };

    if (section === 'accounts') setAccounts(reorder(accounts));
    else setSavingsItems(reorder(savingsItems));

    dragSrcRef.current = null;
    setDragOverIdx(null);
  }, [accounts, savingsItems, setAccounts, setSavingsItems]);

  const handleDragEnd = React.useCallback(() => {
    dragSrcRef.current = null;
    setDragOverIdx(null);
  }, []);

  const handlePeriodChange = (val) => {
    setIsFiltering(true);
    setSelectedPeriod(val);
    setTimeout(() => setIsFiltering(false), 300);
  };

  const historicalBalance = React.useMemo(() => {
    const monthSlug = selectedPeriod.split('_').pop(); 
    if (!monthSlug || !monthSlug.includes('-')) return 0;
    const [yearStr, monthStr] = monthSlug.split('-');
    const endOfSelectedMonth = new Date(yearStr, monthStr, 0).toISOString().split('T')[0];

    let total = (accounts || []).reduce((acc, curr) => acc + (parseFloat(curr?.initialBalance) || 0), 0);

    (transactions || []).forEach(group => {
      (group?.items || []).forEach(tx => {
        const txDate = tx.budget_month || tx.date;
        if (txDate <= endOfSelectedMonth) {
          total += parseFloat(tx.amount) || 0;
        }
      });
    });
    return total;
  }, [accounts, transactions, selectedPeriod]);

  // Calculate monthly change if possible, else 0
  const monthChange = 0; 
  
  // Calculate monthly totals from transactions safely, filtering for selected period
  const { monthlyRevenus, monthlyDepenses } = React.useMemo(() => {
    if (!selectedPeriod) return { monthlyRevenus: 0, monthlyDepenses: 0 };
    const monthSlug = selectedPeriod.split('_').pop();
    if (!monthSlug || !monthSlug.includes('-')) return { monthlyRevenus: 0, monthlyDepenses: 0 };
    const [yearStr, monthStr] = monthSlug.split('-');
    const pYear = parseInt(yearStr, 10);
    const pMonth = parseInt(monthStr, 10) - 1;

    let rev = 0;
    let dep = 0;

    (transactions || []).forEach(group => {
      (group?.items || []).forEach(tx => {
        let txMonth, txYear;
        if (tx.budget_month) {
          const mSlug = tx.budget_month.split('_').pop();
          const parts = mSlug.split('-');
          txYear = parseInt(parts[0], 10);
          txMonth = parseInt(parts[1], 10) - 1;
        } else {
          const txDate = new Date(tx.date);
          txYear = txDate.getFullYear();
          txMonth = txDate.getMonth();
        }

        if (txMonth === pMonth && txYear === pYear) {
          if (tx.amount > 0) rev += tx.amount;
          if (tx.amount < 0) dep += Math.abs(tx.amount);
        }
      });
    });

    return { monthlyRevenus: rev, monthlyDepenses: dep };
  }, [transactions, selectedPeriod]);

  useEffect(() => {
    const screenContainer = document.querySelector('.screen');
    const handleScroll = () => {
      if (screenContainer) {
        setShowScrollTop(screenContainer.scrollTop > 300);
      }
    };
    if (screenContainer) {
      screenContainer.addEventListener('scroll', handleScroll);
    }
    return () => screenContainer?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowInstallBtn(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };


  const scrollToTop = () => {
    const screenContainer = document.querySelector('.screen');
    if (screenContainer) {
      screenContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const [confirmingId, setConfirmingId] = useState(null);

  const handleDeleteItem = React.useCallback((id) => {
    if (confirmingId === id) {
      if (manageType === 'accounts') {
        deleteAccount(id);
      } else {
        deleteSaving(id);
      }
      setConfirmingId(null);
    } else {
      setConfirmingId(id);
      // Auto-reset after 3 seconds if not confirmed
      setTimeout(() => setConfirmingId(prev => prev === id ? null : prev), 3000);
    }
  }, [confirmingId, manageType, deleteAccount, deleteSaving]);

  const handleSaveItem = React.useCallback((e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (manageType === 'accounts') {
      const updatedAccount = {
        ...editingItem,
        name: formData.get('name'),
        bank: formData.get('bank') || editingItem.bank || '',
        domain: formData.get('domain'),
        accountNumber: formData.get('accountNumber'),
        // balance is computed in DataContext, we don't save it here
        initialBalance: parseFloat(formData.get('initialBalance')),
        initialBalanceDate: formData.get('initialBalanceDate'),
      };
      updateAccount(updatedAccount);
    } else {
      const updatedSaving = {
        ...editingItem,
        name: formData.get('name'),
        bank: formData.get('bank'),
        domain: formData.get('domain'),
        balance: parseFloat(formData.get('balance')),
        rate: parseFloat(formData.get('rate')),
      };
      updateSaving(updatedSaving);
    }
    setEditingItem(null);
  }, [manageType, editingItem, updateAccount, updateSaving]);

  const handleAddItem = React.useCallback(() => {
    if (manageType === 'accounts') {
      const newAcc = {
        name: 'Nouveau Compte',
        short: 'NC',
        balance: 0,
        initialBalance: 0,
        domain: 'google.com',
        accountNumber: 'FR76 0000 0000 0000 0000 0000 000',
      };
      addAccount(newAcc);
    } else {
      const newSaving = {
        name: 'Nouveau Livret',
        bank: 'Votre Banque',
        domain: 'google.com',
        balance: 0,
        rate: 0.5,
      };
      addSaving(newSaving);
    }
  }, [manageType, addAccount, addSaving]);

  return (
    <div className="screen">
      <PageHeader title="Tableau de bord" />

      {/* Interactive Month Selector */}
      <section style={{ padding: '0 24px 16px' }} className="dashboard-max-width">
        <div 
          className="scrollbar-hide"
          style={{
            display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollBehavior: 'smooth'
          }}
        >
          {forecasts?.map(f => {
            const periodValue = f.id;
            const isSelected = selectedPeriod === periodValue;
            return (
              <button
                key={f.id}
                onClick={() => handlePeriodChange(periodValue)}
                style={{
                  flexShrink: 0,
                  padding: '8px 20px',
                  borderRadius: 20,
                  background: isSelected ? 'var(--color-primary)' : 'rgba(255,255,255,0.6)',
                  color: isSelected ? 'white' : 'var(--color-text-primary)',
                  border: isSelected ? 'none' : '1px solid var(--color-border-light)',
                  backdropFilter: 'blur(10px)',
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: isSelected ? '0 4px 12px rgba(24, 82, 74, 0.3)' : 'var(--shadow-sm)',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {f.month.toUpperCase()}
              </button>
            );
          })}
        </div>
      </section>

      <div style={{ opacity: isFiltering ? 0.4 : 1, transition: 'opacity 0.2s ease-in-out' }}>
        {/* Patrimoine Section */}
        <section style={{ padding: '0 24px 0' }} className="dashboard-max-width">
        {(() => {
          const totalAccounts = (accounts || []).reduce((s, a) => s + (parseFloat(a.balance) || 0), 0);
          const totalSavings = (savingsItems || []).reduce((s, sv) => s + (parseFloat(sv.balance) || 0), 0);
          const totalPatrimoine = totalAccounts + totalSavings;
          const savingsRatio = totalPatrimoine > 0 ? (totalSavings / totalPatrimoine) * 100 : 0;
          const accountsRatio = 100 - savingsRatio;
          return (
            <div style={{ 
              background: 'linear-gradient(135deg, var(--color-primary-bg) 0%, #e2eeec 100%)', 
              padding: '24px', 
              borderRadius: 24, 
              border: '1px solid var(--color-border)',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: '0 10px 25px -5px rgba(24, 82, 74, 0.15)'
            }}>
              {/* Icon */}
              <div style={{ position: 'absolute', top: 20, right: 20, color: 'var(--color-primary)', opacity: 0.8 }}>
                <span className="material-icons-round" style={{ fontSize: 28 }}>account_balance</span>
              </div>

              <div style={{ position: 'relative', zIndex: 1 }}>
                {/* Label */}
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', margin: 0 }}>
                  Gestion du Patrimoine
                </p>
                {/* Total */}
                <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--color-text-primary)', margin: '8px 0 16px', letterSpacing: '-0.02em' }}>
                  {totalPatrimoine.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                </h1>

                {/* Progress bar: accounts vs savings */}
                <div style={{ display: 'flex', height: 6, borderRadius: 100, overflow: 'hidden', background: 'rgba(0,0,0,0.08)', marginBottom: 14 }}>
                  <div style={{ width: `${accountsRatio}%`, background: 'var(--color-primary)', transition: 'width 0.5s ease' }} />
                  <div style={{ width: `${savingsRatio}%`, background: 'rgba(24,82,74,0.35)', transition: 'width 0.5s ease' }} />
                </div>

                {/* Breakdown */}
                <div style={{ display: 'flex', gap: 16 }}>
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--color-primary)', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Comptes courants
                      </p>
                      <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--color-text-primary)', margin: '2px 0 0' }}>
                        {totalAccounts.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                  </div>
                  <div style={{ width: 1, background: 'rgba(0,0,0,0.08)' }} />
                  <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: 'rgba(24,82,74,0.35)', flexShrink: 0 }} />
                    <div>
                      <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Épargne
                      </p>
                      <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--color-text-primary)', margin: '2px 0 0' }}>
                        {totalSavings.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}
        </section>

      {showInstallBtn && (
        <section style={{ padding: '16px 24px 0' }} className="dashboard-max-width">
          <button 
            className="pwa-install-btn animate-fade"
            onClick={handleInstallClick}
            style={{
              width: '100%',
              padding: '14px',
              borderRadius: '16px',
              background: 'var(--color-primary)',
              border: 'none',
              color: 'white',
              fontSize: '14px',
              fontWeight: '800',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            <span className="material-icons-round" style={{ fontSize: '20px' }}>download_for_offline</span>
            Installer l'application sur mon mobile
          </button>
        </section>
      )}

      {/* Monthly Summary (Revenus / Dépenses) */}
      <section style={{ padding: '24px' }} className="dashboard-max-width">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap' }}>Résumé du mois</h3>
          <div style={{ flex: 1, height: 1.5, background: '#000000', opacity: 0.2 }}></div>
        </div>
        <div className="form-tiles-responsive" style={{ display: 'flex', gap: 16 }}>
          <div style={{ 
            flex: 1, background: 'white', padding: 20, borderRadius: 24, 
            border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)',
            display: 'flex', alignItems: 'center', gap: 16
          }}>
            <div style={{ 
              width: 48, height: 48, borderRadius: 16, background: 'var(--color-primary-glass)', 
              color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <span className="material-icons-round">trending_up</span>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenus</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-text-primary)', margin: '4px 0 0' }}>{monthlyRevenus.toLocaleString('fr-FR')} €</p>
            </div>
          </div>
          
          <div style={{ 
            flex: 1, background: 'white', padding: 20, borderRadius: 24, 
            border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)',
            display: 'flex', alignItems: 'center', gap: 16
          }}>
            <div style={{ 
              width: 48, height: 48, borderRadius: 16, background: 'rgba(24, 82, 74, 0.05)', 
              color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0.8
            }}>
              <span className="material-icons-round">trending_down</span>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dépenses</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-text-primary)', margin: '4px 0 0' }}>{monthlyDepenses.toLocaleString('fr-FR')} €</p>
            </div>
          </div>
        </div>
      </section>

      {/* Connected Accounts */}
      <section style={{ padding: '0 24px 24px' }} className="dashboard-max-width">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap' }}>Comptes connectés</h3>
          <div style={{ flex: 1, height: 1.5, background: '#000000', opacity: 0.2 }}></div>
          <button onClick={() => { setManageType('accounts'); setIsManageModalOpen(true); }} style={{ 
            background: 'none', border: 'none', color: 'var(--color-primary)', 
            fontSize: 13, fontWeight: 800, cursor: 'pointer' 
          }}>Gérer</button>
        </div>
        <div className="tablet-grid" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12, margin: '0 -24px', paddingLeft: 24, paddingRight: 24 }}>
          {accounts.length > 0 ? accounts.map((acc, idx) => {
            const isDragging = dragSrcRef.current?.section === 'accounts' && dragSrcRef.current?.index === idx;
            const isOver = dragOverIdx?.section === 'accounts' && dragOverIdx?.index === idx;
            return (
            <div
              key={acc.id}
              draggable
              onDragStart={() => handleDragStart('accounts', idx)}
              onDragOver={(e) => handleDragOver(e, 'accounts', idx)}
              onDrop={(e) => handleDrop(e, 'accounts', idx)}
              onDragEnd={handleDragEnd}
              style={{ 
                minWidth: 140, background: 'white', padding: 16, borderRadius: 18, 
                border: isOver ? '2px dashed var(--color-primary)' : '1px solid var(--color-border-light)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex', flexDirection: 'column',
                opacity: isDragging ? 0.4 : 1,
                cursor: 'grab',
                transition: 'opacity 0.15s, border 0.15s, transform 0.15s',
                transform: isOver ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, flex: 1, paddingRight: 8 }}>{acc.name}</p>
                <CompanyLogo domain={acc.domain} name={acc.name} size={32} noBorder />
              </div>
              <p style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 700, margin: 0, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '100%' }} title={acc.accountNumber}>
                {acc.accountNumber}
              </p>
              <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--color-text-primary)', marginTop: 'auto', paddingTop: 12 }}>{acc.balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
            </div>
          );}) : (
            <div style={{ flex: 1, padding: '32px', background: 'white', borderRadius: 20, border: '2px dashed var(--color-border)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
              <span className="material-icons-round" style={{ fontSize: 32, marginBottom: 8, opacity: 0.5 }}>account_balance</span>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 700 }}>Aucun compte configuré</p>
              <button onClick={() => { setManageType('accounts'); setIsManageModalOpen(true); handleAddItem(); }} style={{ marginTop: 12, background: 'var(--color-primary)', border: 'none', borderRadius: 8, padding: '6px 16px', color: 'white', fontWeight: 800, fontSize: 12, cursor: 'pointer' }}>Ajouter un compte</button>
            </div>
          )}
        </div>
      </section>

      {/* Savings Section */}
      <section style={{ padding: '0 24px 24px' }} className="dashboard-max-width">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap' }}>Épargne</h3>
          <div style={{ flex: 1, height: 1.5, background: '#000000', opacity: 0.2 }}></div>
          <button onClick={() => { setManageType('savings'); setIsManageModalOpen(true); }} style={{ 
            background: 'none', border: 'none', color: 'var(--color-primary)', 
            fontSize: 13, fontWeight: 800, cursor: 'pointer' 
          }}>Gérer</button>
        </div>
        <div className="tablet-grid" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12, margin: '0 -24px', paddingLeft: 24, paddingRight: 24 }}>
          {savingsItems.length > 0 ? savingsItems.map((save, idx) => {
            const isDragging = dragSrcRef.current?.section === 'savings' && dragSrcRef.current?.index === idx;
            const isOver = dragOverIdx?.section === 'savings' && dragOverIdx?.index === idx;
            return (
            <div
              key={save.id}
              draggable
              onDragStart={() => handleDragStart('savings', idx)}
              onDragOver={(e) => handleDragOver(e, 'savings', idx)}
              onDrop={(e) => handleDrop(e, 'savings', idx)}
              onDragEnd={handleDragEnd}
              style={{ 
                minWidth: 180, background: 'white', padding: 20, borderRadius: 18, 
                border: isOver ? '2px dashed var(--color-primary)' : '1px solid var(--color-border-light)',
                boxShadow: 'var(--shadow-sm)',
                display: 'flex', flexDirection: 'column',
                opacity: isDragging ? 0.4 : 1,
                cursor: 'grab',
                transition: 'opacity 0.15s, border 0.15s, transform 0.15s',
                transform: isOver ? 'scale(1.02)' : 'scale(1)',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, flex: 1, paddingRight: 8 }}>{save.name}</p>
                <CompanyLogo domain={save.domain} name={save.bank} size={32} noBorder />
              </div>
              <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 600, margin: 0 }}>{save.bank}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: 'auto', paddingTop: 12 }}>
                <p style={{ fontSize: 15, fontWeight: 900, color: 'var(--color-primary-dark)', margin: 0 }}>{save.balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
                {save.rate > 0 && <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-success)', background: 'var(--color-success-light)', padding: '2px 7px', borderRadius: 6 }}>{save.rate}%</span>}
              </div>
            </div>
          );}) : (
            <div style={{ flex: 1, padding: '24px', background: 'white', borderRadius: 20, border: '2px dashed var(--color-border)', textAlign: 'center', color: 'var(--color-text-tertiary)' }}>
              <p style={{ margin: 0, fontSize: 12, fontWeight: 700 }}>Aucun contrat d'épargne</p>
            </div>
          )}
        </div>
      </section>

      {/* Evolution Chart Section */}
      {(() => {
        // --- Build chart data from transactions ---
        const monthSlug = selectedPeriod.split('_').pop(); // "2026-03"
        if (!monthSlug || !monthSlug.includes('-')) return null;

        const [yStr, mStr] = monthSlug.split('-');
        const endYear = parseInt(yStr, 10);
        const endMonth = parseInt(mStr, 10); // 1-indexed

        // Generate last 6 months ending at selectedPeriod
        const months = Array.from({ length: 6 }, (_, i) => {
          let m = endMonth - (5 - i);
          let y = endYear;
          while (m <= 0) { m += 12; y -= 1; }
          const mm = String(m).padStart(2, '0');
          const endOfMonth = new Date(y, m, 0).toISOString().split('T')[0]; // last day
          const shortNames = ['JAN','FÉV','MAR','AVR','MAI','JUIN','JUIL','AOÛT','SEP','OCT','NOV','DÉC'];
          return { year: y, month: m, label: shortNames[m - 1], endOfMonth, slug: `${y}-${mm}` };
        });

        // Calculate balance at end of each month
        const initialTotal = (accounts || []).reduce((s, a) => s + (parseFloat(a.initialBalance) || 0), 0);

        const flatTxs = (transactions || []).flatMap(g => g?.items || g ? (g.items ? g.items : [g]) : []);

        const chartPoints = months.map(({ endOfMonth, label, slug }) => {
          const txSum = flatTxs.reduce((sum, tx) => {
            const txDate = tx.date || '';
            if (txDate <= endOfMonth) return sum + (parseFloat(tx.amount) || 0);
            return sum;
          }, 0);
          return { label, slug, value: initialTotal + txSum };
        });

        const values = chartPoints.map(p => p.value);
        const minVal = Math.min(...values);
        const maxVal = Math.max(...values);
        const range = maxVal - minVal || 1;

        // SVG dimensions
        const W = 400; const H = 120; const PAD = { t: 10, b: 10, l: 8, r: 8 };
        const points = chartPoints.map((p, i) => {
          const x = PAD.l + (i / (chartPoints.length - 1)) * (W - PAD.l - PAD.r);
          const y = PAD.t + (1 - (p.value - minVal) / range) * (H - PAD.t - PAD.b);
          return { x, y, ...p };
        });

        const polyline = points.map(p => `${p.x},${p.y}`).join(' ');
        const areaPath = `M${points[0].x},${H} ` + points.map(p => `L${p.x},${p.y}`).join(' ') + ` L${points[points.length-1].x},${H} Z`;

        const selectedLabel = months[months.length - 1].label;
        const currentMonthSlug = new Date().toISOString().substring(0, 7);

        return (
          <section style={{ padding: '0 24px 24px' }} className="dashboard-max-width">
            <div style={{ background: 'white', padding: 24, borderRadius: 24, border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
                <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div>
                    <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap' }}>Évolution du patrimoine</h3>
                    <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: '4px 0 0' }}>6 derniers mois</p>
                  </div>
                  <div style={{ flex: 1, height: 1.5, background: '#000000', marginTop: -20, opacity: 0.2 }}></div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-primary-glass)', color: 'var(--color-primary-dark)', padding: '6px 12px', borderRadius: 12, fontSize: 12, fontWeight: 800, marginLeft: 16 }}>
                  <span className="material-icons-round" style={{ fontSize: 16 }}>calendar_today</span>
                  {selectedLabel}
                </div>
              </div>

              <div style={{ height: 140, width: '100%', position: 'relative' }}>
                <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', height: '100%', overflow: 'visible' }}>
                  <defs>
                    <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                  {/* horizontal guides */}
                  {[0.25, 0.5, 0.75].map(r => (
                    <line key={r} x1={PAD.l} x2={W - PAD.r} y1={PAD.t + r * (H - PAD.t - PAD.b)} y2={PAD.t + r * (H - PAD.t - PAD.b)} stroke="#e2e8f0" strokeWidth="1" />
                  ))}
                  {/* area fill */}
                  <path d={areaPath} fill="url(#areaGrad)" />
                  {/* line */}
                  <polyline points={polyline} fill="none" stroke="var(--color-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  {/* dots + value labels */}
                  {points.map((p, i) => {
                    const isSelected = p.slug === monthSlug;
                    return (
                      <g key={i}>
                        <circle cx={p.x} cy={p.y} r={isSelected ? 5 : 3.5} fill={isSelected ? 'var(--color-primary)' : 'white'} stroke="var(--color-primary)" strokeWidth="2" />
                        {isSelected && (
                          <text x={p.x} y={p.y - 10} textAnchor="middle" fontSize="9" fontWeight="800" fill="var(--color-primary-dark)">
                            {p.value.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 })}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, padding: '0 4px' }}>
                {chartPoints.map((p, i) => (
                  <span key={i} style={{ fontSize: 10, fontWeight: 800, color: p.slug === monthSlug ? 'var(--color-primary-dark)' : 'var(--color-text-tertiary)' }}>
                    {p.label}
                  </span>
                ))}
              </div>
            </div>
          </section>
        );
      })()}

      {/* Insights */}
      <section style={{ padding: '0 24px 24px' }} className="dashboard-max-width">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap' }}>Insights Financiers</h3>
          <div style={{ flex: 1, height: 1.5, background: '#000000', opacity: 0.2 }}></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {(insights || []).map(insight => (
            <div key={insight.id} style={{ 
              display: 'flex', gap: 16, background: 'white', padding: 16, borderRadius: 18, 
              border: '1px solid var(--color-border-light)', alignItems: 'center'
            }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: insight.bg, color: insight.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-icons-round">{insight.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>{insight.title}</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '4px 0 0', lineHeight: 1.4 }}>{insight.text}</p>
              </div>
              <span className="material-icons-round" style={{ color: 'var(--color-text-tertiary)' }}>chevron_right</span>
            </div>
          ))}
        </div>
      </section>
      </div>

      {/* Manage Modal */}
      {isManageModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'white', width: '100%', maxWidth: 700, maxHeight: '90vh',
            borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ padding: 24, borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-text-primary)', margin: 0 }}>
                  {manageType === 'accounts' ? 'Gestion des comptes' : "Gestion de l'épargne"}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                  {manageType === 'accounts' ? 'Configurez vos connexions bancaires.' : 'Gérez vos livrets et placements.'}
                </p>
              </div>
              <button onClick={() => { setIsManageModalOpen(false); setEditingItem(null); }} style={{ 
                width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f1f5f9', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}>
                <span className="material-icons-round" style={{ fontSize: 20, color: 'var(--color-text-secondary)' }}>close</span>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {editingItem ? (
                <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Multi-Tile Layout: Responsive Stack/Side-by-Side */}
                  <div className="form-tiles-responsive">
                    
                    {/* Tile 1: Institution Info */}
                    <div style={{ flex: 1, background: '#f8fafc', padding: '20px', borderRadius: 20, border: '1.5px solid var(--color-border-light)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ background: 'var(--color-primary-glass)', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-icons-round" style={{ color: 'var(--color-primary)', fontSize: 16 }}>business</span>
                        </div>
                        <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Établissement</h4>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                        <div className="form-group">
                          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>
                            {manageType === 'accounts' ? 'NOM DU COMPTE' : 'NOM DU LIVRET'}
                          </label>
                          <div style={{ position: 'relative' }}>
                            <span className="material-icons-round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', fontSize: 16 }}>label</span>
                            <input name="name" defaultValue={editingItem.name} placeholder={manageType === 'accounts' ? "ex: Crédit Agricole Principale" : "ex: Livret A"} required style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 10, border: '1.5px solid var(--color-border-light)', outline: 'none', fontSize: 13, fontWeight: 600, background: 'white' }} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>
                            {manageType === 'accounts' ? 'NOM DE LA BANQUE' : 'BANQUE / ÉTABLISSEMENT'}
                          </label>
                          <div style={{ position: 'relative' }}>
                            <span className="material-icons-round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', fontSize: 16 }}>account_balance</span>
                            <input name="bank" defaultValue={editingItem.bank && editingItem.bank !== 'Non spécifié' ? editingItem.bank : ''} placeholder={manageType === 'accounts' ? "ex: Crédit Agricole" : "ex: Société Générale"} style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 10, border: '1.5px solid var(--color-border-light)', outline: 'none', fontSize: 13, fontWeight: 600, background: 'white' }} />
                          </div>
                        </div>
                        <div className="form-group">
                          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>
                            DOMAINE WEB (ICÔNE)
                          </label>
                          <div style={{ position: 'relative' }}>
                            <span className="material-icons-round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', fontSize: 16 }}>language</span>
                            <input name="domain" defaultValue={editingItem.domain} placeholder="ex: credit-agricole.fr" style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 10, border: '1.5px solid var(--color-border-light)', outline: 'none', fontSize: 13, fontWeight: 600, background: 'white' }} />
                          </div>
                        </div>
                        {manageType === 'savings' && (
                          <div className="form-group">
                             <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>DOMAINE (ICÔNE)</label>
                             <div style={{ position: 'relative' }}>
                               <span className="material-icons-round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', fontSize: 16 }}>language</span>
                               <input name="domain" defaultValue={editingItem.domain} placeholder="ex: bnp.fr" required style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 10, border: '1.5px solid var(--color-border-light)', outline: 'none', fontSize: 13, fontWeight: 600, background: 'white' }} />
                             </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tile 2: Account Details */}
                    <div style={{ flex: 1.4, background: '#f8fafc', padding: '20px', borderRadius: 20, border: '1.5px solid var(--color-border-light)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ background: 'var(--color-primary-glass)', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-icons-round" style={{ color: 'var(--color-primary)', fontSize: 16 }}>account_balance_wallet</span>
                        </div>
                        <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Détails Compte</h4>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                        <div className="form-group">
                          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>
                            {manageType === 'accounts' ? 'IBAN / NUMÉRO' : "TAUX D'INTÉRÊT"}
                          </label>
                          <div style={{ position: 'relative' }}>
                            <span className="material-icons-round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', fontSize: 16 }}>
                              {manageType === 'accounts' ? 'numbers' : 'percent'}
                            </span>
                            <input 
                              name={manageType === 'accounts' ? "accountNumber" : "rate"} 
                              type={manageType === 'accounts' ? "text" : "number"}
                              step="0.01"
                              defaultValue={manageType === 'accounts' ? editingItem.accountNumber : editingItem.rate} 
                              placeholder={manageType === 'accounts' ? "FR76..." : "ex: 3.0"} 
                              required 
                              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 10, border: '1.5px solid var(--color-border-light)', outline: 'none', fontSize: 13, fontWeight: 600, background: 'white' }} 
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                          {manageType === 'accounts' ? (
                            <>
                              <div className="form-group" style={{ flex: '1 1 45%' }}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  SOLDE INITIAL
                                  <span className="material-icons-round" style={{ fontSize: 14, cursor: 'help', color: 'var(--color-primary)' }} title="Indiquez le solde de votre compte au moment où vous commencez à utiliser l'application.">help_outline</span>
                                </label>
                                <div style={{ position: 'relative' }}>
                                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', fontWeight: 800, fontSize: 12 }}>€</span>
                                  <input name="initialBalance" type="number" step="0.01" defaultValue={editingItem.initialBalance} required style={{ width: '100%', padding: '10px 8px 10px 22px', borderRadius: 10, border: '1.5px solid var(--color-border-light)', outline: 'none', fontSize: 13, fontWeight: 700, background: 'white' }} />
                                </div>
                              </div>
                              <div className="form-group" style={{ flex: '1 1 45%' }}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>DATE DU SOLDE INITIAL</label>
                                <input name="initialBalanceDate" type="date" defaultValue={editingItem.initialBalanceDate || new Date().toISOString().split('T')[0]} required style={{ width: '100%', padding: '10px 8px', borderRadius: 10, border: '1.5px solid var(--color-border-light)', outline: 'none', fontSize: 13, fontWeight: 700, background: 'white' }} />
                              </div>
                              <div className="form-group" style={{ flex: '1 1 100%' }}>
                                <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>SOLDE ACTUEL (CALCULÉ)</label>
                                <div style={{ position: 'relative', opacity: 0.7 }}>
                                  <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', fontWeight: 800, fontSize: 12 }}>€</span>
                                  <input disabled value={editingItem.balance?.toFixed(2)} style={{ width: '100%', padding: '10px 8px 10px 22px', borderRadius: 10, border: '1.5px solid var(--color-border-light)', outline: 'none', fontSize: 13, fontWeight: 700, background: '#f1f5f9', cursor: 'not-allowed' }} />
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="form-group" style={{ flex: 1 }}>
                              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>SOLDE ACTUEL</label>
                              <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', fontWeight: 800, fontSize: 12 }}>€</span>
                                <input name="balance" type="number" step="0.01" defaultValue={editingItem.balance} required style={{ width: '100%', padding: '10px 8px 10px 22px', borderRadius: 10, border: '1.5px solid var(--color-border-light)', outline: 'none', fontSize: 13, fontWeight: 700, background: 'white' }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--color-border-light)', paddingTop: 20 }}>
                    <button type="button" onClick={() => setEditingItem(null)} style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: '#f1f5f9', color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                    <button type="submit" style={{ flex: 2, padding: '14px', borderRadius: 14, border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 16px -4px rgba(24, 82, 74, 0.3)' }}>Enregistrer les modifications</button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {(manageType === 'accounts' ? accounts : savingsItems).map(item => (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: 16, background: '#f8fafc',
                      padding: '16px 20px', borderRadius: 18, border: '1.5px solid var(--color-border-light)'
                    }}>
                      <CompanyLogo domain={item.domain} name={manageType === 'accounts' ? item.name : item.bank} size={40} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>{item.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: '2px 0 0' }}>
                          {manageType === 'accounts' ? item.accountNumber : item.bank}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setEditingItem(item)} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'white', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                          <span className="material-icons-round" style={{ fontSize: 18 }}>edit</span>
                        </button>
                        <button 
                          onClick={() => handleDeleteItem(item.id)} 
                          style={{ 
                            width: confirmingId === item.id ? 80 : 36, 
                            height: 36, 
                            borderRadius: 10, 
                            border: 'none', 
                            background: confirmingId === item.id ? '#ef4444' : 'white', 
                            color: confirmingId === item.id ? 'white' : '#ef4444', 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center', 
                            cursor: 'pointer', 
                            boxShadow: 'var(--shadow-sm)',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            fontSize: 12,
                            fontWeight: 700,
                            gap: 4
                          }}
                        >
                          <span className="material-icons-round" style={{ fontSize: 18 }}>
                            {confirmingId === item.id ? 'done' : 'delete'}
                          </span>
                          {confirmingId === item.id && <span>Sûr ?</span>}
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button onClick={handleAddItem} style={{
                    width: '100%', padding: '20px', borderRadius: 18, border: '2px dashed #cbd5e1',
                    background: '#f8fafc', color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer',
                    marginTop: 8
                  }}>
                    <span className="material-icons-round">add_circle_outline</span>
                    {manageType === 'accounts' ? 'Ajouter un établissement' : 'Ajouter un livret'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top FAB */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: 100,
            right: 20,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(24, 82, 74, 0.3)',
            cursor: 'pointer',
            zIndex: 100,
            transition: 'all 0.3s ease'
          }}
          className="animate-fade"
        >
          <span className="material-icons-round" style={{ fontSize: 24 }}>expand_less</span>
        </button>
      )}
    </div>
  );
};

export default Dashboard;
