import { useState } from 'react';
import { useFinance } from '../context/FinanceContext';
import { formatDate, formatCurrency, categories, typeColors } from '../lib/utils';
import { Edit2, Trash2, Plus } from 'lucide-react';
import { motion } from 'framer-motion';
import AddEditModal from './AddEditModal';

export default function TransactionsTable() {
  const {
    transactions,
    role,
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
    deleteTransaction,
  } = useFinance();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<any>(null);

  // Filter and sort
  let filtered = transactions.filter((tx) => {
    const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         tx.category.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || tx.type === filterType;
    const matchesCategory = !filterCategory || tx.category === filterCategory;
    const txDate = new Date(tx.date);
    const matchesDateFrom = !dateFrom || txDate >= new Date(dateFrom);
    const matchesDateTo = !dateTo || txDate <= new Date(dateTo);
    const matchesAmountMin = !amountMin || tx.amount >= parseFloat(amountMin);
    const matchesAmountMax = !amountMax || tx.amount <= parseFloat(amountMax);
    return matchesSearch && matchesType && matchesCategory && matchesDateFrom && matchesDateTo && matchesAmountMin && matchesAmountMax;
  });

  // Sort
  filtered = [...filtered].sort((a, b) => {
    if (sortBy === 'date-desc') return new Date(b.date).getTime() - new Date(a.date).getTime();
    if (sortBy === 'date-asc') return new Date(a.date).getTime() - new Date(b.date).getTime();
    if (sortBy === 'amount-desc') return b.amount - a.amount;
    if (sortBy === 'amount-asc') return a.amount - b.amount;
    return 0;
  });

  const handleEdit = (tx: any) => {
    setEditingTx(tx);
    setModalOpen(true);
  };

  const handleDelete = async (id: number) => {
    if (confirm('Delete this transaction?')) {
      await deleteTransaction(id);
    }
  };

  const handleAdd = () => {
    setEditingTx(null);
    setModalOpen(true);
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      {/* Controls */}
      <div className="p-6 border-b border-zinc-800 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 pl-10 text-white placeholder:text-zinc-500 focus:border-zinc-600 outline-none"
            />
            <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 absolute left-4 top-3.5 text-zinc-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>

          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-zinc-600 outline-none"
          >
            <option value="all">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-zinc-600 outline-none"
          >
            <option value="">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-zinc-600 outline-none"
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="amount-desc">Highest Amount</option>
            <option value="amount-asc">Lowest Amount</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-zinc-600 outline-none"
            placeholder="From Date"
          />

          <input
            type="date"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-zinc-600 outline-none"
            placeholder="To Date"
          />

          <input
            type="number"
            value={amountMin}
            onChange={(e) => setAmountMin(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-zinc-600 outline-none"
            placeholder="Min Amount"
          />

          <input
            type="number"
            value={amountMax}
            onChange={(e) => setAmountMax(e.target.value)}
            className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-2.5 text-white focus:border-zinc-600 outline-none"
            placeholder="Max Amount"
          />
        </div>

        {role === 'admin' && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleAdd}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 rounded-xl text-white font-medium transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </motion.button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950/50">
              <th className="text-left px-6 py-4 font-medium text-zinc-400">Date</th>
              <th className="text-left px-6 py-4 font-medium text-zinc-400">Description</th>
              <th className="text-left px-6 py-4 font-medium text-zinc-400">Category</th>
              <th className="text-left px-6 py-4 font-medium text-zinc-400">Type</th>
              <th className="text-right px-6 py-4 font-medium text-zinc-400">Amount</th>
              {role === 'admin' && <th className="text-right px-6 py-4 font-medium text-zinc-400 w-24">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={role === 'admin' ? 6 : 5} className="px-6 py-16 text-center">
                  <div className="text-zinc-500">
                    No transactions found
                    {searchTerm && <span> for "{searchTerm}"</span>}
                  </div>
                </td>
              </tr>
            ) : (
              filtered.map((tx, idx) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: idx * 0.02 }}
                  className="hover:bg-zinc-950/50 transition-colors"
                >
                  <td className="px-6 py-4 text-zinc-400">{formatDate(tx.date)}</td>
                  <td className="px-6 py-4 text-white font-medium">{tx.description}</td>
                  <td className="px-6 py-4">
                    <span className="inline-block px-3 py-1 bg-zinc-800 rounded-full text-xs text-zinc-300">
                      {tx.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs border ${typeColors[tx.type]}`}>
                      {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
                    </span>
                  </td>
                  <td className={`px-6 py-4 text-right font-semibold ${tx.type === 'income' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {tx.type === 'income' ? '+' : ''}{formatCurrency(tx.amount)}
                  </td>
                  {role === 'admin' && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleEdit(tx)}
                          className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(tx.id)}
                          className="p-2 text-zinc-400 hover:text-rose-400 hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  )}
                </motion.tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="px-6 py-4 border-t border-zinc-800 text-xs text-zinc-500 flex items-center justify-between">
        <div>Showing {filtered.length} of {transactions.length} transactions</div>
        {role === 'admin' && (
          <div className="text-emerald-400">Admin Mode: Full access enabled</div>
        )}
      </div>

      <AddEditModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        transaction={editingTx}
      />
    </div>
  );
}
