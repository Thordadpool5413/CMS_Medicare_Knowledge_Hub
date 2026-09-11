import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertTriangle, Bell, Building2, CheckCircle2, CircleDollarSign, Database, Download, FileSpreadsheet, History, LoaderCircle, MapPin, Network, RefreshCw, ShieldCheck } from 'lucide-react';
import { api } from '@appdeploy/client';
import type { AnyRow, Provider, ProviderDetail, User } from './types';
import { buildEvidenceAlignment } from './intelligenceMath';
import { apiError, csvDownload, money, num, pct, statusClass } from './utils';

export default function IntelligenceCenter({ state, stateName, provider, detail, marketSources, user, onSignIn, onOpenProvider }: { state: string; stateName: string; provider: Provider; detail: ProviderDetail | null; marketSources: AnyRow[]; user: User | null; onSignIn: () => void; onOpenProvider: (ccn: string, state?: string) => void }) {
  const [intel, setIntel] = useState<AnyRow | null>(null);
  const [ssvi, setSsvi] = useState<AnyRow | null>(null);
  const [hcris, setHcris] = useState<AnyRow | null>(null);
  const [geo, setGeo] = useState<AnyRow | null>(null);
  const [white, setWhite] = useState<AnyRow | null>(null);
  const [capabilities, setCapabilities] = useState<AnyRow | null>(null);
  const [history, setHistory] = useState<AnyRow | null>(null);
  const [watched, setWatched] = useState<AnyRow | null>(null);
  const [loading, setLoading] = useState(false);
  const [deepLoading, setDeepLoading] = useState(false);
  const [error, setError] = useState('');
  const seq = useRef(0);
  const ccn = provider.ccn;

  const load = async (force = false) => {
    const id = ++seq.current;
    setLoading(true);
    setError('');
    const suffix = force ? '&force=1' : '';
    const settled = await Promise.allSettled([
      api.get(`/api/intelligence?ccn=${encodeURIComponent(ccn)}&state=${encodeURIComponent(state)}${suffix}`),
      api.get(`/api/ssvi/${encodeURIComponent(ccn)}${force ? '?force=1' : ''}`),
      api.get(`/api/hcris/${encodeURIComponent(ccn)}${force ? '?force=1' : ''}`),
      api.get(`/api/service-geography/${encodeURIComponent(ccn)}${force ? '?force=1' : ''}`),
      api.get(`/api/white-space/${encodeURIComponent(ccn)}?state=${encodeURIComponent(state)}${suffix}`),
      api.get(`/api/capabilities/${encodeURIComponent(ccn)}`),
      api.get(`/api/provider-history/${encodeURIComponent(ccn)}`),
    ]);
    if (id !== seq.current) return;
    const values = settled.map((result) => result.status === 'fulfilled' ? result.value.data : null);
    setIntel(values[0]); setSsvi(values[1]); setHcris(values[2]); setGeo(values[3]); setWhite(values[4]); setCapabilities(values[5]); setHistory(values[6]);
    const failures = settled.filter((result) => result.status === 'rejected');
    if (failures.length) setError(`${failures.length} intelligence source${failures.length === 1 ? '' : 's'} could not be refreshed. Successful evidence remains visible.`);
    if (user) {
      try { const response = await api.get(`/api/watchlist?ccn=${encodeURIComponent(ccn)}`); if (id === seq.current) setWatched(response.data.records?.[0] || null); } catch {}
    } else setWatched(null);
    setLoading(false);
  };

  useEffect(() => { setIntel(null); setSsvi(null); setHcris(null); setGeo(null); setWhite(null); setCapabilities(null); setHistory(null); setWatched(null); void load(); }, [ccn, state, user?.userId]);

  const alignment = useMemo(() => buildEvidenceAlignment(detail, intel, marketSources, ssvi, hcris), [detail, intel, marketSources, ssvi, hcris]);
  const threats = intel?.threats || [];
  const whiteRows = white?.counties || [];
  const ssviReportable = ssvi?.fy2025?.reportable === true && ssvi?.fy2025?.totalScore !== null && ssvi?.fy2025?.totalScore !== undefined;
  const adcHistory = (detail?.history || []).filter((row) => row.adc !== null && row.adc !== undefined).slice(-3);
  const latestAdc = adcHistory.length ? adcHistory[adcHistory.length - 1] : null;
  const growth = adcHistory.length >= 2 && Number(adcHistory[0].adc) > 0 ? (Number(latestAdc?.adc) / Number(adcHistory[0].adc) - 1) * 100 : null;

  const toggleWatch = async () => {
    if (!user) { onSignIn(); return; }
    try {
      if (watched) { await api.delete(`/api/watchlist/${encodeURIComponent(watched.id)}`); setWatched(null); }
      else { const response = await api.post('/api/watchlist', { ccn, state: provider.state || state, label: provider.name }); setWatched(response.data); }
    } catch (requestError) { setError(apiError(requestError, 'Watchlist update failed.')); }
  };

  const deepenHcris = async () => {
    setDeepLoading(true);
    try { const response = await api.get(`/api/hcris/${encodeURIComponent(ccn)}?detail=1`); setHcris(response.data); const caps = await api.get(`/api/capabilities/${encodeURIComponent(ccn)}?deep=1`); setCapabilities(caps.data); }
    catch (requestError) { setError(apiError(requestError, 'Detailed HCRIS extraction failed.')); }
    finally { setDeepLoading(false); }
  };

  const exportCsv = () => csvDownload(`hospice-intelligence-${ccn}.csv`, [
    ['Provider 360', provider.name], ['CCN', ccn], ['State', stateName], ['Evidence coverage', detail?.confidence ?? 'NR'], ['CAHPS summary star', detail?.cahpsSummary?.summaryStar ?? 'NR'], ['Hospice Care Index', detail?.qualitySummary?.hci ?? 'NR'], ['SSVI FY2025', ssvi?.fy2025?.totalScore ?? 'NR'], ['HCRIS fiscal end', hcris?.latest?.fiscalEnd ?? 'NR'], ['Service ZIPs', intel?.serviceArea?.focusZipCount ?? 'NR'], ['County footprint', geo?.counties?.length ?? 'NR'], [], ['Threat', 'CCN', 'Shared ZIPs', 'Threat score', 'Growth'], ...threats.map((row: AnyRow) => [row.name, row.ccn, row.shared, row.threatScore, row.growthPct ?? 'NR']), [], ['White space county', 'FIPS', 'Demand', 'Competitors', 'Score'], ...whiteRows.map((row: AnyRow) => [row.name, row.fips, row.demand, row.competitors, row.whiteSpaceScore]),
  ]);

  return <section className='page'>
    <div className='hero'><div><span className='kicker'>PROVIDER 360 · NATIONAL INTELLIGENCE</span><h2>{provider.name}</h2><p>{provider.city}, {provider.state} · CCN {ccn} · market position, quality, service geography, SSVI, HCRIS, ownership, competition and growth evidence.</p></div><div className='hero-actions'><button onClick={() => void toggleWatch()}><Bell size={15}/>{user ? watched ? 'Watching' : 'Watch provider' : 'Sign in to watch'}</button><button onClick={() => void load(true)} disabled={loading}><RefreshCw className={loading ? 'spin' : ''} size={15}/>Refresh</button><button onClick={exportCsv}><Download size={15}/>Export CSV</button></div></div>
    {error && <div className='alert'><AlertTriangle size={16}/>{error}</div>}

    <div className='evidence-readiness panel'>
      <div className='panel-head'><div><span className='kicker'>EVIDENCE READINESS</span><h3>Missing evidence lowers evidence coverage rather than being silently scored as zero.</h3><p>The platform separates reportable evidence from unavailable or unresolved sources before it makes a recommendation.</p></div><span className={`pill ${statusClass(detail?.dataQuality?.status)}`}>{detail?.confidence ?? 'NR'}% PROVIDER DOMAINS</span></div>
      <div className='readiness-grid'>
        <div><Database size={18}/><span><small>PROVIDER EVIDENCE</small><b>{String(detail?.dataQuality?.status || 'loading').toUpperCase()}</b><p>{detail?.dataQuality?.limitations?.[0] || 'Current joined provider domains are available.'}</p></span></div>
        <div><FileSpreadsheet size={18}/><span><small>SSVI FY2025</small><b>{loading && !ssvi ? 'CHECKING' : ssviReportable ? num(ssvi?.fy2025?.totalScore) : 'NOT REPORTABLE'}</b><p>{ssvi?.fy2025?.reportabilityReason || 'No provider-level FY2025 SSVI total score has been resolved.'}</p></span></div>
        <div><CircleDollarSign size={18}/><span><small>HCRIS OPERATING EVIDENCE</small><b>{hcris?.available ? 'REPORT FOUND' : 'NOT RESOLVED'}</b><p>{hcris?.available ? `${hcris.costReportBasis || 'CMS cost report'} · FY end ${hcris.latest?.fiscalEnd || 'NR'}` : hcris?.caveat || 'No validated freestanding hospice report was resolved.'}</p>{hcris?.available && !hcris?.detail && <button className='text-button' onClick={() => void deepenHcris()} disabled={deepLoading}>{deepLoading ? 'Loading...' : 'Add HCRIS operating evidence'}</button>}</span></div>
      </div>
    </div>

    <div className={`alignment panel ${statusClass(alignment.status)}`}><div className='panel-head'><div><span className='kicker'>SOURCE PERIOD ALIGNMENT</span><h3>{alignment.status}</h3><p>{alignment.explanation}</p></div><span className='pill'>{alignment.confidencePenalty ? `-${alignment.confidencePenalty} CONFIDENCE PTS` : 'NO TIME PENALTY'}</span></div><div className='alignment-grid'>{alignment.sources.map((source) => <div key={source.name}><small>{source.name.toUpperCase()}</small><b>{source.period}</b><span>{source.core ? 'CORE DECISION SOURCE' : 'CONTEXT SOURCE'}</span></div>)}</div></div>

    <div className='metrics six'>
      <Metric label='CAHPS summary star' value={detail?.cahpsSummary?.summaryStar ? `${detail.cahpsSummary.summaryStar}/5` : 'NR'} sub={detail?.periods?.cahpsDate || 'Published period NR'}/>
      <Metric label='Hospice Care Index' value={num(detail?.qualitySummary?.hci, 1)} sub={detail?.periods?.qualityDate || 'Claims-based quality'}/>
      <Metric label='SSVI FY2025' value={ssviReportable ? num(ssvi?.fy2025?.totalScore) : 'NOT REPORTABLE'} sub='Oversight / variation context'/>
      <Metric label='Patient-service ZIPs' value={num(intel?.serviceArea?.focusZipCount)} sub='Observed CMS footprint'/>
      <Metric label='County footprint' value={num(geo?.counties?.length)} sub={geo?.mappingCoveragePct !== undefined ? `${pct(geo.mappingCoveragePct)} ZCTA mapping` : 'Census mapping'}/>
      <Metric label='Recent ADC trend' value={growth === null ? 'INSUFFICIENT HISTORY' : pct(growth)} sub={adcHistory.length ? `${adcHistory[0].year} to ${latestAdc?.year}` : 'PAC history unavailable'}/>
    </div>

    {intel && <div className='grid-2'>
      <div className='panel'><div className='panel-head'><div><span className='kicker'>EXECUTIVE READOUT</span><h3>What matters first</h3></div><ShieldCheck size={18}/></div><div className='insight-list'>
        {threats[0] && <div><b>Competitive collision</b><p>{threats[0].name} is the highest measured collision at {num(threats[0].threatScore)}/100 with {num(threats[0].shared)} shared service ZIPs. This is a prioritization signal, not evidence of misconduct or quality.</p></div>}
        {whiteRows[0] && <div><b>Growth geography</b><p>{whiteRows[0].name} leads the current local-relative White Space screen at {num(whiteRows[0].whiteSpaceScore)}/100. Serviceability and operating capacity still control deployment.</p></div>}
        <div><b>Evidence boundary</b><p>Provider evidence coverage is {detail?.confidence ?? 'NR'}%. Reporting periods remain separate, and missing inputs are not converted to zero.</p></div>
      </div></div>
      <div className='panel'><div className='panel-head'><div><span className='kicker'>CHANGE INTELLIGENCE</span><h3>Stored provider history</h3></div><History size={18}/></div><div className='change-list'>{(history?.changes || []).map((change: AnyRow) => <div key={change.key}><span>{String(change.severity || '').toUpperCase()}</span><b>{change.label}</b><p>{String(change.from)} → {String(change.to)}{change.percentDelta === null || change.percentDelta === undefined ? '' : ` · ${change.percentDelta > 0 ? '+' : ''}${Number(change.percentDelta).toFixed(1)}%`}</p></div>)}{!(history?.changes || []).length && <p className='empty'>{history?.status === 'baseline_created' ? 'Baseline captured. Future snapshots can identify changes.' : 'No material provider changes are currently stored.'}</p>}</div></div>
    </div>}

    <div className='grid-2'>
      <div className='panel'><div className='panel-head'><div><span className='kicker'>THREAT SCORE V3</span><h3>Who actually collides?</h3><p>Service-area collision plus peer Medicare scale and recent growth when reportable.</p></div><MapPin size={18}/></div>{intel?.serviceArea?.candidateSetCapped && <div className='scope-note'><AlertTriangle size={14}/>Deep competitor evaluation is capped at the strongest overlap candidates. The selected provider footprint is still evaluated across all reported ZIPs.</div>}<div className='rank-table'>{threats.slice(0, 12).map((row: AnyRow, index: number) => <button key={row.ccn} onClick={() => onOpenProvider(row.ccn, row.state)}><span className='rank'>{String(index + 1).padStart(2, '0')}</span><span><b>{row.name}</b><small>{num(row.shared)} shared ZIPs · {pct(row.focusCoveragePct)} of focus footprint · {row.competitivePosture || row.threatBand}</small></span><em>{num(row.threatScore)}/100</em></button>)}{!threats.length && <p className='empty'>No deep competitor collision rows were resolved.</p>}</div></div>
      <div className='panel'><div className='panel-head'><div><span className='kicker'>QUALITY BATTLECARD</span><h3>Provider vs state vs U.S.</h3></div><ShieldCheck size={18}/></div><div className='comparison-table'><div className='compare-row header'><span>Measure</span><span>Provider</span><span>{state}</span><span>U.S.</span></div>{(intel?.benchmarks || []).map((row: AnyRow) => <div className='compare-row' key={row.code || row.label}><span><b>{row.label}</b><small>{row.direction}</small></span><span>{row.unit === '%' ? pct(row.provider) : num(row.provider, 1)}</span><span>{row.unit === '%' ? pct(row.state) : num(row.state, 1)}</span><span>{row.unit === '%' ? pct(row.national) : num(row.national, 1)}</span></div>)}</div></div>
    </div>

    <div className='grid-2'>
      <div className='panel'><div className='panel-head'><div><span className='kicker'>HCRIS COST REPORT INTELLIGENCE</span><h3>Provider-reported operating context</h3></div><CircleDollarSign size={18}/></div>{hcris?.available ? <><div className='kpi-grid'><div><span>Latest FY end</span><b>{hcris.latest?.fiscalEnd || 'NR'}</b></div><div><span>Reports found</span><b>{num(hcris.reportCount)}</b></div><div><span>Total revenue</span><b>{money(hcris.detail?.totalRevenue)}</b></div><div><span>Operating expense</span><b>{money(hcris.detail?.totalOperatingExpenses)}</b></div><div><span>Net income / loss</span><b>{money(hcris.detail?.netIncomeLoss)}</b></div><div><span>Evidence coverage</span><b>{hcris.detail?.operatingModel?.evidenceCoveragePct === undefined ? 'LOAD DETAIL' : pct(hcris.detail.operatingModel.evidenceCoveragePct)}</b></div></div>{!hcris.detail && <button className='primary wide' onClick={() => void deepenHcris()} disabled={deepLoading}>{deepLoading ? <LoaderCircle className='spin' size={15}/> : <CircleDollarSign size={15}/>}Load validated operating detail</button>}<p className='guardrail'>HCRIS accounting is not EBITDA, valuation, cash flow, contribution margin or a formal MAC cap settlement.</p></> : <p className='empty'>{hcris?.error || hcris?.caveat || 'No current freestanding HCRIS hospice report was resolved.'}</p>}</div>
      <div className='panel'><div className='panel-head'><div><span className='kicker'>CMS OBSERVED CAPABILITIES</span><h3>What public evidence supports</h3></div><Database size={18}/></div><div className='capability-list'>{(capabilities?.capabilities || []).map((cap: AnyRow) => <div key={cap.id}><span><b>{cap.label}</b><small>{cap.conclusion} · {pct(cap.evidenceCoveragePct)} evidence</small></span><em>{cap.score === null || cap.score === undefined ? 'NR' : `${cap.score}/100`}</em></div>)}{!(capabilities?.capabilities || []).length && <p className='empty'>Capability evidence is still resolving.</p>}</div><p className='guardrail'>Observed capability is not branded-program certification, proof of staff competency or patient-level eligibility.</p></div>
    </div>

    <div className='grid-2'>
      <div className='panel'><div className='panel-head'><div><span className='kicker'>WHITE SPACE 2.2</span><h3>Demand minus local service-area saturation</h3></div><MapPin size={18}/></div><div className='simple-table'><div className='simple-row header'><span>County / equivalent</span><span>Demand</span><span>Competitors</span><span>Score</span></div>{whiteRows.slice(0, 15).map((row: AnyRow) => <div className='simple-row' key={row.fips}><span><b>{row.name}</b><small>{row.fips}</small></span><span>{num(row.demand)}</span><span>{num(row.competitors)}</span><span><strong>{num(row.whiteSpaceScore)}</strong></span></div>)}</div><p className='guardrail'>This is a provider-local prioritization score, not county market share and not nationally comparable.</p></div>
      <div className='panel'><div className='panel-head'><div><span className='kicker'>ENTERPRISE 360</span><h3>PECOS legal and enrollment context</h3></div><Network size={18}/></div><div className='kpi-grid'><div><span>Legal organization</span><b>{intel?.enterprise?.legalName || 'Not matched'}</b></div><div><span>DBA</span><b>{intel?.enterprise?.dba || 'Not reported'}</b></div><div><span>Related enrollments</span><b>{num(intel?.enterprise?.totalRelatedEnrollments ?? intel?.enterprise?.relatedEnrollments?.length)}</b></div><div><span>Additional NPIs</span><b>{num(intel?.enterprise?.additionalNpis?.length)}</b></div></div><div className='entity-list'>{(intel?.enterprise?.relatedEnrollments || []).slice(0, 12).map((row: AnyRow) => <div key={row.enrollmentId}><Building2 size={14}/><span><b>{row.ccn || row.enrollmentId}</b><small>{row.city}, {row.state} {row.zip} · NPI {row.npi || 'NR'}</small></span></div>)}</div></div>
    </div>
  </section>;
}

function Metric({ label, value, sub }: { label: string; value: string; sub: string }) { return <div className='metric'><span>{label}</span><b>{value}</b><small>{sub}</small></div>; }
