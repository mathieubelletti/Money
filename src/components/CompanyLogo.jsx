import React, { useState } from 'react';

const LOGO_DEV_PUBLIC_KEY = 'pk_GEGUfLZ8RieM9553Wee70A';

const CompanyLogo = ({ domain, name, size = 40, bg, icon, color, style }) => {
  const [error, setError] = useState(false);

  // Guess domain from name for common French banks if domain is missing
  const guessDomainFromName = (n) => {
    if (!n) return null;
    const lower = n.toLowerCase();
    if (lower.includes('agricole')) return 'credit-agricole.fr';
    if (lower.includes('postale') || lower.includes('postal')) return 'labanquepostale.fr';
    if (lower.includes('bnp')) return 'mabanque.bnpparibas';
    if (lower.includes('societe generale')) return 'societegenerale.fr';
    if (lower.includes('mutuel')) return 'creditmutuel.fr';
    if (lower.includes('caisse d\'epargne')) return 'caisse-epargne.fr';
    if (lower.includes('bourso')) return 'boursorama.com';
    if (lower.includes('revolut')) return 'revolut.com';
    if (lower.includes('n26')) return 'n26.com';
    if (lower.includes('fortuneo')) return 'fortuneo.fr';
    if (lower.includes('hello bank')) return 'hellobank.fr';
    return null;
  };

  const finalDomain = domain || guessDomainFromName(name);

  const logoUrl = finalDomain && !error
    ? `https://img.logo.dev/${finalDomain}?token=${LOGO_DEV_PUBLIC_KEY}`
    : null;

  const fallbackInitial = name ? name.charAt(0).toUpperCase() : '?';

  // Compute uniform styling based on color if provided
  const backgroundStyle = bg || (color ? `${color}15` : '#f1f5f9');
  const borderStyle = color ? `1px solid ${color}40` : '1px solid var(--color-border-light)';

  return (
    <div
      className="flex items-center justify-center shrink-0"
      style={{
        width: size,
        height: size,
        borderRadius: size > 32 ? 14 : 10,
        background: backgroundStyle,
        overflow: 'hidden',
        border: borderStyle,
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style
      }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={name || "Company Logo"}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: size > 32 ? '6px' : '4px'
          }}
          onError={() => setError(true)}
        />
      ) : (
        <div style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: '100%',
          height: '100%'
        }}>
          {icon ? (
            <span className="material-icons-round" style={{
              fontSize: size * 0.5,
              color: 'var(--color-text-secondary)'
            }}>{icon}</span>
          ) : (
            <>
              <span style={{
                fontSize: size * 0.45,
                fontWeight: 800,
                color: 'var(--color-text-secondary)',
                lineHeight: 1
              }}>
                {fallbackInitial}
              </span>
              <span className="material-icons-round" style={{
                fontSize: size * 0.25,
                color: 'var(--color-text-tertiary)',
                position: 'absolute',
                bottom: size > 32 ? 4 : 2,
                right: size > 32 ? 4 : 2
              }}>account_balance</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default CompanyLogo;
