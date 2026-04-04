import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/utils';
import { TrendingUp, TrendingDown, DollarSign } from 'lucide-react';
import { motion } from 'framer-motion';

export default function SummaryCards() {
  const { transactions } = useFinance();

  const income = transactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const expenses = transactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = income - expenses;

  const cards = [
    {
      title: 'Total Balance',
      value: balance,
      icon: DollarSign,
      color: balance >= 0 ? 'emerald' : 'rose',
      trend: balance >= 0 ? 'up' : 'down',
    },
    {
      title: 'Total Income',
      value: income,
      icon: TrendingUp,
      color: 'emerald',
      trend: 'up',
    },
    {
      title: 'Total Expenses',
      value: expenses,
      icon: TrendingDown,
      color: 'rose',
      trend: 'down',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, index) => {
        const Icon = card.icon;
        return (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 hover:border-zinc-700 transition-colors"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`p-3 rounded-xl bg-${card.color}-500/10`}>
                <Icon className={`w-6 h-6 text-${card.color}-400`} />
              </div>
              <div
                className={`flex items-center gap-1 text-sm ${
                  card.trend === 'up' ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {card.trend === 'up' ? '↑' : '↓'}
                <span>{card.trend === 'up' ? 'Positive' : 'Negative'}</span>
              </div>
            </div>
            <div className="text-4xl font-semibold mb-1 text-white">
              {formatCurrency(Math.abs(card.value))}
            </div>
            <div className="text-zinc-400 text-sm">{card.title}</div>
          </motion.div>
        );
      })}
    </div>
  );
}
