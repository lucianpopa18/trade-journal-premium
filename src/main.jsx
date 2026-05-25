import React, { useMemo, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Plus, LayoutDashboard, BarChart3, CalendarDays, Brain, Target, Settings, NotebookTabs, Flame, ShieldCheck, Sparkles, Trash2, Eye, Pencil, Save, ArrowLeft, Menu, X, BadgeCheck, WalletCards, Percent, Moon, Download, Upload, RotateCcw, DatabaseZap } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, subDays, subMonths, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import './styles.css';

const starterTrades = [
  { id: 1, date: '2026-05-01', symbol: 'XAUUSD', direction: 'Long', session: 'London', entry: 2324.5, sl: 2318.2, tp: 2337.1, risk: 1, lot: 0.18, emotion: 'Calm', setup: 'Breaker + FVG', rr: 2, pnl: 312, confidence: 8, notes: 'Clean confirmation, respected plan.' },
  { id: 2, date: '2026-05-02', symbol: 'EURUSD', direction: 'Short', session: 'NY', entry: 1.0874, sl: 1.0891, tp: 1.0842, risk: 1.5, lot: 0.38, emotion: 'Confident', setup: 'Liquidity Sweep', rr: 1.88, pnl: 198, confidence: 7, notes: 'Good patience before entry.' },
  { id: 3, date: '2026-05-03', symbol: 'NAS100', direction: 'Long', session: 'NY', entry: 18512, sl: 18472, tp: 18572, risk: 1, lot: 0.12, emotion: 'FOMO', setup: 'Break of Structure', rr: 1.5, pnl: -86, confidence: 5, notes: 'Entered slightly early.' },
  { id: 4, date: '2026-05-06', symbol: 'XAUUSD', direction: 'Short', session: 'London', entry: 2345.8, sl: 2351.4, tp: 2331.2, risk: 1, lot: 0.21, emotion: 'Calm', setup: 'Breaker + FVG', rr: 2.6, pnl: 427, confidence: 9, notes: 'Excellent execution.' },
  { id: 5, date: '2026-05-09', symbol: 'GBPUSD', direction: 'Long', session: 'Asia', entry: 1.2712, sl: 1.2692, tp: 1.2752, risk: 0.8, lot: 0.2, emotion: 'Greedy', setup: 'Trend Continuation', rr: 2, pnl: -124, confidence: 4, notes: 'Not A+ setup.' },
  { id: 6, date: '2026-05-14', symbol: 'US30', direction: 'Long', session: 'NY', entry: 39120, sl: 39040, tp: 39280, risk: 1, lot: 0.08, emotion: 'Calm', setup: 'Liquidity Sweep', rr: 2, pnl: 280, confidence: 8, notes: 'Waited for retest.' },
  { id: 7, date: '2026-05-18', symbol: 'XAUUSD', direction: 'Long', session: 'London', entry: 2361.4, sl: 2354.8, tp: 2375.2, risk: 1.2, lot: 0.16, emotion: 'Confident', setup: 'Breaker + FVG', rr: 2.09, pnl: 842, confidence: 9, notes: 'Best trade of week.' },
];

const nav = [
  ['Dashboard', LayoutDashboard], ['Trades', NotebookTabs], ['Analytics', BarChart3], ['Calendar', CalendarDays], ['AI Coach', Brain], ['Goals', Target], ['Settings', Settings]
];

function money(n) { return `${n >= 0 ? '+' : '-'}$${Math.abs(n).toLocaleString(undefined, { maximumFractionDigits: 2 })}`; }
function pct(n) { return `${n.toFixed(1)}%`; }

function App() {
  const [active, setActive] = useState('Dashboard');
  const [trades, setTrades] = useState(() => JSON.parse(localStorage.getItem('skrtzTrades') || 'null') || starterTrades);

  useEffect(() => {
    const savedSettings = JSON.parse(localStorage.getItem('skrtzSettings') || 'null');
    const savedTheme = savedSettings?.theme || 'Dark';
    document.documentElement.setAttribute('data-theme', savedTheme.toLowerCase());
  }, []);
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), symbol: 'XAUUSD', direction: 'Long', session: 'London', entry: '', sl: '', tp: '', risk: 1, lot: '', emotion: 'Calm', setup: 'Breaker + FVG', confidence: 8, notes: '' });

  useEffect(() => localStorage.setItem('skrtzTrades', JSON.stringify(trades)), [trades]);

  const stats = useMemo(() => {
    const total = trades.reduce((a, t) => a + Number(t.pnl || 0), 0);
    const wins = trades.filter(t => Number(t.pnl) > 0);
    const losses = trades.filter(t => Number(t.pnl) < 0);
    const grossWin = wins.reduce((a, t) => a + Number(t.pnl), 0);
    const grossLoss = Math.abs(losses.reduce((a, t) => a + Number(t.pnl), 0));
    const avgRR = trades.length ? trades.reduce((a, t) => a + Number(t.rr || 0), 0) / trades.length : 0;
    const discipline = Math.max(45, Math.round(100 - losses.length * 4 - trades.filter(t => ['FOMO', 'Greedy'].includes(t.emotion)).length * 7 + wins.length * 2));
    return { total, wins: wins.length, losses: losses.length, count: trades.length, winRate: trades.length ? wins.length / trades.length * 100 : 0, profitFactor: grossLoss ? grossWin / grossLoss : grossWin, avgRR, discipline };
  }, [trades]);

  const equity = useMemo(() => trades.slice().sort((a,b)=>a.date.localeCompare(b.date)).reduce((arr, t, i) => {
    const prev = i ? arr[i-1].equity : 0; arr.push({ date: format(parseISO(t.date), 'MMM d'), equity: prev + Number(t.pnl || 0) }); return arr;
  }, []), [trades]);

  const grouped = (key) => Object.values(trades.reduce((a,t)=>{ const k=t[key] || 'Other'; a[k] ||= { name:k, pnl:0, trades:0 }; a[k].pnl += Number(t.pnl||0); a[k].trades++; return a;},{}));

  function addTrade(e) {
    e.preventDefault();
    const rr = form.entry && form.sl && form.tp ? Math.abs((Number(form.tp)-Number(form.entry))/(Number(form.entry)-Number(form.sl))) : 0;
    const signed = form.direction === 'Long' ? 1 : -1;
    const raw = form.entry && form.tp ? (Number(form.tp)-Number(form.entry)) * signed : 0;
    const pnl = form.pnl !== undefined && form.pnl !== '' ? Number(form.pnl) : Math.round(raw * 100 * Number(form.lot || 1));
    setTrades([{ ...form, id: Date.now(), rr: Number(rr.toFixed(2)), pnl }, ...trades]);
    setForm({ ...form, entry: '', sl: '', tp: '', lot: '', notes: '' });
  }

  const pageProps = { trades, stats, equity, grouped, form, setForm, addTrade, setTrades };

  const [menuOpen, setMenuOpen] = useState(false);
  const go = (name) => { setActive(name); setMenuOpen(false); };

  return <div className="app">
    <div className={`scrim ${menuOpen ? 'show' : ''}`} onClick={() => setMenuOpen(false)} />
    <aside className={`sidebar ${menuOpen ? 'open' : ''}`}>
      <button className="closeMenu" onClick={() => setMenuOpen(false)} aria-label="Close menu"><X size={20}/></button>
      <div className="brand"><div className="logo" aria-label="SKRTZ logo"><svg viewBox="0 0 64 64" role="img"><path d="M12 44 L24 32 L34 38 L52 18"/><path d="M52 18 V32 M52 18 H38"/><rect x="17" y="18" width="5" height="30" rx="2"/><rect x="30" y="24" width="5" height="24" rx="2"/><rect x="43" y="13" width="5" height="35" rx="2"/></svg></div><div><b>SKRTZ</b><span>Trading Journal</span></div><BadgeCheck size={16}/></div>
      <nav>{nav.map(([name, Icon]) => <button key={name} className={active===name?'active':''} onClick={()=>go(name)}><Icon size={18}/>{name}</button>)}</nav>
      <div className="plan"><ShieldCheck/> <div><b>SKRTZ Method</b><span>Rules. Risk. Discipline.</span></div></div>
    </aside>
    <main>
      <header>
        <button className="menuButton" onClick={() => setMenuOpen(true)} aria-label="Open menu"><Menu size={22}/></button>
        <div className="pageTitle"><h1>{active}</h1><p>Track your trades. Master your discipline.</p></div>
        <button className="primary addDesktop" onClick={()=>go('Trades')}><Plus size={18}/> Add Trade</button>
      </header>
      {active === 'Dashboard' && <Dashboard {...pageProps}/>} 
      {active === 'Trades' && <Trades {...pageProps}/>} 
      {active === 'Analytics' && <Analytics {...pageProps}/>} 
      {active === 'Calendar' && <CalendarPage trades={trades} stats={stats}/>} 
      {active === 'AI Coach' && <Coach trades={trades} stats={stats}/>} 
      {active === 'Goals' && <Goals stats={stats}/>} 
      {active === 'Settings' && <SettingsPage trades={trades} setTrades={setTrades}/>} 
    </main>
    <button className="fab" onClick={() => go('Trades')} aria-label="Add trade"><Plus size={24}/></button>
    <nav className="bottomNav" aria-label="Mobile navigation">{nav.slice(0,5).map(([name, Icon]) => <button key={name} className={active===name?'active':''} onClick={()=>go(name)}><Icon size={19}/><span>{name === 'Dashboard' ? 'Home' : name.replace('AI Coach','Coach')}</span></button>)}</nav>
  </div>
}

function Stat({label, value, sub, icon}) { return <div className="card stat"><span>{label}</span><strong>{value}</strong><small>{icon} {sub}</small></div> }

function getAnalyticsRange(filter, customRange) {
  const today = new Date();
  const end = endOfDay(today);
  if (filter === 'Today') return { start: startOfDay(today), end, label: 'Today' };
  if (filter === 'Last Week') return { start: startOfDay(subDays(today, 6)), end, label: 'Last 7 days' };
  if (filter === 'Last Month') return { start: startOfDay(subMonths(today, 1)), end, label: 'Last 30 days' };
  if (filter === 'Custom') {
    const start = customRange.start ? startOfDay(parseISO(customRange.start)) : null;
    const customEnd = customRange.end ? endOfDay(parseISO(customRange.end)) : null;
    return { start, end: customEnd, label: start && customEnd ? `${format(start, 'MMM d')} - ${format(customEnd, 'MMM d')}` : 'Custom range' };
  }
  return { start: null, end: null, label: 'All time' };
}

function AnalyticsFilter({ filter, setFilter, customRange, setCustomRange, count, total, rangeLabel }) {
  const filters = ['Today', 'Last Week', 'Last Month', 'All time', 'Custom'];
  return <div className="analyticsFilter card">
    <div>
      <h3>Analytics Range</h3>
      <p>{rangeLabel} · {count} trades · <b className={total >= 0 ? 'green' : 'red'}>{money(total)}</b></p>
    </div>
    <div className="filterPills" role="tablist" aria-label="Analytics date range">
      {filters.map(item => <button key={item} type="button" className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}</button>)}
    </div>
    {filter === 'Custom' && <div className="customRange">
      <label>From<input type="date" value={customRange.start} onChange={e => setCustomRange(prev => ({ ...prev, start: e.target.value }))}/></label>
      <label>To<input type="date" value={customRange.end} onChange={e => setCustomRange(prev => ({ ...prev, end: e.target.value }))}/></label>
    </div>}
  </div>
}


function SessionTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  const value = Number(payload[0].value || 0);
  return <div className="chartTooltip">
    <b>{label}</b>
    <span className={value >= 0 ? 'green' : 'red'}>{money(value)}</span>
    <small>{value >= 0 ? 'Profitable session' : 'Needs review'}</small>
  </div>
}

function Dashboard({ stats, equity, grouped }) {
  const sessionData = grouped('session').map((item, index) => ({
    ...item,
    fill: item.pnl >= 0 ? `url(#sessionWin${index})` : `url(#sessionLoss${index})`,
  }));

  return <>
    <section className="statsScroller"><div className="grid stats">
      <Stat label="Total PnL" value={money(stats.total)} sub="portfolio performance" icon="↗" />
      <Stat label="Win Rate" value={pct(stats.winRate)} sub={`${stats.wins}W / ${stats.losses}L`} icon="✓" />
      <Stat label="Profit Factor" value={stats.profitFactor.toFixed(2)} sub="expectancy metric" icon="◆" />
      <Stat label="RR Mediu" value={stats.avgRR.toFixed(2)} sub="risk/reward" icon="⚡" />
      <Stat label="Trades" value={stats.count} sub="logged trades" icon="＋" />
    </div></section>
    <section className="grid dash">
      <div className="card big"><h3>Equity Curve</h3><ResponsiveContainer height={280}><AreaChart data={equity}><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2f7bff" stopOpacity={0.7}/><stop offset="95%" stopColor="#2f7bff" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="date"/><YAxis/><Tooltip/><Area type="monotone" dataKey="equity" stroke="#38bdf8" fill="url(#g)" strokeWidth={3}/></AreaChart></ResponsiveContainer></div>
      <div className="card sessionCard">
        <div className="chartHeader">
          <div>
            <h3>Performance by Session</h3>
            <p>Which market window prints best for you.</p>
          </div>
          <span className="livePill">Live edge</span>
        </div>
        <ResponsiveContainer height={300}>
          <BarChart data={sessionData} margin={{ top: 18, right: 8, left: -12, bottom: 0 }}>
            <defs>
              {sessionData.map((item, index) => <linearGradient key={`g-${item.name}`} id={item.pnl >= 0 ? `sessionWin${index}` : `sessionLoss${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={item.pnl >= 0 ? '#34f5c5' : '#ff4d7d'} stopOpacity={1}/>
                <stop offset="58%" stopColor={item.pnl >= 0 ? '#2f7bff' : '#8b1dff'} stopOpacity={0.92}/>
                <stop offset="100%" stopColor={item.pnl >= 0 ? '#15295f' : '#3a1025'} stopOpacity={0.82}/>
              </linearGradient>)}
            </defs>
            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 13, fontWeight: 700 }} />
            <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={44} />
            <Tooltip cursor={{ fill: 'rgba(56,189,248,.08)' }} content={<SessionTooltip />} />
            <Bar dataKey="pnl" radius={[16,16,16,16]} barSize={48}>
              {sessionData.map((entry, index) => <Cell key={`cell-${entry.name}`} fill={entry.fill} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
        <div className="sessionLegend">
          {sessionData.map(item => <span key={item.name}><i className={item.pnl >= 0 ? 'winDot' : 'lossDot'} />{item.name}: <b className={item.pnl >= 0 ? 'green' : 'red'}>{money(item.pnl)}</b></span>)}
        </div>
      </div>
      <div className="card score"><Flame/><h3>Win/Loss Streak</h3><strong>{stats.wins} Wins</strong><p>Best streak grows when rules are respected.</p></div>
      <div className="card score"><ShieldCheck/><h3>Discipline Score</h3><strong>{stats.discipline}/100</strong><p>{stats.discipline > 80 ? 'Elite consistency.' : 'Focus on patience and A+ setups.'}</p></div>
    </section>
  </>
}

function calculateTradeValues(data) {
  const rr = data.entry && data.sl && data.tp ? Math.abs((Number(data.tp)-Number(data.entry))/(Number(data.entry)-Number(data.sl))) : Number(data.rr || 0);
  const signed = data.direction === 'Long' ? 1 : -1;
  const raw = data.entry && data.tp ? (Number(data.tp)-Number(data.entry)) * signed : 0;
  const pnl = data.pnl !== undefined && data.pnl !== '' ? Number(data.pnl) : Math.round(raw * 100 * Number(data.lot || 1));
  return { rr: Number((rr || 0).toFixed(2)), pnl };
}

function DetailItem({ label, value, tone }) {
  return <div className="detailItem"><span>{label}</span><b className={tone || ''}>{value || '-'}</b></div>
}

function TradeDetailsModal({ trade, onClose, onEdit }) {
  useEffect(() => {
    if (trade) requestAnimationFrame(() => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }, [trade]);
  if (!trade) return null;
  const resultTone = Number(trade.pnl) >= 0 ? 'green' : 'red';
  return <div className="modalBackdrop" onClick={onClose}>
    <div className="tradeModal" onClick={e => e.stopPropagation()}>
      <div className="modalTop">
        <button className="ghostBtn" type="button" onClick={onClose}><ArrowLeft size={18}/> Back</button>
        <button className="primary smallBtn" type="button" onClick={() => onEdit(trade)}><Pencil size={16}/> Edit</button>
      </div>
      <div className="tradeHero">
        <div>
          <span className="tradeBadge">{trade.direction}</span>
          <h2>{trade.symbol}</h2>
          <p>{trade.date} · {trade.session} · {trade.setup}</p>
        </div>
        <strong className={resultTone}>{money(Number(trade.pnl || 0))}</strong>
      </div>
      <div className="detailGrid">
        <DetailItem label="Entry" value={trade.entry} />
        <DetailItem label="Stop Loss" value={trade.sl} tone="red" />
        <DetailItem label="Take Profit" value={trade.tp} tone="green" />
        <DetailItem label="Risk" value={`${trade.risk || 0}%`} />
        <DetailItem label="Lot Size" value={trade.lot} />
        <DetailItem label="RR" value={`${Number(trade.rr || 0).toFixed(2)}R`} />
        <DetailItem label="Emotion" value={trade.emotion} />
        <DetailItem label="Confidence" value={`${trade.confidence || 0}/10`} />
      </div>
      <div className="tradeNotes">
        <span>Notes</span>
        <p>{trade.notes || 'No notes added for this trade.'}</p>
      </div>
    </div>
  </div>
}

function EditTradeModal({ trade, setTrade, onSave, onClose }) {
  if (!trade) return null;
  const fields = [['symbol','Symbol'], ['entry','Entry'], ['sl','SL'], ['tp','TP'], ['risk','Risk %'], ['lot','Lot Size'], ['pnl','PnL override']];
  return <div className="modalBackdrop" onClick={onClose}>
    <form className="tradeModal editModal" onClick={e => e.stopPropagation()} onSubmit={onSave}>
      <div className="modalTop"><button className="ghostBtn" type="button" onClick={onClose}><ArrowLeft size={18}/> Cancel</button><button className="primary smallBtn" type="submit"><Save size={16}/> Save</button></div>
      <h2>Edit Trade</h2>
      <div className="formgrid">
        <label>Date<input type="date" value={trade.date} onChange={e=>setTrade({...trade,date:e.target.value})}/></label>
        <label>Direction<select value={trade.direction} onChange={e=>setTrade({...trade,direction:e.target.value})}><option>Long</option><option>Short</option></select></label>
        <label>Session<select value={trade.session} onChange={e=>setTrade({...trade,session:e.target.value})}><option>London</option><option>NY</option><option>Asia</option></select></label>
        <label>Emotion<select value={trade.emotion} onChange={e=>setTrade({...trade,emotion:e.target.value})}><option>Calm</option><option>Confident</option><option>FOMO</option><option>Greedy</option><option>Fear</option></select></label>
        <label>Setup<select value={trade.setup} onChange={e=>setTrade({...trade,setup:e.target.value})}><option>Breaker + FVG</option><option>Liquidity Sweep</option><option>Break of Structure</option><option>Trend Continuation</option><option>Reversal</option></select></label>
        {fields.map(([k,l])=><label key={k}>{l}<input value={trade[k] ?? ''} onChange={e=>setTrade({...trade,[k]:e.target.value})}/></label>)}
        <label>Confidence<input type="range" min="1" max="10" value={trade.confidence || 5} onChange={e=>setTrade({...trade,confidence:e.target.value})}/></label>
        <label className="wide">Notes<textarea value={trade.notes || ''} onChange={e=>setTrade({...trade,notes:e.target.value})}/></label>
      </div>
    </form>
  </div>
}

function Trades({ trades, form, setForm, addTrade, setTrades }) {
  const [detailTrade, setDetailTrade] = useState(null);
  const [editTrade, setEditTrade] = useState(null);
  const fields = [['symbol','Symbol'], ['entry','Entry'], ['sl','SL'], ['tp','TP'], ['risk','Risk %'], ['lot','Lot Size'], ['pnl','PnL override']];
  const startEdit = (trade) => { setDetailTrade(null); setEditTrade({ ...trade }); };
  const saveEdit = (e) => {
    e.preventDefault();
    const values = calculateTradeValues(editTrade);
    const updated = { ...editTrade, ...values };
    setTrades(trades.map(t => t.id === updated.id ? updated : t));
    setEditTrade(null);
  };

  return <section className="grid tradesPage">
    <form className="card form" onSubmit={addTrade}><h3>New Trade</h3>
      <div className="formgrid"><label>Date<input type="date" value={form.date} onChange={e=>setForm({...form,date:e.target.value})}/></label>
      <label>Direction<select value={form.direction} onChange={e=>setForm({...form,direction:e.target.value})}><option>Long</option><option>Short</option></select></label>
      <label>Session<select value={form.session} onChange={e=>setForm({...form,session:e.target.value})}><option>London</option><option>NY</option><option>Asia</option></select></label>
      <label>Emotion<select value={form.emotion} onChange={e=>setForm({...form,emotion:e.target.value})}><option>Calm</option><option>Confident</option><option>FOMO</option><option>Greedy</option><option>Fear</option></select></label>
      <label>Setup<select value={form.setup} onChange={e=>setForm({...form,setup:e.target.value})}><option>Breaker + FVG</option><option>Liquidity Sweep</option><option>Break of Structure</option><option>Trend Continuation</option><option>Reversal</option></select></label>
      {fields.map(([k,l])=><label key={k}>{l}<input value={form[k] || ''} onChange={e=>setForm({...form,[k]:e.target.value})}/></label>)}
      <label>Confidence<input type="range" min="1" max="10" value={form.confidence} onChange={e=>setForm({...form,confidence:e.target.value})}/></label>
      <label className="wide">Notes<textarea value={form.notes} onChange={e=>setForm({...form,notes:e.target.value})}/></label></div>
      <button className="primary full">Save Trade</button>
    </form>
    <div className="card table"><div className="sectionHead"><h3>Trade History</h3><span>{trades.length} trades</span></div>{trades.map(t=><div className="tradeRow enhancedTradeRow" key={t.id}>
      <div className="tradeMain" onClick={()=>setDetailTrade(t)}><b>{t.symbol}</b><span>{t.date} · {t.session} · {t.setup}</span></div>
      <span className={t.pnl>=0?'green':'red'}>{money(t.pnl)}</span>
      <div className="tradeActions">
        <button className="iconAction viewAction iconOnly" type="button" onClick={()=>setDetailTrade(t)} title="View details" aria-label="View trade details"><Eye size={17}/></button>
        <button className="iconAction editAction iconOnly" type="button" onClick={()=>startEdit(t)} title="Edit trade" aria-label="Edit trade"><Pencil size={17}/></button>
        <button className="iconAction deleteAction" type="button" onClick={()=>setTrades(trades.filter(x=>x.id!==t.id))} title="Delete trade"><Trash2 size={16}/></button>
      </div>
    </div>)}</div>
    <TradeDetailsModal trade={detailTrade} onClose={() => setDetailTrade(null)} onEdit={startEdit} />
    <EditTradeModal trade={editTrade} setTrade={setEditTrade} onSave={saveEdit} onClose={() => setEditTrade(null)} />
  </section>
}

function EmotionTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const item = payload[0].payload;
  return <div className="chartTooltip">
    <b>{item.name}</b>
    <span>{item.trades} trades</span>
    <small>{item.pnl >= 0 ? 'Positive emotion profile' : 'Review these entries'}</small>
  </div>
}


function EmotionDonut({ data, total }) {
  const size = 240;
  const center = size / 2;
  const radius = 74;
  const stroke = 30;
  const circumference = 2 * Math.PI * radius;
  const gap = data.length > 1 ? 7 : 0;
  let offset = 0;

  if (!data.length || !total) {
    return <div className="emotionDonutBox emptyDonut">
      <svg className="emotionDonut" viewBox={`0 0 ${size} ${size}`} aria-label="No emotion data">
        <circle cx={center} cy={center} r={radius} fill="none" stroke="rgba(148,163,184,.12)" strokeWidth={stroke} />
      </svg>
      <div className="emotionCenter"><strong>0</strong><span>trades</span></div>
    </div>
  }

  return <div className="emotionDonutBox">
    <svg className="emotionDonut" viewBox={`0 0 ${size} ${size}`} aria-label="Emotion analysis chart">
      <defs>
        <filter id="svgEmotionGlow" x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
        </filter>
      </defs>
      <circle className="emotionTrack" cx={center} cy={center} r={radius} fill="none" strokeWidth={stroke} />
      {data.map(item => {
        const rawLength = (item.trades / total) * circumference;
        const length = Math.max(0, rawLength - gap);
        const dashOffset = -offset;
        offset += rawLength;
        return <circle
          key={item.name}
          className="emotionArc"
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke={item.fill}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={`${length} ${circumference - length}`}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${center} ${center})`}
          filter="url(#svgEmotionGlow)"
        />
      })}
    </svg>
    <div className="emotionCenter"><strong>{total}</strong><span>trades</span></div>
  </div>
}

function Analytics({ trades }) {
  const [filter, setFilter] = useState('All time');
  const [customRange, setCustomRange] = useState({ start: '', end: '' });
  const range = getAnalyticsRange(filter, customRange);
  const filteredTrades = useMemo(() => {
    if (!range.start && !range.end) return trades;
    if (!range.start || !range.end) return [];
    return trades.filter(trade => {
      try {
        return isWithinInterval(parseISO(trade.date), { start: range.start, end: range.end });
      } catch {
        return false;
      }
    });
  }, [trades, range.start?.getTime(), range.end?.getTime()]);

  const filteredTotal = filteredTrades.reduce((sum, trade) => sum + Number(trade.pnl || 0), 0);
  const filteredGrouped = (key) => Object.values(filteredTrades.reduce((a,t)=>{ const k=t[key] || 'Other'; a[k] ||= { name:k, pnl:0, trades:0 }; a[k].pnl += Number(t.pnl||0); a[k].trades++; return a;},{}));
  const setupData = filteredGrouped('setup').map((item, index) => ({
    ...item,
    fill: item.pnl >= 0 ? `url(#setupWin${index})` : `url(#setupLoss${index})`,
  }));
  const emotionPalette = ['#34f5c5', '#38bdf8', '#8b5cf6', '#ff4d7d', '#f7c948', '#22d3ee'];
  const emotionData = filteredGrouped('emotion').map((item, index) => ({
    ...item,
    fill: emotionPalette[index % emotionPalette.length],
  }));
  const totalEmotionTrades = emotionData.reduce((sum, item) => sum + item.trades, 0);

  return <section className="grid analytics">
    <AnalyticsFilter filter={filter} setFilter={setFilter} customRange={customRange} setCustomRange={setCustomRange} count={filteredTrades.length} total={filteredTotal} rangeLabel={range.label} />
    {!filteredTrades.length && <div className="card emptyAnalytics"><h3>No trades in this range</h3><p>Try All time or select another custom range.</p></div>}

    <div className="card sessionCard setupCard">
      <div className="chartHeader">
        <div>
          <h3>Best Setups</h3>
          <p>Same visual edge map as your session performance.</p>
        </div>
        <span className="livePill">Setup edge</span>
      </div>
      <ResponsiveContainer height={300}>
        <BarChart data={setupData} margin={{ top: 18, right: 12, left: -12, bottom: 8 }}>
          <defs>
            {setupData.map((item, index) => <linearGradient key={`setup-g-${item.name}`} id={item.pnl >= 0 ? `setupWin${index}` : `setupLoss${index}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={item.pnl >= 0 ? '#34f5c5' : '#ff4d7d'} stopOpacity={1}/>
              <stop offset="58%" stopColor={item.pnl >= 0 ? '#2f7bff' : '#8b1dff'} stopOpacity={0.92}/>
              <stop offset="100%" stopColor={item.pnl >= 0 ? '#15295f' : '#3a1025'} stopOpacity={0.82}/>
            </linearGradient>)}
          </defs>
          <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 800 }} interval={0} angle={-14} textAnchor="end" height={54} />
          <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 12 }} width={44} />
          <Tooltip cursor={{ fill: 'rgba(56,189,248,.08)' }} content={<SessionTooltip />} />
          <Bar dataKey="pnl" radius={[16,16,16,16]} barSize={42}>
            {setupData.map((entry) => <Cell key={`setup-cell-${entry.name}`} fill={entry.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      <div className="sessionLegend setupLegend">
        {setupData.map(item => <span key={item.name}><i className={item.pnl >= 0 ? 'winDot' : 'lossDot'} />{item.name}: <b className={item.pnl >= 0 ? 'green' : 'red'}>{money(item.pnl)}</b></span>)}
      </div>
    </div>

    <div className="card emotionCard">
      <div className="chartHeader">
        <div>
          <h3>Emotion Analysis</h3>
          <p>Clean mindset split for the selected range.</p>
        </div>
        <span className="livePill">Mindset</span>
      </div>
      <div className="emotionWrap">
        <EmotionDonut data={emotionData} total={totalEmotionTrades} />
      </div>
      <div className="emotionLegend">
        {emotionData.map(item => <span key={item.name}><i style={{background:item.fill, boxShadow:`0 0 14px ${item.fill}`}} />{item.name}<b>{item.trades}</b></span>)}
      </div>
    </div>

    <div className="card"><h3>Session Edge</h3>{filteredGrouped('session').map(x=><div className="metric" key={x.name}><span>{x.name}</span><b className={x.pnl>=0?'green':'red'}>{money(x.pnl)}</b></div>)}</div>
  </section>
}

function CalendarPage({ trades, stats }) {
  const days = eachDayOfInterval({ start: startOfMonth(new Date(2026,4,1)), end: endOfMonth(new Date(2026,4,1)) });
  const pnlByDate = Object.fromEntries(trades.map(t=>[t.date, (trades.filter(x=>x.date===t.date).reduce((a,x)=>a+Number(x.pnl||0),0))]));
  return <div className="card calendar"><h3>May 2026 Calendar Heatmap</h3><div className="calendarGrid">{['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><b key={d}>{d}</b>)}{Array(getDay(days[0])).fill(0).map((_,i)=><span key={'e'+i}/>)}{days.map(d=>{ const key=format(d,'yyyy-MM-dd'); const pnl=pnlByDate[key]||0; return <div className={`day ${pnl>0?'win':pnl<0?'loss':''}`} key={key}><span>{format(d,'d')}</span><strong>{pnl?money(pnl):''}</strong></div>})}</div><div className="summary">Total {money(stats.total)} · Win Rate {pct(stats.winRate)}</div></div>
}

function Coach({ trades, stats }) {
  const bad = trades.filter(t=>['FOMO','Greedy','Fear'].includes(t.emotion));
  return <section className="grid coach"><div className="card ai"><Sparkles/><h2>AI Trading Coach</h2><p>Your edge: {stats.winRate > 60 ? 'good execution and positive expectancy.' : 'needs more selectivity.'}</p></div><div className="card"><h3>Today’s Insight</h3><p>{bad.length ? `You had ${bad.length} emotionally risky trades. Reduce FOMO/greed entries and trade only confirmed setups.` : 'Great emotional control. Keep following your checklist.'}</p></div><div className="card"><h3>Things to Improve</h3><ul><li>Avoid trading after 2 losses.</li><li>Do not move SL too early.</li><li>Focus on London/NY high quality setups.</li></ul></div></section>
}
function Goals({ stats }) { return <div className="card goals"><h3>Prop Firm Ready</h3><div className="progress"><span style={{width:`${Math.min(stats.discipline,100)}%`}}/></div><p>Discipline: {stats.discipline}/100 · Target: minimum 80.</p></div> }
function SettingsPage({ trades, setTrades }) {
  const defaults = { accountSize: 10000, currency: 'USD', riskPerTrade: 1, maxDailyLoss: 3, maxTradesDay: 3, mainPair: 'XAUUSD', mainSession: 'London', journalMode: 'Strict', theme: 'Dark' };
  const [settings, setSettings] = useState(() => JSON.parse(localStorage.getItem('skrtzSettings') || 'null') || defaults);

  useEffect(() => {
    localStorage.setItem('skrtzSettings', JSON.stringify(settings));
    document.documentElement.setAttribute('data-theme', (settings.theme || 'Dark').toLowerCase());
  }, [settings]);

  const update = (key, value) => setSettings(prev => ({ ...prev, [key]: value }));
  const reset = () => setSettings(defaults);
  const riskValue = ((Number(settings.accountSize || 0) * Number(settings.riskPerTrade || 0)) / 100).toFixed(2);
  const dailyStop = ((Number(settings.accountSize || 0) * Number(settings.maxDailyLoss || 0)) / 100).toFixed(2);

  const exportJournal = () => {
    const backup = { app: 'SKRTZ Trading Journal', exportedAt: new Date().toISOString(), settings, trades };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `skrtz-journal-backup-${format(new Date(), 'yyyy-MM-dd')}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const importJournal = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result || '{}'));
        const importedTrades = Array.isArray(parsed) ? parsed : parsed.trades;
        if (!Array.isArray(importedTrades)) throw new Error('Invalid backup');
        setTrades(importedTrades);
        if (parsed.settings) setSettings(prev => ({ ...prev, ...parsed.settings }));
      } catch {
        alert('Backup file is not valid.');
      }
    };
    reader.readAsText(file);
    event.target.value = '';
  };

  const clearJournal = () => {
    if (confirm('Delete all trades from this device?')) setTrades([]);
  };

  const restoreDemo = () => {
    if (confirm('Restore the starter demo trades?')) setTrades(starterTrades);
  };

  return <section className="grid settingsGrid">
    <div className="card form"><h3>Account & Risk Settings</h3>
      <div className="formgrid">
        <label>Account Size<input type="number" value={settings.accountSize} onChange={e=>update('accountSize', e.target.value)}/></label>
        <label>Currency<select value={settings.currency} onChange={e=>update('currency', e.target.value)}><option>USD</option><option>EUR</option><option>GBP</option><option>RON</option></select></label>
        <label>Risk Per Trade %<input type="number" step="0.1" value={settings.riskPerTrade} onChange={e=>update('riskPerTrade', e.target.value)}/></label>
        <label>Max Daily Loss %<input type="number" step="0.1" value={settings.maxDailyLoss} onChange={e=>update('maxDailyLoss', e.target.value)}/></label>
        <label>Max Trades / Day<input type="number" value={settings.maxTradesDay} onChange={e=>update('maxTradesDay', e.target.value)}/></label>
        <label>Journal Mode<select value={settings.journalMode} onChange={e=>update('journalMode', e.target.value)}><option>Strict</option><option>Balanced</option><option>Review Only</option></select></label>
      </div>
    </div>
    <div className="card form"><h3>Trading Preferences</h3>
      <div className="formgrid">
        <label>Main Pair<input value={settings.mainPair} onChange={e=>update('mainPair', e.target.value.toUpperCase())}/></label>
        <label>Main Session<select value={settings.mainSession} onChange={e=>update('mainSession', e.target.value)}><option>London</option><option>NY</option><option>Asia</option></select></label>
        <label>Theme<select value={settings.theme} onChange={e=>update('theme', e.target.value)}><option>Dark</option><option>Midnight</option><option>Clean</option></select></label>
      </div>
      <div className="settingsPreview">
        <p><WalletCards size={16}/> Risk value: <b>{settings.currency} {riskValue}</b> per trade.</p>
        <p><Percent size={16}/> Daily stop: <b>{settings.currency} {dailyStop}</b>.</p>
        <p><Moon size={16}/> Saved locally on this device.</p>
      </div>
      <button className="primary full" type="button" onClick={reset}>Reset Settings</button>
    </div>
    <div className="card dataTools">
      <div className="toolsHead"><DatabaseZap size={20}/><div><h3>Journal Data</h3><p>Backup, import or reset your trades.</p></div></div>
      <div className="toolsStats">
        <span><b>{trades.length}</b><small>Trades saved</small></span>
        <span><b>{settings.currency} {riskValue}</b><small>Risk / trade</small></span>
      </div>
      <div className="settingsActions">
        <button type="button" className="toolBtn" onClick={exportJournal}><Download size={18}/> Export Backup</button>
        <label className="toolBtn fileBtn"><Upload size={18}/> Import Backup<input type="file" accept="application/json,.json" onChange={importJournal}/></label>
        <button type="button" className="toolBtn" onClick={restoreDemo}><RotateCcw size={18}/> Restore Demo</button>
        <button type="button" className="toolBtn danger" onClick={clearJournal}><Trash2 size={18}/> Clear Trades</button>
      </div>
    </div>
  </section>
}

createRoot(document.getElementById('root')).render(<App />);
