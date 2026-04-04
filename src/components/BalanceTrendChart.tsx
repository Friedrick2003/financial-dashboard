import { useFinance } from '../context/FinanceContext';
import { Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { format, parseISO } from 'date-fns';
import { formatCurrency } from '../lib/utils';

export default function BalanceTrendChart() {
  const { transactions } = useFinance();

  if (transactions.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 h-80 flex items-center justify-center">
        <div className="text-center text-zinc-500">No data to display</div>
      </div>
    );
  }

  // Sort transactions by date ascending
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  // Compute cumulative balance
  let balance = 0;
  const data = sorted.map((tx) => {
    balance += tx.type === 'income' ? tx.amount : -tx.amount;
    return {
      date: format(parseISO(tx.date), 'MMM dd'),
      balance: Math.round(balance * 100) / 100,
      fullDate: tx.date,
    };
  });

  // If many points, sample every few for readability
  const displayData = data.length > 20 
    ? data.filter((_, i) => i % Math.ceil(data.length / 15) === 0 || i === data.length - 1)
    : data;

  const minBalance = Math.min(...data.map(d => d.balance));
  const maxBalance = Math.max(...data.map(d => d.balance));
  const padding = (maxBalance - minBalance) * 0.1 || 100;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-white">Balance Trend</h3>
          <p className="text-sm text-zinc-400">Cumulative balance over time</p>
        </div>
        <div className="text-right">
          <div className="text-sm text-zinc-400">Current</div>
          <div className="text-lg font-semibold text-emerald-400">
            {formatCurrency(balance)}
          </div>
        </div>
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={displayData}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis 
              dataKey="date" 
              stroke="#3f3f46" 
              tick={{ fill: '#71717a', fontSize: 12 }}
              tickLine={{ stroke: '#3f3f46' }}
            />
            <YAxis 
              stroke="#3f3f46"
              tick={{ fill: '#71717a', fontSize: 12 }}
              tickLine={{ stroke: '#3f3f46' }}
              tickFormatter={(v) => formatCurrency(Number(v))}
              domain={[minBalance - padding, maxBalance + padding]}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#18181b', 
                border: '1px solid #3f3f46',
                borderRadius: '8px',
                color: '#fff'
              }}
              formatter={(value) => [formatCurrency(Number(value || 0)), 'Balance']}
            />
            <Area 
              type="monotone" 
              dataKey="balance" 
              stroke="#10b981" 
              strokeWidth={3}
              fill="url(#balanceGradient)"
            />
            <Line 
              type="monotone" 
              dataKey="balance" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 3 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
