'use client';
import { useState, useMemo } from 'react';
import PageTitle from '../components/PageTitle';
import QualityCopilot from '../components/QualityCopilot';

// -- Types ---------------------------------------------------------------------
type EventType = 'audit' | 'calibration' | 'customer-visit' | 'management-review' | 'training' | 'certification' | 'scar-due' | 'ppap' | 'holiday';

interface QEvent {
  id: string;
  title: string;
  type: EventType;
  date: string;
  endDate?: string;
  time?: string;
  location?: string;
  owner: string;
  department: string;
  description: string;
  status: 'upcoming' | 'completed' | 'overdue' | 'cancelled';
  priority: 'high' | 'medium' | 'low';
  checklist?: string[];
  linkedRef?: string;
}

// -- Constants -----------------------------------------------------------------
const TYPE_META: Record<EventType, { label: string; icon: string; color: string; bg: string; dot: string }> = {
  'audit':             { label: 'Audit',           icon: '🔍', color: 'text-blue-600',    bg: 'bg-[#eff6ff] border-blue-700/50',     dot: 'bg-blue-500' },
  'calibration':       { label: 'Calibration',     icon: '📏', color: 'text-yellow-600',  bg: 'bg-yellow-900/30 border-yellow-700/50', dot: 'bg-yellow-500' },
  'customer-visit':    { label: 'Customer Visit',  icon: '🤝', color: 'text-orange-600',  bg: 'bg-orange-900/30 border-orange-700/50', dot: 'bg-orange-500' },
  'management-review': { label: 'Mgmt Review',     icon: '📊', color: 'text-purple-600',  bg: 'bg-purple-900/30 border-purple-700/50', dot: 'bg-purple-500' },
  'training':          { label: 'Training',        icon: '🎓', color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-200',dot: 'bg-emerald-500' },
  'certification':     { label: 'Certification',   icon: '🏅', color: 'text-pink-600',    bg: 'bg-pink-50 border-pink-700/50',     dot: 'bg-pink-500' },
  'scar-due':          { label: 'SCAR Due',        icon: '📨', color: 'text-red-600',     bg: 'bg-red-50 border-red-700/50',       dot: 'bg-red-500' },
  'ppap':              { label: 'PPAP / Launch',   icon: '🚀', color: 'text-cyan-600',    bg: 'bg-cyan-900/30 border-cyan-700/50',     dot: 'bg-cyan-500' },
  'holiday':           { label: 'Holiday',         icon: '🎉', color: 'text-[#1e3a5f]',   bg: 'bg-white border-[#dbeafe]',      dot: 'bg-slate-500' },
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// -- Sample Data ---------------------------------------------------------------
const SAMPLE_EVENTS: QEvent[] = [
  { id: 'E001', title: 'Internal Audit — Manufacturing & Process Quality', type: 'audit', date: '2025-01-20', endDate: '2025-01-21', time: '09:00', location: 'Shop Floor / Conference Room', owner: 'Priya Nair', department: 'Quality', description: 'Bi-annual internal audit covering IATF Cl. 8.5, 8.5.1, 8.5.6. Scope: Line-1, Line-2, Line-3 process quality, control plans, poka-yoke, 4M controls.', status: 'completed', priority: 'high', checklist: ['Audit plan issued to auditees','Checklists prepared','Opening meeting done','Shop floor audit completed','Closing meeting & findings issued'], linkedRef: 'AUDIT-2025-IA-001' },
  { id: 'E002', title: 'Calibration Due — Batch 1 (Vernier, Micrometers)', type: 'calibration', date: '2025-01-15', time: '08:00', location: 'Metrology Lab', owner: 'Deepak Yadav', department: 'Quality', description: '8 instruments due for calibration: VC-01 to VC-04 (Vernier), MC-01 to MC-04 (Micrometers). External lab — Precision Cal Services.', status: 'overdue', priority: 'high', checklist: ['Remove instruments from service','Package and dispatch to lab','Receive calibration certificates','Update calibration register','Return to service with sticker'], linkedRef: 'CAL-2025-JAN-B1' },
  { id: 'E003', title: 'Customer Visit — TML QA Team (Annual Supplier Audit)', type: 'customer-visit', date: '2025-01-28', endDate: '2025-01-29', time: '10:00', location: 'Plant — All Departments', owner: 'Priya Nair', department: 'Quality', description: 'Annual TML supplier quality audit covering IATF 8.4.2, VDA 6.3 process audit. All PPAP, control plans, and IATF records to be ready.', status: 'upcoming', priority: 'high', checklist: ['Issue audit prep checklist to all departments','Ensure all PPAP records updated','Control plans at workstation — latest revision','Quality records filed and accessible','Calibration certificates current','Sample products ready for audit inspection'], linkedRef: 'CUST-AUDIT-TML-2025-01' },
  { id: 'E004', title: 'SCAR Due — Precision Fasteners (SNCR-004)', type: 'scar-due', date: '2025-01-21', time: '17:00', location: 'N/A', owner: 'Kiran Desai', department: 'Quality', description: 'SCAR response due from Precision Fasteners for tensile strength failure on M10 Bolt Set. No response received. Escalate to supplier management.', status: 'overdue', priority: 'high', linkedRef: 'SNCR-004' },
  { id: 'E005', title: 'IATF 16949 Surveillance Audit (Certification Body)', type: 'certification', date: '2025-02-10', endDate: '2025-02-11', time: '09:00', location: 'Plant — Full Scope', owner: 'Priya Nair', department: 'Quality', description: '2nd surveillance audit by BSI / TÜV. Scope: full IATF 16949:2016. Focus: management commitment, customer satisfaction, supplier control, continual improvement.', status: 'upcoming', priority: 'high', checklist: ['Self-assessment against all IATF clauses','Previous audit findings closed with evidence','Management review conducted and minuted','Internal audit annual plan complete','KPIs available — 12-month trend','Customer PPM, warranty data ready'], linkedRef: 'CERT-IATF-BSI-2025-SA2' },
  { id: 'E006', title: 'Quarterly Management Review — Q4 2024 Results', type: 'management-review', date: '2025-01-25', time: '14:00', location: 'Conference Room A', owner: 'Priya Nair', department: 'Quality', description: 'Q4 2024 management review. Agenda: KPI performance, customer PPM, audit findings, CAPA status, COQ analysis, resource adequacy. Chaired by Plant Head.', status: 'upcoming', priority: 'high', checklist: ['Prepare KPI summary (all categories)','COQ analysis for Q4','CAPA status report','Audit findings summary','Supplier scorecard Q4','Customer satisfaction data'], linkedRef: 'MR-2025-Q4' },
  { id: 'E007', title: 'IATF Awareness Training — New Operators (Batch 3)', type: 'training', date: '2025-01-30', time: '09:00', location: 'Training Hall', owner: 'Priya Nair', department: 'Quality', description: 'IATF 16949 quality awareness training for 12 new operators joining Line-1 and Line-2. Topics: quality policy, defect recognition, red bin, poka-yoke.', status: 'upcoming', priority: 'medium', linkedRef: 'TRG-2025-JAN-B3' },
  { id: 'E008', title: 'PPAP Submission — PN-9901 New Model Launch', type: 'ppap', date: '2025-02-14', time: '12:00', location: 'Customer Portal / Courier', owner: 'Priya Nair', department: 'Quality', description: 'Level 3 PPAP submission for PN-9901 Housing Assembly — new model for TML. All 18 elements to be submitted with Ppk ≥ 1.67 and PSW signed.', status: 'upcoming', priority: 'high', checklist: ['PFMEA Rev 01 complete','Control plan complete','MSA studies (GRR < 10%)','Dimensional results (30-piece study)','Capability study (Ppk ≥ 1.67)','Sample parts (5 units) packed','PSW signed by QH and Plant Head'], linkedRef: 'PPAP-PN9901-2025' },
  { id: 'E009', title: 'VDA 6.3 Process Audit — Apex Plastics Ltd', type: 'audit', date: '2025-02-20', time: '09:00', location: 'Supplier Plant — Apex Plastics', owner: 'Kiran Desai', department: 'Quality', description: 'VDA 6.3 process audit at Apex Plastics (SUP-017) — rated C after weld spatter repeat NCR. Scope: injection moulding process, mould PM, outgoing inspection.', status: 'upcoming', priority: 'high', linkedRef: 'SUPP-AUDIT-SUP017-2025' },
  { id: 'E010', title: 'Calibration Due — Batch 2 (CMM Fixtures, Gauges)', type: 'calibration', date: '2025-02-05', time: '08:00', location: 'Metrology Lab / External Lab', owner: 'Deepak Yadav', department: 'Quality', description: '6 items due: CMM probe set, 2 go/no-go gauges (GG-01, GG-02), profile gauge PG-01, thread gauge TG-04, bore gauge BG-03.', status: 'upcoming', priority: 'medium', linkedRef: 'CAL-2025-FEB-B2' },
  { id: 'E011', title: 'MSA Training — Deepak Yadav (GRR & Attribute)', type: 'training', date: '2025-02-08', time: '09:00', location: 'Training Hall', owner: 'Priya Nair', department: 'Quality', description: 'Skill gap training: AIAG MSA 4th Ed — GRR study method, Attribute Agreement Analysis, bias, linearity, stability. Target Level 2 competency.', status: 'upcoming', priority: 'medium', linkedRef: 'TRG-MSA-TM04-2025' },
  { id: 'E012', title: 'IATF Certificate Renewal Due', type: 'certification', date: '2025-03-31', location: 'Plant', owner: 'Priya Nair', department: 'Quality', description: 'IATF 16949:2016 certificate expires 31-Mar-2025. Re-certification audit by BSI scheduled in Feb. If no Major NC, certificate renewed automatically.', status: 'upcoming', priority: 'high', linkedRef: 'CERT-IATF-2025' },
  { id: 'E013', title: 'Quarterly Management Review — Q1 2025', type: 'management-review', date: '2025-04-10', time: '14:00', location: 'Conference Room A', owner: 'Priya Nair', department: 'Quality', description: 'Q1 2025 management review. Covers Jan–Mar performance across all KPI categories.', status: 'upcoming', priority: 'high', linkedRef: 'MR-2025-Q1' },
  { id: 'E014', title: 'Plant Holiday — Republic Day', type: 'holiday', date: '2025-01-26', location: 'Plant', owner: 'HR', department: 'All', description: 'National Holiday — Republic Day. Plant closed. No production. Security and maintenance on call.', status: 'upcoming', priority: 'low' },
];

// -- Helpers -------------------------------------------------------------------
function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDay(year: number, month: number)    { return new Date(year, month, 1).getDay(); }
function toYMD(y: number, m: number, d: number)      { return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function todayYMD() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

// -- Event Detail Modal --------------------------------------------------------
function EventModal({ event, onClose }: { event: QEvent; onClose: () => void }) {
  const meta = TYPE_META[event.type];
  const sc: Record<string,string> = { upcoming:'text-blue-600 bg-[#eff6ff]', completed:'text-emerald-600 bg-emerald-50', overdue:'text-red-600 bg-red-50', cancelled:'text-[#1e3a5f] bg-white' };
  return (
      <>
      <PageTitle title="Calendar" />
      <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white border border-[#dbeafe] rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{meta.icon}</span>
            <div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded border ${meta.bg} ${meta.color} inline-block mb-1`}>{meta.label}</span>
              <h3 className="font-semibold text-white text-sm">{event.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-[#1e3a5f] hover:text-white text-xl ml-2">×</button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-3">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${sc[event.status]}`}>{event.status.toUpperCase()}</span>
            <span className="text-[#1e3a5f]">📅 {event.date}{event.endDate ? ` → ${event.endDate}` : ''}</span>
            {event.time && <span className="text-[#1e3a5f]">⏰ {event.time}</span>}
            {event.location && <span className="text-[#1e3a5f]">📍 {event.location}</span>}
          </div>
          <div className="bg-[#eff6ff] rounded-lg p-3 text-[#1e3a5f] text-xs">{event.description}</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-[#eff6ff] rounded-lg p-2"><div className="text-[#1e3a5f]">Owner</div><div className="text-[#0f172a] font-semibold">{event.owner}</div></div>
            <div className="bg-[#eff6ff] rounded-lg p-2"><div className="text-[#1e3a5f]">Department</div><div className="text-[#0f172a] font-semibold">{event.department}</div></div>
            {event.linkedRef && <div className="bg-[#eff6ff] rounded-lg p-2 col-span-2"><div className="text-[#1e3a5f]">Reference</div><div className="text-[#0f172a] font-mono font-semibold">{event.linkedRef}</div></div>}
          </div>
          {event.checklist && (
            <div>
              <div className="text-xs text-[#1e3a5f] mb-2 uppercase tracking-wide">Preparation Checklist</div>
              <div className="space-y-1">
                {event.checklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-[#1e3a5f]">
                    <span className={`mt-0.5 ${event.status === 'completed' ? 'text-emerald-600' : 'text-[#1e3a5f]'}`}>{event.status === 'completed' ? '✅' : '☐'}</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
      </>
  );
}

// -- Tab 1: Calendar Grid ------------------------------------------------------
function CalendarGridTab({ events }: { events: QEvent[] }) {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth());
  const [filterType, setFilterType] = useState('all');
  const [selected, setSelected] = useState<QEvent | null>(null);
  const today = todayYMD();

  const daysInMonth = getDaysInMonth(year, month);
  const firstDay    = getFirstDay(year, month);
  const totalCells  = Math.ceil((firstDay + daysInMonth) / 7) * 7;

  const filtered = useMemo(() => events.filter(e => filterType === 'all' || e.type === filterType), [events, filterType]);

  const eventsByDay = useMemo(() => {
    const m: Record<number, QEvent[]> = {};
    for (let d = 1; d <= daysInMonth; d++) {
      const ymd = toYMD(year, month, d);
      m[d] = filtered.filter(e => e.date === ymd || (e.endDate && ymd >= e.date && ymd <= e.endDate));
    }
    return m;
  }, [filtered, year, month, daysInMonth]);

  function prevMonth() { month === 0 ? (setMonth(11), setYear(y => y-1)) : setMonth(m => m-1); }
  function nextMonth() { month === 11 ? (setMonth(0), setYear(y => y+1)) : setMonth(m => m+1); }

  return (
    <div className="space-y-4">
      {selected && <EventModal event={selected} onClose={() => setSelected(null)} />}
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="w-8 h-8 bg-white border border-[#dbeafe] rounded-lg text-[#1e3a5f] hover:bg-[#dbeafe] transition-colors">‹</button>
          <span className="text-white font-semibold min-w-[160px] text-center">{MONTH_NAMES[month]} {year}</span>
          <button onClick={nextMonth} className="w-8 h-8 bg-white border border-[#dbeafe] rounded-lg text-[#1e3a5f] hover:bg-[#dbeafe] transition-colors">›</button>
        </div>
        <button onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()); }}
          className="px-3 py-1.5 bg-[#dbeafe] hover:bg-[#dbeafe] text-[#1e3a5f] text-xs rounded-lg">Today</button>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-white border border-[#dbeafe] text-[#1e3a5f] text-sm rounded-lg px-3 py-2 ml-auto">
          <option value="all">All Types</option>
          {Object.entries(TYPE_META).map(([v, m]) => <option key={v} value={v}>{m.icon} {m.label}</option>)}
        </select>
      </div>

      <div className="bg-white rounded-xl border border-[#dbeafe] overflow-x-auto">
        <div className="min-w-[560px]">
        <div className="grid grid-cols-7 border-b border-[#dbeafe]">
          {DAY_NAMES.map(d => <div key={d} className="text-center text-xs font-medium text-[#1e3a5f] py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7">
          {Array.from({ length: totalCells }).map((_, i) => {
            const day = i - firstDay + 1;
            const inMonth = day >= 1 && day <= daysInMonth;
            const ymd = inMonth ? toYMD(year, month, day) : '';
            const isToday = ymd === today;
            const dayEvents = inMonth ? (eventsByDay[day] ?? []) : [];
            const isWeekend = i % 7 === 0 || i % 7 === 6;
            return (
              <div key={i} className={`min-h-[90px] border-b border-r border-[#dbeafe] p-1.5 ${!inMonth ? 'bg-[#eff6ff]' : isWeekend ? 'bg-white' : 'bg-white'}`}>
                {inMonth && (
                  <>
                    <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-teal-500 text-white' : 'text-[#1e3a5f]'}`}>{day}</div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(ev => (
                        <button key={ev.id} onClick={() => setSelected(ev)}
                          className={`w-full text-left text-xs px-1.5 py-0.5 rounded truncate border font-medium hover:opacity-80 transition-opacity ${TYPE_META[ev.type].bg} ${TYPE_META[ev.type].color}`}>
                          {TYPE_META[ev.type].icon} {ev.title}
                        </button>
                      ))}
                      {dayEvents.length > 3 && <div className="text-xs text-[#1e3a5f] pl-1">+{dayEvents.length - 3} more</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {Object.entries(TYPE_META).map(([k, m]) => (
          <span key={k} className="flex items-center gap-1.5 text-xs text-[#1e3a5f]">
            <span className={`w-2.5 h-2.5 rounded-sm ${m.dot}`} />{m.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// -- Tab 2: Agenda List --------------------------------------------------------
function AgendaTab({ events }: { events: QEvent[] }) {
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selected, setSelected] = useState<QEvent | null>(null);
  const today = todayYMD();

  const sorted = useMemo(() =>
    [...events]
      .filter(e => (filterType === 'all' || e.type === filterType) && (filterStatus === 'all' || e.status === filterStatus))
      .sort((a, b) => a.date.localeCompare(b.date)),
    [events, filterType, filterStatus]);

  const grouped = useMemo(() => {
    const g: Record<string, QEvent[]> = {};
    sorted.forEach(e => { const k = e.date.substring(0,7); if (!g[k]) g[k]=[]; g[k].push(e); });
    return g;
  }, [sorted]);

  const urgent = useMemo(() =>
    events.filter(e => e.priority === 'high' && e.status === 'upcoming' && e.date >= today)
      .sort((a,b) => a.date.localeCompare(b.date)).slice(0,5),
    [events, today]);

  const sc: Record<string,string> = { upcoming:'text-blue-600 bg-[#eff6ff]', completed:'text-emerald-600 bg-emerald-50', overdue:'text-red-600 bg-red-50', cancelled:'text-[#1e3a5f] bg-white' };

  return (
    <div className="space-y-5">
      {selected && <EventModal event={selected} onClose={() => setSelected(null)} />}

      {urgent.length > 0 && (
        <div className="bg-white rounded-xl border border-yellow-700/40 p-4">
          <div className="text-xs font-bold text-yellow-600 mb-3 uppercase tracking-wide">⚡ Upcoming High-Priority</div>
          <div className="space-y-2">
            {urgent.map(ev => {
              const days = Math.ceil((new Date(ev.date).getTime() - new Date(today).getTime()) / 86400000);
              return (
                <button key={ev.id} onClick={() => setSelected(ev)}
                  className="w-full text-left flex items-center gap-3 hover:bg-white rounded-lg p-2 transition-colors">
                  <span className="text-lg">{TYPE_META[ev.type].icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{ev.title}</div>
                    <div className="text-xs text-[#1e3a5f]">{ev.date} · {ev.owner}</div>
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${days <= 7 ? 'text-red-600' : days <= 14 ? 'text-yellow-600' : 'text-[#1e3a5f]'}`}>
                    {days === 0 ? 'TODAY' : `${days}d`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-white border border-[#dbeafe] text-[#1e3a5f] text-sm rounded-lg px-3 py-2">
          <option value="all">All Types</option>
          {Object.entries(TYPE_META).map(([v, m]) => <option key={v} value={v}>{m.icon} {m.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-white border border-[#dbeafe] text-[#1e3a5f] text-sm rounded-lg px-3 py-2">
          <option value="all">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="overdue">Overdue</option>
          <option value="completed">Completed</option>
        </select>
        <span className="text-xs text-[#1e3a5f] ml-auto self-center">{sorted.length} events</span>
      </div>

      {Object.entries(grouped).map(([key, evs]) => {
        const [y, m] = key.split('-').map(Number);
        return (
          <div key={key}>
            <div className="text-xs font-bold text-teal-600 uppercase tracking-wide mb-2">{MONTH_NAMES[m-1]} {y}</div>
            <div className="space-y-2">
              {evs.map(ev => (
                <button key={ev.id} onClick={() => setSelected(ev)}
                  className="w-full text-left bg-white rounded-xl border border-[#dbeafe] shadow-sm p-4 hover:bg-[#dbeafe]/40 transition-colors">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl">{TYPE_META[ev.type].icon}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${TYPE_META[ev.type].bg} ${TYPE_META[ev.type].color}`}>{TYPE_META[ev.type].label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${sc[ev.status]}`}>{ev.status.toUpperCase()}</span>
                    {ev.priority === 'high' && <span className="text-xs bg-red-50 text-red-600 px-1.5 py-0.5 rounded border border-red-700/50">HIGH</span>}
                    <span className="text-sm font-medium text-white flex-1">{ev.title}</span>
                    <span className="text-xs text-teal-600 shrink-0">{ev.date}{ev.endDate ? ` – ${ev.endDate}` : ''}{ev.time ? ` · ${ev.time}` : ''}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-[#1e3a5f]">
                    <span>👤 {ev.owner}</span>
                    {ev.location && <span>📍 {ev.location}</span>}
                    {ev.linkedRef && <span className="font-mono">{ev.linkedRef}</span>}
                  </div>
                </button>
              ))}
            </div>
          </div>
        );
      })}
      {sorted.length === 0 && <div className="text-center py-12 text-[#1e3a5f]">No events match filters.</div>}
    </div>
  );
}

// -- Tab 3: Annual Audit Plan --------------------------------------------------
function AuditPlanTab() {
  const plan = [
    { month:'Jan', process:'Manufacturing & Process Quality', clauses:'8.5, 8.5.1, 8.5.6', auditor:'Priya Nair', status:'completed', score:82 },
    { month:'Feb', process:'Supplier Quality & Incoming (IQC)', clauses:'8.4, 8.4.1, 8.4.2', auditor:'Kiran Desai', status:'planned', score:0 },
    { month:'Mar', process:'Customer Quality & Complaints', clauses:'8.2.1, 8.2.2, 10.2', auditor:'Priya Nair', status:'planned', score:0 },
    { month:'Apr', process:'Design & APQP / PPAP', clauses:'8.3, 8.3.3, 8.3.4', auditor:'Priya Nair', status:'planned', score:0 },
    { month:'May', process:'Calibration & MSA / Metrology', clauses:'7.1.5, 7.1.5.1', auditor:'Deepak Yadav', status:'planned', score:0 },
    { month:'Jun', process:'Training & Competence', clauses:'7.1.2, 7.2', auditor:'Priya Nair', status:'planned', score:0 },
    { month:'Jul', process:'Document & Record Control', clauses:'7.5, 7.5.1, 7.5.3', auditor:'Priya Nair', status:'planned', score:0 },
    { month:'Aug', process:'Manufacturing — Line 3 & IPQC', clauses:'8.5.1, 8.5.1.1', auditor:'Amit Sharma', status:'planned', score:0 },
    { month:'Sep', process:'CAPA & Continual Improvement', clauses:'10.2, 10.3', auditor:'Priya Nair', status:'planned', score:0 },
    { month:'Oct', process:'Management System & Leadership', clauses:'4, 5, 6, 9.1, 9.3', auditor:'Priya Nair', status:'planned', score:0 },
    { month:'Nov', process:'Outgoing Quality & Logistics', clauses:'8.6, 8.6.1, 8.5.4', auditor:'Suresh Patel', status:'planned', score:0 },
    { month:'Dec', process:'Full QMS Re-audit (Pre-assessment)', clauses:'All Clauses', auditor:'Priya Nair + External', status:'planned', score:0 },
  ];
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-4">
        <p className="text-sm text-[#1e3a5f]">Annual Internal Audit Plan — 2025. One process audit per month. Full IATF scope covered across the year. Aligned to IATF 16949 Cl. 9.2 and 9.2.2.1.</p>
      </div>
      <div className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#dbeafe] bg-white">
                {['Month','Audit Scope / Process','IATF Clauses','Lead Auditor','Status','Score'].map(h => (
                  <th key={h} className={`text-xs text-[#1e3a5f] px-4 py-3 ${h === 'Score' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {plan.map((a, i) => (
                <tr key={i} className="hover:bg-[#dbeafe]/20">
                  <td className="px-4 py-3 font-semibold text-teal-600 whitespace-nowrap">{a.month}</td>
                  <td className="px-4 py-3 text-white">{a.process}</td>
                  <td className="px-4 py-3 text-xs text-[#1e3a5f] font-mono">{a.clauses}</td>
                  <td className="px-4 py-3 text-[#1e3a5f]">{a.auditor}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${a.status === 'completed' ? 'text-emerald-600 bg-emerald-50' : 'text-[#1e3a5f] bg-[#dbeafe]'}`}>
                      {a.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {a.score > 0
                      ? <span className={`font-bold ${a.score >= 85 ? 'text-emerald-600' : a.score >= 70 ? 'text-yellow-600' : 'text-red-600'}`}>{a.score}%</span>
                      : <span className="text-[#1e3a5f]">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// -- Tab 4: Calibration Register -----------------------------------------------
function CalibrationTab() {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const instruments = [
    { id:'VC-01', name:'Vernier Caliper 150mm', make:'Mitutoyo 530-112', range:'0-150mm', location:'Line 1', lastCal:'2025-01-15', nextCal:'2025-07-15', agency:'Precision Cal Svc', cert:'PCS-2025-001', status:'OK', risk:'Low' },
    { id:'VC-02', name:'Vernier Caliper 150mm', make:'Mitutoyo 530-112', range:'0-150mm', location:'Line 2', lastCal:'2025-01-15', nextCal:'2025-07-15', agency:'Precision Cal Svc', cert:'PCS-2025-002', status:'OK', risk:'Low' },
    { id:'VC-03', name:'Vernier Caliper 200mm', make:'Mitutoyo 531-104', range:'0-200mm', location:'Line 3', lastCal:'2025-01-15', nextCal:'2025-07-15', agency:'Precision Cal Svc', cert:'', status:'DUE SOON', risk:'Low' },
    { id:'MC-01', name:'Outside Micrometer 0-25mm', make:'Mitutoyo 103-137', range:'0-25mm', location:'Metrology Lab', lastCal:'2025-01-15', nextCal:'2025-07-15', agency:'External Lab', cert:'EL-2025-011', status:'OK', risk:'Low' },
    { id:'MC-02', name:'Outside Micrometer 25-50mm', make:'Mitutoyo 103-138', range:'25-50mm', location:'Metrology Lab', lastCal:'2025-01-15', nextCal:'2025-07-15', agency:'External Lab', cert:'EL-2025-012', status:'OK', risk:'Low' },
    { id:'GG-01', name:'Go/No-Go Gauge M10', make:'Custom', range:'M10x1.5', location:'Line 3', lastCal:'2025-02-05', nextCal:'2025-08-05', agency:'External Lab', cert:'EL-2025-021', status:'OK', risk:'Medium' },
    { id:'GG-02', name:'Go/No-Go Gauge M12', make:'Custom', range:'M12x1.75', location:'Line 1', lastCal:'2025-02-05', nextCal:'2025-08-05', agency:'External Lab', cert:'EL-2025-022', status:'OK', risk:'Medium' },
    { id:'PG-01', name:'Profile Gauge', make:'Special', range:'Per drawing', location:'Metrology Lab', lastCal:'2025-02-05', nextCal:'2025-08-05', agency:'External Lab', cert:'EL-2025-031', status:'OK', risk:'High' },
    { id:'BG-01', name:'Bore Gauge 20-35mm', make:'Mitutoyo 526-101', range:'20-35mm', location:'Metrology Lab', lastCal:'2024-09-15', nextCal:'2025-03-15', agency:'External Lab', cert:'', status:'OVERDUE', risk:'High' },
    { id:'TG-01', name:'Thread Gauge M8', make:'Standard', range:'M8x1.25', location:'Line 2', lastCal:'2024-09-15', nextCal:'2025-03-15', agency:'External Lab', cert:'', status:'OVERDUE', risk:'Medium' },
    { id:'HM-01', name:'Hardness Tester (Rockwell)', make:'Wilson', range:'HRC 20-70', location:'Metrology Lab', lastCal:'2024-11-15', nextCal:'2025-11-15', agency:'External Lab', cert:'EL-2024-098', status:'OK', risk:'High' },
    { id:'CS-01', name:'CMM Probe Set', make:'Renishaw', range:'Per spec', location:'CMM Room', lastCal:'2024-12-15', nextCal:'2025-12-15', agency:'OEM', cert:'RM-2024-112', status:'OK', risk:'High' },
  ];

  const statusStyle: Record<string,string> = {
    'OK':         'text-emerald-600 bg-emerald-50 border-emerald-200',
    'DUE SOON':   'text-yellow-600 bg-yellow-900/30 border-yellow-700/50',
    'OVERDUE':    'text-red-600 bg-red-50 border-red-700/50',
    'WITHDRAWN':  'text-[#1e3a5f] bg-white border-[#dbeafe]',
  };
  const riskStyle: Record<string,string> = { 'High':'text-red-600', 'Medium':'text-yellow-600', 'Low':'text-emerald-600' };

  const filtered = instruments.filter(i => filterStatus === 'all' || i.status === filterStatus);
  const counts = { total: instruments.length, ok: instruments.filter(i=>i.status==='OK').length, dueSoon: instruments.filter(i=>i.status==='DUE SOON').length, overdue: instruments.filter(i=>i.status==='OVERDUE').length };

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label:'Total Instruments', value: counts.total, color:'text-white', bg:'bg-white border-[#dbeafe]' },
          { label:'Calibrated (OK)', value: counts.ok, color:'text-emerald-600', bg:'bg-emerald-50 border-emerald-200' },
          { label:'Due Soon', value: counts.dueSoon, color:'text-yellow-600', bg:'bg-yellow-900/30 border-yellow-700/50' },
          { label:'Overdue', value: counts.overdue, color:'text-red-600', bg:'bg-red-50 border-red-700/50' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-xl border p-4`}>
            <div className="text-xs text-[#1e3a5f] mb-1">{k.label}</div>
            <div className={`text-3xl font-bold ${k.color}`}>{k.value}</div>
          </div>
        ))}
      </div>

      {counts.overdue > 0 && (
        <div className="bg-red-50 border border-red-700/50 rounded-xl p-4 flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div>
            <p className="font-semibold text-red-600">{counts.overdue} instrument{counts.overdue>1?'s':''} overdue for calibration!</p>
            <p className="text-xs text-red-700 mt-0.5">Overdue instruments must be removed from service immediately per IATF 16949 Cl. 7.1.5.1. All measurements made with these instruments since last calibration date may be suspect.</p>
          </div>
        </div>
      )}

      <div className="flex gap-3 flex-wrap">
        {(['all','OK','DUE SOON','OVERDUE'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s)}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${filterStatus===s ? 'bg-teal-700 border-teal-500 text-white' : 'bg-white border-[#dbeafe] text-[#1e3a5f] hover:text-white'}`}>
            {s === 'all' ? 'All' : s}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#dbeafe] bg-white">
                {['ID','Instrument Name','Make','Range','Location','Last Cal.','Next Cal.','Agency','Status','Risk'].map(h => (
                  <th key={h} className="text-xs text-[#1e3a5f] px-3 py-3 text-left whitespace-nowrap">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filtered.map(inst => (
                <tr key={inst.id} className="hover:bg-[#dbeafe]/20 transition-colors">
                  <td className="px-3 py-3 font-mono text-xs text-teal-600 whitespace-nowrap">{inst.id}</td>
                  <td className="px-3 py-3 text-white text-xs">{inst.name}</td>
                  <td className="px-3 py-3 text-[#1e3a5f] text-xs whitespace-nowrap">{inst.make}</td>
                  <td className="px-3 py-3 text-[#1e3a5f] text-xs whitespace-nowrap">{inst.range}</td>
                  <td className="px-3 py-3 text-[#1e3a5f] text-xs whitespace-nowrap">{inst.location}</td>
                  <td className="px-3 py-3 text-xs text-[#1e3a5f] whitespace-nowrap">{inst.lastCal}</td>
                  <td className="px-3 py-3 text-xs whitespace-nowrap font-medium text-white">{inst.nextCal}</td>
                  <td className="px-3 py-3 text-xs text-[#1e3a5f] whitespace-nowrap">{inst.agency}</td>
                  <td className="px-3 py-3 whitespace-nowrap">
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${statusStyle[inst.status] ?? ''}`}>{inst.status}</span>
                  </td>
                  <td className="px-3 py-3 text-xs font-bold whitespace-nowrap"><span className={riskStyle[inst.risk]}>{inst.risk}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-[#dbeafe] shadow-sm p-4">
        <div className="text-xs font-bold text-teal-600 mb-3 uppercase tracking-wide">📋 Calibration Requirements — IATF 16949 Cl. 7.1.5.1</div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs text-[#1e3a5f]">
          {[
            ['Calibration Interval','Set based on risk, usage frequency, and historical stability. Review annually.'],
            ['Traceability','Calibration must be traceable to national/international measurement standards (NABL).'],
            ['Out-of-Calibration','If found OOC: remove from service, assess impact on previous measurements, notify customers if risk.'],
            ['Certificate Contents','Cal date, due date, instrument ID, pass/fail, calibration values, reference standard used, signature.'],
            ['Recall System','Proactive recall system required — color-coded stickers or database-triggered alerts.'],
            ['Records','Retain calibration records for life of instrument + audit cycle (min 3 years).'],
          ].map(([title, text]) => (
            <div key={title} className="bg-[#eff6ff] rounded-lg p-3">
              <div className="font-semibold text-white mb-1">{title}</div>
              <div className="text-[#1e3a5f]">{text}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// -- Tab 5: Compliance Dashboard -----------------------------------------------
function ComplianceTab({ events }: { events: QEvent[] }) {
  const today = todayYMD();
  const areas = [
    { name:'Internal Audit Programme', clause:'9.2', icon:'🔍', score:85, target:100, status:'On Track', trend:'up', note:'10 of 12 monthly audits completed. Dec audit scheduled.' },
    { name:'Management Review', clause:'9.3', icon:'📊', score:100, target:100, status:'Compliant', trend:'stable', note:'Quarterly MRMs held Jan, Apr, Jul. Oct upcoming.' },
    { name:'Calibration System', clause:'7.1.5.1', icon:'📏', score:75, target:100, status:'Action Needed', trend:'down', note:'2 instruments overdue. Procurement action required.' },
    { name:'IATF Certification Status', clause:'4.4', icon:'🏅', score:90, target:100, status:'On Track', trend:'stable', note:'Surveillance audit passed. Re-certification Feb 2025.' },
    { name:'Training & Competency', clause:'7.2', icon:'🎓', score:80, target:100, status:'On Track', trend:'up', note:'Training plan 80% complete. 3 modules remaining.' },
    { name:'Customer Visit Preparation', clause:'8.2.1', icon:'🤝', score:95, target:100, status:'Compliant', trend:'stable', note:'TML visit prepped. All records reviewed and accessible.' },
    { name:'PPAP Submissions', clause:'8.3.5', icon:'🚀', score:70, target:100, status:'Action Needed', trend:'down', note:'PN-9901 submission due Feb. Dimensional study pending.' },
    { name:'SCAR Closure Rate', clause:'8.4.2', icon:'📨', score:78, target:100, status:'On Track', trend:'up', note:'3 SCARs open. 2 with response, 1 overdue — Precision Fasteners.' },
  ];

  const statusStyle: Record<string,string> = {
    'Compliant':      'text-emerald-600 bg-emerald-50 border-emerald-200',
    'On Track':       'text-blue-600 bg-[#eff6ff] border-blue-700/50',
    'Action Needed':  'text-yellow-600 bg-yellow-900/30 border-yellow-700/50',
    'Critical':       'text-red-600 bg-red-50 border-red-700/50',
  };

  const overallScore = Math.round(areas.reduce((s, a) => s + a.score, 0) / areas.length);

  const upcomingEvents = events.filter(e => e.date >= today && e.status !== 'cancelled').sort((a,b)=>a.date.localeCompare(b.date)).slice(0,5);

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-[#dbeafe] rounded-xl p-5 flex flex-col items-center justify-center">
          <div className="text-5xl font-bold text-white">{overallScore}%</div>
          <div className="text-xs text-[#1e3a5f] mt-1">Overall Compliance Score</div>
          <div className="mt-3 w-full bg-[#dbeafe] rounded-full h-2">
            <div className="h-2 rounded-full transition-all" style={{width:`${overallScore}%`, background: overallScore>=90?'#10b981':overallScore>=75?'#3b82f6':'#f59e0b'}} />
          </div>
          <div className={`text-xs font-bold mt-2 ${overallScore>=90?'text-emerald-600':overallScore>=75?'text-blue-600':'text-yellow-600'}`}>
            {overallScore>=90?'EXCELLENT':overallScore>=75?'GOOD — Monitor':'NEEDS ATTENTION'}
          </div>
        </div>

        <div className="md:col-span-2 bg-white border border-[#dbeafe] rounded-xl p-4">
          <div className="text-xs font-bold text-teal-600 mb-3 uppercase tracking-wide">⚡ Next 5 Critical Events</div>
          {upcomingEvents.length === 0
            ? <div className="text-xs text-[#1e3a5f]">Load sample data to see upcoming events.</div>
            : <div className="space-y-2">
                {upcomingEvents.map(ev => {
                  const days = Math.ceil((new Date(ev.date).getTime() - new Date(today).getTime()) / 86400000);
                  return (
                    <div key={ev.id} className="flex items-center gap-3 p-2 rounded-lg bg-[#eff6ff]">
                      <span className="text-lg">{TYPE_META[ev.type].icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white truncate">{ev.title}</div>
                        <div className="text-xs text-[#1e3a5f]">{ev.date} · {ev.owner}</div>
                      </div>
                      <span className={`text-xs font-bold shrink-0 ${days<=7?'text-red-600':days<=14?'text-yellow-600':'text-teal-600'}`}>
                        {days===0?'TODAY':`${days}d`}
                      </span>
                    </div>
                  );
                })}
              </div>
          }
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {areas.map(area => (
          <div key={area.name} className="bg-white border border-[#dbeafe] rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="text-lg">{area.icon}</span>
                <div>
                  <div className="text-sm font-semibold text-white">{area.name}</div>
                  <div className="text-xs text-[#1e3a5f] font-mono">IATF Cl. {area.clause}</div>
                </div>
              </div>
              <span className={`text-xs px-2 py-0.5 rounded border font-medium shrink-0 ${statusStyle[area.status] ?? ''}`}>{area.status}</span>
            </div>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex-1 bg-[#dbeafe] rounded-full h-2">
                <div className="h-2 rounded-full transition-all" style={{width:`${area.score}%`, background: area.score>=90?'#10b981':area.score>=75?'#3b82f6':area.score>=50?'#f59e0b':'#ef4444'}} />
              </div>
              <span className={`text-sm font-bold min-w-[3rem] text-right ${area.score>=90?'text-emerald-600':area.score>=75?'text-blue-600':area.score>=50?'text-yellow-600':'text-red-600'}`}>{area.score}%</span>
            </div>
            <div className="text-xs text-[#1e3a5f]">{area.note}</div>
          </div>
        ))}
      </div>
    </div>
  );
}


// -- Main Page -----------------------------------------------------------------
export default function CalendarPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [events, setEvents] = useState<QEvent[]>(SAMPLE_EVENTS);
  const [loaded, setLoaded] = useState(true);
  const today = todayYMD();

  const stats = useMemo(() => ({
    thisMonth:   events.filter(e => e.date.startsWith(today.substring(0,7))).length,
    upcoming:    events.filter(e => e.date >= today && e.status !== 'cancelled').length,
    highPriority:events.filter(e => e.priority === 'high' && e.date >= today && e.status === 'upcoming').length,
    overdue:     events.filter(e => e.status === 'overdue' || (e.date < today && e.status === 'upcoming')).length,
  }), [events, today]);

  const tabs = ['📅 Calendar', '📋 Agenda', '🔍 Audit Plan', '📏 Calibration', '📊 Compliance'];

  return (
    <div className="min-h-screen bg-[#eff6ff]">
      <div className="bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">📅</span>
                <h1 className="text-2xl font-bold text-white">Quality Calendar</h1>
              </div>
              <p className="text-[#1e3a5f] text-sm">Audits · Calibration · Customer Visits · Management Reviews · Training · Certifications · PPAP Deadlines</p>
            </div>
            <button onClick={() => { if (!loaded) { setEvents(SAMPLE_EVENTS); setLoaded(true); } else { setEvents([]); setLoaded(false); } }}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white text-sm rounded-lg font-medium transition-colors">
              {loaded ? '🗑 Clear Sample' : '⚡ Load Sample Data'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label:'This Month',    value: events.length ? `${stats.thisMonth}` : '—',    color:'text-white' },
              { label:'Upcoming',      value: events.length ? `${stats.upcoming}` : '—',     color:'text-blue-600' },
              { label:'High Priority', value: events.length ? `${stats.highPriority}` : '—', color:'text-orange-600' },
              { label:'Overdue',       value: events.length ? `${stats.overdue}` : '—',      color: stats.overdue > 0 ? 'text-red-600' : 'text-emerald-600' },
            ].map(s => (
              <div key={s.label} className="bg-[#eff6ff] rounded-lg p-3 border border-[#dbeafe]">
                <div className="text-xs text-[#1e3a5f] mb-1">{s.label}</div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* -- DOWNLOADS ----------------------------------------------- */}
      <div className="flex flex-wrap gap-2 items-center p-3 rounded-b-none rounded-t-none px-6 mb-0" style={{background:'#f1f5f9'}}>
        <span className="text-white text-xs font-bold mr-1">&#128229; Downloads:</span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0891b2'}}><a href="/downloads/calendar/Annual_Quality_Calendar.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Annual Calendar XLS">Annual Calendar XLS</a><a href="/downloads/calendar/Annual_Quality_Calendar.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Annual Calendar XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#1e40af'}}><a href="/downloads/calendar/Internal_Audit_Plan_Template.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Audit Plan XLS">Audit Plan XLS</a><a href="/downloads/calendar/Internal_Audit_Plan_Template.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Audit Plan XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#0d9488'}}><a href="/downloads/calendar/Calibration_Register.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Calibration Register XLS">Calibration Register XLS</a><a href="/downloads/calendar/Calibration_Register.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Calibration Register XLS">⬇</a></span>
        <span className="inline-flex items-center rounded-lg overflow-hidden text-xs font-bold" style={{background:'#dc2626'}}><a href="/downloads/calendar/Calibration_Due_Tracker.xlsx" target="_blank" rel="noopener noreferrer" className="inline-flex items-center px-3 py-1 text-white no-underline hover:brightness-110" title="View Cal Due Tracker XLS">Cal Due Tracker XLS</a><a href="/downloads/calendar/Calibration_Due_Tracker.xlsx" download className="inline-flex items-center px-2 py-1 text-white no-underline border-l border-white/20 hover:brightness-110" title="Download Cal Due Tracker XLS">⬇</a></span>
      </div>

      <div className="border-b border-[#dbeafe] bg-white px-6">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === i ? 'border-teal-500 text-teal-600' : 'border-transparent text-[#1e3a5f] hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 0 && <CalendarGridTab events={events} />}
        {activeTab === 1 && <AgendaTab events={events} />}
        {activeTab === 2 && <AuditPlanTab />}
        {activeTab === 3 && <CalibrationTab />}
        {activeTab === 4 && <ComplianceTab events={events} />}
      </div>
      <QualityCopilot page="calendar" />
    </div>
  );
}