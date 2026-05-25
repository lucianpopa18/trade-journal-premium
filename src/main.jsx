import React, { useMemo, useState, useEffect } from 'react';
import { createRoot } from 'react-dom/client';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Plus, Crown, LayoutDashboard, BarChart3, CalendarDays, Brain, Target, Settings, NotebookTabs, Flame, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay } from 'date-fns';
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
  const [trades, setTrades] = useState(() => JSON.parse(localStorage.getItem('premiumTrades') || 'null') || starterTrades);
  const [form, setForm] = useState({ date: format(new Date(), 'yyyy-MM-dd'), symbol: 'XAUUSD', direction: 'Long', session: 'London', entry: '', sl: '', tp: '', risk: 1, lot: '', emotion: 'Calm', setup: 'Breaker + FVG', confidence: 8, notes: '' });

  useEffect(() => localStorage.setItem('premiumTrades', JSON.stringify(trades)), [trades]);

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

  return <div className="app">
    <aside className="sidebar">
      <div className="brand"><div className="logo">T</div><div><b>TRADER</b><span>JOURNAL</span></div><Crown size={16}/></div>
      <nav>{nav.map(([name, Icon]) => <button key={name} className={active===name?'active':''} onClick={()=>setActive(name)}><Icon size={18}/>{name}</button>)}</nav>
      <div className="plan"><Crown/> <div><b>Premium</b><span>Elite Plan Feeling</span></div></div>
    </aside>
    <main>
      <header><div><h1>{active}</h1><p>Discipline is your edge. Track, learn, execute.</p></div><button className="primary" onClick={()=>setActive('Trades')}><Plus size={18}/> Add Trade</button></header>
      {active === 'Dashboard' && <Dashboard {...pageProps}/>} 
      {active === 'Trades' && <Trades {...pageProps}/>} 
      {active === 'Analytics' && <Analytics {...pageProps}/>} 
      {active === 'Calendar' && <CalendarPage trades={trades} stats={stats}/>} 
      {active === 'AI Coach' && <Coach trades={trades} stats={stats}/>} 
      {active === 'Goals' && <Goals stats={stats}/>} 
      {active === 'Settings' && <SettingsPage/>} 
    </main>
  </div>
}

function Stat({label, value, sub, icon}) { return <div className="card stat"><span>{label}</span><strong>{value}</strong><small>{icon} {sub}</small></div> }

function Dashboard({ stats, equity, grouped }) {
  return <>
    <section className="grid stats">
      <Stat label="Total PnL" value={money(stats.total)} sub="portfolio performance" icon="↗" />
      <Stat label="Win Rate" value={pct(stats.winRate)} sub={`${stats.wins}W / ${stats.losses}L`} icon="✓" />
      <Stat label="Profit Factor" value={stats.profitFactor.toFixed(2)} sub="premium metric" icon="◆" />
      <Stat label="RR Mediu" value={stats.avgRR.toFixed(2)} sub="risk/reward" icon="⚡" />
      <Stat label="Trades" value={stats.count} sub="logged trades" icon="＋" />
    </section>
    <section className="grid dash">
      <div className="card big"><h3>Equity Curve</h3><ResponsiveContainer height={280}><AreaChart data={equity}><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#2f7bff" stopOpacity={0.7}/><stop offset="95%" stopColor="#2f7bff" stopOpacity={0}/></linearGradient></defs><XAxis dataKey="date"/><YAxis/><Tooltip/><Area type="monotone" dataKey="equity" stroke="#38bdf8" fill="url(#g)" strokeWidth={3}/></AreaChart></ResponsiveContainer></div>
      <div className="card"><h3>Performance by Session</h3><ResponsiveContainer height={280}><BarChart data={grouped('session')}><XAxis dataKey="name"/><YAxis/><Tooltip/><Bar dataKey="pnl" radius={[10,10,0,0]}/></BarChart></ResponsiveContainer></div>
      <div className="card score"><Flame/><h3>Win/Loss Streak</h3><strong>{stats.wins} Wins</strong><p>Best streak grows when rules are respected.</p></div>
      <div className="card score"><ShieldCheck/><h3>Discipline Score</h3><strong>{stats.discipline}/100</strong><p>{stats.discipline > 80 ? 'Elite consistency.' : 'Focus on patience and A+ setups.'}</p></div>
    </section>
  </>
}

function Trades({ trades, form, setForm, addTrade, setTrades }) {
  const fields = [['symbol','Symbol'], ['entry','Entry'], ['sl','SL'], ['tp','TP'], ['risk','Risk %'], ['lot','Lot Size'], ['pnl','PnL override']];
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
    <div className="card table"><h3>Trade History</h3>{trades.map(t=><div className="tradeRow" key={t.id}><div><b>{t.symbol}</b><span>{t.date} · {t.session} · {t.setup}</span></div><span className={t.pnl>=0?'green':'red'}>{money(t.pnl)}</span><button onClick={()=>setTrades(trades.filter(x=>x.id!==t.id))}><Trash2 size={16}/></button></div>)}</div>
  </section>
}

function Analytics({ grouped }) {
  return <section className="grid analytics"><div className="card"><h3>Best Setups</h3><ResponsiveContainer height={280}><BarChart data={grouped('setup')}><XAxis dataKey="name" hide/><YAxis/><Tooltip/><Bar dataKey="pnl" radius={[10,10,0,0]}/></BarChart></ResponsiveContainer></div><div className="card"><h3>Emotion Analysis</h3><ResponsiveContainer height={280}><PieChart><Pie data={grouped('emotion')} dataKey="trades" nameKey="name" outerRadius={95} label>{grouped('emotion').map((_,i)=><Cell key={i}/>)}</Pie><Tooltip/></PieChart></ResponsiveContainer></div><div className="card"><h3>Session Edge</h3>{grouped('session').map(x=><div className="metric" key={x.name}><span>{x.name}</span><b className={x.pnl>=0?'green':'red'}>{money(x.pnl)}</b></div>)}</div></section>
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
function SettingsPage() { return <div className="card"><h3>Settings</h3><p>This MVP uses localStorage. Next upgrades: Supabase login, cloud sync, image uploads, Stripe paid plan, OpenAI real coach, CSV export.</p></div> }

createRoot(document.getElementById('root')).render(<App />);
