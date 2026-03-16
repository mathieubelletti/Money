// === DONNÉES MOCK - Dashboard Bancaire ===

export const user = {
  name: 'Marc',
  avatar: 'M',
  totalBalance: 12450.20,
  monthChange: +342.50,
};

export const accounts = [
  {
    id: 1,
    name: 'BNP Paribas',
    short: 'BNP',
    type: 'Compte courant',
    balance: 3240.50,
    color: '#00B050',
    time: 'Il y a 2h',
    domain: 'bnpparibas.fr',
    accountNumber: 'FR76 3000 4028 1234 5678 9012 345',
    initialBalance: 3000.00,
  },
  {
    id: 2,
    name: 'Société Générale',
    short: 'SG',
    type: 'Compte courant',
    balance: 1820.70,
    color: '#E2001A',
    time: 'Il y a 1h',
    domain: 'societegenerale.fr',
    accountNumber: 'FR76 3000 3000 9876 5432 1098 765',
    initialBalance: 1500.00,
  },
  {
    id: 3,
    name: 'Revolut',
    short: 'R',
    type: 'Compte pro',
    balance: 589.00,
    color: '#191C1F',
    time: 'À l\'instant',
    domain: 'revolut.com',
    accountNumber: 'GB29 REVO 1234 5678 9012 34',
    initialBalance: 100.00,
  },
  {
    id: 4,
    name: 'Boursorama',
    short: 'B',
    type: 'Compte courant',
    balance: 6800.00,
    color: '#0066CC',
    time: 'Il y a 4h',
    domain: 'boursorama.com',
    accountNumber: 'FR76 4061 5280 1122 3344 5566 778',
    initialBalance: 5000.00,
  },
];

export const savings = [
  { id: 1, name: 'Livret A', bank: 'Société Générale', domain: 'societegenerale.fr', balance: 15400.00, rate: 3.0, color: '#E2001A' },
  { id: 2, name: 'LDDS', bank: 'BNP Paribas', domain: 'bnpparibas.fr', balance: 5200.00, rate: 3.0, color: '#00B050' },
  { id: 3, name: 'Assurance Vie', bank: 'Boursorama', domain: 'boursorama.com', balance: 22150.00, rate: 2.8, color: '#0066CC' },
];

export const patrimonyChart = [
  { month: 'JAN', value: 38200 },
  { month: 'FÉV', value: 39100 },
  { month: 'MAR', value: 40500 },
  { month: 'AVR', value: 41200 },
  { month: 'MAI', value: 42800 },
  { month: 'JUIN', value: 43450 },
];

export const insights = [
  {
    id: 1,
    type: 'success',
    icon: 'savings',
    title: 'Conseil Épargne',
    text: 'Vous avez dépensé 15% de moins en loisirs ce mois-ci. Placez ce surplus sur votre Livret A.',
    color: '#22c55e',
    bg: 'rgba(34,197,94,0.10)',
  },
  {
    id: 2,
    type: 'warning',
    icon: 'warning_amber',
    title: 'Alerte Frais',
    text: 'Vos abonnements ont augmenté de 12€. Vérifiez vos services inactifs.',
    color: '#f59e0b',
    bg: 'rgba(245,158,11,0.10)',
  },
];

export const quickActions = [
  { id: 1, label: 'Virement', icon: 'swap_horiz', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)' },
  { id: 2, label: 'Recharge', icon: 'phone_iphone', color: '#a855f7', bg: 'rgba(168,85,247,0.10)' },
  { id: 3, label: 'Paiement', icon: 'contactless', color: '#22c55e', bg: 'rgba(34,197,94,0.10)' },
  { id: 4, label: 'Épargne', icon: 'account_balance', color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
];

export const transactions = [
  {
    id: 1,
    date: "Aujourd'hui",
    dateOrder: 0,
    items: [
      { id: 11, name: 'Monoprix City', domain: 'monoprix.fr', category: 'Alimentation', categoryIcon: 'shopping_basket', amount: -42.50, account: 'Compte Courant', color: '#22c55e', bg: 'rgba(34,197,94,0.10)' },
      { id: 12, name: 'UGC Ciné Cité', domain: 'ugc.fr', category: 'Loisirs', categoryIcon: 'movie', amount: -15.00, account: 'Carte Débit', color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)' },
    ],
  },
  {
    id: 2,
    date: 'Hier',
    dateOrder: 1,
    items: [
      { id: 21, name: 'Virement Salaire', domain: 'apple.com', category: 'Revenus', categoryIcon: 'attach_money', amount: +2450.00, account: 'Compte Courant', color: '#22c55e', bg: 'rgba(34,197,94,0.10)' },
      { id: 22, name: 'Prélèvement Loyer', category: 'Logement', categoryIcon: 'home', amount: -850.00, account: 'Compte Courant', color: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
      { id: 23, name: 'RATP Navigo', domain: 'ratp.fr', category: 'Transport', categoryIcon: 'directions_transit', amount: -84.10, account: 'Carte Débit', color: '#3b82f6', bg: 'rgba(59,130,246,0.10)' },
    ],
  },
  {
    id: 3,
    date: '14 mars',
    dateOrder: 2,
    items: [
      { id: 31, name: 'Netflix', domain: 'netflix.com', category: 'Abonnements', categoryIcon: 'live_tv', amount: -17.99, account: 'Carte Débit', color: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
      { id: 32, name: 'Carrefour Market', domain: 'carrefour.fr', category: 'Alimentation', categoryIcon: 'shopping_basket', amount: -63.40, account: 'Compte Courant', color: '#22c55e', bg: 'rgba(34,197,94,0.10)' },
      { id: 33, name: 'Remboursement Marie', domain: 'revolut.com', category: 'Transferts', categoryIcon: 'person', amount: +50.00, account: 'Revolut', color: '#22c55e', bg: 'rgba(34,197,94,0.10)' },
    ],
  },
  {
    id: 4,
    date: '13 mars',
    dateOrder: 3,
    items: [
      { id: 41, name: 'Free Mobile', domain: 'free.fr', category: 'Abonnements', categoryIcon: 'smartphone', amount: -9.99, account: 'Compte Courant', color: '#6366f1', bg: 'rgba(99,102,241,0.10)' },
      { id: 42, name: 'Decathlon', domain: 'decathlon.fr', category: 'Sport', categoryIcon: 'sports_soccer', amount: -45.00, account: 'Carte Débit', color: '#0ea5e9', bg: 'rgba(14,165,233,0.10)' },
    ],
  },
];

export const budgetCategories = [
  { id: 1, name: 'Logement', icon: 'home', spent: 850, limit: 900, color: '#ef4444', bg: 'rgba(239,68,68,0.10)' },
  { id: 2, name: 'Alimentation', icon: 'shopping_basket', spent: 280, limit: 400, color: '#22c55e', bg: 'rgba(34,197,94,0.10)' },
  { id: 3, name: 'Transport', icon: 'directions_transit', spent: 84, limit: 150, color: '#3b82f6', bg: 'rgba(59,130,246,0.10)' },
  { id: 4, name: 'Loisirs', icon: 'movie', spent: 45, limit: 200, color: '#8b5cf6', bg: 'rgba(139,92,246,0.10)' },
  { id: 5, name: 'Abonnements', icon: 'subscriptions', spent: 62, limit: 80, color: '#f59e0b', bg: 'rgba(245,158,11,0.10)' },
  { id: 6, name: 'Sport', icon: 'sports_soccer', spent: 45, limit: 60, color: '#0ea5e9', bg: 'rgba(14,165,233,0.10)' },
];

export const forecasts = [
  {
    id: 1,
    month: 'Mai 2024',
    shortMonth: 'MAI',
    ops: 3,
    amount: +2450,
    type: 'excedent',
    color: '#22c55e',
  },
  {
    id: 2,
    month: 'Juin 2024',
    shortMonth: 'JUI',
    ops: 5,
    amount: -120,
    type: 'deficit',
    color: '#ef4444',
  },
  {
    id: 3,
    month: 'Juillet 2024',
    shortMonth: 'JUL',
    ops: 2,
    amount: +3100,
    type: 'excedent',
    color: '#22c55e',
  },
  {
    id: 4,
    month: 'Août 2024',
    shortMonth: 'AOU',
    ops: 4,
    amount: +1800,
    type: 'excedent',
    color: '#22c55e',
  },
  {
    id: 5,
    month: 'Septembre 2024',
    shortMonth: 'SEP',
    ops: 6,
    amount: -250,
    type: 'deficit',
    color: '#ef4444',
  },
  {
    id: 6,
    month: 'Octobre 2024',
    shortMonth: 'OCT',
    ops: 3,
    amount: +2200,
    type: 'excedent',
    color: '#22c55e',
  },
];

export const txFilters = ['Tous', 'Alimentation', 'Loyer', 'Loisirs', 'Transport', 'Revenus'];
export const previsionsTabs = ['Mois', 'Trimestre', 'Année'];
