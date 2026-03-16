import React, { useState } from 'react';

const BankLogo = ({ domain, name, size = 40, bg, icon, color }) => {
  const [error, setError] = useState(false);

  // Replace with your actual Logo.dev token
  const token = 'pk_GEGUfLZ8RieM9553Wee70A';

  const logoUrl = domain && !error
    ? `https://img.logo.dev/${domain}?token=${token}`
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
        borderRadius: 12, // Increased for a more premium look
        background: backgroundStyle,
        overflow: 'hidden',
        border: borderStyle,
        position: 'relative'
      }}
    >
      {logoUrl ? (
        <img
          src={logoUrl}
          alt={name}
          loading="lazy"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            padding: '4px'
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
                bottom: 2,
                right: 2
              }}>account_balance</span>
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default BankLogo;
