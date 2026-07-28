// ============================================================
// QMOS — User Configuration
// ============================================================
// HOW TO ADD A USER:
//   1. Copy any USER entry below
//   2. Change email, password, name, department, plant
//   3. Save the file — changes apply instantly on next login
//
// HOW TO REMOVE A USER:
//   Delete or comment out their entry
//
// HOW TO RESET A PASSWORD:
//   Change the password field and save
// ============================================================

export type QMOSUserType = 'ADMIN' | 'USER';

export interface QMOSUser {
  email:      string;
  password:   string;
  name:       string;
  type:       QMOSUserType;   // ADMIN = full access | USER = restricted
  role:       string;         // Display role (e.g. QA Manager)
  department: string;
  plant:      string;
  // For USER type: which pages they can access (leave empty = all allowed pages)
  // Use route paths like '/customer-quality', '/audit', etc.
  // Leave as [] to allow all non-admin pages
  allowedRoutes?: string[];
}

export const QMOS_USERS: QMOSUser[] = [

  // ──────────────────────────────────────────────────────────
  // ADMIN — Full access to everything including User Management
  // Only give this to Quality Head / Plant Head
  // ──────────────────────────────────────────────────────────
  {
    email:      'piyush@company.com',
    password:   'Piyush@QMOS2024',
    name:       'Piyush Behere',
    type:       'ADMIN',
    role:       'Quality Head',
    department: 'Quality',
    plant:      'Plant 1',
  },

  {
    email:      'jatadhari705@gmail.com',
    password:   'Piyush@QMOS2024',
    name:       'Piyush Behere',
    type:       'ADMIN',
    role:       'Quality Head',
    department: 'Quality',
    plant:      'Plant 1',
  },

  {
    email:      'jatadhari.behera@tmseating.com',
    password:   'Jatadhari@2024',
    name:       'Jatadhari Behera',
    type:       'ADMIN',
    role:       'Quality Head',
    department: 'Quality',
    plant:      'Plant 1',
  },

  // ──────────────────────────────────────────────────────────
  // USERS — Add your subordinates below
  // type: 'USER' → cannot access User Management or Admin pages
  // allowedRoutes: [] → can access all general QMOS pages
  // ──────────────────────────────────────────────────────────

  {
    email:      'rajesh@company.com',
    password:   'Rajesh@2024',
    name:       'Rajesh Kumar',
    type:       'USER',
    role:       'QA Manager',
    department: 'Quality',
    plant:      'Plant 1',
    allowedRoutes: [], // empty = access to all non-admin pages
  },

  {
    email:      'sunita@company.com',
    password:   'Sunita@2024',
    name:       'Sunita Patil',
    type:       'USER',
    role:       'Quality Engineer',
    department: 'Quality',
    plant:      'Plant 2',
    allowedRoutes: [
      '/customer-quality',
      '/incoming-quality',
      '/process-quality',
      '/outgoing-quality',
      '/documents',
      '/tasks',
    ], // restricted to only these pages
  },

  {
    email:      'amit@company.com',
    password:   'Amit@2024',
    name:       'Amit Sharma',
    type:       'USER',
    role:       'Inspector',
    department: 'Manufacturing',
    plant:      'Plant 1',
    allowedRoutes: [
      '/incoming-quality',
      '/process-quality',
      '/outgoing-quality',
      '/tasks',
    ],
  },

  {
    email:      'balesh.murasiddhi@tmseating.com',
    password:   'Balesh@2024',
    name:       'Balesh Murasiddhi',
    type:       'USER',
    role:       'QA Engineer',
    department: 'Quality',
    plant:      'Plant 1',
    allowedRoutes: [], // all pages access
  },

  // ── TO ADD MORE USERS, COPY THIS BLOCK ───────────────────
  // {
  //   email:      'name@company.com',
  //   password:   'Name@2024',
  //   name:       'Full Name',
  //   type:       'USER',
  //   role:       'Supervisor',
  //   department: 'Production',
  //   plant:      'Plant 1',
  //   allowedRoutes: [],
  // },

];

// ── Admin-only routes (USERs will see "Access Denied") ──────
export const ADMIN_ONLY_ROUTES = [
  '/admin',
  '/admin/users',
];

// ── Routes blocked for all USER types ───────────────────────
export const USER_BLOCKED_ROUTES = [
  '/admin',
];
