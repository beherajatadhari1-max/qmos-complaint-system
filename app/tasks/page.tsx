'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import PageTitle from '../components/PageTitle';

// -- Task Types ----------------------------------------------------------------
type Priority = 'critical' | 'high' | 'medium' | 'low';
type Status   = 'todo' | 'in-progress' | 'done' | 'overdue' | 'cancelled';
type Source   = 'capa' | 'audit' | 'customer' | 'supplier' | 'internal' | 'managerial' | 'tqm';

interface Task {
  id: number;
  task_number: string;
  title: string;
  description: string;
  source: Source;
  source_ref: string;
  priority: Priority;
  status: Status;
  assigned_to: string;
  assigned_phone: string;
  raised_by: string;
  target_date: string;
  completed_date: string;
  reminder_hours: number;
  next_reminder_at: string;
  last_reminded_at: string;
  linked_id: string;
  linked_module: string;
  notes: string;
  created_at: string;
}

// -- DWM Types -----------------------------------------------------------------
interface DWMTask {
  id: number;
  session_id: number;
  session_date: string;
  department: string;
  dept_code: string;
  dept_phone: string;
  task_text: string;
  frequency: string;
  due_datetime: string;
  status: string;
  reminder_count: number;
  last_reminded_at: string;
  closed_at: string;
  closed_by: string;
  notes: string;
  created_at: string;
  updated_at: string;
}

interface ScanDept {
  department: string;
  dept_code: string;
  tasks: Array<{ task_text: string; frequency: string }>;
}

interface EditTask {
  department: string;
  dept_code: string;
  dept_phone: string;
  task_text: string;
  frequency: string;
  due_datetime: string;
}

// -- Constants -----------------------------------------------------------------
const PRIORITY_STYLE: Record<Priority, { bg: string; text: string; label: string }> = {
  critical: { bg: 'bg-red-50',     text: 'text-red-700',    label: '🔴 Critical' },
  high:     { bg: 'bg-orange-50',  text: 'text-orange-700', label: '🟠 High' },
  medium:   { bg: 'bg-yellow-50',  text: 'text-yellow-700', label: '🟡 Medium' },
  low:      { bg: 'bg-[#eff6ff]',  text: 'text-[#1d4ed8]',  label: '🔵 Low' },
};
const STATUS_STYLE: Record<Status, { bg: string; text: string; label: string }> = {
  'todo':        { bg: 'bg-[#dbeafe]',  text: 'text-[#1d4ed8]',  label: '📋 To Do' },
  'in-progress': { bg: 'bg-blue-50',   text: 'text-blue-700',   label: '⚙️ In Progress' },
  'done':        { bg: 'bg-green-50',  text: 'text-green-700',  label: '✅ Done' },
  'overdue':     { bg: 'bg-red-50',    text: 'text-red-700',    label: '🚨 Overdue' },
  'cancelled':   { bg: 'bg-gray-100',  text: 'text-gray-500',   label: '🚫 Cancelled' },
};
const SOURCE_LABEL: Record<Source, string> = {
  capa:       '🛠 CAPA',
  audit:      '📋 Audit',
  customer:   '👤 Customer',
  supplier:   '🏭 Supplier',
  internal:   '🏠 Internal',
  managerial: '📊 Managerial',
  tqm:        '🔄 TQM/Kaizen',
};
const REMINDER_OPTIONS = [1, 2, 4, 6, 8, 12, 24];

// DWM frequency badge colours -- FROZEN 13 Aug 2026
const FREQ_STYLE: Record<string, { bg: string; label: string }> = {
  D: { bg: 'bg-red-700',   label: 'Daily' },
  W: { bg: 'bg-blue-700',  label: 'Weekly' },
  M: { bg: 'bg-green-700', label: 'Monthly' },
};

// -- Helpers -------------------------------------------------------------------
function daysUntil(date: string): number {
  if (!date) return 9999;
  return Math.ceil((new Date(date).getTime() - Date.now()) / 86_400_000);
}

function effectiveStatus(t: Task): Status {
  if (t.status === 'done' || t.status === 'cancelled') return t.status;
  if (t.target_date && daysUntil(t.target_date) < 0) return 'overdue';
  return t.status;
}

function waLink(phone: string, task: Task, appUrl: string, isReminder = false): string {
  const priority = task.priority.toUpperCase();
  const due      = task.target_date
    ? new Date(task.target_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
    : 'Not set';
  const msg = isReminder
    ? `⏰ *QMOS Task Reminder*\n\n📋 Task: ${task.task_number} — ${task.title}\n🎯 Priority: ${priority}\n📅 Due: ${due}\n⚡ Status: ${task.status.toUpperCase()}\n\nPlease update your task status:\n${appUrl}/tasks\n\n— QMOS Quality Management System`
    : `🔔 *QMOS Task Assigned to You*\n\n📋 ${task.task_number}: ${task.title}\n🎯 Priority: ${priority}\n📅 Due Date: ${due}\n${task.description ? `\n📝 Details:\n${task.description}\n` : ''}\nPlease acknowledge and update progress at:\n${appUrl}/tasks\n\n— QMOS Quality Management System`;
  return `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
}

function reminderDueIn(t: Task): string {
  if (!t.next_reminder_at) return '';
  const ms = new Date(t.next_reminder_at).getTime() - Date.now();
  if (ms <= 0) return 'Due now';
  const h = Math.floor(ms / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  return h > 0 ? `${h}h ${m}m` : `${m}m`;
}

function isOverdueDWM(t: DWMTask): boolean {
  if (!t.due_datetime) return false;
  return new Date(t.due_datetime) < new Date();
}

function fileToBase64(file: File): Promise<{ base64: string; mimeType: string }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve({ base64, mimeType: file.type || 'image/jpeg' });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// -- Default form state --------------------------------------------------------
const EMPTY_FORM = {
  title: '', description: '', source: 'internal' as Source,
  source_ref: '', priority: 'medium' as Priority,
  assigned_to: '', assigned_phone: '', raised_by: '',
  target_date: '', reminder_hours: 24, notes: '',
  linked_id: '', linked_module: '',
};

// -- Main Component ------------------------------------------------------------
export default function TasksPage() {
  // -- Main tab
  const [mainTab, setMainTab] = useState<'tasks' | 'dwm'>('tasks');

  // -- Task Manager state
  const [tasks,        setTasks]        = useState<Task[]>([]);
  const [reminders,    setReminders]    = useState<Task[]>([]);
  const [loading,      setLoading]      = useState(true);
  const [showModal,    setShowModal]    = useState(false);
  const [submitting,   setSubmitting]   = useState(false);
  const [form,         setForm]         = useState({ ...EMPTY_FORM });
  const [waLinkReady,  setWaLinkReady]  = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPrio,   setFilterPrio]   = useState('all');
  const [search,       setSearch]       = useState('');
  const [expandedId,   setExpandedId]   = useState<number | null>(null);
  const [appUrl,       setAppUrl]       = useState('http://localhost:3000');

  // -- DWM state
  const [dwmView,     setDwmView]     = useState<'board' | 'scan'>('board');
  const [dwmTasks,    setDwmTasks]    = useState<DWMTask[]>([]);
  const [dwmDate,     setDwmDate]     = useState(new Date().toISOString().slice(0, 10));
  const [dwmLoading,  setDwmLoading]  = useState(false);
  const [dwmFilter,   setDwmFilter]   = useState<'all' | 'open' | 'closed'>('open');
  const [scanning,    setScanning]    = useState(false);
  const [scanResult,  setScanResult]  = useState<{ sessionId: number; date: string; departments: ScanDept[] } | null>(null);
  const [editTasks,   setEditTasks]   = useState<EditTask[]>([]);
  const [confirming,  setConfirming]  = useState(false);
  const [confirmDone, setConfirmDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // -- Task Manager load --------------------------------------------------------
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [tr, rr] = await Promise.all([
        fetch('/api/tasks').then(r => r.json()),
        fetch('/api/tasks/reminders').then(r => r.json()),
      ]);
      setTasks(Array.isArray(tr) ? tr : []);
      setReminders(Array.isArray(rr) ? rr : []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
    setAppUrl(window.location.origin);
    const id = setInterval(load, 60_000);
    return () => clearInterval(id);
  }, [load]);

  // -- DWM load -----------------------------------------------------------------
  const loadDWM = useCallback(async () => {
    setDwmLoading(true);
    try {
      const url = dwmFilter === 'all'
        ? `/api/dwm/tasks?date=${dwmDate}`
        : `/api/dwm/tasks?date=${dwmDate}&status=${dwmFilter}`;
      const data = await fetch(url).then(r => r.json());
      setDwmTasks(Array.isArray(data) ? data : []);
    } finally {
      setDwmLoading(false);
    }
  }, [dwmDate, dwmFilter]);

  useEffect(() => {
    if (mainTab === 'dwm') {
      loadDWM();
      const id = setInterval(loadDWM, 30_000);
      return () => clearInterval(id);
    }
  }, [mainTab, loadDWM]);

  // -- Close DWM task -----------------------------------------------------------
  async function closeDWMTask(id: number) {
    if (!confirm('Mark this task as closed?')) return;
    await fetch(`/api/dwm/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'closed', closed_by: 'Quality Head' }),
    });
    await loadDWM();
  }

  async function reopenDWMTask(id: number) {
    await fetch(`/api/dwm/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: 'open' }),
    });
    await loadDWM();
  }

  // -- DWM Scan -----------------------------------------------------------------
  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanning(true);
    setScanResult(null);
    setEditTasks([]);
    setConfirmDone(false);
    try {
      const { base64, mimeType } = await fileToBase64(file);
      const res = await fetch('/api/dwm/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ imageBase64: base64, mimeType, sessionDate: dwmDate }),
      });
      const data = await res.json() as { sessionId: number; date: string; departments: ScanDept[]; error?: string };
      if (!res.ok || data.error) {
        alert('Scan failed: ' + (data.error || 'Unknown error'));
        return;
      }
      setScanResult(data);
      // Flatten departments into editTasks
      const flat: EditTask[] = [];
      for (const dept of (data.departments ?? [])) {
        for (const t of dept.tasks) {
          flat.push({
            department: dept.department,
            dept_code:  dept.dept_code,
            dept_phone: '',
            task_text:  t.task_text,
            frequency:  t.frequency || 'D',
            due_datetime: '',
          });
        }
      }
      setEditTasks(flat);
    } catch (err) {
      alert('Scan failed: ' + String(err));
    } finally {
      setScanning(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }

  // -- DWM Confirm & Notify -----------------------------------------------------
  async function handleConfirm() {
    if (!scanResult || editTasks.length === 0) return;
    setConfirming(true);
    try {
      await fetch('/api/dwm/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId:   scanResult.sessionId,
          sessionDate: scanResult.date,
          tasks:       editTasks,
        }),
      });
      setConfirmDone(true);
      await loadDWM();
      // Switch to board after short delay
      setTimeout(() => {
        setDwmView('board');
        setScanResult(null);
        setEditTasks([]);
        setConfirmDone(false);
      }, 1800);
    } finally {
      setConfirming(false);
    }
  }

  // -- Task Manager create ------------------------------------------------------
  async function handleCreate() {
    if (!form.title.trim()) return;
    setSubmitting(true);
    try {
      const res  = await fetch('/api/tasks', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(form) });
      const task = await res.json();
      if (task.id && form.assigned_phone) {
        setWaLinkReady(waLink(task.assigned_phone, task, appUrl, false));
      } else {
        setShowModal(false);
        setForm({ ...EMPTY_FORM });
      }
      await load();
    } finally {
      setSubmitting(false);
    }
  }

  async function updateStatus(id: number, status: string) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
    await load();
  }

  async function markReminded(id: number) {
    await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'reminded' }),
    });
    await load();
  }

  async function deleteTask(id: number) {
    if (!confirm('Delete this task?')) return;
    await fetch(`/api/tasks/${id}`, { method: 'DELETE' });
    await load();
  }

  // -- Filtered tasks -----------------------------------------------------------
  const filtered = tasks.filter(t => {
    const eff = effectiveStatus(t);
    if (filterStatus !== 'all' && eff !== filterStatus) return false;
    if (filterPrio   !== 'all' && t.priority !== filterPrio) return false;
    if (search && !`${t.title} ${t.assigned_to} ${t.task_number}`.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // -- KPIs ---------------------------------------------------------------------
  const kpis = {
    total:   tasks.length,
    overdue: tasks.filter(t => effectiveStatus(t) === 'overdue').length,
    today:   tasks.filter(t => t.target_date === new Date().toISOString().split('T')[0] && effectiveStatus(t) !== 'done').length,
    inprog:  tasks.filter(t => t.status === 'in-progress').length,
    done:    tasks.filter(t => t.status === 'done').length,
  };

  // -- DWM grouped by department ------------------------------------------------
  const dwmByDept = dwmTasks.reduce<Record<string, DWMTask[]>>((acc, t) => {
    if (!acc[t.department]) acc[t.department] = [];
    acc[t.department].push(t);
    return acc;
  }, {});
  const dwmDepts = Object.keys(dwmByDept).sort();
  const dwmOpen   = dwmTasks.filter(t => t.status === 'open').length;
  const dwmClosed = dwmTasks.filter(t => t.status === 'closed').length;
  const dwmOverdue = dwmTasks.filter(t => t.status === 'open' && isOverdueDWM(t)).length;

  // -- Render -------------------------------------------------------------------
  return (
    <>
      <PageTitle title="Tasks" />
      <div className="min-h-screen bg-[#eff6ff] p-4 sm:p-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-3 mb-5">
          <div className="flex-1">
            <h1 className="text-xl font-bold text-[#0f172a]">
              {mainTab === 'tasks' ? '📋 Task Manager' : '📊 DWM Review'}
            </h1>
            <p className="text-xs text-[#1e3a5f] mt-0.5">
              {mainTab === 'tasks'
                ? 'Assign tasks · Track progress · Send WhatsApp reminders'
                : 'Daily · Weekly · Monthly morning review with department heads'}
            </p>
          </div>
          {mainTab === 'tasks' && (
            <button onClick={() => { setShowModal(true); setWaLinkReady(''); }}
              className="flex items-center gap-2 bg-[#15803d] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#16a34a] transition shadow-sm">
              ＋ New Task
            </button>
          )}
          {mainTab === 'dwm' && dwmView === 'board' && (
            <button onClick={() => { setDwmView('scan'); setScanResult(null); setEditTasks([]); setConfirmDone(false); }}
              className="flex items-center gap-2 bg-[#1d4ed8] text-white text-sm font-semibold px-4 py-2.5 rounded-xl hover:bg-[#1e40af] transition shadow-sm">
              📷 Scan Whiteboard
            </button>
          )}
          {mainTab === 'dwm' && dwmView === 'scan' && (
            <button onClick={() => setDwmView('board')}
              className="flex items-center gap-2 bg-white text-[#1e3a5f] text-sm font-semibold px-4 py-2.5 rounded-xl border border-[#dbeafe] hover:bg-[#eff6ff] transition shadow-sm">
              ← Board View
            </button>
          )}
        </div>

        {/* Tab Bar */}
        <div className="flex gap-1 bg-white rounded-xl border border-[#dbeafe] p-1 mb-4">
          <button
            onClick={() => setMainTab('tasks')}
            className={`flex-1 text-sm font-semibold py-2 rounded-lg transition ${
              mainTab === 'tasks'
                ? 'bg-[#1d4ed8] text-white shadow-sm'
                : 'text-[#1e3a5f] hover:bg-[#eff6ff]'
            }`}>
            📋 Task Manager
          </button>
          <button
            onClick={() => setMainTab('dwm')}
            className={`flex-1 text-sm font-semibold py-2 rounded-lg transition ${
              mainTab === 'dwm'
                ? 'bg-[#1d4ed8] text-white shadow-sm'
                : 'text-[#1e3a5f] hover:bg-[#eff6ff]'
            }`}>
            📊 DWM Review
          </button>
        </div>

        {/* ═══════════════════════════════════════════════════════════════
            TASK MANAGER TAB
        ═══════════════════════════════════════════════════════════════ */}
        {mainTab === 'tasks' && (
          <>
            {/* KPI Row */}
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-4">
              {[
                { label: 'Total',       val: kpis.total,   color: 'bg-white border-[#dbeafe]' },
                { label: 'Overdue',     val: kpis.overdue, color: kpis.overdue > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-[#dbeafe]' },
                { label: 'Due Today',   val: kpis.today,   color: kpis.today > 0 ? 'bg-amber-50 border-amber-200' : 'bg-white border-[#dbeafe]' },
                { label: 'In Progress', val: kpis.inprog,  color: 'bg-blue-50 border-blue-200' },
                { label: 'Done',        val: kpis.done,    color: 'bg-green-50 border-green-200' },
              ].map(k => (
                <div key={k.label} className={`${k.color} border rounded-xl p-3 text-center`}>
                  <p className="text-xl font-black text-[#0f172a]">{k.val}</p>
                  <p className="text-[10px] font-semibold uppercase text-[#1e3a5f] tracking-wide mt-0.5">{k.label}</p>
                </div>
              ))}
            </div>

            {/* WA Reminders Due */}
            {reminders.length > 0 && (
              <div className="bg-green-50 border border-green-200 rounded-xl p-4 mb-4">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-base">📱</span>
                  <p className="text-sm font-bold text-green-800">
                    {reminders.length} WhatsApp Reminder{reminders.length > 1 ? 's' : ''} Due
                  </p>
                </div>
                <div className="flex flex-col gap-2">
                  {reminders.map(t => (
                    <div key={t.id} className="bg-white rounded-lg border border-green-200 p-3 flex flex-col sm:flex-row sm:items-center gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#0f172a] truncate">{t.task_number} — {t.title}</p>
                        <p className="text-xs text-[#1e3a5f]">👤 {t.assigned_to} · 📅 {t.target_date || 'No date'} · 🔁 Every {t.reminder_hours}h</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <a href={waLink(t.assigned_phone, t, appUrl, true)}
                          target="_blank" rel="noopener noreferrer"
                          onClick={() => markReminded(t.id)}
                          className="flex items-center gap-1.5 bg-green-600 text-white text-xs font-semibold px-3 py-1.5 rounded-lg hover:bg-green-700 transition">
                          📱 Send WA Reminder
                        </a>
                        <button onClick={() => markReminded(t.id)}
                          className="text-xs text-[#1e3a5f] border border-[#dbeafe] px-3 py-1.5 rounded-lg hover:bg-[#eff6ff] transition">
                          Skip
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-white rounded-xl border border-[#dbeafe] p-3 mb-4 flex flex-col sm:flex-row gap-2">
              <input value={search} onChange={e => setSearch(e.target.value)}
                placeholder="🔍 Search tasks, assignee…"
                className="flex-1 border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#0f172a] bg-[#eff6ff] focus:outline-none focus:ring-2 focus:ring-[#15803d]" />
              <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
                className="border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] bg-[#eff6ff] focus:outline-none">
                <option value="all">All Status</option>
                <option value="todo">To Do</option>
                <option value="in-progress">In Progress</option>
                <option value="overdue">Overdue</option>
                <option value="done">Done</option>
                <option value="cancelled">Cancelled</option>
              </select>
              <select value={filterPrio} onChange={e => setFilterPrio(e.target.value)}
                className="border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] bg-[#eff6ff] focus:outline-none">
                <option value="all">All Priority</option>
                <option value="critical">Critical</option>
                <option value="high">High</option>
                <option value="medium">Medium</option>
                <option value="low">Low</option>
              </select>
            </div>

            {/* Task List */}
            {loading ? (
              <div className="text-center py-16 text-[#1e3a5f]">Loading tasks…</div>
            ) : filtered.length === 0 ? (
              <div className="bg-white rounded-xl border border-[#dbeafe] p-10 text-center">
                <p className="text-3xl mb-3">📋</p>
                <p className="text-sm font-semibold text-[#1e3a5f]">No tasks found</p>
                <p className="text-xs text-[#1e3a5f] mt-1">Create your first task using the button above</p>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                {filtered.map(t => {
                  const eff        = effectiveStatus(t);
                  const dLeft      = daysUntil(t.target_date);
                  const isExpanded = expandedId === t.id;
                  const sStyle     = STATUS_STYLE[eff];
                  const pStyle     = PRIORITY_STYLE[t.priority];
                  const nextWa     = t.next_reminder_at ? reminderDueIn(t) : '';
                  const isDone     = eff === 'done' || eff === 'cancelled';

                  return (
                    <div key={t.id}
                      className={`bg-white rounded-xl border shadow-sm transition-all ${eff === 'overdue' ? 'border-red-300' : 'border-[#dbeafe]'}`}>
                      <div className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                              <span className="text-[10px] font-black text-[#1d4ed8] bg-[#dbeafe] px-2 py-0.5 rounded-full">{t.task_number}</span>
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${pStyle.bg} ${pStyle.text}`}>{pStyle.label}</span>
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${sStyle.bg} ${sStyle.text}`}>{sStyle.label}</span>
                              <span className="text-[10px] text-[#1e3a5f] bg-[#eff6ff] px-2 py-0.5 rounded-full">{SOURCE_LABEL[t.source] ?? t.source}</span>
                              {t.source_ref && <span className="text-[10px] font-mono text-[#1d4ed8]">{t.source_ref}</span>}
                            </div>
                            <p className={`text-sm font-semibold ${isDone ? 'text-gray-400 line-through' : 'text-[#0f172a]'} leading-snug`}>{t.title}</p>
                            <div className="flex flex-wrap gap-x-4 gap-y-0.5 mt-1.5 text-xs text-[#1e3a5f]">
                              <span>👤 {t.assigned_to || '—'}</span>
                              {t.target_date && (
                                <span className={dLeft < 0 ? 'text-red-600 font-semibold' : dLeft <= 2 ? 'text-amber-600 font-semibold' : ''}>
                                  📅 {t.target_date} {!isDone && dLeft !== 9999 && (dLeft < 0 ? `(${Math.abs(dLeft)}d overdue)` : dLeft === 0 ? '(Due today)' : `(${dLeft}d left)`)}
                                </span>
                              )}
                              {t.raised_by && <span>🙋 {t.raised_by}</span>}
                              {nextWa && !isDone && <span className="text-green-700 font-medium">🔔 Next WA: {nextWa}</span>}
                            </div>
                          </div>

                          <div className="flex flex-wrap gap-1.5 flex-shrink-0 items-center">
                            {t.assigned_phone && !isDone && (
                              <a href={waLink(t.assigned_phone, t, appUrl, false)}
                                target="_blank" rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs bg-green-600 text-white font-semibold px-2.5 py-1.5 rounded-lg hover:bg-green-700 transition">
                                📱 WhatsApp
                              </a>
                            )}
                            {!isDone && (
                              <>
                                {t.status !== 'in-progress' && (
                                  <button onClick={() => updateStatus(t.id, 'in-progress')}
                                    className="text-xs bg-blue-50 text-blue-700 border border-blue-200 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-blue-100 transition">
                                    ▶ Start
                                  </button>
                                )}
                                <button onClick={() => updateStatus(t.id, 'done')}
                                  className="text-xs bg-green-50 text-green-700 border border-green-200 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-green-100 transition">
                                  ✅ Close
                                </button>
                              </>
                            )}
                            {isDone && (
                              <button onClick={() => updateStatus(t.id, 'todo')}
                                className="text-xs bg-[#eff6ff] text-[#1d4ed8] border border-[#dbeafe] font-semibold px-2.5 py-1.5 rounded-lg hover:bg-[#dbeafe] transition">
                                ↩ Reopen
                              </button>
                            )}
                            <button onClick={() => setExpandedId(isExpanded ? null : t.id)}
                              className="text-xs text-[#1e3a5f] border border-[#dbeafe] px-2 py-1.5 rounded-lg hover:bg-[#eff6ff] transition">
                              {isExpanded ? '▲' : '▼'}
                            </button>
                            <button onClick={() => deleteTask(t.id)}
                              className="text-xs text-red-400 border border-red-100 px-2 py-1.5 rounded-lg hover:bg-red-50 transition">
                              🗑
                            </button>
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="border-t border-[#dbeafe] px-4 py-3 bg-[#f8faff] rounded-b-xl">
                          {t.description && (
                            <p className="text-sm text-[#1e3a5f] mb-2 whitespace-pre-wrap">{t.description}</p>
                          )}
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
                            <div><span className="font-semibold text-[#1e3a5f]">Phone:</span> <span className="text-[#0f172a]">{t.assigned_phone || '—'}</span></div>
                            <div><span className="font-semibold text-[#1e3a5f]">Reminder:</span> <span className="text-[#0f172a]">Every {t.reminder_hours}h</span></div>
                            <div><span className="font-semibold text-[#1e3a5f]">Last WA:</span> <span className="text-[#0f172a]">{t.last_reminded_at ? new Date(t.last_reminded_at).toLocaleString('en-IN') : '—'}</span></div>
                            <div><span className="font-semibold text-[#1e3a5f]">Created:</span> <span className="text-[#0f172a]">{t.created_at.split('T')[0]}</span></div>
                          </div>
                          {t.notes && <p className="text-xs text-[#1e3a5f] mt-2 italic border-t border-[#dbeafe] pt-2">{t.notes}</p>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            DWM REVIEW TAB
        ═══════════════════════════════════════════════════════════════ */}
        {mainTab === 'dwm' && (
          <>
            {/* DWM Board View */}
            {dwmView === 'board' && (
              <>
                {/* Date + filter controls */}
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <div className="flex items-center gap-2 bg-white rounded-xl border border-[#dbeafe] px-3 py-2">
                    <span className="text-xs font-bold text-[#1e3a5f]">📅 Date:</span>
                    <input type="date" value={dwmDate}
                      onChange={e => setDwmDate(e.target.value)}
                      className="text-sm text-[#0f172a] bg-transparent border-none outline-none" />
                  </div>
                  <div className="flex gap-1 bg-white rounded-xl border border-[#dbeafe] p-1">
                    {(['all', 'open', 'closed'] as const).map(f => (
                      <button key={f} onClick={() => setDwmFilter(f)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          dwmFilter === f ? 'bg-[#1d4ed8] text-white' : 'text-[#1e3a5f] hover:bg-[#eff6ff]'
                        }`}>
                        {f === 'all' ? 'All' : f === 'open' ? 'Open' : 'Closed'}
                      </button>
                    ))}
                  </div>
                  <button onClick={loadDWM}
                    className="flex items-center gap-1.5 bg-white text-[#1e3a5f] text-xs font-semibold px-3 py-2 rounded-xl border border-[#dbeafe] hover:bg-[#eff6ff] transition">
                    🔄 Refresh
                  </button>
                </div>

                {/* KPI strip */}
                <div className="grid grid-cols-3 gap-2 mb-4">
                  <div className="bg-white border border-[#dbeafe] rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-[#0f172a]">{dwmOpen}</p>
                    <p className="text-[10px] font-semibold uppercase text-[#1e3a5f] tracking-wide mt-0.5">Open</p>
                  </div>
                  <div className={`border rounded-xl p-3 text-center ${dwmOverdue > 0 ? 'bg-red-50 border-red-200' : 'bg-white border-[#dbeafe]'}`}>
                    <p className={`text-2xl font-black ${dwmOverdue > 0 ? 'text-red-700' : 'text-[#0f172a]'}`}>{dwmOverdue}</p>
                    <p className="text-[10px] font-semibold uppercase text-[#1e3a5f] tracking-wide mt-0.5">Overdue</p>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-xl p-3 text-center">
                    <p className="text-2xl font-black text-green-700">{dwmClosed}</p>
                    <p className="text-[10px] font-semibold uppercase text-[#1e3a5f] tracking-wide mt-0.5">Closed</p>
                  </div>
                </div>

                {/* Board */}
                {dwmLoading ? (
                  <div className="text-center py-16 text-[#1e3a5f]">Loading DWM board…</div>
                ) : dwmTasks.length === 0 ? (
                  <div className="bg-white rounded-xl border border-[#dbeafe] p-10 text-center">
                    <p className="text-4xl mb-3">📊</p>
                    <p className="text-sm font-semibold text-[#1e3a5f] mb-1">No DWM tasks for {dwmDate}</p>
                    <p className="text-xs text-[#1e3a5f] mb-4">Take a whiteboard photo to extract and assign tasks</p>
                    <button onClick={() => { setDwmView('scan'); setScanResult(null); setEditTasks([]); setConfirmDone(false); }}
                      className="inline-flex items-center gap-2 bg-[#1d4ed8] text-white text-sm font-semibold px-5 py-2.5 rounded-xl hover:bg-[#1e40af] transition">
                      📷 Scan Whiteboard Now
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {dwmDepts.map(dept => {
                      const deptTasks = dwmByDept[dept];
                      const deptOpen   = deptTasks.filter(t => t.status === 'open').length;
                      const deptClosed = deptTasks.filter(t => t.status === 'closed').length;
                      const deptCode   = deptTasks[0]?.dept_code || '';
                      return (
                        <div key={dept} className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
                          {/* Dept header */}
                          <div className="flex items-center justify-between px-4 py-3 bg-[#f0f4ff] border-b border-[#dbeafe]">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-[#1d4ed8] bg-[#dbeafe] px-2 py-0.5 rounded-full">{deptCode}</span>
                              <span className="text-sm font-bold text-[#0f172a]">{dept}</span>
                            </div>
                            <div className="flex items-center gap-2 text-xs text-[#1e3a5f]">
                              {deptOpen > 0 && <span className="bg-amber-100 text-amber-700 font-semibold px-2 py-0.5 rounded-full">{deptOpen} open</span>}
                              {deptClosed > 0 && <span className="bg-green-100 text-green-700 font-semibold px-2 py-0.5 rounded-full">{deptClosed} closed</span>}
                            </div>
                          </div>

                          {/* Tasks */}
                          <div className="divide-y divide-[#f0f4ff]">
                            {deptTasks.map(t => {
                              const overdue  = t.status === 'open' && isOverdueDWM(t);
                              const isClosed = t.status === 'closed';
                              const fStyle   = FREQ_STYLE[t.frequency] ?? FREQ_STYLE.D;
                              return (
                                <div key={t.id} className={`flex items-start gap-3 px-4 py-3 ${isClosed ? 'opacity-60' : ''}`}>
                                  {/* Status dot */}
                                  <div className={`mt-1 w-2 h-2 rounded-full flex-shrink-0 ${isClosed ? 'bg-green-500' : overdue ? 'bg-red-500' : 'bg-amber-400'}`} />

                                  {/* Task info */}
                                  <div className="flex-1 min-w-0">
                                    <p className={`text-sm font-medium ${isClosed ? 'text-gray-400 line-through' : overdue ? 'text-red-700' : 'text-[#0f172a]'} leading-snug`}>
                                      {t.task_text}
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                      <span className={`text-[10px] font-bold text-white px-2 py-0.5 rounded-full ${fStyle.bg}`}>{fStyle.label}</span>
                                      {t.due_datetime && (
                                        <span className={`text-[10px] ${overdue ? 'text-red-600 font-semibold' : 'text-[#1e3a5f]'}`}>
                                          📅 {new Date(t.due_datetime).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                                          {overdue && ' ⏰ OVERDUE'}
                                        </span>
                                      )}
                                      {t.reminder_count > 0 && !isClosed && (
                                        <span className="text-[10px] text-amber-600">🔔 {t.reminder_count} reminder{t.reminder_count > 1 ? 's' : ''} sent</span>
                                      )}
                                      {isClosed && t.closed_at && (
                                        <span className="text-[10px] text-green-600">✅ Closed {new Date(t.closed_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
                                      )}
                                    </div>
                                  </div>

                                  {/* Action */}
                                  {!isClosed && (
                                    <button onClick={() => closeDWMTask(t.id)}
                                      className="flex-shrink-0 text-xs text-green-700 border border-green-200 bg-green-50 font-semibold px-2.5 py-1.5 rounded-lg hover:bg-green-100 transition">
                                      ✅ Close
                                    </button>
                                  )}
                                  {isClosed && (
                                    <button onClick={() => reopenDWMTask(t.id)}
                                      className="flex-shrink-0 text-xs text-[#1e3a5f] border border-[#dbeafe] font-semibold px-2.5 py-1.5 rounded-lg hover:bg-[#eff6ff] transition">
                                      ↩
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </>
            )}

            {/* DWM Scan View */}
            {dwmView === 'scan' && (
              <div className="flex flex-col gap-4">
                {/* Photo upload card */}
                <div className="bg-white rounded-xl border border-[#dbeafe] p-5">
                  <h2 className="text-sm font-bold text-[#0f172a] mb-1">📷 Scan Whiteboard Photo</h2>
                  <p className="text-xs text-[#1e3a5f] mb-4">Claude AI will extract all tasks from your whiteboard photograph, grouped by department.</p>

                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />

                  {!scanResult && !scanning && (
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full flex flex-col items-center justify-center gap-3 border-2 border-dashed border-[#93c5fd] bg-[#eff6ff] rounded-xl py-10 hover:bg-[#dbeafe] transition cursor-pointer">
                      <span className="text-5xl">📷</span>
                      <div className="text-center">
                        <p className="text-sm font-bold text-[#1d4ed8]">Tap to take photo or select from gallery</p>
                        <p className="text-xs text-[#1e3a5f] mt-1">Supports JPG, PNG · Whiteboard must be clearly visible</p>
                      </div>
                    </button>
                  )}

                  {scanning && (
                    <div className="flex flex-col items-center justify-center gap-3 py-10">
                      <div className="w-10 h-10 border-4 border-[#1d4ed8] border-t-transparent rounded-full animate-spin" />
                      <p className="text-sm font-semibold text-[#1e3a5f]">AI is reading your whiteboard…</p>
                      <p className="text-xs text-[#1e3a5f]">This takes 5–10 seconds</p>
                    </div>
                  )}

                  {scanResult && !scanning && (
                    <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                      <div>
                        <p className="text-sm font-bold text-green-800">✅ Whiteboard scanned successfully</p>
                        <p className="text-xs text-green-700">{editTasks.length} tasks extracted · {scanResult.departments?.length ?? 0} departments</p>
                      </div>
                      <button onClick={() => fileInputRef.current?.click()}
                        className="text-xs text-[#1d4ed8] underline">
                        Re-scan
                      </button>
                    </div>
                  )}
                </div>

                {/* Edit tasks */}
                {editTasks.length > 0 && !scanning && (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <h2 className="text-sm font-bold text-[#0f172a]">✏️ Review & Edit Tasks</h2>
                      <p className="text-xs text-[#1e3a5f]">Add WhatsApp number, frequency, and due time for each task</p>
                    </div>

                    {/* Group by department */}
                    {Array.from(new Set(editTasks.map(t => t.department))).map(dept => {
                      const deptIdx = editTasks
                        .map((t, i) => ({ t, i }))
                        .filter(({ t }) => t.department === dept);
                      const deptCode = deptIdx[0]?.t.dept_code || '';
                      return (
                        <div key={dept} className="bg-white rounded-xl border border-[#dbeafe] overflow-hidden">
                          {/* Dept header */}
                          <div className="flex items-center justify-between px-4 py-2.5 bg-[#f0f4ff] border-b border-[#dbeafe]">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black text-[#1d4ed8] bg-[#dbeafe] px-2 py-0.5 rounded-full">{deptCode}</span>
                              <span className="text-sm font-bold text-[#0f172a]">{dept}</span>
                            </div>
                            <button
                              onClick={() => setEditTasks(prev => [...prev, {
                                department: dept,
                                dept_code: deptCode,
                                dept_phone: deptIdx[0]?.t.dept_phone || '',
                                task_text: '',
                                frequency: 'D',
                                due_datetime: '',
                              }])}
                              className="text-xs text-[#1d4ed8] font-semibold hover:underline">
                              + Add task
                            </button>
                          </div>

                          {/* Phone (shared per dept) */}
                          <div className="px-4 pt-3 pb-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-[#1e3a5f] w-28 flex-shrink-0">📱 WA Number:</span>
                              <input
                                value={deptIdx[0]?.t.dept_phone || ''}
                                onChange={e => {
                                  const phone = e.target.value;
                                  setEditTasks(prev => prev.map((t, i) =>
                                    deptIdx.some(d => d.i === i) ? { ...t, dept_phone: phone } : t
                                  ));
                                }}
                                placeholder="919876543210 (country code + number)"
                                className="flex-1 border border-[#dbeafe] rounded-lg px-3 py-1.5 text-xs text-[#0f172a] bg-[#eff6ff] focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
                              />
                            </div>
                          </div>

                          {/* Tasks */}
                          <div className="px-4 pt-2 pb-3 flex flex-col gap-2">
                            {deptIdx.map(({ t, i }) => (
                              <div key={i} className="flex flex-col sm:flex-row gap-2 items-start bg-[#f8faff] rounded-lg p-2 border border-[#e8edf5]">
                                {/* Task text */}
                                <input
                                  value={t.task_text}
                                  onChange={e => setEditTasks(prev => prev.map((x, xi) => xi === i ? { ...x, task_text: e.target.value } : x))}
                                  placeholder="Task description…"
                                  className="flex-1 border border-[#dbeafe] rounded-lg px-3 py-1.5 text-xs text-[#0f172a] bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]"
                                />
                                {/* Frequency */}
                                <select
                                  value={t.frequency}
                                  onChange={e => setEditTasks(prev => prev.map((x, xi) => xi === i ? { ...x, frequency: e.target.value } : x))}
                                  className="border border-[#dbeafe] rounded-lg px-2 py-1.5 text-xs text-[#1e3a5f] bg-white focus:outline-none w-24">
                                  <option value="D">🔴 Daily</option>
                                  <option value="W">🔵 Weekly</option>
                                  <option value="M">🟢 Monthly</option>
                                </select>
                                {/* Due datetime */}
                                <input
                                  type="datetime-local"
                                  value={t.due_datetime}
                                  onChange={e => setEditTasks(prev => prev.map((x, xi) => xi === i ? { ...x, due_datetime: e.target.value } : x))}
                                  className="border border-[#dbeafe] rounded-lg px-2 py-1.5 text-xs text-[#0f172a] bg-white focus:outline-none"
                                />
                                {/* Remove */}
                                <button
                                  onClick={() => setEditTasks(prev => prev.filter((_, xi) => xi !== i))}
                                  className="text-red-400 hover:text-red-600 text-sm px-1 transition flex-shrink-0">
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}

                    {/* Confirm */}
                    {confirmDone ? (
                      <div className="bg-green-50 border border-green-200 rounded-xl p-5 text-center">
                        <p className="text-2xl mb-2">✅</p>
                        <p className="text-sm font-bold text-green-800">Tasks created & notifications sent!</p>
                        <p className="text-xs text-green-700 mt-1">Switching to board view…</p>
                      </div>
                    ) : (
                      <button
                        onClick={handleConfirm}
                        disabled={confirming || editTasks.every(t => !t.task_text.trim())}
                        className="w-full bg-[#1d4ed8] text-white font-bold py-3.5 rounded-xl hover:bg-[#1e40af] transition disabled:opacity-50 text-sm shadow-sm">
                        {confirming ? 'Creating & Notifying…' : `✅ Confirm & Notify All (${editTasks.filter(t => t.task_text.trim()).length} tasks)`}
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* ═══════════════════════════════════════════════════════════════
            NEW TASK MODAL (Task Manager only)
        ═══════════════════════════════════════════════════════════════ */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4"
            onClick={e => { if (e.target === e.currentTarget && !waLinkReady) { setShowModal(false); setForm({ ...EMPTY_FORM }); } }}>
            <div className="bg-white rounded-2xl w-full max-w-lg max-h-[92vh] overflow-y-auto shadow-2xl">
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#dbeafe] sticky top-0 bg-white z-10">
                <div>
                  <h2 className="text-base font-bold text-[#0f172a]">New Task</h2>
                  <p className="text-xs text-[#1e3a5f]">Assign to a team member with WhatsApp reminder</p>
                </div>
                {!waLinkReady && (
                  <button onClick={() => { setShowModal(false); setForm({ ...EMPTY_FORM }); }}
                    className="text-[#1e3a5f] hover:text-[#0f172a] text-xl font-bold transition">✕</button>
                )}
              </div>

              {waLinkReady ? (
                <div className="p-5 text-center">
                  <div className="text-5xl mb-3">✅</div>
                  <h3 className="text-base font-bold text-[#0f172a] mb-1">Task Created!</h3>
                  <p className="text-sm text-[#1e3a5f] mb-4">Send the WhatsApp notification to <strong>{form.assigned_to}</strong> now:</p>
                  <a href={waLinkReady} target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 bg-green-600 text-white font-bold px-5 py-3 rounded-xl hover:bg-green-700 transition text-sm mb-4">
                    📱 Open WhatsApp & Send
                  </a>
                  <p className="text-xs text-[#1e3a5f] mb-4">WhatsApp will open with the message pre-filled. Just tap Send.</p>
                  <button onClick={() => { setShowModal(false); setWaLinkReady(''); setForm({ ...EMPTY_FORM }); }}
                    className="text-sm text-[#1d4ed8] underline">Done — close this</button>
                </div>
              ) : (
                <div className="p-5 flex flex-col gap-4">
                  <div>
                    <label className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">Task Title *</label>
                    <input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                      placeholder="e.g. Update PFMEA for Op-20"
                      className="mt-1 w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#0f172a] bg-[#eff6ff] focus:outline-none focus:ring-2 focus:ring-[#15803d]" />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">Assign To *</label>
                      <input value={form.assigned_to} onChange={e => setForm(f => ({ ...f, assigned_to: e.target.value }))}
                        placeholder="Person name"
                        className="mt-1 w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#0f172a] bg-[#eff6ff] focus:outline-none focus:ring-2 focus:ring-[#15803d]" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">WhatsApp No. *</label>
                      <input value={form.assigned_phone} onChange={e => setForm(f => ({ ...f, assigned_phone: e.target.value }))}
                        placeholder="919876543210"
                        className="mt-1 w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#0f172a] bg-[#eff6ff] focus:outline-none focus:ring-2 focus:ring-[#15803d]" />
                      <p className="text-[10px] text-[#1e3a5f] mt-0.5">Country code + number (no +)</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">Priority</label>
                      <select value={form.priority} onChange={e => setForm(f => ({ ...f, priority: e.target.value as Priority }))}
                        className="mt-1 w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] bg-[#eff6ff] focus:outline-none">
                        <option value="critical">🔴 Critical</option>
                        <option value="high">🟠 High</option>
                        <option value="medium">🟡 Medium</option>
                        <option value="low">🔵 Low</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">Source</label>
                      <select value={form.source} onChange={e => setForm(f => ({ ...f, source: e.target.value as Source }))}
                        className="mt-1 w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] bg-[#eff6ff] focus:outline-none">
                        <option value="internal">🏠 Internal</option>
                        <option value="capa">🛠 CAPA</option>
                        <option value="audit">📋 Audit</option>
                        <option value="customer">👤 Customer</option>
                        <option value="supplier">🏭 Supplier</option>
                        <option value="managerial">📊 Managerial</option>
                        <option value="tqm">🔄 TQM/Kaizen</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">Reference No.</label>
                      <input value={form.source_ref} onChange={e => setForm(f => ({ ...f, source_ref: e.target.value }))}
                        placeholder="CAPA-2025-011"
                        className="mt-1 w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#0f172a] bg-[#eff6ff] focus:outline-none focus:ring-2 focus:ring-[#15803d]" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">Raised By</label>
                      <input value={form.raised_by} onChange={e => setForm(f => ({ ...f, raised_by: e.target.value }))}
                        placeholder="Your name"
                        className="mt-1 w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#0f172a] bg-[#eff6ff] focus:outline-none focus:ring-2 focus:ring-[#15803d]" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">Target Date *</label>
                      <input type="date" value={form.target_date} onChange={e => setForm(f => ({ ...f, target_date: e.target.value }))}
                        className="mt-1 w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#0f172a] bg-[#eff6ff] focus:outline-none focus:ring-2 focus:ring-[#15803d]" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">WA Reminder Every</label>
                      <select value={form.reminder_hours} onChange={e => setForm(f => ({ ...f, reminder_hours: Number(e.target.value) }))}
                        className="mt-1 w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#1e3a5f] bg-[#eff6ff] focus:outline-none">
                        {REMINDER_OPTIONS.map(h => (
                          <option key={h} value={h}>{h === 1 ? 'Every 1 hour' : h < 24 ? `Every ${h} hours` : 'Every 24 hours (daily)'}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">Description</label>
                    <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                      rows={3} placeholder="What needs to be done…"
                      className="mt-1 w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#0f172a] bg-[#eff6ff] focus:outline-none focus:ring-2 focus:ring-[#15803d] resize-none" />
                  </div>

                  <div>
                    <label className="text-xs font-bold text-[#1e3a5f] uppercase tracking-wide">Notes (internal)</label>
                    <input value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                      placeholder="Any internal notes…"
                      className="mt-1 w-full border border-[#dbeafe] rounded-lg px-3 py-2 text-sm text-[#0f172a] bg-[#eff6ff] focus:outline-none focus:ring-2 focus:ring-[#15803d]" />
                  </div>

                  {form.assigned_phone && (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3 text-xs text-green-800">
                      📱 A WhatsApp message will be ready to send to <strong>{form.assigned_to || 'assignee'}</strong>.<br/>
                      QMOS will remind you to follow up every <strong>{form.reminder_hours}h</strong> until task is closed.
                    </div>
                  )}

                  <div className="flex gap-3 pt-1">
                    <button onClick={() => { setShowModal(false); setForm({ ...EMPTY_FORM }); }}
                      className="flex-1 border border-[#dbeafe] text-[#1e3a5f] text-sm font-semibold py-2.5 rounded-xl hover:bg-[#eff6ff] transition">
                      Cancel
                    </button>
                    <button onClick={handleCreate} disabled={submitting || !form.title.trim()}
                      className="flex-1 bg-[#15803d] text-white text-sm font-semibold py-2.5 rounded-xl hover:bg-[#16a34a] transition disabled:opacity-50">
                      {submitting ? 'Creating…' : form.assigned_phone ? 'Create & Open WhatsApp' : 'Create Task'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
