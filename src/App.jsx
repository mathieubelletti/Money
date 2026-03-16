import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Previsions from './pages/Previsions';
import BottomNav from './components/BottomNav';
import { useData } from './context/DataContext';
import './index.css';

const SCREENS = {
  dashboard: Dashboard,
  transactions: Transactions,
  budget: Budget,
  previsions: Previsions,
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { loading } = useData();

  const ActiveScreen = SCREENS[activeTab];

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
      <ActiveScreen key={activeTab} />
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
