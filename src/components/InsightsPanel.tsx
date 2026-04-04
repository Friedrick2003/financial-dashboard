import { useFinance } from '../context/FinanceContext';
import { formatCurrency } from '../lib/utils';
import { useSpotlight } from '../lib/spotlight';
import { useTilt } from '../lib/tilt';
import { TrendingUp, Award, Calendar, Target, Goal, Zap } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth, parseISO, addMonths, subDays, startOfDay } from 'date-fns';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import CircularProgressRing from './CircularProgressRing';

export default function InsightsPanel() {
  const { transactions } = useFinance();
  const highSpendingSpot = useSpotlight();
  const highSpendingTilt = useTilt();
  const savingsSpot = useSpotlight();
  const savingsTilt = useTilt();
  const monthlySpot = useSpotlight();
  const monthlyTilt = useTilt();
  const avgSpot = useSpotlight();
  const avgTilt = useTilt();
  const chartSpot = useSpotlight();
  const chartTilt = useTilt();
  const goalsSpot = useSpotlight();
  const goalsTilt = useTilt();
  const velocitySpot = useSpotlight();
  const velocityTilt = useTilt();

  if (transactions.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-8 text-center">
        <div className="text-4xl mb-4">📊</div>
        <h3 className="text-xl font-semibold mb-2">No Data Yet</h3>
        <p className="text-zinc-500">Add some transactions to see insights</p>
      </div>
    );
  }

  const expenses = transactions.filter((t) => t.type === 'expense');
  const income = transactions.filter((t) => t.type === 'income');

  // Highest spending category
  const catSums = expenses.reduce((acc, tx) => {
    acc[tx.category] = (acc[tx.category] || 0) + tx.amount;
    return acc;
  }, {} as Record<string, number>);

  const topCategory = Object.entries(catSums).sort((a, b) => b[1] - a[1])[0];
  const highestSpending = topCategory ? { category: topCategory[0], amount: topCategory[1] } : null;

  // Monthly comparison: current vs last month
  const now = new Date();
  const thisMonthStart = startOfMonth(now);
  const thisMonthEnd = endOfMonth(now);
  const lastMonthStart = startOfMonth(subMonths(now, 1));
  const lastMonthEnd = endOfMonth(subMonths(now, 1));

  const thisMonthIncome = income.filter(t => {
    const d = parseISO(t.date);
    return d >= thisMonthStart && d <= thisMonthEnd;
  }).reduce((s, t) => s + t.amount, 0);

  const thisMonthExpense = expenses.filter(t => {
    const d = parseISO(t.date);
    return d >= thisMonthStart && d <= thisMonthEnd;
  }).reduce((s, t) => s + t.amount, 0);

  const lastMonthIncome = income.filter(t => {
    const d = parseISO(t.date);
    return d >= lastMonthStart && d <= lastMonthEnd;
  }).reduce((s, t) => s + t.amount, 0);

  const lastMonthExpense = expenses.filter(t => {
    const d = parseISO(t.date);
    return d >= lastMonthStart && d <= lastMonthEnd;
  }).reduce((s, t) => s + t.amount, 0);

  const savingsRate = thisMonthIncome > 0 ? ((thisMonthIncome - thisMonthExpense) / thisMonthIncome) * 100 : 0;

  // Monthly data for bar chart (last 6 months)
  const monthlyData: any[] = [];
  for (let i = 5; i >= 0; i--) {
    const monthDate = subMonths(now, i);
    const monthStart = startOfMonth(monthDate);
    const monthEnd = endOfMonth(monthDate);
    const mIncome = income.filter(t => {
      const d = parseISO(t.date);
      return d >= monthStart && d <= monthEnd;
    }).reduce((s, t) => s + t.amount, 0);
    const mExpense = expenses.filter(t => {
      const d = parseISO(t.date);
      return d >= monthStart && d <= monthEnd;
    }).reduce((s, t) => s + t.amount, 0);
    monthlyData.push({
      month: format(monthDate, 'MMM'),
      income: Math.round(mIncome),
      expense: Math.round(mExpense),
    });
  }

  // Spending velocity: last 30 days vs previous 30 days
  const today = startOfDay(now);
  const recentStart = subDays(today, 30);
  const priorStart = subDays(recentStart, 30);
  const recentEnd = today;
  const priorEnd = subDays(recentStart, 1);

  const recentSpending = expenses.filter(t => {
    const d = parseISO(t.date);
    return d >= recentStart && d <= recentEnd;
  }).reduce((s, t) => s + t.amount, 0);

  const priorSpending = expenses.filter(t => {
    const d = parseISO(t.date);
    return d >= priorStart && d <= priorEnd;
  }).reduce((s, t) => s + t.amount, 0);

  const recentDaily = recentSpending / 30;
  const priorDaily = priorSpending / 30;
  const velocityChange = priorDaily !== 0 ? ((recentDaily - priorDaily) / priorDaily) * 100 : 0;

  // Average transaction
  const avgAmount = transactions.length > 0
    ? transactions.reduce((s, t) => s + t.amount, 0) / transactions.length
    : 0;

  const totalTx = transactions.length;

  // Sample financial goals
  const financialGoals = [
    {
      title: 'Emergency Fund',
      targetAmount: 500000,
      currentAmount: 320000,
      progress: 64,
      estimatedDate: addMonths(new Date(), 6),
      color: '#10b981',
    },
    {
      title: 'Down Payment',
      targetAmount: 2000000,
      currentAmount: 800000,
      progress: 40,
      estimatedDate: addMonths(new Date(), 18),
      color: '#3b82f6',
    },
    {
      title: 'Vacation',
      targetAmount: 300000,
      currentAmount: 180000,
      progress: 60,
      estimatedDate: addMonths(new Date(), 4),
      color: '#f59e0b',
    },
    {
      title: 'New Car',
      targetAmount: 1500000,
      currentAmount: 450000,
      progress: 30,
      estimatedDate: addMonths(new Date(), 24),
      color: '#8b5cf6',
    },
    {
      title: 'Retirement',
      targetAmount: 10000000,
      currentAmount: 2500000,
      progress: 25,
      estimatedDate: addMonths(new Date(), 60),
      color: '#ec4899',
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        {/* Highest Spending */}
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 spotlight-card"
          style={{ ...highSpendingSpot.style, ...highSpendingTilt.style }}
          onMouseMove={(e) => {
            highSpendingSpot.handleMouseMove(e);
            highSpendingTilt.handleMouseMove(e);
          }}
          onMouseLeave={(_e) => {
            highSpendingSpot.handleMouseLeave();
            highSpendingTilt.handleMouseLeave();
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-rose-500/10">
              <Award className="w-6 h-6 text-rose-400" />
            </div>
            <div>
              <div className="text-sm text-zinc-400">Top Spending</div>
              <div className="font-semibold text-white">{highestSpending?.category || 'N/A'}</div>
            </div>
          </div>
          <div className="text-3xl font-semibold text-white mb-1">
            {highestSpending ? formatCurrency(highestSpending.amount) : '$0'}
          </div>
          <div className="text-xs text-zinc-500">Highest category expense</div>
        </div>

        {/* Savings Rate */}
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 spotlight-card"
          style={{ ...savingsSpot.style, ...savingsTilt.style }}
          onMouseMove={(e) => {
            savingsSpot.handleMouseMove(e);
            savingsTilt.handleMouseMove(e);
          }}
          onMouseLeave={(_e) => {
            savingsSpot.handleMouseLeave();
            savingsTilt.handleMouseLeave();
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-emerald-500/10">
              <Target className="w-6 h-6 text-emerald-400" />
            </div>
            <div>
              <div className="text-sm text-zinc-400">Savings Rate</div>
              <div className="font-semibold text-white">This Month</div>
            </div>
          </div>
          <div className="text-3xl font-semibold text-white mb-1">
            {savingsRate.toFixed(0)}%
          </div>
          <div className={`text-xs ${savingsRate > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {savingsRate > 20 ? 'Great job! 🎉' : savingsRate > 0 ? 'Keep it up' : 'Watch expenses'}
          </div>
        </div>

        {/* Monthly Comparison */}
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 spotlight-card"
          style={{ ...monthlySpot.style, ...monthlyTilt.style }}
          onMouseMove={(e) => {
            monthlySpot.handleMouseMove(e);
            monthlyTilt.handleMouseMove(e);
          }}
          onMouseLeave={(_e) => {
            monthlySpot.handleMouseLeave();
            monthlyTilt.handleMouseLeave();
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-blue-500/10">
              <Calendar className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <div className="text-sm text-zinc-400">This Month</div>
              <div className="font-semibold text-white">Net Flow</div>
            </div>
          </div>
          <div className={`text-3xl font-semibold mb-1 ${thisMonthIncome - thisMonthExpense >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {formatCurrency(Math.abs(thisMonthIncome - thisMonthExpense))}
          </div>
          <div className="text-xs text-zinc-500">
            {thisMonthIncome - thisMonthExpense >= 0 ? 'Surplus' : 'Deficit'} vs last: {formatCurrency(Math.abs((lastMonthIncome - lastMonthExpense) - (thisMonthIncome - thisMonthExpense)))}
          </div>
        </div>

        {/* Average Transaction */}
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 spotlight-card"
          style={{ ...avgSpot.style, ...avgTilt.style }}
          onMouseMove={(e) => {
            avgSpot.handleMouseMove(e);
            avgTilt.handleMouseMove(e);
          }}
          onMouseLeave={(_e) => {
            avgSpot.handleMouseLeave();
            avgTilt.handleMouseLeave();
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-purple-500/10">
              <TrendingUp className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="text-sm text-zinc-400">Average</div>
              <div className="font-semibold text-white">Per Transaction</div>
            </div>
          </div>
          <div className="text-3xl font-semibold text-white mb-1">
            {formatCurrency(avgAmount)}
          </div>
          <div className="text-xs text-zinc-500">{totalTx} total transactions</div>
        </div>

        {/* Spending Velocity */}
        <div
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 spotlight-card"
          style={{ ...velocitySpot.style, ...velocityTilt.style }}
          onMouseMove={(e) => {
            velocitySpot.handleMouseMove(e);
            velocityTilt.handleMouseMove(e);
          }}
          onMouseLeave={(_e) => {
            velocitySpot.handleMouseLeave();
            velocityTilt.handleMouseLeave();
          }}
        >
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-xl bg-amber-500/10">
              <Zap className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <div className="text-sm text-zinc-400">Spending Velocity</div>
              <div className="font-semibold text-white">Last 30 days vs previous</div>
            </div>
          </div>
          <div className={`text-3xl font-semibold mb-1 ${velocityChange > 0 ? 'text-rose-400' : 'text-emerald-400'}`}>
            {velocityChange > 0 ? '+' : ''}{velocityChange.toFixed(1)}%
          </div>
          <div className="text-xs text-zinc-500">
            {velocityChange > 0 ? 'Spending faster than usual' : velocityChange < 0 ? 'Spending slower than usual' : 'Spending at same pace'}
          </div>
        </div>
      </div>

      {/* Goal Progress Tracker */}
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 spotlight-card"
        style={{ ...goalsSpot.style, ...goalsTilt.style }}
        onMouseMove={(e) => {
          goalsSpot.handleMouseMove(e);
          goalsTilt.handleMouseMove(e);
        }}
        onMouseLeave={(_e) => {
          goalsSpot.handleMouseLeave();
          goalsTilt.handleMouseLeave();
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Goal Progress Tracker</h3>
            <p className="text-sm text-zinc-400">Track your financial goals with estimated completion dates</p>
          </div>
          <div className="p-3 rounded-xl bg-amber-500/10">
            <Goal className="w-6 h-6 text-amber-400" />
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {financialGoals.map((goal, index) => (
            <div key={index} className="flex flex-col items-center">
              <CircularProgressRing
                progress={goal.progress}
                size={100}
                strokeWidth={10}
                color={goal.color}
                backgroundColor="#3f3f46"
                label={goal.title}
                subtitle={`${formatCurrency(goal.currentAmount)} / ${formatCurrency(goal.targetAmount)}`}
              />
              <div className="mt-3 text-center">
                <div className="text-sm text-zinc-400">Est. completion</div>
                <div className="text-sm font-medium text-white">{format(goal.estimatedDate, 'MMM yyyy')}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Bar Chart */}
      <div
        className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 spotlight-card"
        style={{ ...chartSpot.style, ...chartTilt.style }}
        onMouseMove={(e) => {
          chartSpot.handleMouseMove(e);
          chartTilt.handleMouseMove(e);
        }}
        onMouseLeave={(_e) => {
          chartSpot.handleMouseLeave();
          chartTilt.handleMouseLeave();
        }}
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-semibold text-white">Monthly Comparison</h3>
            <p className="text-sm text-zinc-400">Income vs Expenses over the last 6 months</p>
          </div>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <XAxis 
                dataKey="month" 
                stroke="#3f3f46" 
                tick={{ fill: '#71717a', fontSize: 12 }}
              />
              <YAxis 
                stroke="#3f3f46" 
                tick={{ fill: '#71717a', fontSize: 12 }}
                tickFormatter={(v) => formatCurrency(Number(v))}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: '#18181b', 
                  border: '1px solid #3f3f46',
                  borderRadius: '8px',
                  color: '#fff'
                }}
                formatter={(value, name) => [
                  formatCurrency(Number(value || 0)), 
                  name === 'income' ? 'Income' : 'Expenses'
                ]}
              />
              <Bar dataKey="income" fill="#10b981" radius={[4, 4, 0, 0]} name="Income" />
              <Bar dataKey="expense" fill="#ef4444" radius={[4, 4, 0, 0]} name="Expenses" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex items-center justify-center gap-6 mt-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-emerald-500" /> Income
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded bg-rose-500" /> Expenses
          </div>
        </div>
      </div>
    </div>
  );
}
