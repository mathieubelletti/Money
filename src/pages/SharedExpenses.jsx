import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { useData } from '../context/DataContext';

const SharedExpenses = ({ onBack }) => {
  const { session } = useData();
  const userId = session?.user?.id;

  const [members, setMembers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isManageMembersOpen, setIsManageMembersOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

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
    const colors = ['#6366f1', '#8b5cf6', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#22c55e', '#06b6d4', '#3b82f6'];
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
    { id: 'receipt_long', label: 'Autre', icon: 'receipt_long' }
  ];

  // --- Calculations ---
  const groupTotal = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
  const individualShare = members.length > 0 ? groupTotal / members.length : 0;

  const memberStats = members.map(m => {
    const paid = transactions
      .filter(tx => tx.paid_by === m.name)
      .reduce((sum, tx) => sum + Math.abs(tx.amount || 0), 0);
    const balance = paid - individualShare;
    return { ...m, paid, balance };
  });

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
    const newTx = {
      user_id: userId,
      name: formData.name,
      amount: -Math.abs(formData.amount),
      paid_by: formData.paidBy,
      category: formData.category,
      date: new Date().toISOString().split('T')[0]
    };
    const { data, error } = await supabase.from('shared_transactions').insert([newTx]).select();
    if (!error && data) setTransactions([data[0], ...transactions]);
    setIsExpenseModalOpen(false);
  };

  const deleteTransaction = async (id) => {
    const { error } = await supabase.from('shared_transactions').delete().eq('id', id);
    if (!error) setTransactions(transactions.filter(tx => tx.id !== id));
  };

  if (loading) {
     return (
       <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f8fafc' }}>
         <div className="spinner"></div>
         <style>{`.spinner { width: 40px; height: 40px; border: 4px solid #e2e8f0; border-top: 4px solid var(--color-primary); border-radius: 50%; animation: spin 1s linear infinite; } @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
       </div>
     );
  }

  return (
    <div className="screen shared-expenses-view" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 120, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* Header */}
      <header style={{ 
        padding: '16px 20px', 
        background: 'rgba(255,255,255,0.85)', 
        backdropFilter: 'blur(12px)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', color: '#1e293b' }}>
          <span className="material-symbols-outlined" style={{ fontWeight: 300 }}>arrow_back_ios_new</span>
        </button>
        <h2 style={{ fontSize: 16, fontWeight: 800, color: '#1e293b', margin: 0, letterSpacing: '-0.01em' }}>Dépenses Communes</h2>
        <button onClick={() => setIsManageMembersOpen(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', color: 'var(--color-primary)' }}>
          <span className="material-symbols-outlined" style={{ fontWeight: 400 }}>settings_suggest</span>
        </button>
      </header>

      {/* Hero */}
      <section style={{ padding: '24px 20px' }}>
        <div style={{ 
          background: 'linear-gradient(145deg, #10b981 0%, #065f46 100%)', 
          borderRadius: 32, 
          padding: '32px', 
          color: 'white',
          boxShadow: '0 25px 50px -12px rgba(16, 185, 129, 0.3)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'absolute', bottom: -50, left: -50, width: 180, height: 180, borderRadius: 90, background: 'rgba(255,255,255,0.05)' }}></div>
          <p style={{ fontSize: 13, fontWeight: 700, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.12em', margin: 0 }}>Récapitulatif Groupe</p>
          <h1 style={{ fontSize: 48, fontWeight: 900, margin: '12px 0', letterSpacing: '-0.04em' }}>
            {groupTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span style={{ fontSize: 24, opacity: 0.7 }}>€</span>
          </h1>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(255,255,255,0.12)', padding: '8px 16px', borderRadius: 100, fontSize: 13, fontWeight: 700, marginTop: 12 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, fontWeight: 300 }}>finance_chip</span>
            {members.length} membres actifs
          </div>
        </div>
      </section>

      {/* Member Chips (Distribution Cards Upgrade) */}
      <section style={{ padding: '0 20px 32px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>Répartition</h3>
          <button onClick={() => setIsManageMembersOpen(true)} style={{ border: 'none', background: 'none', color: '#6366f1', fontSize: 13, fontWeight: 800, cursor: 'pointer' }}>Gérer</button>
        </div>
        
        <div className="members-grid">
          {memberStats.map(u => (
            <div key={u.id} className="member-card">
              <div style={{ 
                width: 60, height: 60, borderRadius: 20, 
                background: getAvatarColor(u.name),
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 22, fontWeight: 800, color: 'white',
                boxShadow: `0 8px 16px -4px ${getAvatarColor(u.name)}44`
              }}>
                {getInitials(u.name)}
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{u.name}</h4>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#64748b', margin: '2px 0 0' }}>{u.paid.toLocaleString('fr-FR')} € payés</p>
                <div style={{ 
                  marginTop: 10, fontSize: 12, fontWeight: 800, padding: '6px 12px', borderRadius: 10,
                  display: 'inline-block',
                  background: u.balance >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(249, 115, 22, 0.08)',
                  color: u.balance >= 0 ? '#10b981' : '#f97316'
                }}>
                  {u.balance >= 0 ? `+${u.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €` : `${u.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      <style>{`
        .members-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px; }
        @media (max-width: 650px) { .members-grid { grid-template-columns: 1fr; gap: 12px; } }
        .member-card { 
          background: white; border-radius: 28px; padding: 24px; border: 1px solid #f1f5f9; 
          box-shadow: 0 4px 20px -4px rgba(0,0,0,0.03); display: flex; alignItems: center; gap: 24px;
        }
      `}</style>

      {/* Recent Feed */}
      <section style={{ padding: '0 20px' }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: '0 0 16px 4px' }}>Dépenses récentes</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {transactions.map(tx => (
            <div key={tx.id} style={{ 
              background: '#ffffff', padding: '16px 20px', borderRadius: 24, display: 'flex', alignItems: 'center', gap: 16, border: '1px solid #f1f5f9', boxShadow: '0 2px 8px rgba(0,0,0,0.02)'
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 16, background: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 22, fontWeight: 300 }}>{tx.category || 'receipt_long'}</span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#1e293b' }}>{tx.name}</h4>
                <p style={{ fontSize: 12, fontWeight: 600, color: '#94a3b8', margin: '2px 0 0' }}>{tx.paid_by} • {new Date(tx.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 16, fontWeight: 900, margin: 0, color: '#0f172a' }}>{tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €</p>
                <button onClick={() => deleteTransaction(tx.id)} style={{ border: 'none', background: 'none', color: '#cbd5e1', cursor: 'pointer', marginTop: 4 }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>delete</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Modern FAB */}
      {members.length > 0 && (
        <button onClick={() => setIsExpenseModalOpen(true)} style={{ position: 'fixed', bottom: 30, right: 30, width: 64, height: 64, borderRadius: 32, background: 'var(--color-primary)', color: 'white', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 16px 32px rgba(16, 185, 129, 0.4)', cursor: 'pointer', zIndex: 1000 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 32, fontWeight: 300 }}>add</span>
        </button>
      )}

      {/* --- MODALS (Enhanced Styles) --- */}
      {isManageMembersOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 32, width: '100%', maxWidth: 420, padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em' }}>Membres du groupe</h3>
              <button onClick={() => setIsManageMembersOpen(false)} style={{ border: 'none', background: 'none', color: '#64748b', cursor: 'pointer' }}><span className="material-symbols-outlined">close</span></button>
            </div>
            
            <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14, paddingRight: 4, marginBottom: 24 }}>
              {members.length === 0 ? <p style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0' }}>Aucun membre enregistré</p> :
                members.map(m => (
                  <div key={m.id} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '12px 16px', background: '#f8fafc', borderRadius: 20 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 12, background: getAvatarColor(m.name), display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 800, fontSize: 14 }}>{getInitials(m.name)}</div>
                    <span style={{ flex: 1, fontWeight: 700, fontSize: 15, color: '#1e293b' }}>{m.name}</span>
                    <button onClick={() => deleteMember(m.id)} style={{ border: 'none', background: 'none', color: '#ef4444', cursor: 'pointer' }}><span className="material-symbols-outlined" style={{ fontSize: 20 }}>delete</span></button>
                  </div>
                ))
              }
            </div>

            <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: 24 }}>
              <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 12 }}>Nouveau participant</label>
              <div style={{ display: 'flex', gap: 12 }}>
                <input id="new-member-input" type="text" placeholder="Prénom..." style={{ flex: 1, padding: '14px 18px', borderRadius: 16, border: '2px solid #f1f5f9', outline: 'none', fontSize: 15, fontWeight: 600 }} onKeyDown={(e) => { if (e.key === 'Enter') { addMember(e.target.value); e.target.value = ''; } }} />
                <button onClick={() => { const i = document.getElementById('new-member-input'); addMember(i.value); i.value = ''; }} style={{ background: '#1e293b', border: 'none', color: 'white', padding: '0 20px', borderRadius: 16, fontWeight: 800, fontSize: 14, cursor: 'pointer' }}>Ajouter</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isExpenseModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(8px)', zIndex: 10002, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 32, width: '100%', maxWidth: 440, padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 24px', fontSize: 24, fontWeight: 900, letterSpacing: '-0.02em' }}>Nouvelle dépense</h3>
            <form onSubmit={(e) => { e.preventDefault(); const fd = new FormData(e.target); addExpense({ name: fd.get('name'), amount: parseFloat(fd.get('amount')), paidBy: fd.get('paidBy'), category: fd.get('category') }); }}>
              <div style={{ marginBottom: 20 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 8 }}>LIBELLÉ</label>
                <input name="name" type="text" placeholder="Ex: Restaurant" required style={{ width: '100%', padding: '14px 18px', borderRadius: 16, border: '2px solid #f1f5f9', outline: 'none', fontSize: 15, fontWeight: 600 }} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 20 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 8 }}>MONTANT (€)</label>
                  <input name="amount" type="number" step="0.01" placeholder="0.00" required style={{ width: '100%', padding: '14px 18px', borderRadius: 16, border: '2px solid #f1f5f9', outline: 'none', fontSize: 16, fontWeight: 800 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 8 }}>PAYÉ PAR</label>
                  <select name="paidBy" required style={{ width: '100%', padding: '14px 18px', borderRadius: 16, border: '2px solid #f1f5f9', background: 'white', outline: 'none', fontSize: 15, fontWeight: 600 }}>
                    {members.map(m => <option key={m.id} value={m.name}>{m.name}</option>)}
                  </select>
                </div>
              </div>
              <div style={{ marginBottom: 32 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 12 }}>CATÉGORIE</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {CATEGORIES.map(c => (
                    <label key={c.id} style={{ 
                      cursor: 'pointer', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '12px 8px', borderRadius: 16, border: '2px solid #f1f5f9', transition: 'all 0.2s'
                    }}>
                      <input type="radio" name="category" value={c.icon} defaultChecked={c.id === 'receipt_long'} style={{ display: 'none' }} />
                      <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{c.icon}</span>
                      <span style={{ fontSize: 11, fontWeight: 700 }}>{c.label}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 16 }}>
                <button type="button" onClick={() => setIsExpenseModalOpen(false)} style={{ flex: 1, padding: 18, borderRadius: 18, background: '#f1f5f9', border: 'none', color: '#64748b', fontWeight: 800, cursor: 'pointer' }}>Annuler</button>
                <button type="submit" style={{ flex: 1, padding: 18, borderRadius: 18, background: 'var(--color-primary)', border: 'none', color: 'white', fontWeight: 800, cursor: 'pointer' }}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedExpenses;
