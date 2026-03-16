import React, { useState } from 'react';
import { transactions, txFilters } from '../data/mockData';
import BankLogo from '../components/BankLogo';
import { formatAmount } from '../utils/helpers';

const Transactions = () => {
  const [activeFilter, setActiveFilter] = useState('Tous');

  const filteredGroups = transactions
    .map(group => ({
      ...group,
      items: activeFilter === 'Tous'
        ? group.items
        : group.items.filter(tx => tx.category === activeFilter),
    }))
    .filter(group => group.items.length > 0);

  return (
    <div className="screen animate-fade">
      {/* Header */}
      <header 
        style={{ 
          background: 'var(--color-bg)', 
          padding: '16px 20px 12px', 
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}
      >
        <span className="material-icons-round" style={{ fontSize: 24, cursor: 'pointer' }}>menu</span>
        <h2 style={{ fontSize: 18, fontWeight: 800 }}>Transactions</h2>
        <div style={{ 
          width: 40, 
          height: 40, 
          borderRadius: '50%', 
          background: 'rgba(46, 204, 112, 0.12)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          cursor: 'pointer'
        }}>
          <span className="material-icons-round" style={{ color: 'var(--color-primary)', fontSize: 22 }}>notifications</span>
        </div>
      </header>

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
        {txFilters.filter(f => f !== 'Tous').map(cat => (
          <button
            key={cat}
            className="flex items-center gap-2"
            style={{ 
              height: 44, 
              padding: '0 20px', 
              borderRadius: 22, 
              background: 'white',
              color: 'var(--color-text-primary)',
              border: '1px solid var(--color-border-light)',
              fontSize: 14,
              fontWeight: 600,
              whiteSpace: 'nowrap'
            }}
          >
            <span className="material-icons-round" style={{ fontSize: 18 }}>
              {cat === 'Alimentation' ? 'restaurant' : 
               cat === 'Loyer' ? 'home' : 
               cat === 'Loisirs' ? 'sports_esports' : 'category'}
            </span>
            {cat}
          </button>
        ))}
      </div>

      {/* Transactions List */}
      <div className="screen-content-centered" style={{ padding: '0 16px' }}>
        {filteredGroups.map(group => (
          <div key={group.id} className="animate-slide-up" style={{ marginBottom: 24 }}>
            <div className="tx-date-container" style={{ padding: '0 4px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span className="tx-date-label" style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.02em' }}>{group.date}</span>
              <span className="tx-date-value" style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', opacity: 0.6 }}>
                {group.dateOrder === 0 ? '12 Oct. 2023' : group.dateOrder === 1 ? '11 Oct. 2023' : '14 mars 2024'}
              </span>
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
                <div key={tx.id} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '16px 0',
                  borderBottom: index === group.items.length - 1 ? 'none' : '1px solid var(--color-border-light)'
                }}>
                  <div style={{ marginRight: 16 }}>
                    <BankLogo 
                      domain={tx.domain} 
                      name={tx.name} 
                      size={44} 
                      bg={tx.bg} 
                      color={tx.color}
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
                    <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 600, marginTop: 4 }}>{tx.account}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
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
          boxShadow: '0 4px 12px rgba(46, 204, 112, 0.4)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          pointerEvents: 'auto',
          transition: 'transform 0.2s',
        }}
        onPointerDown={(e) => e.currentTarget.style.transform = 'scale(0.9)'}
        onPointerUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          <span className="material-icons-round" style={{ fontSize: 32 }}>add</span>
        </button>
      </div>
    </div>
  );
};

export default Transactions;
