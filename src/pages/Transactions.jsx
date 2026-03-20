import React, { useState, useEffect } from 'react';
import CompanyLogo from '../components/CompanyLogo';
import PageHeader from '../components/PageHeader';
import SwipeAction from '../components/SwipeAction';
import { useData } from '../context/DataContext';

const Transactions = () => {
  const { 
    transactions: txData, 
    addTransaction, 
    addTransactions, 
    deleteTransaction, 
    updateTransaction, 
    categories, 
    accounts,
    globalRecurrences,
    forecasts
  } = useData();
  
  const [activeFilter, setActiveFilter] = useState('Tous');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  
  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [editId, setEditId] = useState(null);
  
  // Undo State
  const [showUndo, setShowUndo] = useState(false);
  const [undoTx, setUndoTx] = useState(null);
  const undoTimerRef = React.useRef(null);

  // Hide bottom navbar when form is open (mobile UX)
  useEffect(() => {
    const isOpen = isAddModalOpen || isEditing;
    if (isOpen) {
      document.body.classList.add('form-open');
    } else {
      document.body.classList.remove('form-open');
    }
    return () => document.body.classList.remove('form-open');
  }, [isAddModalOpen, isEditing]);
  
  // Form State
  const [newTx, setNewTx] = useState({
    name: '',
    category: 'Alimentation',
    amount: '',
    account: accounts?.[0]?.id || '',
    toAccount: accounts?.[1]?.id || accounts?.[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    budget_month: new Date().toISOString().substring(0, 7) + '-01',
    type: 'Dépenses',
    method: 'CB'
  });

  // Helper for display
  const getAccountName = React.useCallback((id) => {
    const acc = accounts?.find(a => String(a.id) === String(id));
    return acc ? acc.name : id;
  }, [accounts]);

  const filteredGroups = React.useMemo(() => {
    return txData
      .map(group => ({
        ...group,
        items: activeFilter === 'Tous'
          ? group.items
          : group.items.filter(tx => tx.category === activeFilter),
      }))
      .filter(group => group.items.length > 0);
  }, [txData, activeFilter]);

  const handleCloseModal = () => {
    setIsAddModalOpen(false);
    setIsEditing(false);
    setEditId(null);
    
    // Auto-select first available expense category or 'Divers'
    const firstExpense = globalRecurrences.fixes?.[0]?.label || globalRecurrences.variables?.[0]?.label || 'Divers';
    
    setNewTx({
      name: '',
      category: firstExpense,
      amount: '',
      account: accounts?.[0]?.id || '',
      toAccount: accounts?.[1]?.id || accounts?.[0]?.id || '',
      date: new Date().toISOString().split('T')[0],
      budget_month: new Date().toISOString().substring(0, 7),
      type: 'Dépenses',
      method: 'CB'
    });
  };

  const handleEdit = (tx) => {
    console.log("handleEdit called for:", tx.id, tx.name);
    // Check if recurring
    const isRecurring = globalRecurrences.fixes.some(f => f.label === tx.name) || 
                       globalRecurrences.revenus.some(r => r.label === tx.name);
    
    if (isRecurring) {
      if (!window.confirm("Cette transaction semble être récurrente. Voulez-vous modifier uniquement cette occurrence ?")) {
        // Here we could add logic to edit the rule, but for now we follow the user prompt's simplified warning
      }
    }

    setNewTx({
      name: tx.name,
      category: tx.category,
      amount: Math.abs(tx.amount).toString(),
      account: tx.account_id || tx.account,
      toAccount: 'Revolut', // Transfers handle separate
      date: tx.date || new Date().toISOString().split('T')[0],
      budget_month: tx.budget_month || (tx.date ? tx.date.substring(0, 7) + '-01' : new Date().toISOString().substring(0, 7) + '-01'),
      type: tx.amount > 0 ? 'Revenus' : tx.category === 'Transferts' ? 'Virement' : 'Dépenses',
      method: tx.method || 'CB'
    });
    setEditId(tx.id);
    setIsEditing(true);
    setIsAddModalOpen(true);
  };

  const handleDelete = (tx) => {
    console.log("handleDelete called for:", tx.id, tx.name);
    // Check if recurring
    const isRecurring = globalRecurrences.fixes.some(f => f.label === tx.name) || 
                       globalRecurrences.revenus.some(r => r.label === tx.name);

    if (isRecurring) {
      if (!window.confirm("Voulez-vous supprimer uniquement cette occurrence ou la règle récurrente ?")) {
        return;
      }
    }

    // Capture for undo
    setUndoTx(tx);
    setShowUndo(true);
    if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    undoTimerRef.current = setTimeout(() => setShowUndo(false), 5000);

    // Haptic feedback (if available)
    if (window.navigator?.vibrate) window.navigator.vibrate(50);

    deleteTransaction(tx.id);
  };

  const handleUndo = () => {
    if (undoTx) {
      addTransaction(undoTx);
      setUndoTx(null);
      setShowUndo(false);
      if (undoTimerRef.current) clearTimeout(undoTimerRef.current);
    }
  };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if ((newTx.type !== 'Virement' && !newTx.name) || !newTx.amount) return;

    const amountNum = parseFloat(newTx.amount.replace(',', '.'));
    const isTransfer = newTx.type === 'Virement';
    const isIncome = newTx.type === 'Revenus';
    
    // Final amount based on type
    const finalAmount = isIncome ? Math.abs(amountNum) : -Math.abs(amountNum);

    const txDate = new Date(newTx.date);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let dateLabel = '';
    if (txDate.toDateString() === today.toDateString()) dateLabel = "Aujourd'hui";
    else if (txDate.toDateString() === yesterday.toDateString()) dateLabel = "Hier";
    else {
      dateLabel = txDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
    }

    const createTxItem = (name, amount, accId, icon, cat) => {
      const categoryName = cat || newTx.category;
      
      // Find icon from globalRecurrences or categories
      let categoryIcon = icon;
      if (!categoryIcon) {
        // Search in globalRecurrences first (revenus, fixes, variables)
        const allRecs = [
          ...globalRecurrences.revenus,
          ...globalRecurrences.fixes,
          ...globalRecurrences.variables
        ];
        const found = allRecs.find(r => r.label === categoryName);
        if (found?.icon) {
          categoryIcon = found.icon;
        } else {
          // Fallback to categories state
          const foundCat = categories.find(c => c.name === categoryName);
          categoryIcon = foundCat?.icon || (
            categoryName === 'Alimentation' ? 'shopping_basket' : 
            categoryName === 'Loisirs' ? 'movie' : 
            categoryName === 'Revenus' ? 'attach_money' : 
            categoryName === 'Logement' ? 'home' : 
            categoryName === 'Transport' ? 'directions_transit' : 'category'
          );
        }
      }

      return {
        id: Math.random(),
        name: name,
        category: categoryName,
        categoryIcon: categoryIcon,
        amount: amount,
        account: getAccountName(accId),
        account_id: accId,
        color: 'var(--color-text-primary)',
        domain: '',
        bg: 'rgba(0,0,0,0.05)',
        budget_month: newTx.budget_month || newTx.date.substring(0, 7) + '-01',
        method: newTx.method || 'CB'
      };
    };

    const newItems = [];
    if (isTransfer) {
      newItems.push(createTxItem(`Virement vers ${getAccountName(newTx.toAccount)}`, -Math.abs(amountNum), newTx.account, 'swap_horiz', 'Transferts'));
      newItems.push(createTxItem(`Virement de ${getAccountName(newTx.account)}`, Math.abs(amountNum), newTx.toAccount, 'swap_horiz', 'Transferts'));
    } else {
      newItems.push(createTxItem(newTx.name, finalAmount, newTx.account));
    }

    try {
      if (isEditing) {
        // Simple update for non-transfer edits
        // If it was a transfer, editing it manually might be complex, so we just update the one ID
        updateTransaction({ ...newItems[0], id: editId, dateLabel, date: newTx.date });
      } else {
        if (addTransactions) {
          addTransactions(newItems.map(item => ({ ...item, dateLabel, date: newTx.date })));
        } else {
          newItems.forEach(item => {
            addTransaction({ ...item, dateLabel, date: newTx.date });
          });
        }
      }
      setTimeout(() => {
        handleCloseModal();
      }, 50);
    } catch (err) {
      console.error("Error saving transaction(s):", err);
    }
  };

  return (
    <div className="screen animate-fade">
      <PageHeader title="Transactions" />

      {/* Search Bar */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          background: 'white', 
          borderRadius: 12, 
          border: '1px solid var(--color-border)', 
          height: 52, 
          padding: '0 16px',
          boxShadow: 'var(--shadow-sm)'
        }}>
          <span className="material-icons-round" style={{ color: 'var(--color-primary)', fontSize: 24 }}>search</span>
          <input 
            type="text" 
            placeholder="Rechercher une transaction" 
            style={{ flex: 1, border: 'none', padding: '0 16px', fontSize: 16, outline: 'none', color: 'var(--color-text-secondary)' }}
          />
        </div>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: 12, padding: '0 16px 16px', overflowX: 'auto' }} className="scrollbar-hide">
        <button 
          className="flex items-center gap-2"
          style={{ 
            height: 44, 
            padding: '0 20px', 
            borderRadius: 22, 
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            fontSize: 14,
            fontWeight: 700,
            whiteSpace: 'nowrap'
          }}
        >
          Tous les comptes
          <span className="material-icons-round" style={{ fontSize: 18 }}>expand_more</span>
        </button>
        {categories.map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveFilter(cat.name === activeFilter ? 'Tous' : cat.name)}
            className="flex items-center gap-2"
            style={{ 
              height: 44, 
              padding: '0 20px', 
              borderRadius: 22, 
              background: activeFilter === cat.name ? 'var(--color-primary)' : 'white',
              color: activeFilter === cat.name ? 'white' : 'var(--color-text-primary)',
              border: activeFilter === cat.name ? 'none' : '1px solid var(--color-border-light)',
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            <span className="material-icons-round" style={{ fontSize: 18 }}>
              {cat.icon}
            </span>
            {cat.name}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="screen-content-centered" style={{ padding: '0 16px', minHeight: '300px', display: filteredGroups.length === 0 ? 'flex' : 'block', alignItems: 'center', justifyContent: 'center' }}>
        {filteredGroups.length > 0 ? filteredGroups.map(group => (
          <div key={group.id} className="animate-slide-up" style={{ marginBottom: 24, width: '100%' }}>
            <div className="tx-date-separator" style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 12, 
              padding: '8px 12px 12px',
              marginTop: 10
            }}>
              <span style={{ 
                fontSize: 13, 
                fontWeight: 900, 
                color: 'var(--color-text-primary)', 
                opacity: 0.8,
                textTransform: 'uppercase', 
                letterSpacing: '0.05em',
                whiteSpace: 'nowrap'
              }}>
                {group.dateLabel}
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--color-border)', opacity: 0.3 }}></div>
            </div>
            
            <div style={{ 
              background: 'white', 
              padding: '4px 20px', 
              borderRadius: 24, 
              border: '1px solid var(--color-border-light)', 
              boxShadow: 'var(--shadow-sm)',
              display: 'flex', 
              flexDirection: 'column' 
            }}>
              {group.items.map((tx, index) => (
                <SwipeAction 
                  key={tx.id}
                  onSwipeLeft={() => handleDelete(tx)}
                  onSwipeRight={() => handleEdit(tx)}
                  leftAction={<span className="material-icons-round" style={{ color: 'var(--color-error, #ef4444)' }}>delete</span>}
                  rightAction={<span className="material-icons-round" style={{ color: 'var(--color-primary)' }}>edit</span>}
                >
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    padding: '16px 20px', // Extra padding for the container
                    borderBottom: index === group.items.length - 1 ? 'none' : '1px solid var(--color-border-light)'
                  }}>
                    <div style={{ marginRight: 16 }}>
                      <CompanyLogo 
                        domain={tx.domain} 
                        name={tx.name} 
                        size={44} 
                        bg={tx.bg} 
                        icon={tx.categoryIcon}
                      />
                    </div>
                    
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>{tx.name}</p>
                      <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500, margin: '2px 0 0' }}>{tx.category}</p>
                    </div>
                    
                    <div style={{ textAlign: 'right' }}>
                      <p style={{ 
                        fontSize: 15, 
                        fontWeight: 900, 
                        color: tx.amount > 0 ? 'var(--color-primary)' : 'var(--color-text-primary)',
                        margin: 0
                      }}>
                        {tx.amount > 0 ? '+ ' : '- '}{Math.abs(tx.amount).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                      </p>
                      <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 600, marginTop: 4 }}>
                        {getAccountName(tx.account_id || tx.account)}
                        {tx.type !== 'Virement' && tx.category !== 'Transferts' && ` • ${tx.method || 'CB'}`}
                      </p>
                    </div>
                  </div>
                </SwipeAction>
              ))}
            </div>
          </div>
        )) : (
          <div style={{ textAlign: 'center', padding: '48px 24px' }}>
            <div style={{ background: 'var(--color-bg)', width: 80, height: 80, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
              <span className="material-icons-round" style={{ fontSize: 40, color: 'var(--color-text-tertiary)', opacity: 0.5 }}>receipt_long</span>
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-text-primary)', margin: '0 0 12px' }}>Aucune transaction</h3>
            <p style={{ fontSize: 14, color: 'var(--color-text-secondary)', fontWeight: 500, lineHeight: 1.5, maxWidth: 280, margin: '0 auto' }}>
              Ajoutez votre première opération manuellement ou connectez un établissement bancaire.
            </p>
            <button 
              onClick={() => setIsAddModalOpen(true)}
              style={{ marginTop: 24, padding: '12px 24px', borderRadius: 16, border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 800, fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 16px rgba(24, 82, 74, 0.2)' }}
            >
              Ajouter une opération
            </button>
          </div>
        )}
      </div>

      {/* Floating Action Button */}
      <div style={{
        position: 'fixed',
        bottom: 'calc(var(--nav-height) + 20px)',
        width: '100%',
        maxWidth: '1200px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        justifyContent: 'flex-end',
        padding: '0 20px',
        pointerEvents: 'none',
        zIndex: 100
      }}>
        <button style={{
          width: 56,
          height: 56,
          borderRadius: 28,
          background: 'var(--color-primary)',
          color: 'white',
          border: 'none',
          boxShadow: '0 4px 12px rgba(24, 82, 74, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          pointerEvents: 'auto',
          transition: 'transform 0.2s',
        }}
        onClick={() => setIsAddModalOpen(true)}
        onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
        onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span className="material-icons-round" style={{ fontSize: 32 }}>add</span>
        </button>
      </div>

      {/* Add Transaction Modal */}
      {isAddModalOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.4)',
          backdropFilter: 'blur(8px)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }} onClick={handleCloseModal}>
          <div 
            className="animate-slide-up"
            style={{
              width: '100%',
              maxWidth: 500,
              background: 'white',
              borderRadius: 32,
              padding: '32px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-text-primary)', margin: 0 }}>
                {isEditing ? 'Modifier la transaction' : 'Nouvelle transaction'}
              </h3>
              <button 
                type="button"
                onClick={handleCloseModal}
                style={{ background: 'var(--color-bg)', border: 'none', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <span className="material-icons-round" style={{ fontSize: 20, color: 'var(--color-text-secondary)' }}>close</span>
              </button>
            </div>

            <div style={{ display: 'flex', background: 'var(--color-bg)', padding: 4, borderRadius: 14, marginBottom: 24 }}>
              {['Dépenses', 'Revenus', 'Virement'].map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => {
                    let firstCat = 'Divers';
                    if (t === 'Revenus') {
                      firstCat = globalRecurrences.revenus?.[0]?.label || 'Divers';
                    } else if (t === 'Dépenses') {
                      firstCat = globalRecurrences.fixes?.[0]?.label || globalRecurrences.variables?.[0]?.label || 'Divers';
                    }
                    setNewTx({...newTx, type: t, category: firstCat});
                  }}
                  style={{
                    flex: 1,
                    height: 40,
                    borderRadius: 10,
                    border: 'none',
                    fontSize: 14,
                    fontWeight: 700,
                    background: newTx.type === t ? 'white' : 'transparent',
                    color: newTx.type === t ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                    boxShadow: newTx.type === t ? 'var(--shadow-sm)' : 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {t}
                </button>
              ))}
            </div>

            <form onSubmit={handleAddTransaction} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              {newTx.type !== 'Virement' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--color-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Libellé</label>
                  <input 
                    type="text" 
                    value={newTx.name}
                    onChange={e => setNewTx({...newTx, name: e.target.value})}
                    placeholder="Ex: Restaurant Le Gourmet"
                    required
                    style={{ width: '100%', height: 56, borderRadius: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '0 16px', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}
                  />
                </div>
              )}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--color-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Montant</label>
                  <input 
                    type="text" 
                    value={newTx.amount}
                    onChange={e => setNewTx({...newTx, amount: e.target.value})}
                    placeholder="0.00 €"
                    required
                    style={{ width: '100%', height: 56, borderRadius: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '0 16px', fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--color-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Date</label>
                  <input 
                    type="date" 
                    value={newTx.date}
                    onChange={e => {
                      const newDate = e.target.value;
                      const monthSlug = newDate ? newDate.substring(0, 7) : null;
                      const targetForecast = forecasts.find(f => f.id.endsWith(monthSlug));
                      const newMonth = targetForecast ? targetForecast.id : newTx.budget_month;
                      setNewTx({...newTx, date: newDate, budget_month: newMonth});
                    }}
                    style={{ width: '100%', height: 56, borderRadius: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '0 16px', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)' }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--color-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mois Budgétaire</label>
                <select 
                  value={newTx.budget_month}
                  onChange={e => setNewTx({...newTx, budget_month: e.target.value})}
                  style={{ width: '100%', height: 56, borderRadius: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '0 16px', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', appearance: 'none' }}
                >
                  {forecasts?.map(f => (
                    <option key={f.id} value={f.id}>{f.month}</option>
                  ))}
                </select>
                <span style={{ fontSize: 11, color: 'var(--color-text-tertiary)', marginTop: 4, display: 'block', fontStyle: 'italic' }}>Permet d'affecter l'opération à un autre mois que sa date réelle.</span>
              </div>

              {newTx.type !== 'Virement' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--color-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Catégorie</label>
                  <select 
                    value={newTx.category}
                    onChange={e => setNewTx({...newTx, category: e.target.value})}
                    style={{ width: '100%', height: 56, borderRadius: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '0 16px', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', appearance: 'none' }}
                  >
                    {newTx.type === 'Revenus' ? (
                      <>
                        {globalRecurrences.revenus.map(r => (
                          <option key={r.id} value={r.label}>{r.label}</option>
                        ))}
                      </>
                    ) : (
                      <>
                        {[...globalRecurrences.fixes, ...globalRecurrences.variables].map(r => (
                          <option key={r.id} value={r.label}>{r.label}</option>
                        ))}
                      </>
                    )}
                    <option value="Divers">Divers</option>
                  </select>
                </div>
              )}

              {newTx.type !== 'Virement' && (
                <div>
                  <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--color-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mode de règlement</label>
                  <div style={{ display: 'flex', background: 'var(--color-bg)', padding: 4, borderRadius: 14 }}>
                    {['CB', 'Chèque', 'Espèces'].map(m => (
                      <button
                        key={m}
                        type="button"
                        onClick={() => setNewTx({...newTx, method: m})}
                        style={{
                          flex: 1,
                          height: 40,
                          borderRadius: 10,
                          border: 'none',
                          fontSize: 14,
                          fontWeight: 700,
                          background: newTx.method === m ? 'white' : 'transparent',
                          color: newTx.method === m ? 'var(--color-text-primary)' : 'var(--color-text-tertiary)',
                          boxShadow: newTx.method === m ? 'var(--shadow-sm)' : 'none',
                          cursor: 'pointer',
                          transition: 'all 0.2s'
                        }}
                      >
                        {m}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {newTx.type === 'Virement' ? (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--color-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>De (émetteur)</label>
                      <select 
                        value={newTx.account}
                        onChange={e => setNewTx({...newTx, account: e.target.value})}
                        style={{ width: '100%', height: 56, borderRadius: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '0 16px', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', appearance: 'none' }}
                      >
                        {accounts?.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--color-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Vers (récepteur)</label>
                      <select 
                        value={newTx.toAccount}
                        onChange={e => setNewTx({...newTx, toAccount: e.target.value})}
                        style={{ width: '100%', height: 56, borderRadius: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '0 16px', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', appearance: 'none' }}
                      >
                        {accounts?.map(acc => (
                          <option key={acc.id} value={acc.id}>{acc.name}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div>
                    <label style={{ display: 'block', fontSize: 13, fontWeight: 800, color: 'var(--color-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Compte</label>
                    <select 
                      value={newTx.account}
                      onChange={e => setNewTx({...newTx, account: e.target.value})}
                      style={{ width: '100%', height: 56, borderRadius: 16, background: 'var(--color-bg)', border: '1px solid var(--color-border)', padding: '0 16px', fontSize: 16, fontWeight: 600, color: 'var(--color-text-primary)', appearance: 'none' }}
                    >
                      {accounts?.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name}</option>
                      ))}
                    </select>
                  </div>
                )}

              <button 
                type="submit"
                style={{ 
                  marginTop: 12,
                  height: 60, 
                  borderRadius: 20, 
                  background: 'var(--color-primary)', 
                  color: 'white', 
                  border: 'none', 
                  fontSize: 16, 
                  fontWeight: 900, 
                  boxShadow: '0 6px 20px rgba(24, 82, 74, 0.3)',
                  cursor: 'pointer'
                }}
              >
                {isEditing ? 'Mettre à jour' : 'Ajouter la transaction'}
              </button>
            </form>
          </div>
        </div>
      )}
      {/* Undo Notification */}
      {showUndo && (
        <div style={{
          position: 'fixed',
          bottom: 100,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--color-text-primary)',
          color: 'white',
          padding: '12px 24px',
          borderRadius: 16,
          display: 'flex',
          alignItems: 'center',
          gap: 16,
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          zIndex: 2000,
          whiteSpace: 'nowrap'
        }}>
          <span style={{ fontSize: 14, fontWeight: 600 }}>Transaction supprimée</span>
          <button 
            onClick={handleUndo}
            style={{ 
              background: 'transparent', 
              border: 'none', 
              color: 'var(--color-primary)', 
              fontWeight: 800, 
              fontSize: 14, 
              cursor: 'pointer',
              textTransform: 'uppercase'
            }}
          >
            Annuler
          </button>
        </div>
      )}
    </div>
  );
};

export default Transactions;
