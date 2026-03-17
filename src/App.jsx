import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Previsions from './pages/Previsions';
import Auth from './pages/Auth';
import Hub from './pages/Hub';
import BottomNav from './components/BottomNav';
import { useData } from './context/DataContext';
import { supabase } from './supabase';
import './index.css';

const BUDGET_SCREENS = {
  dashboard: Dashboard,
  transactions: Transactions,
  budget: Budget,
  previsions: Previsions,
};

function App() {
  const { session, loading } = useData();
  const [appMode, setAppMode] = useState('hub'); // 'hub' or 'budget'
  const [activeTab, setActiveTab] = useState('dashboard');

  useEffect(() => {
    if (!session) {
      setAppMode('hub');
    }
  }, [session]);

  if (!session) {
    return <Auth />;
  }

  if (appMode === 'hub') {
    return (
      <div className="app-container">
        <Hub onEnterBudget={() => setAppMode('budget')} />
        <BottomNav mode="hub" activeTab="accueil" setActiveTab={() => {}} />
      </div>
    );
  }

  const ActiveScreen = BUDGET_SCREENS[activeTab];

  if (loading) {
    return (
      <div style={{ 
        height: '100vh', display: 'flex', alignItems: 'center', 
        justifyContent: 'center', background: 'var(--color-bg)',
        flexDirection: 'column', gap: 16
      }}>
        <div className="spinner" style={{ 
          width: 40, height: 40, border: '4px solid var(--color-primary-glass)', 
          borderTopColor: 'var(--color-primary)', borderRadius: '50%',
          animation: 'spin 1s linear infinite'
        }} />
        <p style={{ color: 'var(--color-text-secondary)', fontWeight: 600 }}>Chargement de vos données...</p>
      </div>
    );
  }

  return (
    <div className="app-container">
      <ActiveScreen key={activeTab} onBackToHub={() => setAppMode('hub')} />
      <BottomNav mode="budget" activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
