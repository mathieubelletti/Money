import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { previsionsTabs } from '../data/mockData';
import { formatBalance } from '../utils/helpers';
import { useData } from '../context/DataContext';

const Previsions = () => {
  const { 
    forecasts, 
    globalRecurrences, 
    setGlobalRecurrences, 
    categories 
  } = useData();

  const COMMON_ICONS = ['home', 'shopping_basket', 'directions_transit', 'movie', 'subscriptions', 'sports_soccer', 'health_and_safety', 'restaurant', 'shopping_bag', 'payments', 'work', 'savings'];
  const [activeTab, setActiveTab] = useState('Mois');
  const [expandedMonthId, setExpandedMonthId] = useState(null);
  const [isGlobalModalOpen, setIsGlobalModalOpen] = useState(false);
  const [isRolloverEnabled, setIsRolloverEnabled] = useState(true);

  // Individual Months State - CLEAN START
  const [monthsState, setMonthsState] = useState(
    forecasts.reduce((acc, f) => {
      acc[f.id] = {
        manualReport: 0,
        revenus: [],
        fixes: [],
        variables: []
      };
      return acc;
    }, {})
  );

  const formatMonthAmount = (amount) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}${amount.toLocaleString('fr-FR')} €`;
  };

  const handleToggleMonth = (id) => {
    setExpandedMonthId(expandedMonthId === id ? null : id);
  };

  // Propagation Logic
  const applyGlobalRecurrences = (force = false) => {
    // Validation is done by setGlobalRecurrences in context which updates categories
    setGlobalRecurrences({ ...globalRecurrences }); 
    
    setMonthsState(prev => {
      const newState = { ...prev };
      forecasts.forEach(f => {
        newState[f.id] = {
          ...newState[f.id],
          revenus: globalRecurrences.revenus.map(r => ({ ...r, isLinked: true })),
          fixes: globalRecurrences.fixes.map(r => ({ ...r, isLinked: true })),
          variables: globalRecurrences.variables.map(r => ({ ...r, isLinked: true }))
        };
      });
      return newState;
    });
    setIsGlobalModalOpen(false);
  };

  // Field Update with Auto-Unlink
  const updateField = (monthId, section, id, field, value) => {
    setMonthsState(prev => ({
      ...prev,
      [monthId]: {
        ...prev[monthId],
        [section]: prev[monthId][section].map(item => 
          item.id === id ? { ...item, [field]: value, isLinked: field === 'amount' ? false : item.isLinked } : item
        )
      }
    }));
  };

  const toggleLink = (monthId, section, id) => {
    setMonthsState(prev => {
      const item = prev[monthId][section].find(i => i.id === id);
      const globalItem = globalRecurrences[section].find(gi => gi.label === item.label);
      
      const newValue = !item.isLinked;
      return {
        ...prev,
        [monthId]: {
          ...prev[monthId],
          [section]: prev[monthId][section].map(i => 
            i.id === id ? { ...i, isLinked: newValue, amount: newValue && globalItem ? globalItem.amount : i.amount } : i
          )
        }
      };
    });
  };
  
  // Add dynamic recurrence
  const addGlobalRecurrence = (section) => {
    const newId = Date.now() + Math.random(); // Use better unique ID
    setGlobalRecurrences(prev => ({
      ...prev,
      [section]: [...prev[section], { id: newId, label: '', amount: '', isLinked: true }]
    }));
  };

  // Totals & Cascading Rollover Calculation
  const getCalculatedData = () => {
    const results = {};

    forecasts.forEach((f, index) => {
      const data = monthsState[f.id];
      const rev = data.revenus.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
      const fix = data.fixes.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
      const varTotal = data.variables.reduce((s, i) => s + (parseFloat(i.amount) || 0), 0);
      
      const reportBalance = isRolloverEnabled 
        ? (index === 0 ? parseFloat(data.manualReport) : (results[forecasts[index-1].id]?.final || 0))
        : parseFloat(data.manualReport);

      const final = rev - fix - varTotal + (reportBalance || 0);
      results[f.id] = { rev, fix, varTotal, reportBalance, final };
    });

    return results;
  };

  const calculatedResults = getCalculatedData();

  return (
    <div className="screen animate-fade">
      <PageHeader title="Prévisions annuelles" />
      
      {/* Tabs & Solde Section */}
      <div style={{ padding: '0 24px 12px' }}>
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
                background: activeTab === tab ? 'var(--color-primary-bg)' : 'white',
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

        <div style={{ 
          background: 'linear-gradient(135deg, var(--color-primary-bg) 0%, #e2eeec 100%)', 
          padding: '24px', 
          borderRadius: 24, 
          border: '1px solid var(--color-border)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(24, 82, 74, 0.15)'
        }}>
          <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 12, zIndex: 10 }}>
            <button 
              onClick={() => setIsGlobalModalOpen(true)}
              style={{ 
                background: 'rgba(255,255,255,0.8)', 
                border: '1px solid var(--color-primary)', 
                color: 'var(--color-primary)', 
                borderRadius: 12, 
                padding: '6px 14px', 
                fontSize: 11, 
                fontWeight: 800, 
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
                pointerEvents: 'auto'
              }}
            >
              <span className="material-icons-round" style={{ fontSize: 18 }}>tune</span>
              GÉRER
            </button>
            <div style={{ color: 'var(--color-primary)', opacity: 0.8 }}>
              <span className="material-icons-round" style={{ fontSize: 28 }}>analytics</span>
            </div>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Solde prévisionnel à 12 mois</div>
            <div style={{ fontSize: 32, fontWeight: 900, color: 'var(--color-text-primary)', margin: '8px 0' }}>{formatBalance(calculatedResults[forecasts[11].id].final)}</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div 
                onClick={() => setIsRolloverEnabled(!isRolloverEnabled)}
                style={{ 
                  width: 28, height: 16, borderRadius: 8, 
                  background: isRolloverEnabled ? 'var(--color-primary)' : '#ccc',
                  position: 'relative', cursor: 'pointer', transition: '0.3s'
                }}
              >
                <div style={{ width: 12, height: 12, borderRadius: '50%', background: 'white', position: 'absolute', top: 2, left: isRolloverEnabled ? 14 : 2, transition: '0.3s' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 600 }}>Report automatique actif</div>
            </div>
          </div>
        </div>
      </div>

      <div className="screen-content-centered">
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
        <div className="card" style={{ margin: '0 20px', borderRadius: 16, overflow: 'hidden' }}>
          {activeTab === 'Mois' && forecasts.map(f => {
            const isExpanded = expandedMonthId === f.id;
            const data = monthsState[f.id];
            const { rev, fix, varTotal, reportBalance, final } = calculatedResults[f.id];
            const totalOps = data.revenus.length + data.fixes.length + data.variables.length;

            return (
              <div key={f.id} style={{ borderBottom: '1px solid var(--color-border-light)' }}>
                {/* Month Row */}
                <div 
                  className="month-forecast-card" 
                  onClick={() => handleToggleMonth(f.id)}
                  style={{ cursor: 'pointer', transition: 'all 0.2s', background: isExpanded ? '#f8fafc' : 'white' }}
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
                  maxHeight: isExpanded ? '1200px' : '0', 
                  overflow: 'hidden', 
                  transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
                  background: '#f9fafb'
                }}>
                  <div style={{ padding: '20px 24px', borderTop: '1px solid var(--color-border-light)' }}>
                    {/* Solde Report */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)' }}>Solde de report :</div>
                      <div style={{ background: '#eee', borderRadius: 8, padding: '4px 12px', minWidth: 100, fontWeight: 800, fontSize: 14 }}>
                        {reportBalance.toLocaleString('fr-FR')} €
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
                        {f.id === forecasts[0].id ? '(Saisie manuelle possible)' : '(Calculé via report auto)'}
                      </div>
                      {f.id === forecasts[0].id && (
                        <input 
                          type="number"
                          placeholder="0"
                          value={data.manualReport || ''}
                          onChange={(e) => setMonthsState(prev => ({ ...prev, [f.id]: { ...prev[f.id], manualReport: e.target.value } }))}
                          style={{ background: 'white', border: '1px solid var(--color-border)', borderRadius: 8, padding: '4px 8px', width: 80, fontWeight: 700 }} 
                        />
                      )}
                    </div>

                    {/* Sections */}
                    {[
                      { title: 'Revenus', key: 'revenus', icon: 'trending_up', color: 'var(--color-primary-dark)' },
                      { title: 'Dépenses Fixes', key: 'fixes', icon: 'lock', color: 'var(--color-primary)' },
                      { title: 'Dépenses Variables', key: 'variables', icon: 'shopping_bag', color: 'var(--color-primary-light)' }
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
                            <div style={{ flex: 1, height: 36, borderRadius: 8, border: '1px solid var(--color-border-light)', padding: '0 10px', fontSize: 13, background: 'rgba(255,255,255,0.5)', display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                              {line.label}
                            </div>
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                              <input 
                                type="number"
                                value={line.amount}
                                onChange={(e) => updateField(f.id, sect.key, line.id, 'amount', e.target.value)}
                                style={{ 
                                  width: 90, height: 36, borderRadius: 8, 
                                  border: '1px solid var(--color-border-light)', 
                                  padding: '0 28px 0 8px', fontSize: 13, textAlign: 'right', fontWeight: 700,
                                  background: line.isLinked ? '#fff' : '#fff9eb',
                                  borderColor: line.isLinked ? 'var(--color-border-light)' : '#f59e0b',
                                  outline: 'none'
                                }} 
                              />
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
                      </div>
                    ))}

                    {/* Résumé Panneau */}
                    <div style={{ marginTop: 24, padding: '16px', background: 'white', borderRadius: 12, border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                        <span>TOTAL REVENUS</span>
                        <span style={{ fontWeight: 700, color: '#22c55e' }}>+ {rev.toLocaleString()} €</span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: 'var(--color-text-secondary)', marginBottom: 4 }}>
                        <span>TOTAL DÉPENSES</span>
                        <span style={{ fontWeight: 700, color: '#ef4444' }}>- {(fix + varTotal).toLocaleString()} €</span>
                      </div>
                      <div style={{ height: 1.5, background: '#eee', margin: '12px 0' }}></div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 15 }}>
                        <span style={{ fontWeight: 800 }}>SOLDE PRÉVU</span>
                        <span style={{ fontWeight: 900, color: final >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                          {formatMonthAmount(final)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {activeTab === 'Trimestre' && [
            { id: 't1', label: '1er Trimestre', amount: forecasts.slice(0, 3).reduce((acc, curr) => acc + calculatedResults[curr.id].final, 0), months: 'Jan - Mar' },
            { id: 't2', label: '2ème Trimestre', amount: forecasts.slice(3, 6).reduce((acc, curr) => acc + calculatedResults[curr.id].final, 0), months: 'Avr - Juin' },
            { id: 't3', label: '3ème Trimestre', amount: forecasts.slice(6, 9).reduce((acc, curr) => acc + calculatedResults[curr.id].final, 0), months: 'Juil - Sept' },
            { id: 't4', label: '4ème Trimestre', amount: forecasts.slice(9, 12).reduce((acc, curr) => acc + calculatedResults[curr.id].final, 0), months: 'Oct - Déc' },
          ].map(t => (
            <div key={t.id} className="month-forecast-card">
              <div className="month-forecast-inner">
                <div className="month-forecast-badge" style={{ background: 'var(--color-primary)', fontSize: 14 }}>{t.id.toUpperCase()}</div>
                <div className="month-forecast-info">
                  <div className="month-forecast-month" style={{ fontWeight: 800 }}>{t.label}</div>
                  <div className="month-forecast-ops">{t.months}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div className="month-forecast-amount" style={{ color: t.amount >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                    {formatMonthAmount(t.amount)}
                  </div>
                </div>
              </div>
            </div>
          ))}

          {activeTab === 'Année' && (
            <div className="month-forecast-card" style={{ padding: '24px 0' }}>
              <div className="month-forecast-inner" style={{ justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--color-text-tertiary)', textTransform: 'uppercase' }}>Résultat annuel estimé</div>
                <div style={{ fontSize: 32, fontWeight: 900, color: calculatedResults[forecasts[11].id].final >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                  {formatMonthAmount(calculatedResults[forecasts[11].id].final)}
                </div>
                <div style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500 }}>Basé sur 12 mois glissants</div>
              </div>
            </div>
          )}
        </div>

        {/* Alerte conseil */}
        {calculatedResults[forecasts[5].id].final !== 0 && (
          <div className="previsions-alert" style={{ marginTop: 24 }}>
            <span className="material-icons-round">tips_and_updates</span>
            <div>
              <div className="previsions-alert-title">Conseil Budget</div>
              <div className="previsions-alert-text">
                {calculatedResults[forecasts[5].id].final < 0 ? 'En juin, vos prévisions sont dans le rouge. Pensez à ajuster vos dépenses variables.' : 'Vos prévisions sont stables pour le premier semestre. Continuez ainsi !'}
              </div>
            </div>
          </div>
        )}
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
              width: '100%', maxWidth: 650, background: 'white', borderRadius: 32,
              padding: 32, boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)', overflowY: 'auto', maxHeight: '90vh'
            }}
            onClick={e => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <div>
                <h3 style={{ fontSize: 22, fontWeight: 900, color: 'var(--color-text-primary)', margin: 0 }}>Récurrences Globales</h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', fontWeight: 500, marginTop: 4 }}>Configurez votre base annuelle</p>
              </div>
              <button onClick={() => setIsGlobalModalOpen(false)} style={{ background: '#f1f5f9', border: 'none', width: 40, height: 40, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                <span className="material-icons-round" style={{ color: '#64748b' }}>close</span>
              </button>
            </div>

            {/* INITIAL SETUP: Starting Balance */}
            <div style={{ background: 'var(--color-primary-bg)', padding: '20px', borderRadius: 24, marginBottom: 28, border: '1px solid var(--color-primary)', display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ background: 'white', width: 48, height: 48, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(24, 82, 74, 0.2)' }}>
                <span className="material-icons-round" style={{ color: 'var(--color-primary)', fontSize: 24 }}>account_balance_wallet</span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: 'var(--color-primary-dark)', textTransform: 'uppercase', marginBottom: 4 }}>Solde au 1er Janvier</div>
                <input 
                  type="number"
                  placeholder="Ex: 1540.50"
                  value={monthsState[forecasts[0].id].manualReport || ''}
                  onChange={(e) => setMonthsState(prev => ({ 
                    ...prev, 
                    [forecasts[0].id]: { ...prev[forecasts[0].id], manualReport: e.target.value } 
                  }))}
                  style={{ width: '100%', background: 'transparent', border: 'none', fontSize: 24, fontWeight: 900, color: 'var(--color-text-primary)', outline: 'none' }}
                />
              </div>
            </div>

            {/* Sections in Modal */}
            {['revenus', 'fixes', 'variables'].map(sect => (
              <div key={sect} style={{ marginBottom: 28 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <div style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    {sect === 'revenus' ? 'Revenus' : sect === 'fixes' ? 'Dépenses Fixes' : 'Dépenses Variables'}
                  </div>
                  <button 
                    onClick={() => addGlobalRecurrence(sect)}
                    style={{ 
                      background: 'var(--color-primary)', 
                      border: 'none', 
                      width: 28, height: 28, 
                      borderRadius: 8, 
                      color: 'white', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center', 
                      cursor: 'pointer',
                      boxShadow: '0 4px 10px rgba(24, 82, 74, 0.2)'
                    }}
                  >
                    <span className="material-icons-round" style={{ fontSize: 18 }}>add</span>
                  </button>
                </div>
                {globalRecurrences[sect].length > 0 ? globalRecurrences[sect].map((line, idx) => (
                  <div key={line.id} style={{ display: 'flex', gap: 12, marginBottom: 8, alignItems: 'center' }}>
                    <div style={{ position: 'relative' }}>
                      <button 
                        onClick={() => {
                          const nextIdx = (COMMON_ICONS.indexOf(line.icon || COMMON_ICONS[0]) + 1) % COMMON_ICONS.length;
                          const newR = [...globalRecurrences[sect]];
                          newR[idx].icon = COMMON_ICONS[nextIdx];
                          setGlobalRecurrences({...globalRecurrences, [sect]: newR});
                        }}
                        style={{ width: 44, height: 44, borderRadius: 12, border: '1px solid #e2e8f0', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-primary)' }}
                        title="Changer l'icône"
                      >
                        <span className="material-icons-round" style={{ fontSize: 20 }}>{line.icon || 'category'}</span>
                      </button>
                    </div>
                    <input 
                      value={line.label}
                      onChange={(e) => {
                        const newR = [...globalRecurrences[sect]];
                        newR[idx].label = e.target.value;
                        setGlobalRecurrences({...globalRecurrences, [sect]: newR});
                      }}
                      placeholder={sect === 'revenus' ? "Ex: Salaire..." : "Ex: Loyer, Netflix..."}
                      style={{ flex: 1, height: 48, borderRadius: 12, border: '1px solid #e2e8f0', padding: '0 16px', fontSize: 14, fontWeight: 600 }}
                    />
                    <input 
                      type="number"
                      value={line.amount}
                      onChange={(e) => {
                        const newR = [...globalRecurrences[sect]];
                        newR[idx].amount = e.target.value;
                        setGlobalRecurrences({...globalRecurrences, [sect]: newR});
                      }}
                      placeholder="0.00"
                      style={{ width: 100, height: 48, borderRadius: 12, border: '1px solid #e2e8f0', padding: '0 12px', fontSize: 14, fontWeight: 800, textAlign: 'right' }}
                    />
                    <button 
                      onClick={() => {
                        const newR = [...globalRecurrences[sect]];
                        newR.splice(idx, 1);
                        setGlobalRecurrences({...globalRecurrences, [sect]: newR});
                      }}
                      style={{ background: 'none', border: 'none', color: '#cbd5e1', cursor: 'pointer' }}
                    >
                      <span className="material-icons-round" style={{ fontSize: 20 }}>delete</span>
                    </button>
                  </div>
                )) : (
                  <div 
                    onClick={() => addGlobalRecurrence(sect)}
                    style={{ border: '2px dashed #e2e8f0', borderRadius: 16, padding: '16px', textAlign: 'center', cursor: 'pointer', color: 'var(--color-text-tertiary)', fontSize: 13, fontWeight: 600 }}
                  >
                    Cliquez sur + pour ajouter {sect === 'revenus' ? 'un revenu' : 'une dépense'}
                  </div>
                )}
              </div>
            ))}

            <div style={{ background: '#f8fafc', padding: 20, borderRadius: 20, marginBottom: 24, border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span className="material-icons-round" style={{ color: 'var(--color-primary)' }}>tips_and_updates</span>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', fontWeight: 500, margin: 0, lineHeight: 1.5 }}>
                  Les catégories saisies ici seront dupliquées sur les 12 mois de l'année pour créer votre budget de référence.
                </p>
              </div>
            </div>

            <button 
              onClick={() => applyGlobalRecurrences(true)}
              style={{ width: '100%', height: 64, borderRadius: 20, border: 'none', color: 'white', background: 'var(--color-primary)', fontSize: 16, fontWeight: 900, cursor: 'pointer', boxShadow: '0 12px 24px rgba(24, 82, 74, 0.3)', transition: 'transform 0.2s', active: { transform: 'scale(0.98)' } }}
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
