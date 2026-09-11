import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, ArrowUpRight, BarChart3, Bell, Building2, CheckCircle2, Database, DollarSign, Globe2, Home, LineChart, LoaderCircle, LockKeyhole, MapPinned, Network, RefreshCw, Scale, Search, ShieldCheck, Stethoscope, Target, Trophy, X, Users } from 'lucide-react';
import { api, auth } from '@appdeploy/client';
import GlobalProviderSearch from './GlobalProviderSearch';
import IntelligenceCenter from './IntelligenceCenter';
import DecisionRoom from './DecisionRoom';
import TerritoryView from './TerritoryView';
import ReferralMarket from './ReferralMarket';
import DataLab from './DataLab';
import type { AnyRow, DashboardData, Provider, ProviderDetail, TabId, User } from './types';
import { solveGrowth } from './intelligenceMath';
import { apiError, clean, money, num, pct, STATES, statusClass, today } from './utils';

const NAV: Array<{ id: TabId; label: string; group: string; icon: typeof Home }> = [
  { id:'decision',label:'Decision Room',group:'DECIDE',icon:Target },{ id:'command',label:'Command Center',group:'DECIDE',icon:Home },
  { id:'intelligence',label:'Intelligence 360',group:'INTELLIGENCE',icon:LineChart },{ id:'hospice',label:'Hospice Explorer',group:'INTELLIGENCE',icon:Building2 },{ id:'compare',label:'Compare',group:'INTELLIGENCE',icon:Scale },
  { id:'growth',label:'Growth Strategy',group:'GROWTH',icon:BarChart3 },{ id:'territory',label:'Territory',group:'GROWTH',icon:MapPinned },
  { id:'referral',label:'Referral Market',group:'ACCOUNTS',icon:Stethoscope },{ id:'winloss',label:'Win / Loss',group:'ACCOUNTS',icon:Trophy },
  { id:'sources',label:'Data Lab',group:'DATA',icon:Database },
];

const parseHash = () => {
  const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
  const tab = params.get('tab') as TabId;
  return { state: (params.get('state') || 'OK').toUpperCase(), ccn: params.get('ccn') || '371653', tab: NAV.some((item) => item.id === tab) ? tab : 'command' as TabId };
};

export default function NationalDashboard() {
  const initial = useMemo(parseHash, []);
  const [data, setData] = useState<DashboardData | null>(null);
  const [detail, setDetail] = useState<ProviderDetail | null>(null);
  const [state, setState] = useState(initial.state);
  const [focus, setFocus] = useState(initial.ccn);
  const [tab, setTab] = useState<TabId>(initial.tab);
  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState('');
  const [user, setUser] = useState<User | null>(null);
  const [authBusy, setAuthBusy] = useState(false);
  const request = useRef({ market: 0, provider: 0 });

  const loadProvider = async (ccn: string, expectedState = state) => {
    if (!ccn) return;
    const id = ++request.current.provider;
    setFocus(ccn); setDetail(null); setDetailLoading(true); setError('');
    try {
      const response = await api.get(`/api/provider/${encodeURIComponent(ccn)}`), next = response.data as ProviderDetail;
      if (next.provider?.ccn !== ccn) throw new Error(`Provider context mismatch: requested ${ccn}, received ${next.provider?.ccn || 'no CCN'}.`);
      if (expectedState && next.provider?.state && String(next.provider.state).toUpperCase() !== expectedState.toUpperCase()) throw new Error(`Provider ${ccn} belongs to ${next.provider.state}, not the requested ${expectedState} market.`);
      if (id === request.current.provider) setDetail(next);
    } catch (requestError) {
      if (id === request.current.provider) setError(`Provider dossier refresh failed: ${apiError(requestError, 'The selected provider could not be loaded.')}`);
    } finally { if (id === request.current.provider) setDetailLoading(false); }
  };

  const loadMarket = async (nextState = state, requestedCcn = '', force = false) => {
    const id = ++request.current.market;
    setLoading(true); setError('');
    try {
      const response = await api.get(`/api/dashboard?state=${encodeURIComponent(nextState)}&ccn=${encodeURIComponent(requestedCcn)}${force ? '&force=1' : ''}`), next = response.data as DashboardData;
      if (id !== request.current.market) return;
      if (String(next.state).toUpperCase() !== nextState.toUpperCase()) throw new Error(`Market context mismatch: requested ${nextState}, received ${next.state || 'no state'}.`);
      if (requestedCcn && next.focusCcn !== requestedCcn) throw new Error(`Provider ${requestedCcn} was not resolved inside the ${nextState} market.`);
      request.current.provider += 1;
      setData(next); setState(next.state); setFocus(next.focusCcn); setDetail(null);
      if (next.focusCcn) await loadProvider(next.focusCcn, next.state);
    } catch (requestError) { if (id === request.current.market) setError(apiError(requestError, 'CMS market refresh is temporarily unavailable.')); }
    finally { if (id === request.current.market) setLoading(false); }
  };

  useEffect(() => {
    void auth.getUser().then((current) => setUser(current as User | null)).catch(() => setUser(null));
    void loadMarket(initial.state, initial.ccn);
  }, []);
  useEffect(() => { const params = new URLSearchParams({ state, ccn: focus, tab }); history.replaceState(null, '', `#${params.toString()}`); }, [state, focus, tab]);

  const signIn = async () => { setAuthBusy(true); setError(''); try { const result = await auth.signIn(); setUser(result.user as User); } catch (authError) { const code = (authError as AnyRow)?.code || ''; setError(code === 'user_cancelled' ? 'Sign in was cancelled.' : apiError(authError, 'Sign in failed.')); } finally { setAuthBusy(false); } };
  const signOut = async () => { setAuthBusy(true); try { await auth.signOut(); setUser(null); } finally { setAuthBusy(false); } };
  const selected = data?.providers.find((provider) => provider.ccn === focus) || detail?.provider || data?.providers[0];
  const navigate = (next: TabId) => setTab(next);

  if (!data || !selected) return <div className='boot'><LoaderCircle className='spin' size={30}/><h2>Building national hospice intelligence...</h2><p>{error || 'Joining current CMS market and provider context.'}</p></div>;

  return <div className='app-shell'>
    <aside className='sidebar'><div className='brand'><span>CMS</span><div><b>Hospice Intelligence</b><small>Decision Platform</small></div></div><nav>{['DECIDE','INTELLIGENCE','GROWTH','ACCOUNTS','DATA'].map((group) => <div key={group} className='nav-group'><span>{group}</span>{NAV.filter((item) => item.group === group).map(({ id, label, icon: Icon }) => <button key={id} className={tab === id ? 'active' : ''} onClick={() => setTab(id)}><Icon size={16}/>{label}</button>)}</div>)}</nav><div className='sidebar-footer'><button onClick={() => void loadMarket(state, focus, true)} disabled={loading}><RefreshCw size={15} className={loading ? 'spin' : ''}/>Refresh market</button><button onClick={() => void loadProvider(focus, state)} disabled={detailLoading}><ArrowUpRight size={15}/>{detailLoading ? 'Loading provider...' : 'Reload provider'}</button><div className='login-card'>{user ? <><LockKeyhole size={14}/><div><b>{user.name || user.email || user.userId}</b><small>{user.scope || 'Signed in'}</small></div><button onClick={() => void signOut()} disabled={authBusy}>Sign out</button></> : <><Bell size={14}/><div><b>Private workspace</b><small>Sign in for watchlist, win/loss and operating truth.</small></div><button onClick={() => void signIn()} disabled={authBusy}>Sign in</button></>}</div></div></aside>
    <main className='main'>
      <header className='topbar'><div className='page-title'><span>NATIONAL HOSPICE EXPERT INTELLIGENCE & DECISION PLATFORM</span><h1>{NAV.find((item) => item.id === tab)?.label}</h1></div><div className='topbar-actions'><button onClick={() => setTab('decision')} className={tab === 'decision' ? 'active' : ''}><ShieldCheck size={15}/>Decision view</button><button onClick={() => setTab('intelligence')} className={tab === 'intelligence' ? 'active' : ''}><LineChart size={15}/>Provider 360</button><button onClick={() => setTab('sources')} className={tab === 'sources' ? 'active' : ''}><Database size={15}/>Source health</button></div></header>
      <div className='context-bar'><div><span className={`status-dot ${statusClass(data.dataQuality?.status)}`}/><span><small>ACTIVE PROVIDER</small><b>{selected.name}</b><em>{selected.city}, {selected.state} · CCN {selected.ccn}</em></span></div><div><small>MARKET</small><b>{data.stateName}</b></div><div><small>LAST REFRESH</small><b>{today()}</b></div></div>
      <div className='mobile-nav'><select value={tab} onChange={(event) => setTab(event.target.value as TabId)}>{NAV.map((item) => <option key={item.id} value={item.id}>{item.group} · {item.label}</option>)}</select></div>
      {error && <div className='alert global-alert'><AlertTriangle size={17}/><span>{error}</span><button onClick={() => setError('')}><X size={14}/></button></div>}
      {data.warnings?.length > 0 && <div className='warning-strip'><AlertTriangle size={15}/><span><b>Source issue:</b> {data.warnings.join(' · ')} Successful evidence remains available.</span></div>}
      {tab === 'command' && <CommandPage data={data} provider={selected} detail={detail} onNavigate={navigate} onProvider={(ccn, providerState) => { void loadProvider(ccn, providerState || state); }}/>} 
      {tab === 'decision' && <DecisionRoom state={state} stateName={data.stateName} market={data} provider={selected} detail={detail} user={user} onSignIn={() => void signIn()} onNavigate={navigate}/>} 
      {tab === 'intelligence' && <IntelligenceCenter state={state} stateName={data.stateName} provider={selected} detail={detail} marketSources={data.sources} user={user} onSignIn={() => void signIn()} onOpenProvider={(ccn) => void loadProvider(ccn, state)}/>} 
      {tab === 'hospice' && <HospiceExplorer data={data} focus={focus} onProvider={(ccn) => void loadProvider(ccn, state)}/>} 
      {tab === 'compare' && <ComparePage data={data} focus={focus}/>} 
      {tab === 'network' && <OwnershipPage provider={selected} detail={detail}/>} 
      {tab === 'watchlist' && <WatchlistPage user={user} current={selected} onSignIn={() => void signIn()} onOpen={(ccn, providerState) => { setTab('intelligence'); if (providerState && providerState !== state) { void loadMarket(providerState, ccn); return; } void loadProvider(ccn, providerState || state); }}/>} 
      {tab === 'growth' && <GrowthPage data={data} provider={selected}/>} 
      {tab === 'territory' && <TerritoryView state={state} stateName={data.stateName} market={data} provider={selected} user={user} onSignIn={() => void signIn()}/>} 
      {tab === 'referral' && <ReferralMarket state={state} stateName={data.stateName} market={data}/>} 
      {tab === 'winloss' && <WinLossPage user={user} provider={selected} counties={data.counties} onSignIn={() => void signIn()}/>} 
      {tab === 'sources' && <DataLab state={state} provider={selected} providerStatus={String(detail?.dataQuality?.status || 'limited')}/>} 
    </main>
  </div>;
}

function CommandPage({ data, provider, detail, onNavigate, onProvider }: { data: DashboardData; provider: Provider; detail: ProviderDetail | null; onNavigate: (tab: TabId) => void; onProvider: (ccn: string, providerState?: string) => void }) { return <section className='page'><div className='hero'><div><span className='kicker'>FOCUS PROVIDER · {data.stateName.toUpperCase()}</span><h2>{provider.name}</h2><p>{provider.city}, {provider.state} · CCN {provider.ccn}</p></div></div></section>; }
function HospiceExplorer({ data, focus, onProvider }: { data: DashboardData; focus: string; onProvider: (ccn: string) => void }) { return <section className='page'><div className='hero'><div><span className='kicker'>{data.stateName.toUpperCase()} CMS-CERTIFIED MARKET</span><h2>Hospice Explorer</h2><p>State provider census and search.</p></div></div></section>; }
function GrowthPage({ data, provider }: { data: DashboardData; provider: Provider }) { return <section className='page'><div className='hero'><div><span className='kicker'>90-DAY GROWTH STRATEGY</span><h2>Turn a census target into admissions and referral requirements.</h2></div></div></section>; }
function ComparePage({ data, focus }: { data: DashboardData; focus: string }) { return <section className='page'><div className='hero'><div><span className='kicker'>HEAD-TO-HEAD INTELLIGENCE</span><h2>Compare up to three hospices nationally.</h2></div></div></section>; }
function OwnershipPage({ provider, detail }: { provider: Provider; detail: ProviderDetail | null }) { return <section className='page'><div className='hero'><div><span className='kicker'>OWNERSHIP / PECOS CONTEXT</span><h2>{provider.name}</h2></div></div></section>; }
function WatchlistPage({ user, current, onSignIn, onOpen }: { user: User | null; current: Provider; onSignIn: () => void; onOpen: (ccn: string, state: string) => void }) { return <section className='page'><div className='hero'><div><span className='kicker'>PRIVATE WATCHLIST</span><h2>Provider change intelligence</h2></div></div></section>; }
function WinLossPage({ user, provider, counties, onSignIn }: { user: User | null; provider: Provider; counties: AnyRow[]; onSignIn: () => void }) { return <section className='page'><div className='hero'><div><span className='kicker'>PRIVATE FIELD INTELLIGENCE · {provider.name}</span><h2>Win / Loss</h2></div></div></section>; }
function Metric({ icon: Icon, label, value, sub }: { icon: typeof Users; label: string; value: string; sub: string }) { return <div className='metric'><Icon size={17}/><span>{label}</span><b>{value}</b><small>{sub}</small></div>; }
function Launch({ icon: Icon, label, note, onClick }: { icon: typeof Home; label: string; note: string; onClick: () => void }) { return <button className='launch-card' onClick={onClick}><Icon size={20}/><b>{label}</b><p>{note}</p></button>; }
