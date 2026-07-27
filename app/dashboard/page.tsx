'use client';
import { useState, useMemo } from 'react';

const FREQ_ORDER = ['Daily','Weekly','Biweekly','Monthly','Quarterly','Six Monthly','Yearly'];

const FREQ_BADGE: Record<string,string> = {
  'Daily':'bg-red-600 text-white',
  'Weekly':'bg-orange-500 text-white',
  'Biweekly':'bg-amber-500 text-white',
  'Monthly':'bg-blue-600 text-white',
  'Quarterly':'bg-green-600 text-white',
  'Six Monthly':'bg-purple-600 text-white',
  'Yearly':'bg-gray-600 text-white',
};

const FREQ_CARD: Record<string,string> = {
  'Daily':'bg-red-800 border-red-600',
  'Weekly':'bg-orange-800 border-orange-600',
  'Biweekly':'bg-amber-800 border-amber-600',
  'Monthly':'bg-blue-800 border-blue-600',
  'Quarterly':'bg-green-800 border-green-600',
  'Six Monthly':'bg-purple-800 border-purple-600',
  'Yearly':'bg-gray-700 border-gray-500',
};

const CAT_STYLE: Record<string,{bg:string;border:string;hdr:string;txt:string}> = {
  'Customer Quality':{bg:'bg-blue-950',border:'border-blue-700',hdr:'bg-blue-900',txt:'text-blue-300'},
  'QMS & MR':{bg:'bg-purple-950',border:'border-purple-700',hdr:'bg-purple-900',txt:'text-purple-300'},
  'Corporate Reporting':{bg:'bg-indigo-950',border:'border-indigo-700',hdr:'bg-indigo-900',txt:'text-indigo-300'},
  'Incoming':{bg:'bg-teal-950',border:'border-teal-700',hdr:'bg-teal-900',txt:'text-teal-300'},
  'Supplier Quality':{bg:'bg-orange-950',border:'border-orange-700',hdr:'bg-orange-900',txt:'text-orange-300'},
  'Inprocess':{bg:'bg-green-950',border:'border-green-700',hdr:'bg-green-900',txt:'text-green-300'},
  'TQM/TBEM':{bg:'bg-yellow-950',border:'border-yellow-700',hdr:'bg-yellow-900',txt:'text-yellow-300'},
  'Manufacturing':{bg:'bg-red-950',border:'border-red-700',hdr:'bg-red-900',txt:'text-red-300'},
  'Development':{bg:'bg-cyan-950',border:'border-cyan-700',hdr:'bg-cyan-900',txt:'text-cyan-300'},
  'Production':{bg:'bg-emerald-950',border:'border-emerald-700',hdr:'bg-emerald-900',txt:'text-emerald-300'},
  'Managerial':{bg:'bg-violet-950',border:'border-violet-700',hdr:'bg-violet-900',txt:'text-violet-300'},
};

const CAT_ICON: Record<string,string> = {
  'Customer Quality':'🚗','QMS & MR':'📋','Corporate Reporting':'📊',
  'Incoming':'📦','Supplier Quality':'🏭','Inprocess':'⚙️',
  'TQM/TBEM':'🏆','Manufacturing':'🔧','Development':'🔬',
  'Production':'🏗️','Managerial':'👔',
};

interface Item { name: string; freq: string; }
interface Cat  { category: string; items: Item[]; }

const DATA: Cat[] = [
  { category:'Customer Quality', items:[
    {name:'Customer Warranty',freq:'Weekly'},
    {name:'FG Seat Layout & GA Drawing',freq:'Monthly'},
    {name:'Customer Rejection',freq:'Monthly'},
    {name:'Customer Concern & TML PRR',freq:'Monthly'},
    {name:'Customer PDI Reports & Tracking',freq:'Weekly'},
    {name:'Customer Approved PPAP',freq:'Monthly'},
    {name:'Customer Scorecard',freq:'Monthly'},
    {name:'4M Change Upload - TML',freq:'Monthly'},
    {name:'Send OVR Data - TMBSL',freq:'Monthly'},
    {name:'Daily Customer Dispatch Tracking',freq:'Daily'},
    {name:'Customer PDI Upload - TML',freq:'Daily'},
    {name:'Customer MOM & Closure',freq:'Monthly'},
    {name:'TAC Extension Report',freq:'Monthly'},
    {name:'Customer Audit & Sustainability',freq:'Monthly'},
    {name:'CSAT Analysis & Closure',freq:'Monthly'},
    {name:'Structured Visit Plan & Closure',freq:'Monthly'},
    {name:'Customer Requirements',freq:'Quarterly'},
    {name:'Customer Satisfaction - IATF',freq:'Quarterly'},
    {name:'Customer Improvement',freq:'Monthly'},
    {name:'Customer Deviation',freq:'Monthly'},
    {name:'TMBSL DSL',freq:'Monthly'},
  ]},
  { category:'QMS & MR', items:[
    {name:'Audit Plan & Adherence',freq:'Biweekly'},
    {name:'External IATF',freq:'Biweekly'},
    {name:'External ISO 14001 & 45001',freq:'Quarterly'},
    {name:'MR Appointment',freq:'Yearly'},
    {name:'Contingency Plan',freq:'Six Monthly'},
    {name:'Management Review',freq:'Six Monthly'},
    {name:'Plant Objective',freq:'Monthly'},
    {name:'Plant Processes & Outsourced Process',freq:'Yearly'},
    {name:'Alternative & Back-up Method',freq:'Yearly'},
    {name:'Quality Policy',freq:'Yearly'},
    {name:'Plant Issue List',freq:'Monthly'},
    {name:'CI Opportunities',freq:'Quarterly'},
    {name:'Award Nominations',freq:'Monthly'},
    {name:'Internal IATF Audit',freq:'Quarterly'},
    {name:'Internal Process Audit',freq:'Monthly'},
    {name:'Internal Product Audit',freq:'Monthly'},
    {name:'Internal Control Plan Audit',freq:'Monthly'},
    {name:'Internal CSR Audit',freq:'Quarterly'},
    {name:'Internal Craftsmanship Audit',freq:'Monthly'},
    {name:'Internal 6S Audit',freq:'Monthly'},
    {name:'Internal IFC Audit',freq:'Monthly'},
    {name:'TACO TM Policies (Vision & Mission)',freq:'Yearly'},
    {name:'From Sushree Raw Data',freq:'Monthly'},
    {name:'Document Control',freq:'Quarterly'},
    {name:'CI Plant Improvement',freq:'Monthly'},
    {name:'Risk & Opportunities',freq:'Six Monthly'},
    {name:'Empowerment & Motivation',freq:'Monthly'},
  ]},
  { category:'Corporate Reporting', items:[
    {name:'QRM Data',freq:'Monthly'},
    {name:'Plant Ops MIS - Dharwad',freq:'Monthly'},
    {name:'Quality MIS with COPQ & Scrap Sign off',freq:'Weekly'},
    {name:'Weekly Report - Supplier',freq:'Weekly'},
    {name:'Weekly Report - Inprocess',freq:'Weekly'},
    {name:'Inprocess Weekly Report',freq:'Weekly'},
    {name:'MD Dashboard Data',freq:'Monthly'},
    {name:'IFC Data & Quality Ticks',freq:'Monthly'},
    {name:'Send Customer Rating for MIS',freq:'Monthly'},
    {name:'MPCP Filled Up',freq:'Monthly'},
  ]},
  { category:'Incoming', items:[
    {name:'Child Part Drawing',freq:'Monthly'},
    {name:'DOL / NDOL List',freq:'Monthly'},
    {name:'List of Incoming Materials',freq:'Monthly'},
    {name:'Incoming Parts Layout Inspection',freq:'Monthly'},
    {name:'Incoming Appearance Manual',freq:'Monthly'},
    {name:'Incoming Fixture Validation Reports',freq:'Quarterly'},
    {name:'Supplier Inward Data',freq:'Monthly'},
    {name:'Incoming Check Sheet & Adherence',freq:'Monthly'},
    {name:'Incoming Control Plan / Quality Plan',freq:'Monthly'},
    {name:'Incoming Skill Matrix',freq:'Monthly'},
    {name:'Quarantine Data & Disposal',freq:'Weekly'},
  ]},
  { category:'Supplier Quality', items:[
    {name:'Supplier PPAP & Packaging Sign off',freq:'Monthly'},
    {name:'Supplier Wise Issues Reporting',freq:'Weekly'},
    {name:'Supplier 4M Changes',freq:'Monthly'},
    {name:'Supplier REPPAP',freq:'Monthly'},
    {name:'Supplier Development Activities',freq:'Monthly'},
    {name:'Approved Supplier List & QMS',freq:'Monthly'},
    {name:'Supplier Quality Issue & MOM',freq:'Daily'},
    {name:'Supplier Rework',freq:'Daily'},
    {name:'Supplier Improvement - FTG & Others',freq:'Monthly'},
    {name:'Supplier PDIR & Part Layout Inspection',freq:'Daily'},
    {name:'Supplier PPM Trend Chart & Action Plan',freq:'Weekly'},
    {name:'Supplier Containment Action',freq:'Daily'},
    {name:'Supplier Training Plan',freq:'Monthly'},
    {name:'Supplier Process Audit - CQI',freq:'Monthly'},
    {name:'Material Compliance & Test Report',freq:'Monthly'},
    {name:'Supplier NDA Sign off',freq:'Monthly'},
    {name:'Supplier System Audit & Adherence',freq:'Monthly'},
    {name:'Supplier Debit Note',freq:'Monthly'},
    {name:'Supplier Rating & Best/Worst Supplier',freq:'Monthly'},
    {name:'Limit Sample Validation',freq:'Monthly'},
    {name:'Supplier Kaizen & Quality Circle',freq:'Monthly'},
    {name:'Supplier Part Weight Verification',freq:'Monthly'},
  ]},
  { category:'Inprocess', items:[
    {name:'Customer Wise Dispatch Sheet',freq:'Daily'},
    {name:'Red Bin Analysis & FTT',freq:'Weekly'},
    {name:'Customer Concern Tracking - EOL Issue',freq:'Weekly'},
    {name:'Control Plan (Incoming, Inprocess & EOL)',freq:'Monthly'},
    {name:'Capability - SPC',freq:'Monthly'},
    {name:'EOL Check Sheet & Actual Inspection',freq:'Monthly'},
    {name:'R&R - MSA (Variable & Attributes)',freq:'Monthly'},
    {name:'Measuring Instruments List & Calibration',freq:'Monthly'},
    {name:'IPPM Trend Chart & Action Plan',freq:'Monthly'},
    {name:'Model Wise Quality Plan',freq:'Monthly'},
    {name:'Plant Layout',freq:'Monthly'},
    {name:'Scrap Data',freq:'Weekly'},
    {name:'Plant 4M Changes',freq:'Monthly'},
    {name:'FG Seat Layout Inspection',freq:'Monthly'},
    {name:'Appearance Manual - FG Seat',freq:'Monthly'},
    {name:'EOL Skill Assessment',freq:'Monthly'},
    {name:'Rework PFMEA, ODS & WI',freq:'Monthly'},
    {name:'ODS / SOP',freq:'Monthly'},
    {name:'Process Control Sheet',freq:'Monthly'},
    {name:'Pokayoke Control & Tracking',freq:'Monthly'},
    {name:'Alternative Method',freq:'Monthly'},
    {name:'Traceability Management & Stickers',freq:'Monthly'},
    {name:'Local Master List',freq:'Monthly'},
    {name:'External Master List',freq:'Monthly'},
    {name:'Control & Retention of Documents',freq:'Monthly'},
    {name:'Inhouse Deviation',freq:'Monthly'},
  ]},
  { category:'TQM/TBEM', items:[
    {name:'TEI Sheet',freq:'Weekly'},
    {name:'QCC',freq:'Weekly'},
    {name:'QC Story',freq:'Weekly'},
    {name:'Kaizen',freq:'Weekly'},
    {name:'Green Belt Project',freq:'Monthly'},
    {name:'TBEM',freq:'Monthly'},
    {name:'External Awards Participation',freq:'Monthly'},
    {name:'TML DWM',freq:'Monthly'},
  ]},
  { category:'Manufacturing', items:[
    {name:'PFD',freq:'Monthly'},
    {name:'Inprocess PFMEA',freq:'Monthly'},
    {name:'Process Change & Trial Results',freq:'Monthly'},
    {name:'SOP / ODS',freq:'Monthly'},
    {name:'Rework PFMEA',freq:'Monthly'},
    {name:'Plant Layout',freq:'Monthly'},
  ]},
  { category:'Development', items:[
    {name:'Development Parts Inspection',freq:'Monthly'},
    {name:'Product Change / APQP Process',freq:'Monthly'},
    {name:'FG Seat Layout',freq:'Monthly'},
    {name:'Test Report',freq:'Monthly'},
  ]},
  { category:'Production', items:[
    {name:'Process Control Sheet',freq:'Monthly'},
    {name:'Consumable Planning',freq:'Monthly'},
    {name:'Scrap Planning for Consumable',freq:'Monthly'},
  ]},
  { category:'Managerial', items:[
    {name:'Manpower Skill Assessment',freq:'Monthly'},
    {name:'Development / Upgradation Planning',freq:'Monthly'},
    {name:'Training to Team',freq:'Monthly'},
    {name:'Quality Manpower Planning',freq:'Monthly'},
    {name:'DL with Target - QA Team',freq:'Monthly'},
    {name:'Cost Saving Idea / VAVE Projects',freq:'Monthly'},
    {name:'Involvement in Employee Engagement',freq:'Monthly'},
    {name:'Quality Ticks Review',freq:'Monthly'},
  ]},
];

export default function QualityHeadDashboard() {
  const [search, setSearch] = useState('');
  const [freqFilter, setFreqFilter] = useState('All');
  const [catFilter, setCatFilter] = useState('All');

  const allItems = useMemo(() => DATA.flatMap(c => c.items), []);

  const stats = useMemo(() => {
    const counts: Record<string,number> = {};
    FREQ_ORDER.forEach(f => { counts[f] = 0; });
    allItems.forEach(item => { if (item.freq && counts[item.freq] !== undefined) counts[item.freq]++; });
    return counts;
  }, [allItems]);

  const filtered = useMemo(() => DATA.map(cat => ({
    ...cat,
    items: cat.items.filter(item => {
      const mf = freqFilter === 'All' || item.freq === freqFilter;
      const ms = !search || item.name.toLowerCase().includes(search.toLowerCase());
      const mc = catFilter === 'All' || cat.category === catFilter;
      return mf && ms && mc;
    }),
  })).filter(cat => (catFilter === 'All' || cat.category === catFilter) && cat.items.length > 0),
  [freqFilter, search, catFilter]);

  const totalFiltered = filtered.reduce((s, c) => s + c.items.length, 0);
  const anyFilter = freqFilter !== 'All' || !!search || catFilter !== 'All';

  return (
    <div className="min-h-screen bg-gray-900 text-white p-4">
      {/* Header */}
      <div className="mb-5 flex items-start justify-between flex-wrap gap-2">
        <div>
          <h1 className="text-2xl font-bold text-white">{'👔'} Quality Head Dashboard</h1>
          <p className="text-gray-400 text-sm mt-0.5">Complete quality activity register — review frequencies by department | IATF 16949 · AIAG VDA</p>
        </div>
        <div className="text-right text-xs text-gray-500">
          <div>{allItems.length} total tasks across {DATA.length} departments</div>
        </div>
      </div>

      {/* Frequency Summary Cards */}
      <div className="grid grid-cols-4 md:grid-cols-7 gap-2 mb-4">
        {FREQ_ORDER.map(freq => (
          <button key={freq} onClick={() => setFreqFilter(f => f === freq ? 'All' : freq)}
            className={`rounded-lg p-2 text-center border transition-all duration-150 ${FREQ_CARD[freq]} ${freqFilter === freq ? 'ring-2 ring-white scale-105 shadow-lg' : 'opacity-75 hover:opacity-100'}`}>
            <div className="text-xl font-bold">{stats[freq]}</div>
            <div className="text-xs mt-0.5 leading-tight">{freq}</div>
          </button>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-2 mb-5">
        <input type="text" placeholder={'🔍  Search tasks...'} value={search}
          onChange={e => setSearch(e.target.value)}
          className="bg-gray-800 border border-gray-600 text-white text-sm px-3 py-1.5 rounded w-52 placeholder-gray-500" />
        <select value={catFilter} onChange={e => setCatFilter(e.target.value)}
          className="bg-gray-800 border border-gray-600 text-white text-sm px-3 py-1.5 rounded">
          <option value="All">All Departments</option>
          {DATA.map(c => <option key={c.category} value={c.category}>{CAT_ICON[c.category]} {c.category}</option>)}
        </select>
        {anyFilter && (
          <button onClick={() => { setFreqFilter('All'); setSearch(''); setCatFilter('All'); }}
            className="bg-gray-700 hover:bg-gray-600 text-sm px-3 py-1.5 rounded border border-gray-600">
            {'✕'} Clear
          </button>
        )}
        <span className="text-gray-400 text-sm">{totalFiltered} task{totalFiltered !== 1 ? 's' : ''}</span>
      </div>

      {/* Category Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
        {filtered.map(cat => {
          const s = CAT_STYLE[cat.category] ?? {bg:'bg-gray-800',border:'border-gray-600',hdr:'bg-gray-700',txt:'text-gray-300'};
          const dailyCount = cat.items.filter(i => i.freq === 'Daily').length;
          const weeklyCount = cat.items.filter(i => i.freq === 'Weekly').length;
          return (
            <div key={cat.category} className={`${s.bg} border ${s.border} rounded-xl overflow-hidden flex flex-col`}>
              {/* Card Header */}
              <div className={`${s.hdr} px-3 py-2.5 flex items-center justify-between`}>
                <div className="flex items-center gap-2">
                  <span className="text-xl">{CAT_ICON[cat.category]}</span>
                  <span className={`font-bold text-sm ${s.txt}`}>{cat.category}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {dailyCount > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-red-600 text-white font-bold">{dailyCount}D</span>}
                  {weeklyCount > 0 && <span className="text-xs px-1.5 py-0.5 rounded bg-orange-600 text-white font-bold">{weeklyCount}W</span>}
                  <span className={`text-xs px-2 py-0.5 rounded-full bg-black/20 ${s.txt}`}>{cat.items.length}</span>
                </div>
              </div>
              {/* Item List */}
              <div className="p-2 space-y-0.5 overflow-y-auto" style={{maxHeight:'280px'}}>
                {cat.items.map((item, idx) => (
                  <div key={idx} className="flex items-start justify-between gap-2 px-2 py-1 rounded hover:bg-white/5 transition-colors">
                    <span className="text-gray-200 text-xs leading-snug flex-1">{item.name}</span>
                    {item.freq && (
                      <span className={`text-xs px-1.5 py-0.5 rounded font-medium whitespace-nowrap flex-shrink-0 ${FREQ_BADGE[item.freq] ?? 'bg-gray-600 text-white'}`}>
                        {item.freq}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Legend */}
      <div className="bg-gray-800 rounded-lg px-4 py-3 border border-gray-700">
        <p className="text-xs font-bold text-gray-400 mb-2 uppercase tracking-wide">Review Frequency Key</p>
        <div className="flex flex-wrap gap-2">
          {FREQ_ORDER.map(freq => (
            <span key={freq} className={`text-xs px-2 py-0.5 rounded font-medium ${FREQ_BADGE[freq]}`}>{freq}</span>
          ))}
          <span className="text-xs text-gray-500 self-center ml-2">Click a frequency card above to filter</span>
        </div>
      </div>
    </div>
  );
}
