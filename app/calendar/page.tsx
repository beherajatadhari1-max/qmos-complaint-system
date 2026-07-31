'use client';
import { useState, useMemo } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────
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

// ── Constants ─────────────────────────────────────────────────────────────────
const TYPE_META: Record<EventType, { label: string; icon: string; color: string; bg: string; dot: string }> = {
  'audit':             { label: 'Audit',           icon: '🔍', color: 'text-blue-400',    bg: 'bg-blue-900/40 border-blue-700/50',     dot: 'bg-blue-500' },
  'calibration':       { label: 'Calibration',     icon: '📏', color: 'text-yellow-400',  bg: 'bg-yellow-900/40 border-yellow-700/50', dot: 'bg-yellow-500' },
  'customer-visit':    { label: 'Customer Visit',  icon: '🤝', color: 'text-orange-400',  bg: 'bg-orange-900/40 border-orange-700/50', dot: 'bg-orange-500' },
  'management-review': { label: 'Mgmt Review',     icon: '📊', color: 'text-purple-400',  bg: 'bg-purple-900/40 border-purple-700/50', dot: 'bg-purple-500' },
  'training':          { label: 'Training',        icon: '🎓', color: 'text-emerald-400', bg: 'bg-emerald-900/40 border-emerald-700/50',dot: 'bg-emerald-500' },
  'certification':     { label: 'Certification',   icon: '🏅', color: 'text-pink-400',    bg: 'bg-pink-900/40 border-pink-700/50',     dot: 'bg-pink-500' },
  'scar-due':          { label: 'SCAR Due',        icon: '📨', color: 'text-red-400',     bg: 'bg-red-900/40 border-red-700/50',       dot: 'bg-red-500' },
  'ppap':              { label: 'PPAP / Launch',   icon: '🚀', color: 'text-cyan-400',    bg: 'bg-cyan-900/40 border-cyan-700/50',     dot: 'bg-cyan-500' },
  'holiday':           { label: 'Holiday',         icon: '🎉', color: 'text-slate-400',   bg: 'bg-slate-700/50 border-slate-600',      dot: 'bg-slate-500' },
};

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const DAY_NAMES   = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

// ── Sample Data ───────────────────────────────────────────────────────────────
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

// ── Helpers ───────────────────────────────────────────────────────────────────
function getDaysInMonth(year: number, month: number) { return new Date(year, month + 1, 0).getDate(); }
function getFirstDay(year: number, month: number)    { return new Date(year, month, 1).getDay(); }
function toYMD(y: number, m: number, d: number)      { return `${y}-${String(m + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
function todayYMD() { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }

// ── Event Detail Modal ────────────────────────────────────────────────────────
function EventModal({ event, onClose }: { event: QEvent; onClose: () => void }) {
  const meta = TYPE_META[event.type];
  const sc: Record<string,string> = { upcoming:'text-blue-400 bg-blue-900/30', completed:'text-emerald-400 bg-emerald-900/30', overdue:'text-red-400 bg-red-900/30', cancelled:'text-slate-500 bg-slate-800' };
  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-slate-800 border border-slate-600 rounded-2xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{meta.icon}</span>
            <div>
              <span className={`text-xs font-medium px-2 py-0.5 rounded border ${meta.bg} ${meta.color} inline-block mb-1`}>{meta.label}</span>
              <h3 className="font-semibold text-white text-sm">{event.title}</h3>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-500 hover:text-white text-xl ml-2">×</button>
        </div>
        <div className="space-y-3 text-sm">
          <div className="flex flex-wrap gap-3">
            <span className={`text-xs px-2 py-0.5 rounded font-medium ${sc[event.status]}`}>{event.status.toUpperCase()}</span>
            <span className="text-slate-400">📅 {event.date}{event.endDate ? ` → ${event.endDate}` : ''}</span>
            {event.time && <span className="text-slate-400">⏰ {event.time}</span>}
            {event.location && <span className="text-slate-400">📍 {event.location}</span>}
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-slate-300 text-xs">{event.description}</div>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-slate-900/50 rounded-lg p-2"><div className="text-slate-500">Owner</div><div className="text-white">{event.owner}</div></div>
            <div className="bg-slate-900/50 rounded-lg p-2"><div className="text-slate-500">Department</div><div className="text-white">{event.department}</div></div>
            {event.linkedRef && <div className="bg-slate-900/50 rounded-lg p-2 col-span-2"><div className="text-slate-500">Reference</div><div className="text-white font-mono">{event.linkedRef}</div></div>}
          </div>
          {event.checklist && (
            <div>
              <div className="text-xs text-slate-500 mb-2 uppercase tracking-wide">Preparation Checklist</div>
              <div className="space-y-1">
                {event.checklist.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                    <span className={`mt-0.5 ${event.status === 'completed' ? 'text-emerald-400' : 'text-slate-600'}`}>{event.status === 'completed' ? '✅' : '☐'}</span>
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Tab 1: Calendar Grid ──────────────────────────────────────────────────────
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
          <button onClick={prevMonth} className="w-8 h-8 bg-slate-800 border border-slate-600 rounded-lg text-white hover:bg-slate-700 transition-colors">‹</button>
          <span className="text-white font-semibold min-w-[160px] text-center">{MONTH_NAMES[month]} {year}</span>
          <button onClick={nextMonth} className="w-8 h-8 bg-slate-800 border border-slate-600 rounded-lg text-white hover:bg-slate-700 transition-colors">›</button>
        </div>
        <button onClick={() => { setMonth(now.getMonth()); setYear(now.getFullYear()); }}
          className="px-3 py-1.5 bg-slate-700 hover:bg-slate-600 text-white text-xs rounded-lg">Today</button>
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2 ml-auto">
          <option value="all">All Types</option>
          {Object.entries(TYPE_META).map(([v, m]) => <option key={v} value={v}>{m.icon} {m.label}</option>)}
        </select>
      </div>

      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="grid grid-cols-7 border-b border-slate-700">
          {DAY_NAMES.map(d => <div key={d} className="text-center text-xs font-medium text-slate-500 py-2">{d}</div>)}
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
              <div key={i} className={`min-h-[90px] border-b border-r border-slate-700/50 p-1.5 ${!inMonth ? 'bg-slate-900/30' : isWeekend ? 'bg-slate-800/30' : 'bg-slate-800'}`}>
                {inMonth && (
                  <>
                    <div className={`text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full mb-1 ${isToday ? 'bg-teal-500 text-white' : 'text-slate-400'}`}>{day}</div>
                    <div className="space-y-0.5">
                      {dayEvents.slice(0, 3).map(ev => (
                        <button key={ev.id} onClick={() => setSelected(ev)}
                          className={`w-full text-left text-xs px-1.5 py-0.5 rounded truncate border font-medium hover:opacity-80 transition-opacity ${TYPE_META[ev.type].bg} ${TYPE_META[ev.type].color}`}>
                          {TYPE_META[ev.type].icon} {ev.title}
                        </button>
                      ))}
                      {dayEvents.length > 3 && <div className="text-xs text-slate-500 pl-1">+{dayEvents.length - 3} more</div>}
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        {Object.entries(TYPE_META).map(([k, m]) => (
          <span key={k} className="flex items-center gap-1.5 text-xs text-slate-400">
            <span className={`w-2.5 h-2.5 rounded-sm ${m.dot}`} />{m.label}
          </span>
        ))}
      </div>
    </div>
  );
}

// ── Tab 2: Agenda List ────────────────────────────────────────────────────────
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

  const sc: Record<string,string> = { upcoming:'text-blue-400 bg-blue-900/30', completed:'text-emerald-400 bg-emerald-900/30', overdue:'text-red-400 bg-red-900/30', cancelled:'text-slate-500 bg-slate-800' };

  return (
    <div className="space-y-5">
      {selected && <EventModal event={selected} onClose={() => setSelected(null)} />}

      {urgent.length > 0 && (
        <div className="bg-slate-800 rounded-xl border border-yellow-700/40 p-4">
          <div className="text-xs font-bold text-yellow-400 mb-3 uppercase tracking-wide">⚡ Upcoming High-Priority</div>
          <div className="space-y-2">
            {urgent.map(ev => {
              const days = Math.ceil((new Date(ev.date).getTime() - new Date(today).getTime()) / 86400000);
              return (
                <button key={ev.id} onClick={() => setSelected(ev)}
                  className="w-full text-left flex items-center gap-3 hover:bg-slate-700/30 rounded-lg p-2 transition-colors">
                  <span className="text-lg">{TYPE_META[ev.type].icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white truncate">{ev.title}</div>
                    <div className="text-xs text-slate-400">{ev.date} · {ev.owner}</div>
                  </div>
                  <span className={`text-xs font-bold shrink-0 ${days <= 7 ? 'text-red-400' : days <= 14 ? 'text-yellow-400' : 'text-slate-400'}`}>
                    {days === 0 ? 'TODAY' : `${days}d`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <select value={filterType} onChange={e => setFilterType(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
          <option value="all">All Types</option>
          {Object.entries(TYPE_META).map(([v, m]) => <option key={v} value={v}>{m.icon} {m.label}</option>)}
        </select>
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="bg-slate-800 border border-slate-600 text-white text-sm rounded-lg px-3 py-2">
          <option value="all">All Status</option>
          <option value="upcoming">Upcoming</option>
          <option value="overdue">Overdue</option>
          <option value="completed">Completed</option>
        </select>
        <span className="text-xs text-slate-500 ml-auto self-center">{sorted.length} events</span>
      </div>

      {Object.entries(grouped).map(([key, evs]) => {
        const [y, m] = key.split('-').map(Number);
        return (
          <div key={key}>
            <div className="text-xs font-bold text-teal-400 uppercase tracking-wide mb-2">{MONTH_NAMES[m-1]} {y}</div>
            <div className="space-y-2">
              {evs.map(ev => (
                <button key={ev.id} onClick={() => setSelected(ev)}
                  className="w-full text-left bg-slate-800 rounded-xl border border-slate-700 p-4 hover:bg-slate-700/40 transition-colors">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-xl">{TYPE_META[ev.type].icon}</span>
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium ${TYPE_META[ev.type].bg} ${TYPE_META[ev.type].color}`}>{TYPE_META[ev.type].label}</span>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${sc[ev.status]}`}>{ev.status.toUpperCase()}</span>
                    {ev.priority === 'high' && <span className="text-xs bg-red-900/40 text-red-400 px-1.5 py-0.5 rounded border border-red-700/50">HIGH</span>}
                    <span className="text-sm font-medium text-white flex-1">{ev.title}</span>
                    <span className="text-xs text-teal-400 shrink-0">{ev.date}{ev.endDate ? ` – ${ev.endDate}` : ''}{ev.time ? ` · ${ev.time}` : ''}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-3 text-xs text-slate-500">
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
      {sorted.length === 0 && <div className="text-center py-12 text-slate-500">No events match filters.</div>}
    </div>
  );
}

// ── Tab 3: Annual Audit Plan ──────────────────────────────────────────────────
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
      <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
        <p className="text-sm text-slate-400">Annual Internal Audit Plan — 2025. One process audit per month. Full IATF scope covered across the year. Aligned to IATF 16949 Cl. 9.2 and 9.2.2.1.</p>
      </div>
      <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-700 bg-slate-700/50">
                {['Month','Audit Scope / Process','IATF Clauses','Lead Auditor','Status','Score'].map(h => (
                  <th key={h} className={`text-xs text-slate-400 px-4 py-3 ${h === 'Score' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/50">
              {plan.map((a, i) => (
                <tr key={i} className="hover:bg-slate-700/20">
                  <td className="px-4 py-3 font-semibold text-teal-400 whitespace-nowrap">{a.month}</td>
                  <td className="px-4 py-3 text-white">{a.process}</td>
                  <td className="px-4 py-3 text-xs text-slate-400 font-mono">{a.clauses}</td>
                  <td className="px-4 py-3 text-slate-300">{a.auditor}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${a.status === 'completed' ? 'text-emerald-400 bg-emerald-900/40' : 'text-slate-400 bg-slate-700'}`}>
                      {a.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    {a.score > 0
                      ? <span className={`font-bold ${a.score >= 85 ? 'text-emerald-400' : a.score >= 70 ? 'text-yellow-400' : 'text-red-400'}`}>{a.score}%</span>
                      : <span className="text-slate-600">—</span>}
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

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function CalendarPage() {
  const [activeTab, setActiveTab] = useState(0);
  const [events, setEvents] = useState<QEvent[]>([]);
  const [loaded, setLoaded] = useState(false);
  const today = todayYMD();

  const stats = useMemo(() => ({
    thisMonth:   events.filter(e => e.date.startsWith(today.substring(0,7))).length,
    upcoming:    events.filter(e => e.date >= today && e.status !== 'cancelled').length,
    highPriority:events.filter(e => e.priority === 'high' && e.date >= today && e.status === 'upcoming').length,
    overdue:     events.filter(e => e.status === 'overdue' || (e.date < today && e.status === 'upcoming')).length,
  }), [events, today]);

  const tabs = ['📅 Calendar', '📋 Agenda', '🔍 Audit Plan'];

  return (
    <div className="min-h-screen bg-slate-900 text-white">
      <div className="bg-gradient-to-r from-teal-950/60 to-slate-900 border-b border-slate-700 px-6 py-5">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <span className="text-3xl">📅</span>
                <h1 className="text-2xl font-bold text-white">Quality Calendar</h1>
              </div>
              <p className="text-slate-400 text-sm">Audits · Calibration · Customer Visits · Management Reviews · Training · Certifications · PPAP Deadlines</p>
            </div>
            <button onClick={() => { if (!loaded) { setEvents(SAMPLE_EVENTS); setLoaded(true); } else { setEvents([]); setLoaded(false); } }}
              className="px-4 py-2 bg-teal-700 hover:bg-teal-600 text-white text-sm rounded-lg font-medium transition-colors">
              {loaded ? '🗑 Clear Sample' : '⚡ Load Sample Data'}
            </button>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-4">
            {[
              { label:'This Month',    value: events.length ? `${stats.thisMonth}` : '—',    color:'text-white' },
              { label:'Upcoming',      value: events.length ? `${stats.upcoming}` : '—',     color:'text-blue-400' },
              { label:'High Priority', value: events.length ? `${stats.highPriority}` : '—', color:'text-orange-400' },
              { label:'Overdue',       value: events.length ? `${stats.overdue}` : '—',      color: stats.overdue > 0 ? 'text-red-400' : 'text-emerald-400' },
            ].map(s => (
              <div key={s.label} className="bg-slate-900/60 rounded-lg p-3 border border-slate-700">
                <div className="text-xs text-slate-500 mb-1">{s.label}</div>
                <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="border-b border-slate-700 bg-slate-800/50 px-6">
        <div className="max-w-7xl mx-auto flex gap-1 overflow-x-auto">
          {tabs.map((tab, i) => (
            <button key={i} onClick={() => setActiveTab(i)}
              className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${activeTab === i ? 'border-teal-500 text-teal-400' : 'border-transparent text-slate-400 hover:text-white'}`}>
              {tab}
            </button>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        {activeTab === 0 && <CalendarGridTab events={events} />}
        {activeTab === 1 && <AgendaTab events={events} />}
        {activeTab === 2 && <AuditPlanTab />}
      </div>
    </div>
  );
}
