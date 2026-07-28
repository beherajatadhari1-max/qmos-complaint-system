import { DatabaseSync } from 'node:sqlite';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'complaints.db');

let _db: DatabaseSync | null = null;

export function getDB(): DatabaseSync {
  if (!_db) {
    _db = new DatabaseSync(DB_PATH);
    _db.exec('PRAGMA journal_mode = WAL');
    _db.exec(`
      CREATE TABLE IF NOT EXISTS complaints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_number TEXT DEFAULT '',
        customer_name TEXT NOT NULL,
        customer_contact TEXT DEFAULT '',
        customer_ref TEXT DEFAULT '',
        complaint_source TEXT DEFAULT 'Email',
        part_number TEXT DEFAULT '',
        part_name TEXT DEFAULT '',
        defect_description TEXT NOT NULL,
        defect_category TEXT DEFAULT 'General',
        quantity_affected INTEGER DEFAULT 0,
        total_supplied INTEGER DEFAULT 0,
        batch_number TEXT DEFAULT '',
        severity TEXT DEFAULT 'Medium',
        status TEXT DEFAULT 'Open',
        assigned_to TEXT DEFAULT '',
        target_response_date TEXT DEFAULT '',
        target_closure_date TEXT DEFAULT '',
        actual_closure_date TEXT DEFAULT '',
        customer_approval TEXT DEFAULT 'Pending',
        remarks TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime')),
        updated_at TEXT DEFAULT (datetime('now','localtime')),
        d1_team TEXT DEFAULT '',
        d2_problem TEXT DEFAULT '',
        d3_containment TEXT DEFAULT '',
        d4_root_cause TEXT DEFAULT '',
        d4_escape_point TEXT DEFAULT '',
        d5_corrective_actions TEXT DEFAULT '',
        d6_implementation TEXT DEFAULT '',
        d7_prevention TEXT DEFAULT '',
        d8_congratulations TEXT DEFAULT '',
        report_generated INTEGER DEFAULT 0
      );

      CREATE TABLE IF NOT EXISTS containment_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id INTEGER NOT NULL,
        action_number INTEGER DEFAULT 1,
        action_description TEXT NOT NULL,
        location TEXT DEFAULT 'At Plant',
        responsible_person TEXT DEFAULT '',
        target_date TEXT DEFAULT '',
        completion_date TEXT DEFAULT '',
        status TEXT DEFAULT 'Planned',
        evidence TEXT DEFAULT '',
        qty_sorted INTEGER DEFAULT 0,
        qty_rejected INTEGER DEFAULT 0,
        qty_ok INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now','localtime')),
        FOREIGN KEY(complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS capa_actions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id INTEGER NOT NULL,
        action_number INTEGER DEFAULT 1,
        action_type TEXT DEFAULT 'Corrective',
        action_description TEXT NOT NULL,
        document_to_update TEXT DEFAULT '',
        responsible_person TEXT DEFAULT '',
        target_date TEXT DEFAULT '',
        completion_date TEXT DEFAULT '',
        status TEXT DEFAULT 'Planned',
        evidence_description TEXT DEFAULT '',
        verification_method TEXT DEFAULT '',
        verification_date TEXT DEFAULT '',
        effectiveness_result TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime')),
        FOREIGN KEY(complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS team_members (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id INTEGER NOT NULL,
        member_name TEXT NOT NULL,
        designation TEXT DEFAULT '',
        department TEXT DEFAULT '',
        role_in_team TEXT DEFAULT 'Member',
        contact_number TEXT DEFAULT '',
        email TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime')),
        FOREIGN KEY(complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS complaint_timeline (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id INTEGER NOT NULL,
        event_type TEXT NOT NULL,
        event_description TEXT NOT NULL,
        old_value TEXT DEFAULT '',
        new_value TEXT DEFAULT '',
        performed_by TEXT DEFAULT 'System',
        performed_at TEXT DEFAULT (datetime('now','localtime')),
        FOREIGN KEY(complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
      );

      CREATE TABLE IF NOT EXISTS why_analysis (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        complaint_id INTEGER NOT NULL,
        why_number INTEGER NOT NULL,
        why_type TEXT DEFAULT 'occurrence',
        why_question TEXT DEFAULT '',
        why_answer TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime')),
        FOREIGN KEY(complaint_id) REFERENCES complaints(id) ON DELETE CASCADE
      );
    `);

    // ── Migrations: add new columns to existing tables ──────────────────────
    const migrations = [
      // complaints: D6 verification + Why Shipped fields
      `ALTER TABLE complaints ADD COLUMN d4_why_made TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN d4_why_shipped TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN d5_ca_why_made TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN d5_ca_why_shipped TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN d6_verification TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN d6_ca_owner TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN d6_ca_owner_phone TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN d6_ca_owner_email TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN d6_target_date TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN d6_certified_build_date TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN d6_certified_part_id TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN d7_doc_dfmea TEXT DEFAULT 'Not Applicable'`,
      `ALTER TABLE complaints ADD COLUMN d7_doc_pfmea TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN d7_doc_control_plan TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN d7_doc_process_flow TEXT DEFAULT 'Not Applicable'`,
      `ALTER TABLE complaints ADD COLUMN d7_doc_ods TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN d7_doc_drawing TEXT DEFAULT 'Not Applicable'`,
      `ALTER TABLE complaints ADD COLUMN d7_doc_other TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN d7_other_facilities TEXT DEFAULT ''`,
      // containment_actions: D3 extra fields
      `ALTER TABLE containment_actions ADD COLUMN other_platform_risk TEXT DEFAULT 'No'`,
      `ALTER TABLE containment_actions ADD COLUMN certified_material_id TEXT DEFAULT ''`,
      // why_analysis: why_type for existing rows
      `ALTER TABLE why_analysis ADD COLUMN why_type TEXT DEFAULT 'occurrence'`,
      // complaints: type classification
      `ALTER TABLE complaints ADD COLUMN complaint_type TEXT DEFAULT 'Customer Complaint'`,
      `ALTER TABLE complaints ADD COLUMN vehicle_number TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN warranty_claim_no TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN prr_number TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN response_deadline TEXT DEFAULT ''`,
      `ALTER TABLE complaints ADD COLUMN rejection_stage TEXT DEFAULT ''`,
    ];
    for (const sql of migrations) {
      try { _db.exec(sql); } catch { /* column already exists — skip */ }
    }

    // ── New tables ───────────────────────────────────────────────────────────
    _db.exec(`
      CREATE TABLE IF NOT EXISTS activity_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        process_id TEXT NOT NULL,
        process_label TEXT NOT NULL,
        activity_step TEXT DEFAULT '',
        log_date TEXT DEFAULT (date('now','localtime')),
        owner TEXT DEFAULT '',
        status TEXT DEFAULT 'Done',
        remarks TEXT DEFAULT '',
        evidence TEXT DEFAULT '',
        created_at TEXT DEFAULT (datetime('now','localtime'))
      );

      CREATE TABLE IF NOT EXISTS process_documents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        process_id TEXT NOT NULL,
        document_name TEXT NOT NULL,
        file_name TEXT DEFAULT '',
        uploaded_by TEXT DEFAULT '',
        uploaded_at TEXT DEFAULT (datetime('now','localtime')),
        remarks TEXT DEFAULT ''
      );
    `);
  }
  return _db;
}

export function logTimeline(complaintId: number, type: string, description: string, oldVal = '', newVal = '', by = 'User') {
  const db = getDB();
  db.prepare(`
    INSERT INTO complaint_timeline (complaint_id, event_type, event_description, old_value, new_value, performed_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(complaintId, type, description, oldVal, newVal, by);
}
