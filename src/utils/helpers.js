import { useState, useEffect } from 'react';

export function useAnimateIn(delay = 0) {
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(t);
  }, [delay]);
  return visible;
}

export function formatAmount(amount) {
  const abs = Math.abs(amount);
  const formatted = abs.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
  return `${amount < 0 ? '- ' : '+ '}${formatted} €`;
}

export function formatBalance(amount) {
  return amount.toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }) + ' €';
}
