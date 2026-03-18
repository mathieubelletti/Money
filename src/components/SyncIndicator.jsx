import React from 'react';
import { useData } from '../context/DataContext';

const SyncIndicator = () => {
  const { syncStatus } = useData();

  if (syncStatus === 'idle') return null;

  const getStatusConfig = () => {
    switch (syncStatus) {
      case 'syncing':
        return { 
          icon: 'sync', 
          color: 'var(--color-primary)', 
          label: 'Synchronisation...',
          animate: 'spin 2s linear infinite'
        };
      case 'success':
        return { 
          icon: 'cloud_done', 
          color: '#10b981', 
          label: 'Sauvegardé',
          animate: 'none'
        };
      case 'error':
        return { 
          icon: 'cloud_off', 
          color: '#ef4444', 
          label: 'Erreur de sync',
          animate: 'shake 0.5s ease-in-out'
        };
      default:
        return null;
    }
  };

  const config = getStatusConfig();
  if (!config) return null;

  return (
    <div className="sync-indicator animate-fade-in" style={{
      position: 'fixed',
      top: 12,
      right: 12,
      zIndex: 9999,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
      padding: '6px 10px',
      background: 'rgba(255, 255, 255, 0.9)',
      backdropFilter: 'blur(8px)',
      borderRadius: 20,
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      fontSize: 10,
      fontWeight: 600,
      color: 'var(--color-text-secondary)',
      pointerEvents: 'none',
      border: `1px solid ${config.color}20`
    }}>
      <span className="material-symbols-outlined" style={{ 
        fontSize: 14, 
        color: config.color,
        animation: config.animate
      }}>
        {config.icon}
      </span>
      <span>{config.label}</span>
      <style>{`
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-2px); }
          75% { transform: translateX(2px); }
        }
        .animate-fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
};

export default SyncIndicator;
