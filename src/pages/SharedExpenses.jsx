import React, { useState } from 'react';

const SharedExpenses = ({ onBack }) => {
  const [transactions] = useState([
    { id: 1, name: 'Courses Hebdomadaires', category: 'shopping_cart', amount: -142.30, date: 'Hier', merchant: 'Carrefour', paidBy: 'Marc' },
    { id: 2, name: 'Dîner Italien', category: 'restaurant', amount: -68.00, date: '12 Juil.', merchant: 'L\'Osteria', paidBy: 'Julie' },
    { id: 3, name: 'Loyer Juillet', category: 'home', amount: -950.00, date: '01 Juil.', merchant: 'Gestion Immob.', paidBy: 'Marc' },
    { id: 4, name: 'Facture Électricité', category: 'bolt', amount: -85.20, date: '28 Juin', merchant: 'EDF', paidBy: 'Julie' },
  ]);

  const groupTotal = 1245.50;
  const trend = "+12%";

  const users = [
    { 
      name: 'Marc', 
      paid: 850.00, 
      status: 'Doit recevoir 227,25 €', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Marc',
      isOwed: true
    },
    { 
      name: 'Julie', 
      paid: 395.50, 
      status: 'Doit 227,25 €', 
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Julie',
      isOwed: false
    }
  ];

  return (
    <div className="screen shared-expenses-view" style={{ background: '#f8fafc', minHeight: '100vh', paddingBottom: 100 }}>
      {/* Header */}
      <header style={{ 
        padding: '20px 24px', 
        background: 'white', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'space-between',
        borderBottom: '1px solid var(--color-border-light)',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <span className="material-icons-round">arrow_back</span>
        </button>
        <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Dépenses Communes</h2>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
          <span className="material-icons-round">group_add</span>
        </button>
      </header>

      {/* Hero Card */}
      <section style={{ padding: '24px' }}>
        <div style={{ 
          background: 'linear-gradient(135deg, #10b981 0%, #34d399 100%)', 
          borderRadius: 24, 
          padding: '24px', 
          color: 'white',
          boxShadow: '0 10px 25px -5px rgba(16, 185, 129, 0.3)'
        }}>
          <p style={{ fontSize: 13, fontWeight: 700, opacity: 0.9, textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
            Total du Groupe - Juillet
          </p>
          <h1 style={{ fontSize: 42, fontWeight: 900, margin: '12px 0', letterSpacing: '-0.02em' }}>
            {groupTotal.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} <span style={{ fontSize: 24 }}>€</span>
          </h1>
          <div style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: 6, 
            background: 'rgba(255,255,255,0.2)', 
            padding: '6px 12px', 
            borderRadius: 100,
            fontSize: 13,
            fontWeight: 700
          }}>
            <span className="material-icons-round" style={{ fontSize: 16 }}>trending_up</span>
            {trend} par rapport au mois dernier
          </div>
        </div>
      </section>

      {/* Allocation Mapping */}
      <section style={{ padding: '0 24px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
          <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Répartition</h3>
          <button style={{ background: 'none', border: 'none', color: 'var(--color-primary)', fontWeight: 700, fontSize: 14 }}>Détails</button>
        </div>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {users.map(u => (
            <div key={u.name} style={{ 
              background: 'white', 
              borderRadius: 24, 
              padding: 20, 
              border: '1px solid var(--color-border-light)',
              boxShadow: 'var(--shadow-sm)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
              gap: 12
            }}>
              <img src={u.avatar} alt={u.name} style={{ width: 48, height: 48, borderRadius: 16, border: '2px solid #f1f5f9' }} />
              <div>
                <h4 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>{u.name}</h4>
                <p style={{ fontSize: 13, fontWeight: 700, color: '#10b981', margin: '4px 0 0' }}>A payé {u.paid.toLocaleString('fr-FR')} €</p>
                <p style={{ 
                  fontSize: 12, 
                  fontWeight: 600, 
                  color: u.isOwed ? '#64748b' : '#f97316', 
                  margin: '8px 0 0',
                  opacity: 0.8
                }}>
                  {u.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Transactions List */}
      <section style={{ padding: '0 24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
           <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>Transactions récentes</h3>
           <button style={{ background: 'none', border: 'none', color: '#64748b' }}>
             <span className="material-icons-round">filter_list</span>
           </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {transactions.map(tx => (
            <div key={tx.id} style={{ 
              background: 'white', 
              padding: 16, 
              borderRadius: 20,
              display: 'flex', 
              alignItems: 'center', 
              gap: 16,
              boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
            }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: 24, 
                background: tx.paidBy === 'Marc' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(236, 72, 153, 0.1)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: tx.paidBy === 'Marc' ? '#3b82f6' : '#ec4899'
              }}>
                <span className="material-icons-round">{tx.category}</span>
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#1e293b' }}>{tx.name}</h4>
                <p style={{ fontSize: 12, color: '#64748b', margin: '2px 0 0' }}>{tx.merchant} • {tx.date}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: 15, fontWeight: 800, margin: 0, color: '#1e293b' }}>
                  {tx.amount.toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
                </p>
                <p style={{ fontSize: 11, fontStyle: 'italic', margin: '2px 0 0', color: '#94a3b8' }}>
                  Payé par {tx.paidBy}
                </p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* FAB */}
      <button style={{ 
        position: 'fixed', 
        bottom: 100, 
        right: 24, 
        width: 64, height: 64, 
        borderRadius: 32, 
        background: 'var(--color-primary)', 
        color: 'white',
        border: 'none',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: '0 6px 20px rgba(16, 185, 129, 0.4)',
        cursor: 'pointer',
        zIndex: 1000
      }}>
        <span className="material-icons-round" style={{ fontSize: 32 }}>add</span>
      </button>
    </div>
  );
};

export default SharedExpenses;
