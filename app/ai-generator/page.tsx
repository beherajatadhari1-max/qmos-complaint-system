'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Generator {
  id: string; title: string; subtitle: string; description: string;
  standard: string; icon: string; color: string; href: string;
  status: 'active' | 'coming_soon'; steps?: string[];
  outputs: string[]; category: string;
}

const GENERATORS: Generator[] = [
  {
    id: '8d', title: '8D Report Generator', subtitle: 'Eight Disciplines Problem Solving',
    description: 'AI-assisted 8D report for customer complaints, internal NCRs, and supplier issues. Covers all 8 disciplines: team, problem description, containment, root cause, corrective actions, verification, prevention, and closure.',
    standard: 'Ford 8D / AIAG 8D', icon: '??', color: 'orange', href: '/8d', status: 'active',
    steps: ['D0: Emergency Response','D1: Team Formation','D2: Problem Description','D3: Containment Action','D4: Root Cause Analysis','D5: Corrective Actions','D6: Verify Effectiveness','D7: Prevent Recurrence','D8: Close & Congratulate'],
    outputs: ['PDF Report','Excel','Customer Format'], category: 'Problem Solving',
  },
  {
    id: 'pfd', title: 'PFD ? Process Flow Diagram', subtitle: 'Step 1 of 3 in APQP Core Tools Chain',
    description: 'Define your manufacturing process steps with 4M inputs (Man, Machine, Material, Method), output characteristics, and special characteristics. PFD is the foundation ? it automatically feeds PFMEA and Control Plan.',
    standard: 'AIAG APQP 3rd Edition', icon: '??', color: 'indigo', href: '/pfd', status: 'active',
    steps: ['Enter process steps','Select process type (stamping/welding/assembly etc.)','Define 4M inputs','Mark special characteristics (CC/SC/KPC/KCC)','Preview flow diagram','Click Generate PFMEA'],
    outputs: ['Visual Flow Diagram','JSON Export','Feeds PFMEA'], category: 'APQP Core Tools',
  },
  {
    id: 'pfmea', title: 'PFMEA Generator', subtitle: 'Process Failure Mode & Effects Analysis',
    description: 'AIAG & VDA 2019 compliant PFMEA with full 7-step approach. Auto-generates failure modes, effects, causes, and controls from PFD. Uses Action Priority (H/M/L) instead of old RPN. Covers all 7 steps including Structure, Function, Failure Analysis and Optimization.',
    standard: 'AIAG & VDA 2019 FMEA Handbook', icon: '??', color: 'red', href: '/pfmea', status: 'active',
    steps: ['Import from PFD (auto)','Review 40+ pre-loaded failure modes','Set S (Severity) 1?10','Set O (Occurrence) 1?10','Set D (Detection) 1?10','AP auto-calculated (H/M/L)','Add responsible person & target date','Track after-action S*/O*/D*'],
    outputs: ['PFMEA Table','Excel Export','PDF','Feeds Control Plan'], category: 'APQP Core Tools',
  },
  {
    id: 'control-plan', title: 'Control Plan Generator', subtitle: 'Manufacturing Control Plan',
    description: 'AIAG Control Plan 1st Edition (2024) compliant. Auto-generates from PFMEA ? maps failure causes to process/product characteristics, assigns measurement techniques, sample sizes, frequencies, and AIAG-compliant reaction plans based on Action Priority and special characteristics.',
    standard: 'AIAG Control Plan 1st Edition (March 2024)', icon: '??', color: 'green', href: '/control-plan', status: 'active',
    steps: ['Auto-import from PFMEA','Edit specifications & tolerances','Set measurement technique','Define sample size & frequency (per AP)','Configure control method (SPC/attribute)','Set reaction plan & action owner','Export CSV'],
    outputs: ['Control Plan Table','CSV Export','JSON Export'], category: 'APQP Core Tools',
  },
  {
    id: 'ppap', title: 'PPAP Checklist Generator', subtitle: 'Production Part Approval Process',
    description: 'Generate PPAP submission checklists with all 18 elements. Track completion, assign responsibility, manage submission levels 1?5 per AIAG PPAP 4th Edition.',
    standard: 'AIAG PPAP 4th Edition', icon: '?', color: 'blue', href: '/ppap', status: 'coming_soon',
    outputs: ['PPAP Checklist','Submission Package','Customer Report'], category: 'APQP Core Tools',
  },
  {
    id: 'apqp', title: 'APQP Timing Plan', subtitle: 'Advanced Product Quality Planning',
    description: 'Generate APQP timing plans with all 5 phases, milestones, and deliverables. Assign owners, track completion, Gantt-style view.',
    standard: 'AIAG APQP 3rd Edition', icon: '??', color: 'purple', href: '/apqp', status: 'coming_soon',
    outputs: ['Timing Plan','Gantt Chart','Excel Export'], category: 'APQP Core Tools',
  },
  {
    id: 'msa', title: 'MSA Study Template', subtitle: 'Measurement System Analysis',
    description: 'GR&R, Attribute Agreement Analysis, Bias/Linearity study worksheets per AIAG MSA 4th Edition.',
    standard: 'AIAG MSA 4th Edition', icon: '??', color: 'teal', href: '/msa', status: 'coming_soon',
    outputs: ['GR&R Worksheet','SPC Charts','MSA Report'], category: 'APQP Core Tools',
  },
  {
    id: 'spc', title: 'SPC Control Chart Generator', subtitle: 'Statistical Process Control',
    description: 'Generate Xbar-R, I-MR, p-chart templates with control limits, Cpk analysis, and OOC rule detection.',
    standard: 'AIAG SPC 2nd Edition', icon: '??', color: 'cyan', href: '/spc', status: 'coming_soon',
    outputs: ['SPC Charts','Cpk Report','Excel Workbook'], category: 'APQP Core Tools',
  },
  {
    id: 'capa', title: 'CAPA Generator', subtitle: 'Corrective & Preventive Action',
    description: 'Structured CAPA reports with 5-Why, Fishbone (Ishikawa), corrective actions, verification, and effectiveness checks. Linked to NCR system.',
    standard: 'IATF 16949 / ISO 9001', icon: '??', color: 'yellow', href: '/capa', status: 'coming_soon',
    outputs: ['CAPA Report','Action Tracker','PDF'], category: 'Problem Solving',
  },
];

const C: Record<string, { bg: string; border: string; text: string; badge: string; btn: string; iconBg: string }> = {
  orange: { bg:'bg-orange-950', border:'border-orange-700', text:'text-orange-400', badge:'bg-orange-800 text-orange-200', btn:'bg-orange-600 hover:bg-orange-700', iconBg:'bg-orange-900' },
  indigo: { bg:'bg-indigo-950', border:'border-indigo-700', text:'text-indigo-400', badge:'bg-indigo-800 text-indigo-200', btn:'bg-indigo-600 hover:bg-indigo-700', iconBg:'bg-indigo-900' },
  red:    { bg:'bg-red-950',    border:'border-red-700',    text:'text-red-400',    badge:'bg-red-800 text-red-200',    btn:'bg-red-600 hover:bg-red-700',    iconBg:'bg-red-900' },
  green:  { bg:'bg-green-950',  border:'border-green-700',  text:'text-green-400',  badge:'bg-green-800 text-green-200',  btn:'bg-green-600 hover:bg-green-700',  iconBg:'bg-green-900' },
  blue:   { bg:'bg-blue-950',   border:'border-blue-700',   text:'text-blue-400',   badge:'bg-blue-800 text-blue-200',   btn:'bg-blue-600 hover:bg-blue-700',   iconBg:'bg-blue-900' },
  purple: { bg:'bg-purple-950', border:'border-purple-700', text:'text-purple-400', badge:'bg-purple-800 text-purple-200', btn:'bg-purple-600 hover:bg-purple-700', iconBg:'bg-purple-900' },
  teal:   { bg:'bg-teal-950',   border:'border-teal-700',   text:'text-teal-400',   badge:'bg-teal-800 text-teal-200',   btn:'bg-teal-600 hover:bg-teal-700',   iconBg:'bg-teal-900' },
  cyan:   { bg:'bg-cyan-950',   border:'border-cyan-700',   text:'text-cyan-400',   badge:'bg-cyan-800 text-cyan-200',   btn:'bg-cyan-600 hover:bg-cyan-700',   iconBg:'bg-cyan-900' },
  yellow: { bg:'bg-yellow-950', border:'border-yellow-700', text:'text-yellow-400', badge:'bg-yellow-800 text-yellow-200', btn:'bg-yellow-600 hover:bg-yellow-700', iconBg:'bg-yellow-900' },
};

export default function AIGeneratorPage() {
  const router = useRouter();
  const [category, setCategory] = useState('All');
  const [expanded, setExpanded] = useState<string | null>(null);

  const active = GENERATORS.filter(g => g.status === 'active').length;
  const soon   = GENERATORS.filter(g => g.status === 'coming_soon').length;
  const shown  = category === 'All' ? GENERATORS : GENERATORS.filter(g => g.category === category);

  return (
    <div className="p-6 max-w-7xl mx-auto text-white">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 mb-4 text-xs">
        <span className="bg-blue-700 text-white px-2 py-0.5 rounded-full font-semibold">Intelligence</span>
        <span className="text-gray-500">&rsaquo;</span>
        <span className="bg-purple-700 text-white px-2 py-0.5 rounded-full font-semibold">AI Generator</span>
      </div>

      {/* Title */}
      <h1 className="text-3xl font-bold mb-2">&#129302; Quality AI Generator</h1>
      <p className="text-gray-400 max-w-2xl mb-4">
        Auto-generate AIAG/VDA-compliant quality documents from your process data.
        Start with PFD &#8594; PFMEA &#8594; Control Plan for a complete APQP package.
      </p>

      {/* Stats */}
      <div className="flex items-center gap-6 mb-6">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-green-500 animate-pulse"></span>
          <span className="text-sm"><span className="text-green-400 font-bold">{active}</span> Active Generators</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-gray-500"></span>
          <span className="text-sm text-gray-400"><span className="text-gray-300 font-bold">{soon}</span> Coming Soon</span>
        </div>
      </div>

      {/* APQP Chain Banner */}
      <div className="bg-gray-800 border border-gray-700 rounded-xl p-4 mb-6">
        <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide mb-3">
          &#128279; APQP Core Tools Chain &mdash; Recommended Workflow
        </p>
        <div className="flex items-center gap-2 flex-wrap">
          {[
            { label:'PFD', sub:'Process Flow', color:'text-indigo-400', bg:'bg-indigo-900 border-indigo-700', href:'/pfd' },
            { label:'PFMEA', sub:'AIAG VDA 2019', color:'text-red-400', bg:'bg-red-900 border-red-700', href:'/pfmea' },
            { label:'Control Plan', sub:'AIAG 2024', color:'text-green-400', bg:'bg-green-900 border-green-700', href:'/control-plan' },
            { label:'8D Report', sub:'Problem Solving', color:'text-orange-400', bg:'bg-orange-900 border-orange-700', href:'/8d' },
          ].map((item, i) => (
            <div key={item.label} className="flex items-center gap-2">
              {i > 0 && <span className="text-gray-600 text-lg">&rarr;</span>}
              <button onClick={() => router.push(item.href)}
                className={`border rounded-lg px-4 py-2 text-sm hover:brightness-125 transition-all ${item.bg}`}>
                <div className={`font-bold ${item.color}`}>{item.label}</div>
                <div className="text-xs text-gray-400">{item.sub}</div>
              </button>
            </div>
          ))}
          <span className="ml-3 text-xs text-gray-600 italic">Each step auto-feeds the next</span>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex gap-2 mb-6">
        {['All','APQP Core Tools','Problem Solving'].map(cat => (
          <button key={cat} onClick={() => setCategory(cat)}
            className={`text-sm px-4 py-1.5 rounded-full border transition-all ${
              category === cat
                ? 'bg-blue-600 border-blue-500 text-white font-semibold'
                : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-gray-500'
            }`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
        {shown.map(gen => {
          const c = C[gen.color] || C.blue;
          const isExp = expanded === gen.id;
          return (
            <div key={gen.id} className={`rounded-xl border ${c.bg} ${c.border} flex flex-col ${gen.status==='coming_soon'?'opacity-60':''}`}>
              <div className="p-5 flex-1">
                <div className="flex items-start justify-between mb-3">
                  <div className={`w-12 h-12 ${c.iconBg} rounded-xl flex items-center justify-center text-2xl border ${c.border}`}>
                    {gen.icon}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {gen.status === 'active'
                         ? <span className="text-xs bg-green-800 text-green-300 border border-green-700 px-2 py-0.5 rounded-full font-semibold">&#9679; Active</span>
                      : <span className="text-xs bg-gray-700 text-gray-400 border border-gray-600 px-2 py-0.5 rounded-full">&#9675; Coming Soon</span>}
                    <span className={`text-xs ${c.badge} px-2 py-0.5 rounded-full`}>{gen.category}</span>
                  </div>
                </div>
                <h3 className={`text-base font-bold ${c.text} mb-0.5`}>{gen.title}</h3>
                <p className="text-xs text-gray-400 mb-2">{gen.subtitle}</p>
                <p className="text-xs text-gray-300 leading-relaxed">{gen.description}</p>
                <div className="mt-3 flex items-center gap-1.5">
                  <span className="text-xs text-gray-500">Standard:</span>
                  <span className={`text-xs font-semibold ${c.text}`}>{gen.standard}</span>
                </div>
                <div className="mt-3">
                  <p className="text-xs text-gray-500 mb-1.5">Outputs:</p>
                  <div className="flex flex-wrap gap-1">
                    {gen.outputs.map(o => (
                      <span key={o} className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full border border-gray-600">{o}</span>
                    ))}
                  </div>
                </div>
                {gen.steps && (
                  <div className="mt-3">
                    <button onClick={() => setExpanded(isExp ? null : gen.id)}
                      className="text-xs text-gray-400 hover:text-white flex items-center gap-1">
                      <span>{isExp ? '&#9660;' : '&#9654;'}</span>
                      <span>{isExp ? 'Hide Steps' : `Show ${gen.steps.length} Steps`}</span>
                    </button>
                    {isExp && (
                      <ol className="mt-2 space-y-1">
                        {gen.steps.map((step, i) => (
                          <li key={i} className="text-xs text-gray-300 flex items-start gap-2">
                            <span className={`w-4 h-4 ${c.iconBg} ${c.text} rounded-full flex items-center justify-center text-xs flex-shrink-0 font-bold border ${c.border}`}>{i+1}</span>
                            <span>{step}</span>
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )}
              </div>
              <div className={`px-5 py-3 border-t ${c.border} flex items-center justify-between`}>
                <span className="text-xs text-gray-500">{gen.status==='active'?'Ready to use':'In development'}</span>
                {gen.status === 'active'
                  ? <button onClick={() => router.push(gen.href)} className={`${c.btn} text-white text-sm px-5 py-1.5 rounded-lg font-semibold`}>Open &rarr;</button>
                  : <button disabled className="bg-gray-700 text-gray-500 text-sm px-5 py-1.5 rounded-lg cursor-not-allowed">Coming Soon</button>}
              </div>
            </div>
          );
        })}
      </div>

      {/* Standards Reference */}
      <div className="mt-8 bg-gray-800 border border-gray-700 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-300 mb-3">&#128218; AIAG Standards Referenced</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
          {[
            ['AIAG & VDA FMEA 2019','PFMEA ? Action Priority H/M/L'],
            ['AIAG Control Plan 2024','Minimum required CP content'],
            ['AIAG APQP 3rd Edition','PFD, Timing Plan, Deliverables'],
            ['AIAG PPAP 4th Edition','18 elements, levels 1?5'],
            ['AIAG MSA 4th Edition','GR&R, Attribute, Bias/Linearity'],
            ['AIAG SPC 2nd Edition','Control charts, Cpk analysis'],
            ['Ford / AIAG 8D','Eight Disciplines problem solving'],
            ['IATF 16949:2016','CAPA, customer-specific requirements'],
          ].map(([std, desc]) => (
            <div key={std} className="bg-gray-900 border border-gray-700 rounded-lg p-3">
              <p className="text-blue-400 font-semibold mb-1">{std}</p>
              <p className="text-gray-400">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
