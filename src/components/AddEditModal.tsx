import React, { useState, useEffect } from 'react';
import { useFinance } from '../context/FinanceContext';
import { categories } from '../lib/utils';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface AddEditModalProps {
  open: boolean;
  onClose: () => void;
  transaction?: any;
}

export default function AddEditModal({ open, onClose, transaction }: AddEditModalProps) {
  const { addTransaction, updateTransaction } = useFinance();
  const [form, setForm] = useState({
    date: '',
    amount: '',
    category: 'Food',
    type: 'expense' as 'income' | 'expense',
    description: '',
  });

  useEffect(() => {
    if (transaction) {
      setForm({
        date: transaction.date.split('T')[0], // for input type date
        amount: transaction.amount.toString(),
        category: transaction.category,
        type: transaction.type,
        description: transaction.description,
      });
    } else {
      setForm({
        date: new Date().toISOString().split('T')[0],
        amount: '',
        category: 'Food',
        type: 'expense',
        description: '',
      });
    }
  }, [transaction]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.description || !form.amount) return;

    const payload = {
      date: new Date(form.date).toISOString(),
      amount: parseFloat(form.amount),
      category: form.category,
      type: form.type,
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
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-zinc-900 border border-zinc-700 rounded-3xl w-full max-w-md overflow-hidden"
        >
          <div className="flex items-center justify-between p-6 border-b border-zinc-800">
            <h2 className="text-xl font-semibold text-white">
              {transaction ? 'Edit Transaction' : 'New Transaction'}
            </h2>
            <button onClick={onClose} className="text-zinc-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            <div>
              <label className="block text-sm text-zinc-400 mb-1.5">Description</label>
              <input
                type="text"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="e.g. Grocery shopping"
                className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white placeholder:text-zinc-500 focus:border-zinc-600 outline-none"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-3 text-zinc-500">$</span>
                  <input
                    type="number"
                    step="0.01"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="0.00"
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-8 py-3 text-white placeholder:text-zinc-500 focus:border-zinc-600 outline-none"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Date</label>
                <input
                  type="date"
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-zinc-600 outline-none"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Type</label>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'expense' })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${form.type === 'expense' ? 'bg-rose-600 text-white' : 'bg-zinc-950 border border-zinc-800 text-zinc-400'}`}
                  >
                    Expense
                  </button>
                  <button
                    type="button"
                    onClick={() => setForm({ ...form, type: 'income' })}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-medium transition-all ${form.type === 'income' ? 'bg-emerald-600 text-white' : 'bg-zinc-950 border border-zinc-800 text-zinc-400'}`}
                  >
                    Income
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">Category</label>
                <select
                  value={form.category}
                  onChange={(e) => setForm({ ...form, category: e.target.value })}
                  className="w-full bg-zinc-950 border border-zinc-800 rounded-xl px-4 py-3 text-white focus:border-zinc-600 outline-none"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl border border-zinc-700 text-white hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex-1 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium transition-colors"
              >
                {transaction ? 'Update' : 'Add Transaction'}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
