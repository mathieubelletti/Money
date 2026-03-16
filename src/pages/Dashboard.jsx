import React, { useState, useEffect } from 'react';
import BankLogo from '../components/BankLogo';
import { user, accounts as initialAccounts, savings, patrimonyChart, insights } from '../data/mockData';

const Dashboard = () => {
  const [accounts, setAccounts] = useState(initialAccounts);
  const [savingsItems, setSavingsItems] = useState(savings);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [manageType, setManageType] = useState('accounts'); // 'accounts' or 'savings'
  const [editingItem, setEditingItem] = useState(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const screenContainer = document.querySelector('.screen');
    const handleScroll = () => {
      if (screenContainer) {
        setShowScrollTop(screenContainer.scrollTop > 300);
      }
    };
    if (screenContainer) {
      screenContainer.addEventListener('scroll', handleScroll);
    }
    return () => screenContainer?.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    const screenContainer = document.querySelector('.screen');
    if (screenContainer) {
      screenContainer.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleDeleteItem = (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cet élément ?')) {
      if (manageType === 'accounts') {
        setAccounts(accounts.filter(acc => acc.id !== id));
      } else {
        setSavingsItems(savingsItems.filter(s => s.id !== id));
      }
    }
  };

  const handleSaveItem = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    
    if (manageType === 'accounts') {
      const updatedAccount = {
        ...editingItem,
        name: formData.get('name'),
        domain: formData.get('domain'),
        accountNumber: formData.get('accountNumber'),
        balance: parseFloat(formData.get('balance')),
        initialBalance: parseFloat(formData.get('initialBalance')),
      };
      setAccounts(accounts.map(acc => acc.id === editingItem.id ? updatedAccount : acc));
    } else {
      const updatedSaving = {
        ...editingItem,
        name: formData.get('name'),
        bank: formData.get('bank'),
        domain: formData.get('domain'),
        balance: parseFloat(formData.get('balance')),
        rate: parseFloat(formData.get('rate')),
      };
      setSavingsItems(savingsItems.map(s => s.id === editingItem.id ? updatedSaving : s));
    }
    setEditingItem(null);
  };

  const handleAddItem = () => {
    const id = Date.now();
    if (manageType === 'accounts') {
      const newAcc = {
        id,
        name: 'Nouveau Compte',
        short: 'NC',
        balance: 0,
        initialBalance: 0,
        domain: 'google.com',
        accountNumber: 'FR76 0000 0000 0000 0000 0000 000',
      };
      setAccounts([...accounts, newAcc]);
      setEditingItem(newAcc);
    } else {
      const newSaving = {
        id,
        name: 'Nouveau Livret',
        bank: 'Votre Banque',
        domain: 'google.com',
        balance: 0,
        rate: 0.5,
      };
      setSavingsItems([...savingsItems, newSaving]);
      setEditingItem(newSaving);
    }
  };

  return (
    <div className="screen">
      {/* Top Bar Navigation */}
      <header style={{ 
        position: 'sticky', 
        top: 0, 
        zIndex: 60, 
        background: 'white', 
        padding: '16px 24px',
        borderBottom: '1px solid var(--color-border-light)',
        boxShadow: '0 2px 10px rgba(0,0,0,0.02)'
      }}>
        <div className="dashboard-max-width" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ 
              width: 44, height: 44, borderRadius: '50%', background: '#f1f5f9', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', 
              fontWeight: 800, fontSize: 20, border: '2px solid white', boxShadow: 'var(--shadow-sm)'
            }}>
              {user.avatar}
            </div>
            <div>
              <h2 style={{ fontSize: 18, fontWeight: 900, color: 'var(--color-text-primary)', margin: 0, letterSpacing: '-0.01em' }}>Tableau de bord</h2>
              <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '2px 0 0', fontWeight: 600 }}>Bonjour, {user.name}</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 10 }}>
            <button style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'var(--color-primary-bg)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <span className="material-icons-round" style={{ fontSize: 20 }}>notifications</span>
            </button>
            <button style={{ width: 40, height: 40, borderRadius: '50%', border: 'none', background: 'var(--color-primary-bg)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
              <span className="material-icons-round" style={{ fontSize: 20 }}>settings</span>
            </button>
          </div>
        </div>
      </header>

      {/* Balance Card Section */}
      <section style={{ padding: '24px 24px 0' }} className="dashboard-max-width">
        <div style={{ 
          background: 'linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%)', 
          padding: '24px', 
          borderRadius: 24, 
          border: '1px solid var(--color-border)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: '0 10px 25px -5px rgba(46, 204, 112, 0.15)'
        }}>
          <div style={{ position: 'absolute', top: 20, right: 20, color: 'var(--color-primary)', opacity: 0.8 }}>
            <span className="material-icons-round" style={{ fontSize: 28 }}>account_balance_wallet</span>
          </div>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--color-text-secondary)', margin: 0 }}>Solde Total consolidé</p>
            <h1 style={{ fontSize: 36, fontWeight: 900, color: 'var(--color-text-primary)', margin: '12px 0', letterSpacing: '-0.02em' }}>
              {user.totalBalance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}
            </h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--color-success)', fontWeight: 800, fontSize: 13 }}>
                <span className="material-icons-round" style={{ fontSize: 18 }}>trending_up</span>
                <span>+3.2%</span>
              </div>
              <span style={{ color: 'var(--color-text-tertiary)', fontSize: 13, fontWeight: 600 }}>ce mois-ci</span>
            </div>
          </div>
        </div>
      </section>

      {/* Monthly Summary (Revenus / Dépenses) */}
      <section style={{ padding: '24px' }} className="dashboard-max-width">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap' }}>Résumé du mois</h3>
          <div style={{ flex: 1, height: 1.5, background: '#000000', opacity: 0.2 }}></div>
        </div>
        <div className="form-tiles-responsive" style={{ display: 'flex', gap: 16 }}>
          <div style={{ 
            flex: 1, background: 'white', padding: 20, borderRadius: 24, 
            border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)',
            display: 'flex', alignItems: 'center', gap: 16
          }}>
            <div style={{ 
              width: 48, height: 48, borderRadius: 16, background: 'var(--color-success-light)', 
              color: 'var(--color-success)', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <span className="material-icons-round">trending_up</span>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Revenus</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-text-primary)', margin: '4px 0 0' }}>4 250,00 €</p>
            </div>
          </div>
          
          <div style={{ 
            flex: 1, background: 'white', padding: 20, borderRadius: 24, 
            border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)',
            display: 'flex', alignItems: 'center', gap: 16
          }}>
            <div style={{ 
              width: 48, height: 48, borderRadius: 16, background: 'rgba(239, 68, 68, 0.1)', 
              color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
              <span className="material-icons-round">trending_down</span>
            </div>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--color-text-tertiary)', margin: 0, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Dépenses</p>
              <p style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-text-primary)', margin: '4px 0 0' }}>2 840,30 €</p>
            </div>
          </div>
        </div>
      </section>

      {/* Connected Accounts */}
      <section style={{ padding: '0 24px 24px' }} className="dashboard-max-width">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap' }}>Comptes connectés</h3>
          <div style={{ flex: 1, height: 1.5, background: '#000000', opacity: 0.2 }}></div>
          <button onClick={() => { setManageType('accounts'); setIsManageModalOpen(true); }} style={{ 
            background: 'none', border: 'none', color: 'var(--color-primary)', 
            fontSize: 13, fontWeight: 800, cursor: 'pointer' 
          }}>Gérer</button>
        </div>
        <div className="tablet-grid" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12, margin: '0 -24px', paddingLeft: 24, paddingRight: 24 }}>
          {accounts.map(acc => (
            <div key={acc.id} style={{ 
              minWidth: 140, background: 'white', padding: 16, borderRadius: 18, 
              border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)'
            }}>
              <BankLogo domain={acc.domain} name={acc.name} color={acc.color} size={32} style={{ marginBottom: 12 }} />
              <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>{acc.name}</p>
              <p style={{ 
                fontSize: 10, 
                color: 'var(--color-text-tertiary)', 
                fontWeight: 700, 
                marginTop: 4,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '100%'
              }} title={acc.accountNumber}>
                {acc.accountNumber}
              </p>
              <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--color-text-primary)', marginTop: 12 }}>{acc.balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Savings Section */}
      <section style={{ padding: '0 24px 24px' }} className="dashboard-max-width">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap' }}>Épargne</h3>
          <div style={{ flex: 1, height: 1.5, background: '#000000', opacity: 0.2 }}></div>
          <button onClick={() => { setManageType('savings'); setIsManageModalOpen(true); }} style={{ 
            background: 'none', border: 'none', color: 'var(--color-primary)', 
            fontSize: 13, fontWeight: 800, cursor: 'pointer' 
          }}>Gérer</button>
        </div>
        <div className="tablet-grid" style={{ display: 'flex', gap: 16, overflowX: 'auto', paddingBottom: 12, margin: '0 -24px', paddingLeft: 24, paddingRight: 24 }}>
          {savingsItems.map(save => (
            <div key={save.id} style={{ 
              minWidth: 160, background: 'white', padding: 16, borderRadius: 18, 
              border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <BankLogo domain={save.domain} name={save.bank} color={save.color} size={28} />
                <span style={{ fontSize: 10, fontWeight: 800, color: 'var(--color-success)', background: 'var(--color-success-light)', padding: '2px 6px', borderRadius: 4 }}>{save.rate}%</span>
              </div>
              <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>{save.name}</p>
              <p style={{ fontSize: 11, color: 'var(--color-text-tertiary)', fontWeight: 600, marginTop: 2 }}>{save.bank}</p>
              <p style={{ fontSize: 14, fontWeight: 900, color: 'var(--color-primary-dark)', marginTop: 12 }}>{save.balance.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Evolution Chart Section */}
      <section style={{ padding: '0 24px 24px' }} className="dashboard-max-width">
        <div style={{ background: 'white', padding: 24, borderRadius: 24, border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-sm)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
              <div>
                <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap' }}>Évolution du patrimoine</h3>
                <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: '4px 0 0' }}>6 derniers mois</p>
              </div>
              <div style={{ flex: 1, height: 1.5, background: '#000000', marginTop: -20, opacity: 0.2 }}></div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'var(--color-primary-glass)', color: 'var(--color-primary-dark)', padding: '6px 12px', borderRadius: 12, fontSize: 12, fontWeight: 800, marginLeft: 16 }}>
              <span className="material-icons-round" style={{ fontSize: 16 }}>calendar_today</span>
              Juin
            </div>
          </div>
          
          <div style={{ height: 160, width: '100%', position: 'relative', marginTop: 12 }}>
            <svg viewBox="0 0 400 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
              <defs>
                <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.2" />
                  <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
              {/* Path / Area */}
              <path 
                d="M 0 120 C 40 115, 80 135, 120 100 S 200 40, 240 70 S 320 20, 400 35 L 400 150 L 0 150 Z" 
                fill="url(#chart-grad)"
              />
              {/* Main Line */}
              <path 
                d="M 0 120 C 40 115, 80 135, 120 100 S 200 40, 240 70 S 320 20, 400 35" 
                fill="none" 
                stroke="var(--color-primary)" 
                strokeWidth="3" 
                strokeLinecap="round"
              />
              {/* Points */}
              <circle cx="120" cy="100" r="4" fill="var(--color-primary)" />
              <circle cx="240" cy="70" r="4" fill="var(--color-primary)" />
              <circle cx="400" cy="35" r="4" fill="var(--color-primary)" />
            </svg>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, padding: '0 4px' }}>
            {patrimonyChart.map(data => (
              <span key={data.month} style={{ fontSize: 10, fontWeight: 800, color: data.month === 'JUIN' ? 'var(--color-primary-dark)' : 'var(--color-text-tertiary)' }}>{data.month}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Insights */}
      <section style={{ padding: '0 24px 24px' }} className="dashboard-max-width">
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0, whiteSpace: 'nowrap' }}>Insights Financiers</h3>
          <div style={{ flex: 1, height: 1.5, background: '#000000', opacity: 0.2 }}></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {insights.map(insight => (
            <div key={insight.id} style={{ 
              display: 'flex', gap: 16, background: 'white', padding: 16, borderRadius: 18, 
              border: '1px solid var(--color-border-light)', alignItems: 'center'
            }}>
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: insight.bg, color: insight.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-icons-round">{insight.icon}</span>
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>{insight.title}</p>
                <p style={{ fontSize: 12, color: 'var(--color-text-secondary)', margin: '4px 0 0', lineHeight: 1.4 }}>{insight.text}</p>
              </div>
              <span className="material-icons-round" style={{ color: 'var(--color-text-tertiary)' }}>chevron_right</span>
            </div>
          ))}
        </div>
      </section>

      {/* Manage Modal */}
      {isManageModalOpen && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(8px)',
          zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20
        }}>
          <div style={{
            background: 'white', width: '100%', maxWidth: 700, maxHeight: '90vh',
            borderRadius: 24, overflow: 'hidden', display: 'flex', flexDirection: 'column',
            boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)'
          }}>
            <div style={{ padding: 24, borderBottom: '1px solid var(--color-border-light)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ fontSize: 20, fontWeight: 900, color: 'var(--color-text-primary)', margin: 0 }}>
                  {manageType === 'accounts' ? 'Gestion des comptes' : "Gestion de l'épargne"}
                </h3>
                <p style={{ fontSize: 13, color: 'var(--color-text-secondary)', margin: '4px 0 0' }}>
                  {manageType === 'accounts' ? 'Configurez vos connexions bancaires.' : 'Gérez vos livrets et placements.'}
                </p>
              </div>
              <button onClick={() => { setIsManageModalOpen(false); setEditingItem(null); }} style={{ 
                width: 36, height: 36, borderRadius: '50%', border: 'none', background: '#f1f5f9', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer'
              }}>
                <span className="material-icons-round" style={{ fontSize: 20, color: 'var(--color-text-secondary)' }}>close</span>
              </button>
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: 24 }}>
              {editingItem ? (
                <form onSubmit={handleSaveItem} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                  
                  {/* Multi-Tile Layout: Responsive Stack/Side-by-Side */}
                  <div className="form-tiles-responsive">
                    
                    {/* Tile 1: Institution Info */}
                    <div style={{ flex: 1, background: '#f8fafc', padding: '20px', borderRadius: 20, border: '1.5px solid var(--color-border-light)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ background: 'var(--color-primary-glass)', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-icons-round" style={{ color: 'var(--color-primary)', fontSize: 16 }}>business</span>
                        </div>
                        <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Établissement</h4>
                      </div>
                      
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                        <div className="form-group">
                          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>
                            {manageType === 'accounts' ? 'NOM DE LA BANQUE' : 'NOM DU LIVRET'}
                          </label>
                          <div style={{ position: 'relative' }}>
                            <span className="material-icons-round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', fontSize: 16 }}>label</span>
                            <input name="name" defaultValue={editingItem.name} placeholder={manageType === 'accounts' ? "ex: BNP" : "ex: Livret A"} required style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 10, border: '1.5px solid var(--color-border-light)', outline: 'none', fontSize: 13, fontWeight: 600, background: 'white' }} />
                          </div>
                        </div>

                        <div className="form-group">
                          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>
                            {manageType === 'accounts' ? 'DOMAINE WEB' : 'BANQUE / ÉTABLISSEMENT'}
                          </label>
                          <div style={{ position: 'relative' }}>
                            <span className="material-icons-round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', fontSize: 16 }}>
                              {manageType === 'accounts' ? 'language' : 'account_balance'}
                            </span>
                            <input 
                              name={manageType === 'accounts' ? "domain" : "bank"} 
                              defaultValue={manageType === 'accounts' ? editingItem.domain : editingItem.bank} 
                              placeholder={manageType === 'accounts' ? "ex: bnp.fr" : "ex: Société Générale"} 
                              required 
                              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 10, border: '1.5px solid var(--color-border-light)', outline: 'none', fontSize: 13, fontWeight: 600, background: 'white' }} 
                            />
                          </div>
                        </div>
                        {manageType === 'savings' && (
                          <div className="form-group">
                             <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>DOMAINE (ICÔNE)</label>
                             <div style={{ position: 'relative' }}>
                               <span className="material-icons-round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', fontSize: 16 }}>language</span>
                               <input name="domain" defaultValue={editingItem.domain} placeholder="ex: bnp.fr" required style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 10, border: '1.5px solid var(--color-border-light)', outline: 'none', fontSize: 13, fontWeight: 600, background: 'white' }} />
                             </div>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Tile 2: Account Details */}
                    <div style={{ flex: 1.4, background: '#f8fafc', padding: '20px', borderRadius: 20, border: '1.5px solid var(--color-border-light)', display: 'flex', flexDirection: 'column' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                        <div style={{ background: 'var(--color-primary-glass)', width: 28, height: 28, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <span className="material-icons-round" style={{ color: 'var(--color-primary)', fontSize: 16 }}>account_balance_wallet</span>
                        </div>
                        <h4 style={{ fontSize: 12, fontWeight: 800, color: 'var(--color-text-primary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>Détails Compte</h4>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16, flex: 1 }}>
                        <div className="form-group">
                          <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>
                            {manageType === 'accounts' ? 'IBAN / NUMÉRO' : "TAUX D'INTÉRÊT"}
                          </label>
                          <div style={{ position: 'relative' }}>
                            <span className="material-icons-round" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', fontSize: 16 }}>
                              {manageType === 'accounts' ? 'numbers' : 'percent'}
                            </span>
                            <input 
                              name={manageType === 'accounts' ? "accountNumber" : "rate"} 
                              type={manageType === 'accounts' ? "text" : "number"}
                              step="0.01"
                              defaultValue={manageType === 'accounts' ? editingItem.accountNumber : editingItem.rate} 
                              placeholder={manageType === 'accounts' ? "FR76..." : "ex: 3.0"} 
                              required 
                              style={{ width: '100%', padding: '10px 10px 10px 36px', borderRadius: 10, border: '1.5px solid var(--color-border-light)', outline: 'none', fontSize: 13, fontWeight: 600, background: 'white' }} 
                            />
                          </div>
                        </div>

                        <div style={{ display: 'flex', gap: 12 }}>
                          <div className="form-group" style={{ flex: 1 }}>
                            <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>SOLDE ACTUEL</label>
                            <div style={{ position: 'relative' }}>
                              <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', fontWeight: 800, fontSize: 12 }}>€</span>
                              <input name="balance" type="number" step="0.01" defaultValue={editingItem.balance} required style={{ width: '100%', padding: '10px 8px 10px 22px', borderRadius: 10, border: '1.5px solid var(--color-border-light)', outline: 'none', fontSize: 13, fontWeight: 700, background: 'white' }} />
                            </div>
                          </div>
                          {manageType === 'accounts' && (
                            <div className="form-group" style={{ flex: 1 }}>
                              <label style={{ fontSize: 10, fontWeight: 700, color: 'var(--color-text-secondary)', marginBottom: 6, display: 'block' }}>INITIAL</label>
                              <div style={{ position: 'relative' }}>
                                <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-tertiary)', fontWeight: 800, fontSize: 12 }}>€</span>
                                <input name="initialBalance" type="number" step="0.01" defaultValue={editingItem.initialBalance} required style={{ width: '100%', padding: '10px 8px 10px 22px', borderRadius: 10, border: '1.5px solid var(--color-border-light)', outline: 'none', fontSize: 13, fontWeight: 700, background: 'white' }} />
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 12, borderTop: '1px solid var(--color-border-light)', paddingTop: 20 }}>
                    <button type="button" onClick={() => setEditingItem(null)} style={{ flex: 1, padding: '14px', borderRadius: 14, border: 'none', background: '#f1f5f9', color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Annuler</button>
                    <button type="submit" style={{ flex: 2, padding: '14px', borderRadius: 14, border: 'none', background: 'var(--color-primary)', color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: '0 8px 16px -4px rgba(46, 204, 112, 0.3)' }}>Enregistrer les modifications</button>
                  </div>
                </form>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {(manageType === 'accounts' ? accounts : savingsItems).map(item => (
                    <div key={item.id} style={{
                      display: 'flex', alignItems: 'center', gap: 16, background: '#f8fafc',
                      padding: '16px 20px', borderRadius: 18, border: '1.5px solid var(--color-border-light)'
                    }}>
                      <BankLogo domain={item.domain} name={manageType === 'accounts' ? item.name : item.bank} size={40} />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--color-text-primary)', margin: 0 }}>{item.name}</p>
                        <p style={{ fontSize: 12, color: 'var(--color-text-tertiary)', margin: '2px 0 0' }}>
                          {manageType === 'accounts' ? item.accountNumber : item.bank}
                        </p>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button onClick={() => setEditingItem(item)} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'white', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                          <span className="material-icons-round" style={{ fontSize: 18 }}>edit</span>
                        </button>
                        <button onClick={() => handleDeleteItem(item.id)} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: 'white', color: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                          <span className="material-icons-round" style={{ fontSize: 18 }}>delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button onClick={handleAddItem} style={{
                    width: '100%', padding: '20px', borderRadius: 18, border: '2px dashed #cbd5e1',
                    background: '#f8fafc', color: 'var(--color-text-secondary)', fontSize: 14, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, cursor: 'pointer',
                    marginTop: 8
                  }}>
                    <span className="material-icons-round">add_circle_outline</span>
                    {manageType === 'accounts' ? 'Ajouter un établissement' : 'Ajouter un livret'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Scroll to Top FAB */}
      {showScrollTop && (
        <button 
          onClick={scrollToTop}
          style={{
            position: 'fixed',
            bottom: 100,
            right: 20,
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: 'var(--color-primary)',
            color: 'white',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 8px 16px rgba(46, 204, 112, 0.3)',
            cursor: 'pointer',
            zIndex: 100,
            transition: 'all 0.3s ease'
          }}
          className="animate-fade"
        >
          <span className="material-icons-round" style={{ fontSize: 24 }}>expand_less</span>
        </button>
      )}
    </div>
  );
};

export default Dashboard;
