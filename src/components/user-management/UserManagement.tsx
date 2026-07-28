'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'

type UserRole = 'QUALITY_HEAD' | 'PLANT_HEAD' | 'MANUFACTURING_HEAD' | 'QA_MANAGER' |
  'QUALITY_ENGINEER' | 'SUPPLIER_QUALITY_ENGINEER' | 'CUSTOMER_QUALITY_ENGINEER' |
  'PRODUCTION_MANAGER' | 'PRODUCTION_ENGINEER' | 'MAINTENANCE_ENGINEER' |
  'INSPECTOR' | 'SUPERVISOR' | 'TEAM_LEADER' | 'OPERATOR' | 'HR' |
  'TOP_MANAGEMENT' | 'INTERNAL_AUDITOR' | 'SUPPLIER' | 'CUSTOMER'

interface UserProfile {
  id: string
  email: string
  full_name: string
  employee_id: string
  role: UserRole
  department: string
  plant: string
  designation: string
  mobile: string
  is_active: boolean
  last_login: string | null
}

interface ModuleAccess {
  module_key: string
  module_name: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
  can_approve: boolean
  can_export: boolean
}

const ALL_MODULES = [
  { module_key: 'executive_dashboard',       module_name: 'Executive Dashboard' },
  { module_key: 'customer_quality',          module_name: 'Customer Quality' },
  { module_key: 'supplier_quality',          module_name: 'Supplier Quality' },
  { module_key: 'incoming_quality',          module_name: 'Incoming Quality' },
  { module_key: 'manufacturing_quality',     module_name: 'Manufacturing Quality' },
  { module_key: 'final_inspection',          module_name: 'Final Inspection' },
  { module_key: 'new_product_development',   module_name: 'New Product Development' },
  { module_key: 'quality_management_system', module_name: 'Quality Management System' },
  { module_key: 'audit_management',          module_name: 'Audit Management' },
  { module_key: 'calibration_metrology',     module_name: 'Calibration & Metrology' },
  { module_key: 'hr_people_management',      module_name: 'HR & People Management' },
  { module_key: 'daily_management_system',   module_name: 'Daily Management System' },
  { module_key: 'document_management',       module_name: 'Document Management' },
  { module_key: 'knowledge_management',      module_name: 'Knowledge Management' },
  { module_key: 'learning_portal',           module_name: 'Learning Portal' },
  { module_key: 'analytics_bi',              module_name: 'Analytics & BI' },
  { module_key: 'continuous_improvement',    module_name: 'Continuous Improvement' },
  { module_key: 'ai_digital_experts',        module_name: 'AI Digital Experts' },
  { module_key: 'user_management',           module_name: 'User Management' },
]

const ROLES: { value: UserRole; label: string }[] = [
  { value: 'QUALITY_HEAD',              label: 'Quality Head' },
  { value: 'PLANT_HEAD',                label: 'Plant Head' },
  { value: 'MANUFACTURING_HEAD',        label: 'Manufacturing Head' },
  { value: 'QA_MANAGER',               label: 'QA Manager' },
  { value: 'QUALITY_ENGINEER',          label: 'Quality Engineer' },
  { value: 'SUPPLIER_QUALITY_ENGINEER', label: 'Supplier Quality Engineer' },
  { value: 'CUSTOMER_QUALITY_ENGINEER', label: 'Customer Quality Engineer' },
  { value: 'PRODUCTION_MANAGER',        label: 'Production Manager' },
  { value: 'PRODUCTION_ENGINEER',       label: 'Production Engineer' },
  { value: 'MAINTENANCE_ENGINEER',      label: 'Maintenance Engineer' },
  { value: 'INSPECTOR',                 label: 'Inspector' },
  { value: 'SUPERVISOR',               label: 'Supervisor' },
  { value: 'TEAM_LEADER',              label: 'Team Leader' },
  { value: 'OPERATOR',                 label: 'Operator' },
  { value: 'HR',                       label: 'HR' },
  { value: 'TOP_MANAGEMENT',           label: 'Top Management' },
  { value: 'INTERNAL_AUDITOR',         label: 'Internal Auditor' },
  { value: 'SUPPLIER',                 label: 'Supplier' },
  { value: 'CUSTOMER',                 label: 'Customer' },
]

const PERM_KEYS = ['can_view','can_create','can_edit','can_delete','can_approve','can_export'] as const
const PERM_LABELS = ['View', 'Create', 'Edit', 'Delete', 'Approve', 'Export']
const DEPARTMENTS = ['Quality','Manufacturing','Production','Engineering','Maintenance',
  'Supplier Quality','Customer Quality','NPD','HR','Finance','Logistics','IT']
const PLANTS = ['Plant 1','Plant 2','Plant 3','Corporate']

export default function UserManagement() {
  const supabase = createClientComponentClient()

  const [users, setUsers]               = useState<UserProfile[]>([])
  const [loading, setLoading]           = useState(true)
  const [showAdd, setShowAdd]           = useState(false)
  const [showPerms, setShowPerms]       = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null)
  const [moduleAccess, setModuleAccess] = useState<ModuleAccess[]>([])
  const [saving, setSaving]             = useState(false)
  const [msg, setMsg]                   = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [search, setSearch]             = useState('')

  const [form, setForm] = useState({
    email: '', full_name: '', employee_id: '',
    role: 'INSPECTOR' as UserRole,
    department: 'Quality', plant: 'Plant 1',
    designation: '', mobile: '', temp_password: '',
  })

  useEffect(() => { fetchUsers() }, [])

  async function fetchUsers() {
    setLoading(true)
    const { data, error } = await supabase.from('profiles').select('*').order('full_name')
    if (!error) setUsers(data || [])
    else showMessage('error', error.message)
    setLoading(false)
  }

  async function handleAddUser() {
    if (!form.email || !form.full_name || !form.temp_password) {
      showMessage('error', 'Name, Email and Password are required')
      return
    }
    setSaving(true)
    try {
      const { data: auth, error: authErr } = await supabase.auth.admin.createUser({
        email: form.email,
        password: form.temp_password,
        email_confirm: true,
      })
      if (authErr) throw authErr

      const { error: profErr } = await supabase.from('profiles').insert({
        id: auth.user.id,
        email: form.email,
        full_name: form.full_name,
        employee_id: form.employee_id,
        role: form.role,
        department: form.department,
        plant: form.plant,
        designation: form.designation,
        mobile: form.mobile,
        is_active: true,
      })
      if (profErr) throw profErr

      await supabase.rpc('apply_role_permissions', {
        p_user_id: auth.user.id,
        p_role: form.role,
      })

      showMessage('success', `✅ User "${form.full_name}" created with ${form.role.replace(/_/g,' ')} permissions!`)
      setShowAdd(false)
      setForm({ email:'', full_name:'', employee_id:'', role:'INSPECTOR', department:'Quality', plant:'Plant 1', designation:'', mobile:'', temp_password:'' })
      fetchUsers()
    } catch (e: any) {
      showMessage('error', e.message || 'Failed to create user')
    }
    setSaving(false)
  }

  async function openPerms(user: UserProfile) {
    setSelectedUser(user)
    const { data } = await supabase.from('module_access').select('*').eq('user_id', user.id)
    const map = new Map((data || []).map((d: ModuleAccess) => [d.module_key, d]))
    setModuleAccess(ALL_MODULES.map(m => ({
      ...m,
      can_view:    map.get(m.module_key)?.can_view    ?? false,
      can_create:  map.get(m.module_key)?.can_create  ?? false,
      can_edit:    map.get(m.module_key)?.can_edit    ?? false,
      can_delete:  map.get(m.module_key)?.can_delete  ?? false,
      can_approve: map.get(m.module_key)?.can_approve ?? false,
      can_export:  map.get(m.module_key)?.can_export  ?? false,
    })))
    setShowPerms(true)
  }

  async function savePerms() {
    if (!selectedUser) return
    setSaving(true)
    const { error } = await supabase.from('module_access')
      .upsert(moduleAccess.map(m => ({ user_id: selectedUser.id, ...m })), { onConflict: 'user_id,module_key' })
    if (error) showMessage('error', error.message)
    else { showMessage('success', `Permissions saved for ${selectedUser.full_name}`); setShowPerms(false) }
    setSaving(false)
  }

  async function resetToDefault() {
    if (!selectedUser) return
    await supabase.rpc('apply_role_permissions', { p_user_id: selectedUser.id, p_role: selectedUser.role })
    openPerms(selectedUser)
    showMessage('success', 'Reset to role defaults')
  }

  function togglePerm(moduleKey: string, perm: typeof PERM_KEYS[number]) {
    setModuleAccess(prev => prev.map(m => {
      if (m.module_key !== moduleKey) return m
      const updated = { ...m, [perm]: !m[perm] }
      if (perm === 'can_view' && !updated.can_view)
        return { ...updated, can_create:false, can_edit:false, can_delete:false, can_approve:false, can_export:false }
      if (perm !== 'can_view' && updated[perm])
        return { ...updated, can_view: true }
      return updated
    }))
  }

  async function toggleActive(user: UserProfile) {
    const { error } = await supabase.from('profiles').update({ is_active: !user.is_active }).eq('id', user.id)
    if (error) showMessage('error', error.message)
    else { showMessage('success', `User "${user.full_name}" ${user.is_active ? 'deactivated' : 'activated'}`); fetchUsers() }
  }

  function showMessage(type: 'success' | 'error', text: string) {
    setMsg({ type, text })
    setTimeout(() => setMsg(null), 4000)
  }

  const filtered = users.filter(u =>
    u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase()) ||
    u.role?.toLowerCase().includes(search.toLowerCase()) ||
    u.department?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-slate-50 p-6">

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">🔐 User Management</h1>
          <p className="text-sm text-slate-500 mt-1">Manage QMOS users, roles and module-wise access</p>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 font-semibold text-sm shadow">
          + Add New User
        </button>
      </div>

      {/* Alert */}
      {msg && (
        <div className={`mb-5 p-4 rounded-lg text-sm font-medium border ${
          msg.type === 'success' ? 'bg-green-50 text-green-800 border-green-200' : 'bg-red-50 text-red-800 border-red-200'
        }`}>{msg.text}</div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Users', value: users.length,                                  color: 'text-blue-600'   },
          { label: 'Active',      value: users.filter(u => u.is_active).length,         color: 'text-green-600'  },
          { label: 'Inactive',    value: users.filter(u => !u.is_active).length,        color: 'text-red-600'    },
          { label: 'Plants',      value: [...new Set(users.map(u => u.plant))].length,  color: 'text-purple-600' },
        ].map(s => (
          <div key={s.label} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
            <p className="text-xs text-slate-500 font-medium uppercase tracking-wide">{s.label}</p>
            <p className={`text-3xl font-bold mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-4">
        <input type="text" placeholder="🔍  Search by name, email, role or department..."
          value={search} onChange={e => setSearch(e.target.value)}
          className="w-full bg-white border border-slate-200 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-sm" />
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        {loading ? (
          <div className="flex items-center justify-center h-48 text-slate-400">Loading users...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 border-b border-slate-200">
                <tr>
                  {['Name','Email','Emp ID','Role','Department','Plant','Status','Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-14 text-slate-400">
                      No users found. Click &quot;+ Add New User&quot; to get started.
                    </td>
                  </tr>
                ) : filtered.map(user => (
                  <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-semibold text-slate-900">{user.full_name}</div>
                      <div className="text-xs text-slate-400">{user.designation}</div>
                    </td>
                    <td className="px-4 py-3 text-slate-500">{user.email}</td>
                    <td className="px-4 py-3 text-slate-400 font-mono text-xs">{user.employee_id || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-1 rounded-full whitespace-nowrap">
                        {user.role?.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-600">{user.department}</td>
                    <td className="px-4 py-3 text-slate-600">{user.plant}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                        user.is_active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {user.is_active ? '● Active' : '○ Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button onClick={() => openPerms(user)}
                          className="text-xs bg-violet-50 text-violet-700 px-2.5 py-1 rounded-md hover:bg-violet-100 font-medium whitespace-nowrap">
                          🛡️ Permissions
                        </button>
                        <button onClick={() => toggleActive(user)}
                          className={`text-xs px-2.5 py-1 rounded-md font-medium whitespace-nowrap ${
                            user.is_active ? 'bg-red-50 text-red-700 hover:bg-red-100' : 'bg-green-50 text-green-700 hover:bg-green-100'
                          }`}>
                          {user.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ── Add User Modal ───────────────────────────────────────────────── */}
      {showAdd && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b">
              <h2 className="text-lg font-bold text-slate-900">➕ Add New User</h2>
              <p className="text-sm text-slate-500 mt-1">Role permissions will be auto-applied on creation</p>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">Full Name *</label>
                <input type="text" value={form.full_name} placeholder="e.g. Rajesh Kumar"
                  onChange={e => setForm({ ...form, full_name: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Company Email *</label>
                <input type="email" value={form.email} placeholder="rajesh@company.com"
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Temporary Password *</label>
                <input type="password" value={form.temp_password} placeholder="Min 8 characters"
                  onChange={e => setForm({ ...form, temp_password: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Employee ID</label>
                <input type="text" value={form.employee_id} placeholder="EMP001"
                  onChange={e => setForm({ ...form, employee_id: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Mobile</label>
                <input type="tel" value={form.mobile} placeholder="+91 98765 43210"
                  onChange={e => setForm({ ...form, mobile: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Role *</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value as UserRole })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Designation</label>
                <input type="text" value={form.designation} placeholder="e.g. Senior QA Manager"
                  onChange={e => setForm({ ...form, designation: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Department</label>
                <select value={form.department} onChange={e => setForm({ ...form, department: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {DEPARTMENTS.map(d => <option key={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Plant</label>
                <select value={form.plant} onChange={e => setForm({ ...form, plant: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                  {PLANTS.map(p => <option key={p}>{p}</option>)}
                </select>
              </div>
              <div className="md:col-span-2 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-800 leading-relaxed">
                ✅ <strong>Auto-permission:</strong> Role-based module permissions will be applied instantly.
                Customize individual module access anytime using the <strong>Permissions</strong> button.
              </div>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowAdd(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={handleAddUser} disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow">
                {saving ? 'Creating...' : 'Create User'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Permissions Modal ────────────────────────────────────────────── */}
      {showPerms && selectedUser && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="p-6 border-b flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">🛡️ Module Permissions</h2>
                <p className="text-sm text-slate-500 mt-1">
                  {selectedUser.full_name} · {selectedUser.role?.replace(/_/g, ' ')} · {selectedUser.plant}
                </p>
              </div>
              <button onClick={resetToDefault} disabled={saving}
                className="text-sm text-orange-600 border border-orange-300 px-3 py-1.5 rounded-lg hover:bg-orange-50 whitespace-nowrap">
                ↺ Reset to Role Default
              </button>
            </div>
            <div className="p-6 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide w-56">Module</th>
                    {PERM_LABELS.map(l => (
                      <th key={l} className="text-center px-3 py-2.5 font-semibold text-slate-600 text-xs uppercase tracking-wide">{l}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {moduleAccess.map(mod => (
                    <tr key={mod.module_key} className="hover:bg-slate-50">
                      <td className="px-3 py-2.5 font-medium text-slate-800">{mod.module_name}</td>
                      {PERM_KEYS.map(perm => (
                        <td key={perm} className="text-center px-3 py-2.5">
                          <button onClick={() => togglePerm(mod.module_key, perm)}
                            className={`relative inline-flex w-9 h-5 rounded-full transition-colors duration-200 focus:outline-none ${
                              mod[perm] ? 'bg-blue-600' : 'bg-slate-200'
                            }`}>
                            <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 ${
                              mod[perm] ? 'translate-x-4' : 'translate-x-0.5'
                            }`} />
                          </button>
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-6 border-t flex justify-end gap-3">
              <button onClick={() => setShowPerms(false)}
                className="px-4 py-2 border border-slate-300 rounded-lg text-sm text-slate-700 hover:bg-slate-50">Cancel</button>
              <button onClick={savePerms} disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 shadow">
                {saving ? 'Saving...' : 'Save Permissions'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
