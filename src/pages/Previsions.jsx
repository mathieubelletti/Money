import React, { useState, useEffect } from 'react';
import PageHeader from '../components/PageHeader';
import { previsionsTabs } from '../data/mockData';
import { formatBalance } from '../utils/helpers';
import { useData } from '../context/DataContext';
const formatBalance = (amount) => {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const [int, dec] = formatted.split(',');
  return (
    <span style={{ color: 'white', fontWeight: 800 }}>
      {amount < 0 ? '-' : ''}{int}<span style={{ fontSize: '0.75em', opacity: 0.7, verticalAlign: 'super', marginLeft: '1px' }}>,{dec}</span> €
    </span>
  );
};

const Previsions = ({ onBackToHub }) => {
  const [activeTab, setActiveTab] = useState('Mois'); // 'Mois', 'Trimestre', 'Annee'
  const { 
    forecasts, 
    globalRecurrences, 
    setGlobalRecurrences,
    monthsState,
    setMonthsState,
    saveGlobalConfig,
    loading,
    fetchingPrevisions,
    fetchPrevisions,
    updatePrevision,
    isRolloverEnabled,
    setIsRolloverEnabled,
    selectedPeriod,
    setSelectedPeriod
  } = useData();

  const scrollRef = React.useRef(null);


  const COMMON_ICONS = ['category', 'payments', 'shopping_cart', 'home', 'trending_up', 'restaurant', 'local_gas_station', 'flight', 'medical_services', 'fitness_center', 'subscriptions', 'bolt', 'water_drop', 'smartphone', 'shopping_bag', 'checkroom', 'bakery_dining', 'coffee', 'local_bar', 'redeem', 'favorite', 'school', 'build', 'commute'];

  const ICON_LIBRARY = {
    // Revenus
    'salaire': 'payments', 'paye': 'payments', 'payé': 'payments', 'dividende': 'trending_up', 'bourse': 'trending_up', 'remboursement': 'savings', 'caf': 'savings',
    // Fixes/Charges
    'assurance': 'verified_user', 'matmut': 'verified_user', 'axa': 'verified_user', 'internet': 'wifi', 'orange': 'wifi', 'free': 'wifi', 'bouygues': 'wifi', 'sfr': 'wifi',
    'mobile': 'smartphone', 'telephone': 'smartphone', 'téléphone': 'smartphone', 'electricite': 'bolt', 'électricité': 'bolt', 'edf': 'bolt', 'engie': 'bolt', 'gaz': 'gas_meter', 'eau': 'water_drop', 'suez': 'water_drop',
    'netflix': 'subscriptions', 'spotify': 'subscriptions', 'disney': 'subscriptions', 'prime': 'subscriptions', 'gym': 'fitness_center', 'sport': 'fitness_center',
    'loyer': 'home', 'habiter': 'home', 'maison': 'home', 'appartement': 'home', 'travaux': 'build',
    // Variables
    'course': 'shopping_cart', 'supermarché': 'shopping_cart', 'leclerc': 'shopping_cart', 'carrefour': 'shopping_cart', 'lidl': 'shopping_cart', 'intermarché': 'shopping_cart', 'auchan': 'shopping_cart',
    'restaurant': 'restaurant', 'resto': 'restaurant', 'uber': 'restaurant', 'deliveroo': 'restaurant', 'mcdonald': 'restaurant', 'mcdo': 'restaurant', 'burger': 'restaurant',
    'carpurant': 'local_gas_station', 'essence': 'local_gas_station', 'total': 'local_gas_station', 'gazole': 'local_gas_station', 'diesel': 'local_gas_station', 'peage': 'directions_car', 'péage': 'directions_car',
    'avion': 'flight', 'voyage': 'flight', 'vacances': 'beach_access', 'hotel': 'hotel', 'hôtel': 'hotel', 'cinema': 'movie', 'cinéma': 'movie',
    'shopping': 'shopping_bag', 'vetement': 'checkroom', 'vêtement': 'checkroom', 'sante': 'medical_services', 'santé': 'medical_services', 'pharmacie': 'medical_services', 'medecin': 'medical_services', 'médecin': 'medical_services',
    'coiffeur': 'content_cut', 'cadeau': 'redeem', 'donation': 'favorite', 'boulangerie': 'bakery_dining', 'pain': 'bakery_dining', 'cafe': 'coffee', 'café': 'coffee', 'bar': 'local_bar',
    'ecole': 'school', 'école': 'school', 'fac': 'school', 'amazon': 'shopping_bag', 'transport': 'commute', 'train': 'train', 'sncf': 'train', 'ter': 'train'
  };
  const [expandedMonthId, setExpandedMonthId] = useState(null);

  // --- Auto-scroll to active month ---
  useEffect(() => {
    if (selectedPeriod && scrollRef.current && activeTab === 'Mois') {
      const timer = setTimeout(() => {
        const activeBtn = scrollRef.current?.querySelector('[data-selected="true"]');
        if (activeBtn) {
          activeBtn.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [selectedPeriod, forecasts, activeTab]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [activeModalTab, setActiveModalTab] = useState('revenus');

  const now = new Date();
  const currentYM = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;


  useEffect(() => {
    if (activeTab === 'Mois' && forecasts.length > 0) {
      const targetId = `month-${currentYM}`;
      const timer = setTimeout(() => {
        const element = document.getElementById(targetId);
        if (element) {
          element.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [activeTab, forecasts.length, currentYM]);

  React.useEffect(() => {
    fetchPrevisions();
  }, [fetchPrevisions]);

  // Totals & Cascading Rollover Calculation
  const calculatedResults = React.useMemo(() => {
    const results = {};

    forecasts.forEach((f, index) => {
      const data = monthsState[f.id] || { manualReport: 0, revenus: [], fixes: [], variables: [] };
      const rev = data.revenus.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
      const fix = data.fixes.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
      const varTotal = data.variables.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
      
      const hasRealOverride = data.realReport !== undefined && data.realReport !== '';
      const hasManualOverride = data.manualReport !== undefined && data.manualReport !== '' && data.manualReport !== 0;
      const autoReport = index === 0 ? 0 : (results[forecasts[index-1].id]?.final || 0);
      const reportBalance = isRolloverEnabled 
        ? (hasRealOverride ? parseFloat(data.realReport) : hasManualOverride ? parseFloat(data.manualReport) : autoReport)
        : (hasRealOverride ? parseFloat(data.realReport) : parseFloat(data.manualReport) || 0);

      const final = rev - fix - varTotal + (reportBalance || 0);
      results[f.id] = { rev, fix, varTotal, reportBalance, final };
    });

    return results;
  }, [forecasts, monthsState, isRolloverEnabled]);

  const getMonthData = (id) => monthsState[id] || { manualReport: 0, revenus: [], fixes: [], variables: [] };

  const formatMonthAmount = (amount) => {
    const sign = amount >= 0 ? '+' : '-';
    const abs = Math.abs(amount);
    const formatted = abs.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    const [int, dec] = formatted.split(',');
    return (
      <span style={{ whiteSpace: 'nowrap', fontWeight: 700 }}>
        {sign}{int}<span style={{ fontSize: '0.8em', opacity: 0.7 }}>,{dec}</span> €
      </span>
    );
  };

  const handleToggleMonth = (id) => {
    setExpandedMonthId(expandedMonthId === id ? null : id);
  };

  // Propagation Logic
  const applyGlobalRecurrences = React.useCallback(async () => {
    let finalMonthsState = null;
    
    setMonthsState(prev => {
      const newState = { ...prev };
      
      // Helper to sort and avoid mutating the original globalRecurrences
      const getSortedSection = (sect) => {
        return [...globalRecurrences[sect]].sort((a, b) => {
          const dayA = parseInt(a.day, 10) || 0;
          const dayB = parseInt(b.day, 10) || 0;
          return dayA - dayB;
        });
      };

      const sortedSectData = {
        revenus: getSortedSection('revenus'),
        fixes: getSortedSection('fixes'),
        variables: getSortedSection('variables')
      };

      forecasts.forEach(f => {
        const currentData = prev[f.id] || { manualReport: 0, revenus: [], fixes: [], variables: [] };
        
        // Helper to merge global and local data
        const mergeSection = (sectName) => {
          return sortedSectData[sectName].map(gi => {
            const local = (currentData[sectName] || []).find(li => li.id === gi.id);
            if (local && local.isLinked === false) {
              // Preserve local amount and link status, but take other fields from global (in case label/icon/day changed)
              return { 
                ...gi, 
                amount: local.amount, 
                isLinked: false 
              };
            }
            // Otherwise, use global values and ensure it's linked
            return { ...gi, isLinked: true };
          });
        };

        newState[f.id] = {
          ...currentData,
          revenus: mergeSection('revenus'),
          fixes: mergeSection('fixes'),
          variables: mergeSection('variables')
        };
      });
      finalMonthsState = newState;
      return newState;
    });
    
    // Save to Supabase using the fresh state
    if (finalMonthsState) {
      await saveGlobalConfig(finalMonthsState);
    }
    
    setIsGlobalModalOpen(false);
  }, [forecasts, globalRecurrences, saveGlobalConfig]);

  // Field Update with Auto-Unlink
  const updateField = React.useCallback((monthId, section, id, field, value) => {
    setMonthsState(prev => {
      const currentData = prev[monthId] || { manualReport: 0, revenus: [], fixes: [], variables: [] };
      return {
        ...prev,
        [monthId]: {
          ...currentData,
          [section]: currentData[section].map(item => 
            item.id === id ? { ...item, [field]: value, isLinked: field === 'amount' ? false : item.isLinked } : item
          )
        }
      };
    });

    // Handle Supabase update after state change
    if (field === 'amount') {
      setTimeout(() => {
        const { final } = calculatedResults[monthId];
        updatePrevision(monthId, final);
      }, 0);
    }
  }, [calculatedResults, updatePrevision]);

  const toggleLink = React.useCallback((monthId, section, id) => {
    setMonthsState(prev => {
      const currentData = prev[monthId] || { manualReport: 0, revenus: [], fixes: [], variables: [] };
      const item = currentData[section].find(i => i.id === id);
      if (!item) return prev;
      const globalItem = globalRecurrences[section].find(gi => gi.label === item.label);
      
      const newValue = !item.isLinked;
      return {
        ...prev,
        [monthId]: {
          ...currentData,
          [section]: currentData[section].map(i => 
            i.id === id ? { ...i, isLinked: newValue, amount: newValue && globalItem ? globalItem.amount : i.amount } : i
          )
        }
      };
    });
  }, [globalRecurrences]);
  
  // Add dynamic recurrence
  const addGlobalRecurrence = React.useCallback((section) => {
    const newId = Date.now() + Math.random();
    setGlobalRecurrences(prev => ({
      ...prev,
      [section]: [...prev[section], { id: newId, label: '', amount: '', day: '', isLinked: true }]
    }));
  }, [setGlobalRecurrences]);

  if (loading || fetchingPrevisions || !forecasts || forecasts.length === 0) {
    return (
      <div className="screen animate-fade">
        <PageHeader title="Prévisions annuelles" onBack={onBackToHub} />
        <div style={{
          display: 'flex', 
          flexDirection: 'column',
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '60vh',
          gap: 16
        }}>
          <div className="spinner" style={{ 
            width: 40, 
            height: 40, 
            border: '4px solid var(--color-primary-glass)', 
            borderTop: '4px solid var(--color-primary)', 
            borderRadius: '50%',
            animation: 'spin 1s linear infinite'
          }}></div>
          <div style={{fontSize: 14, fontWeight: 600, color: 'var(--color-text-secondary)'}}>
            Chargement de vos prévisions...
          </div>
          <style>{`
            @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
          `}</style>
        </div>
      </div>
    );
  }

  const lastForecast = forecasts[forecasts.length - 1];
  const midForecast = forecasts[Math.min(5, forecasts.length - 1)];

  return (
    <div className="screen animate-fade" style={{ display: 'flex', flexDirection: 'column' }}>
      <div style={{ flexShrink: 0 }}>
        <PageHeader title="Prévisions annuelles" onBack={onBackToHub} />
        
        {/* Interactive Month Selector - Matching Dashboard */}
        <section style={{ padding: '0 24px 16px', background: 'var(--color-bg)' }} className="dashboard-max-width">
          <div 
            ref={scrollRef}
            className="scrollbar-hide"
            style={{
              display: 'flex', gap: 12, overflowX: 'auto', paddingBottom: 8, scrollBehavior: 'smooth'
            }}
          >
            {forecasts?.map(f => {
              const periodValue = f.id;
              const isSelected = selectedPeriod === periodValue;
              return (
                <button
                  key={f.id}
                  data-selected={isSelected}
                  onClick={() => {
                    setSelectedPeriod(periodValue);
                    setActiveTab('Mois');
                    // Scroll to the month card in the list
                    const targetId = `month-${periodValue.split('_').pop()}`;
                    const element = document.getElementById(targetId);
                    if (element) {
                      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                  }}
                  style={{
                    flexShrink: 0,
                    padding: '8px 20px',
                    borderRadius: 20,
                    background: isSelected ? 'var(--color-primary)' : 'var(--color-surface)',
                    color: isSelected ? 'white' : 'var(--color-text-primary)',
                    border: isSelected ? 'none' : '1px solid var(--color-border-light)',
                    backdropFilter: 'blur(10px)',
                    fontSize: 14,
                    fontWeight: 700,
                    boxShadow: isSelected ? '0 4px 12px rgba(53, 132, 96, 0.3)' : 'var(--shadow-sm)',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {f.month.toUpperCase()}
                </button>
              );
            })}
          </div>
        </section>
      </div>
      
      {/* Tabs & Solde Section */}
      <div style={{ padding: '0 24px 12px', flexShrink: 0 }}>
        <div style={{ 
          display: 'flex', 
          gap: '8px', 
          overflowX: 'auto', 
          padding: '16px 0',
          scrollbarWidth: 'none'
        }}>
          {previsionsTabs.map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flexShrink: 0,
                padding: '8px 16px',
                borderRadius: 20,
                border: activeTab === tab ? '1px solid var(--color-primary)' : '1px solid var(--color-border-light)',
                background: activeTab === tab ? 'var(--color-primary-bg)' : 'var(--color-surface)',
                color: activeTab === tab ? 'var(--color-primary-dark)' : 'var(--color-text-secondary)',
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <section className="dashboard-max-width" style={{ padding: 0 }}>
          <div style={{ 
            background: 'var(--color-primary)', 
            padding: '24px', 
            borderRadius: 24, 
            border: '1px solid var(--color-border)',
            position: 'relative',
            overflow: 'hidden',
            boxShadow: '0 8px 20px -5px rgba(53, 132, 96, 0.2)'
          }}>
            <div style={{ position: 'absolute', top: 16, right: 16, zIndex: 10 }}>
              <button 
                onClick={() => setIsGlobalModalOpen(true)}
                style={{ 
                  background: 'rgba(255,255,255,0.9)', 
                  border: '1px solid var(--color-primary)', 
                  color: 'var(--color-primary)', 
                  borderRadius: 12, 
                  padding: '6px 12px', 
                  fontSize: 10, 
                  fontWeight: 800, 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                  boxShadow: '0 4px 12px rgba(53, 132, 96, 0.1)',
                  pointerEvents: 'auto'
                }}
              >
                <span className="material-icons-round" style={{ fontSize: 16 }}>tune</span>
                GÉRER
              </button>
            </div>
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', paddingRight: 90 }}>Solde prévisionnel à 12 mois</div>
              <div style={{ fontSize: 32, fontWeight: 900, color: 'white', margin: '8px 0' }}>{formatBalance(calculatedResults[lastForecast.id]?.final || 0)}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div 
                  onClick={() => setIsRolloverEnabled(!isRolloverEnabled)}
                  style={{ 
                    width: 28, height: 16, borderRadius: 8, 
                    background: isRolloverEnabled ? 'var(--color-primary)' : '#ccc',
                    position: 'relative', cursor: 'pointer', transition: '0.3s'
                  }}
                >
                  <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'var(--color-surface)', position: 'absolute', top: 2, left: isRolloverEnabled ? 14 : 2, transition: '0.3s' }} />
                </div>
                <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>Report automatique actif</div>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column' }}>
        {/* Titre section */}
        <section style={{ padding: '20px 24px 8px' }} className="dashboard-max-width">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 0 }}>
            <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap' }}>
              {activeTab === 'Mois' ? 'Récapitulatif mensuel' : 
               activeTab === 'Trimestre' ? 'Récapitulatif trimestriel' : 'Bilan annuel'}
            </h3>
            <div style={{ flex: 1, height: 1.5, background: '#000000', opacity: 0.2 }}></div>
          </div>
        </section>

        {/* Liste des prévisions */}
        <section className="dashboard-max-width recapitulatif-mensuel" style={{ padding: '0 24px 120px' }}>
          <div className="card" style={{ borderRadius: 16 }}>
          {activeTab === 'Mois' && forecasts.map((f, index) => {
            const isExpanded = expandedMonthId === f.id;
            const data = getMonthData(f.id);
            const { rev, fix, varTotal, reportBalance, final } = calculatedResults[f.id];
            const totalOps = data.revenus.length + data.fixes.length + data.variables.length;
            const ym = f.date || (String(f.id || '').split('_').pop() || '');
            const isCurrentMonth = ym === currentYM;

            return (
              <div 
                key={f.id} 
                id={`month-${ym}`}
                style={{ borderBottom: '1px solid var(--color-border-light)' }}
              >
                {/* Month Row */}
                <div 
                  className={`month-forecast-card ${isCurrentMonth ? 'is-current-month' : ''}`} 
                  onClick={() => handleToggleMonth(f.id)}
                  style={{ 
                    cursor: 'pointer', 
                    transition: 'all 0.2s', 
                    background: isExpanded ? 'var(--color-surface-alt)' : 'var(--color-surface)',
                    position: 'relative'
                  }}
                >
                  <div className="month-forecast-inner">
                    <div className="month-forecast-badge" style={{ background: final >= 0 ? 'var(--color-primary)' : 'linear-gradient(135deg, #ef4444, #dc2626)' }}>
                      {f.shortMonth}
                    </div>
                    <div className="month-forecast-info">
                      <div className="month-forecast-month">{f.month}</div>
                      <div className="month-forecast-ops">{totalOps > 0 ? `${totalOps} opérations prévues` : 'Aucune opération prévue'}</div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div className="month-forecast-amount" style={{ color: final >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                        {formatMonthAmount(final)}
                      </div>
                      <span className={`month-forecast-tag ${final >= 0 ? 'tag-excedent' : 'tag-deficit'}`}>
                        {final >= 0 ? 'Excédent' : 'Déficit'}
                      </span>
                    </div>
                    <span className="material-icons-round" style={{ marginLeft: 12, color: 'var(--color-text-tertiary)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                      expand_more
                    </span>
                  </div>
                </div>

                {/* Expand Panel */}
                <div style={{ 
                  maxHeight: isExpanded ? '4000px' : '0', 
                  overflow: 'hidden', 
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: 'var(--color-bg)'
                }}>
                  <div style={{ padding: '20px 24px', borderTop: '1px solid var(--color-border-light)' }}>
                    {/* Solde Report */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 20 }}>
                      
                      {/* Solde Auto/Manuel */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)' }}>Solde de report :</div>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input 
                            type="number"
                            placeholder={isRolloverEnabled && index > 0 ? (calculatedResults[forecasts[index-1].id]?.final || 0).toFixed(0) : "0"}
                            value={data.manualReport !== undefined && data.manualReport !== '' && data.manualReport !== 0 ? data.manualReport : ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMonthsState(prev => ({ 
                                ...prev, 
                                [f.id]: { ...(prev[f.id] || { manualReport: '', revenus: [], fixes: [], variables: [] }), manualReport: val } 
                              }));
                              setTimeout(() => {
                                const { final } = calculatedResults[f.id];
                                updatePrevision(f.id, final);
                              }, 0);
                            }}
                            style={{ 
                              background: (data.manualReport !== undefined && data.manualReport !== '' && data.manualReport !== 0) ? 'var(--color-surface)' : 'var(--color-bg)',
                              border: '1px solid',
                              borderColor: (data.manualReport !== undefined && data.manualReport !== '' && data.manualReport !== 0) ? 'var(--color-primary)' : 'var(--color-border)',
                              borderRadius: 8, padding: '4px 28px 4px 12px', width: 110, fontWeight: 700, fontSize: 13,
                              fontFamily: 'monospace', letterSpacing: '0.02em',
                              outline: 'none', color: 'var(--color-text-primary)'
                            }} 
                          />
                          <span style={{ position: 'absolute', right: 10, fontSize: 13, fontWeight: 700, color: 'var(--color-text-tertiary)', pointerEvents: 'none' }}>€</span>
                        </div>
                        <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontStyle: 'italic', display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                          {data.manualReport !== undefined && data.manualReport !== '' && data.manualReport !== 0 ? '(Manuel)' : '(Auto)'}
                        </div>
                      </div>

                      {/* Solde Réel */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)' }}>Solde report Réel :</div>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                          <input 
                            type="number"
                            placeholder="0"
                            value={data.realReport !== undefined && data.realReport !== '' ? data.realReport : ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setMonthsState(prev => ({ 
                                ...prev, 
                                [f.id]: { ...(prev[f.id] || { manualReport: '', realReport: '', revenus: [], fixes: [], variables: [] }), realReport: val } 
                              }));
                              setTimeout(() => {
                                const { final } = calculatedResults[f.id];
                                updatePrevision(f.id, final);
                              }, 0);
                            }}
                            style={{ 
                              background: (data.realReport !== undefined && data.realReport !== '') ? 'var(--color-surface)' : 'var(--color-bg)',
                              border: '1px solid',
                              borderColor: (data.realReport !== undefined && data.realReport !== '') ? '#3b82f6' : 'var(--color-border)',
                              borderRadius: 8, padding: '4px 28px 4px 12px', width: 110, fontWeight: 700, fontSize: 13,
                              fontFamily: 'monospace', letterSpacing: '0.02em',
                              outline: 'none', color: 'var(--color-text-primary)'
                            }} 
                          />
                          <span style={{ position: 'absolute', right: 10, fontSize: 13, fontWeight: 700, color: 'var(--color-text-tertiary)', pointerEvents: 'none' }}>€</span>
                        </div>
                      </div>
                    </div>

                    {/* Sections */}
                    {[
                      { title: 'Revenus', key: 'revenus', icon: 'trending_up', color: 'var(--color-primary-dark)', total: rev },
                      { title: 'Dépenses Fixes', key: 'fixes', icon: 'lock', color: 'var(--color-primary)', total: fix },
                      { title: 'Dépenses Variables', key: 'variables', icon: 'shopping_bag', color: 'var(--color-primary-light)', total: varTotal }
                    ].map(sect => (
                      <div key={sect.key} style={{ marginBottom: 20 }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, fontWeight: 800, color: sect.color, textTransform: 'uppercase' }}>
                            <span className="material-icons-round" style={{ fontSize: 16 }}>{sect.icon}</span>
                            {sect.title}
                          </div>
                        </div>
                        {data[sect.key].length > 0 ? data[sect.key].map(line => (
                          <div key={line.id} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                            <div style={{ flex: 1, minWidth: 120, height: 36, borderRadius: 8, border: '1px solid var(--color-border-light)', padding: '0 10px', fontSize: 13, background: 'var(--color-surface-alt)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600 }}>
                              <span style={{ fontSize: 11, opacity: 0.6, fontWeight: 800 }}>{line.day}</span>
                              <span style={{ flex: 1 }}>{line.label}</span>
                            </div>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input 
                                type="number"
                                placeholder="0"
                                value={line.amount !== undefined ? line.amount : ''}
                                onChange={(e) => updateField(f.id, sect.key, line.id, 'amount', e.target.value)}
                                style={{ 
                                  width: 100, height: 36, borderRadius: 8, 
                                  border: '1px solid var(--color-border-light)', 
                                  padding: '0 32px 0 8px', fontSize: 13, textAlign: 'right', fontWeight: 700,
                                  fontFamily: 'monospace', letterSpacing: '0.02em',
                                  background: line.isLinked ? 'var(--color-surface)' : 'var(--color-warning-light)',
                                  borderColor: line.isLinked ? 'var(--color-border-light)' : '#f59e0b',
                                  outline: 'none', color: 'var(--color-text-primary)'
                                }} 
                              />
                              <span style={{ position: 'absolute', right: 26, fontSize: 13, fontWeight: 800, color: 'var(--color-text-tertiary)', pointerEvents: 'none' }}>€</span>
                              <span 
                                onClick={() => toggleLink(f.id, sect.key, line.id)}
                                className="material-icons-round" 
                                style={{ 
                                  position: 'absolute', right: 6, fontSize: 16, cursor: 'pointer',
                                  color: line.isLinked ? 'var(--color-primary)' : 'var(--color-danger)',
                                  opacity: 0.8
                                }}
                              >
                                {line.isLinked ? 'link' : 'link_off'}
                              </span>
                            </div>
                          </div>
                        )) : (
                          <div style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontStyle: 'italic', padding: '4px 8px' }}>Aucune ligne saisie</div>
                        )}
                        {data[sect.key].length > 0 && (
                          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12, paddingTop: 12, borderTop: `1px dashed ${sect.color}40` }}>
                            <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-primary)', background: 'rgba(16, 185, 129, 0.1)', padding: '6px 16px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                              <span style={{ fontSize: 12, opacity: 0.8 }}>Sous-total {String(sect.title || '').split(' ').pop()} :</span>
                              <span>{sect.total.toLocaleString('fr-FR')} €</span>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Résumé Panneau */}
                    <div style={{ marginTop: 24, padding: '16px', background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 6 }}>
                        <span style={{ fontWeight: 600 }}>TOTAL REVENUS</span>
                        <span style={{ fontWeight: 800, color: '#22c55e' }}>+ {rev.toLocaleString('fr-FR')} €</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--color-primary)', marginBottom: 6, padding: '6px 12px', background: 'rgba(16, 185, 129, 0.1)', borderRadius: 8 }}>
                        <span style={{ fontWeight: 800 }}>GRAND TOTAL PRÉVU (Fixes + Var.)</span>
                        <span style={{ fontWeight: 900 }}>- {(fix + varTotal).toLocaleString('fr-FR')} €</span>
                      </div>
                      <div style={{ height: 1.5, background: 'var(--color-bg)', margin: '16px 0' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15, alignItems: 'center' }}>
                        <span style={{ fontWeight: 800, color: 'var(--color-text-secondary)' }}>NOUVEAU SOLDE</span>
                        <span style={{ fontWeight: 900, color: final >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontSize: 18 }}>
                          {formatMonthAmount(final)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {activeTab === 'Trimestre' && (() => {
            const quarters = [
              { id: 't1', label: '1er Trimestre', months: forecasts.slice(0, 3), period: 'Jan – Mar' },
              { id: 't2', label: '2ème Trimestre', months: forecasts.slice(3, 6), period: 'Avr – Juin' },
              { id: 't3', label: '3ème Trimestre', months: forecasts.slice(6, 9), period: 'Juil – Sep' },
              { id: 't4', label: '4ème Trimestre', months: forecasts.slice(9, 12), period: 'Oct – Déc' },
            ].map(q => {
              const totalRev = q.months.reduce((s, f) => s + (calculatedResults[f.id]?.rev || 0), 0);
              const totalFix = q.months.reduce((s, f) => s + (calculatedResults[f.id]?.fix || 0), 0);
              const totalVar = q.months.reduce((s, f) => s + (calculatedResults[f.id]?.varTotal || 0), 0);
              const net = q.months.reduce((s, f) => s + (calculatedResults[f.id]?.final || 0), 0);
              return { ...q, totalRev, totalFix, totalVar, net };
            });

            return quarters.map(q => {
              const isExpanded = expandedMonthId === q.id;
              return (
                <div key={q.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                  <div
                    className="month-forecast-card"
                    onClick={() => handleToggleMonth(q.id)}
                    style={{ cursor: 'pointer', background: isExpanded ? 'var(--color-surface-alt)' : 'var(--color-surface)' }}
                  >
                    <div className="month-forecast-inner">
                      <div className="month-forecast-badge" style={{ background: q.net >= 0 ? 'var(--color-primary)' : 'linear-gradient(135deg,#ef4444,#dc2626)', fontSize: 11 }}>
                        {q.id.toUpperCase()}
                      </div>
                      <div className="month-forecast-info">
                        <div className="month-forecast-month">{q.label}</div>
                        <div className="month-forecast-ops">{q.period}</div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div className="month-forecast-amount" style={{ color: q.net >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {formatMonthAmount(q.net)}
                        </div>
                        <span className={`month-forecast-tag ${q.net >= 0 ? 'tag-excedent' : 'tag-deficit'}`}>
                          {q.net >= 0 ? 'Excédent' : 'Déficit'}
                        </span>
                      </div>
                      <span className="material-icons-round" style={{ marginLeft: 12, color: 'var(--color-text-tertiary)', transform: isExpanded ? 'rotate(180deg)' : 'none', transition: 'transform 0.3s' }}>
                        expand_more
                      </span>
                    </div>
                  </div>
                  <div style={{ maxHeight: isExpanded ? '800px' : '0', overflow: 'hidden', transition: 'all 0.4s cubic-bezier(0.4,0,0.2,1)', background: 'var(--color-bg)' }}>
                    <div style={{ padding: '20px 24px', borderTop: '1px solid var(--color-border-light)' }}>
                      {/* Monthly sub-rows */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
                        {q.months.map(f => {
                          const r = calculatedResults[f.id] || {};
                          return (
                            <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 12px', background: 'var(--color-surface)', borderRadius: 10, border: '1px solid var(--color-border-light)' }}>
                              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-secondary)' }}>{f.month}</span>
                              <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                                <span style={{ color: 'var(--color-success)', fontWeight: 700 }}>+{(r.rev || 0).toLocaleString('fr-FR')} €</span>
                                <span style={{ color: 'var(--color-danger)', fontWeight: 700 }}>-{((r.fix || 0) + (r.varTotal || 0)).toLocaleString('fr-FR')} €</span>
                                <span style={{ color: (r.final || 0) >= 0 ? 'var(--color-success)' : 'var(--color-danger)', fontWeight: 900 }}>{formatMonthAmount(r.final || 0)}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Quarter totals */}
                      <div style={{ padding: 16, background: 'var(--color-surface)', borderRadius: 12, border: '1px solid var(--color-border-light)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                          <span style={{ fontWeight: 600 }}>REVENUS</span>
                          <span style={{ fontWeight: 800, color: 'var(--color-success)' }}>+ {q.totalRev.toLocaleString('fr-FR')} €</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 6 }}>
                          <span style={{ fontWeight: 600 }}>DÉPENSES</span>
                          <span style={{ fontWeight: 800, color: 'var(--color-danger)' }}>- {(q.totalFix + q.totalVar).toLocaleString('fr-FR')} €</span>
                        </div>
                        <div style={{ height: 1, background: 'var(--color-bg)', margin: '10px 0' }} />
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                          <span style={{ fontWeight: 800 }}>RÉSULTAT</span>
                          <span style={{ fontWeight: 900, color: q.net >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{formatMonthAmount(q.net)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              );
            });
          })()}

          {activeTab === 'Année' && (() => {
            const totalRev = forecasts.reduce((s, f) => s + (calculatedResults[f.id]?.rev || 0), 0);
            const totalFix = forecasts.reduce((s, f) => s + (calculatedResults[f.id]?.fix || 0), 0);
            const totalVar = forecasts.reduce((s, f) => s + (calculatedResults[f.id]?.varTotal || 0), 0);
            const annualNet = calculatedResults[lastForecast.id]?.final || 0;
            const avgMonthly = totalRev / 12;

            return (
              <>
                {/* Annual KPI cards */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, padding: '20px 0 8px' }}>
                  {[
                    { label: 'Revenus annuels', value: totalRev, icon: 'trending_up', color: 'var(--color-success)', sign: '+' },
                    { label: 'Dépenses fixes', value: totalFix, icon: 'lock', color: 'var(--color-primary)', sign: '-' },
                    { label: 'Dépenses variables', value: totalVar, icon: 'shopping_bag', color: '#f59e0b', sign: '-' },
                    { label: 'Moyenne mensuelle', value: avgMonthly, icon: 'calendar_today', color: 'var(--color-text-secondary)', sign: '+' },
                  ].map(k => (
                    <div key={k.label} style={{ background: 'var(--color-surface)', borderRadius: 14, border: '1px solid var(--color-border-light)', padding: '16px 14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 10, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', marginBottom: 8 }}>
                        <span className="material-icons-round" style={{ fontSize: 14, color: k.color }}>{k.icon}</span>
                        {k.label}
                      </div>
                      <div style={{ fontSize: 18, fontWeight: 900, color: k.color }}>{k.sign}{k.value.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</div>
                    </div>
                  ))}
                </div>
                {/* Annual result */}
                <div className="month-forecast-card" style={{ padding: '24px 0', marginTop: 8 }}>
                  <div className="month-forecast-inner" style={{ justifyContent: 'center', flexDirection: 'column', gap: 4 }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Résultat annuel estimé</div>
                    <div style={{ fontSize: 36, fontWeight: 900, color: annualNet >= 0 ? 'var(--color-success)' : 'var(--color-danger)', margin: '4px 0' }}>
                      {formatMonthAmount(annualNet)}
                    </div>
                    <div style={{ display: 'flex', gap: 16, fontSize: 12, color: 'var(--color-text-secondary)' }}>
                      <span>Revenus : <strong style={{ color: 'var(--color-success)' }}>{totalRev.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</strong></span>
                      <span>Dépenses : <strong style={{ color: 'var(--color-danger)' }}>{(totalFix + totalVar).toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</strong></span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--color-text-tertiary)', marginTop: 4 }}>Basé sur 12 mois glissants</div>
                  </div>
                </div>
              </>
            );
          })()}
        </div>

        {/* Alerte conseil */}
        {calculatedResults[midForecast.id]?.final !== 0 && (
          <div className="previsions-alert" style={{ marginTop: 24 }}>
            <span className="material-icons-round">tips_and_updates</span>
            <div>
              <div className="previsions-alert-title">Conseil Budget</div>
              <div className="previsions-alert-text">
                {(calculatedResults[midForecast.id]?.final || 0) < 0 ? 'Vos prévisions sont dans le rouge. Pensez à ajuster vos dépenses variables.' : 'Vos prévisions sont stables pour le premier semestre. Continuez ainsi !'}
              </div>
            </div>
          </div>
        )}
        </section>
      </div>

      {/* GLOBAL MANAGEMENT MODAL */}
      {isGlobalModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)',
          zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }} onClick={() => setIsGlobalModalOpen(false)}>
          <div 
            className="animate-slide-up"
            style={{
              width: '100%', maxWidth: 650, background: 'var(--color-surface)', borderRadius: 32,
              padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflowY: 'auto', maxHeight: '90vh'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text-primary)', margin: 0 }}>Récurrences Globales</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500, marginTop: 4 }}>Configurez votre base annuelle</p>
              </div>
              <button onClick={() => setIsGlobalModalOpen(false)} style={{ background: 'var(--color-surface-alt)', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <span className="material-icons-round" style={{ color: 'var(--color-text-secondary)' }}>close</span>
              </button>
            </div>

            {/* INITIAL SETUP: Starting Balance */}
            <div style={{ background: 'var(--color-primary-bg)', padding: '16px 20px', borderRadius: 24, marginBottom: 24, border: '1px solid var(--color-primary)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: 'var(--color-surface)', width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(53, 132, 96, 0.2)' }}>
                <span className="material-icons-round" style={{ color: 'var(--color-primary)', fontSize: 20 }}>account_balance_wallet</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-primary-dark)', textTransform: 'uppercase', marginBottom: 2, display: 'flex', justifyContent: 'space-between', opacity: 0.8 }}>
                  <span>Solde au 1er Janvier</span>
                  <span style={{ fontSize: 9, opacity: 0.7, fontStyle: 'italic' }}>Optionnel</span>
                </div>
                <input 
                  type="number"
                  placeholder="0.00 €"
                  value={getMonthData(forecasts[0].id).manualReport || ''}
                  onChange={(e) => setMonthsState(prev => ({ 
                    ...prev, 
                    [forecasts[0].id]: { ...(prev[forecasts[0].id] || { manualReport: 0, revenus: [], fixes: [], variables: [] }), manualReport: e.target.value } 
                  }))}
                  style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 20, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.02em', color: 'var(--color-text-primary)', outline: 'none' }}
                />
              </div>
            </div>

            {/* Modal Tabs Navigation */}
            <div style={{ display: 'flex', background: 'var(--color-surface-alt)', padding: 6, borderRadius: 16, marginBottom: 24, gap: 4 }}>
              {[
                { id: 'revenus', label: 'Revenus', icon: 'payments' },
                { id: 'fixes', label: 'Fixes', icon: 'event_repeat' },
                { id: 'variables', label: 'Variables', icon: 'shopping_bag' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveModalTab(tab.id)}
                  style={{
                    flex: 1, height: 36, borderRadius: 12, border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    fontSize: 12, fontWeight: 700, cursor: 'pointer',
                    transition: 'all 0.2s',
                    background: activeModalTab === tab.id ? 'var(--color-surface)' : 'transparent',
                    color: activeModalTab === tab.id ? 'var(--color-primary)' : 'var(--color-text-secondary)',
                    boxShadow: activeModalTab === tab.id ? '0 4px 8px rgba(0,0,0,0.05)' : 'none'
                  }}
                >
                  <span className="material-icons-round" style={{ fontSize: 16 }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Active Section Content (Tab-based) */}
            <div style={{ minHeight: 300 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {activeModalTab === 'revenus' ? 'Revenus Récurrents' : activeModalTab === 'fixes' ? 'Dépenses Fixes' : 'Estimations Variables'}
                </div>
                <button 
                  onClick={() => addGlobalRecurrence(activeModalTab)}
                  style={{ 
                    background: 'var(--color-primary-glass)', 
                    border: 'none', 
                    padding: '6px 14px',
                    borderRadius: 10, 
                    color: 'var(--color-primary)', 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: 6,
                    fontSize: 12, fontWeight: 700,
                    cursor: 'pointer'
                  }}
                >
                  <span className="material-icons-round" style={{ fontSize: 16 }}>add</span>
                  Ajouter
                </button>
              </div>

              {globalRecurrences[activeModalTab].length > 0 ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {globalRecurrences[activeModalTab].map((line, idx) => (
                    <div key={line.id} className="recurrence-grid-item" style={{ 
                      background: 'var(--color-surface)',
                      padding: 12,
                      borderRadius: 18,
                      border: '1px solid var(--color-border-light)',
                      boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                    }}>
                      <div className="rg-icon">
                        <button 
                          onClick={() => {
                            const nextIdx = (COMMON_ICONS.indexOf(line.icon || COMMON_ICONS[0]) + 1) % COMMON_ICONS.length;
                            setGlobalRecurrences(prev => ({
                              ...prev,
                              [activeModalTab]: prev[activeModalTab].map(item => item.id === line.id ? { ...item, icon: COMMON_ICONS[nextIdx] } : item)
                            }));
                          }}
                          style={{ 
                            width: 38, height: 38, borderRadius: 12, 
                            border: '1px solid var(--color-border-light)', 
                            background: 'var(--color-bg)', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center', 
                            cursor: 'pointer', 
                            color: activeModalTab === 'revenus' ? 'var(--color-success)' : (activeModalTab === 'fixes' ? 'var(--color-danger)' : 'var(--color-warning)')
                          }}
                        >
                          <span className="material-icons-round" style={{ fontSize: 18 }}>{line.icon || 'category'}</span>
                        </button>
                      </div>
                      <input 
                        value={line.label}
                        onChange={(e) => {
                          const newLabel = e.target.value;
                          const lower = newLabel.toLowerCase();
                          let detectedIcon = null;
                          for (const [key, icon] of Object.entries(ICON_LIBRARY)) {
                            if (lower.includes(key)) { detectedIcon = icon; break; }
                          }
                          setGlobalRecurrences(prev => ({
                            ...prev,
                            [activeModalTab]: prev[activeModalTab].map(item => {
                              if (item.id === line.id) {
                                const shouldAutoUpdate = !item.icon || item.icon === 'category';
                                return { ...item, label: newLabel, icon: (detectedIcon && shouldAutoUpdate) ? detectedIcon : item.icon };
                              }
                              return item;
                            })
                          }));
                        }}
                        placeholder="Désignation..."
                        style={{ height: 38, borderRadius: 10, border: '1px solid var(--color-border-light)', padding: '0 12px', fontSize: 13, fontWeight: 600, width: '100%', background: 'var(--color-bg)', color: 'var(--color-text-primary)', outline: 'none' }}
                      />
                      <input 
                        type="number"
                        min="1" max="31"
                        value={line.day || ''}
                        onChange={(e) => {
                          setGlobalRecurrences(prev => ({
                            ...prev,
                            [activeModalTab]: prev[activeModalTab].map(item => item.id === line.id ? { ...item, day: e.target.value } : item)
                          }));
                        }}
                        placeholder="Jour"
                        style={{ height: 38, borderRadius: 10, border: '1px solid var(--color-border-light)', padding: '0 4px', fontSize: 13, fontWeight: 700, textAlign: 'center', width: '100%', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                      />
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input 
                          type="number"
                          value={line.amount}
                          onChange={(e) => {
                            setGlobalRecurrences(prev => ({
                              ...prev,
                              [activeModalTab]: prev[activeModalTab].map(item => item.id === line.id ? { ...item, amount: e.target.value } : item)
                            }));
                          }}
                          placeholder="0"
                          style={{ height: 38, borderRadius: 10, border: '1px solid var(--color-border-light)', padding: '0 28px 0 8px', fontSize: 13, fontWeight: 700, fontFamily: 'monospace', letterSpacing: '0.02em', textAlign: 'right', width: '100%', background: 'var(--color-bg)', color: 'var(--color-text-primary)' }}
                        />
                        <span style={{ position: 'absolute', right: 10, fontSize: 12, fontWeight: 800, color: 'var(--color-text-secondary)', opacity: 0.5 }}>€</span>
                      </div>
                      <button 
                        onClick={() => {
                          setGlobalRecurrences(prev => ({
                            ...prev,
                            [activeModalTab]: prev[activeModalTab].filter(item => item.id !== line.id)
                          }));
                        }}
                        style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer', padding: 4 }}
                      >
                        <span className="material-icons-round" style={{ fontSize: 20 }}>delete</span>
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div 
                  onClick={() => addGlobalRecurrence(activeModalTab)}
                  style={{ border: '2px dashed var(--color-border-light)', borderRadius: 20, padding: '40px 20px', textAlign: 'center', cursor: 'pointer', background: 'var(--color-bg)', opacity: 0.6 }}
                >
                  <span className="material-icons-round" style={{ fontSize: 32, color: 'var(--color-text-tertiary)', marginBottom: 8 }}>post_add</span>
                  <p style={{ color: 'var(--color-text-tertiary)', fontSize: 13, fontWeight: 600, margin: 0 }}>
                    Cliquez pour ajouter {activeModalTab === 'revenus' ? 'un revenu' : 'une dépense'} récurrent(e)
                  </p>
                </div>
              )}
            </div>

            <div style={{ background: 'var(--color-primary-glass)', padding: 16, borderRadius: 16, marginTop: 24, marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="material-icons-round" style={{ color: 'var(--color-primary)', fontSize: 20 }}>info</span>
                <p style={{ fontSize: 11, color: 'var(--color-primary-dark)', fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
                  Ces réglages servent de modèle pour générer automatiquement votre prévisionnel annuel.
                </p>
              </div>
            </div>

            <button 
              onClick={() => applyGlobalRecurrences(true)}
              style={{ width: '100%', height: 64, borderRadius: 20, border: 'none', color: 'var(--color-surface)', background: 'var(--color-primary)', fontSize: 16, fontWeight: 900, cursor: 'pointer', boxShadow: '0 12px 24px rgba(53, 132, 96, 0.3)', transition: 'transform 0.2s', active: { transform: 'scale(0.98)' } }}
            >
              ENREGISTRER LA CONFIGURATION ANNUELLE
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Previsions;
