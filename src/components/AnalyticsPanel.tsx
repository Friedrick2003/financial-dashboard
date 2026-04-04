import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { useFinance } from '../context/FinanceContext';
import { useSpotlight } from '../lib/spotlight';
import { formatCurrency } from '../lib/utils';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area,
} from 'recharts';
import { parseISO, format, getMonth, getYear, startOfMonth, eachMonthOfInterval, subMonths } from 'date-fns';

// ── shared chart theme ────────────────────────────────────────────────────────
const TIP = { background: '#132f26', border: '1px solid #3a5c4f', borderRadius: 8, color: '#e8d9b8' };
const COLORS = ['#c29a64', '#6b8f7a', '#b25c47', '#4a705d', '#d4a017', '#2e5a4a', '#8a4636', '#5c7a5c'];
const fade = (i: number) => ({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, transition: { delay: i * 0.07 } });

// ── KPI box ───────────────────────────────────────────────────────────────────
function KPI({ label, value, sub, accent }: { label: string; value: string; sub: string; accent: string }) {
  return (
    <div className="bento-card rounded-2xl p-5">
      <div className="text-[10px] font-medium tracking-widest text-sand-500 mb-2">{label}</div>
      <div className={`text-2xl font-semibold font-mono ${accent}`}>{value}</div>
      <div className="text-xs text-sand-600 mt-1">{sub}</div>
    </div>
  );
}

// ── tooltip formatter ─────────────────────────────────────────────────────────
const fmtTip = (v: unknown) => [formatCurrency(Number(v || 0)), ''];

export default function AnalyticsPanel() {
  const { transactions } = useFinance();
  const [monthsBack, setMonthsBack] = useState(6);

  const incomeVsExpenseSpot = useSpotlight();
  const cashFlowSpot = useSpotlight();
  const categorySpot = useSpotlight();
  const weekdaySpot = useSpotlight();
  const topCategoriesSpot = useSpotlight();

  const {
    kpis, monthlyData, categoryData, weekdayData, cashFlowData, topCategories,
  } = useMemo(() => {
    const expenses = transactions.filter(t => t.type === 'expense');
    const income   = transactions.filter(t => t.type === 'income');
    const totalExp = expenses.reduce((s, t) => s + t.amount, 0);
    const totalInc = income.reduce((s, t) => s + t.amount, 0);
    const savings  = totalInc > 0 ? ((totalInc - totalExp) / totalInc * 100) : 0;
    const avgTx    = transactions.length ? (totalExp / Math.max(expenses.length, 1)) : 0;

    // ── Monthly income vs expense (last N months) ──
    const now = new Date();
    const months = eachMonthOfInterval({ start: subMonths(startOfMonth(now), monthsBack - 1), end: now });
    const monthlyData = months.map(m => {
      const label = format(m, 'MMM yy');
      const exp = expenses.filter(t => { const d = parseISO(t.date); return getMonth(d) === getMonth(m) && getYear(d) === getYear(m); }).reduce((s, t) => s + t.amount, 0);
      const inc = income.filter(t => { const d = parseISO(t.date); return getMonth(d) === getMonth(m) && getYear(d) === getYear(m); }).reduce((s, t) => s + t.amount, 0);
      return { label, expense: Math.round(exp), income: Math.round(inc) };
    });

    // ── Category breakdown ──
    const catMap: Record<string, number> = {};
    expenses.forEach(t => { catMap[t.category] = (catMap[t.category] || 0) + t.amount; });
    const categoryData = Object.entries(catMap).map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value);
    const topCategories = categoryData.slice(0, 6);

    // ── Weekday spending pattern ──
    const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const daySums = Array(7).fill(0);
    const dayCounts = Array(7).fill(0);
    expenses.forEach(t => { const dow = parseISO(t.date).getDay(); daySums[dow] += t.amount; dayCounts[dow]++; });
    const weekdayData = DAY_NAMES.map((day, i) => ({ day, avg: dayCounts[i] ? Math.round(daySums[i] / dayCounts[i]) : 0, total: Math.round(daySums[i]) }));

    // ── 30-day running cash flow ──
    const cashFlowData = monthlyData.map(m => ({ ...m, net: m.income - m.expense }));

    // ── KPIs ──
    const kpis = [
      { label: 'TOTAL EXPENSES', value: formatCurrency(totalExp), sub: `${expenses.length} transactions`, accent: 'text-terra' },
      { label: 'TOTAL INCOME', value: formatCurrency(totalInc), sub: `${income.length} transactions`, accent: 'text-moss' },
      { label: 'SAVINGS RATE', value: `${savings.toFixed(1)}%`, sub: savings > 20 ? '🌿 On track' : savings > 0 ? '⚡ Improving' : '⚠ Review spend', accent: savings > 20 ? 'text-moss' : savings > 0 ? 'text-gold' : 'text-terra' },
      { label: 'AVG TRANSACTION', value: formatCurrency(avgTx), sub: 'Per expense entry', accent: 'text-sand-300' },
    ];

    return { kpis, monthlyData, categoryData, weekdayData, cashFlowData, topCategories };
  }, [transactions, monthsBack]);

  const noData = transactions.length === 0;

  return (
    <div className="space-y-8">
      {/* ── Header ── */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-sand-100 font-display">Analytics</h2>
          <p className="text-sm text-sand-500 mt-0.5">Deep-dive into your financial patterns</p>
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-sand-500">Period:</span>
          {[3, 6, 12].map(n => (
            <button key={n} onClick={() => setMonthsBack(n)}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${monthsBack === n ? 'bg-forest-700 text-sand-100' : 'text-sand-400 hover:bg-forest-800'}`}>
              {n}M
            </button>
          ))}
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((k, i) => <motion.div key={k.label} {...fade(i)}><KPI {...k} /></motion.div>)}
      </div>

      {noData ? (
        <div className="bento-card rounded-3xl p-16 text-center text-sand-500">
          Add transactions to unlock analytics insights
        </div>
      ) : (
        <>
          {/* ── Income vs Expense Bars ── */}
          <motion.div {...fade(2)} className="bento-card rounded-3xl p-7 spotlight-card" style={incomeVsExpenseSpot.style} onMouseMove={incomeVsExpenseSpot.handleMouseMove} onMouseLeave={incomeVsExpenseSpot.handleMouseLeave}>
            <div className="flex items-center justify-between mb-5">
              <div>
                <div className="text-lg font-semibold text-sand-100">Income vs Expenses</div>
                <div className="text-xs text-sand-500">Monthly comparison</div>
              </div>
              <div className="flex gap-4 text-xs text-sand-500">
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#6b8f7a' }} />Income</span>
                <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm inline-block" style={{ background: '#b25c47' }} />Expense</span>
              </div>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={monthlyData} barGap={4}>
                  <XAxis dataKey="label" stroke="#3a5c4f" tick={{ fill: '#a68d6c', fontSize: 11 }} />
                  <YAxis stroke="#3a5c4f" tick={{ fill: '#a68d6c', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                  <Tooltip contentStyle={TIP} formatter={fmtTip} />
                  <Bar dataKey="income" fill="#6b8f7a" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expense" fill="#b25c47" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* ── Net Cash Flow line + Category donut ── */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Cash flow line */}
            <motion.div {...fade(3)} className="bento-card rounded-3xl p-7 lg:col-span-3 spotlight-card" style={cashFlowSpot.style} onMouseMove={cashFlowSpot.handleMouseMove} onMouseLeave={cashFlowSpot.handleMouseLeave}>
              <div className="text-lg font-semibold text-sand-100 mb-1">Net Cash Flow</div>
              <div className="text-xs text-sand-500 mb-5">Monthly surplus / deficit trend</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cashFlowData}>
                    <defs>
                      <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#6b8f7a" stopOpacity={0.35} />
                        <stop offset="100%" stopColor="#6b8f7a" stopOpacity={0.03} />
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="label" stroke="#3a5c4f" tick={{ fill: '#a68d6c', fontSize: 11 }} />
                    <YAxis stroke="#3a5c4f" tick={{ fill: '#a68d6c', fontSize: 11 }} tickFormatter={v => `₹${(v/1000).toFixed(0)}k`} />
                    <Tooltip contentStyle={TIP} formatter={fmtTip} />
                    <Area type="monotone" dataKey="net" stroke="#6b8f7a" strokeWidth={2.5} fill="url(#netGrad)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Category donut */}
            <motion.div {...fade(3)} className="bento-card rounded-3xl p-7 lg:col-span-2 spotlight-card" style={categorySpot.style} onMouseMove={categorySpot.handleMouseMove} onMouseLeave={categorySpot.handleMouseLeave}>
              <div className="text-lg font-semibold text-sand-100 mb-1">Spend by Category</div>
              <div className="text-xs text-sand-500 mb-4">Top {topCategories.length} categories</div>
              <div className="h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={topCategories} dataKey="value" cx="50%" cy="50%" innerRadius={42} outerRadius={72} paddingAngle={3}>
                      {topCategories.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={TIP} formatter={fmtTip} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-1.5 mt-2">
                {topCategories.slice(0, 4).map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2 text-xs">
                    <div className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ background: COLORS[i] }} />
                    <span className="text-sand-400 truncate flex-1">{c.name}</span>
                    <span className="text-sand-200 font-mono">{formatCurrency(c.value)}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>

          {/* ── Weekday pattern + Category ranked bars ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Weekday spending */}
            <motion.div {...fade(4)} className="bento-card rounded-3xl p-7 spotlight-card" style={weekdaySpot.style} onMouseMove={weekdaySpot.handleMouseMove} onMouseLeave={weekdaySpot.handleMouseLeave}>
              <div className="text-lg font-semibold text-sand-100 mb-1">Spending by Weekday</div>
              <div className="text-xs text-sand-500 mb-5">Average spend per day of week</div>
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weekdayData}>
                    <XAxis dataKey="day" stroke="#3a5c4f" tick={{ fill: '#a68d6c', fontSize: 11 }} />
                    <YAxis stroke="#3a5c4f" tick={{ fill: '#a68d6c', fontSize: 11 }} tickFormatter={v => formatCurrency(Number(v))} />
                    <Tooltip contentStyle={TIP} formatter={fmtTip} />
                    <Bar dataKey="avg" radius={[5, 5, 0, 0]}>
                      {weekdayData.map((_, i) => <Cell key={i} fill={i === 0 || i === 6 ? '#b25c47' : '#4a705d'} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>

            {/* Category ranked list with progress bars */}
            <motion.div {...fade(4)} className="bento-card rounded-3xl p-7 spotlight-card" style={topCategoriesSpot.style} onMouseMove={topCategoriesSpot.handleMouseMove} onMouseLeave={topCategoriesSpot.handleMouseLeave}>
              <div className="text-lg font-semibold text-sand-100 mb-1">Top Categories</div>
              <div className="text-xs text-sand-500 mb-5">Highest spend areas</div>
              <div className="space-y-4">
                {categoryData.slice(0, 7).map((cat, i) => {
                  const pct = Math.round((cat.value / categoryData[0].value) * 100);
                  return (
                    <div key={cat.name}>
                      <div className="flex items-center justify-between mb-1.5 text-sm">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono text-sand-600 w-4">{i + 1}</span>
                          <span className="text-sand-200">{cat.name}</span>
                        </div>
                        <span className="font-mono text-sand-300 text-xs">{formatCurrency(cat.value)}</span>
                      </div>
                      <div className="h-1.5 bg-forest-800 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.3 + i * 0.05, duration: 0.6, ease: 'easeOut' }}
                          className="h-full rounded-full"
                          style={{ background: COLORS[i % COLORS.length] }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}
