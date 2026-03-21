import React, { useState } from 'react';

// --- Moteur Fiscal ---
export const calculateIncomeTax = (revenuBrut, parts, fraisReels, credits) => {
  let abattement = 0;
  if (fraisReels !== null && fraisReels > 0) {
    abattement = fraisReels;
  } else {
    abattement = revenuBrut * 0.10;
    if (abattement > 14171) abattement = 14171; // Plafond légal pour les revenus 2024
  }
  
  const rni = Math.max(0, revenuBrut - abattement);
  const qf = rni / parts;
  
  let impotPourUnePart = 0;
  const TRANCHES = [
    { seuil: 0, plafond: 11600, taux: 0.00 },
    { seuil: 11600, plafond: 29579, taux: 0.11 },
    { seuil: 29579, plafond: 84577, taux: 0.30 },
    { seuil: 84577, plafond: 181917, taux: 0.41 },
    { seuil: 181917, plafond: Infinity, taux: 0.45 }
  ];

  for (const tranche of TRANCHES) {
    if (qf > tranche.seuil) {
      const montantImposableDansTranche = Math.min(qf, tranche.plafond) - tranche.seuil;
      impotPourUnePart += montantImposableDansTranche * tranche.taux;
    }
  }
  
  let impotBrut = impotPourUnePart * parts;
  let impotNet = Math.max(0, impotBrut - (credits || 0));
  
  return { revenuBrut, rni, impotBrut, impotNet, tauxMoyen: revenuBrut > 0 ? (impotNet / revenuBrut) * 100 : 0 };
};

const SectionHeader = ({ title, rightAction }) => (
  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, padding: '0 4px' }}>
    <h3 style={{ fontSize: 11, fontWeight: 900, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', margin: 0 }}>
      {title}
    </h3>
    {rightAction && rightAction}
  </div>
);

const CustomToggle = ({ checked, onChange }) => (
  <div 
    onClick={onChange}
    style={{
      width: 52, height: 30, borderRadius: 16,
      background: checked ? 'var(--color-primary)' : 'var(--color-border)',
      position: 'relative', cursor: 'pointer', transition: 'background 0.3s ease'
    }}
  >
    <div style={{
      width: 26, height: 26, borderRadius: 13, background: 'white',
      position: 'absolute', top: 2, left: checked ? 24 : 2,
      transition: 'left 0.3s cubic-bezier(0.4, 0.0, 0.2, 1)', 
      boxShadow: '0 2px 4px rgba(0,0,0,0.15)'
    }} />
  </div>
);

const Taxes = ({ onBack }) => {
  const [revenuFiscal, setRevenuFiscal] = useState('');
  const [parts, setParts] = useState(2.5);
  const [abattementAuto, setAbattementAuto] = useState(true);
  const [fraisReels, setFraisReels] = useState('');
  const [credits, setCredits] = useState('');
  const [csg, setCsg] = useState('');

  // Live calculation
  const simulation = calculateIncomeTax(
    parseFloat(revenuFiscal) || 0,
    parts,
    abattementAuto ? null : parseFloat(fraisReels),
    parseFloat(credits)
  );

  const handleAbattementToggle = () => {
    setAbattementAuto(true);
  };
  
  const handleFraisReelsToggle = () => {
    setAbattementAuto(false);
  };

  const handleSave = () => {
    // Save to DataContext/Supabase logic goes here eventually
    console.log("Saving tax params:", { parts, abattementAuto, fraisReels, credits, csg });
    
    // Quick Simulation test for Verification Plan
    console.log("Moteur Fiscal Résultat:", simulation);
    
    // Return to Hub
    onBack();
  };

  const tranches = [
    { label: "Jusqu'à 11 600 €", desc: "Tranche A", taux: "0%" },
    { label: "11 601 € à 29 579 €", desc: "Tranche B", taux: "11%" },
    { label: "29 580 € à 84 577 €", desc: "Tranche C", taux: "30%" },
    { label: "84 578 € à 181 917 €", desc: "Tranche D", taux: "41%" },
    { label: "Plus de 181 917 €", desc: "Tranche E", taux: "45%" }
  ];

  return (
    <div className="screen animate-fade" style={{ background: 'var(--color-bg)', minHeight: '100vh', paddingBottom: 40 }}>
      {/* Header */}
      <header style={{ 
        padding: '16px 20px', background: 'white', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        borderBottom: '1.5px solid var(--color-border)', position: 'sticky', top: 0, zIndex: 100
      }}>
        <button onClick={onBack} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', color: 'var(--color-text-primary)' }}>
          <span className="material-icons-round">arrow_back</span>
        </button>
        <h2 style={{ fontSize: 16, fontWeight: 900, color: 'var(--color-text-primary)', margin: 0 }}>Paramètres Fiscaux</h2>
        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, display: 'flex', color: 'var(--color-text-tertiary)' }}>
          <span className="material-icons-round">notifications</span>
        </button>
      </header>

      <div style={{ padding: '24px 20px', display: 'flex', flexDirection: 'column', gap: 32 }} className="dashboard-max-width">
        
        {/* Vos Revenus */}
        <section>
          <SectionHeader title="Vos Revenus" />
          <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-primary-bg)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-icons-round" style={{ fontSize: 22 }}>payments</span>
              </div>
              <div>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--color-text-primary)' }}>Montant Net Imposable</h4>
                <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>Le "net fiscal" de votre fiche de paie</p>
              </div>
            </div>
            <div style={{ position: 'relative' }}>
              <input 
                type="number" 
                placeholder="0"
                value={revenuFiscal}
                onChange={e => setRevenuFiscal(e.target.value)}
                style={{ 
                  width: '100%', padding: '16px 20px', borderRadius: 14, border: '1px solid var(--color-border)', background: 'var(--color-bg)',
                  outline: 'none', fontSize: 16, fontWeight: 800, color: 'var(--color-primary)'
                }}
              />
              <span style={{ position: 'absolute', right: 20, top: 16, fontSize: 16, fontWeight: 900, color: 'var(--color-text-secondary)' }}>€</span>
            </div>
          </div>
        </section>

        {/* Quotient Familial */}
        <section>
          <SectionHeader title="Quotient familial" />
          <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-xs)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h4 style={{ margin: 0, fontSize: 15, fontWeight: 900, color: 'var(--color-text-primary)' }}>Nombre de parts</h4>
                <p style={{ margin: '4px 0 0', fontSize: 12, fontWeight: 600, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>Définit le calcul de votre imposition</p>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, background: 'var(--color-bg)', padding: '6px 12px', borderRadius: 12, border: '1px solid var(--color-border)' }}>
                <button onClick={() => setParts(Math.max(1, parts - 0.5))} style={{ border: 'none', background: 'none', color: 'var(--color-primary)', display: 'flex', padding: 4, cursor: 'pointer' }}>
                  <span className="material-icons-round" style={{ fontSize: 20 }}>remove</span>
                </button>
                <span style={{ fontSize: 16, fontWeight: 900, color: 'var(--color-text-primary)', width: 32, textAlign: 'center' }}>{parts}</span>
                <button onClick={() => setParts(parts + 0.5)} style={{ border: 'none', background: 'none', color: 'var(--color-primary)', display: 'flex', padding: 4, cursor: 'pointer' }}>
                  <span className="material-icons-round" style={{ fontSize: 20 }}>add</span>
                </button>
              </div>
            </div>
          </div>
        </section>

        {/* Abattements & Déductions */}
        <section>
          <SectionHeader title="Abattements & Déductions" />
          <div style={{ background: 'white', borderRadius: 20, padding: '8px 20px', border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-xs)', display: 'flex', flexDirection: 'column' }}>
            
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0', borderBottom: '1px solid var(--color-border-light)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-primary-bg)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-icons-round" style={{ fontSize: 22 }}>percent</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--color-text-primary)' }}>Abattement forfaitaire (10%)</h4>
                  <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>Appliqué automatiquement</p>
                </div>
              </div>
              <CustomToggle checked={abattementAuto} onChange={handleAbattementToggle} />
            </div>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 0' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--color-primary-bg)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-icons-round" style={{ fontSize: 22 }}>receipt_long</span>
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--color-text-primary)' }}>Frais Réels</h4>
                  <p style={{ margin: '2px 0 0', fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>Déduisez vos dépenses professionnelles</p>
                </div>
              </div>
              <CustomToggle checked={!abattementAuto} onChange={handleFraisReelsToggle} />
            </div>

            <div style={{ padding: '0 0 16px', marginTop: 4, opacity: abattementAuto ? 0.3 : 1, pointerEvents: abattementAuto ? 'none' : 'auto', transition: 'opacity 0.3s' }}>
              <div style={{ position: 'relative' }}>
                <input 
                  type="number" 
                  placeholder="Montant annuel des frais"
                  value={fraisReels}
                  onChange={e => setFraisReels(e.target.value)}
                  disabled={abattementAuto}
                  style={{ 
                    width: '100%', padding: '16px 20px', borderRadius: 14, border: 'none', background: 'var(--color-bg)',
                    outline: 'none', fontSize: 14, fontWeight: 600, color: 'var(--color-text-primary)'
                  }}
                />
                <span style={{ position: 'absolute', right: 20, top: 16, fontSize: 15, fontWeight: 900, color: 'var(--color-text-secondary)' }}>€</span>
              </div>
            </div>

          </div>
        </section>

        {/* Barème */}
        <section>
          <SectionHeader 
            title="Barème d'imposition 2026" 
            rightAction={<button style={{ border: 'none', background: 'none', color: 'var(--color-primary)', fontSize: 11, fontWeight: 800, textTransform: 'uppercase', cursor: 'pointer', letterSpacing: '0.05em' }}>Réinitialiser</button>} 
          />
          <div style={{ background: 'white', borderRadius: 20, border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-xs)', overflow: 'hidden' }}>
            <div style={{ display: 'flex', padding: '16px 20px', borderBottom: '1.5px solid var(--color-border-light)', background: 'rgba(248, 250, 252, 0.5)' }}>
              <span style={{ flex: 1, fontSize: 10, fontWeight: 900, color: 'var(--color-text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tranche (Seuil)</span>
              <span style={{ width: 60, fontSize: 10, fontWeight: 900, color: 'var(--color-text-secondary)', textTransform: 'uppercase', textAlign: 'left', letterSpacing: '0.05em' }}>Taux</span>
              <span style={{ width: 24 }}></span>
            </div>
            
            {tranches.map((t, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', padding: '16px 20px', borderBottom: idx !== tranches.length - 1 ? '1px solid var(--color-border-light)' : 'none' }}>
                <div style={{ flex: 1 }}>
                  <h4 style={{ margin: 0, fontSize: 13, fontWeight: 900, color: 'var(--color-text-primary)' }}>{t.label}</h4>
                  <p style={{ margin: '4px 0 0', fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>{t.desc}</p>
                </div>
                <div style={{ width: 60, fontSize: 14, fontWeight: 900, color: 'var(--color-primary)' }}>
                  {t.taux}
                </div>
                <button style={{ width: 24, padding: 0, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', background: 'none', border: 'none', color: 'var(--color-border-light)', cursor: 'pointer' }}>
                  <span className="material-icons-round" style={{ fontSize: 16 }}>edit</span>
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* Optimisation */}
        <section>
          <SectionHeader title="Optimisation & Détails" />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            
            <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span className="material-icons-round" style={{ color: 'var(--color-primary)', fontSize: 22 }}>eco</span>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--color-text-primary)' }}>Crédits d'impôts</h4>
              </div>
              <input 
                type="number" placeholder="Dons, emploi..."
                value={credits} onChange={e => setCredits(e.target.value)}
                style={{ width: '100%', padding: '16px 20px', borderRadius: 14, border: 'none', background: 'var(--color-bg)', outline: 'none', fontSize: 14, fontWeight: 600 }}
              />
            </div>

            <div style={{ background: 'white', borderRadius: 20, padding: 20, border: '1px solid var(--color-border-light)', boxShadow: 'var(--shadow-xs)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <span className="material-icons-round" style={{ color: 'var(--color-primary)', fontSize: 22 }}>account_balance</span>
                <h4 style={{ margin: 0, fontSize: 14, fontWeight: 900, color: 'var(--color-text-primary)' }}>CSG Déductible</h4>
              </div>
              <input 
                type="number" placeholder="Montant CSG"
                value={csg} onChange={e => setCsg(e.target.value)}
                style={{ width: '100%', padding: '16px 20px', borderRadius: 14, border: 'none', background: 'var(--color-bg)', outline: 'none', fontSize: 14, fontWeight: 600 }}
              />
            </div>

          </div>
        </section>

        {/* Résultat (Live Simulation) */}
        {parseFloat(revenuFiscal) > 0 && (
          <section className="animate-fade-up" style={{ marginTop: 8 }}>
            <div style={{ background: 'var(--color-primary)', borderRadius: 20, padding: 24, boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)', color: 'white', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 12, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', opacity: 0.9 }}>Impôt Estimé (2026)</h3>
              <p style={{ margin: '8px 0 0', fontSize: 36, fontWeight: 900 }}>{simulation.impotNet.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
              
              <div style={{ display: 'flex', gap: 24, marginTop: 20, paddingTop: 16, borderTop: '1px solid rgba(255,255,255,0.2)', width: '100%', justifyContent: 'center' }}>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Taux Moyen</p>
                  <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 800 }}>{simulation.tauxMoyen.toFixed(1).replace('.', ',')}%</p>
                </div>
                <div style={{ width: 1, background: 'rgba(255,255,255,0.2)' }}></div>
                <div>
                  <p style={{ margin: 0, fontSize: 10, fontWeight: 600, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Base Retenue</p>
                  <p style={{ margin: '4px 0 0', fontSize: 15, fontWeight: 800 }}>{simulation.rni.toLocaleString('fr-FR', { maximumFractionDigits: 0 })} €</p>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Footer actions */}
        <section style={{ marginTop: 16, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <button 
            onClick={handleSave}
            style={{ 
              width: '100%', padding: '18px', borderRadius: 18, background: 'var(--color-primary)', color: 'white',
              border: 'none', fontSize: 15, fontWeight: 900, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
              boxShadow: '0 8px 24px rgba(16, 185, 129, 0.3)', cursor: 'pointer'
            }}
          >
            <span className="material-icons-round" style={{ fontSize: 20 }}>save</span>
            Enregistrer les modifications
          </button>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--color-text-tertiary)', fontStyle: 'italic' }}>
            Dernière mise à jour : il y a 2 minutes
          </span>
        </section>

      </div>
    </div>
  );
};

export default Taxes;
