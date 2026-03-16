import React, { useState } from 'react';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budget from './pages/Budget';
import Previsions from './pages/Previsions';
import BottomNav from './components/BottomNav';
import './index.css';

const SCREENS = {
  dashboard: Dashboard,
  transactions: Transactions,
  budget: Budget,
  previsions: Previsions,
};

function App() {
  const [activeTab, setActiveTab] = useState('dashboard');

  const ActiveScreen = SCREENS[activeTab];

  return (
    <div className="app-container">
      <ActiveScreen key={activeTab} />
      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />
    </div>
  );
}

export default App;
