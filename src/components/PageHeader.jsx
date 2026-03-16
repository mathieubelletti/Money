import React from 'react';

const PageHeader = ({ title }) => {
  return (
    <header style={{ 
      position: 'sticky', 
      top: 0, 
      zIndex: 60, 
      background: 'var(--color-bg)', 
      padding: '16px 20px 12px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
        <span className="material-icons-round" style={{ fontSize: 24, color: 'var(--color-text-primary)' }}>menu</span>
      </div>

      <h2 style={{ 
        fontSize: 18, 
        fontWeight: 800, 
        color: 'var(--color-text-primary)', 
        margin: 0,
        position: 'absolute',
        left: '50%',
        transform: 'translateX(-50%)',
        whiteSpace: 'nowrap'
      }}>
        {title}
      </h2>

      <div style={{ 
        width: 40, 
        height: 40, 
        borderRadius: '50%', 
        background: 'var(--color-primary-glass)', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        cursor: 'pointer'
      }}>
        <span className="material-icons-round" style={{ color: 'var(--color-primary)', fontSize: 22 }}>notifications</span>
      </div>
    </header>
  );
};

export default PageHeader;
