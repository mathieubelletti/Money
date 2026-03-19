import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../supabase';
import { useData } from '../context/DataContext';

const PageHeader = ({ title, onBack }) => {
  const { session } = useData();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

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
      <div className="header-menu-container" ref={menuRef}>
        <div 
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <span className="material-icons-round" style={{ fontSize: 24, color: 'var(--color-text-primary)' }}>
            menu
          </span>
        </div>

        {isMenuOpen && (
          <div className="header-dropdown">
            <div style={{ padding: '12px 16px 8px', borderBottom: '1px solid var(--color-border-light)' }}>
              <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontWeight: 800, textTransform: 'uppercase', marginBottom: 2 }}>Compte Connecté</div>
              <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-primary)', overflow: 'hidden', textOverflow: 'ellipsis' }}>{session?.user?.email}</div>
            </div>
            <button className="header-dropdown-item" style={{ marginTop: 4 }} onClick={() => {
              if (onBack) onBack();
              else window.location.reload();
              setIsMenuOpen(false);
            }}>
              <span className="material-icons-round">home</span>
              Retour à l'accueil
            </button>
            <div className="header-dropdown-divider"></div>
            <button className="header-dropdown-item danger" onClick={() => {
              handleLogout();
              setIsMenuOpen(false);
            }}>
              <span className="material-icons-round">logout</span>
              Se déconnecter
            </button>
          </div>
        )}
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

      <div 
        onClick={() => setIsMenuOpen(!isMenuOpen)}
        style={{ 
          width: 36, 
          height: 36, 
          borderRadius: '50%', 
          overflow: 'hidden',
          border: '1px solid var(--color-border)',
          cursor: 'pointer'
        }}
      >
        <img 
          src={session?.user?.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${session?.user?.email}`} 
          alt="Avatar" 
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      </div>
    </header>
  );
};

export default PageHeader;
