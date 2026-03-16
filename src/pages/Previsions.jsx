import React, { useState } from 'react';
import { forecasts, previsionsTabs } from '../data/mockData';
import { formatBalance } from '../utils/helpers';

const Previsions = () => {
  const [activeTab, setActiveTab] = useState('Mois');

  const formatMonthAmount = (amount) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}${amount.toLocaleString('fr-FR')} €`;
  };

  return (
    <div className="screen animate-fade">
      {/* Header */}
      <div className="previsions-header">
        <div className="previsions-header-title">Prévisions annuelles</div>
        <div className="previsions-tabs">
          {previsionsTabs.map(tab => (
            <button
              key={tab}
              className={`previsions-tab ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="previsions-solde-card">
          <div className="previsions-solde-label">Solde prévisionnel à 12 mois</div>
          <div className="previsions-solde">{formatBalance(12450.00)}</div>
          <div className="previsions-solde-sub">Basé sur vos revenus et dépenses récurrents</div>
        </div>
      </div>

      <div className="screen-content-centered">
        {/* Titre section */}
      <div style={{ padding: '20px 20px 8px' }}>
        <div className="section-title">Récapitulatif mensuel</div>
      </div>

      {/* Mois */}
      <div className="card" style={{ margin: '0 20px', borderRadius: 16 }}>
        {forecasts.map(f => (
          <div key={f.id} className="month-forecast-card">
            <div className="month-forecast-inner">
              <div
                className="month-forecast-badge"
                style={{
                  background: f.type === 'excedent'
                    ? 'linear-gradient(135deg, #22c55e, #16a34a)'
                    : 'linear-gradient(135deg, #ef4444, #dc2626)',
                }}
              >
                {f.shortMonth}
              </div>
              <div className="month-forecast-info">
                <div className="month-forecast-month">{f.month}</div>
                <div className="month-forecast-ops">{f.ops} opérations prévues</div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div
                  className="month-forecast-amount"
                  style={{ color: f.type === 'excedent' ? 'var(--color-success)' : 'var(--color-danger)' }}
                >
                  {formatMonthAmount(f.amount)}
                </div>
                <span className={`month-forecast-tag ${f.type === 'excedent' ? 'tag-excedent' : 'tag-deficit'}`}>
                  {f.type === 'excedent' ? 'Excédent' : 'Déficit'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alerte conseil */}
      <div className="previsions-alert">
        <span className="material-icons-round">tips_and_updates</span>
        <div>
          <div className="previsions-alert-title">Conseil Budget</div>
          <div className="previsions-alert-text">
            En juin, vos dépenses prévues dépassent vos revenus de 120 €. Pensez à ajuster vos virements d'épargne pour éviter un découvert.
          </div>
        </div>
        </div>
      </div>
    </div>
  );
};

export default Previsions;
