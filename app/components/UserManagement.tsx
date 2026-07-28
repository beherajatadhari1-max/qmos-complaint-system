'use client';
import { useState, useEffect } from 'react';

type UserType = 'ADMIN' | 'USER';
type TabType = 'all' | 'add' | 'delete' | 'credentials';

interface Credential {
  name: string;
  email: string;
  password: string;
  type: UserType;
  role: string;
}

interface QMOSUser {
  email: string;
  name: string;
  type: UserType;
  role: string;
  department: string;
  plant: string;
  allowedRoutes: string[];
  source?: 'config' | 'added';
}

const ROLES = ['Quality Head', 'Plant Head', 'QA Manager', 'QA Engineer', 'Quality Engineer',
  'Inspector', 'Supervisor', 'Manufacturing Head', 'Supplier Quality Engineer', 'Customer Quality Engineer'];

const DEPARTMENTS = ['Quality', 'Manufacturing', 'Production', 'Engineering', 'Supplier Quality', 'Customer Quality'];

const PLANTS = ['Plant 1', 'Plant 2', 'Plant 3', 'Corporate'];

const emptyForm = {
  name: '', email: '', password: '', type: 'USER' as UserType,
  role: 'QA Engineer', department: 'Quality', plant: 'Plant 1', allAccess: true,
};

export default function UserManagement() {
  const [activeTab, setActiveTab] = useState<TabType>('all');
  const [users, setUsers] = useState<QMOSUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [showPasswords, setShowPasswords] = useState(false);
  const [credLoading, setCredLoading] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showPw, setShowPw] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => { setUsers(data.users || []); setLoading(false); })
      .catch(() => setLoading(false));
  };

  const fetchCredentials = () => {
    setCredLoading(true);
    fetch('/api/admin/credentials')
      .then(r => r.json())
      .then(data => { setCredentials(data.credentials || []); setCredLoading(false); })
      .catch(() => setCredLoading(false));
  };

  const switchTab = (tab: TabType) => {
    setActiveTab(tab);
    setMessage(null);
    if (tab === 'credentials' && credentials.length === 0) fetchCredentials();
    if (tab === 'delete') fetchUsers();
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: form.name,
        email: form.email,
        password: form.password,
        type: form.type,
        role: form.role,
        department: form.department,
        plant: form.plant,
        allowedRoutes: form.allAccess ? [] : [],
      }),
    });

    const data = await res.json();
    setSaving(false);

    if (res.ok) {
      setMessage({ type: 'success', text: `✅ ${form.name} added successfully!` });
      setForm(emptyForm);
      fetchUsers();
      switchTab('all');
    } else {
      setMessage({ type: 'error', text: `❌ ${data.error}` });
    }
  };

  const handleDelete = async (email: string, name: string) => {
    if (!confirm(`Remove ${name} from QMOS?`)) return;
    setDeleting(email);
    await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email }),
    });
    setDeleting(null);
    fetchUsers();
  };

  const generatePassword = () => {
    const name = form.name.split(' ')[0] || 'User';
    const pw = `${name}@${new Date().getFullYear()}`;
    setForm(f => ({ ...f, password: pw }));
  };

  const addedUsers = users.filter(u => u.source === 'added');
  const configUsers = users.filter(u => u.source === 'config');

  const tabs: { id: TabType; label: string; icon: string; count?: number }[] = [
    { id: 'all',         label: 'All Users',    icon: '👥', count: users.length },
    { id: 'add',         label: 'Add User',     icon: '➕' },
    { id: 'delete',      label: 'Delete User',  icon: '🗑️', count: addedUsers.length },
    { id: 'credentials', label: 'Credentials',  icon: '🔑' },
  ];

  return (
    <div className="min-h-screen bg-blue-950 p-6">
      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white">User Management</h1>
          <p className="text-blue-400 text-sm mt-1">Manage QMOS team access — {users.length} total members</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-blue-900/30 p-1 rounded-xl border border-blue-800">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => switchTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-lg text-sm font-semibold transition ${
                activeTab === tab.id
                  ? tab.id === 'delete'
                    ? 'bg-red-900/60 border border-red-700 text-red-300'
                    : tab.id === 'add'
                    ? 'bg-blue-600 text-white'
                    : tab.id === 'credentials'
                    ? 'bg-yellow-900/50 border border-yellow-700 text-yellow-300'
                    : 'bg-blue-800 text-white'
                  : 'text-blue-400 hover:text-blue-200 hover:bg-blue-900/50'
              }`}
            >
              <span>{tab.icon}</span>
              <span className="hidden sm:inline">{tab.label}</span>
              {tab.count !== undefined && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${
                  activeTab === tab.id ? 'bg-white/20 text-white' : 'bg-blue-900 text-blue-400'
                }`}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-4 px-4 py-3 rounded-xl text-sm font-medium ${
            message.type === 'success'
              ? 'bg-green-900/40 border border-green-700 text-green-300'
              : 'bg-red-900/40 border border-red-700 text-red-300'
          }`}>
            {message.text}
          </div>
        )}

        {/* ── TAB: ALL USERS ── */}
        {activeTab === 'all' && (
          <div className="bg-blue-900/30 border border-blue-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-blue-800 flex items-center justify-between">
              <h2 className="text-white font-semibold">Team Members ({users.length})</h2>
              <button onClick={fetchUsers} className="text-blue-400 hover:text-blue-300 text-xs">↻ Refresh</button>
            </div>
            {loading ? (
              <div className="p-8 text-center text-blue-400">Loading...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-blue-400 text-xs border-b border-blue-800 bg-blue-900/20">
                      <th className="text-left px-5 py-3">Name</th>
                      <th className="text-left px-5 py-3">Email</th>
                      <th className="text-left px-5 py-3">Role</th>
                      <th className="text-left px-5 py-3">Type</th>
                      <th className="text-left px-5 py-3">Plant</th>
                      <th className="text-left px-5 py-3">Access</th>
                      <th className="text-left px-5 py-3">Source</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user, i) => (
                      <tr key={i} className="border-b border-blue-900/50 hover:bg-blue-900/20">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-blue-700 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                              {user.name.charAt(0)}
                            </div>
                            <span className="text-white font-medium">{user.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-blue-300 text-xs">{user.email}</td>
                        <td className="px-5 py-3 text-blue-200 text-xs">{user.role}</td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                            user.type === 'ADMIN'
                              ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
                              : 'bg-blue-900/50 text-blue-300 border border-blue-700'
                          }`}>
                            {user.type === 'ADMIN' ? '👑 Admin' : '👤 User'}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-blue-300 text-xs">{user.plant}</td>
                        <td className="px-5 py-3 text-xs">
                          {user.type === 'ADMIN' ? (
                            <span className="text-green-400">Full Access</span>
                          ) : user.allowedRoutes?.length === 0 ? (
                            <span className="text-green-400">All Pages</span>
                          ) : (
                            <span className="text-yellow-400">{user.allowedRoutes?.length} Pages</span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {user.source === 'added' ? (
                            <span className="text-xs bg-blue-900/50 border border-blue-700 text-blue-300 px-2 py-0.5 rounded-full">Added</span>
                          ) : (
                            <span className="text-xs bg-purple-900/40 border border-purple-700 text-purple-300 px-2 py-0.5 rounded-full">Built-in</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── TAB: ADD USER ── */}
        {activeTab === 'add' && (
          <div className="bg-blue-900/40 border border-blue-700 rounded-2xl p-6">
            <h2 className="text-white font-semibold text-lg mb-5">New User Details</h2>
            <form onSubmit={handleSubmit} className="space-y-4">

              {/* Row 1: Name + Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-blue-300 text-xs font-semibold uppercase tracking-wide block mb-1.5">Full Name *</label>
                  <input
                    type="text" required
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Ramesh Kumar"
                    className="w-full bg-blue-950 border border-blue-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
                <div>
                  <label className="text-blue-300 text-xs font-semibold uppercase tracking-wide block mb-1.5">Company Email *</label>
                  <input
                    type="email" required
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="e.g. ramesh@tmseating.com"
                    className="w-full bg-blue-950 border border-blue-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400"
                  />
                </div>
              </div>

              {/* Row 2: Password */}
              <div>
                <label className="text-blue-300 text-xs font-semibold uppercase tracking-wide block mb-1.5">Password *</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <input
                      type={showPw ? 'text' : 'password'} required
                      value={form.password}
                      onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                      placeholder="Min 8 characters"
                      className="w-full bg-blue-950 border border-blue-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400 pr-10"
                    />
                    <button type="button" onClick={() => setShowPw(!showPw)}
                      className="absolute right-3 top-2.5 text-blue-400 text-xs">
                      {showPw ? '🙈' : '👁️'}
                    </button>
                  </div>
                  <button type="button" onClick={generatePassword}
                    className="bg-blue-800 hover:bg-blue-700 text-blue-200 text-xs px-4 rounded-xl transition whitespace-nowrap">
                    Auto Generate
                  </button>
                </div>
                {form.password && (
                  <p className="text-blue-400 text-xs mt-1">Password: <span className="text-yellow-400 font-mono">{form.password}</span> — note this down</p>
                )}
              </div>

              {/* Row 3: Role + Department + Plant */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="text-blue-300 text-xs font-semibold uppercase tracking-wide block mb-1.5">Role</label>
                  <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full bg-blue-950 border border-blue-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400">
                    {ROLES.map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-blue-300 text-xs font-semibold uppercase tracking-wide block mb-1.5">Department</label>
                  <select value={form.department} onChange={e => setForm(f => ({ ...f, department: e.target.value }))}
                    className="w-full bg-blue-950 border border-blue-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400">
                    {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-blue-300 text-xs font-semibold uppercase tracking-wide block mb-1.5">Plant</label>
                  <select value={form.plant} onChange={e => setForm(f => ({ ...f, plant: e.target.value }))}
                    className="w-full bg-blue-950 border border-blue-700 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-blue-400">
                    {PLANTS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
              </div>

              {/* Row 4: User Type + Access */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-blue-300 text-xs font-semibold uppercase tracking-wide block mb-1.5">Access Type</label>
                  <div className="flex gap-3">
                    {(['USER', 'ADMIN'] as UserType[]).map(t => (
                      <button key={t} type="button"
                        onClick={() => setForm(f => ({ ...f, type: t }))}
                        className={`flex-1 py-2.5 rounded-xl text-sm font-semibold transition border ${
                          form.type === t
                            ? t === 'ADMIN'
                              ? 'bg-yellow-900/50 border-yellow-600 text-yellow-300'
                              : 'bg-blue-700 border-blue-500 text-white'
                            : 'bg-blue-950 border-blue-800 text-blue-400 hover:border-blue-600'
                        }`}>
                        {t === 'ADMIN' ? '👑 Admin' : '👤 User'}
                      </button>
                    ))}
                  </div>
                  <p className="text-blue-500 text-xs mt-1.5">
                    {form.type === 'ADMIN' ? 'Full access including User Management' : 'Access to assigned pages only'}
                  </p>
                </div>
                <div>
                  <label className="text-blue-300 text-xs font-semibold uppercase tracking-wide block mb-1.5">Page Access</label>
                  <button type="button"
                    onClick={() => setForm(f => ({ ...f, allAccess: !f.allAccess }))}
                    className={`w-full py-2.5 rounded-xl text-sm font-semibold transition border ${
                      form.allAccess
                        ? 'bg-green-900/40 border-green-600 text-green-300'
                        : 'bg-blue-950 border-blue-800 text-blue-400'
                    }`}>
                    {form.allAccess ? '✅ All Pages Access' : '🔒 Restricted Access'}
                  </button>
                  <p className="text-blue-500 text-xs mt-1.5">Click to toggle. Restricted = edit in users.config.ts</p>
                </div>
              </div>

              {/* Submit */}
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={saving}
                  className="bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-semibold px-8 py-2.5 rounded-xl text-sm transition">
                  {saving ? 'Adding...' : 'Add User'}
                </button>
                <button type="button" onClick={() => setForm(emptyForm)}
                  className="bg-blue-900/50 hover:bg-blue-900 text-blue-300 font-semibold px-6 py-2.5 rounded-xl text-sm transition">
                  Reset
                </button>
              </div>
            </form>
          </div>
        )}

        {/* ── TAB: DELETE USER ── */}
        {activeTab === 'delete' && (
          <div className="space-y-4">

            {/* Added Users — can be deleted */}
            <div className="bg-red-900/10 border border-red-800/50 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-red-800/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-red-400 text-lg">🗑️</span>
                  <h2 className="text-white font-semibold">Removable Users</h2>
                  <span className="text-xs bg-red-900/50 text-red-400 border border-red-700 px-2 py-0.5 rounded-full">{addedUsers.length} added</span>
                </div>
                <button onClick={fetchUsers} className="text-blue-400 hover:text-blue-300 text-xs">↻ Refresh</button>
              </div>

              {loading ? (
                <div className="p-8 text-center text-blue-400">Loading...</div>
              ) : addedUsers.length === 0 ? (
                <div className="p-10 text-center">
                  <p className="text-blue-500 text-sm">No removable users yet.</p>
                  <p className="text-blue-600 text-xs mt-1">Users added via the <strong className="text-blue-400">Add User</strong> tab appear here and can be deleted.</p>
                </div>
              ) : (
                <div className="divide-y divide-red-900/30">
                  {addedUsers.map((user, i) => (
                    <div key={i} className="flex items-center justify-between px-5 py-4 hover:bg-red-900/10 transition">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-red-900/40 border border-red-700/50 flex items-center justify-center text-sm font-bold text-red-300">
                          {user.name.charAt(0)}
                        </div>
                        <div>
                          <p className="text-white font-semibold text-sm">{user.name}</p>
                          <p className="text-blue-400 text-xs">{user.email}</p>
                          <p className="text-blue-500 text-xs">{user.role} · {user.department} · {user.plant}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                          user.type === 'ADMIN'
                            ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
                            : 'bg-blue-900/50 text-blue-300 border border-blue-700'
                        }`}>
                          {user.type === 'ADMIN' ? '👑 Admin' : '👤 User'}
                        </span>
                        <button
                          onClick={() => handleDelete(user.email, user.name)}
                          disabled={deleting === user.email}
                          className="flex items-center gap-1.5 bg-red-900/50 hover:bg-red-800/70 disabled:opacity-40 border border-red-700 text-red-300 hover:text-red-200 font-semibold px-4 py-2 rounded-xl text-sm transition"
                        >
                          {deleting === user.email ? (
                            <><span className="animate-spin">⏳</span> Removing...</>
                          ) : (
                            <><span>🗑️</span> Remove User</>
                          )}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Config Users — built-in, cannot delete here */}
            <div className="bg-blue-900/20 border border-blue-800/50 rounded-2xl overflow-hidden">
              <div className="px-5 py-4 border-b border-blue-800/40 flex items-center gap-2">
                <span className="text-purple-400 text-lg">🔒</span>
                <h2 className="text-white font-semibold">Built-in Users</h2>
                <span className="text-xs bg-purple-900/40 text-purple-300 border border-purple-700 px-2 py-0.5 rounded-full">{configUsers.length} hardcoded</span>
              </div>
              <div className="px-5 py-3 bg-purple-900/10 border-b border-blue-800/30">
                <p className="text-purple-300 text-xs">⚠️ These users are defined in <code className="bg-blue-900/50 px-1.5 py-0.5 rounded text-purple-200">lib/users.config.ts</code> — remove them by editing that file directly.</p>
              </div>
              <div className="divide-y divide-blue-900/30">
                {configUsers.map((user, i) => (
                  <div key={i} className="flex items-center justify-between px-5 py-4 opacity-70">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-900/30 border border-purple-800/40 flex items-center justify-center text-sm font-bold text-purple-300">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-white font-semibold text-sm">{user.name}</p>
                        <p className="text-blue-400 text-xs">{user.email}</p>
                        <p className="text-blue-500 text-xs">{user.role} · {user.plant}</p>
                      </div>
                    </div>
                    <span className="text-xs text-purple-400 bg-purple-900/30 border border-purple-800/40 px-3 py-1.5 rounded-xl">🔒 Built-in</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB: CREDENTIALS ── */}
        {activeTab === 'credentials' && (
          <div className="bg-blue-900/20 border border-blue-800 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-blue-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-lg">🔑</span>
                <h2 className="text-white font-semibold">Login Credentials</h2>
                <span className="text-xs bg-yellow-900/50 text-yellow-400 border border-yellow-700 px-2 py-0.5 rounded-full">Admin Only</span>
              </div>
              <button
                onClick={() => setShowPasswords(!showPasswords)}
                className="text-xs bg-blue-800 hover:bg-blue-700 text-blue-200 px-3 py-1.5 rounded-lg transition"
              >
                {showPasswords ? '🙈 Hide Passwords' : '👁️ Show Passwords'}
              </button>
            </div>
            <div className="px-5 py-2.5 bg-red-900/10 border-b border-blue-800/50">
              <p className="text-red-300 text-xs">⚠️ Confidential — Do not share this screen</p>
            </div>

            {credLoading ? (
              <div className="p-8 text-center text-blue-400">Loading credentials...</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-blue-400 text-xs border-b border-blue-800 bg-blue-900/20">
                      <th className="text-left px-5 py-3">Name</th>
                      <th className="text-left px-5 py-3">Role</th>
                      <th className="text-left px-5 py-3">Login Email</th>
                      <th className="text-left px-5 py-3">Password</th>
                      <th className="text-left px-5 py-3">Type</th>
                    </tr>
                  </thead>
                  <tbody>
                    {credentials.map((c, i) => (
                      <tr key={i} className="border-b border-blue-900/40 hover:bg-blue-900/20">
                        <td className="px-5 py-3 text-white font-medium">{c.name}</td>
                        <td className="px-5 py-3 text-blue-300 text-xs">{c.role}</td>
                        <td className="px-5 py-3 text-blue-200 font-mono text-xs">{c.email}</td>
                        <td className="px-5 py-3 font-mono text-xs">
                          {showPasswords
                            ? <span className="text-yellow-300">{c.password}</span>
                            : <span className="text-blue-600">{'●'.repeat(Math.min(c.password.length, 10))}</span>
                          }
                        </td>
                        <td className="px-5 py-3">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                            c.type === 'ADMIN'
                              ? 'bg-yellow-900/50 text-yellow-400 border border-yellow-700'
                              : 'bg-blue-900/50 text-blue-300 border border-blue-700'
                          }`}>{c.type}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
}
