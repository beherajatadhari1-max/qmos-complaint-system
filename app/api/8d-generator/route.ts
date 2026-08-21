export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { cookies } from 'next/headers';

async function getCompanyId(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const session = cookieStore.get('qmos_session');
    if (session?.value) {
      const s = JSON.parse(session.value);
      if (s?.company_id) return s.company_id;
    }
  } catch { /* fall through */ }
  const { data } = await supabaseAdmin
    .from('companies').select('id').eq('code', 'BALESH001').single();
  return data?.id ?? null;
}

// ── Domain knowledge banks ────────────────────────────────────────────────────

const CONTAINMENT_BY_DEFECT: Record<string, string[]> = {
  dimensional:    ['100% inspection of all outgoing parts using calibrated gauges','Stop shipment of suspect lots — apply HOLD tag','Segregate and identify all suspect material at customer plant','Deploy additional inspection point at dispatch'],
  surface:        ['100% visual inspection under standard lighting conditions','Apply red rejection tag on all suspect parts','Withdraw suspect parts from customer line if possible','Increase patrol inspection frequency to every 30 minutes'],
  assembly:       ['Halt assembly of affected sub-assemblies','100% functional check before release','Deploy containment team at customer assembly line','Review assembly SOP and verify last known-good lot'],
  welding:        ['100% weld visual + dimensional check before dispatch','Apply HOLD on all suspect welded assemblies','Deploy inspector at welding station — check every batch','Notify customer to sort field parts if any reached OEM'],
  coating:        ['100% coating thickness and adhesion check on held lot','Segregate parts by batch/shift for traceability','Stop coating process until root cause is identified','Rework feasibility assessment by process engineer'],
  material:       ['Quarantine entire material lot using lot number','Arrange material re-test at approved lab','Stop production using suspect material immediately','Identify and recall any parts made from this material lot'],
  functional:     ['100% functional test on all held parts','Deploy go/no-go gauge or test fixture 100%','Sort and segregate parts at customer WIP','Verify test equipment calibration before screening'],
  packaging:      ['Check all dispatched lots — packaging compliance audit','Revise packing instruction immediately','100% check on current inventory packing condition','Deploy additional packing inspection before dispatch'],
  label:          ['100% label verification on all outgoing lots','Quarantine mislabelled stock','Correct all labels on held inventory','Update label verification step in dispatch SOP'],
};

const TEAM_ROLES = [
  { role: 'Team Champion',      resp: 'Overall 8D leadership, resource allocation, escalation authority' },
  { role: 'Quality Engineer',   resp: 'Root cause analysis, containment verification, effectiveness check' },
  { role: 'Process Engineer',   resp: 'Process investigation, SOP/CP update, poka-yoke implementation' },
  { role: 'Production Supervisor', resp: 'Containment action execution, operator instructions, shift communication' },
  { role: 'SQE / Supplier Quality', resp: 'Supplier interface, SCAR if material-related, supplier CAPA review' },
  { role: 'Logistics/Dispatch', resp: '100% inspection at dispatch gate, HOLD management, part traceability' },
  { role: 'Customer Quality Interface', resp: 'Customer communication, D1–D3 response, closure confirmation' },
];

const ROOT_CAUSE_BY_DEFECT: Record<string, { occurrence: string[]; escape: string[] }> = {
  dimensional: {
    occurrence: ['Tool wear beyond replacement interval — dimension drifted out of tolerance','Fixture wear causing datum shift','Setup deviation — operator did not verify first-off part','Process parameter drift (temperature, speed, feed rate) not controlled by SPC'],
    escape: ['Gauge calibration overdue — readings unreliable','Inspector fatigue on high-volume 100% inspection line','SOP does not specify gauge type or measurement point','Control chart not maintained — process drift undetected'],
  },
  surface: {
    occurrence: ['Contamination on tooling or work surface — oil/dust ingress','Incorrect cutting parameters causing surface roughness','Raw material surface condition — supplier variation','Coolant contamination or wrong coolant mix ratio'],
    escape: ['Visual inspection performed under insufficient lighting','No reference sample (limit sample) at inspection station','Inspector not trained for this specific surface standard','Inspection step skipped due to production pressure'],
  },
  assembly: {
    occurrence: ['Wrong part picked — no poka-yoke for part differentiation','Torque not verified — wrench calibration overdue','Assembly sequence deviation — SOP not followed','Component dimensional variation — tolerance stack-up exceeded'],
    escape: ['Functional test not performed before dispatch — only visual','Test fixture worn — not detecting marginal assemblies','No error-proof at assembly — wrong assembly can pass visually','End-of-line check removed without FMEA review'],
  },
  welding: {
    occurrence: ['Welding parameters (current, voltage, speed) outside window','Fixture misalignment — gap beyond weld specification','Electrode/wire condition — not replaced per schedule','Base material condition — surface contamination affecting fusion'],
    escape: ['Weld visual done by same operator who performed the weld — conflict of interest','No NDT (dye-penetrant / ultrasonic) in control plan for this characteristic','Inspector trained on visual only — lack of weld quality standard reference'],
  },
  default: {
    occurrence: ['Process parameter outside established window — not detected by SPC','Human error — operator deviation from SOP without detection','Equipment PM overdue — degraded process performance','Incoming material variation accepted beyond drawing specification'],
    escape: ['Inspection method inadequate for this defect type — detection control gap','No poka-yoke device for this failure mode — relies on human inspection only','FMEA detection rating overestimated — actual detectability lower than assumed','Control plan not updated after last process change — characteristic missed'],
  },
};

const PREVENTIVE_ACTIONS: Record<string, string[]> = {
  dimensional:  ['Update PFMEA: reduce detection rating for this failure mode — add poka-yoke','Revise Control Plan: add SPC chart for this critical dimension','Tool change frequency schedule updated in PM system','Apply learning to all similar dimensions on related part families'],
  surface:      ['Introduce standard limit samples (boundary samples) at all visual inspection stations','Update PFMEA detection controls for surface defects','Add lighting standard to work instruction with lux value','Extend learning to all parts using same material/process'],
  assembly:     ['Install poka-yoke device — physical error-proof for part differentiation','Update Control Plan — add functional test as mandatory step','Revise PFMEA — reduce detection rating for this assembly error mode','Apply lesson to all similar assembly operations'],
  welding:      ['Add in-process weld parameter monitoring to Control Plan','Establish weld electrode/wire change interval in PM schedule','Update PFMEA — add NDT check as detection control','Brief all welding lines on this failure mode — Lessons Learned register'],
  default:      ['Update PFMEA — revise occurrence and detection ratings for this failure mode','Update Control Plan — add or strengthen detection control for this characteristic','Extend CAPA lessons to all similar products and processes — horizontal deployment','Add to Lessons Learned database for future APQP reviews'],
};

function detectDefectKey(category: string, description: string): string {
  const text = `${category} ${description}`.toLowerCase();
  if (text.match(/dimen|size|length|width|height|diameter|tolerance|measur/)) return 'dimensional';
  if (text.match(/surface|roughness|finish|scratch|dent|mark|visual|cosmetic/)) return 'surface';
  if (text.match(/assembl|torque|fit|install|sequenc|wrong part/)) return 'assembly';
  if (text.match(/weld|fusion|porosity|crack|spatter/)) return 'welding';
  if (text.match(/coat|paint|plat|rust|corros|adhesion/)) return 'coating';
  if (text.match(/material|hardness|tensile|chemic|alloy|raw/)) return 'material';
  if (text.match(/function|leak|noise|vibrat|electric|sensor|test/)) return 'functional';
  if (text.match(/pack|label|mark|barcode|carton|bag/)) return 'packaging';
  if (text.match(/label|marking|id|barcode|ean|part number/)) return 'label';
  return 'default';
}

function pick(arr: string[], n: number): string[] {
  return arr.slice(0, Math.min(n, arr.length));
}

function daysBetween(d1: string, d2: Date = new Date()): number {
  return Math.max(0, Math.floor((d2.getTime() - new Date(d1).getTime()) / 86400000));
}

function fmtDate(d: Date, offsetDays = 0): string {
  const dd = new Date(d);
  dd.setDate(dd.getDate() + offsetDays);
  return dd.toISOString().slice(0, 10);
}

// ── Main generator ────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const complaintId = req.nextUrl.searchParams.get('id');
  if (!complaintId) return NextResponse.json({ error: 'Missing complaint id' }, { status: 400 });

  const companyId = await getCompanyId();

  // Fetch complaint
  const { data: complaint, error } = await supabaseAdmin
    .from('complaints')
    .select('*')
    .eq('id', complaintId)
    .single();

  if (error || !complaint) return NextResponse.json({ error: 'Complaint not found' }, { status: 404 });

  // Optional: fetch CAPA actions
  const { data: capaActions } = await supabaseAdmin
    .from('capa_actions')
    .select('*')
    .eq('complaint_id', complaintId);

  const now = new Date();
  const customer = complaint.customer_name ?? complaint.customer ?? 'Customer';
  const partName = complaint.part_name ?? 'Component';
  const partNo   = complaint.part_number ?? complaint.part_no ?? '—';
  const defectCat = complaint.defect_category ?? '';
  const defectDesc = complaint.defect_description ?? '';
  const severity = complaint.severity ?? 'High';
  const qty = complaint.quantity_affected ?? 0;
  const totalSupplied = complaint.total_supplied ?? 0;
  const compNo = complaint.complaint_number ?? complaintId.slice(0, 8).toUpperCase();
  const createdAt = complaint.created_at ?? now.toISOString();
  const agedays = daysBetween(createdAt);

  const defectKey = detectDefectKey(defectCat, defectDesc);
  const containmentList = CONTAINMENT_BY_DEFECT[defectKey] ?? CONTAINMENT_BY_DEFECT['dimensional'];
  const rcData = ROOT_CAUSE_BY_DEFECT[defectKey] ?? ROOT_CAUSE_BY_DEFECT['default'];
  const preventiveList = PREVENTIVE_ACTIONS[defectKey] ?? PREVENTIVE_ACTIONS['default'];
  const ppm = totalSupplied > 0 ? Math.round((qty / totalSupplied) * 1_000_000) : 0;

  // ── D1: Team ──────────────────────────────────────────────────────────────
  const d1 = {
    title: 'D1 — Form the Team',
    summary: `Cross-functional team assembled for 8D problem solving on ${compNo}. Team has authority to implement containment, allocate resources, and approve corrective actions.`,
    teamLeader: 'Quality Head / Quality Manager',
    members: TEAM_ROLES,
    openedDate: fmtDate(new Date(createdAt)),
    targetCloseDate: fmtDate(new Date(createdAt), severity === 'Critical' ? 10 : severity === 'High' ? 14 : 21),
  };

  // ── D2: Problem Description ───────────────────────────────────────────────
  const d2 = {
    title: 'D2 — Define the Problem',
    summary: `${customer} reported ${defectCat || 'quality issue'} on ${partName} (Part No: ${partNo}). ${qty} parts affected out of ${totalSupplied > 0 ? totalSupplied.toLocaleString() : 'N/A'} supplied${ppm > 0 ? ` — PPM: ${ppm.toLocaleString()}` : ''}.`,
    problemStatement: `${severity} severity ${defectCat || 'quality nonconformity'} found at ${customer} on part "${partName}" (${partNo}). Defect: ${defectDesc || defectCat}. Quantity affected: ${qty} units. Complaint age: ${agedays} days.`,
    is: [
      `Defect Type: ${defectCat || defectDesc || 'As reported by customer'}`,
      `Part: ${partName} — Part No: ${partNo}`,
      `Customer: ${customer}`,
      `Quantity Affected: ${qty} units${totalSupplied > 0 ? ` (${ppm.toLocaleString()} PPM)` : ''}`,
      `When detected: At customer ${complaint.detection_stage ?? 'incoming / line inspection'}`,
      `Severity: ${severity}`,
    ],
    isNot: [
      `Not detected at supplier / sub-supplier level — escaped all inspection`,
      `Not limited to one shift / one batch (exact scope under investigation)`,
      `Not yet confirmed as process-change related — investigation ongoing`,
      `No other part families confirmed affected at this stage`,
    ],
  };

  // ── D3: Interim Containment ───────────────────────────────────────────────
  const d3 = {
    title: 'D3 — Interim Containment Actions',
    summary: `Immediate containment actions to protect the customer from further defects while root cause is investigated. All containment verified and documented.`,
    actions: containmentList.map((a, i) => ({
      no: i + 1,
      action: a,
      responsible: i === 0 ? 'Quality Engineer + Logistics' : i === 1 ? 'Quality Manager' : i === 2 ? 'Customer Quality Interface' : 'Production Supervisor',
      targetDate: fmtDate(now, i === 0 ? 0 : i === 1 ? 1 : 2),
      status: 'Required',
    })),
    containmentVerification: `Quality Manager to confirm containment effectiveness within 48 hours. Customer to acknowledge containment acknowledgement in writing.`,
  };

  // ── D4: Root Cause ────────────────────────────────────────────────────────
  const occurrenceRC = pick(rcData.occurrence, 2);
  const escapeRC = pick(rcData.escape, 2);

  const d4 = {
    title: 'D4 — Root Cause Analysis',
    summary: `Dual root cause analysis addressing Why Made (occurrence) and Why Shipped (escape) per IATF 16949 Cl. 10.2.3.`,
    occurrenceRootCause: {
      label: 'Why Made (Occurrence Root Cause)',
      whys: [
        `Why 1: ${defectCat || 'Defect'} found at customer — Why was the defect produced?`,
        `Why 2: ${occurrenceRC[0] ?? 'Process parameter outside established window'}`,
        `Why 3: Process control (SPC / PM / SOP) was inadequate or not followed`,
        `Why 4: PFMEA did not adequately identify this risk — occurrence rating underestimated`,
        `Root Cause: ${occurrenceRC[1] ?? 'Systemic gap in process control for this characteristic'}`,
      ],
    },
    escapeRootCause: {
      label: 'Why Shipped (Escape Root Cause)',
      whys: [
        `Why 1: Defective parts reached customer — why were they not detected before dispatch?`,
        `Why 2: ${escapeRC[0] ?? 'Inspection method did not detect this defect type'}`,
        `Why 3: Detection control in Control Plan was insufficient for this failure mode`,
        `Why 4: PFMEA detection rating was overestimated — actual detection lower than assumed`,
        `Root Cause: ${escapeRC[1] ?? 'Gap in detection control — no poka-yoke for this failure mode'}`,
      ],
    },
    fishbone: {
      Man:     ['Operator training gap — SOP awareness check required', 'Inspector fatigue / attention lapse on high-volume line'],
      Machine: ['PM schedule not adhered to — equipment condition degraded', 'Tooling / fixture wear beyond allowable limit'],
      Material:['Incoming material variation beyond specification', 'Material lot traceability gap — no batch correlation'],
      Method:  ['SOP deviation observed — setup parameters not verified', 'First-off inspection skipped or insufficiently documented'],
      Measurement: ['Gauge calibration status not verified before use', 'Measurement method not specified in SOP — operator discretion'],
      'Mother Nature': ['Temperature / humidity variation affecting process output', 'Vibration or environmental factor impacting dimensional stability'],
    },
  };

  // ── D5: Chosen Corrective Actions ─────────────────────────────────────────
  const existingCapa = (capaActions ?? []).map((c: { action?: string; action_description?: string; responsible?: string; target_date?: string; status?: string }) => ({
    action: c.action ?? c.action_description ?? '',
    responsible: c.responsible ?? 'Quality',
    targetDate: c.target_date ?? fmtDate(now, 14),
    status: c.status ?? 'Open',
  }));

  const d5Actions = existingCapa.length > 0 ? existingCapa : [
    { action: `Implement permanent ${occurrenceRC[0]?.split('—')[0]?.trim() ?? 'process control'} corrective action`, responsible: 'Process Engineer', targetDate: fmtDate(now, 10), status: 'Planned' },
    { action: `Upgrade detection control: add poka-yoke / 100% check for ${defectCat || 'this characteristic'}`, responsible: 'Quality Engineer', targetDate: fmtDate(now, 12), status: 'Planned' },
    { action: 'Update SOP and conduct operator re-training on revised standard', responsible: 'Production Supervisor', targetDate: fmtDate(now, 14), status: 'Planned' },
    { action: 'Revise PFMEA — update occurrence and detection ratings, add new control', responsible: 'Quality Engineer', targetDate: fmtDate(now, 14), status: 'Planned' },
    { action: 'Revise Control Plan — add new detection checkpoint for this characteristic', responsible: 'Quality Manager', targetDate: fmtDate(now, 14), status: 'Planned' },
  ];

  const d5 = {
    title: 'D5 — Chosen Corrective Actions',
    summary: `Corrective actions selected to permanently eliminate both occurrence and escape root causes. Each action is assigned an owner and target date.`,
    actions: d5Actions,
    selectionBasis: 'Actions selected based on root cause analysis — addressing both occurrence (Why Made) and escape (Why Shipped) root causes. Validated against PFMEA for effectiveness before implementation.',
  };

  // ── D6: Implement & Validate ───────────────────────────────────────────────
  const d6 = {
    title: 'D6 — Implement and Validate Corrective Actions',
    summary: `Corrective actions implemented and validated. Containment actions removed only after permanent CA verified effective.`,
    implementationSteps: [
      { step: 1, action: 'Implement all D5 corrective actions per schedule', responsible: 'Process + Quality Engineer', targetDate: fmtDate(now, 14) },
      { step: 2, action: 'Conduct trial run with new controls in place — minimum 300 parts or 1 production shift', responsible: 'Production Supervisor', targetDate: fmtDate(now, 15) },
      { step: 3, action: `Verify: zero ${defectCat || 'defect'} in trial run. Compare before/after process data (Cpk, defect rate)`, responsible: 'Quality Engineer', targetDate: fmtDate(now, 16) },
      { step: 4, action: 'Remove containment actions only after verification confirms effectiveness', responsible: 'Quality Manager', targetDate: fmtDate(now, 17) },
      { step: 5, action: 'Obtain customer acknowledgement that containment can be lifted', responsible: 'Customer Quality Interface', targetDate: fmtDate(now, 18) },
    ],
    effectivenessEvidence: [
      'Before/after defect rate comparison (minimum 30-day monitoring window)',
      `Process capability data: Cpk ≥ 1.33 for ${defectCat || 'critical characteristic'}`,
      'Zero recurrence of same failure mode in 30-day observation period',
      'Customer confirmation: No further complaints on same defect type',
    ],
  };

  // ── D7: Prevent Recurrence ────────────────────────────────────────────────
  const d7 = {
    title: 'D7 — Prevent Recurrence',
    summary: `Systemic actions to prevent this failure mode from recurring — on this part, and horizontal deployment to similar parts/processes. FMEA and Control Plan updated.`,
    systemicActions: preventiveList.map((a, i) => ({
      no: i + 1,
      action: a,
      responsible: i < 2 ? 'Quality Engineer' : 'Quality Manager',
      targetDate: fmtDate(now, 21 + i * 2),
      documentRef: i === 0 ? 'PFMEA Document' : i === 1 ? 'Control Plan' : i === 2 ? 'Work Instruction / SOP' : 'Lessons Learned Register',
    })),
    horizontalDeployment: `Review and update PFMEA, Control Plan, and Work Instructions for all similar parts/processes using the same manufacturing method. Brief all relevant shifts via Toolbox Talk. Add to Lessons Learned database with searchable tags: [${defectCat || 'quality issue'}, ${partName}, ${customer}].`,
    lessonsLearned: `Root cause: ${occurrenceRC[0] ?? 'Process control gap'}. Escape: ${escapeRC[0] ?? 'Detection control gap'}. Future prevention: poka-yoke + updated PFMEA + SPC monitoring.`,
  };

  // ── D8: Recognize the Team ────────────────────────────────────────────────
  const d8 = {
    title: 'D8 — Recognize the Team',
    summary: `Formal closure of 8D report. Team contributions acknowledged. Report filed in Quality Management System.`,
    closureStatement: `The 8D team successfully resolved the ${severity.toLowerCase()} ${defectCat || 'quality'} complaint from ${customer} on part ${partName}. Root cause eliminated. Recurrence prevention implemented. Customer confirmed satisfaction.`,
    teamAcknowledgement: TEAM_ROLES.map(r => r.role),
    closureChecklist: [
      { item: 'Root cause verified and documented', done: false },
      { item: 'Corrective actions implemented and verified effective', done: false },
      { item: 'PFMEA updated with revised occurrence/detection ratings', done: false },
      { item: 'Control Plan updated with new controls', done: false },
      { item: 'SOP/Work Instructions revised and operators re-trained', done: false },
      { item: 'Containment actions removed — customer confirmed', done: false },
      { item: 'Horizontal deployment to similar parts/processes completed', done: false },
      { item: 'Lessons Learned entry created in QMOS', done: false },
      { item: 'Customer 8D submission accepted — complaint officially closed', done: false },
    ],
    reportRef: compNo,
    generatedAt: now.toISOString(),
  };

  return NextResponse.json({
    complaint: {
      id: complaint.id,
      complaint_number: compNo,
      customer,
      part_name: partName,
      part_number: partNo,
      defect_category: defectCat,
      defect_description: defectDesc,
      severity,
      status: complaint.status,
      quantity_affected: qty,
      total_supplied: totalSupplied,
      ppm,
      created_at: createdAt,
      age_days: agedays,
    },
    disciplines: { d1, d2, d3, d4, d5, d6, d7, d8 },
    iatfRef: 'IATF 16949:2016 Cl. 10.2.3 — Problem Solving',
    generatedAt: now.toISOString(),
  });
}
