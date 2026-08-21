'use client';

import { useState, useEffect, useCallback } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────
interface AuditPlan {
  id: number; plan_number: string; title: string; department: string;
  auditor_name: string; audit_date: string; standard: string;
  section_filter: string; status: string; notes: string;
  created_at: string; updated_at: string;
  counts?: { total: number; major_nc: number; minor_nc: number; observation: number; ofi: number; conforming: number };
}
interface AuditFinding {
  id: number; plan_id: number; clause_no: string; clause_title: string;
  finding_type: string; finding_notes: string; evidence: string;
  capa_ref: string; status: string; created_at: string;
}
interface AuditClause {
  id: number; clause_no: string; clause_title: string; standard: string;
  section: string; section_no: string; simple_meaning: string;
  procedures: string; documents_required: string; applicable_process: string;
  audit_questions: string; original_requirement: string;
}
interface FindingSummary {
  major_nc: number; minor_nc: number; observation: number; ofi: number;
  open_count: number; total: number;
}

type FindingType = 'Conforming' | 'Observation' | 'OFI' | 'MinorNC' | 'MajorNC' | 'NA';

const FINDING_TYPES: { value: FindingType; label: string; color: string }[] = [
  { value: 'Conforming', label: 'C', color: 'bg-green-600' },
  { value: 'Observation', label: 'OBS', color: 'bg-yellow-500' },
  { value: 'OFI', label: 'OFI', color: 'bg-blue-500' },
  { value: 'MinorNC', label: 'Minor NC', color: 'bg-orange-500' },
  { value: 'MajorNC', label: 'Major NC', color: 'bg-red-600' },
  { value: 'NA', label: 'N/A', color: 'bg-gray-400' },
];

const SECTIONS = ['All','4 — Context','5 — Leadership','6 — Planning','7 — Support','8 — Operations','9 — Performance','10 — Improvement'];
const STANDARDS = ['Both','ISO','IATF'];
const DEPARTMENTS = ['QA','Production','Engineering','Maintenance','HR','Purchase','Stores','Customer Quality','Supplier Quality','Planning','EHS','Finance','IT','Top Management'];
const STATUS_COLORS: Record<string,string> = {
  Planned:'bg-blue-100 text-blue-700', 'In Progress':'bg-yellow-100 text-yellow-700',
  Completed:'bg-green-100 text-green-700', Closed:'bg-gray-100 text-gray-600',
};

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function InternalAuditPage() {
  const [tab, setTab] = useState<'dashboard'|'plans'|'conduct'|'findings'|'library'>('dashboard');
  const [plans, setPlans]         = useState<AuditPlan[]>([]);
  const [findings, setFindings]   = useState<AuditFinding[]>([]);
  const [findingSummary, setFindingSummary] = useState<FindingSummary|null>(null);
  const [clauses, setClauses]     = useState<AuditClause[]>([]);
  const [clauseTotal, setClauseTotal] = useState(0);
  const [seeded, setSeeded]       = useState(false);
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState('');

  // Conduct audit state
  const [conductPlanId, setConductPlanId]   = useState<number|null>(null);
  const [conductClauses, setConductClauses] = useState<AuditClause[]>([]);
  const [auditResults, setAuditResults]     = useState<Record<number, { type: FindingType; notes: string; evidence: string }>>({});
  const [saving, setSaving]                 = useState(false);
  const [conductFilter, setConductFilter]   = useState('All');
  const [processFilter, setProcessFilter]   = useState('All');
  const [expandedClauses, setExpandedClauses] = useState<Record<number, boolean>>({});
  const [selectedClauseId, setSelectedClauseId] = useState<number|null>(null);
  const [kanbanFilter, setKanbanFilter]         = useState<FindingType|'Unrated'|null>(null);

  const toggleExpand = (id: number) =>
    setExpandedClauses(prev => ({ ...prev, [id]: !prev[id] }));

  // Plans form
  const [showPlanForm, setShowPlanForm] = useState(false);
  const [planForm, setPlanForm] = useState({ title:'', department:'QA', auditor_name:'', audit_date:'', standard:'Both', notes:'' });

  // Library state
  const [libSearch, setLibSearch]   = useState('');
  const [libStandard, setLibStandard] = useState('Both');
  const [libSection, setLibSection]  = useState('All');
  const [selectedClause, setSelectedClause] = useState<AuditClause|null>(null);

  // Findings filter
  const [findPlanFilter, setFindPlanFilter] = useState<number|null>(null);

  // ── API helpers ─────────────────────────────────────────────────────────────
  const loadPlans = useCallback(async () => {
    const r = await fetch('/api/audit/plans');
    const d = await r.json();
    setPlans(d.plans ?? []);
  }, []);

  const loadFindings = useCallback(async () => {
    const url = findPlanFilter ? `/api/audit/findings?plan_id=${findPlanFilter}` : '/api/audit/findings';
    const r = await fetch(url);
    const d = await r.json();
    setFindings(d.findings ?? []);
    setFindingSummary(d.summary ?? null);
  }, [findPlanFilter]);

  const loadClauses = useCallback(async () => {
    let url = '/api/audit/clauses?limit=200';
    if (libStandard !== 'Both') url += `&standard=${libStandard}`;
    const sec = libSection.replace(/\s*—.*$/,'').trim();
    if (libSection !== 'All') url += `&section=${encodeURIComponent(sec)}`;
    if (libSearch) url += `&q=${encodeURIComponent(libSearch)}`;
    const r = await fetch(url);
    const d = await r.json();
    setClauses(d.clauses ?? []);
    setClauseTotal(d.total ?? 0);
  }, [libStandard, libSection, libSearch]);

  const loadConductClauses = useCallback(async () => {
    const r = await fetch('/api/audit/clauses?limit=200');
    const d = await r.json();
    setConductClauses(d.clauses ?? []);
  }, []);

  const seedClauses = async () => {
    setLoading(true);
    const r = await fetch('/api/audit/seed', { method: 'POST' });
    const d = await r.json();
    setMsg(d.message || d.error || '');
    setSeeded(true);
    await loadClauses();
    setLoading(false);
  };

  useEffect(() => { loadPlans(); }, [loadPlans]);
  useEffect(() => { if (tab==='findings') loadFindings(); }, [tab, loadFindings]);
  useEffect(() => { if (tab==='library') loadClauses(); }, [tab, loadClauses]);
  useEffect(() => { if (tab==='library') loadClauses(); }, [libSearch, libStandard, libSection, loadClauses]);
  useEffect(() => { if (tab==='conduct' && conductPlanId) loadConductClauses(); }, [tab, conductPlanId, loadConductClauses]);

  // Auto-select plan department as processFilter whenever plan changes
  useEffect(() => {
    if (conductPlanId && plans.length > 0) {
      const plan = plans.find(p => p.id === conductPlanId);
      if (plan?.department) setProcessFilter(plan.department);
    }
  }, [conductPlanId, plans]);

  // Check if clauses seeded
  useEffect(() => {
    fetch('/api/audit/clauses?limit=1').then(r=>r.json()).then(d=>{
      if ((d.total ?? 0) > 0) setSeeded(true);
    });
  }, []);

  // ── Create plan ─────────────────────────────────────────────────────────────
  const createPlan = async () => {
    if (!planForm.title || !planForm.department) return;
    await fetch('/api/audit/plans', {
      method: 'POST',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify(planForm),
    });
    setShowPlanForm(false);
    setPlanForm({ title:'', department:'QA', auditor_name:'', audit_date:'', standard:'Both', notes:'' });
    await loadPlans();
  };

  // ── Save audit results ───────────────────────────────────────────────────────
  const saveAuditResults = async () => {
    if (!conductPlanId) return;
    setSaving(true);
    const toSave = Object.entries(auditResults).filter(([,v])=> v.type !== 'Conforming' && v.type !== 'NA');
    for (const [clauseId, result] of toSave) {
      const clause = conductClauses.find(c=>c.id===Number(clauseId));
      if (!clause) continue;
      await fetch('/api/audit/findings', {
        method: 'POST',
        headers: { 'Content-Type':'application/json' },
        body: JSON.stringify({
          plan_id: conductPlanId, clause_id: Number(clauseId),
          clause_no: clause.clause_no, clause_title: clause.clause_title,
          finding_type: result.type, finding_notes: result.notes, evidence: result.evidence,
        }),
      });
    }
    // Mark plan In Progress
    await fetch(`/api/audit/plans/${conductPlanId}`, {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ status: 'In Progress' }),
    });
    await loadPlans();
    setSaving(false);
    setMsg(`Saved ${toSave.length} findings for audit plan.`);
    setTimeout(()=>setMsg(''), 4000);
  };

  const completePlan = async (id: number) => {
    await fetch(`/api/audit/plans/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type':'application/json' },
      body: JSON.stringify({ status: 'Completed' }),
    });
    await loadPlans();
  };

  const deletePlan = async (id: number) => {
    if (!confirm('Delete this audit plan and all its findings?')) return;
    await fetch(`/api/audit/plans/${id}`, { method: 'DELETE' });
    await loadPlans();
  };

  // ── Dashboard stats ──────────────────────────────────────────────────────────
  const totalMajorNC  = plans.reduce((a,p)=>a+(p.counts?.major_nc||0),0);
  const totalMinorNC  = plans.reduce((a,p)=>a+(p.counts?.minor_nc||0),0);
  const totalOBS      = plans.reduce((a,p)=>a+(p.counts?.observation||0),0);
  const openPlans     = plans.filter(p=>p.status==='Planned'||p.status==='In Progress').length;
  const completedPlans= plans.filter(p=>p.status==='Completed'||p.status==='Closed').length;

  // ── Conduct: filtered clauses (by process + section) ────────────────────────
  const filteredConductClauses = conductClauses.filter(c => {
    const secMatch = conductFilter === 'All' || c.section_no === conductFilter;
    const noProcessData = !c.applicable_process?.trim();
    const procMatch = processFilter === 'All' ||
      noProcessData || // clauses with no process assignment → visible to all
      c.applicable_process.toLowerCase().split('\n').some(p =>
        p.trim().toLowerCase().includes(processFilter.toLowerCase())
      );
    return secMatch && procMatch;
  });

  // Unique processes from all loaded clauses (for selector chips) — always include standard depts
  const allProcesses = Array.from(new Set([
    ...DEPARTMENTS,
    ...conductClauses.flatMap(c =>
      c.applicable_process.split('\n').map(p => p.trim()).filter(Boolean)
    )
  ])).sort();

  // Derived: apply kanban filter on top of process+section filter
  const displayedClauses = kanbanFilter === null
    ? filteredConductClauses
    : kanbanFilter === 'Unrated'
      ? filteredConductClauses.filter(c => !auditResults[c.id])
      : filteredConductClauses.filter(c => auditResults[c.id]?.type === kanbanFilter);

  const conductSelectedClause = conductClauses.find(c => c.id === selectedClauseId) ?? null;

  // Kanban counts
  const kCounts = {
    Unrated:     filteredConductClauses.filter(c=>!auditResults[c.id]).length,
    Conforming:  filteredConductClauses.filter(c=>auditResults[c.id]?.type==='Conforming').length,
    Observation: filteredConductClauses.filter(c=>auditResults[c.id]?.type==='Observation').length,
    OFI:         filteredConductClauses.filter(c=>auditResults[c.id]?.type==='OFI').length,
    MinorNC:     filteredConductClauses.filter(c=>auditResults[c.id]?.type==='MinorNC').length,
    MajorNC:     filteredConductClauses.filter(c=>auditResults[c.id]?.type==='MajorNC').length,
  };
  const ratedCount = filteredConductClauses.filter(c=>!!auditResults[c.id]).length;
  const progressPct = filteredConductClauses.length ? (ratedCount/filteredConductClauses.length)*100 : 0;

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#eff6ff] p-4">
      {/* Header */}
      <div className="mb-4">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-[#1d4ed8] flex items-center justify-center text-white">
            <i className="ti ti-checklist text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-[#1e3a5f]">IATF Internal Audit</h1>
            <p className="text-xs text-gray-500">IATF 16949 + ISO 9001 — System, Process & Product Audits</p>
          </div>
          {!seeded && (
            <button onClick={seedClauses} disabled={loading}
              className="ml-auto px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700 flex items-center gap-1">
              <i className="ti ti-database-import" />
              {loading ? 'Seeding…' : 'Load 128 Clauses'}
            </button>
          )}
          {seeded && (
            <div className="ml-auto flex items-center gap-2">
              <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-medium">✓ {clauseTotal||128} Clauses Loaded</span>
              <button onClick={async()=>{
                setLoading(true);
                await fetch('/api/audit/seed',{method:'DELETE'});
                const r = await fetch('/api/audit/seed',{method:'POST'});
                const d = await r.json();
                setMsg(d.message||d.error||'');
                await loadClauses();
                setLoading(false);
              }} disabled={loading}
                className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full font-medium hover:bg-amber-100 hover:text-amber-700 border border-gray-200">
                {loading?'…':'↺ Re-seed'}
              </button>
              <button onClick={async()=>{
                setLoading(true);
                const r = await fetch('/api/audit/fix-questions',{method:'POST'});
                const d = await r.json();
                setMsg(d.message||d.error||'');
                await loadClauses();
                setLoading(false);
              }} disabled={loading}
                className="text-xs bg-blue-600 text-white px-2 py-1 rounded-full font-medium hover:bg-blue-700 border border-blue-600">
                {loading?'…':'✎ Fix Questions'}
              </button>
            </div>
          )}
        </div>
        {msg && <div className="mt-2 text-xs bg-blue-50 border border-blue-200 text-blue-700 px-3 py-2 rounded-lg">{msg}</div>}
      </div>

      {/* Tabs */}
      <div className="flex gap-1 mb-4 bg-white rounded-xl p-1 shadow-sm border border-blue-100">
        {([
          { key:'dashboard', icon:'ti-layout-dashboard', label:'Dashboard' },
          { key:'plans',     icon:'ti-calendar',         label:'Audit Plans' },
          { key:'conduct',   icon:'ti-clipboard-check',  label:'Conduct Audit' },
          { key:'findings',  icon:'ti-alert-triangle',   label:'Findings' },
          { key:'library',   icon:'ti-books',             label:'Clause Library' },
        ] as { key: typeof tab; icon: string; label: string }[]).map(t=>(
          <button key={t.key} onClick={()=>setTab(t.key)}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs font-semibold rounded-lg transition-all ${
              tab===t.key ? 'bg-[#1d4ed8] text-white shadow' : 'text-gray-500 hover:bg-blue-50'
            }`}>
            <i className={`ti ${t.icon}`} />
            <span className="hidden sm:inline">{t.label}</span>
          </button>
        ))}
      </div>

      {/* ── TAB: DASHBOARD ─────────────────────────────────────────────────── */}
      {tab === 'dashboard' && (
        <div className="space-y-4">
          {/* KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
            {[
              { label:'Open Plans',     value:openPlans,     color:'bg-blue-600',   icon:'ti-calendar' },
              { label:'Completed',      value:completedPlans,color:'bg-green-600',  icon:'ti-circle-check' },
              { label:'Major NC',       value:totalMajorNC,  color:'bg-red-600',    icon:'ti-alert-octagon' },
              { label:'Minor NC',       value:totalMinorNC,  color:'bg-orange-500', icon:'ti-alert-triangle' },
              { label:'Observations',   value:totalOBS,      color:'bg-yellow-500', icon:'ti-eye' },
            ].map(k=>(
              <div key={k.label} className="bg-white rounded-xl p-4 shadow-sm border border-blue-100 flex items-center gap-3">
                <div className={`w-10 h-10 ${k.color} rounded-lg flex items-center justify-center text-white flex-shrink-0`}>
                  <i className={`ti ${k.icon} text-lg`} />
                </div>
                <div>
                  <div className="text-2xl font-bold text-[#1e3a5f]">{k.value}</div>
                  <div className="text-xs text-gray-500">{k.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Recent Plans Table */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-blue-50">
              <h2 className="font-semibold text-[#1e3a5f] text-sm">Recent Audit Plans</h2>
              <button onClick={()=>{ setTab('plans'); setShowPlanForm(true); }}
                className="text-xs bg-[#1d4ed8] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700">
                + New Plan
              </button>
            </div>
            {plans.length === 0 ? (
              <div className="py-10 text-center text-gray-400 text-sm">
                <i className="ti ti-clipboard-list text-3xl mb-2 block" />
                No audit plans yet. Create your first plan.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>{['Plan #','Title','Dept','Date','Auditor','Standard','Status','Major','Minor','OBS'].map(h=>(
                      <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {plans.slice(0,10).map(p=>(
                      <tr key={p.id} className="hover:bg-blue-50 cursor-pointer" onClick={()=>{ setConductPlanId(p.id); setTab('conduct'); }}>
                        <td className="px-3 py-2 font-mono font-semibold text-[#1d4ed8]">{p.plan_number}</td>
                        <td className="px-3 py-2 font-medium text-gray-800">{p.title}</td>
                        <td className="px-3 py-2 text-gray-600">{p.department}</td>
                        <td className="px-3 py-2 text-gray-600">{p.audit_date || '—'}</td>
                        <td className="px-3 py-2 text-gray-600">{p.auditor_name || '—'}</td>
                        <td className="px-3 py-2"><span className="px-1.5 py-0.5 bg-blue-50 text-blue-600 rounded font-medium">{p.standard}</span></td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${STATUS_COLORS[p.status]||'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                        </td>
                        <td className="px-3 py-2 text-center font-bold text-red-600">{p.counts?.major_nc||0}</td>
                        <td className="px-3 py-2 text-center font-bold text-orange-500">{p.counts?.minor_nc||0}</td>
                        <td className="px-3 py-2 text-center font-bold text-yellow-600">{p.counts?.observation||0}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Audit Type Guide */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-4">
            <h2 className="font-semibold text-[#1e3a5f] text-sm mb-3">IATF Audit Types Required</h2>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                { title:'System Audit', icon:'ti-building', color:'bg-blue-600', desc:'All 128 IATF/ISO clauses reviewed against QMS documentation and records. Min. once/year.', standard:'IATF 9.2.2.2' },
                { title:'Process Audit', icon:'ti-settings', color:'bg-green-600', desc:'Each manufacturing process audited against PFMEA, Control Plan, WI. Min. once/year per process.', standard:'IATF 9.2.2.3' },
                { title:'Product Audit', icon:'ti-package', color:'bg-purple-600', desc:'Finished product verified against customer drawings and specifications.', standard:'IATF 9.2.2.4' },
              ].map(t=>(
                <div key={t.title} className="border border-gray-100 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-7 h-7 ${t.color} rounded-lg flex items-center justify-center text-white`}>
                      <i className={`ti ${t.icon} text-sm`} />
                    </div>
                    <div>
                      <div className="font-semibold text-gray-800 text-xs">{t.title}</div>
                      <div className="text-xs text-blue-600">{t.standard}</div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">{t.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── TAB: AUDIT PLANS ────────────────────────────────────────────── */}
      {tab === 'plans' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[#1e3a5f]">Audit Plans ({plans.length})</h2>
            <button onClick={()=>setShowPlanForm(!showPlanForm)}
              className="text-xs bg-[#1d4ed8] text-white px-3 py-2 rounded-lg font-semibold hover:bg-blue-700 flex items-center gap-1">
              <i className="ti ti-plus" /> New Audit Plan
            </button>
          </div>

          {/* Create Form */}
          {showPlanForm && (
            <div className="bg-white rounded-xl shadow-sm border border-blue-200 p-4">
              <h3 className="font-semibold text-[#1e3a5f] text-sm mb-3">Create Audit Plan</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Audit Title *</label>
                  <input value={planForm.title} onChange={e=>setPlanForm({...planForm,title:e.target.value})}
                    placeholder="e.g. QA Department System Audit Q3 2026"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Department *</label>
                  <select value={planForm.department} onChange={e=>setPlanForm({...planForm,department:e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none">
                    {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Auditor Name</label>
                  <input value={planForm.auditor_name} onChange={e=>setPlanForm({...planForm,auditor_name:e.target.value})}
                    placeholder="Lead auditor name"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Audit Date</label>
                  <input type="date" value={planForm.audit_date} onChange={e=>setPlanForm({...planForm,audit_date:e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none" />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Standard Scope</label>
                  <select value={planForm.standard} onChange={e=>setPlanForm({...planForm,standard:e.target.value})}
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none">
                    {STANDARDS.map(s=><option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">Notes</label>
                  <input value={planForm.notes} onChange={e=>setPlanForm({...planForm,notes:e.target.value})}
                    placeholder="Optional notes"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none" />
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <button onClick={createPlan}
                  className="px-4 py-2 bg-[#1d4ed8] text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
                  Create Plan
                </button>
                <button onClick={()=>setShowPlanForm(false)}
                  className="px-4 py-2 bg-gray-100 text-gray-600 text-xs font-semibold rounded-lg hover:bg-gray-200">
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Plans List */}
          {plans.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center text-gray-400">
              <i className="ti ti-clipboard-list text-4xl mb-2 block" />
              <p className="text-sm">No audit plans yet. Create your first plan above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {plans.map(p=>(
                <div key={p.id} className="bg-white rounded-xl shadow-sm border border-blue-100 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-mono text-xs font-bold text-[#1d4ed8] bg-blue-50 px-2 py-0.5 rounded">{p.plan_number}</span>
                        <span className={`text-xs px-2 py-0.5 rounded font-medium ${STATUS_COLORS[p.status]||'bg-gray-100 text-gray-600'}`}>{p.status}</span>
                        <span className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded font-medium">{p.standard}</span>
                      </div>
                      <div className="mt-1 font-semibold text-[#1e3a5f] text-sm">{p.title}</div>
                      <div className="mt-0.5 text-xs text-gray-500">
                        {p.department} · {p.auditor_name || 'No auditor'} · {p.audit_date || 'No date'}
                      </div>
                      {/* Finding counts */}
                      <div className="flex gap-2 mt-2 flex-wrap">
                        {[
                          { label:'Major NC', val:p.counts?.major_nc||0, cls:'bg-red-100 text-red-700' },
                          { label:'Minor NC', val:p.counts?.minor_nc||0, cls:'bg-orange-100 text-orange-700' },
                          { label:'OBS',      val:p.counts?.observation||0, cls:'bg-yellow-100 text-yellow-700' },
                          { label:'OFI',      val:p.counts?.ofi||0, cls:'bg-blue-100 text-blue-700' },
                        ].map(b=>(
                          <span key={b.label} className={`text-xs px-2 py-0.5 rounded font-semibold ${b.cls}`}>
                            {b.val} {b.label}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-1 flex-shrink-0">
                      <button onClick={()=>{ setConductPlanId(p.id); setAuditResults({}); setTab('conduct'); }}
                        className="p-2 bg-[#1d4ed8] text-white rounded-lg text-xs hover:bg-blue-700 flex items-center gap-1">
                        <i className="ti ti-clipboard-check" /> Audit
                      </button>
                      {p.status === 'In Progress' && (
                        <button onClick={()=>completePlan(p.id)}
                          className="p-2 bg-green-600 text-white rounded-lg text-xs hover:bg-green-700">
                          <i className="ti ti-check" />
                        </button>
                      )}
                      <button onClick={()=>{ setFindPlanFilter(p.id); setTab('findings'); }}
                        className="p-2 bg-gray-100 text-gray-600 rounded-lg text-xs hover:bg-gray-200">
                        <i className="ti ti-list-details" />
                      </button>
                      <button onClick={()=>deletePlan(p.id)}
                        className="p-2 bg-red-50 text-red-600 rounded-lg text-xs hover:bg-red-100">
                        <i className="ti ti-trash" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CONDUCT AUDIT ──────────────────────────────────────────── */}
      {tab === 'conduct' && (
        <div className="space-y-3">

          {/* Step 1 — Select Plan */}
          <div className="bg-white rounded-xl border border-blue-100 p-4">
            <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Step 1 — Select Audit Plan</div>
            <div className="flex flex-wrap gap-3 items-end">
              <div className="flex-1 min-w-[260px]">
                <select value={conductPlanId||''} onChange={e=>{
                  const id = Number(e.target.value)||null;
                  setConductPlanId(id);
                  setAuditResults({});
                  setExpandedClauses({});
                  // Auto-set process from plan department
                  if (id) {
                    const plan = plans.find(p=>p.id===id);
                    if (plan?.department) setProcessFilter(plan.department);
                  } else {
                    setProcessFilter('All');
                  }
                }}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-300 outline-none">
                  <option value="">— Select audit plan —</option>
                  {plans.map(p=>(
                    <option key={p.id} value={p.id}>{p.plan_number} — {p.title} ({p.department})</option>
                  ))}
                </select>
              </div>
              {conductPlanId && conductClauses.length > 0 && (
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="flex gap-1.5 text-xs">
                    {[
                      { label:'Major NC', val:Object.values(auditResults).filter(r=>r.type==='MajorNC').length,    cls:'bg-red-600' },
                      { label:'Minor NC', val:Object.values(auditResults).filter(r=>r.type==='MinorNC').length,    cls:'bg-orange-500' },
                      { label:'OBS',      val:Object.values(auditResults).filter(r=>r.type==='Observation').length, cls:'bg-yellow-500' },
                      { label:'OK',       val:Object.values(auditResults).filter(r=>r.type==='Conforming').length,  cls:'bg-green-600' },
                    ].map(b=>(
                      <span key={b.label} className={`${b.cls} text-white px-2 py-0.5 rounded font-semibold`}>{b.val} {b.label}</span>
                    ))}
                  </div>
                  <button onClick={saveAuditResults} disabled={saving}
                    className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 flex items-center gap-1.5 shadow">
                    <i className="ti ti-device-floppy" />
                    {saving ? 'Saving…' : 'Save to Findings Register'}
                  </button>
                </div>
              )}
            </div>
          </div>

          {conductPlanId && (
            <>
              {/* Step 2 — Select Process */}
              <div className="bg-white rounded-xl border border-blue-100 p-4">
                <div className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-3">
                  Step 2 — Select Process to Audit
                  {processFilter !== 'All' && (
                    <span className="ml-2 normal-case font-normal text-blue-600">
                      → {filteredConductClauses.length} clauses applicable to <strong>{processFilter}</strong>
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <button onClick={()=>setProcessFilter('All')}
                    className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all ${
                      processFilter==='All'
                        ? 'bg-[#1e3a5f] text-white border-[#1e3a5f]'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-blue-300'
                    }`}>
                    All Processes ({conductClauses.length})
                  </button>
                  {allProcesses.map(proc=>{
                    const count = conductClauses.filter(c =>
                      c.applicable_process.toLowerCase().split('\n').some(p =>
                        p.trim().toLowerCase().includes(proc.toLowerCase())
                      )
                    ).length;
                    return (
                      <button key={proc} onClick={()=>setProcessFilter(proc)}
                        className={`text-xs px-3 py-1.5 rounded-lg font-semibold border transition-all flex items-center gap-1 ${
                          processFilter===proc
                            ? 'bg-[#1d4ed8] text-white border-[#1d4ed8] shadow'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-[#1d4ed8]'
                        }`}>
                        {proc}
                        <span className={`text-xs rounded-full px-1.5 py-0 font-bold ${
                          processFilter===proc ? 'bg-blue-400 text-white' : 'bg-gray-100 text-gray-500'
                        }`}>{count}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ── Not seeded warning ── */}
              {!seeded && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
                  Clause library not loaded. Click &ldquo;↺ Re-seed&rdquo; at the top first.
                </div>
              )}

              {/* ── MIXED UI: Kanban strip + Split panel ── */}
              {seeded && (
                <>
                  {/* Kanban status strip */}
                  <div className="bg-white rounded-xl border border-blue-100 overflow-hidden shadow-sm">
                    <div className="grid grid-cols-6 divide-x divide-gray-100">
                      {([
                        { key:'Unrated',     label:'Not Rated',   count:kCounts.Unrated,     textCls:'text-gray-500',   bgCls:'bg-gray-50',    activeCls:'bg-gray-100'   },
                        { key:'Conforming',  label:'Conforming',  count:kCounts.Conforming,  textCls:'text-green-600',  bgCls:'bg-green-50',   activeCls:'bg-green-100'  },
                        { key:'Observation', label:'Observation', count:kCounts.Observation, textCls:'text-yellow-600', bgCls:'bg-yellow-50',  activeCls:'bg-yellow-100' },
                        { key:'OFI',         label:'OFI',         count:kCounts.OFI,         textCls:'text-blue-600',   bgCls:'bg-blue-50',    activeCls:'bg-blue-100'   },
                        { key:'MinorNC',     label:'Minor NC',    count:kCounts.MinorNC,     textCls:'text-orange-600', bgCls:'bg-orange-50',  activeCls:'bg-orange-100' },
                        { key:'MajorNC',     label:'Major NC',    count:kCounts.MajorNC,     textCls:'text-red-600',    bgCls:'bg-red-50',     activeCls:'bg-red-100'    },
                      ] as { key:string; label:string; count:number; textCls:string; bgCls:string; activeCls:string }[]).map(col=>{
                        const isActive = kanbanFilter === col.key;
                        return (
                          <button key={col.key}
                            onClick={()=>setKanbanFilter(isActive ? null : col.key as FindingType|'Unrated')}
                            className={`py-3 px-1 text-center transition-all border-b-2 ${
                              isActive ? `${col.activeCls} border-current` : `${col.bgCls} border-transparent hover:${col.activeCls}`
                            }`}>
                            <div className={`text-2xl font-bold leading-none ${col.textCls}`}>{col.count}</div>
                            <div className={`text-xs mt-1 font-medium ${col.textCls} opacity-75`}>{col.label}</div>
                          </button>
                        );
                      })}
                    </div>
                    {/* Segmented progress bar */}
                    <div className="h-1.5 flex w-full">
                      {[
                        { type:'Conforming',  color:'#16a34a' },
                        { type:'Observation', color:'#ca8a04' },
                        { type:'OFI',         color:'#1d4ed8' },
                        { type:'MinorNC',     color:'#ea580c' },
                        { type:'MajorNC',     color:'#dc2626' },
                        { type:'NA',          color:'#9ca3af' },
                      ].map(seg=>{
                        const pct = filteredConductClauses.length
                          ? (filteredConductClauses.filter(c=>auditResults[c.id]?.type===seg.type).length / filteredConductClauses.length)*100
                          : 0;
                        return <div key={seg.type} style={{ width:`${pct}%`, background:seg.color, transition:'width 0.3s' }} />;
                      })}
                      <div className="flex-1 bg-gray-100" />
                    </div>
                    {/* Strip footer: filter pill + progress + save */}
                    <div className="flex items-center gap-3 px-3 py-2 bg-gray-50 border-t border-gray-100">
                      <span className="text-xs text-gray-400">{ratedCount}/{filteredConductClauses.length} rated</span>
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div className="h-full bg-[#1d4ed8] rounded-full transition-all" style={{ width:`${progressPct}%` }} />
                      </div>
                      {kanbanFilter && (
                        <button onClick={()=>setKanbanFilter(null)}
                          className="text-xs text-blue-600 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                          <i className="ti ti-x" style={{fontSize:'10px'}} /> Clear filter
                        </button>
                      )}
                      <button onClick={saveAuditResults} disabled={saving}
                        className="px-3 py-1.5 bg-green-600 text-white text-xs font-bold rounded-lg hover:bg-green-700 flex items-center gap-1.5">
                        <i className="ti ti-device-floppy" />
                        {saving ? 'Saving…' : `Save ${Object.values(auditResults).filter(r=>r.type!=='Conforming'&&r.type!=='NA').length} Findings`}
                      </button>
                    </div>
                  </div>

                  {/* Split panel */}
                  <div className="bg-white rounded-xl border border-blue-100 overflow-hidden shadow-sm">
                    {filteredConductClauses.length === 0 ? (
                      <div className="p-8 text-center text-gray-400 text-sm">No clauses for this process/section combination.</div>
                    ) : (
                      <div className="flex" style={{ minHeight:'520px' }}>

                        {/* LEFT — clause list */}
                        <div className="flex flex-col border-r border-gray-100" style={{ width:'270px', flexShrink:0 }}>
                          {/* Section filter bar */}
                          <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-100">
                            {['All','4','5','6','7','8','9','10'].map(s=>(
                              <button key={s} onClick={()=>setConductFilter(s)}
                                className={`text-xs px-2 py-0.5 rounded font-semibold transition-all ${
                                  conductFilter===s
                                    ? 'bg-[#1d4ed8] text-white'
                                    : 'bg-white text-gray-500 border border-gray-200 hover:border-blue-300'
                                }`}>
                                {s==='All'?'All §':`§${s}`}
                              </button>
                            ))}
                          </div>
                          {/* Clause rows */}
                          <div className="overflow-y-auto flex-1">
                            {displayedClauses.length === 0 ? (
                              <div className="p-4 text-center text-xs text-gray-400">No clauses match this filter</div>
                            ) : displayedClauses.map(c=>{
                              const result = auditResults[c.id];
                              const dotColor =
                                result?.type==='MajorNC'    ? 'bg-red-600' :
                                result?.type==='MinorNC'    ? 'bg-orange-500' :
                                result?.type==='Observation'? 'bg-yellow-500' :
                                result?.type==='OFI'        ? 'bg-blue-500' :
                                result?.type==='Conforming' ? 'bg-green-500' :
                                result?.type==='NA'         ? 'bg-gray-300' : 'bg-gray-200';
                              const isSelected = selectedClauseId === c.id;
                              return (
                                <div key={c.id} onClick={()=>setSelectedClauseId(c.id)}
                                  className={`flex items-center gap-2 px-3 py-2.5 border-b border-gray-50 cursor-pointer transition-all ${
                                    isSelected
                                      ? 'bg-[#eff6ff] border-l-2 border-l-[#1d4ed8]'
                                      : 'hover:bg-gray-50 border-l-2 border-l-transparent'
                                  }`}>
                                  <span className={`w-2 h-2 rounded-full flex-shrink-0 ${dotColor}`} />
                                  <span className="text-xs font-mono font-bold text-[#1d4ed8] min-w-[30px]">{c.clause_no}</span>
                                  <span className="text-xs text-gray-700 leading-snug flex-1 min-w-0 truncate">{c.clause_title}</span>
                                  <span className={`text-xs px-1 py-0 rounded font-semibold text-white flex-shrink-0 leading-4 ${
                                    c.standard==='IATF'?'bg-purple-600':'bg-blue-500'
                                  }`}>{c.standard==='IATF'?'I':'S'}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* RIGHT — clause detail */}
                        <div className="flex-1 overflow-y-auto">
                          {!conductSelectedClause ? (
                            <div className="h-full flex flex-col items-center justify-center text-gray-300 gap-3">
                              <i className="ti ti-hand-finger" style={{fontSize:'2.5rem'}} />
                              <p className="text-sm">Select a clause from the list</p>
                            </div>
                          ) : (()=>{
                            const c = conductSelectedClause;
                            const result = auditResults[c.id];
                            const questions = (c.audit_questions||'').split('\n').filter(Boolean);
                            const docs = (c.documents_required||'').split('\n').filter(Boolean);
                            const procs = (c.procedures||'').split('\n').filter(Boolean);
                            const applicableProcs = (c.applicable_process||'').split('\n').filter(Boolean);
                            const ratingBg =
                              result?.type==='MajorNC'    ? 'bg-red-50 border-red-200' :
                              result?.type==='MinorNC'    ? 'bg-orange-50 border-orange-200' :
                              result?.type==='Observation'? 'bg-yellow-50 border-yellow-200' :
                              result?.type==='OFI'        ? 'bg-blue-50 border-blue-200' :
                              result?.type==='Conforming' ? 'bg-green-50 border-green-200' :
                              'bg-white border-transparent';
                            return (
                              <div className={`p-4 flex flex-col gap-4 border-l-4 h-full ${ratingBg} transition-all`}>
                                {/* Header */}
                                <div className="flex items-start gap-3">
                                  <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="text-lg font-bold text-[#1d4ed8]">{c.clause_no}</span>
                                      <span className={`text-xs px-2 py-0.5 rounded font-semibold text-white ${c.standard==='IATF'?'bg-purple-600':'bg-blue-500'}`}>{c.standard}</span>
                                      {result?.type && (
                                        <span className={`text-xs px-2 py-0.5 rounded font-semibold text-white ${
                                          result.type==='MajorNC'    ? 'bg-red-600' :
                                          result.type==='MinorNC'    ? 'bg-orange-500' :
                                          result.type==='Observation'? 'bg-yellow-500' :
                                          result.type==='OFI'        ? 'bg-blue-500' :
                                          result.type==='Conforming' ? 'bg-green-600' : 'bg-gray-400'
                                        }`}>{FINDING_TYPES.find(f=>f.value===result.type)?.label}</span>
                                      )}
                                    </div>
                                    <div className="text-sm font-semibold text-[#1e3a5f]">{c.clause_title}</div>
                                    <div className="text-xs text-gray-500 mt-0.5">{c.simple_meaning}</div>
                                  </div>
                                  {/* Nav buttons */}
                                  <div className="ml-auto flex gap-1">
                                    {(()=>{
                                      const idx = displayedClauses.findIndex(x=>x.id===c.id);
                                      return (
                                        <>
                                          <button onClick={()=>idx>0&&setSelectedClauseId(displayedClauses[idx-1].id)}
                                            disabled={idx<=0}
                                            className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 text-xs">
                                            <i className="ti ti-chevron-up" />
                                          </button>
                                          <button onClick={()=>idx<displayedClauses.length-1&&setSelectedClauseId(displayedClauses[idx+1].id)}
                                            disabled={idx>=displayedClauses.length-1}
                                            className="p-1.5 rounded border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-30 text-xs">
                                            <i className="ti ti-chevron-down" />
                                          </button>
                                        </>
                                      );
                                    })()}
                                  </div>
                                </div>

                                {/* Original IATF requirement */}
                                {c.original_requirement && (
                                  <div className="text-xs italic text-amber-800 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2 leading-relaxed">
                                    <span className="font-semibold not-italic text-amber-700">IATF Requirement: </span>
                                    &ldquo;{c.original_requirement}&rdquo;
                                  </div>
                                )}

                                {/* 3-column: questions | docs | procedures */}
                                <div className="grid gap-3" style={{ gridTemplateColumns:'1fr 1fr 1fr' }}>
                                  {/* Audit Questions */}
                                  <div className="bg-blue-50 rounded-lg p-3">
                                    <div className="text-xs font-semibold text-[#1d4ed8] mb-2 flex items-center gap-1">
                                      <i className="ti ti-question-mark" /> Audit Questions
                                    </div>
                                    {questions.length > 0 ? (
                                      <ol className="space-y-2">
                                        {questions.map((q,i)=>(
                                          <li key={i} className="flex gap-2 text-xs text-gray-700">
                                            <span className="w-4 h-4 rounded-full bg-[#1d4ed8] text-white font-bold flex items-center justify-center flex-shrink-0" style={{fontSize:'9px'}}>{i+1}</span>
                                            <span className="leading-snug">{q.replace(/^\d+\.\s*/,'')}</span>
                                          </li>
                                        ))}
                                      </ol>
                                    ) : <p className="text-xs text-gray-400 italic">No questions defined</p>}
                                  </div>

                                  {/* Documents Required */}
                                  <div className="bg-green-50 rounded-lg p-3">
                                    <div className="text-xs font-semibold text-green-700 mb-2 flex items-center gap-1">
                                      <i className="ti ti-files" /> Documents Required
                                    </div>
                                    {docs.length > 0 ? (
                                      <ul className="space-y-1.5">
                                        {docs.map((d,i)=>(
                                          <li key={i} className="flex gap-1.5 text-xs text-gray-700">
                                            <i className="ti ti-checkbox text-green-500 flex-shrink-0 mt-0.5" />
                                            <span className="leading-snug">{d.replace(/^•\s*/,'')}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : <p className="text-xs text-gray-400 italic">No documents defined</p>}
                                  </div>

                                  {/* Procedures */}
                                  <div className="bg-purple-50 rounded-lg p-3">
                                    <div className="text-xs font-semibold text-purple-700 mb-2 flex items-center gap-1">
                                      <i className="ti ti-book" /> Procedures
                                    </div>
                                    {procs.length > 0 ? (
                                      <ul className="space-y-1.5">
                                        {procs.map((p,i)=>(
                                          <li key={i} className="flex gap-1.5 text-xs text-gray-700">
                                            <span className="text-purple-400 flex-shrink-0">•</span>
                                            <span className="leading-snug">{p.replace(/^•\s*/,'')}</span>
                                          </li>
                                        ))}
                                      </ul>
                                    ) : (
                                      <div className="flex flex-wrap gap-1">
                                        {applicableProcs.map((p,i)=>(
                                          <span key={i} className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-medium">{p.trim()}</span>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                </div>

                                {/* Evidence + Notes */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                      <i className="ti ti-note mr-1" />Finding / Observation Notes
                                    </label>
                                    <textarea
                                      value={result?.notes||''}
                                      onChange={e=>setAuditResults(prev=>({
                                        ...prev,
                                        [c.id]:{ type:prev[c.id]?.type||'Conforming', evidence:prev[c.id]?.evidence||'', notes:e.target.value }
                                      }))}
                                      placeholder="Describe what you observed during the audit…"
                                      rows={3}
                                      className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 w-full resize-none focus:ring-2 focus:ring-blue-200 outline-none bg-white" />
                                  </div>
                                  <div>
                                    <label className="block text-xs font-semibold text-gray-600 mb-1">
                                      <i className="ti ti-paperclip mr-1" />Objective Evidence / Doc Reference
                                    </label>
                                    <textarea
                                      value={result?.evidence||''}
                                      onChange={e=>setAuditResults(prev=>({
                                        ...prev,
                                        [c.id]:{ type:prev[c.id]?.type||'Conforming', notes:prev[c.id]?.notes||'', evidence:e.target.value }
                                      }))}
                                      placeholder="e.g. Control Plan Rev 3 dated Jan 2026, shown and verified…"
                                      rows={3}
                                      className="text-xs border border-gray-200 rounded-lg px-2.5 py-2 w-full resize-none focus:ring-2 focus:ring-green-200 outline-none bg-white" />
                                  </div>
                                </div>

                                {/* Rating buttons */}
                                <div>
                                  <div className="text-xs font-semibold text-gray-600 mb-2">Audit Rating</div>
                                  <div className="flex gap-2 flex-wrap">
                                    {FINDING_TYPES.map(ft=>(
                                      <button key={ft.value}
                                        onClick={()=>setAuditResults(prev=>({
                                          ...prev,
                                          [c.id]:{ type:ft.value, notes:prev[c.id]?.notes||'', evidence:prev[c.id]?.evidence||'' }
                                        }))}
                                        className={`flex-1 min-w-[70px] py-2 rounded-lg text-sm font-bold text-white transition-all ${ft.color} ${
                                          result?.type===ft.value
                                            ? 'ring-2 ring-offset-2 ring-gray-400 scale-105 shadow-md'
                                            : 'opacity-40 hover:opacity-90'
                                        }`}>
                                        {ft.label}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}

      {/* ── TAB: FINDINGS REGISTER ──────────────────────────────────────── */}
      {tab === 'findings' && (
        <div className="space-y-4">
          {/* Summary cards */}
          {findingSummary && (
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {[
                { label:'Major NC',   val:findingSummary.major_nc,   cls:'bg-red-600' },
                { label:'Minor NC',   val:findingSummary.minor_nc,   cls:'bg-orange-500' },
                { label:'Observation',val:findingSummary.observation, cls:'bg-yellow-500' },
                { label:'OFI',        val:findingSummary.ofi,         cls:'bg-blue-500' },
                { label:'Open',       val:findingSummary.open_count,  cls:'bg-purple-600' },
                { label:'Total',      val:findingSummary.total,       cls:'bg-gray-600' },
              ].map(k=>(
                <div key={k.label} className={`${k.cls} text-white rounded-xl p-3 text-center`}>
                  <div className="text-xl font-bold">{k.val}</div>
                  <div className="text-xs opacity-80">{k.label}</div>
                </div>
              ))}
            </div>
          )}

          {/* Filter bar */}
          <div className="flex gap-2 flex-wrap items-center bg-white rounded-xl p-3 border border-blue-100">
            <select value={findPlanFilter||''} onChange={e=>setFindPlanFilter(Number(e.target.value)||null)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-1.5 focus:ring-1 focus:ring-blue-300 outline-none">
              <option value="">All Plans</option>
              {plans.map(p=><option key={p.id} value={p.id}>{p.plan_number} — {p.department}</option>)}
            </select>
            <button onClick={loadFindings}
              className="text-xs bg-[#1d4ed8] text-white px-3 py-1.5 rounded-lg font-semibold hover:bg-blue-700">
              Refresh
            </button>
          </div>

          {findings.length === 0 ? (
            <div className="bg-white rounded-xl p-10 text-center text-gray-400">
              <i className="ti ti-clipboard-x text-4xl mb-2 block" />
              <p className="text-sm">No findings recorded yet. Conduct an audit first.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl shadow-sm border border-blue-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="bg-gray-50">
                    <tr>{['Clause','Title','Type','Finding','Evidence','CAPA','Status','Date'].map(h=>(
                      <th key={h} className="px-3 py-2 text-left font-semibold text-gray-500">{h}</th>
                    ))}</tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {findings.map(f=>(
                      <tr key={f.id} className="hover:bg-blue-50">
                        <td className="px-3 py-2 font-mono font-bold text-[#1d4ed8]">{f.clause_no}</td>
                        <td className="px-3 py-2 font-medium text-gray-800 max-w-[200px] truncate">{f.clause_title}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded font-semibold text-white text-xs ${
                            f.finding_type==='MajorNC'    ?'bg-red-600':
                            f.finding_type==='MinorNC'    ?'bg-orange-500':
                            f.finding_type==='Observation'?'bg-yellow-500':
                            f.finding_type==='OFI'        ?'bg-blue-500':'bg-gray-400'
                          }`}>{f.finding_type}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-600 max-w-[200px] truncate">{f.finding_notes||'—'}</td>
                        <td className="px-3 py-2 text-gray-600 max-w-[150px] truncate">{f.evidence||'—'}</td>
                        <td className="px-3 py-2 text-gray-600">{f.capa_ref||'—'}</td>
                        <td className="px-3 py-2">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                            f.status==='Closed'?'bg-green-100 text-green-700':'bg-red-100 text-red-700'
                          }`}>{f.status}</span>
                        </td>
                        <td className="px-3 py-2 text-gray-400">{f.created_at?.split('T')[0]||''}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── TAB: CLAUSE LIBRARY ─────────────────────────────────────────── */}
      {tab === 'library' && (
        <div className="space-y-4">
          {/* Search + Filters */}
          <div className="bg-white rounded-xl shadow-sm border border-blue-100 p-3 flex flex-wrap gap-2 items-center">
            <div className="relative flex-1 min-w-[180px]">
              <i className="ti ti-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input value={libSearch} onChange={e=>setLibSearch(e.target.value)}
                placeholder="Search clause no, title, or keyword…"
                className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-xs focus:ring-2 focus:ring-blue-300 outline-none" />
            </div>
            <select value={libStandard} onChange={e=>setLibStandard(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-blue-300 outline-none">
              {STANDARDS.map(s=><option key={s}>{s}</option>)}
            </select>
            <select value={libSection} onChange={e=>setLibSection(e.target.value)}
              className="text-xs border border-gray-200 rounded-lg px-2 py-2 focus:ring-1 focus:ring-blue-300 outline-none">
              {SECTIONS.map(s=><option key={s}>{s}</option>)}
            </select>
            <span className="text-xs text-gray-400">{clauses.length} of {clauseTotal} clauses</span>
          </div>

          {!seeded ? (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 text-center">
              <i className="ti ti-database text-3xl text-amber-500 mb-2 block" />
              <p className="text-sm text-amber-700 mb-3">Clause library not loaded yet.</p>
              <button onClick={seedClauses} disabled={loading}
                className="px-4 py-2 bg-amber-600 text-white text-xs font-semibold rounded-lg hover:bg-amber-700">
                {loading ? 'Loading…' : 'Load 128 IATF/ISO Clauses'}
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Clause list */}
              <div className="lg:col-span-1 space-y-1.5 max-h-[70vh] overflow-y-auto pr-1">
                {clauses.map(c=>(
                  <div key={c.id}
                    onClick={()=>setSelectedClause(c)}
                    className={`cursor-pointer rounded-xl p-3 border transition-all ${
                      selectedClause?.id===c.id
                        ? 'bg-[#1d4ed8] text-white border-[#1d4ed8]'
                        : 'bg-white border-blue-100 hover:border-blue-300 hover:bg-blue-50'
                    }`}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={`font-mono text-xs font-bold px-1.5 py-0.5 rounded ${
                        selectedClause?.id===c.id?'bg-blue-700 text-white':'bg-blue-50 text-[#1d4ed8]'
                      }`}>{c.clause_no}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${
                        selectedClause?.id===c.id
                          ? 'bg-blue-700 text-white'
                          : c.standard==='IATF'?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'
                      }`}>{c.standard}</span>
                    </div>
                    <div className={`text-xs font-semibold ${selectedClause?.id===c.id?'text-white':'text-[#1e3a5f]'}`}>
                      {c.clause_title}
                    </div>
                  </div>
                ))}
                {clauses.length === 0 && (
                  <div className="text-center py-10 text-gray-400 text-sm">No clauses match your filter.</div>
                )}
              </div>

              {/* Clause detail */}
              <div className="lg:col-span-2">
                {!selectedClause ? (
                  <div className="bg-white rounded-xl border border-blue-100 p-10 text-center text-gray-400 h-full flex flex-col items-center justify-center">
                    <i className="ti ti-books text-4xl mb-2" />
                    <p className="text-sm">Select a clause to view details</p>
                  </div>
                ) : (
                  <div className="bg-white rounded-xl border border-blue-100 p-4 space-y-4">
                    {/* Header */}
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-[#1d4ed8] rounded-xl flex flex-col items-center justify-center text-white flex-shrink-0">
                        <span className="text-xs font-mono font-bold">{selectedClause.clause_no}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <span className={`text-xs px-2 py-0.5 rounded font-semibold ${
                            selectedClause.standard==='IATF'?'bg-purple-100 text-purple-700':'bg-blue-100 text-blue-700'
                          }`}>{selectedClause.standard}</span>
                          <span className="text-xs text-gray-400">{selectedClause.section}</span>
                        </div>
                        <h3 className="font-bold text-[#1e3a5f] text-base">{selectedClause.clause_title}</h3>
                      </div>
                    </div>

                    {/* Simple meaning */}
                    <div className="bg-blue-50 rounded-lg p-3">
                      <div className="text-xs font-semibold text-blue-700 mb-1">What it means</div>
                      <p className="text-sm text-blue-900">{selectedClause.simple_meaning}</p>
                    </div>

                    {/* Procedures */}
                    {selectedClause.procedures && (
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                          <i className="ti ti-settings text-blue-500" /> Procedures Required
                        </div>
                        <div className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-line">{selectedClause.procedures}</div>
                      </div>
                    )}

                    {/* Documents */}
                    {selectedClause.documents_required && (
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                          <i className="ti ti-files text-green-500" /> Documents & Records Required
                        </div>
                        <div className="text-xs text-gray-700 bg-gray-50 rounded-lg p-3 whitespace-pre-line">{selectedClause.documents_required}</div>
                      </div>
                    )}

                    {/* Applicable processes */}
                    {selectedClause.applicable_process && (
                      <div>
                        <div className="text-xs font-semibold text-gray-600 mb-1 flex items-center gap-1">
                          <i className="ti ti-users text-purple-500" /> Process Owner / Responsible
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {selectedClause.applicable_process.split('\n').filter(Boolean).map(p=>(
                            <span key={p} className="text-xs bg-purple-50 text-purple-700 px-2 py-0.5 rounded-full font-medium border border-purple-100">{p.trim()}</span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Common audit questions */}
                    <div className="bg-amber-50 rounded-lg p-3">
                      <div className="text-xs font-semibold text-amber-700 mb-2">Common Audit Questions for {selectedClause.clause_no}</div>
                      <ul className="text-xs text-amber-900 space-y-1 list-disc list-inside">
                        <li>Show me the procedure/document for this requirement.</li>
                        <li>Is this implemented on the shop floor or only in documents?</li>
                        <li>When was this last reviewed? Show the review record.</li>
                        <li>Who is the process owner? Are they trained?</li>
                        <li>What happens when a nonconformance is found against this clause?</li>
                        {selectedClause.standard === 'IATF' && (
                          <li>Are all customer-specific requirements addressed in this process?</li>
                        )}
                      </ul>
                    </div>

                    {/* Action button */}
                    <button onClick={()=>{
                      if (!conductPlanId) { setTab('plans'); return; }
                      setTab('conduct');
                    }} className="w-full py-2 bg-[#1d4ed8] text-white text-xs font-semibold rounded-lg hover:bg-blue-700">
                      {conductPlanId ? 'Go to Conduct Audit →' : 'Create Audit Plan to Start Auditing →'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
