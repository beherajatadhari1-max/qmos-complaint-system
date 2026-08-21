'use client';
import { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
  CONTEXT_PROMPTS,
  getResponse,
  getResourceLinks,
  formatText,
  now,
  TOOL_META,
} from './CopilotWidget';

// -- Types ---------------------------------------------------------------------
interface Message {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  title?: string;
  ts: string;
}

type ToolKey = 'apqp' | 'ppap' | 'pfmea' | 'control-plan' | 'spc' | 'msa';

// -- Tab categories per tool -------------------------------------------------
const TOOL_TABS: Record<string, string[]> = {
  apqp:           ['overview', '5 phases', 'generator', 'analyser', 'qa', 'templates', 'supporting docs', 'posters & banners'],
  ppap:           ['overview', 'guide', 'generator', 'analyser', 'qa', 'templates', 'supporting docs', 'posters & banners'],
  pfmea:          ['overview', 'guide', 'generator', 'analyser', 'qa', 'templates', 'supporting docs', 'posters & banners'],
  'control-plan': ['overview', 'guide', 'generator', 'analyser', 'qa', 'templates', 'supporting docs', 'posters & banners'],
  spc:            ['overview', 'guide', 'generator', 'analyser', 'qa', 'templates', 'supporting docs', 'posters & banners'],
  msa:            ['overview', 'guide', 'generator', 'analyser', 'qa', 'templates', 'supporting docs', 'posters & banners'],
};

const TOOL_PAGE: Record<string, string> = {
  apqp: '/apqp', ppap: '/ppap', pfmea: '/pfmea',
  'control-plan': '/control-plan', spc: '/spc', msa: '/msa',
};

// -- Learn Resources ------------------------------------------------------------
interface VideoResource  { title: string; url: string; desc: string; }
interface WebResource    { title: string; url: string; desc: string; }
interface LearnResources { videos: VideoResource[]; websites: WebResource[]; }

const COMMON_CHANNELS = [
  { title: 'QMB Training', url: 'https://www.youtube.com/@qmbtraining', desc: 'IATF 16949 & all Core Tools — simplified explanations with real industry examples' },
  { title: 'QualityWise',  url: 'https://www.youtube.com/channel/UC7MfSAkpOG6RRkKeeH4Rm7A', desc: 'Core tools, ISO 9001, IATF audits, problem solving & leadership' },
];

const LEARN: Record<string, LearnResources> = {
  apqp: {
    videos: [
      { title: 'APQP 3rd Edition 2024 Explained',        url: 'https://www.youtube.com/watch?v=LtCkz6ZgQWA', desc: 'Complete APQP 3rd Edition walkthrough — phases, gates, deliverables' },
      { title: 'APQP in Real Life',                      url: 'https://www.youtube.com/watch?v=y00LgQxczro', desc: 'Practical APQP application in automotive manufacturing' },
      { title: 'What is APQP? — Explained Simply',       url: 'https://www.youtube.com/watch?v=BBrdQHoLk2k', desc: 'Beginner-friendly APQP overview — 5 phases, gate reviews, outputs' },
      { title: 'Introduction to APQP System',            url: 'https://www.youtube.com/watch?v=79mgwj7Jgw8', desc: 'Webinar — Supplier Quality Management & APQP implementation' },
      { title: '5 Core Tools Explained incl. APQP',      url: 'https://www.youtube.com/watch?v=A1YZ17eH5FQ', desc: 'All 5 Core Tools in one video — APQP, PPAP, FMEA, SPC, MSA' },
      { title: 'IATF 16949 Core Tools Overview',         url: 'https://www.youtube.com/watch?v=JQcagDtvkJw', desc: 'Practical overview of APQP within IATF 16949 framework' },
      { title: 'Core Tools Full Playlist',               url: 'https://www.youtube.com/playlist?list=PLLT3E3dwispxZBDrGTORfN3c5pNNRZ9sK', desc: 'Full playlist — APQP, CP, PPAP, MSA, SPC, FMEA' },
    ],
    websites: [
      { title: 'AIAG — APQP & Control Plan Hub',   url: 'https://www.aiag.org/expertise-areas/quality/quality-core-tools',    desc: 'Official AIAG APQP 3rd Edition resources, manuals & eLearning' },
      { title: 'AIAG — APQP eLearning (ELAP)',     url: 'https://www.aiag.org/training-and-resources/elearning/details/ELAP', desc: 'Free AIAG eLearning: Implementing APQP, Control Plan and PPAP' },
      { title: 'AIAG — IATF 16949 Resources',      url: 'https://www.aiag.org/expertise-areas/quality/iatf-16949-2016',       desc: 'IATF 16949:2016 standard — clauses, CSRs, implementation guides' },
      { title: 'MS Matter — IATF Core Tools Guide', url: 'https://msmatter.co.uk/iatf-16949-navigating-the-core-tools-apqp-ppap-fmea-msa-and-spc/', desc: 'Free guide: Navigating APQP, PPAP, FMEA, MSA & SPC under IATF' },
      { title: 'Quality-One — Core Tools Reference', url: 'https://quality-one.com/quality-core-tools/', desc: 'Comprehensive free reference for all AIAG Core Tools' },
    ],
  },
  ppap: {
    videos: [
      { title: 'IATF 16949 Core Tools Overview',         url: 'https://www.youtube.com/watch?v=JQcagDtvkJw',    desc: 'PPAP within the IATF 16949 framework — levels, elements, PSW' },
      { title: '6 Core Tools — PPAP included',           url: 'https://www.youtube.com/watch?v=emWcnV8JC3U',    desc: 'IATF 16949: MSA, SPC, PPAP, FMEA, APQP & Control Plan overview' },
      { title: '5 Core Tools Explained incl. PPAP',      url: 'https://www.youtube.com/watch?v=A1YZ17eH5FQ',    desc: 'PPAP 18 elements, submission levels, PSW explained simply' },
      { title: '6 Core Quality Tools Explained',         url: 'https://www.youtube.com/watch?v=csOTpzAd-Ko',    desc: 'Full overview of PPAP importance, benefits & process' },
      { title: 'IATF 16949 CORE TOOLS Full Overview',    url: 'https://www.youtube.com/watch?v=7AVWDtf7xr4',    desc: 'APQP, DFMEA, PFMEA, Control Plan, SPC, MSA, PPAP — complete' },
      { title: '6 Core Tools Sequence Explained',        url: 'https://www.youtube.com/watch?v=o19HNCytI2Q',    desc: 'How PPAP fits into the Core Tools sequence and APQP phases' },
      { title: 'Core Tools Full Playlist',               url: 'https://www.youtube.com/playlist?list=PLLT3E3dwispxZBDrGTORfN3c5pNNRZ9sK', desc: 'Full playlist — APQP, CP, PPAP, MSA, SPC, FMEA' },
    ],
    websites: [
      { title: 'AIAG — Quality Core Tools Hub',    url: 'https://www.aiag.org/expertise-areas/quality/quality-core-tools',    desc: 'Official AIAG PPAP 4th Edition resources & ordering' },
      { title: 'AIAG — All Manuals',              url: 'https://www.aiag.org/training-and-resources/manuals',                 desc: 'AIAG PPAP manual, APQP, FMEA, SPC, MSA — purchase & download' },
      { title: 'AIAG — IATF 16949 Resources',      url: 'https://www.aiag.org/expertise-areas/quality/iatf-16949-2016',       desc: 'IATF 16949:2016 — PPAP clause 8.3.4 requirements' },
      { title: 'MS Matter — IATF Core Tools Guide', url: 'https://msmatter.co.uk/iatf-16949-navigating-the-core-tools-apqp-ppap-fmea-msa-and-spc/', desc: 'Free guide: PPAP within IATF — practical navigation guide' },
      { title: 'Quality-One — PPAP Reference',    url: 'https://quality-one.com/quality-core-tools/',                         desc: 'Free comprehensive PPAP reference — 18 elements, levels, PSW' },
    ],
  },
  pfmea: {
    videos: [
      { title: 'IATF 16949 CORE TOOLS — PFMEA Overview', url: 'https://www.youtube.com/watch?v=7AVWDtf7xr4',   desc: 'DFMEA, PFMEA, Control Plan — AIAG-VDA 7-step approach' },
      { title: '5 Core Tools Explained incl. FMEA',      url: 'https://www.youtube.com/watch?v=A1YZ17eH5FQ',   desc: 'FMEA Action Priority (AP) vs RPN — key 2019 changes explained' },
      { title: 'IATF 16949 Core Tools Overview',          url: 'https://www.youtube.com/watch?v=JQcagDtvkJw',   desc: 'PFMEA clause requirements, audit evidence, common findings' },
      { title: '6 Core Quality Tools — PFMEA Focus',     url: 'https://www.youtube.com/watch?v=csOTpzAd-Ko',   desc: 'PFMEA importance, benefits and linkage to Control Plan' },
      { title: '6 Core Tools Sequence — PFMEA Position', url: 'https://www.youtube.com/watch?v=o19HNCytI2Q',   desc: 'Where PFMEA sits in the PFD → PFMEA → Control Plan flow' },
      { title: 'Core Tools Full Playlist',               url: 'https://www.youtube.com/playlist?list=PLLT3E3dwispxZBDrGTORfN3c5pNNRZ9sK', desc: 'Full playlist — APQP, CP, PPAP, MSA, SPC, FMEA' },
    ],
    websites: [
      { title: 'AIAG — FMEA Handbook (AIAG-VDA)',  url: 'https://www.aiag.org/expertise-areas/quality/quality-core-tools',    desc: 'Official AIAG-VDA 2019 FMEA Handbook — 7-step process, AP tables' },
      { title: 'AIAG — All Manuals',              url: 'https://www.aiag.org/training-and-resources/manuals',                 desc: 'AIAG-VDA FMEA manual, AP lookup tables, S/O/D rating scales' },
      { title: 'AIAG — IATF 16949 Resources',      url: 'https://www.aiag.org/expertise-areas/quality/iatf-16949-2016',       desc: 'IATF clause 8.3.3.3 — DFMEA and 8.5.1.1 — PFMEA requirements' },
      { title: 'MS Matter — IATF Core Tools Guide', url: 'https://msmatter.co.uk/iatf-16949-navigating-the-core-tools-apqp-ppap-fmea-msa-and-spc/', desc: 'Free guide: FMEA migration from RPN to Action Priority' },
      { title: 'Quality-One — FMEA Reference',    url: 'https://quality-one.com/quality-core-tools/',                         desc: 'Free PFMEA reference — 7-step, AP, special characteristics' },
    ],
  },
  'control-plan': {
    videos: [
      { title: 'IATF 16949 CORE TOOLS — Control Plan',   url: 'https://www.youtube.com/watch?v=7AVWDtf7xr4',   desc: 'Control Plan fields, reaction plans, PFD-PFMEA-CP trinity' },
      { title: '6 Core Tools Sequence — CP Position',    url: 'https://www.youtube.com/watch?v=o19HNCytI2Q',   desc: 'How Control Plan links to PFMEA and feeds SPC' },
      { title: '5 Core Tools Explained — CP Included',   url: 'https://www.youtube.com/watch?v=A1YZ17eH5FQ',   desc: 'Control Plan header fields, special characteristics, SPC columns' },
      { title: '6 Core Quality Tools Explained',         url: 'https://www.youtube.com/watch?v=csOTpzAd-Ko',   desc: 'Control Plan importance — prototype, pre-launch, production phases' },
      { title: 'IATF 16949 Core Tools Overview',         url: 'https://www.youtube.com/watch?v=JQcagDtvkJw',   desc: 'IATF clause 8.5.1.1 — Control Plan IATF audit requirements' },
      { title: 'Core Tools Full Playlist',               url: 'https://www.youtube.com/playlist?list=PLLT3E3dwispxZBDrGTORfN3c5pNNRZ9sK', desc: 'Full playlist — APQP, CP, PPAP, MSA, SPC, FMEA' },
    ],
    websites: [
      { title: 'AIAG — APQP & Control Plan Manual',url: 'https://go.aiag.org/apqp-cp',                                       desc: 'Official AIAG Control Plan 1st Edition — all fields, formats' },
      { title: 'AIAG — Quality Core Tools Hub',    url: 'https://www.aiag.org/expertise-areas/quality/quality-core-tools',    desc: 'AIAG Control Plan resources, templates & training links' },
      { title: 'AIAG — IATF 16949 Resources',      url: 'https://www.aiag.org/expertise-areas/quality/iatf-16949-2016',       desc: 'IATF clause 8.5.1.1 — Control Plan requirements & CSRs' },
      { title: 'MS Matter — IATF Core Tools Guide', url: 'https://msmatter.co.uk/iatf-16949-navigating-the-core-tools-apqp-ppap-fmea-msa-and-spc/', desc: 'Free guide: Control Plan in context of full IATF toolkit' },
      { title: 'Quality-One — Control Plan Ref.',  url: 'https://quality-one.com/quality-core-tools/',                         desc: 'Free reference: Control Plan fields, reaction plan, SPC link' },
    ],
  },
  spc: {
    videos: [
      { title: 'IATF 16949 Core Tools — SPC Focus',      url: 'https://www.youtube.com/watch?v=JQcagDtvkJw',   desc: 'SPC IATF requirements, control charts, Cpk thresholds explained' },
      { title: '5 Core Tools Explained — SPC included',  url: 'https://www.youtube.com/watch?v=A1YZ17eH5FQ',   desc: 'Cp, Cpk, Pp, Ppk — formulas, thresholds, PPAP requirements' },
      { title: '6 Core Tools — SPC in the Sequence',     url: 'https://www.youtube.com/watch?v=o19HNCytI2Q',   desc: 'How SPC feeds from Control Plan and drives Cpk for PPAP' },
      { title: 'IATF 16949 CORE TOOLS Full Overview',    url: 'https://www.youtube.com/watch?v=7AVWDtf7xr4',   desc: 'SPC control charts, WECO rules, process stability explained' },
      { title: '6 Core Quality Tools Explained',         url: 'https://www.youtube.com/watch?v=csOTpzAd-Ko',   desc: 'SPC importance, X-bar R charts, process capability indices' },
      { title: 'Core Tools Full Playlist',               url: 'https://www.youtube.com/playlist?list=PLLT3E3dwispxZBDrGTORfN3c5pNNRZ9sK', desc: 'Full playlist — APQP, CP, PPAP, MSA, SPC, FMEA' },
    ],
    websites: [
      { title: 'AIAG — SPC Manual 2nd Edition',    url: 'https://www.aiag.org/expertise-areas/quality/quality-core-tools',    desc: 'Official AIAG SPC 2nd Edition — control charts, Cp, Cpk, WECO' },
      { title: 'AIAG — All Manuals',              url: 'https://www.aiag.org/training-and-resources/manuals',                 desc: 'AIAG SPC manual, formulas, tables, reference charts' },
      { title: 'AIAG — IATF 16949 Resources',      url: 'https://www.aiag.org/expertise-areas/quality/iatf-16949-2016',       desc: 'IATF clause 9.1.1.1 — SPC & process monitoring requirements' },
      { title: 'MS Matter — SPC in IATF Guide',   url: 'https://msmatter.co.uk/iatf-16949-navigating-the-core-tools-apqp-ppap-fmea-msa-and-spc/', desc: 'Free guide: SPC within IATF 16949 — practical implementation' },
      { title: 'Quality-One — SPC Reference',     url: 'https://quality-one.com/quality-core-tools/',                         desc: 'Free SPC reference — Cp/Cpk, control charts, WECO rules' },
    ],
  },
  msa: {
    videos: [
      { title: 'IATF 16949 Core Tools — MSA Focus',      url: 'https://www.youtube.com/watch?v=JQcagDtvkJw',   desc: 'MSA GRR, %GRR acceptance criteria, ndc explained for IATF' },
      { title: '5 Core Tools Explained — MSA included',  url: 'https://www.youtube.com/watch?v=A1YZ17eH5FQ',   desc: 'GRR repeatability vs reproducibility, bias, linearity, stability' },
      { title: '6 Core Tools — MSA in the Sequence',     url: 'https://www.youtube.com/watch?v=o19HNCytI2Q',   desc: 'MSA before PPAP — how GRR results affect process capability' },
      { title: 'IATF 16949 CORE TOOLS Full Overview',    url: 'https://www.youtube.com/watch?v=7AVWDtf7xr4',   desc: 'MSA 4th Edition — 5 study types, PPAP MSA requirements' },
      { title: '6 Core Quality Tools Explained',         url: 'https://www.youtube.com/watch?v=csOTpzAd-Ko',   desc: 'MSA importance — gauge validation, measurement uncertainty' },
      { title: 'Core Tools Full Playlist',               url: 'https://www.youtube.com/playlist?list=PLLT3E3dwispxZBDrGTORfN3c5pNNRZ9sK', desc: 'Full playlist — APQP, CP, PPAP, MSA, SPC, FMEA' },
    ],
    websites: [
      { title: 'AIAG — MSA Manual 4th Edition',    url: 'https://www.aiag.org/expertise-areas/quality/quality-core-tools',    desc: 'Official AIAG MSA 4th Edition — GRR, bias, linearity, stability' },
      { title: 'AIAG — All Manuals',              url: 'https://www.aiag.org/training-and-resources/manuals',                 desc: 'AIAG MSA manual, GRR study forms, %GRR tables, ndc' },
      { title: 'AIAG — IATF 16949 Resources',      url: 'https://www.aiag.org/expertise-areas/quality/iatf-16949-2016',       desc: 'IATF clause 7.1.5.1 — MSA & measurement system requirements' },
      { title: 'MS Matter — MSA in IATF Guide',   url: 'https://msmatter.co.uk/iatf-16949-navigating-the-core-tools-apqp-ppap-fmea-msa-and-spc/', desc: 'Free guide: MSA requirements within IATF 16949' },
      { title: 'Quality-One — MSA Reference',     url: 'https://quality-one.com/quality-core-tools/',                         desc: 'Free MSA reference — GRR interpretation, acceptance criteria' },
    ],
  },
};

// -- Component -----------------------------------------------------------------
export default function CopilotFullPage({ tool }: { tool: ToolKey }) {
  const meta    = TOOL_META[tool] ?? { label: tool.toUpperCase(), icon: '🤖', color: '#6366f1' };
  const tabs    = TOOL_TABS[tool] ?? ['overview'];
  const learn   = LEARN[tool];

  const [activeTab,     setActiveTab]     = useState(tabs[0]);
  const [leftSection,   setLeftSection]   = useState<'topics' | 'learn'>('topics');
  const [input,         setInput]         = useState('');
  const [thinking,      setThinking]      = useState(false);
  const [messages,      setMessages]      = useState<Message[]>([{
    id: '0', role: 'assistant', ts: now(),
    title: `${meta.label} AI Copilot`,
    text: `**${meta.label} AI Quality Copilot** ${meta.icon}\n\nI have 40+ years of quality expertise built in. Ask me anything about ${meta.label} — requirements, audit prep, calculations, best practices, or how to fix specific problems.\n\nSelect a topic on the left or type your question below. Switch to **📺 Learn** to access YouTube tutorials and reference websites.`,
  }]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLInputElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinking]);

  const prompts: string[] = CONTEXT_PROMPTS[`${tool}:${activeTab}`] ?? [
    `What is ${meta.label}?`, `Key requirements?`, `Common audit findings?`, `Best practices?`,
  ];

  function send(text: string) {
    if (!text.trim() || thinking) return;
    const userMsg: Message = { id: Date.now().toString(), role: 'user', text: text.trim(), ts: now() };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setThinking(true);
    setTimeout(() => {
      const { title, response } = getResponse(text);
      const resources = getResourceLinks(tool);
      const aiMsg: Message = { id: (Date.now() + 1).toString(), role: 'assistant', title, text: response + resources, ts: now() };
      setMessages(prev => [...prev, aiMsg]);
      setThinking(false);
    }, 600 + Math.random() * 400);
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', display: 'flex', flexDirection: 'column' }}>

      {/* -- Header ----------------------------------------------------------- */}
      <div style={{
        background: 'linear-gradient(135deg,#0f172a 0%,#1e2a5a 50%,#162044 100%)',
        padding: '20px 32px', position: 'relative', overflow: 'hidden',
      }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.035, backgroundImage: 'radial-gradient(circle,#fff 1px,transparent 1px)', backgroundSize: '24px 24px', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '1px', background: 'linear-gradient(90deg,transparent,#6366f160,transparent)' }} />

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px', position: 'relative' }}>
          <div style={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)', borderRadius: '14px', padding: '12px', fontSize: '26px', flexShrink: 0 }}>🤖</div>
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <h1 style={{ color: '#fff', fontSize: '20px', fontWeight: 800, margin: 0 }}>{meta.label} AI Quality Copilot</h1>
              <span style={{ background: '#6366f1', color: '#fff', fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px' }}>AI</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', marginLeft: '4px' }}>
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#4ade80', display: 'inline-block' }} />
                <span style={{ color: '#4ade80', fontSize: '11px', fontWeight: 600 }}>Live</span>
              </span>
            </div>
            <p style={{ color: '#a5b4fc', fontSize: '12px', margin: 0 }}>
              IATF 16949 · AIAG {meta.label} · 40+ Years Expertise · YouTube Tutorials · Reference Websites
            </p>
          </div>
          <div style={{ display: 'flex', gap: '8px' }}>
            <a href="https://www.youtube.com/@qmbtraining" target="_blank" rel="noopener noreferrer" style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(255,0,0,0.15)', border: '1px solid rgba(255,80,80,0.3)',
              color: '#fca5a5', borderRadius: '10px', padding: '7px 12px',
              fontSize: '11px', fontWeight: 600, textDecoration: 'none',
            }}>▶ QMB Training</a>
            <Link href={TOOL_PAGE[tool] ?? '/'} style={{
              display: 'flex', alignItems: 'center', gap: '5px',
              background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)',
              color: '#c7d2fe', borderRadius: '10px', padding: '7px 12px',
              fontSize: '11px', fontWeight: 600, textDecoration: 'none',
            }}>📖 {meta.label} Page</Link>
          </div>
        </div>
      </div>

      {/* -- Body ------------------------------------------------------------- */}
      <div style={{ flex: 1, display: 'flex', gap: 0, overflow: 'hidden', height: 'calc(100vh - 88px)' }}>

        {/* -- Left panel --------------------------------------------------- */}
        <div style={{
          width: '290px', flexShrink: 0,
          background: '#0f172a', borderRight: '1px solid rgba(99,102,241,0.15)',
          display: 'flex', flexDirection: 'column', overflowY: 'auto',
        }}>
          {/* Section toggle */}
          <div style={{ padding: '10px 12px', borderBottom: '1px solid rgba(99,102,241,0.15)', display: 'flex', gap: '6px' }}>
            <button onClick={() => setLeftSection('topics')} style={{
              flex: 1, padding: '7px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700,
              background: leftSection === 'topics' ? '#6366f1' : 'rgba(99,102,241,0.1)',
              color: leftSection === 'topics' ? '#fff' : '#64748b',
            }}>🧠 Topics</button>
            <button onClick={() => setLeftSection('learn')} style={{
              flex: 1, padding: '7px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 700,
              background: leftSection === 'learn' ? '#dc2626' : 'rgba(220,38,38,0.1)',
              color: leftSection === 'learn' ? '#fff' : '#94a3b8',
            }}>📺 Learn</button>
          </div>

          {/* -- TOPICS section ---------------------------------------------- */}
          {leftSection === 'topics' && (
            <>
              <div style={{ padding: '12px 14px', borderBottom: '1px solid rgba(99,102,241,0.1)' }}>
                <div style={{ color: '#a5b4fc', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>Knowledge Topics</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                  {tabs.map(tab => (
                    <button key={tab} onClick={() => setActiveTab(tab)} style={{
                      textAlign: 'left', padding: '7px 10px', borderRadius: '8px', border: 'none',
                      background: activeTab === tab ? 'rgba(99,102,241,0.25)' : 'transparent',
                      color: activeTab === tab ? '#c7d2fe' : '#64748b',
                      fontSize: '12px', fontWeight: activeTab === tab ? 700 : 400,
                      cursor: 'pointer', transition: 'all 0.15s',
                      borderLeft: activeTab === tab ? '2px solid #6366f1' : '2px solid transparent',
                    }}>{tab.charAt(0).toUpperCase() + tab.slice(1)}</button>
                  ))}
                </div>
              </div>
              <div style={{ padding: '12px 14px', flex: 1 }}>
                <div style={{ color: '#a5b4fc', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>Quick Questions</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  {prompts.map(p => (
                    <button key={p} onClick={() => send(p)} style={{
                      textAlign: 'left', padding: '8px 10px', borderRadius: '8px',
                      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                      color: '#94a3b8', fontSize: '11px', cursor: 'pointer', lineHeight: 1.4,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { const b = e.target as HTMLButtonElement; b.style.background = 'rgba(99,102,241,0.18)'; b.style.color = '#c7d2fe'; }}
                    onMouseLeave={e => { const b = e.target as HTMLButtonElement; b.style.background = 'rgba(99,102,241,0.08)'; b.style.color = '#94a3b8'; }}
                    >💬 {p}</button>
                  ))}
                </div>
              </div>
              <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(99,102,241,0.1)', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                {['IATF 16949','AIAG','VDA','ISO 9001','8D','CAPA'].map(b => (
                  <span key={b} style={{ fontSize: '9px', padding: '2px 6px', borderRadius: '10px', background: 'rgba(99,102,241,0.1)', color: '#6366f1', border: '1px solid rgba(99,102,241,0.2)' }}>{b}</span>
                ))}
              </div>
            </>
          )}

          {/* -- LEARN section ----------------------------------------------- */}
          {leftSection === 'learn' && (
            <div style={{ flex: 1, overflowY: 'auto', padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: '14px' }}>

              {/* YouTube Channels */}
              <div>
                <div style={{ color: '#fca5a5', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>▶ YouTube Channels</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {COMMON_CHANNELS.map(ch => (
                    <a key={ch.url} href={ch.url} target="_blank" rel="noopener noreferrer" style={{
                      display: 'block', padding: '8px 10px', borderRadius: '8px',
                      background: 'rgba(220,38,38,0.08)', border: '1px solid rgba(220,38,38,0.2)',
                      textDecoration: 'none', transition: 'all 0.15s',
                    }}>
                      <div style={{ color: '#fca5a5', fontSize: '11px', fontWeight: 700 }}>▶ {ch.title}</div>
                      <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px', lineHeight: 1.4 }}>{ch.desc}</div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Tool-Specific Videos */}
              <div>
                <div style={{ color: '#fca5a5', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>🎬 {meta.label} Videos</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {learn.videos.map(v => (
                    <a key={v.url} href={v.url} target="_blank" rel="noopener noreferrer" style={{
                      display: 'block', padding: '8px 10px', borderRadius: '8px',
                      background: 'rgba(220,38,38,0.06)', border: '1px solid rgba(220,38,38,0.15)',
                      textDecoration: 'none', transition: 'all 0.15s',
                    }}>
                      <div style={{ color: '#f87171', fontSize: '11px', fontWeight: 600 }}>▶ {v.title}</div>
                      <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px', lineHeight: 1.4 }}>{v.desc}</div>
                    </a>
                  ))}
                </div>
              </div>

              {/* Reference Websites */}
              <div>
                <div style={{ color: '#a5b4fc', fontSize: '10px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '7px' }}>🌐 Reference Websites</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                  {learn.websites.map(w => (
                    <a key={w.url} href={w.url} target="_blank" rel="noopener noreferrer" style={{
                      display: 'block', padding: '8px 10px', borderRadius: '8px',
                      background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)',
                      textDecoration: 'none', transition: 'all 0.15s',
                    }}>
                      <div style={{ color: '#a5b4fc', fontSize: '11px', fontWeight: 600 }}>🔗 {w.title}</div>
                      <div style={{ color: '#64748b', fontSize: '10px', marginTop: '2px', lineHeight: 1.4 }}>{w.desc}</div>
                    </a>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* -- Right panel — Chat -------------------------------------------- */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f1f5f9' }}>

          {/* Chat header */}
          <div style={{ padding: '12px 20px', background: '#fff', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px' }}>🤖</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: '13px', color: '#0f172a' }}>{meta.label} AI Copilot</div>
              <div style={{ fontSize: '11px', color: '#64748b' }}>
                {leftSection === 'topics'
                  ? `📍 ${activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} — ${meta.label} Knowledge`
                  : `📺 Learn mode — switch to Topics to ask questions`}
              </div>
            </div>
            <button onClick={() => setMessages([{ id: Date.now().toString(), role: 'assistant', ts: now(), title: 'Chat Cleared', text: `Chat cleared. Ready to help with **${meta.label}**. Select a topic or type your question.` }])}
              style={{ marginLeft: 'auto', padding: '5px 12px', borderRadius: '8px', background: '#f1f5f9', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '11px', cursor: 'pointer' }}>
              🗑 Clear
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {messages.map(msg => (
              <div key={msg.id} style={{ display: 'flex', flexDirection: 'column', alignItems: msg.role === 'user' ? 'flex-end' : 'flex-start', maxWidth: '80%', alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.title && msg.role === 'assistant' && (
                  <div style={{ fontSize: '9px', color: '#6366f1', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px', paddingLeft: '2px' }}>{msg.title}</div>
                )}
                <div style={{
                  padding: '11px 15px', borderRadius: msg.role === 'user' ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                  background: msg.role === 'user' ? 'linear-gradient(135deg,#6366f1,#818cf8)' : '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                  border: msg.role === 'assistant' ? '1px solid #e2e8f0' : 'none',
                  color: msg.role === 'user' ? '#fff' : '#1e293b',
                  fontSize: '13px', lineHeight: 1.65,
                }}>
                  <p style={{ margin: 0 }} dangerouslySetInnerHTML={{ __html: formatText(msg.text) }} />
                </div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '3px', padding: '0 3px' }}>{msg.ts}</div>
              </div>
            ))}
            {thinking && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 14px', background: '#fff', borderRadius: '16px 16px 16px 4px', border: '1px solid #e2e8f0', boxShadow: '0 1px 4px rgba(0,0,0,0.08)', width: 'fit-content' }}>
                {[0,1,2].map(i => (<div key={i} style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#6366f1', animation: `bounce 0.9s ${i * 0.15}s infinite` }} />))}
                <span style={{ fontSize: '11px', color: '#94a3b8', marginLeft: '4px' }}>Analysing...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div style={{ padding: '14px 20px', background: '#fff', borderTop: '1px solid #e2e8f0' }}>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
              <input
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input); } }}
                placeholder={`Ask anything about ${meta.label}... (e.g. "What is Cpk requirement for PPAP?")`}
                style={{ flex: 1, background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '12px', padding: '10px 16px', color: '#1e293b', fontSize: '13px', outline: 'none' }}
              />
              <button onClick={() => send(input)} disabled={!input.trim() || thinking} style={{
                padding: '10px 20px', borderRadius: '12px', border: 'none', flexShrink: 0,
                background: input.trim() && !thinking ? 'linear-gradient(135deg,#6366f1,#818cf8)' : '#e2e8f0',
                color: input.trim() && !thinking ? '#fff' : '#94a3b8',
                fontSize: '13px', fontWeight: 700, cursor: input.trim() && !thinking ? 'pointer' : 'not-allowed', transition: 'all 0.2s',
              }}>Send ➤</button>
            </div>
            <div style={{ marginTop: '8px', fontSize: '10px', color: '#94a3b8', textAlign: 'center' }}>
              Powered by QMOS Quality Intelligence · AIAG Core Tools · QMB Training · IATF 16949
            </div>
          </div>
        </div>
      </div>

      <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-6px)} }`}</style>
    </div>
  );
}
