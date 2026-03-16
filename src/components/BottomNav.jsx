import React from 'react';

const BottomNav = ({ activeTab, setActiveTab }) => {
  const items = [
    { id: 'dashboard', label: 'Synthèse', icon: 'grid_view' },
    { id: 'transactions', label: 'Analyses', icon: 'pie_chart' },
    { id: 'budget', label: 'Budget', icon: 'account_balance_wallet' },
    { id: 'previsions', label: 'Prévisions', icon: 'trending_up' },
  ];

  return (
    <nav style={{
      position: 'fixed',
      bottom: 0,
      left: '50%',
      transform: 'translateX(-50%)',
      width: '100%',
      maxWidth: 1200,
      borderTop: '1px solid var(--color-border-light)',
      background: 'rgba(255, 255, 255, 0.8)',
      backdropFilter: 'blur(12px)',
      padding: '8px 16px 24px',
      zIndex: 100,
      display: 'flex',
      justifyContent: 'center'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-around',
        maxWidth: 480,
        width: '100%',
        height: '100%'
      }}>
        {items.map(item => (
          <button
            key={item.id}
            style={{ 
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              border: 'none', 
              background: 'none', 
              flex: 1, 
              cursor: 'pointer',
              color: activeTab === item.id ? 'var(--color-primary)' : 'var(--color-text-tertiary)',
              transition: 'all 0.2s ease'
            }}
            onClick={() => setActiveTab(item.id)}
          >
            <div style={{ display: 'flex', height: 32, alignItems: 'center', justifyContent: 'center' }}>
              <span className="material-icons-round" style={{ 
                fontSize: 24,
                fontVariationSettings: activeTab === item.id ? "'FILL' 1" : "'FILL' 0" 
              }}>
                {item.icon}
              </span>
            </div>
            <p style={{ 
              fontSize: 10, 
              fontWeight: activeTab === item.id ? 800 : 600,
              margin: 0
            }}>{item.label}</p>
          </button>
        ))}
      </div>
    </nav>
  );
};

export default BottomNav;
