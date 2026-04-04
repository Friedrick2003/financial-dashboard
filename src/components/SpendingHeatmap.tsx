import { useState, useMemo } from 'react';
import { format, eachDayOfInterval, getDay, isSameDay } from 'date-fns';
import { useSpotlight } from '../lib/spotlight';

// ── Mock data ────────────────────────────────────────────────────────────────
const SPEND: Record<string, number> = {};
for (let i = 0; i < 730; i++) { const d = new Date(); d.setDate(d.getDate() - i); if (Math.random() > .28) SPEND[format(d, 'yyyy-MM-dd')] = ~~(Math.random() * 8000 + 150); }

// ── Color scale (dark-bg → forest → gold) ───────────────────────────────────
const clr = (v: number, mx: number) => {
  if (!v) return '#1a3d2e';
  const t = v / mx;
  return t < .25 ? '#2a5240' : t < .5 ? '#4a705d' : t < .8 ? '#6b8f7a' : '#c29a64';
};

const rup = (n: number) => `₹${n.toLocaleString('en-IN')}`;
const YEARS = [2024, 2025, 2026];
const DLABELS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export default function SpendingHeatmap() {
  const [year, setYear] = useState(new Date().getFullYear());
  const today = new Date();

  const { cols, mMarkers, max, total, peak } = useMemo(() => {
    const days = eachDayOfInterval({ start: new Date(year, 0, 1), end: new Date(year, 11, 31) });
    const vals = days.map(d => SPEND[format(d, 'yyyy-MM-dd')] || 0);
    const max = Math.max(...vals, 1);
    const total = vals.reduce((a, b) => a + b, 0);
    const peakIdx = vals.indexOf(Math.max(...vals));
    const peak = { date: days[peakIdx], amt: vals[peakIdx] };

    // Pad to Sunday-aligned grid then chunk into week columns
    const pad = getDay(days[0]);
    const flat: (Date | null)[] = [...Array(pad).fill(null), ...days];
    while (flat.length % 7) flat.push(null);
    const cols = Array.from({ length: flat.length / 7 }, (_, c) =>
      Array.from({ length: 7 }, (_, r) => flat[c * 7 + r])
    );

    // Month labels: mark first col of each new month
    const seen = new Set<string>();
    const mMarkers: { label: string; col: number }[] = [];
    cols.forEach((col, i) => { const f = col.find(Boolean) as Date | null; if (f) { const m = format(f, 'MMM'); if (!seen.has(m)) { seen.add(m); mMarkers.push({ label: m, col: i }); } } });
    return { cols, mMarkers, max, total, peak };
  }, [year]);

  const { style, handleMouseMove, handleMouseLeave } = useSpotlight();

  return (
    <div
      className="bento-card rounded-3xl p-6 col-span-full spotlight-card"
      style={style}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-semibold text-sand-100 font-display">Spending Activity</h3>
          <p className="text-xs text-sand-500 mt-0.5">{rup(total)} total · Peak {rup(peak.amt)} on {format(peak.date, 'MMM d')}</p>
        </div>
        <select value={year} onChange={e => setYear(+e.target.value)}
          className="bg-forest-800 border border-forest-700 rounded-xl px-3 py-1.5 text-sand-200 text-sm outline-none cursor-pointer">
          {YEARS.map(y => <option key={y}>{y}</option>)}
        </select>
      </div>

      {/* Grid */}
      <div className="overflow-x-auto pb-1">
        <div style={{ display: 'inline-block', position: 'relative' }}>
          {/* Month labels */}
          <div style={{ display: 'flex', paddingLeft: 32, height: 18, position: 'relative' }}>
            {mMarkers.map(({ label, col }) => (
              <span key={label} style={{ position: 'absolute', left: col * 15 + 32, fontSize: 11, color: '#a68d6c' }}>{label}</span>
            ))}
          </div>
          {/* Day labels + week columns */}
          <div style={{ display: 'flex', gap: 0 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 2, width: 30 }}>
              {DLABELS.map((l, i) => (
                <div key={i} style={{ height: 13, fontSize: 10, color: '#a68d6c', lineHeight: '13px', textAlign: 'right', paddingRight: 5 }}>{l}</div>
              ))}
            </div>
            <div style={{ display: 'flex', gap: 2 }}>
              {cols.map((col, ci) => (
                <div key={ci} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {col.map((day, ri) => {
                    const amt = day ? SPEND[format(day, 'yyyy-MM-dd')] || 0 : 0;
                    return <div key={ri} title={day ? `${format(day, 'MMM d, yyyy')} — ${rup(amt)}` : ''}
                      style={{ width: 13, height: 13, borderRadius: 3, backgroundColor: day ? clr(amt, max) : 'transparent',
                        outline: day && isSameDay(day, today) ? '2px solid #e8d9b8' : 'none', outlineOffset: -1, cursor: day ? 'pointer' : 'default' }} />;
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-4 text-xs text-sand-500">
        <span>Less</span>
        {[0, .25, .5, .8, 1].map(v => <div key={v} style={{ width: 12, height: 12, borderRadius: 3, background: clr(v * max, max) }} />)}
        <span>More</span>
      </div>
    </div>
  );
}
