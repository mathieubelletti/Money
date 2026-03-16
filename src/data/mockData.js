// === DONNÉES MOCK - Dashboard Bancaire (CLEAN START) ===

export const user = {
  name: 'Marc',
  avatar: 'M',
  totalBalance: 0,
  monthChange: 0,
};

// Start with empty lists for real user entry
export const accounts = [];
export const savings = [];
export const transactions = [];

// Empty chart state
export const patrimonyChart = [
  { month: 'JAN', value: 0 },
  { month: 'FÉV', value: 0 },
  { month: 'MAR', value: 0 },
  { month: 'AVR', value: 0 },
  { month: 'MAI', value: 0 },
  { month: 'JUIN', value: 0 },
];

export const insights = [];

export const quickActions = [
  { id: 1, label: 'Virement', icon: 'swap_horiz', color: 'var(--color-primary)', bg: 'var(--color-primary-bg)' },
  { id: 2, label: 'Recharge', icon: 'phone_iphone', color: 'var(--color-primary)', bg: 'var(--color-primary-bg)' },
  { id: 3, label: 'Paiement', icon: 'contactless', color: 'var(--color-primary)', bg: 'var(--color-primary-bg)' },
  { id: 4, label: 'Épargne', icon: 'account_balance', color: 'var(--color-primary)', bg: 'var(--color-primary-bg)' },
];

export const budgetCategories = [
  { id: 1, name: 'Logement', icon: 'home', spent: 0, limit: 0, color: 'var(--color-primary)', bg: 'var(--color-primary-bg)', type: 'fixe' },
  { id: 2, name: 'Alimentation', icon: 'shopping_basket', spent: 0, limit: 0, color: 'var(--color-primary)', bg: 'var(--color-primary-bg)', type: 'variable' },
  { id: 3, name: 'Transport', icon: 'directions_transit', spent: 0, limit: 0, color: 'var(--color-primary)', bg: 'var(--color-primary-bg)', type: 'fixe' },
  { id: 4, name: 'Loisirs', icon: 'movie', spent: 0, limit: 0, color: 'var(--color-primary)', bg: 'var(--color-primary-bg)', type: 'variable' },
  { id: 5, name: 'Abonnements', icon: 'subscriptions', spent: 0, limit: 0, color: 'var(--color-primary)', bg: 'var(--color-primary-bg)', type: 'fixe' },
  { id: 6, name: 'Sport', icon: 'sports_soccer', spent: 0, limit: 0, color: 'var(--color-primary)', bg: 'var(--color-primary-bg)', type: 'variable' },
];

// Reference months structure
export const forecasts = [
  { id: 1, month: 'Janvier 2024', shortMonth: 'JAN', ops: 0, amount: 0, type: 'excedent', color: 'var(--color-primary)' },
  { id: 2, month: 'Février 2024', shortMonth: 'FÉV', ops: 0, amount: 0, type: 'excedent', color: 'var(--color-primary)' },
  { id: 3, month: 'Mars 2024', shortMonth: 'MAR', ops: 0, amount: 0, type: 'excedent', color: 'var(--color-primary)' },
  { id: 4, month: 'Avril 2024', shortMonth: 'AVR', ops: 0, amount: 0, type: 'excedent', color: 'var(--color-primary)' },
  { id: 5, month: 'Mai 2024', shortMonth: 'MAI', ops: 0, amount: 0, type: 'excedent', color: 'var(--color-primary)' },
  { id: 6, month: 'Juin 2024', shortMonth: 'JUI', ops: 0, amount: 0, type: 'excedent', color: 'var(--color-primary)' },
  { id: 7, month: 'Juillet 2024', shortMonth: 'JUL', ops: 0, amount: 0, type: 'excedent', color: 'var(--color-primary)' },
  { id: 8, month: 'Août 2024', shortMonth: 'AOU', ops: 0, amount: 0, type: 'excedent', color: 'var(--color-primary)' },
  { id: 9, month: 'Septembre 2024', shortMonth: 'SEP', ops: 0, amount: 0, type: 'excedent', color: 'var(--color-primary)' },
  { id: 10, month: 'Octobre 2024', shortMonth: 'OCT', ops: 0, amount: 0, type: 'excedent', color: 'var(--color-primary)' },
  { id: 11, month: 'Novembre 2024', shortMonth: 'NOV', ops: 0, amount: 0, type: 'excedent', color: 'var(--color-primary)' },
  { id: 12, month: 'Décembre 2024', shortMonth: 'DÉC', ops: 0, amount: 0, type: 'excedent', color: 'var(--color-primary)' },
];

export const txFilters = ['Tous', 'Alimentation', 'Loyer', 'Loisirs', 'Transport', 'Revenus'];
export const previsionsTabs = ['Mois', 'Trimestre', 'Année'];
