import React, { useState, useEffect, useRef, useMemo } from 'react';
import { supabase } from '../supabase';
import { useData } from '../context/DataContext';
import PageHeader from '../components/PageHeader';

const SharedExpenses = ({ onBack }) => {
  const { session, selectedPeriod, setSelectedPeriod, forecasts } = useData();
  const userId = session?.user?.id;

  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);
  const [isFiltering, setIsFiltering] = useState(false);

  const [modalCategory, setModalCategory] = useState('receipt');
  const scrollRef = useRef(null);

  // --- Auto-scroll to selected month ---
  useEffect(() => {
    if (selectedPeriod && scrollRef.current) {
      const timer = setTimeout(() => {
        const activeBtn = scrollRef.current?.querySelector('[data-selected="true"]');
        if (activeBtn) {
          activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [selectedPeriod, forecasts]);

  const handlePeriodChange = (val) => {
    setIsFiltering(true);
    setSelectedPeriod(val);
    setTimeout(() => setIsFiltering(false), 300);
  };

  // --- Filtered Transactions for logic ---
  const currentMonthSlug = (selectedPeriod || '').split('_').pop(); // "2026-03"
  
  const filteredTransactions = useMemo(() => {
    if (!currentMonthSlug) return transactions;
    return transactions.filter(tx => {
      // Prioritize accounting_period, fallback to date prefix
      if (tx.accounting_period) return tx.accounting_period === currentMonthSlug;
      return (tx.date || '').startsWith(currentMonthSlug);
    });
  }, [transactions, currentMonthSlug]);

  // --- Supabase Fetch ---
  useEffect(() => {
    if (userId) fetchData();
  }, [userId]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [membersRes, transactionsRes] = await Promise.all([
        supabase.from('shared_members').select('*').eq('user_id', userId).order('name', { ascending: true }),
        supabase.from('shared_transactions').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      ]);

      if (membersRes.data) setMembers(membersRes.data);
      if (transactionsRes.data) setTransactions(transactionsRes.data);
    } catch (err) {
      console.error('Error fetching shared data:', err);
    } finally {
      setLoading(false);
    }
  };

  // --- Helpers ---
  const getInitials = (name) => {
    if (!name) return '?';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };
  
  const getAvatarColor = (name) => {
    const colors = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
    return colors[Math.abs(hash) % colors.length];
  };

  const CATEGORIES = [
    { id: 'shopping_cart', label: 'Course', icon: 'shopping_cart' },
    { id: 'restaurant', label: 'Resto/Sortie', icon: 'restaurant' },
    { id: 'directions_car', label: 'Transport', icon: 'directions_car' },
    { id: 'home', label: 'Loyer/Charges', icon: 'home' },
    { id: 'cottage', label: 'Maison', icon: 'cottage' },
    { id: 'receipt', label: 'Autre', icon: 'receipt' }
  ];

  // --- Calculations ---
  // 1. Using filteredTransactions instead of all transactions
  const computedMemberStats = members.map(m => {
    const paid = filteredTransactions
      .filter(tx => tx.paid_by?.trim() === m.name?.trim())
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
    return { ...m, paid };
  });

  const groupTotal = computedMemberStats.reduce((sum, ms) => sum + ms.paid, 0);
  const individualShare = members.length > 0 ? groupTotal / members.length : 0;

  const memberStats = computedMemberStats.map(ms => ({
    ...ms,
    balance: ms.paid - individualShare
  }));

  // --- Handlers ---
  const addMember = async (name) => {
    if (!name || !userId) return;
    const newMember = { user_id: userId, name };
    const { data, error } = await supabase.from('shared_members').insert([newMember]).select();
    if (!error && data) {
      setMembers(prev => [...prev, data[0]].sort((a,b) => a.name.localeCompare(b.name)));
    }
  };

  const deleteMember = async (memberId) => {
    const { error } = await supabase.from('shared_members').delete().eq('id', memberId);
    if (!error) setMembers(prev => prev.filter(m => m.id !== memberId));
  };

  const addExpense = async (formData) => {
    if (!userId) return;
    
    // Normalize period to slug only (e.g. "2026-03") to match the selector and filter
    const monthSlug = (formData.accountingPeriod || selectedPeriod || '').split('_').pop();
    
    const newTx = {
      user_id: userId,
      name: formData.name,
      amount: -Math.abs(formData.amount),
      paid_by: formData.paidBy,
      category: formData.category,
      date: formData.date || new Date().toISOString().split('T')[0],
      accounting_period: monthSlug
    };
    
    const { data, error } = await supabase.from('shared_transactions').insert([newTx]).select();
    if (!error && data) setTransactions([data[0], ...transactions]);
    else if (error) console.error('Supabase error:', error);
    
    setIsExpenseModalOpen(false);
  };

  const deleteTransaction = async (id) => {
    const { error } = await supabase.from('shared_transactions').delete().eq('id', id);
    if (!error) setTransactions(transactions.filter(tx => tx.id !== id));
  };

  if (loading) {
     return (
       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--color-bg)' }}>
         <div className="spinner"></div>
         <style>{`.spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top: 4px solid var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
       </div>
     );
  }

  return (
    <div className="screen shared-expenses-view animate-fade" style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: 120 }}>
      
      <PageHeader title="Dépenses Communes" onBack={onBack} />

      {/* Interactive Month Selector - Matching Dashboard */}
      <section style={{ padding: '0 20px 16px', background: 'var(--color-bg)' }} className="dashboard-max-width">
        <div 
          ref={scrollRef}
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
                data-selected={isSelected}
                onClick={() => handlePeriodChange(periodValue)}
                style={{
                  flexShrink: 0,
                  padding: '8px 20px',
                  borderRadius: 20,
                  background: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: isSelected ? 'white' : 'var(--color-text-primary)',
                  border: isSelected ? 'none' : '1px solid var(--color-border-light)',
                  backdropFilter: 'blur(10px)',
                  fontSize: 14,
                  fontWeight: 700,
                  boxShadow: isSelected ? '0 4px 12px rgba(53, 132, 96, 0.3)' : 'var(--shadow-sm)',
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

      {/* Hero Section - Matching Budget Summary Card */}
      <section style={{ padding: '24px 20px' }} className="dashboard-max-width">
        <div style={{ 
          background: 'var(--color-primary)', 
          borderRadius: 24, 
          padding: '24px', 
          boxShadow: '0 12px 24px rgba(53, 132, 96, 0.2)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <p style={{ fontSize: 11, fontWeight: 900, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>RÉCAPITULATIF GROUPE</p>
          <h1 style={{ fontSize: 42, fontWeight: 900, margin: '8px 0', color: '#ffffff' }}>
            {groupTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span style={{ fontSize: 20, opacity: 0.6 }}>€</span>
          </h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)', padding: '6px 14px', borderRadius: 100, fontSize: 12, fontWeight: 800, marginTop: 8, color: '#ffffff' }}>
            <span className="material-icons-round" style={{ fontSize: 16 }}>account_balance</span>
            {members.length} membres actifs
          </div>
        </div>
      </section>

      {/* Distribution Grid - Matching Budget Category Card style */}
      <section style={{ padding: '0 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, padding: '0 4px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap' }}>Répartition</h3>
          <div style={{ flex: 1, height: 1.5, background: 'var(--color-separator)' }}></div>
          <button onClick={() => setIsManageMembersOpen(true)} style={{ border: 'none', background: 'none', color: 'var(--color-primary)', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Gérer</button>
        </div>
        
        <div className="members-grid">
          {memberStats.map(u => (
            <div key={u.id} className="member-card">
              <div style={{ 
                width: 52, height: 52, borderRadius: 16, 
                background: `${getAvatarColor(u.name)}15`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 18, fontWeight: 900, color: getAvatarColor(u.name),
                border: `1.5px solid ${getAvatarColor(u.name)}33`
              }}>
                {getInitials(u.name)}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>{u.name}</h4>
                <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', margin: '2px 0 0' }}>{u.paid.toLocaleString('fr-FR')} € payés</p>
                <div style={{ 
                  marginTop: 8, fontSize: 11, fontWeight: 900, padding: '4px 10px', borderRadius: 8,
                  display: 'inline-block',
                  background: u.balance >= 0 ? 'var(--color-success-light)' : 'var(--color-danger-light)',
                  color: u.balance >= 0 ? 'var(--color-primary)' : 'var(--color-danger)',
                  textTransform: 'uppercase'
                }}>
                  {u.balance >= 0 ? `+${u.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : `${u.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .members-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px; }
        @media (max-width: 600px) { 
          .members-grid { grid-template-columns: 1fr 1fr; gap: 10px; } 
          .member-card { padding: 16px 12px; flex-direction: column; text-align: center; gap: 10px; border-radius: 16px; }
          .member-card > div:first-child { width: 44px !important; height: 44px !important; font-size: 16px !important; }
        }
        .member-card { 
          background: var(--color-surface); border-radius: 20px; padding: 20px; 
          border: 1px solid var(--color-border-light); 
          box-shadow: var(--shadow-sm); 
          display: flex; align-items: center; gap: 20px;
          transition: transform 0.2s;
        }
      `}</style>

      {/* Recent Feed - Matching Budget Category List style */}
      <section style={{ padding: '0 20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16, padding: '0 4px' }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap' }}>Dépenses récentes</h3>
          <div style={{ flex: 1, height: 1.5, background: 'var(--color-separator)' }}></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredTransactions.map(tx => (
            <div key={tx.id} style={{ 
              background: 'var(--color-surface)', padding: '14px 16px', borderRadius: 16, display: 'flex', alignItems: 'center', gap: 14, border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-xs)'
            }}>
              <div style={{ 
                width: 44, height: 44, borderRadius: 12, 
                background: tx.amount > 0 ? 'var(--color-success-light)' : 'var(--color-danger-light)', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', 
                color: tx.amount > 0 ? 'var(--color-success)' : 'var(--color-danger)' 
              }}>
                <span className="material-icons-round" style={{ fontSize: 20 }}>{tx.category || 'receipt_long'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: 'var(--color-text-primary)' }}>{tx.name}</h4>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--color-text-tertiary)', margin: '2px 0 0' }}>{tx.paid_by} • {new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 15, fontWeight: 900, margin: 0, color: 'var(--color-danger)' }}>{tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
                <button onClick={() => deleteTransaction(tx.id)} style={{ border: 'none', background: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer', marginTop: 4 }}>
                  <span className="material-icons-round" style={{ fontSize: 16 }}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
      </div>

      {/* FAB - Using material-icons-round */}
      {members.length > 0 && (
        <button onClick={() => setIsExpenseModalOpen(true)} style={{ position: 'fixed', bottom: 30, right: 24, width: 60, height: 60, borderRadius: 30, background: 'var(--color-primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 12px 24px rgba(53, 132, 96, 0.4)', cursor: 'pointer', zIndex: 1000 }}>
          <span className="material-icons-round" style={{ fontSize: 32 }}>add</span>
        </button>
      )}

      {/* --- MODALS --- */}
      {isManageMembersOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 24, width: '100%', maxWidth: 400, padding: 24, boxShadow: 'var(--shadow-lg)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 900 }}>Membres</h3>
              <button onClick={() => setIsManageMembersOpen(false)} style={{ border: 'none', background: 'none', color: 'var(--color-text-tertiary)', cursor: 'pointer' }}><span className="material-icons-round">close</span></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 20 }}>
              {members.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--color-text-tertiary)', padding: '20px 0' }}>Aucun membre</p> :
                members.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: 'var(--color-primary-bg)', borderRadius: 14 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: getAvatarColor(m.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 13 }}>{getInitials(m.name)}</div>
                    <span style={{ flex: 1, fontWeight: 800, fontSize: 14, color: 'var(--color-text-primary)' }}>{m.name}</span>
                    <button onClick={() => deleteMember(m.id)} style={{ border: 'none', background: 'none', color: 'var(--color-danger)', cursor: 'pointer' }}><span className="material-icons-round" style={{ fontSize: 20 }}>delete</span></button>
                  </div>
                ))
              }
            </div>

            <div style={{ borderTop: '1.5px solid var(--color-border-light)', paddingTop: 20 }}>
              <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--color-text-secondary)', textTransform: 'uppercase', marginBottom: 10, display: 'block' }}>RECRUTER</label>
              <div style={{ display: 'flex', gap: 10 }}>
                <input id="new-member-input" type="text" placeholder="Prénom..." style={{ flex: 1, padding: '12px 14px', borderRadius: 14, border: '1.5px solid var(--color-border)', outline: 'none', fontSize: 14, fontWeight: 600 }} onKeyDown={(e) => { if (e.key === 'Enter') { addMember(e.target.value); e.target.value = ''; } }} />
                <button onClick={() => { const i = document.getElementById('new-member-input'); addMember(i.value); i.value = ''; }} style={{ background: 'var(--color-primary)', border: 'none', color: 'white', padding: '0 16px', borderRadius: 12, fontWeight: 900, fontSize: 13, cursor: 'pointer' }}>OK</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isExpenseModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'var(--color-surface)', borderRadius: 24, width: '100%', maxWidth: 440, padding: 24, boxShadow: 'var(--shadow-lg)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 18, fontWeight: 900 }}>Dépense Commune</h3>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); addExpense({ name: fd.get('name'), amount: parseFloat(fd.get('amount')), paidBy: fd.get('paidBy'), category: fd.get('category'), date: fd.get('date'), accountingPeriod: fd.get('accountingPeriod') }); }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>DATE D'ACHAT</label>
                  <input name="date" type="date" defaultValue={new Date().toISOString().split('T')[0]} required style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--color-border)', outline: 'none', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>MOIS COMPTABILITÉ</label>
                  <select name="accountingPeriod" defaultValue={selectedPeriod} required style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', outline: 'none', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)' }}>
                    {forecasts.map(f => <option key={f.id} value={f.id}>{f.month.toUpperCase()}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>INTITULÉ</label>
                <input name="name" type="text" placeholder="Ex: Restaurant" required style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--color-border)', outline: 'none', fontSize: 14, fontWeight: 600 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>MONTANT (€)</label>
                  <input name="amount" type="number" step="0.01" placeholder="0.00" required style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--color-border)', outline: 'none', fontSize: 14, fontWeight: 800 }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 6 }}>PAYEUR</label>
                  <select name="paidBy" required style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '1.5px solid var(--color-border)', background: 'var(--color-surface)', outline: 'none', fontSize: 14, fontWeight: 600 }}>
                    {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 11, fontWeight: 900, color: 'var(--color-text-secondary)', display: 'block', marginBottom: 10 }}>CATÉGORIE</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
                  {CATEGORIES.map(c => (
                    <label key={c.id} onClick={() => setModalCategory(c.icon)} style={{ 
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, padding: '10px 4px', borderRadius: 12, 
                      border: '1.5px solid',
                      borderColor: modalCategory === c.icon ? 'var(--color-primary)' : 'var(--color-border-light)',
                      background: modalCategory === c.icon ? 'var(--color-primary-bg)' : 'transparent',
                      color: modalCategory === c.icon ? 'var(--color-primary)' : 'inherit',
                      transition: 'all 0.2s'
                    }}>
                      <input type="radio" name="category" value={c.icon} checked={modalCategory === c.icon} onChange={() => {}} style={{ display: 'none' }} />
                      <span className="material-icons-round" style={{ fontSize: 20 }}>{c.icon}</span>
                      <span style={{ fontSize: 10, fontWeight: 700 }}>{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} style={{ flex: 1, padding: 14, borderRadius: 12, background: 'var(--color-bg)', border: 'none', color: 'var(--color-text-tertiary)', fontWeight: 800, cursor: 'pointer' }}>Annuler</button>
                <button type="submit" style={{ flex: 1, padding: 14, borderRadius: 12, background: 'var(--color-primary)', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer' }}>Valider</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedExpenses;
