import React from 'react';
import { budgetCategories } from '../data/mockData';

const Budget = () => {
  const totalSpent = budgetCategories.reduce((s, c) => s + c.spent, 0);
  const totalLimit = budgetCategories.reduce((s, c) => s + c.limit, 0);
  const remaining = totalLimit - totalSpent;

  return (
    <div className="screen animate-fade">
      {/* Header */}
      <div className="budget-header">
        <div className="budget-header-title">Budget Mensuel</div>
        <div className="budget-stats">
          <div className="budget-stat">
            <div className="budget-stat-label">Dépenses</div>
            <div className="budget-stat-value">{totalSpent.toLocaleString('fr-FR')} €</div>
          </div>
          <div className="budget-stat">
            <div className="budget-stat-label">Reste à vivre</div>
            <div className="budget-stat-value">{remaining.toLocaleString('fr-FR')} €</div>
          </div>
        </div>
      </div>

      <div className="screen-content-centered">
        {/* Conseil du jour */}
      <div className="budget-conseil">
        <span className="material-icons-round">lightbulb</span>
        <div className="budget-conseil-text">
          <strong>Conseil du jour</strong><br />
          Vous avez réduit vos dépenses "Loisirs" de 15%. Continuez pour atteindre votre objectif d'épargne !
        </div>
      </div>

      {/* Section titre */}
      <div style={{ padding: '8px 20px 4px' }}>
        <div className="section-title">Répartition par catégories</div>
      </div>

      {/* Catégories */}
      <div className="card" style={{ margin: '0 20px', borderRadius: 16 }}>
        {budgetCategories.map(cat => {
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
                        : cat.color,
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Objectif vacances */}
      <div className="budget-objectif">
        <div className="budget-objectif-title">🏖️ Objectif Vacances</div>
        <div className="budget-objectif-text">
          Économisez encore 150€ ce mois-ci pour valider votre prochain badge et financer vos billets d'avion.
        </div>
        <div style={{ marginTop: 12, height: 6, background: 'rgba(255,255,255,0.2)', borderRadius: 99, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: '63%', background: 'rgba(255,255,255,0.8)', borderRadius: 99 }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6, color: 'rgba(255,255,255,0.75)', fontSize: 11 }}>
          <span>315 € économisés</span>
          <span>Objectif : 500 €</span>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Budget;
