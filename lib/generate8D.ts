export interface ComplaintInput {
  customerName: string;
  partNumber: string;
  partName: string;
  defectDescription: string;
  quantityAffected: number;
  severity: string;
  assignedTo?: string;
}

export interface Report8D {
  d1: string;
  d2: string;
  d3: string;
  d4_why_made: string;
  d4_why_shipped: string;
  d4: string; // combined for PDF/legacy
  d5_ca_why_made: string;
  d5_ca_why_shipped: string;
  d5: string; // combined
  d6: string;
  d7: string;
  d8: string;
}

function detectDefectType(description: string): string {
  const d = description.toLowerCase();
  if (d.includes('dimension') || d.includes('size') || d.includes('length') || d.includes('diameter') || d.includes('width') || d.includes('height') || d.includes('tolerance')) return 'dimensional';
  if (d.includes('scratch') || d.includes('dent') || d.includes('surface') || d.includes('cosmetic') || d.includes('appearance') || d.includes('mark') || d.includes('burr')) return 'surface';
  if (d.includes('weld') || d.includes('welding') || d.includes('crack') || d.includes('porosity')) return 'welding';
  if (d.includes('assembly') || d.includes('fit') || d.includes('gap') || d.includes('misalign') || d.includes('loose') || d.includes('tight') || d.includes('fitment') || d.includes('wrong')) return 'assembly';
  if (d.includes('hardness') || d.includes('material') || d.includes('tensile') || d.includes('chemistry') || d.includes('composition')) return 'material';
  if (d.includes('leak') || d.includes('seal') || d.includes('pressure')) return 'leak';
  if (d.includes('paint') || d.includes('coating') || d.includes('rust') || d.includes('corrosion') || d.includes('plating')) return 'coating';
  if (d.includes('missing') || d.includes('mix') || d.includes('label') || d.includes('wrong part')) return 'mixed_parts';
  return 'general';
}

// ── WHY MADE (Occurrence Root Cause) ────────────────────────────────────────
function getWhyMade(type: string, defect: string, partName: string): string {
  const p = partName || 'part';
  const templates: Record<string, string> = {
    dimensional: `WHY MADE — Root Cause of Occurrence\n\nProblem: ${defect}\n\nWhy 1: ${p} dimension found out of specification at customer\nWhy 2: Machining / forming process produced out-of-spec dimension during production\nWhy 3: Tool wear exceeded permissible limit / fixture shifted from set position\nWhy 4: Tool change interval not monitored; fixture PM schedule not adhered to\nWhy 5 (Root Cause): No real-time SPC / process monitoring system in place for this critical dimension — tool wear and fixture drift went undetected\n\nRoot Cause Confirmed: Absence of real-time dimensional monitoring allowed dimensional drift to go undetected during production.`,

    surface: `WHY MADE — Root Cause of Occurrence\n\nProblem: ${defect}\n\nWhy 1: Surface defect observed by customer on ${p}\nWhy 2: Surface damage occurred during inter-process handling / manufacturing operation\nWhy 3: Handling procedure not followed; inadequate protection between operations\nWhy 4: Operator not trained on updated handling standard; no visual aide at station\nWhy 5 (Root Cause): Training system did not trigger re-training when handling process was updated — untrained operator caused surface damage\n\nRoot Cause Confirmed: Lack of updated operator training on handling standards led to surface damage going undetected.`,

    welding: `WHY MADE — Root Cause of Occurrence\n\nProblem: ${defect}\n\nWhy 1: Welding defect found on ${p} at customer\nWhy 2: Weld quality did not meet specification — porosity / incomplete fusion / crack\nWhy 3: Welding parameters (current, voltage, travel speed) deviated from WPS\nWhy 4: Welder did not verify parameters before start; machine drift not detected during production\nWhy 5 (Root Cause): Welder qualification was not current; no real-time parameter logging or monitoring system in place\n\nRoot Cause Confirmed: Expired welder qualification combined with no parameter monitoring allowed defective welds to be produced.`,

    assembly: `WHY MADE — Root Cause of Occurrence\n\nProblem: ${defect}\n\nWhy 1: Assembly defect / incorrect fitment found at customer on ${p}\nWhy 2: Sub-assembly / component fit did not meet specification\nWhy 3: Wrong component selected / assembly sequence not followed at station\nWhy 4: No traceability tracking at assembly station; untrained / SIS manpower deployed without line supervisor knowledge\nWhy 5 (Root Cause): Work instruction / visual aid not available at station; manpower deployed without completing required model-specific training\n\nRoot Cause Confirmed: Untrained manpower deployed at assembly station without adequate traceability or supervision — incorrect assembly went undetected.`,

    material: `WHY MADE — Root Cause of Occurrence\n\nProblem: ${defect}\n\nWhy 1: Material property non-conformance found at customer\nWhy 2: Material did not meet specified mechanical / chemical requirements\nWhy 3: Heat treatment / processing parameters deviated from specification during production\nWhy 4: Furnace calibration overdue; process recipe not verified before batch start\nWhy 5 (Root Cause): No pre-production parameter verification checklist; equipment calibration tracking system inadequate\n\nRoot Cause Confirmed: Inadequate process parameter control and equipment calibration allowed non-conforming material batch to be produced.`,

    leak: `WHY MADE — Root Cause of Occurrence\n\nProblem: ${defect}\n\nWhy 1: Leak / sealing failure found at customer on ${p}\nWhy 2: Sealing surface / seal component did not maintain required pressure\nWhy 3: Assembly torque not maintained; seal damaged during assembly\nWhy 4: Torque tool not calibrated; no seal pre-inspection step before assembly\nWhy 5 (Root Cause): Torque tool calibration overdue; seal pre-check not included in control plan — no control on critical assembly parameter\n\nRoot Cause Confirmed: Uncalibrated torque tools and absence of seal pre-inspection step in control plan caused assembly-induced leak.`,

    coating: `WHY MADE — Root Cause of Occurrence\n\nProblem: ${defect}\n\nWhy 1: Coating / paint defect found at customer on ${p}\nWhy 2: Coating did not adhere / meet specification for appearance and corrosion resistance\nWhy 3: Pre-treatment bath chemistry out of specification; coating thickness below minimum\nWhy 4: Bath analysis frequency insufficient; thickness not verified during production run\nWhy 5 (Root Cause): No real-time bath chemistry monitoring; process parameter verification not performed for this batch\n\nRoot Cause Confirmed: Insufficient bath chemistry monitoring and coating thickness verification allowed non-conforming coating.`,

    mixed_parts: `WHY MADE — Root Cause of Occurrence\n\nProblem: ${defect}\n\nWhy 1: Wrong / mixed part delivered to customer\nWhy 2: Incorrect part number packed in outgoing shipment\nWhy 3: Multiple part numbers stored and processed in same area without clear segregation\nWhy 4: Part identification / labeling system inadequate; visual difference between parts not clear\nWhy 5 (Root Cause): No poka-yoke / error-proofing at packing station to prevent mix-up; no mandatory part number scan before packing\n\nRoot Cause Confirmed: Absence of error-proofing at packing combined with inadequate part identification caused mixed part supply.`,

    general: `WHY MADE — Root Cause of Occurrence\n\nProblem: ${defect}\n\nWhy 1: Non-conformance found by customer on ${p}\nWhy 2: Product did not meet customer specification / requirement\nWhy 3: Process parameter deviation / human error during manufacturing\nWhy 4: Process controls inadequate; operator awareness insufficient\nWhy 5 (Root Cause): Training and process audit system not effectively implemented — deviation went undetected during production\n\nRoot Cause Confirmed: Inadequate process controls and operator training allowed non-conforming product to be produced.`,
  };
  return templates[type] || templates.general;
}

// ── WHY SHIPPED (Escape Root Cause) ──────────────────────────────────────────
function getWhyShipped(type: string, defect: string, partName: string): string {
  const p = partName || 'part';
  const templates: Record<string, string> = {
    dimensional: `WHY SHIPPED — Root Cause of Escape\n\nProblem: ${defect} escaped to customer without detection\n\nWhy 1: Out-of-spec ${p} reached customer without being detected\nWhy 2: Final inspection did not detect the dimensional non-conformance\nWhy 3: Sampling plan (AQL-based) missed non-conforming parts — frequency insufficient\nWhy 4: Measurement method for this dimension had poor accuracy; gauge not calibrated\nWhy 5 (Escape Root Cause): 100% inspection not specified in control plan for this characteristic; sampling inspection allowed defective parts to pass\n\nEscape Point Confirmed: AQL-based sampling inspection missed out-of-spec parts; no 100% inspection requirement in control plan for this critical dimension.`,

    surface: `WHY SHIPPED — Root Cause of Escape\n\nProblem: ${defect} escaped to customer without detection\n\nWhy 1: Surface-defective ${p} reached customer without detection\nWhy 2: Visual inspection at final stage did not identify the surface defect\nWhy 3: Visual inspection criteria not clearly defined; no limit samples at inspection station\nWhy 4: Inspector judgment was subjective — no standard for accept/reject\nWhy 5 (Escape Root Cause): Inspection standard (ODS) not updated with surface defect criteria; limit samples not available — subjective inspection led to escape\n\nEscape Point Confirmed: Absence of defined visual limit samples and objective inspection criteria caused the defect to pass final inspection.`,

    welding: `WHY SHIPPED — Root Cause of Escape\n\nProblem: ${defect} escaped to customer without detection\n\nWhy 1: Defective weld on ${p} reached customer undetected\nWhy 2: Weld inspection (visual + NDT) did not detect the defect\nWhy 3: NDT (PT/MT/UT) frequency insufficient for this weld joint category\nWhy 4: Inspector skipped NDT step due to production pressure; not enforced by supervisor\nWhy 5 (Escape Root Cause): NDT step not mandatory in control plan; no enforcement mechanism — inspection skipped under pressure\n\nEscape Point Confirmed: NDT not mandated in control plan and insufficient inspection frequency allowed defective welds to escape.`,

    assembly: `WHY SHIPPED — Root Cause of Escape\n\nProblem: ${defect} escaped to customer without detection\n\nWhy 1: Incorrectly assembled ${p} reached customer undetected\nWhy 2: Final assembly check / functional test did not detect the assembly error\nWhy 3: Head rest / assembly verification check was done on sampling basis — not 100%\nWhy 4: Sampling method for offline assembly not adequate for detecting individual assembly errors\nWhy 5 (Escape Root Cause): 100% head rest / assembly checking method not established; sampling-based offline inspection insufficient for detecting individual unit errors\n\nEscape Point Confirmed: Sampling-based offline assembly inspection insufficient — individual unit errors escape when frequency is inadequate.`,

    material: `WHY SHIPPED — Root Cause of Escape\n\nProblem: ${defect} escaped to customer without detection\n\nWhy 1: Non-conforming material in ${p} was not detected before shipment\nWhy 2: Incoming inspection passed the non-conforming material\nWhy 3: Incoming inspection relied only on supplier Test Certificate — no physical testing\nWhy 4: Physical material testing not specified in incoming inspection plan for this characteristic\nWhy 5 (Escape Root Cause): Incoming inspection plan does not require physical material verification — supplier certificate alone accepted, allowing non-conforming material to enter production\n\nEscape Point Confirmed: Reliance on supplier certificate without physical verification allowed non-conforming material to be used.`,

    leak: `WHY SHIPPED — Root Cause of Escape\n\nProblem: ${defect} escaped to customer without detection\n\nWhy 1: Leaking ${p} was not detected before shipment\nWhy 2: End-of-line leak test did not detect the leak\nWhy 3: Leak test pressure / duration was below actual customer specification requirement\nWhy 4: Leak test parameters not validated against customer specification\nWhy 5 (Escape Root Cause): EOL leak test parameters (pressure, duration) not aligned with customer field conditions — non-representative test allowed borderline leaks to pass\n\nEscape Point Confirmed: EOL leak test not representative of field conditions — leak not detected in production test but manifests in customer use.`,

    coating: `WHY SHIPPED — Root Cause of Escape\n\nProblem: ${defect} escaped to customer without detection\n\nWhy 1: Non-conforming coating on ${p} was not detected before shipment\nWhy 2: Outgoing inspection did not detect coating deficiency\nWhy 3: Coating adhesion / salt spray test done on sampling basis — affected batch not tested\nWhy 4: Batch segregation for testing not followed; test sample not representative of batch\nWhy 5 (Escape Root Cause): Sampling plan for coating tests not linked to process batches — non-conforming batch shipped without batch-specific verification\n\nEscape Point Confirmed: Batch-level coating test results not tracked; sampling plan allowed non-conforming batch to ship without detection.`,

    mixed_parts: `WHY SHIPPED — Root Cause of Escape\n\nProblem: ${defect} escaped to customer without detection\n\nWhy 1: Wrong / mixed part in shipment was not detected before dispatch\nWhy 2: Pre-shipment verification check did not identify incorrect part number\nWhy 3: Packing verification only checked quantity, not part number accuracy\nWhy 4: No barcode scan / part number verification step in outgoing process\nWhy 5 (Escape Root Cause): Pre-shipment check procedure does not include mandatory part number verification against packing list — incorrect parts escape undetected\n\nEscape Point Confirmed: Pre-shipment verification limited to quantity check only; part number accuracy not verified before dispatch.`,

    general: `WHY SHIPPED — Root Cause of Escape\n\nProblem: ${defect} escaped to customer without detection\n\nWhy 1: Non-conforming ${p} reached customer without detection\nWhy 2: Outgoing inspection / final inspection did not detect the non-conformance\nWhy 3: Inspection frequency / method was inadequate for detecting this defect type\nWhy 4: Inspection method not validated; inspector not trained on this defect\nWhy 5 (Escape Root Cause): Outgoing inspection plan does not adequately address this defect type — method and frequency insufficient for reliable detection\n\nEscape Point Confirmed: Inadequate inspection method and frequency at final inspection allowed non-conforming product to be shipped.`,
  };
  return templates[type] || templates.general;
}

// ── CORRECTIVE ACTION FOR WHY MADE ───────────────────────────────────────────
function getCAwhyMade(type: string, partName: string): string {
  const templates: Record<string, string> = {
    assembly: `CORRECTIVE ACTION — For Why Made (Occurrence)\n\n1. TRACEABILITY TRACKING\n   Action: Traceability tracking record implemented and updated in real-time at ${partName || 'assembly'} station for each unit produced\n   Responsible: Production Supervisor\n   Target: Immediate\n\n2. MANPOWER CONTROL\n   Action: Line Leader / Line Supervisor to ensure SIS / contract manpower is NOT deployed at model-specific stations until completion of formal model training and assessment\n   Responsible: Line Supervisor + HR\n   Target: Immediate\n\n3. RE-SKILL ASSESSMENT\n   Action: Re-skill assessment audit completed by Quality Manager for all operators at this station as per Skill Matrix requirements\n   Responsible: Quality Manager\n   Target: Within 5 days\n\n4. QUALITY ALERT\n   Action: Quality Alert displayed at ${partName || 'assembly'} production line with photograph of defect, correct vs incorrect assembly illustration\n   Responsible: Quality Engineer\n   Target: Within 24 hours\n\n5. TRAINING & AWARENESS\n   Action: Training and awareness session conducted for ALL production members on correct assembly method for this model — attendance record maintained\n   Responsible: Training Dept / Quality\n   Target: Within 3 days`,

    dimensional: `CORRECTIVE ACTION — For Why Made (Occurrence)\n\n1. TOOL CHANGE MANAGEMENT\n   Action: Tool change schedule implemented with mandatory SPC check after every tool change — operator cannot continue without quality sign-off\n   Responsible: Manufacturing Engineer\n   Target: Within 5 days\n\n2. SPC IMPLEMENTATION\n   Action: Real-time SPC chart deployed for critical dimension — control limits set, reaction plan defined\n   Responsible: Quality Engineer\n   Target: Within 7 days\n\n3. FIXTURE PM\n   Action: Fixture preventive maintenance schedule updated — verification record maintained after each PM\n   Responsible: Tooling / Maintenance\n   Target: Within 5 days\n\n4. OPERATOR RETRAINING\n   Action: All concerned operators retrained on updated work instruction — assessment test conducted\n   Responsible: Training Dept\n   Target: Within 5 days`,

    general: `CORRECTIVE ACTION — For Why Made (Occurrence)\n\n1. PFMEA UPDATE\n   Action: Revise PFMEA — increase Severity rating for this failure mode; review and update Occurrence (O) rating based on root cause\n   Responsible: Quality Engineer\n   Target: Within 7 days\n\n2. PROCESS CONTROL IMPROVEMENT\n   Action: Implement additional process controls at the operation where root cause occurred — add monitoring frequency and reaction plan\n   Responsible: Quality + Manufacturing Engineering\n   Target: Within 7 days\n\n3. WORK INSTRUCTION UPDATE\n   Action: Update Work Instruction with current correct method; add limit samples / photographs; display at workstation\n   Responsible: Process Engineer\n   Target: Within 5 days\n\n4. OPERATOR RETRAINING\n   Action: All operators at this station retrained on updated WI — training record and sign-off maintained\n   Responsible: Training Dept\n   Target: Within 5 days\n\n5. QUALITY ALERT\n   Action: Quality Alert issued and displayed at relevant station with defect description and correct method\n   Responsible: Quality Engineer\n   Target: Within 24 hours`,
  };
  return templates[type] || templates.general;
}

// ── CORRECTIVE ACTION FOR WHY SHIPPED ────────────────────────────────────────
function getCAwhyShipped(type: string, partName: string): string {
  const templates: Record<string, string> = {
    assembly: `CORRECTIVE ACTION — For Why Shipped (Escape)\n\n1. 100% INSPECTION METHOD\n   Action: 100% head rest / assembly verification checking method introduced — every unit verified with complete sub-assembly before dispatch (not sampling)\n   Responsible: Quality Engineer\n   Target: Immediate\n\n2. EOL CONTROL PLAN UPDATE\n   Action: Check point added in End-of-Line (EOL) control plan for assembly verification — inspection method, frequency (100%), and reaction plan defined\n   Responsible: Quality Engineer\n   Target: Within 3 days\n\n3. INSPECTOR TRAINING\n   Action: All inspectors trained on revised EOL inspection method — limit samples provided at inspection station\n   Responsible: Quality Engineer\n   Target: Within 3 days`,

    dimensional: `CORRECTIVE ACTION — For Why Shipped (Escape)\n\n1. CONTROL PLAN UPDATE\n   Action: Final inspection frequency changed to 100% for this critical dimension until process capability Cpk ≥ 1.67 is demonstrated\n   Responsible: Quality Engineer\n   Target: Within 3 days\n\n2. GAUGE CALIBRATION\n   Action: All measurement equipment used for this dimension recalled and calibrated; calibration records updated\n   Responsible: Quality / Calibration Dept\n   Target: Within 3 days\n\n3. MSA STUDY\n   Action: MSA (GR&R) study conducted for this measurement method — acceptance criteria: GR&R < 10%\n   Responsible: Quality Engineer\n   Target: Within 7 days`,

    general: `CORRECTIVE ACTION — For Why Shipped (Escape)\n\n1. DETECTION CONTROL UPDATE\n   Action: Inspection frequency increased to 100% for this defect type until 30-day zero-recurrence confirmed; control plan updated accordingly\n   Responsible: Quality Engineer\n   Target: Within 3 days\n\n2. INSPECTION STANDARD UPDATE\n   Action: ODS / Inspection Standard updated with clear accept/reject criteria; limit samples / photographs provided at inspection station\n   Responsible: Quality Engineer\n   Target: Within 5 days\n\n3. INSPECTOR RETRAINING\n   Action: All inspectors retrained on updated inspection standard — attendance and competency assessment records maintained\n   Responsible: Quality / Training\n   Target: Within 5 days\n\n4. CONTROL PLAN UPDATE\n   Action: Detection rating reviewed in PFMEA; Control Plan updated with revised inspection method and frequency\n   Responsible: Quality Engineer\n   Target: Within 7 days`,
  };
  return templates[type] || templates.general;
}

export function generate8D(complaint: ComplaintInput): Report8D {
  const { customerName, partNumber, partName, defectDescription, quantityAffected, severity, assignedTo } = complaint;
  const refNumber = `8D-${Date.now().toString().slice(-8)}`;
  const today = new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  const defectType = detectDefectType(defectDescription);

  // ── D1: Team Members ──────────────────────────────────────────────────────
  const d1 = `8D REPORT REFERENCE: ${refNumber}
Date of Opening: ${today}
Customer: ${customerName}
Part No.: ${partNumber || 'N/A'} | Part Name: ${partName || 'N/A'}
Severity: ${severity}

TEAM CHAMPION:
• Name: ${assignedTo || 'Quality Manager'}
• Title: Quality Manager / Quality Head
• Responsibility: Overall coordination and submission of 8D report to customer

ADDITIONAL TEAM MEMBERS:
• Production Supervisor — Containment execution and production control
• Process / Manufacturing Engineer — Root cause investigation (occurrence)
• Quality Inspector — Sorting, inspection, and verification
• Line Leader — Shop floor monitoring and operator supervision
• Supplier Quality Representative — (if supplier-related root cause)
• Customer Representative — ${customerName} Quality Team

Team Formed: ${today}
4D Target: Within 24–48 hours of complaint receipt
8D Completion Target: Within 15 days`;

  // ── D2: Problem Description ──────────────────────────────────────────────
  const d2 = `PROBLEM DESCRIPTION (5W2H)

What:    ${defectDescription}
Where:   Found at Customer — ${customerName} (incoming inspection / production line / field)
When:    Reported on ${today}
Who:     Customer Quality Team — ${customerName}
Which:   Part No. ${partNumber || 'N/A'} | Part Name: ${partName || 'N/A'}
How Many: ${quantityAffected || 'Under investigation'} pcs reported as non-conforming
How Much: Severity — ${severity} | Potential impact: customer line disruption / dissatisfaction

Impact on Customer:
• Customer dissatisfaction — risk of escalation
• Potential for production line interruption if uncontained
• Risk of field / warranty failure (for ${severity === 'Critical' ? 'Safety-critical' : severity} severity)

Facilities Involved:
• Customer Plant: ${customerName}
• Supplier Plant: Our Manufacturing Location
• Transit / Logistics: Under review`;

  // ── D3: Containment ──────────────────────────────────────────────────────
  const d3 = `IMMEDIATE CONTAINMENT ACTIONS

At Customer Location:
1. 100% verification / sorting of all ${partName || 'parts'} at customer plant — ${quantityAffected || 'all suspect'} pcs placed under hold with RED rejection tag
2. Certified (conforming) stock identified with GREEN tag / White Dot Mark and released for production
3. Customer Quality Team informed within 24 hours — acknowledgement obtained

At Our Plant:
4. 100% verification of all Finished Goods at plant — results recorded
5. All WIP and in-process stock quarantined and sorted
6. Temporary 100% inspection checkpoint added before dispatch — effective immediately
7. All parts on transit: hold and verify before delivery to customer

Other Product / Platform at Risk: No similar platform identified as at risk
Identification of Certified Material: Certified parts identified by [White Dot Mark / Green Tag]

Sorting Results:
• Total sorted: [Update with actual qty]
• Defects found: [Update with actual qty]
• Containment Start Date: ${today}`;

  // ── D4: Why Made + Why Shipped ───────────────────────────────────────────
  const d4_why_made = getWhyMade(defectType, defectDescription, partName);
  const d4_why_shipped = getWhyShipped(defectType, defectDescription, partName);
  const d4 = `${d4_why_made}\n\n${'─'.repeat(60)}\n\n${d4_why_shipped}`;

  // ── D5: Corrective Actions ───────────────────────────────────────────────
  const d5_ca_why_made = getCAwhyMade(defectType, partName);
  const d5_ca_why_shipped = getCAwhyShipped(defectType, partName);
  const d5 = `${d5_ca_why_made}\n\n${'─'.repeat(60)}\n\n${d5_ca_why_shipped}`;

  // ── D6: Verification ─────────────────────────────────────────────────────
  const d6 = `VERIFICATION OF CORRECTIVE ACTIONS

Has the issue been turned ON and OFF? (Verification of Root Cause)
• ON (Reproduced): Defect reproduced by deploying untrained operator / removing control — defect confirmed
• OFF (Eliminated): Defect eliminated after implementing trained operator + traceability tracking — no defect in 15-day monitoring period
• Verification Method: Process audit + skill assessment + production monitoring for 30 days / 3 consecutive lots

Statistical / Objective Evidence:
• Last 15 days after corrective action implementation: Zero complaints received from ${customerName}
• Skill assessment audit conducted — result: Satisfactory (OK)
• ODS / Process Audit conducted — result: Satisfactory (OK)
• Control Plan checkpoint verified — 100% inspection result: Zero rejection in monitored period

Corrective Action Owner: ${assignedTo || 'Quality Manager'}
C.A. Owner Phone: [Update]
C.A. Owner Email: [Update]
Target Completion Date: ${today} (within 30 days of complaint date)

Certified Material Build Date: ${today}
How New / Certified Parts Will Be Identified: [White Dot Mark / Green Sticker / Special Tag — from this date onwards]`;

  // ── D7: Prevention ───────────────────────────────────────────────────────
  const d7 = `SYSTEMIC PREVENTION

How will this issue be avoided in the future?
1. By Product Audit — periodic product audit to include this characteristic as mandatory check point
2. Adding check point in Control Plan — permanent control established
3. Horizontal Deployment — check applied to all similar models / stations / processes
4. Lesson Learned entered in Quality Knowledge Management System

Other Facilities / Platforms at Risk:
• Reviewed all similar part numbers and processes — no other platform identified at risk currently
• Preventive monitoring established for similar models as additional control

Documentation Updated:
• DFMEA: Not Applicable
• PFMEA: Updated — failure mode added / ratings revised [Owner: Quality Engineer]
• Control Plan: Updated — inspection checkpoint added [Owner: Quality Engineer]
• Process Flow: Not Applicable
• Operation/Work Instruction (ODS): Updated — new standard displayed at station [Owner: Process Engineer]
• Drawing: Not Applicable
• Training Records: Updated — re-skill assessment and training records maintained

IATF 16949 Clause Reference:
• 10.2 Nonconformity and Corrective Action
• 8.5.6 Control of Changes
• 7.2 Competence`;

  // ── D8: Closure ──────────────────────────────────────────────────────────
  const d8 = `CLOSURE & TEAM RECOGNITION

The 8D Problem-Solving Team is congratulated and recognized for:

✓ Immediate response — Containment executed within 24 hours of complaint receipt
✓ Systematic root cause investigation — both Occurrence and Escape causes identified
✓ Robust corrective actions implemented for Why Made AND Why Shipped
✓ Objective verification through process audit, skill assessment, and production monitoring
✓ Horizontal deployment completed — similar risks addressed proactively
✓ All documents updated: PFMEA ✓ | Control Plan ✓ | Work Instruction ✓ | Training Records ✓
✓ On-time 8D submission to Customer: ${customerName}

CLOSURE STATEMENT: Closed
• All corrective actions verified as effective — zero recurrence in monitoring period
• Customer ${customerName} informed for final closure review and approval
• Lesson Learned documented and filed in Quality Knowledge Management System

8D Report Reference: ${refNumber}
Date of Closure: ${today}
Approved by: Quality Head / Plant Manager
Customer Approval: Pending — submitted to ${customerName} Quality Team`;

  return { d1, d2, d3, d4_why_made, d4_why_shipped, d4, d5_ca_why_made, d5_ca_why_shipped, d5, d6, d7, d8 };
}
