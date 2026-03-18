const newTx = { type: 'Virement', name: '', amount: '30', account: 'Compte Courant', toAccount: 'Revolut', date: '2026-03-17' };
const amountNum = parseFloat(newTx.amount.replace(',', '.'));
const isTransfer = newTx.type === 'Virement';
const isIncome = newTx.type === 'Revenus';
const finalAmount = isIncome ? Math.abs(amountNum) : -Math.abs(amountNum);

const txDate = new Date(newTx.date);
const today = new Date();
const yesterday = new Date();
yesterday.setDate(today.getDate() - 1);

let dateLabel = '';
if (txDate.toDateString() === today.toDateString()) dateLabel = 'Aujourd hui';
else if (txDate.toDateString() === yesterday.toDateString()) dateLabel = 'Hier';
else dateLabel = txDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });

const createTxItem = (name, amount, acc, icon, cat) => ({
  id: Math.random(),
  name: name,
  category: cat || newTx.category,
  categoryIcon: icon || 'category',
  amount: amount,
  account: acc,
  color: amount > 0 ? '#22c55e' : '#191C1F',
  domain: '',
  bg: amount > 0 ? 'rgba(34,197,94,0.10)' : 'rgba(25,28,31,0.05)'
});

const newItems = [];
if (isTransfer) {
  newItems.push(createTxItem(`Virement vers ${newTx.toAccount}`, -Math.abs(amountNum), newTx.account, 'swap_horiz', 'Transferts'));
  newItems.push(createTxItem(`Virement de ${newTx.account}`, Math.abs(amountNum), newTx.toAccount, 'swap_horiz', 'Transferts'));
} else {
  newItems.push(createTxItem(newTx.name, finalAmount, newTx.account));
}
console.log(JSON.stringify(newItems, null, 2));
