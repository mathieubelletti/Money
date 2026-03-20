import React, { useState, useEffect } from 'react';

const SharedExpenses = ({ onBack }) => {
  // --- Persistent State ---
  const [members, setMembers] = useState(() => {
    const saved = localStorage.getItem('money_shared_members');
    return saved ? JSON.parse(saved) : [];
  });

  const [transactions, setTransactions] = useState(() => {
    const saved = localStorage.getItem('money_shared_transactions');
    return saved ? JSON.parse(saved) : [];
  });

  const [isMemberModalOpen, setIsMemberModalOpen] = useState(false);
  const [isExpenseModalOpen, setIsExpenseModalOpen] = useState(false);

  // --- Persistence ---
  useEffect(() => {
    localStorage.setItem('money_shared_members', JSON.stringify(members));
  }, [members]);

  useEffect(() => {
    localStorage.setItem('money_shared_transactions', JSON.stringify(transactions));
  }, [transactions]);

  // --- Calculations ---
  const groupTotal = transactions.reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  const individualShare = members.length > 0 ? groupTotal / members.length : 0;

  const memberStats = members.map(m => {
    const paid = transactions
      .filter(tx => tx.paidBy === m.name)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
    const balance = paid - individualShare;
    return { ...m, paid, balance };
  });

  // --- Handlers ---
  const addMember = (name) => {
    if (!name) return;
    const newMember = {
      id: Date.now(),
      name,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${name}${Date.now()}`
    };
    setMembers([...members, newMember]);
    setIsMemberModalOpen(false);
  };

  const addExpense = (data) => {
    const newTx = {
      id: Date.now(),
      ...data,
      date: new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
      amount: -Math.abs(data.amount) // Always negative for expenses display
    };
    setTransactions([newTx, ...transactions]);
    setIsExpenseModalOpen(false);
  };

  const deleteTransaction = (id) => {
    setTransactions(transactions.filter(tx => tx.id !== id));
  };

  return (
    <div className="screen shared-expenses-view" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 120, fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      {/* Header */}
      <header style={{ 
        padding: '16px 20px', 
        background: 'rgba(255,255,255,0.8)', 
        backdropFilter: 'blur(10px)',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', color: '#1e293b' }}>
          <span className="material-icons-round">arrow_back</span>
        </button>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: '#1e293b', margin: 0 }}>Dépenses Communes</h2>
        <button 
          onClick={() => setIsMemberModalOpen(true)}
          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', color: 'var(--color-primary)' }}
        >
          <span className="material-icons-round">person_add</span>
        </button>
      </header>

      {/* Hero Card */}
      <section style={{ padding: '20px' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', 
          borderRadius: 28, 
          padding: '24px', 
          color: 'white',
          boxShadow: '0 20px 40px -12px rgba(16, 185, 129, 0.35)',
          position: 'relative',
          overflow: 'hidden'
        }}>
          {/* Decorative background circle */}
          <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: 70, background: 'rgba(255,255,255,0.1)' }}></div>
          
          <p style={{ fontSize: 12, fontWeight: 700, opacity: 0.85, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0 }}>
            Total du Groupe - Mars
          </p>
          <h1 style={{ fontSize: 44, fontWeight: 900, margin: '8px 0', letterSpacing: '-0.03em' }}>
            {groupTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span style={{ fontSize: 22, opacity: 0.8 }}>€</span>
          </h1>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6, 
            background: 'rgba(255,255,255,0.15)', 
            padding: '6px 14px', 
            borderRadius: 100,
            fontSize: 12,
            fontWeight: 700,
            marginTop: 8
          }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>trending_up</span>
            Stable par rapport au mois dernier
          </div>
        </div>
      </section>

      {/* Distribution Section */}
      <section style={{ padding: '0 20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, padding: '0 4px' }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: 0 }}>Répartition</h3>
          <span style={{ fontSize: 13, color: '#64748b', fontWeight: 600 }}>{members.length} membres</span>
        </div>
        
        {members.length === 0 ? (
          <div style={{ 
            background: 'white', border: '2px dashed #e2e8f0', borderRadius: 24, padding: '32px 20px', 
            textAlign: 'center', color: '#64748b' 
          }}>
            <span className="material-icons-round" style={{ fontSize: 32, marginBottom: 12, opacity: 0.5 }}>group_add</span>
            <p style={{ margin: 0, fontWeight: 600, fontSize: 14 }}>Ajoutez des amis pour commencer</p>
            <button 
              onClick={() => setIsMemberModalOpen(true)}
              style={{ marginTop: 12, background: 'var(--color-primary)', border: 'none', color: 'white', padding: '8px 16px', borderRadius: 12, fontWeight: 700, fontSize: 13, cursor: 'pointer' }}
            >
              Créer un profil
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 12 }}>
            {memberStats.map(u => (
              <div key={u.id} style={{ 
                background: 'white', 
                borderRadius: 24, 
                padding: '16px', 
                border: '1px solid rgba(0,0,0,0.03)',
                boxShadow: '0 4px 12px rgba(0,0,0,0.03)',
                display: 'flex',
                flexDirection: 'column',
                gap: 12
              }}>
                <img src={u.avatar} alt={u.name} style={{ width: 44, height: 44, borderRadius: 14, background: '#f1f5f9' }} />
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#1e293b' }}>{u.name}</h4>
                  <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-primary)', margin: '2px 0 0' }}>{u.paid.toLocaleString('fr-FR')} € payés</p>
                  <div style={{ 
                    marginTop: 8,
                    fontSize: 11, 
                    fontWeight: 800, 
                    color: u.balance >= 0 ? '#10b981' : '#f97316',
                    background: u.balance >= 0 ? 'rgba(16, 185, 129, 0.08)' : 'rgba(249, 115, 22, 0.08)',
                    padding: '4px 8px',
                    borderRadius: 6,
                    display: 'inline-block'
                  }}>
                    {u.balance >= 0 ? `+${u.balance.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} € à recevoir` : `Doit ${Math.abs(u.balance).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €`}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Transactions */}
      <section style={{ padding: '0 20px' }}>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1e293b', margin: '0 0 16px 4px' }}>Dépenses récentes</h3>
        
        {transactions.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', opacity: 0.5 }}>
            <span className="material-icons-round" style={{ fontSize: 40, marginBottom: 8 }}>receipt_long</span>
            <p style={{ fontSize: 14, margin: 0 }}>Aucune dépense enregistrée</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {transactions.map(tx => (
              <div key={tx.id} style={{ 
                background: 'white', 
                padding: '14px 16px', 
                borderRadius: 20,
                display: 'flex', 
                alignItems: 'center', 
                gap: 14,
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                border: '1px solid rgba(0,0,0,0.01)'
              }}>
                <div style={{ 
                  width: 44, height: 44, borderRadius: 22, 
                  background: 'rgba(16, 185, 129, 0.08)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'var(--color-primary)'
                }}>
                  <span className="material-icons-round" style={{ fontSize: 20 }}>{tx.category || 'receipt'}</span>
                </div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: 14, fontWeight: 800, margin: 0, color: '#1e293b' }}>{tx.name}</h4>
                  <p style={{ fontSize: 12, color: '#94a3b8', margin: '2px 0 0' }}>{tx.paidBy} • {tx.date}</p>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 15, fontWeight: 900, margin: 0, color: '#1e293b' }}>
                    {tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                  </p>
                  <button 
                    onClick={() => deleteTransaction(tx.id)}
                    style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: '4px 0 0' }}
                  >
                    <span className="material-icons-round" style={{ fontSize: 16 }}>delete</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* FAB */}
      {members.length > 0 && (
        <button 
          onClick={() => setIsExpenseModalOpen(true)}
          style={{ 
            position: 'fixed', 
            bottom: 30, 
            right: 20, 
            width: 60, height: 60, 
            borderRadius: 30, 
            background: 'var(--color-primary)', 
            color: 'white',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 12px 24px rgba(16, 185, 129, 0.4)',
            cursor: 'pointer',
            zIndex: 1000,
            transition: 'transform 0.2s'
          }}
        >
          <span className="material-icons-round" style={{ fontSize: 32 }}>add</span>
        </button>
      )}

      {/* --- ADD MEMBER MODAL --- */}
      {isMemberModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 28, width: '100%', maxWidth: 360, padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 20, fontWeight: 900 }}>Nouveau profil</h3>
            <label style={{ fontSize: 13, fontWeight: 700, color: '#64748b', display: 'block', marginBottom: 8 }}>PRÉNOM</label>
            <input 
              id="member-name-input"
              type="text" 
              placeholder="Ex: Marc, Julie..." 
              autoFocus
              onKeyDown={(e) => { if (e.key === 'Enter') addMember(e.target.value); }}
              style={{ width: '100%', padding: '14px 16px', borderRadius: 14, border: '2px solid #f1f5f9', outline: 'none', fontSize: 15, fontWeight: 600, marginBottom: 20 }}
            />
            <div style={{ display: 'flex', gap: 12 }}>
              <button 
                onClick={() => setIsMemberModalOpen(false)}
                style={{ flex: 1, padding: 14, borderRadius: 14, background: '#f1f5f9', border: 'none', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}
              >
                Annuler
              </button>
              <button 
                onClick={() => addMember(document.getElementById('member-name-input').value)}
                style={{ flex: 1, padding: 14, borderRadius: 14, background: 'var(--color-primary)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer' }}
              >
                Créer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- ADD EXPENSE MODAL --- */}
      {isExpenseModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div style={{ background: 'white', borderRadius: 28, width: '100%', maxWidth: 400, padding: 24, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }}>
            <h3 style={{ margin: '0 0 20px', fontSize: 20, fontWeight: 900 }}>Ajouter une dépense</h3>
            
            <form onSubmit={(e) => {
              e.preventDefault();
              const fd = new FormData(e.target);
              addExpense({
                name: fd.get('name'),
                amount: parseFloat(fd.get('amount')),
                paidBy: fd.get('paidBy'),
                category: 'receipt'
              });
            }}>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6 }}>LIBELLÉ</label>
                <input name="name" type="text" placeholder="Ex: Courses Carrefour" required style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '2px solid #f1f5f9', outline: 'none', fontSize: 14, fontWeight: 600 }} />
              </div>
              
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6 }}>MONTANT (€)</label>
                <input name="amount" type="number" step="0.01" placeholder="0.00" required style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '2px solid #f1f5f9', outline: 'none', fontSize: 16, fontWeight: 800 }} />
              </div>
              
              <div style={{ marginBottom: 24 }}>
                <label style={{ fontSize: 12, fontWeight: 800, color: '#64748b', display: 'block', marginBottom: 6 }}>PAYÉ PAR</label>
                <select name="paidBy" required style={{ width: '100%', padding: '12px 14px', borderRadius: 12, border: '2px solid #f1f5f9', background: 'white', outline: 'none', fontSize: 14, fontWeight: 600 }}>
                  {members.map(m => (
                    <option key={m.id} value={m.name}>{m.name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12 }}>
                <button 
                  type="button"
                  onClick={() => setIsExpenseModalOpen(false)}
                  style={{ flex: 1, padding: 14, borderRadius: 14, background: '#f1f5f9', border: 'none', color: '#64748b', fontWeight: 700, cursor: 'pointer' }}
                >
                  Annuler
                </button>
                <button 
                  type="submit"
                  style={{ flex: 1, padding: 14, borderRadius: 14, background: 'var(--color-primary)', border: 'none', color: 'white', fontWeight: 700, cursor: 'pointer' }}
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SharedExpenses;
