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
      <div className="header-menu-container">
        <div 
          style={{ display: 'flex', alignItems: 'center', cursor: 'pointer' }}
          onClick={() => {
            if (onBack) onBack();
            else if (typeof window !== 'undefined') window.location.reload();
          }}
        >
          <span className="material-icons-round" style={{ fontSize: 24, color: 'var(--color-primary)' }}>
            home
          </span>
        </div>
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
