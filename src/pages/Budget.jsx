import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useData } from '../context/DataContext';

const Budget = () => {
  const { forecasts, monthsState, transactions: txGroups, goal, setGoal, loading, selectedPeriod } = useData();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // 2. Find the forecast for the current month
  const currentForecast = React.useMemo(() => {
    if (!selectedPeriod) return forecasts?.[0];
    return forecasts?.find(f => f.id === selectedPeriod);
  }, [forecasts, selectedPeriod]);

  // 1. Identify the current month (e.g., "Mars 2026")
  const currentMonthLabel = React.useMemo(() => {
    return currentForecast?.month || "---";
  }, [currentForecast]);

  const monthData = React.useMemo(() => {
    return currentForecast ? (monthsState[currentForecast.id] || { fixes: [], variables: [] }) : null;
  }, [currentForecast, monthsState]);

  // 3. Filter transactions for the selected month/year
  const currentMonthTransactions = React.useMemo(() => {
    if (!selectedPeriod) return [];
    // Extract YYYY-MM from the end of the selectedPeriod ID (e.g. "uuid_2026-03")
    const periodParts = String(selectedPeriod || '').split('_');
    const targetSlug = periodParts[periodParts.length - 1]; // "2026-03"

    const flat = [];
    (txGroups || []).forEach(group => {
      (group?.items || []).forEach(tx => {
        // Handle budget_month if present, else fallback to date
        // budget_month can be "2026-03-01" or "uuid_2026-03"
        const budgetAttr = tx.budget_month || tx.date;
        if (!budgetAttr) return;

        const attrParts = String(budgetAttr || '').split('_');
        const slug = attrParts[attrParts.length - 1].substring(0, 7); // Always "YYYY-MM"

        if (slug === targetSlug) {
          flat.push(tx);
        }
      });
    });
    return flat;
  }, [txGroups, selectedPeriod]);

  // 4. Calculate actual spending per budget item
  const getSpentForLabel = React.useCallback((label) => {
    const target = label?.toLowerCase().trim();
    return currentMonthTransactions
      .filter(tx => tx.category?.toLowerCase().trim() === target && tx.amount < 0)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  }, [currentMonthTransactions]);

  const fixes = React.useMemo(() => {
    return (monthData?.fixes || []).map(f => ({
      ...f,
      spent: getSpentForLabel(f.label),
      bg: 'rgba(24, 82, 74, 0.05)',
      color: 'var(--color-primary)',
      icon: f.icon || 'payments'
    }));
  }, [monthData, getSpentForLabel]);

  const variables = React.useMemo(() => {
    return (monthData?.variables || []).map(v => ({
      ...v,
      spent: getSpentForLabel(v.label),
      bg: 'rgba(24, 82, 74, 0.05)',
      color: 'var(--color-primary)',
      icon: v.icon || 'shopping_cart'
    }));
  }, [monthData, getSpentForLabel]);

  const totalSpent = React.useMemo(() => {
    return [...fixes, ...variables].reduce((sum, item) => sum + item.spent, 0);
  }, [fixes, variables]);

  const totalLimit = React.useMemo(() => {
    return [...fixes, ...variables].reduce((sum, item) => sum + (parseFloat(item.amount) || 0), 0);
  }, [fixes, variables]);

  const remaining = React.useMemo(() => totalLimit - totalSpent, [totalLimit, totalSpent]);

  // --- Goal Logic ---
  const calculateAutoSaved = React.useCallback(() => {
    let total = 0;
    (txGroups || []).forEach(group => {
      (group?.items || []).forEach(tx => {
        if (tx.category === 'Épargne' && tx.amount > 0) {
          total += tx.amount;
        }
      });
    });
    return total;
  }, [txGroups]);

  const currentSaved = React.useMemo(() => goal.isManual ? goal.manualAmount : calculateAutoSaved(), [goal.isManual, goal.manualAmount, calculateAutoSaved]);
  const progressPct = React.useMemo(() => Math.min((currentSaved / (goal.targetAmount || 1)) * 100, 100), [currentSaved, goal.targetAmount]);
  const isFinished = React.useMemo(() => progressPct >= 100, [progressPct]);

  // --- Coaching Logic ---
  const coachingMessage = React.useMemo(() => {
    if (isFinished) return "Objectif Terminé ! Félicitations ! 🎉";
    
    const resteTotal = goal.targetAmount - currentSaved;
    
    if (goal.deadline) {
      const today = new Date();
      const end = new Date(goal.deadline);
      const diffTime = end - today;
      const diffMonths = diffTime / (1000 * 60 * 60 * 24 * 30.44);
      
      if (diffMonths > 0) {
        const mensuelRequis = resteTotal / Math.max(diffMonths, 1);
        return `Il faudrait mettre de côté ${mensuelRequis.toFixed(0)}€ de plus par mois pour rester dans les temps.`;
      } else {
        return `Date limite dépassée ! Il vous manque ${resteTotal.toFixed(0)}€ pour atteindre l'objectif.`;
      }
    }
    
    if (progressPct >= 50) {
      return `Bravo ! Vous avez déjà atteint ${progressPct.toFixed(0)}% de votre objectif. Continuez ainsi !`;
    }

    return `Économisez encore ${resteTotal.toFixed(0)}€ pour atteindre votre objectif et valider votre prochain badge.`;
  }, [isFinished, goal.targetAmount, currentSaved, goal.deadline, progressPct]);

  const handleSaveGoal = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const updatedGoal = {
      ...goal,
      name: formData.get('name'),
      targetAmount: parseFloat(formData.get('targetAmount')),
      manualAmount: parseFloat(formData.get('manualAmount')),
      deadline: formData.get('deadline'),
      icon: formData.get('icon'),
      color: formData.get('color'),
      isManual: formData.get('isManual') === 'true'
    };
    setGoal(updatedGoal);
    setIsEditModalOpen(false);
  };

  return (
    <div className="screen animate-fade">
      <PageHeader title="Budget Mensuel" />

      {/* Stats Section */}
      <section style={{ padding: '24px 24px 12px' }} className="dashboard-max-width">
        <div style={{ textAlign: 'center', marginBottom: 12 }}>
          <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-secondary)', background: 'white', padding: '4px 12px', borderRadius: 20, border: '1px solid var(--color-border-light)' }}>
            {currentMonthLabel}
          </span>
        </div>
        <div style={{ 
          background: 'var(--color-primary-bg)', 
          padding: '20px', 
          borderRadius: 24, 
          border: '1px solid var(--color-border)',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '16px'
        }}>
          <div style={{ 
            background: 'white', 
            padding: '16px', 
            borderRadius: 16, 
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--color-border-light)'
          }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Dépenses</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-text-primary)' }}>{totalSpent.toLocaleString('fr-FR')} €</div>
          </div>
          <div style={{ 
            background: 'white', 
            padding: '16px', 
            borderRadius: 16, 
            boxShadow: 'var(--shadow-sm)',
            border: '1px solid var(--color-border-light)'
          }}>
            <div style={{ fontSize: 11, color: 'var(--color-text-secondary)', fontWeight: 700, textTransform: 'uppercase', marginBottom: 4 }}>Reste à vivre</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: 'var(--color-primary-dark)' }}>{remaining.toLocaleString('fr-FR')} €</div>
          </div>
        </div>
      </section>

      <div className="screen-content-centered">
        {/* Conseil du jour */}
      <div className="budget-conseil">
        <span className="material-icons-round">lightbulb</span>
        <div className="budget-conseil-text">
          <strong>Conseil du jour</strong><br />
          Vous avez réduit vos dépenses "Loisirs" de 15%. Continuez pour atteindre votre objectif d'épargne !
        </div>
      </div>

      {!monthData ? (
        <div style={{ padding: '40px 24px', textAlign: 'center' }}>
          <div style={{ background: 'white', padding: 32, borderRadius: 24, border: '2px dashed var(--color-border)' }}>
            <span className="material-icons-round" style={{ fontSize: 48, color: 'var(--color-primary)', opacity: 0.3, marginBottom: 16 }}>calendar_today</span>
            <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--color-text-primary)', margin: '0 0 8px' }}>Aucun budget configuré</p>
            <p style={{ fontSize: 13, color: 'var(--color-text-tertiary)', margin: 0 }}>Rendez-vous dans l'onglet <strong>Prévisions</strong> pour commencer à planifier ce mois.</p>
          </div>
        </div>
      ) : (
        <>
          {/* Dépenses Fixes */}
          <section style={{ padding: '8px 24px 12px' }} className="dashboard-max-width">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap' }}>Dépenses Fixes</h3>
              <div style={{ flex: 1, height: 1.5, background: '#000000', opacity: 0.2 }}></div>
            </div>
            <div className="card" style={{ borderRadius: 16, marginBottom: 24 }}>
              {fixes.length === 0 ? (
                <p style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--color-text-tertiary)' }}>Aucune dépense fixe ce mois-ci</p>
              ) : fixes.map(cat => {
                const limit = parseFloat(cat.amount) || 0.01;
                const pct = Math.min((cat.spent / limit) * 100, 100);
                const isOver = cat.spent > limit;
                return (
                  <div key={cat.id} className="budget-cat-item">
                    <div className="budget-cat-row">
                      <div className="budget-cat-icon" style={{ background: cat.bg }}>
                        <span className="material-icons-round" style={{ color: cat.color }}>{cat.icon}</span>
                      </div>
                      <div className="budget-cat-name">{cat.label}</div>
                      <div className="budget-cat-amounts">
                        <div className="budget-cat-spent" style={{ color: isOver ? 'var(--color-danger)' : (cat.spent >= limit && limit > 0 ? 'var(--color-primary)' : 'var(--color-text-primary)') }}>
                          {cat.spent.toLocaleString('fr-FR')} €
                          {cat.spent >= limit && limit > 0 && !isOver && (
                            <span style={{ fontSize: 10, marginLeft: 6, fontWeight: 900, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Payé</span>
                          )}
                        </div>
                        <div className="budget-cat-limit">/ {limit} €</div>
                      </div>
                    </div>
                    <div className="budget-progress-bar">
                      <div
                        className="budget-progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: isOver
                            ? 'var(--color-danger)'
                            : cat.spent >= limit && limit > 0
                              ? 'var(--color-primary)'
                              : pct > 80
                                ? 'var(--color-warning)'
                                : 'rgba(24, 82, 74, 0.4)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Dépenses Variables */}
          <section style={{ padding: '8px 24px 12px' }} className="dashboard-max-width">
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
              <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap' }}>Dépenses Variables</h3>
              <div style={{ flex: 1, height: 1.5, background: '#000000', opacity: 0.2 }}></div>
            </div>
            <div className="card" style={{ borderRadius: 16 }}>
              {variables.length === 0 ? (
                <p style={{ padding: 20, textAlign: 'center', fontSize: 12, color: 'var(--color-text-tertiary)' }}>Aucune dépense variable ce mois-ci</p>
              ) : variables.map(cat => {
                const limit = parseFloat(cat.amount) || 0.01;
                const pct = Math.min((cat.spent / limit) * 100, 100);
                const isOver = cat.spent > limit;
                return (
                  <div key={cat.id} className="budget-cat-item">
                    <div className="budget-cat-row">
                      <div className="budget-cat-icon" style={{ background: cat.bg }}>
                        <span className="material-icons-round" style={{ color: cat.color }}>{cat.icon}</span>
                      </div>
                      <div className="budget-cat-name">{cat.label}</div>
                      <div className="budget-cat-amounts">
                        <div className="budget-cat-spent" style={{ color: isOver ? 'var(--color-danger)' : (cat.spent >= limit && limit > 0 ? 'var(--color-primary)' : 'var(--color-text-primary)') }}>
                          {cat.spent.toLocaleString('fr-FR')} €
                          {cat.spent >= limit && limit > 0 && !isOver && (
                            <span style={{ fontSize: 10, marginLeft: 6, fontWeight: 900, color: 'var(--color-primary)', textTransform: 'uppercase' }}>Payé</span>
                          )}
                        </div>
                        <div className="budget-cat-limit">/ {limit} €</div>
                      </div>
                    </div>
                    <div className="budget-progress-bar">
                      <div
                        className="budget-progress-fill"
                        style={{
                          width: `${pct}%`,
                          background: isOver
                            ? 'var(--color-danger)'
                            : cat.spent >= limit && limit > 0
                              ? 'var(--color-primary)'
                              : pct > 80
                                ? 'var(--color-warning)'
                                : 'rgba(24, 82, 74, 0.4)',
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Objectif Section */}
      <div 
        className={`budget-objectif ${goal.color === 'purple' ? 'purple' : ''} ${isFinished ? 'finished' : ''}`}
        style={{ position: 'relative' }}
      >
        <button 
          onClick={() => setIsEditModalOpen(true)}
          style={{
            position: 'absolute', top: 16, right: 16, background: 'rgba(255,255,255,0.2)',
            border: 'none', borderRadius: '50%', width: 32, height: 32, padding: 0,
            color: 'white', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}
        >
          <span className="material-icons-round" style={{ fontSize: 18 }}>edit</span>
        </button>

        <div className="budget-objectif-title">{goal.icon} {goal.name}</div>
        <div className="budget-objectif-text">
          {coachingMessage}
        </div>
        <div style={{ marginTop: 12, height: 8, background: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden' }}>
          <div 
            style={{ 
              height: '100%', width: `${progressPct}%`, 
              background: isFinished ? '#fbbf24' : 'rgba(255,255,255,0.8)', 
              borderRadius: 99, transition: 'width 1s ease' 
            }} 
          />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 8, color: 'rgba(255,255,255,0.8)', fontSize: 11, fontWeight: 600 }}>
          <span>{currentSaved.toLocaleString('fr-FR')} € économisés</span>
          <span>Objectif : {goal.targetAmount.toLocaleString('fr-FR')} €</span>
        </div>

        {isFinished && (
          <div style={{ 
            marginTop: 12, padding: '8px', background: 'rgba(255,255,255,0.2)', 
            borderRadius: 12, textAlign: 'center', fontWeight: 800, fontSize: 12,
            border: '1px solid rgba(255,255,255,0.3)', color: '#fbbf24', textShadow: '0 1px 2px rgba(0,0,0,0.2)'
          }}>
             🌟 OBJECTIF ATTEINT ! 🌟
          </div>
        )}
      </div>

      {/* Edit Goal Modal */}
      {isEditModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'white', width: '100%', maxWidth: 500, borderRadius: 24, padding: 24,
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <h3 style={{ fontSize: 20, fontWeight: 900, marginBottom: 8 }}>Paramétrer l'Objectif</h3>
            <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', marginBottom: 24 }}>Personalisez votre projet d'épargne.</p>

            <form onSubmit={handleSaveGoal} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, marginBottom: 6, display: 'block' }}>Nom</label>
                  <input name="name" defaultValue={goal.name} required style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, marginBottom: 6, display: 'block' }}>Icône/Emoji</label>
                  <input name="icon" defaultValue={goal.icon} required style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, marginBottom: 6, display: 'block' }}>Montant cible (€)</label>
                  <input name="targetAmount" type="number" defaultValue={goal.targetAmount} required style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                </div>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 800, marginBottom: 6, display: 'block' }}>Date limite</label>
                  <input name="deadline" type="date" defaultValue={goal.deadline} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                </div>
              </div>

              <div style={{ background: '#f8fafc', padding: 16, borderRadius: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 800, marginBottom: 12, display: 'block' }}>Mode de calcul de la progression</label>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="radio" name="isManual" value="false" defaultChecked={!goal.isManual} />
                    Auto (Virements vers Épargne)
                  </label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, cursor: 'pointer' }}>
                    <input type="radio" name="isManual" value="true" defaultChecked={goal.isManual} />
                    Manuel (Saisie directe)
                  </label>
                </div>
                
                <div style={{ marginTop: 12 }}>
                   <label style={{ fontSize: 11, fontWeight: 800, marginBottom: 6, display: 'block' }}>Montant économisé (si manuel)</label>
                   <input name="manualAmount" type="number" defaultValue={goal.manualAmount} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0' }} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 11, fontWeight: 800, marginBottom: 6, display: 'block' }}>Couleur de la tuile</label>
                <select name="color" defaultValue={goal.color} style={{ width: '100%', padding: '10px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                  <option value="green">Vert Forêt (Défaut)</option>
                  <option value="purple">Violet Vibrant</option>
                </select>
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 12 }}>
                <button type="button" onClick={() => setIsEditModalOpen(false)} style={{ flex: 1, padding: 12, borderRadius: 12, border: 'none', background: '#f1f5f9', fontWeight: 700 }}>Annuler</button>
                <button type="submit" style={{ flex: 2, padding: 12, borderRadius: 12, border: 'none', background: 'var(--color-primary)', color: 'white', fontWeight: 800 }}>Enregistrer</button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
};

export default Budget;
