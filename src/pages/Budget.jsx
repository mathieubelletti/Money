import React, { useState } from 'react';
import PageHeader from '../components/PageHeader';
import { useData } from '../context/DataContext';

const Budget = () => {
  const { categories, transactions: txGroups, goal, setGoal } = useData();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  
  // Calculate actual spending from transactions
  const getSpentForCategory = (catName) => {
    let total = 0;
    (txGroups || []).forEach(group => {
      (group?.items || []).forEach(tx => {
        if (tx.category === catName && tx.amount < 0) {
          total += Math.abs(tx.amount);
        }
      });
    });
    return total;
  };

  const categoriesWithSpent = categories.map(c => ({
    ...c,
    spent: getSpentForCategory(c.name)
  }));

  const totalSpent = categoriesWithSpent.reduce((s, c) => s + c.spent, 0);
  const totalLimit = categoriesWithSpent.reduce((s, c) => s + c.limit, 0);
  const remaining = totalLimit - totalSpent;

  // --- Goal Logic ---
  const calculateAutoSaved = () => {
    let total = 0;
    (txGroups || []).forEach(group => {
      (group?.items || []).forEach(tx => {
        // Assume 'Épargne' category transactions with negative amount 
        // on main account are savings, or just look for positive amounts 
        // to a savings account if that data was available.
        // For this mock, we'll look for positive amounts in category 'Épargne'
        // or transactions that are specifically tagged.
        if (tx.category === 'Épargne' && tx.amount > 0) {
          total += tx.amount;
        }
      });
    });
    return total;
  };

  const currentSaved = goal.isManual ? goal.manualAmount : calculateAutoSaved();
  const progressPct = Math.min((currentSaved / (goal.targetAmount || 1)) * 100, 100);
  const isFinished = progressPct >= 100;

  // --- Coaching Logic ---
  const getCoachingMessage = () => {
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
  };

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

      {/* Dépenses Fixes */}
      <section style={{ padding: '8px 24px 12px' }} className="dashboard-max-width">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap' }}>Dépenses Fixes</h3>
          <div style={{ flex: 1, height: 1.5, background: '#000000', opacity: 0.2 }}></div>
        </div>
        <div className="card" style={{ borderRadius: 16, marginBottom: 24 }}>
          {categoriesWithSpent.filter(c => c.type === 'fixe').map(cat => {
            const pct = Math.min((cat.spent / cat.limit) * 100, 100);
            const isOver = cat.spent > cat.limit;
            return (
              <div key={cat.id} className="budget-cat-item">
                <div className="budget-cat-row">
                  <div className="budget-cat-icon" style={{ background: cat.bg }}>
                    <span className="material-icons-round" style={{ color: cat.color }}>{cat.icon}</span>
                  </div>
                  <div className="budget-cat-name">{cat.name}</div>
                  <div className="budget-cat-amounts">
                    <div className="budget-cat-spent" style={{ color: isOver ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>
                      {cat.spent} €
                    </div>
                    <div className="budget-cat-limit">/{cat.limit} €</div>
                  </div>
                </div>
                <div className="budget-progress-bar">
                  <div
                    className="budget-progress-fill"
                    style={{
                      width: `${pct}%`,
                      background: isOver
                        ? 'var(--color-danger)'
                        : pct > 80
                          ? 'var(--color-warning)'
                          : 'var(--color-primary)',
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
          {categoriesWithSpent.filter(c => c.type === 'variable').map(cat => {
            const pct = Math.min((cat.spent / cat.limit) * 100, 100);
            const isOver = cat.spent > cat.limit;
            return (
              <div key={cat.id} className="budget-cat-item">
                <div className="budget-cat-row">
                  <div className="budget-cat-icon" style={{ background: cat.bg }}>
                    <span className="material-icons-round" style={{ color: cat.color }}>{cat.icon}</span>
                  </div>
                  <div className="budget-cat-name">{cat.name}</div>
                  <div className="budget-cat-amounts">
                    <div className="budget-cat-spent" style={{ color: isOver ? 'var(--color-danger)' : 'var(--color-text-primary)' }}>
                      {cat.spent} €
                    </div>
                    <div className="budget-cat-limit">/{cat.limit} €</div>
                  </div>
                </div>
                <div className="budget-progress-bar">
                  <div
                    className="budget-progress-fill"
                    style={{
                      width: `${pct}%`,
                      background: isOver
                        ? 'var(--color-danger)'
                        : pct > 80
                          ? 'var(--color-warning)'
                          : 'var(--color-primary)',
                    }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

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
          {getCoachingMessage()}
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
