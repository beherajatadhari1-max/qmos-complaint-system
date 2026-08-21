import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

// Section-level questions — applied to ALL clauses in each section by section_no
const SECTION_Q: Record<string, string> = {
  '4': '1. Show me documented evidence for this clause — procedure, record, or register.\n2. When was this last reviewed or updated? Show the review record.\n3. Who is the process owner and what is their responsibility for this clause?\n4. How is compliance with this clause monitored and measured?\n5. Show me a record demonstrating this clause is effectively implemented.',
  '5': '1. How does top management demonstrate personal involvement in this requirement — beyond signing documents?\n2. Show me evidence this was reviewed at the last Management Review.\n3. How is this requirement communicated to all relevant personnel?\n4. What happens when this requirement is not met — what is the escalation process?\n5. Show me documented evidence of compliance with this clause.',
  '6': '1. Show me the planning document for this requirement.\n2. How are risks and opportunities considered in this planning activity?\n3. Who reviews and approves the plan — show the approval records.\n4. How are changes to this plan controlled and communicated?\n5. Show me the latest plan and its current implementation status.',
  '7': '1. Show me how resources for this requirement are determined, provided, and verified as adequate.\n2. What documented information is maintained for this clause — procedures, records, registers?\n3. Who is responsible and what competency is required for this activity?\n4. How is compliance with this requirement verified and monitored?\n5. Show me records demonstrating effective implementation in the last 6 months.',
  '8': '1. Show me the operational procedure or work instruction for this requirement.\n2. How are controls defined, monitored, and verified during production?\n3. What reaction plan exists if this requirement is not met — show the documented response?\n4. Show me production or inspection records demonstrating this requirement is followed.\n5. How are changes to this operational requirement controlled and approved?',
  '9': '1. Show me the monitoring data for this performance requirement — what KPIs are tracked?\n2. What is the current performance level — is it meeting the target?\n3. How are results trended and analysed — show me a trend chart or analysis?\n4. What action is taken when performance falls below target — show me a recent example?\n5. How is this performance data presented and acted upon at Management Review?',
  '10': '1. Show me the improvement records related to this requirement — what projects are active or closed?\n2. What methodology is used for identifying and implementing improvements (8D, Kaizen, A3, CAPA)?\n3. How are improvement results measured and verified — show before/after data?\n4. Are lessons learned from improvements documented and shared across the organization?\n5. How does improvement in this area link to quality objectives and customer satisfaction?',
};

// Specific clause questions — override section questions where exact clause_no matches
const CLAUSE_Q: Record<string, string> = {
  '4.1': '1. Show me your SWOT or PESTLE analysis. Who participated and when was it last updated?\n2. How are external issues (market, regulatory, technology) monitored and communicated to top management?\n3. How are internal issues (people, infrastructure, culture) identified and addressed?\n4. How is context analysis linked to your Risk and Opportunity Register?\n5. How often is the context reviewed — show me the last review evidence.',
  '4.2': '1. Show me your Interested Parties Register. Who is listed and why?\n2. How were their needs and expectations determined — contract, regulation, survey?\n3. When was this register last reviewed and updated?\n4. How are customer-specific requirements captured separately from other stakeholder needs?\n5. Which interested parties have the most impact on your QMS?',
  '4.3': '1. Show me the documented QMS Scope statement. Does it match your IATF/ISO certificate exactly?\n2. Are all products, processes, and sites included in the scope?\n3. If any clause is excluded, what is the documented justification?\n4. How has the scope been communicated to all employees?\n5. Has the scope changed since last certification — what triggered the change?',
  '4.4': '1. Show me your process interaction map or turtle diagram. Are all processes defined?\n2. How are process inputs, outputs, owners, and KPIs documented for each process?\n3. How do you verify that planned process controls are actually followed on the shop floor?\n4. How are process risks identified and controlled?\n5. What documented information is maintained to support process operation?',
  '5.1': '1. How does top management demonstrate active involvement in the QMS — not just signing documents?\n2. Show me evidence that top management attends Management Review meetings.\n3. How does top management ensure quality objectives are aligned to business strategy?\n4. What resources has top management committed to quality in the last 12 months?\n5. How does top management communicate the importance of quality to all employees?',
  '5.2': '1. Show me the current Quality Policy. Who approved it and when was it last reviewed?\n2. Is the quality policy appropriate to the organization — does it reflect your business context?\n3. Does the policy commit to meeting requirements and continual improvement?\n4. How is the quality policy communicated to all employees — can any operator explain its meaning?\n5. Is the quality policy available to interested parties such as customers and suppliers?',
  '5.3': '1. Show me the quality organizational chart. Are all quality-related roles and responsibilities defined?\n2. Who is responsible for product conformity, customer requirements, CAPA, and management review?\n3. How are responsibilities communicated to relevant personnel — job descriptions?\n4. How is the org chart kept updated when roles change?\n5. Is there a Management Representative or equivalent appointed?',
  '6.1': '1. Show me your Risk and Opportunity Register. How was it developed?\n2. How are risks rated — what methodology such as FMEA, risk matrix?\n3. Which risks are highest priority? What actions are being taken?\n4. How are opportunities identified and acted on?\n5. How often is the risk register reviewed and updated?',
  '6.2': '1. Show me the quality objectives document. Are they measurable and time-bound?\n2. Are the objectives aligned with the quality policy?\n3. Who is responsible for each objective — are owners assigned?\n4. How is progress against objectives monitored and reported?\n5. What happens when an objective is not achieved — show me an example.',
  '6.3': '1. How are changes to the QMS planned and controlled?\n2. Show me the change management process — what triggers a formal change review?\n3. How are the consequences of changes assessed before implementation?\n4. Who has authority to approve different types of changes?\n5. Show me a recent change — how was it managed, documented, and communicated?',
  '7.1': '1. How does the organization determine and provide the resources needed for the QMS?\n2. Show me the resource planning process — how are gaps identified?\n3. How are resource needs communicated to top management?\n4. Are infrastructure and environment resources adequate — show me the last assessment.\n5. How are resource constraints documented and escalated?',
  '7.2': '1. Show me the competency matrix for quality-critical roles.\n2. How are training needs identified — who decides what training is needed?\n3. Show training records for 3 operators in a critical process. Are all required trainings completed?\n4. How do you evaluate the effectiveness of training — not just attendance records?\n5. What qualifications are required for auditors, inspectors, and measurement personnel?',
  '7.3': '1. How is quality policy awareness measured across the organization?\n2. Ask any operator: What are the quality objectives for your department?\n3. Ask any operator: What happens if you detect a quality problem — what is your authority?\n4. How are relevant quality objectives communicated to shop-floor personnel?\n5. Are employees aware of the consequences of not following quality procedures?',
  '7.4': '1. How is internal and external communication on quality managed?\n2. How are quality issues communicated to relevant departments?\n3. What is the escalation process for quality alerts such as customer concern, field failure, major NC?\n4. How is communication to the customer managed — who has authority?\n5. Are quality communications documented and traceable?',
  '7.5': '1. Show me the document control procedure. How are documents created, approved, and released?\n2. How is the document master list maintained — is it current?\n3. How are obsolete documents identified and removed from use?\n4. Are external documents such as customer drawings and standards controlled in the same system?\n5. How are documents controlled at remote sites or with contractors?',
  '8.1': '1. Show me how production planning is linked to customer orders and capacity.\n2. Pick any product — show me the complete Process Flow Chart.\n3. How are process controls defined and where are they documented such as Control Plan and Work Instructions?\n4. How do you verify that planned controls are actually followed on the shop floor?\n5. How are changes to operational plans communicated and controlled?',
  '8.2': '1. How are customer requirements formally captured and reviewed before acceptance?\n2. Show me the customer order review process — what is checked and by whom?\n3. How are requirements that differ from previous agreements identified and resolved?\n4. How are verbal customer requirements documented?\n5. How are changes to customer requirements communicated internally?',
  '8.3': '1. Show me the design and development process — is it documented?\n2. How are design inputs captured and reviewed for completeness?\n3. How are design reviews, verification, and validation conducted and documented?\n4. How are design changes controlled and approved?\n5. Are design records maintained and retrievable?',
  '8.4': '1. Show me the approved supplier list and how it is maintained.\n2. How are new suppliers selected and approved?\n3. How is supplier performance monitored — what KPIs are used?\n4. How are supplier risks identified and managed?\n5. What controls are in place for externally provided processes, products, and services?',
  '8.5': '1. Show me how production processes are controlled — Control Plan, Work Instructions, operator instructions.\n2. Are qualified personnel assigned to quality-critical operations?\n3. How is process monitoring conducted during production?\n4. How are production process changes controlled and approved?\n5. Show me product identification and traceability for a current production lot.',
  '8.6': '1. Show me the incoming inspection, in-process inspection, and final inspection process.\n2. What is the sampling plan and acceptance criteria for each inspection stage?\n3. How are inspection results recorded and trended?\n4. What happens if product fails inspection at any stage?\n5. Are inspection records retained and traceable?',
  '8.7': '1. Show me the nonconforming product process — from identification to disposition.\n2. How is nonconforming product segregated and clearly identified?\n3. Who has authority to make disposition decisions such as use-as-is, rework, or scrap?\n4. Show me the nonconformance register — is it up to date and complete?\n5. How are nonconformance trends analysed and used to drive improvement?',
  '9.1': '1. Show me how quality performance is monitored across all key processes.\n2. What monitoring and measurement KPIs are tracked — PPM, scrap, OEE, customer complaints?\n3. How is monitoring data collected and reported — frequency, method, who reviews?\n4. How are trends identified and actioned — show me a trend analysis.\n5. How is monitoring data presented at Management Review?',
  '9.2': '1. Show me the annual internal audit plan — does it cover all clauses, processes, and shifts?\n2. Was the audit plan completed as scheduled — are there any overdue audits?\n3. Pick any audit report — show me the findings and the CAPA raised. Are CAPAs closed?\n4. How are high-risk areas given higher audit frequency?\n5. Are auditors independent — do they audit areas they are not responsible for?',
  '9.3': '1. Show me Management Review minutes for the last 12 months — how many reviews were conducted?\n2. Who attended the review — did top management actually attend?\n3. Are all mandatory inputs covered — audit results, customer satisfaction, NC trends, objectives?\n4. Show me action items from the last review — are they all closed or on track?\n5. What major decisions or resource commitments resulted from the last Management Review?',
  '10.1': '1. How does the organization systematically identify and pursue improvement opportunities?\n2. Show me the active improvement project register — what projects are in progress?\n3. How are improvement priorities set — based on what data?\n4. How are improvement results measured and reported?\n5. How is continual improvement embedded in daily operations — not just annual projects?',
  '10.2': '1. Show me the nonconformance and corrective action process — from identification to closure.\n2. How quickly are corrective actions opened after an NC is identified?\n3. Show me 3 recent CAPAs — are root causes systemic and not just correction of the symptom?\n4. How is corrective action effectiveness verified — show me an effectiveness check.\n5. How are lessons learned from CAPAs shared across processes and products?',
  '10.3': '1. Show me the continual improvement project register — what is completed and what is active?\n2. Pick a completed improvement — what was the before and after measurement? What was the gain?\n3. How are Kaizen events organized and tracked?\n4. Is improvement performance trending positively year-on-year — show KPI trend over 3 years.\n5. How are lessons learned from one product or plant shared across the organization?',
};

export async function POST() {
  try {
    const db = getDB();

    // Step 1: Update ALL clauses by section_no — guarantees every clause gets questions
    const updateBySection = db.prepare(
      `UPDATE audit_clauses SET audit_questions = ? WHERE section_no = ?`
    );
    let sectionUpdated = 0;
    for (const [sec, q] of Object.entries(SECTION_Q)) {
      const r = updateBySection.run(q, sec) as { changes: number };
      sectionUpdated += r.changes;
    }

    // Step 2: Override with specific clause questions (exact match)
    const updateByClause = db.prepare(
      `UPDATE audit_clauses SET audit_questions = ? WHERE clause_no = ?`
    );
    let clauseUpdated = 0;
    for (const [cno, q] of Object.entries(CLAUSE_Q)) {
      const r = updateByClause.run(q, cno) as { changes: number };
      clauseUpdated += r.changes;
    }

    // Step 3: Also try trimmed match to catch any whitespace differences
    const updateByTrim = db.prepare(
      `UPDATE audit_clauses SET audit_questions = ? WHERE TRIM(clause_no) = ?`
    );
    for (const [cno, q] of Object.entries(CLAUSE_Q)) {
      updateByTrim.run(q, cno);
    }

    const total = (db.prepare('SELECT COUNT(*) as c FROM audit_clauses').get() as { c: number }).c;
    const stillEmpty = (db.prepare(
      `SELECT COUNT(*) as c FROM audit_clauses WHERE audit_questions = '' OR audit_questions IS NULL`
    ).get() as { c: number }).c;

    return NextResponse.json({
      message: `Questions fixed! ${sectionUpdated} clauses updated by section, ${clauseUpdated} overridden with detailed questions. ${stillEmpty} still empty out of ${total} total.`,
      sectionUpdated, clauseUpdated, total, stillEmpty,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
