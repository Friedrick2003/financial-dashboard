import { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { formatCurrency, formatDate, categories, exportToCSV, exportToJSON } from './lib/utils';
import { useSpotlight } from './lib/spotlight';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, TrendUp, ArrowUp, ArrowDown, Plus, PencilSimple, Trash, X, ChartBar, Target, List
} from '@phosphor-icons/react';
import CircularProgressRing from './components/CircularProgressRing';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { parseISO, format, addMonths } from 'date-fns';
import SpendingHeatmap from './components/SpendingHeatmap';
import AnalyticsPanel from './components/AnalyticsPanel';
import type { Transaction } from './types';

function RoleSwitcher() {
  const { role, setRole } = useFinance();
  return (
    <div className="flex items-center gap-3 bg-forest-900 rounded-2xl px-4 py-1.5 border border-forest-700">
      <User size={18} className="text-sand-400" />
      <select
        value={role}
        onChange={(e) => setRole(e.target.value as 'viewer' | 'admin')}
        className="bg-transparent text-sand-200 text-sm font-medium outline-none cursor-pointer"
      >
        <option value="admin">Admin</option>
        <option value="viewer">Viewer</option>
      </select>
    </div>
  );
}

function BalanceCard() {
  const { transactions } = useFinance();
  const { style, handleMouseMove, handleMouseLeave } = useSpotlight();

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const balance = income - expenses;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bento-card rounded-3xl p-6 lg:p-8 relative overflow-hidden col-span-2 lg:col-span-1 row-span-1 spotlight-card"
      style={{ minHeight: '240px', ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Topographical Background */}
      <div className="absolute inset-0 opacity-30">
        <img 
          src="/images/topo-texture.jpg" 
          alt="topography" 
          className="object-cover w-full h-full grayscale-[0.3] mix-blend-luminosity" 
        />
      </div>
      <div className="absolute inset-0 bg-gradient-to-br from-forest-900/90 via-forest-950/95 to-forest-900/90" />

      <div className="relative z-10 flex flex-col h-full">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="text-sand-400 text-xs lg:text-sm font-medium tracking-widest">TOTAL BALANCE</div>
            <div className="text-3xl lg:text-[42px] leading-none font-semibold text-sand-100 font-mono mt-2">
              {formatCurrency(Math.abs(balance))}
            </div>
          </div>
          <div className={`px-4 py-1.5 rounded-full text-xs font-medium flex items-center gap-1.5 ${balance >= 0 ? 'bg-moss/20 text-moss' : 'bg-terra/20 text-terra'}`}>
            {balance >= 0 ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
            {balance >= 0 ? 'SURPLUS' : 'DEFICIT'}
          </div>
        </div>

        <div className="mt-auto grid grid-cols-2 gap-4">
          <div>
            <div className="text-sand-500 text-xs">INCOME</div>
            <div className="text-xl font-semibold text-moss font-mono">+{formatCurrency(income)}</div>
          </div>
          <div>
            <div className="text-sand-500 text-xs">EXPENSES</div>
            <div className="text-xl font-semibold text-terra font-mono">-{formatCurrency(expenses)}</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function IncomeCard() {
  const { transactions } = useFinance();
  const { style, handleMouseMove, handleMouseLeave } = useSpotlight();

  const income = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="bento-card rounded-3xl p-5 lg:p-6 flex flex-col spotlight-card"
      style={{ minHeight: '220px', ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 lg:p-3 rounded-2xl bg-moss/10">
          <ArrowUp size={20} className="text-moss" />
        </div>
        <div className="text-sand-400 text-xs lg:text-sm">TOTAL INCOME</div>
      </div>
      <div className="text-3xl lg:text-4xl font-semibold text-sand-100 font-mono mt-auto">
        {formatCurrency(income)}
      </div>
      <div className="text-xs text-sand-500 mt-1">This period</div>
    </motion.div>
  );
}

function ExpensesCard() {
  const { transactions } = useFinance();
  const { style, handleMouseMove, handleMouseLeave } = useSpotlight();

  const expenses = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="bento-card rounded-3xl p-5 lg:p-6 flex flex-col spotlight-card"
      style={{ minHeight: '220px', ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 lg:p-3 rounded-2xl bg-terra/10">
          <ArrowDown size={20} className="text-terra" />
        </div>
        <div className="text-sand-400 text-xs lg:text-sm">TOTAL EXPENSES</div>
      </div>
      <div className="text-3xl lg:text-4xl font-semibold text-sand-100 font-mono mt-auto">
        {formatCurrency(expenses)}
      </div>
      <div className="text-xs text-sand-500 mt-1">This period</div>
    </motion.div>
  );
}

function BalanceTrendChart() {
  const { transactions } = useFinance();
  const { style, handleMouseMove, handleMouseLeave } = useSpotlight();

  if (transactions.length === 0) {
    return <div className="bento-card rounded-3xl p-8 text-center text-sand-500">No trend data</div>;
  }

  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const data = sorted.reduce((acc, tx, index) => {
    const prevBalance = index > 0 ? acc[index - 1].balance : 0;
    const newBalance = prevBalance + (tx.type === 'income' ? tx.amount : -tx.amount);
    acc.push({
      date: format(parseISO(tx.date), 'MMM dd'),
      balance: Math.round(newBalance),
    });
    return acc;
  }, [] as Array<{ date: string; balance: number }>).slice(-20);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="bento-card rounded-3xl p-6 lg:p-8 col-span-1 lg:col-span-2 spotlight-card"
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4">
        <div>
          <div className="text-lg lg:text-xl font-semibold text-sand-100">Balance Trend</div>
          <div className="text-sm text-sand-500">Cumulative net over time</div>
        </div>
        <div className="text-xs px-3 py-1 bg-forest-800 rounded-full text-sand-400 w-fit">LAST 20 TRANSACTIONS</div>
      </div>
      <div className="h-60 lg:h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="balanceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#6b8f7a" stopOpacity={0.4} />
                <stop offset="100%" stopColor="#6b8f7a" stopOpacity={0.05} />
              </linearGradient>
            </defs>
            <XAxis dataKey="date" stroke="#3a5c4f" tick={{ fill: '#a68d6c', fontSize: 11 }} />
            <YAxis stroke="#3a5c4f" tick={{ fill: '#a68d6c', fontSize: 11 }} tickFormatter={v => formatCurrency(Number(v))} />
            <Tooltip 
              contentStyle={{ background: '#132f26', border: '1px solid #3a5c4f', borderRadius: 8, color: '#e8d9b8' }}
              formatter={(v) => [formatCurrency(Number(v || 0)), 'Balance']}
            />
            <Area type="monotone" dataKey="balance" stroke="#6b8f7a" strokeWidth={3} fill="url(#balanceGrad)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

function SpendingBreakdownChart() {
  const { transactions } = useFinance();
  const { style, handleMouseMove, handleMouseLeave } = useSpotlight();

  const expenses = transactions.filter(t => t.type === 'expense');
  if (expenses.length === 0) {
    return <div className="bento-card rounded-3xl p-8 text-center text-sand-500">No spending data</div>;
  }

  const catSums = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const data = Object.entries(catSums)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 6);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="bento-card rounded-3xl p-8 spotlight-card"
      style={{ minHeight: '430px', ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xl font-semibold text-sand-100">Spending Breakdown</div>
          <div className="text-sm text-sand-500">By category (top 6)</div>
        </div>
      </div>
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <XAxis type="category" dataKey="name" stroke="#3a5c4f" tick={{ fill: '#a68d6c', fontSize: 12 }} angle={-45} textAnchor="end" height={60} />
            <YAxis type="number" stroke="#3a5c4f" tick={{ fill: '#a68d6c', fontSize: 11 }} tickFormatter={v => formatCurrency(Number(v))} />
            <Tooltip 
              contentStyle={{ background: '#132f26', border: '1px solid #3a5c4f', borderRadius: 8, color: '#e8d9b8' }}
              formatter={(v) => [formatCurrency(Number(v || 0)), 'Spent']}
            />
            <Bar dataKey="value" fill="#c29a64" radius={[6, 6, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  );
}

function SpendingSummaryCard() {
  const { transactions } = useFinance();
  const { style, handleMouseMove, handleMouseLeave } = useSpotlight();

  const expenses = transactions.filter(t => t.type === 'expense');
  const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);

  const catSums = expenses.reduce((acc, t) => {
    acc[t.category] = (acc[t.category] || 0) + t.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategories = ['Rent', 'Travel', 'Shopping', 'Healthcare', 'Utilities', 'Food'];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.3 }}
      className="bento-card rounded-3xl p-8 spotlight-card"
      style={{ minHeight: '430px', ...style }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="text-xl font-semibold text-sand-100">Spending Summary</div>
          <div className="text-sm text-sand-500">Category insights</div>
        </div>
      </div>
      <div className="text-4xl font-semibold text-sand-100 font-mono mb-6">
        {formatCurrency(totalExpenses)}
      </div>
      <div className="space-y-3">
        {topCategories.map(cat => {
          const amount = catSums[cat] || 0;
          const percentage = totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0;
          return (
            <div key={cat} className="flex items-center justify-between">
              <div className="flex items-center gap-3 flex-1">
                <span className="text-sand-400 text-sm w-20">{cat}</span>
                <div className="flex-1 bg-forest-800 rounded-full h-2">
                  <div className="bg-sand-400 h-2 rounded-full" style={{ width: `${percentage}%` }}></div>
                </div>
              </div>
              <span className="text-sand-100 text-sm font-mono ml-3">{percentage.toFixed(1)}%</span>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}





// Removed SpendingTrendCard function
function AddEditModal({ open, onClose, transaction }: { open: boolean; onClose: () => void; transaction?: Transaction }) {
  const { addTransaction, updateTransaction } = useFinance();
  const [form, setForm] = useState({
    date: transaction?.date ? transaction.date.split('T')[0] : new Date().toISOString().split('T')[0],
    amount: transaction?.amount?.toString() || '',
    category: transaction?.category || 'Food',
    type: transaction?.type || 'expense',
    description: transaction?.description || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;
    const payload = {
      date: new Date(form.date).toISOString(),
      amount: parseFloat(form.amount),
      category: form.category,
      type: form.type as 'income' | 'expense',
      description: form.description,
    };
    if (transaction) {
      await updateTransaction({ ...payload, id: transaction.id });
    } else {
      await addTransaction(payload);
    }
    onClose();
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-forest-900 border border-forest-700 rounded-3xl w-full max-w-md overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-forest-700">
            <h3 className="text-xl font-semibold text-sand-100">{transaction ? 'Edit Transaction' : 'New Transaction'}</h3>
            <button onClick={onClose}><X size={20} /></button>
          </div>
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs text-sand-400 mb-1.5">DESCRIPTION</label>
              <input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} className="w-full bg-forest-950 border border-forest-700 rounded-2xl px-4 py-3 text-sand-200" required />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-sand-400 mb-1.5">AMOUNT</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-sand-500">$</span>
                  <input type="number" step="0.01" value={form.amount} onChange={e => setForm({ ...form, amount: e.target.value })} className="w-full bg-forest-950 border border-forest-700 rounded-2xl pl-8 py-3 text-sand-200" required />
                </div>
              </div>
              <div>
                <label className="block text-xs text-sand-400 mb-1.5">DATE</label>
                <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full bg-forest-950 border border-forest-700 rounded-2xl px-4 py-3 text-sand-200" required />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-sand-400 mb-1.5">TYPE</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setForm({ ...form, type: 'expense' })} className={`flex-1 py-2.5 rounded-2xl text-sm ${form.type === 'expense' ? 'bg-terra text-white' : 'bg-forest-950 border border-forest-700 text-sand-400'}`}>Expense</button>
                  <button type="button" onClick={() => setForm({ ...form, type: 'income' })} className={`flex-1 py-2.5 rounded-2xl text-sm ${form.type === 'income' ? 'bg-moss text-white' : 'bg-forest-950 border border-forest-700 text-sand-400'}`}>Income</button>
                </div>
              </div>
              <div>
                <label className="block text-xs text-sand-400 mb-1.5">CATEGORY</label>
                <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full bg-forest-950 border border-forest-700 rounded-2xl px-4 py-3 text-sand-200">
                  {categories.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <button type="button" onClick={onClose} className="flex-1 py-3 border border-forest-700 rounded-2xl text-sand-200">Cancel</button>
              <button type="submit" className="flex-1 py-3 bg-terra hover:bg-terra-dark rounded-2xl text-white font-medium">{transaction ? 'Update' : 'Add Transaction'}</button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

function TransactionsTable() {
  const { transactions, role, deleteTransaction, searchTerm, setSearchTerm, filterType, setFilterType, filterCategory, setFilterCategory, sortBy, setSortBy } = useFinance();
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);

  let filtered = transactions.filter(tx => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesCat = !filterCategory || tx.category === filterCategory;
    return matchesSearch && matchesType && matchesCat;
  });

  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    return a.amount - b.amount;
  });

  const handleDelete = (id: number) => {
    if (confirm('Delete transaction?')) deleteTransaction(id);
  };

  const openAdd = () => { setEditing(null); setModalOpen(true); };
  const openEdit = (tx: any) => { setEditing(tx); setModalOpen(true); };

  return (
    <div className="bento-card rounded-3xl overflow-hidden">
      <div className="p-6 border-b border-forest-700 flex flex-col md:flex-row gap-4">
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-forest-950 border border-forest-700 rounded-2xl px-4 py-3 pl-11 text-sand-200 placeholder:text-sand-500 focus:border-sand-400 outline-none"
          />
          <svg className="w-4 h-4 absolute left-4 top-4 text-sand-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value as any)} className="bg-forest-950 border border-forest-700 rounded-2xl px-4 py-3 text-sand-200">
          <option value="all">All Types</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
        <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className="bg-forest-950 border border-forest-700 rounded-2xl px-4 py-3 text-sand-200">
          <option value="">All Categories</option>
          {['Food','Transport','Entertainment','Utilities','Salary','Freelance','Shopping','Healthcare','Travel','Rent','Others'].map(c => (
            <option key={c} value={c}>{c}</option>
          ))}
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} className="bg-forest-950 border border-forest-700 rounded-2xl px-4 py-3 text-sand-200">
          <option value="date-desc">Newest</option>
          <option value="date-asc">Oldest</option>
          <option value="amount-desc">Highest</option>
          <option value="amount-asc">Lowest</option>
        </select>
        {role === 'admin' && (
          <button 
            onClick={openAdd}
            className="flex items-center gap-2 px-5 py-3 bg-terra hover:bg-terra-dark text-white rounded-2xl font-medium transition-all"
          >
            <Plus size={18} /> Add
          </button>
        )}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-forest-700 bg-forest-950/50">
              <th className="text-left px-6 py-4 text-sand-400 font-medium">Date</th>
              <th className="text-left px-6 py-4 text-sand-400 font-medium">Description</th>
              <th className="text-left px-6 py-4 text-sand-400 font-medium">Category</th>
              <th className="text-left px-6 py-4 text-sand-400 font-medium">Type</th>
              <th className="text-right px-6 py-4 text-sand-400 font-medium">Amount</th>
              {role === 'admin' && <th className="w-24"></th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-forest-800">
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="px-6 py-12 text-center text-sand-500">No transactions found</td></tr>
            ) : filtered.map((tx, i) => (
              <motion.tr key={tx.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.015 }} className="hover:bg-forest-900/60">
                <td className="px-6 py-4 text-sand-400 font-mono text-xs">{formatDate(tx.date)}</td>
                <td className="px-6 py-4 text-sand-100 font-medium">{tx.description}</td>
                <td className="px-6 py-4"><span className="px-3 py-1 bg-forest-800 rounded-full text-xs text-sand-400">{tx.category}</span></td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${tx.type === 'income' ? 'bg-moss/20 text-moss' : 'bg-terra/20 text-terra'}`}>
                    {tx.type}
                  </span>
                </td>
                <td className={`px-6 py-4 text-right font-mono font-semibold ${tx.type === 'income' ? 'text-moss' : 'text-terra'}`}>
                  {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount)}
                </td>
                {role === 'admin' && (
                  <td className="px-6 py-4">
                    <div className="flex gap-1 justify-end">
                      <button onClick={() => openEdit(tx)} className="p-2 text-sand-400 hover:text-sand-200 hover:bg-forest-800 rounded-lg">
                        <PencilSimple size={16} />
                      </button>
                      <button onClick={() => handleDelete(tx.id)} className="p-2 text-sand-400 hover:text-terra hover:bg-forest-800 rounded-lg">
                        <Trash size={16} />
                      </button>
                    </div>
                  </td>
                )}
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddEditModal open={modalOpen} onClose={() => setModalOpen(false)} transaction={editing} />
    </div>
  );
}

function InsightsPanel() {
  const { transactions } = useFinance();

  if (transactions.length === 0) {
    return <div className="bento-card rounded-3xl p-8 text-center text-sand-500">No insights available yet</div>;
  }

  const expenses = transactions.filter(t => t.type === 'expense');
  const income = transactions.filter(t => t.type === 'income');

  const catSums = expenses.reduce((acc, t) => { acc[t.category] = (acc[t.category] || 0) + t.amount; return acc; }, {} as Record<string, number>);
  const top = Object.entries(catSums).sort((a, b) => b[1] - a[1])[0];

  const totalInc = income.reduce((s, t) => s + t.amount, 0);
  const totalExp = expenses.reduce((s, t) => s + t.amount, 0);
  const savings = totalInc > 0 ? ((totalInc - totalExp) / totalInc) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bento-card rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-amber/10"><TrendUp size={22} className="text-amber" /></div>
          <div>
            <div className="text-xs text-sand-500">HIGHEST SPEND</div>
            <div className="font-semibold text-sand-100">{top ? top[0] : 'N/A'}</div>
          </div>
        </div>
        <div className="text-4xl font-semibold text-sand-100 font-mono">{top ? formatCurrency(top[1]) : formatCurrency(0)}</div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bento-card rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-moss/10"><ArrowUp size={22} className="text-moss" /></div>
          <div>
            <div className="text-xs text-sand-500">SAVINGS RATE</div>
            <div className="font-semibold text-sand-100">Overall</div>
          </div>
        </div>
        <div className="text-4xl font-semibold text-sand-100 font-mono">{savings.toFixed(0)}%</div>
        <div className="text-xs text-sand-500 mt-1">{savings > 20 ? 'Excellent!' : savings > 0 ? 'Keep going' : 'Review expenses'}</div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bento-card rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-3 rounded-2xl bg-sand-400/10"><ArrowDown size={22} className="text-sand-400" /></div>
          <div>
            <div className="text-xs text-sand-500">AVERAGE SPEND</div>
            <div className="font-semibold text-sand-100">Per Transaction</div>
          </div>
        </div>
        <div className="text-4xl font-semibold text-sand-100 font-mono">
          {formatCurrency(transactions.length > 0 ? transactions.reduce((s, t) => s + t.amount, 0) / transactions.length : 0)}
        </div>
        <div className="text-xs text-sand-500 mt-1">{transactions.length} total transactions</div>
      </motion.div>
    </div>
  );
}

function Dashboard() {
  const { loading, role, transactions } = useFinance();
  const [tab, setTab] = useState<'overview' | 'transactions' | 'insights' | 'analytics'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-forest-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-sand-400 border-t-transparent rounded-full animate-spin" />
          <p className="text-sand-400">Loading your finances...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { id: 'overview', label: 'Overview', icon: TrendUp },
    { id: 'transactions', label: 'Transactions', icon: ArrowUp },
    { id: 'analytics', label: 'Analytics', icon: ChartBar },
    { id: 'insights', label: 'Insights', icon: ArrowDown },
  ];

  return (
    <div className="min-h-screen bg-forest-950 text-sand-200 font-sans flex">
      {/* Backdrop for mobile sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Left Sidebar - Hidden on mobile, shown on lg screens */}
      <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:relative w-72 bg-forest-900 border-r border-forest-800 flex flex-col h-screen z-50 transition-transform duration-300`}>
        {/* Logo */}
        <div className="p-6 lg:p-8 flex items-center justify-between lg:justify-start gap-3 border-b border-forest-800">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-moss to-forest-600 flex items-center justify-center">
              <TrendUp size={28} weight="bold" className="text-sand-100" />
            </div>
            <div>
              <div className="font-display text-2xl lg:text-3xl font-semibold text-sand-100 tracking-tight">FinTrack</div>
              <div className="text-[10px] text-sand-500 tracking-[2px]">Track Analyse and Grow.</div>
            </div>
          </div>
          <button
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg bg-forest-800 text-sand-300 hover:bg-forest-700"
          >
            <X size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-4 py-8">
          <div className="text-xs text-sand-500 px-4 mb-3 font-medium tracking-widest">MAIN</div>
          <div className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setTab(item.id as any)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-left transition-all ${active ? 'bg-forest-800 text-sand-100 shadow-sm border-l-4 border-moss' : 'text-sand-400 hover:bg-forest-800/50 hover:text-sand-200'}`}
                >
                  <Icon size={20} />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>


        </nav>

        {/* User Profile at Bottom */}
        <div className="p-4 border-t border-forest-800">
          <div className="flex items-center gap-3 bg-forest-800 rounded-2xl p-3">
            <img src="/images/avatar.jpg" alt="user" className="w-11 h-11 rounded-full object-cover border border-forest-700" />
            <div className="flex-1 min-w-0">
              <div className="text-sand-100 font-medium truncate">Himanshu Sharma</div>
              <div className="text-xs text-sand-500">Financial Manager</div>
            </div>
            <RoleSwitcher />
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 lg:ml-72">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-40 bg-forest-950/95 backdrop-blur-lg border-b border-forest-800">
          <div className="max-w-6xl mx-auto px-4 lg:px-10 h-20 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Hamburger menu for mobile */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="lg:hidden p-2 rounded-lg bg-forest-800 text-sand-300 hover:bg-forest-700"
              >
                <List size={24} />
              </button>
              <div>
                <h2 className="font-display text-xl lg:text-2xl font-semibold text-sand-100">
                  {tab === 'overview' && 'Control Room'}
                  {tab === 'transactions' && 'Transaction Ledger'}
                  {tab === 'analytics' && 'Analytics'}
                  {tab === 'insights' && 'Key Insights'}
                </h2>
                <p className="text-sm text-sand-500 -mt-1">
                  {tab === 'overview' && 'Financial overview & trends'}
                  {tab === 'transactions' && 'All activity and records'}
                  {tab === 'analytics' && 'Patterns, trends & breakdowns'}
                  {tab === 'insights' && 'Patterns and observations'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 lg:gap-4">
              {tab === 'transactions' && role === 'admin' && (
                <button
                  onClick={() => {
                    // Trigger add transaction modal - we'll dispatch via custom event or use context
                    const btn = document.querySelector('[data-add-tx]') as HTMLButtonElement;
                    btn?.click();
                  }}
                  className="flex items-center gap-2 px-3 py-2 lg:px-4 bg-terra hover:bg-terra-dark rounded-2xl text-sm font-medium text-white transition-colors"
                >
                  <Plus size={16} /> <span className="hidden sm:inline">Add Transaction</span>
                </button>
              )}
              <button
                onClick={() => exportToCSV(transactions)}
                className="flex items-center gap-2 px-3 py-2 lg:px-4 bg-moss hover:bg-moss/90 rounded-2xl text-sm font-medium text-white transition-colors shadow-sm"
              >
                <span className="hidden sm:inline">Export CSV</span>
                <span className="sm:hidden">CSV</span>
              </button>
              <button
                onClick={() => exportToJSON(transactions)}
                className="flex items-center gap-2 px-3 py-2 lg:px-4 bg-moss hover:bg-moss/90 rounded-2xl text-sm font-medium text-white transition-colors shadow-sm"
              >
                <span className="hidden sm:inline">Export JSON</span>
                <span className="sm:hidden">JSON</span>
              </button>
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="max-w-6xl mx-auto px-4 lg:px-10 py-6 lg:py-10">
          {/* Overview Tab */}
          {tab === 'overview' && (
            <div className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
                <BalanceCard />
                <IncomeCard />
                <ExpensesCard />
              </div>
              <div className="grid grid-cols-1 gap-4 lg:gap-6">
                <BalanceTrendChart />
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                <SpendingBreakdownChart />
                <SpendingSummaryCard />
              </div>
              <SpendingHeatmap />
            </div>
          )}

          {/* Transactions Tab */}
          {tab === 'transactions' && (
            <TransactionsTable />
          )}

          {/* Analytics Tab */}
          {tab === 'analytics' && <AnalyticsPanel />}

          {/* Insights Tab — Separate Section */}
          {tab === 'insights' && (
            <div className="space-y-8">
              <InsightsPanel />

              {/* Goal Progress Tracker */}
              <div className="bento-card rounded-3xl p-8">
                <div className="flex items-center justify-between mb-8">
                  <div>
                    <div className="text-sm text-sand-400">GOAL PROGRESS TRACKER</div>
                    <div className="text-2xl font-semibold text-sand-100">Financial Goals</div>
                    <div className="text-sm text-sand-500 mt-1">Track your savings targets with estimated completion dates</div>
                  </div>
                  <div className="p-4 rounded-2xl bg-amber/10">
                    <Target size={28} className="text-amber" />
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 lg:gap-6">
                  {(() => {
                    const financialGoals = [
                      { title: 'Emergency Fund', targetAmount: 500000, currentAmount: 320000, progress: 64, estimatedDate: addMonths(new Date(), 6), color: '#10b981' },
                      { title: 'Down Payment', targetAmount: 2000000, currentAmount: 800000, progress: 40, estimatedDate: addMonths(new Date(), 18), color: '#3b82f6' },
                      { title: 'Vacation', targetAmount: 300000, currentAmount: 180000, progress: 60, estimatedDate: addMonths(new Date(), 4), color: '#f59e0b' },
                      { title: 'New Car', targetAmount: 1500000, currentAmount: 450000, progress: 30, estimatedDate: addMonths(new Date(), 24), color: '#8b5cf6' },
                      { title: 'Retirement', targetAmount: 10000000, currentAmount: 2500000, progress: 25, estimatedDate: addMonths(new Date(), 60), color: '#ec4899' },
                    ];
                    return financialGoals.map((goal, index) => (
                      <div key={index} className="flex flex-col items-center">
                        <CircularProgressRing
                          progress={goal.progress}
                          size={100}
                          strokeWidth={10}
                          color={goal.color}
                          backgroundColor="#2a4a3e"
                          label={goal.title}
                          subtitle={`${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)}`}
                        />
                        <div className="mt-3 text-center">
                          <div className="text-xs text-sand-400">Est. completion</div>
                          <div className="text-sm font-medium text-sand-100">{format(goal.estimatedDate, 'MMM yyyy')}</div>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              </div>

              {/* Additional Insight Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bento-card rounded-3xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-moss/10">
                      <TrendUp size={28} className="text-moss" />
                    </div>
                    <div>
                      <div className="text-sm text-sand-400">TREND ANALYSIS</div>
                      <div className="text-xl font-semibold text-sand-100">Spending Momentum</div>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm">
                    <div className="flex justify-between py-3 border-b border-forest-800">
                      <span className="text-sand-400">Average daily spend</span>
                      <span className="font-mono text-sand-100">
                        {(() => {
                          const expenses = useFinance().transactions.filter(t => t.type === 'expense');
                          if (expenses.length === 0) return '$0';
                          const total = expenses.reduce((s, t) => s + t.amount, 0);
                          const days = Math.max(1, Math.ceil((new Date().getTime() - new Date(expenses[expenses.length - 1].date).getTime()) / (1000 * 60 * 60 * 24)));
                          return formatCurrency(total / days);
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between py-3 border-b border-forest-800">
                      <span className="text-sand-400">Largest single expense</span>
                      <span className="font-mono text-sand-100">
                        {(() => {
                          const expenses = useFinance().transactions.filter(t => t.type === 'expense');
                          if (expenses.length === 0) return '$0';
                          return formatCurrency(Math.max(...expenses.map(t => t.amount)));
                        })()}
                      </span>
                    </div>
                    <div className="flex justify-between py-3">
                      <span className="text-sand-400">Income sources</span>
                      <span className="font-mono text-moss">
                        {new Set(useFinance().transactions.filter(t => t.type === 'income').map(t => t.category)).size}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="bento-card rounded-3xl p-8">
                  <div className="flex items-center gap-4 mb-6">
                    <div className="p-4 rounded-2xl bg-gold/10">
                      <ArrowUp size={28} className="text-gold" />
                    </div>
                    <div>
                      <div className="text-sm text-sand-400">FORECAST</div>
                      <div className="text-xl font-semibold text-sand-100">Projected Balance</div>
                    </div>
                  </div>
                  <div className="space-y-4 text-sm">
                    {(() => {
                      const tx = useFinance().transactions;
                      const income = tx.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
                      const exp = tx.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
                      const net = income - exp;
                      const monthlyNet = net / 3;
                      return (
                        <>
                          <div className="p-4 bg-forest-950 rounded-2xl">
                            <div className="text-xs text-sand-500 mb-1">NEXT MONTH PROJECTION</div>
                            <div className={`font-mono text-3xl ${monthlyNet >= 0 ? 'text-moss' : 'text-terra'}`}>
                              {formatCurrency(Math.abs(monthlyNet))}
                            </div>
                            <div className="text-xs text-sand-500 mt-1">{monthlyNet >= 0 ? 'Expected surplus' : 'Expected deficit'}</div>
                          </div>
                          <div className="text-xs text-sand-500">
                            Based on current 3-month average. Actual results may vary.
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>

        <footer className="border-t border-forest-800 py-6 lg:py-8 mt-8 lg:mt-12">
          <div className="max-w-6xl mx-auto px-4 lg:px-10 text-center text-sand-500 text-sm">
            FinTrack
          </div>
        </footer>
      </div>
    </div>
  );
}

function App() {
  return (
    <FinanceProvider>
      <Dashboard />
    </FinanceProvider>
  );
}

export default App;
