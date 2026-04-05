import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Transaction } from '../types';

interface FinanceContextType {
  transactions: Transaction[];
  loading: boolean;
  role: 'viewer' | 'admin';
  setRole: (role: 'viewer' | 'admin') => void;
  fetchTransactions: () => Promise<void>;
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: number) => Promise<void>;
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  filterType: 'all' | 'income' | 'expense';
  setFilterType: (type: 'all' | 'income' | 'expense') => void;
  filterCategory: string;
  setFilterCategory: (cat: string) => void;
  sortBy: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc';
  setSortBy: (sort: 'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc') => void;
  dateFrom: string;
  setDateFrom: (date: string) => void;
  dateTo: string;
  setDateTo: (date: string) => void;
  amountMin: string;
  setAmountMin: (amount: string) => void;
  amountMax: string;
  setAmountMax: (amount: string) => void;
}

// ── Rich mock data used when API is unavailable ──────────────────────────────
function makeMock(): Transaction[] {
  const now = new Date();
  const entries: Array<Omit<Transaction, 'id'>> = [];
  const cats: Array<{ cat: string; type: 'expense' | 'income'; desc: string; lo: number; hi: number }> = [
    { cat: 'Food', type: 'expense', desc: 'Groceries & Dining', lo: 300, hi: 2200 },
    { cat: 'Transport', type: 'expense', desc: 'Cab / Metro', lo: 150, hi: 800 },
    { cat: 'Entertainment', type: 'expense', desc: 'Movies / OTT', lo: 200, hi: 1500 },
    { cat: 'Utilities', type: 'expense', desc: 'Electricity / Internet', lo: 500, hi: 3000 },
    { cat: 'Shopping', type: 'expense', desc: 'Clothes / Electronics', lo: 800, hi: 6000 },
    { cat: 'Healthcare', type: 'expense', desc: 'Doctor / Pharmacy', lo: 400, hi: 3500 },
    { cat: 'Rent', type: 'expense', desc: 'Monthly Rent', lo: 12000, hi: 18000 },
    { cat: 'Travel', type: 'expense', desc: 'Trip / Hotel', lo: 3000, hi: 12000 },
    { cat: 'Others', type: 'expense', desc: 'Miscellaneous', lo: 100, hi: 1000 },
    { cat: 'Salary', type: 'income', desc: 'Monthly Salary', lo: 55000, hi: 75000 },
    { cat: 'Freelance', type: 'income', desc: 'Freelance Project', lo: 8000, hi: 25000 },
  ];
  let id = 1;
  for (let m = 5; m >= 0; m--) {
    const base = new Date(now.getFullYear(), now.getMonth() - m, 1);
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() - m + 1, 0).getDate();
    [cats[9], cats[10]].forEach(c => {
      const day = Math.floor(Math.random() * 5) + 1;
      entries.push({ date: new Date(base.getFullYear(), base.getMonth(), day).toISOString(), amount: Math.round(c.lo + Math.random() * (c.hi - c.lo)), category: c.cat, type: c.type, description: c.desc });
    });
    for (let i = 0; i < 10; i++) {
      const c = cats[Math.floor(Math.random() * 9)];
      const day = Math.floor(Math.random() * daysInMonth) + 1;
      const d = new Date(base.getFullYear(), base.getMonth(), day);
      if (d > now) continue;
      entries.push({ date: d.toISOString(), amount: Math.round(c.lo + Math.random() * (c.hi - c.lo)), category: c.cat, type: c.type, description: c.desc });
    }
  }
  return entries.map(e => ({ ...e, id: id++ }));
}

const MOCK_TRANSACTIONS: Transaction[] = makeMock();

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export function FinanceProvider({ children }: { children: ReactNode }) {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [role, setRoleState] = useState<'viewer' | 'admin'>(() => {
    const saved = localStorage.getItem('fintrack-role');
    return (saved as 'viewer' | 'admin') || 'admin';
  });

  const setRole = (newRole: 'viewer' | 'admin') => {
    setRoleState(newRole);
    localStorage.setItem('fintrack-role', newRole);
  };
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'income' | 'expense'>('all');
  const [filterCategory, setFilterCategory] = useState('');
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [amountMin, setAmountMin] = useState('');
  const [amountMax, setAmountMax] = useState('');

  const saveTransactionsToStorage = (txs: Transaction[]) => {
    localStorage.setItem('fintrack-transactions', JSON.stringify(txs));
  };

  const loadTransactionsFromStorage = (): Transaction[] | null => {
    const stored = localStorage.getItem('fintrack-transactions');
    return stored ? JSON.parse(stored) : null;
  };

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/transactions');
      if (!res.ok) throw new Error('API unavailable');
      const data = await res.json();
      const txs = Array.isArray(data) && data.length > 0 ? data : MOCK_TRANSACTIONS;
      setTransactions(txs);
      saveTransactionsToStorage(txs);
    } catch (err) {
      console.warn('Using stored or mock data:', err);
      const stored = loadTransactionsFromStorage();
      setTransactions(stored || MOCK_TRANSACTIONS);
    } finally {
      setLoading(false);
    }
  };

  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx),
      });
      if (res.ok) {
        await fetchTransactions();
        return;
      }
    } catch (err) {
      console.error('Add error:', err);
    }
    // Fallback: add locally
    const newTx = { ...tx, id: Date.now() };
    setTransactions(prev => {
      const updated = [...prev, newTx];
      saveTransactionsToStorage(updated);
      return updated;
    });
  };

  const updateTransaction = async (tx: Transaction) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(tx),
      });
      if (res.ok) {
        await fetchTransactions();
        return;
      }
    } catch (err) {
      console.error('Update error:', err);
    }
    // Fallback: update locally
    setTransactions(prev => {
      const updated = prev.map(t => t.id === tx.id ? tx : t);
      saveTransactionsToStorage(updated);
      return updated;
    });
  };

  const deleteTransaction = async (id: number) => {
    try {
      const res = await fetch('/api/transactions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        await fetchTransactions();
        return;
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
    // Fallback: delete locally
    setTransactions(prev => {
      const updated = prev.filter(t => t.id !== id);
      saveTransactionsToStorage(updated);
      return updated;
    });
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  return (
    <FinanceContext.Provider
      value={{
        transactions,
        loading,
        role,
        setRole,
        fetchTransactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        searchTerm,
        setSearchTerm,
        filterType,
        setFilterType,
        filterCategory,
        setFilterCategory,
        sortBy,
        setSortBy,
        dateFrom,
        setDateFrom,
        dateTo,
        setDateTo,
        amountMin,
        setAmountMin,
        amountMax,
        setAmountMax,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
}

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) throw new Error('useFinance must be used within FinanceProvider');
  return context;
};
