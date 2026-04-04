import { format, parseISO } from 'date-fns';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  return format(parseISO(dateStr), 'MMM dd, yyyy');
}

export function getMonthName(dateStr: string): string {
  return format(parseISO(dateStr), 'MMMM yyyy');
}

export const categories = [
  'Food',
  'Transport',
  'Entertainment',
  'Utilities',
  'Salary',
  'Freelance',
  'Shopping',
  'Healthcare',
  'Travel',
  'Rent',
  'Others',
];

export const typeColors = {
  income: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/50',
  expense: 'bg-rose-500/20 text-rose-400 border-rose-500/50',
};

export function exportToCSV(transactions: any[]) {
  const headers = ['ID', 'Date', 'Amount', 'Category', 'Type', 'Description'];
  const rows = transactions.map(tx => [
    tx.id,
    tx.date,
    tx.amount,
    tx.category,
    tx.type,
    tx.description
  ]);
  const csvContent = [headers, ...rows].map(row => row.map(field => `"${field}"`).join(',')).join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transactions.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToJSON(transactions: any[]) {
  const jsonContent = JSON.stringify(transactions, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'transactions.json';
  a.click();
  URL.revokeObjectURL(url);
}
