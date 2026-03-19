import React, { useState, useEffect } from 'react';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Previsions from './pages/Previsions';
import Auth from './pages/Auth';
import Hub from './pages/Hub';
import BottomNav from './components/BottomNav';
import SyncIndicator from './components/SyncIndicator';
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

  // Show auth page if no session
  if (!session) {
    return <Auth />;
  }

  if (appMode === 'hub') {
    return (
      <div className="app-container">
        <SyncIndicator />
        <Hub onEnterBudget={() => setAppMode('budget')} />
        <BottomNav mode="hub" activeTab="accueil" setActiveTab={() => {}} />
      </div>
    );
  }

  const ActiveScreen = BUDGET_SCREENS[activeTab];

  // No full-page loading spinner during navigation — prevents jitter.
  // Data loads in background via SyncIndicator + local storage cache.
  return (
    <div className="app-container">
      <SyncIndicator />
      <ActiveScreen key={activeTab} onBackToHub={() => setAppMode('hub')} />
      <BottomNav mode="budget" activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
