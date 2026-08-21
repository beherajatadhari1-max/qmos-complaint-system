export const dynamic = "force-dynamic";
import { NextResponse } from 'next/server';
import { getDB } from '@/lib/db';

const CLAUSES = [
  // ── CLAUSE 4 ──────────────────────────────────────────────────────────────
  {
    clause_no:'4.1', clause_title:'Understanding the Organization and its Context',
    standard:'ISO', section:'CONTEXT OF THE ORGANIZATION', section_no:'4',
    simple_meaning:'Identify all internal and external factors that affect your QMS — risks, opportunities, strengths and weaknesses.',
    procedures:'• Context Analysis Procedure\n• Risk Management Procedure\n• SWOT/PESTLE Analysis SOP',
    documents_required:'• SWOT Analysis report (signed by Top Mgmt)\n• PESTLE Analysis\n• Internal issues list\n• External issues list\n• Risk & Opportunity Register\n• Context review minutes (annual minimum)',
    applicable_process:'Top Management\nMR\nQA\nAll HODs',
    original_requirement:'The organization shall determine external and internal issues that are relevant to its purpose and its strategic direction and that affect its ability to achieve the intended result(s) of its quality management system. (ISO 9001:2015 Cl. 4.1)',
    audit_questions:'1. Show me your SWOT or PESTLE analysis. Who participated in preparing it?\n2. When was the context last reviewed? Show me the review record or minutes.\n3. How are external issues (market, regulatory, technology changes) tracked and communicated to top management?\n4. How are internal issues (resource gaps, turnover, infrastructure) identified and addressed?\n5. How is this context linked to your Risk & Opportunity Register?'
  },
  {
    clause_no:'4.2', clause_title:'Understanding Needs & Expectations of Interested Parties',
    standard:'ISO', section:'CONTEXT OF THE ORGANIZATION', section_no:'4',
    simple_meaning:'Know who is affected by your business and what they expect from you.',
    procedures:'• Interested Parties Management Procedure\n• Stakeholder Analysis SOP',
    documents_required:'• Interested Parties Register\n• Needs & Expectations Matrix\n• Annual review evidence',
    applicable_process:'Top Management\nMR\nQA\nAll HODs',
    original_requirement:'The organization shall determine the interested parties that are relevant to the QMS and the requirements of these interested parties. (ISO 9001:2015 Cl. 4.2)',
    audit_questions:'1. Show me your Interested Parties Register. Who is listed?\n2. How were their needs and expectations determined — survey, contract, regulation?\n3. When was this list last reviewed and updated?\n4. How are customer-specific requirements captured separately from general stakeholder needs?\n5. Are regulatory bodies listed as interested parties? What are their requirements?'
  },
  {
    clause_no:'4.3', clause_title:'Determining the Scope of the QMS',
    standard:'ISO', section:'CONTEXT OF THE ORGANIZATION', section_no:'4',
    simple_meaning:'Define clearly what your QMS covers — which products, processes, sites, and customers.',
    procedures:'• QMS Scope Definition Procedure',
    documents_required:'• Documented QMS Scope Statement\n• IATF Certification scope match\n• Supporting functions listed',
    applicable_process:'Top Management\nMR\nQA',
    original_requirement:'The organization shall determine the boundaries and applicability of the QMS to establish its scope. (ISO 9001:2015 Cl. 4.3)',
    audit_questions:'1. Show me the documented QMS scope. Does it match the IATF certificate scope exactly?\n2. Are all products, processes, and sites listed in the scope?\n3. If any clause is excluded, what is the justification?\n4. Are supporting functions (remote or on-site) included in the scope?\n5. Has the scope been communicated to all employees?'
  },
  {
    clause_no:'4.3.1', clause_title:'Scope — Supplemental (IATF)',
    standard:'IATF', section:'CONTEXT OF THE ORGANIZATION', section_no:'4',
    simple_meaning:'AUTOMOTIVE: All supporting functions must be in scope. Design exclusion requires justification.',
    procedures:'• QMS Scope Supplemental Procedure',
    documents_required:'• Scope document with supporting function list\n• Design exclusion justification (if applicable)\n• Site matrix',
    applicable_process:'Top Management\nMR\nQA',
    original_requirement:'The scope shall include all manufacturing plants and supporting functions (on-site or remote). Design and development exclusions require justification. (IATF 16949:2016 Cl. 4.3.1)',
    audit_questions:'1. Does the scope include all manufacturing sites AND supporting functions (HR, IT, Finance, Purchase)?\n2. If design responsibility is excluded, show me the written justification and customer agreement.\n3. Show me the site matrix — are all locations addressed?\n4. How do you manage QMS requirements for remote support functions?\n5. Has customer approved your scope boundaries?'
  },
  {
    clause_no:'4.3.2', clause_title:'Customer-Specific Requirements',
    standard:'IATF', section:'CONTEXT OF THE ORGANIZATION', section_no:'4',
    simple_meaning:'AUTOMOTIVE: All OEM customer-specific requirements must be identified, reviewed, and embedded into your QMS.',
    procedures:'• CSR Management Procedure',
    documents_required:'• CSR Register per customer\n• CSR review evidence\n• CSR-to-QMS linkage matrix',
    applicable_process:'QA\nCustomer Quality\nMR',
    original_requirement:'Customer-specific requirements shall be evaluated and included in the scope of the organization\'s QMS. (IATF 16949:2016 Cl. 4.3.2)',
    audit_questions:'1. Show me the CSR register. Which customers have CSRs and are all current revisions captured?\n2. How do you get notified when a customer updates their CSR?\n3. Pick one CSR requirement — show me where it is implemented in your QMS.\n4. Who is responsible for reviewing CSRs? Show me training/awareness evidence.\n5. When was the CSR register last updated?'
  },
  {
    clause_no:'4.4', clause_title:'QMS and its Processes',
    standard:'ISO', section:'CONTEXT OF THE ORGANIZATION', section_no:'4',
    simple_meaning:'Define and manage all your business processes — inputs, outputs, sequence, and interactions.',
    procedures:'• Process Interaction Matrix Procedure\n• Turtle Diagram SOP',
    documents_required:'• Process Interaction Matrix\n• Turtle Diagrams per process\n• Process KPIs',
    applicable_process:'MR\nAll Process Owners',
    original_requirement:'The organization shall establish, implement, maintain, and continually improve a QMS, including the processes needed and their interactions. (ISO 9001:2015 Cl. 4.4)',
    audit_questions:'1. Show me the process interaction matrix — are all processes and their interactions documented?\n2. Select one process — show me its Turtle Diagram (inputs, outputs, resources, methods, KPIs).\n3. How are outsourced processes controlled and monitored?\n4. Who is the process owner for each key process? Are they aware of their responsibility?\n5. How is process performance measured and reviewed?'
  },
  {
    clause_no:'4.4.1.1', clause_title:'Conformance of Products and Processes',
    standard:'IATF', section:'CONTEXT OF THE ORGANIZATION', section_no:'4',
    simple_meaning:'AUTOMOTIVE: Complete traceability from customer requirement → FMEA → Control Plan → WI → inspection record.',
    procedures:'• Product Conformance Traceability Procedure',
    documents_required:'• Customer requirement to FMEA linkage\n• Control Plan vs FMEA cross-reference\n• Inspection records',
    applicable_process:'QA\nProduction\nEngineering',
    original_requirement:'The organization shall ensure that product and process conformance is maintained throughout the product and process lifecycle. (IATF 16949:2016 Cl. 4.4.1.1)',
    audit_questions:'1. Pick any product — trace from customer drawing to FMEA to Control Plan to Work Instruction. Are there any gaps?\n2. Show me how special characteristics flow from drawing through FMEA → CP → WI.\n3. How do you ensure conformance when a process change is made?\n4. Show me a recent inspection record — is it traceable to the Control Plan?\n5. What happens when conformance is lost at any stage?'
  },
  {
    clause_no:'4.4.1.2', clause_title:'Product Safety',
    standard:'IATF', section:'CONTEXT OF THE ORGANIZATION', section_no:'4',
    simple_meaning:'AUTOMOTIVE CRITICAL: Safety-related products must have a documented process — identified, controlled, traceable, and customer-approved.',
    procedures:'• Product Safety Management Procedure',
    documents_required:'• Safety characteristic list\n• Safety approval records\n• Customer safety requirements\n• Product Safety representative appointment letter',
    applicable_process:'QA\nEngineering\nTop Management',
    original_requirement:'The organization shall have a documented process to manage product-related safety. Safety characteristics must be identified, controlled with special care, and customer-approved. (IATF 16949:2016 Cl. 4.4.1.2)',
    audit_questions:'1. Show me the appointed Product Safety representative — is there a formal appointment letter?\n2. Which of your products have safety characteristics? Show me the safety characteristic list.\n3. How are safety characteristics identified in drawings, FMEA, Control Plan, and WI?\n4. Show me customer approval for safety-related process or design changes.\n5. What training has the safety representative received?'
  },
  // ── CLAUSE 5 ──────────────────────────────────────────────────────────────
  {
    clause_no:'5.1', clause_title:'Leadership and Commitment',
    standard:'ISO', section:'LEADERSHIP', section_no:'5',
    simple_meaning:'Top management must actively lead the QMS — not just delegate it.',
    procedures:'• Leadership & Commitment Procedure',
    documents_required:'• Management Review minutes\n• Quality policy signed by Top Mgmt\n• Resource allocation records',
    applicable_process:'Top Management\nMR',
    original_requirement:'Top management shall demonstrate leadership and commitment with respect to the QMS by taking accountability for the effectiveness of the QMS. (ISO 9001:2015 Cl. 5.1)',
    audit_questions:'1. How does top management demonstrate personal involvement in quality — beyond signing the policy?\n2. Show me Management Review minutes — is top management participating actively?\n3. How does top management ensure adequate resources are provided for QMS?\n4. How does top management respond when a major customer complaint or quality failure occurs?\n5. Ask the Plant Head: What are your three most important quality objectives this year?'
  },
  {
    clause_no:'5.1.1.1', clause_title:'Corporate Responsibility',
    standard:'IATF', section:'LEADERSHIP', section_no:'5',
    simple_meaning:'AUTOMOTIVE: Ethics policy including anti-bribery, whistleblower protection, and responsible business conduct.',
    procedures:'• Corporate Responsibility Policy\n• Ethics & Anti-Bribery Procedure',
    documents_required:'• Corporate Responsibility Policy document\n• Anti-bribery statement\n• Whistleblower mechanism evidence',
    applicable_process:'Top Management\nHR\nMR',
    original_requirement:'Top management shall define and implement a process for corporate responsibility including anti-bribery, whistleblowing, and an ethics escalation process. (IATF 16949:2016 Cl. 5.1.1.1)',
    audit_questions:'1. Show me the corporate responsibility or ethics policy — is it signed by top management?\n2. Is there an anti-bribery policy? Show evidence of employee communication.\n3. How can employees report ethical concerns confidentially (whistleblower channel)?\n4. Has anyone raised an ethics concern in the past year? How was it handled?\n5. Is corporate responsibility training included in induction?'
  },
  {
    clause_no:'5.1.1.2', clause_title:'Process Effectiveness and Efficiency',
    standard:'IATF', section:'LEADERSHIP', section_no:'5',
    simple_meaning:'AUTOMOTIVE: Top management must review process-level KPIs — OEE, scrap, Cpk — not just final product quality.',
    procedures:'• Process Performance Review Procedure',
    documents_required:'• OEE reports\n• Process KPI dashboard\n• Management review inputs',
    applicable_process:'Top Management\nProduction\nQA',
    original_requirement:'Top management shall review process performance data to ensure both effectiveness and efficiency of the manufacturing and support processes. (IATF 16949:2016 Cl. 5.1.1.2)',
    audit_questions:'1. Show me process KPI data reviewed by top management — OEE, scrap rate, Cpk trends.\n2. In the last Management Review, which process was identified as least efficient? What action was taken?\n3. How often are process KPIs reviewed by top management — monthly, quarterly?\n4. Show me one example where top management action improved a process KPI.\n5. Are process KPIs linked to quality objectives?'
  },
  {
    clause_no:'5.1.1.3', clause_title:'Process Owners',
    standard:'IATF', section:'LEADERSHIP', section_no:'5',
    simple_meaning:'AUTOMOTIVE: Every QMS process must have a named process owner with defined authority.',
    procedures:'• Process Owner Assignment Procedure',
    documents_required:'• Organization chart with process owners\n• Process owner responsibility matrix\n• Job descriptions',
    applicable_process:'Top Management\nMR\nAll HODs',
    original_requirement:'Top management shall appoint process owners who are responsible for managing the process and its outputs. (IATF 16949:2016 Cl. 5.1.1.3)',
    audit_questions:'1. Show me the org chart — is a process owner named for every QMS process?\n2. Interview one process owner: What processes do you own? What are your KPIs?\n3. Do process owners have authority to make changes to their processes?\n4. Are process owners listed in job descriptions?\n5. How were process owners trained or prepared for their role?'
  },
  {
    clause_no:'5.1.2', clause_title:'Customer Focus',
    standard:'ISO', section:'LEADERSHIP', section_no:'5',
    simple_meaning:'Top management must ensure customer requirements are understood, met, and satisfaction is enhanced.',
    procedures:'• Customer Focus Procedure',
    documents_required:'• Customer satisfaction survey results\n• Customer complaint trends\n• CSR compliance records',
    applicable_process:'Top Management\nCustomer Quality\nQA',
    original_requirement:'Top management shall demonstrate leadership and commitment with respect to customer focus by ensuring that customer requirements are determined and met. (ISO 9001:2015 Cl. 5.1.2)',
    audit_questions:'1. How does top management monitor customer satisfaction — scorecard, surveys, complaint trends?\n2. Show me the latest customer satisfaction data. What trend is it showing?\n3. When customer PPM or scorecard worsens, how does top management respond?\n4. Can you show me an instance where customer feedback directly triggered a QMS improvement?\n5. How are customer requirements flowed to all relevant departments?'
  },
  {
    clause_no:'5.2.1', clause_title:'Establishing the Quality Policy',
    standard:'ISO', section:'LEADERSHIP', section_no:'5',
    simple_meaning:'Top management must establish a Quality Policy committing to customer requirements and continual improvement.',
    procedures:'• Quality Policy Procedure',
    documents_required:'• Signed Quality Policy document\n• Policy review records',
    applicable_process:'Top Management\nMR',
    original_requirement:'Top management shall establish, implement, and maintain a quality policy that is appropriate to the purpose and context of the organization. (ISO 9001:2015 Cl. 5.2.1)',
    audit_questions:'1. Show me the Quality Policy — is it signed and dated by the current top management?\n2. When was the policy last reviewed and updated?\n3. Does the policy include a commitment to customer requirements AND continual improvement?\n4. Is the policy appropriate to the company size and nature of products?\n5. How does the Quality Policy link to Quality Objectives?'
  },
  {
    clause_no:'5.2.2', clause_title:'Communicating the Quality Policy',
    standard:'ISO', section:'LEADERSHIP', section_no:'5',
    simple_meaning:'The Quality Policy must be understood by all employees and displayed at the workplace.',
    procedures:'• Communication Procedure',
    documents_required:'• Policy display evidence (photos)\n• Employee awareness test records\n• Induction training records',
    applicable_process:'All Employees\nHR\nMR',
    original_requirement:'The quality policy shall be available and maintained as documented information, communicated, understood, and applied within the organization. (ISO 9001:2015 Cl. 5.2.2)',
    audit_questions:'1. Ask a shopfloor operator: Can you explain the Quality Policy in your own words?\n2. Is the policy displayed in local language at workstations and common areas?\n3. Show me awareness training records — has every employee been trained on the policy?\n4. How is the policy communicated to new joiners during induction?\n5. How is the policy made available to external interested parties?'
  },
  {
    clause_no:'5.3', clause_title:'Organizational Roles, Responsibilities and Authorities',
    standard:'ISO', section:'LEADERSHIP', section_no:'5',
    simple_meaning:'Define who is responsible for what. Everyone must know their quality-related role.',
    procedures:'• RACI Matrix Procedure',
    documents_required:'• Org chart\n• Job descriptions\n• RACI Matrix',
    applicable_process:'Top Management\nAll HODs',
    original_requirement:'Top management shall ensure that the responsibilities and authorities for relevant roles are assigned, communicated, and understood within the organization. (ISO 9001:2015 Cl. 5.3)',
    audit_questions:'1. Show me the organization chart — is it current and approved?\n2. Pick one role — show me the job description. Does it include quality responsibilities?\n3. Is there a RACI matrix for key QMS processes?\n4. Ask any employee: Who is your quality contact if you find a nonconformance?\n5. Is the MR (Management Representative) clearly identified with documented authority?'
  },
  {
    clause_no:'5.3.2', clause_title:'Responsibility and Stop Production Authority',
    standard:'IATF', section:'LEADERSHIP', section_no:'5',
    simple_meaning:'AUTOMOTIVE CRITICAL: A specific person must have authority to STOP production when quality problems occur.',
    procedures:'• Stop Shipment Authority Procedure',
    documents_required:'• Stop production/shipment authority appointment\n• Customer communication responsibility matrix',
    applicable_process:'QA Head\nProduction Head',
    original_requirement:'The organization shall appoint personnel with responsibility and authority to ensure product conformance, to initiate action to prevent nonconformity, and to stop production/shipments. (IATF 16949:2016 Cl. 5.3.2)',
    audit_questions:'1. Who has the authority to stop production? Is this documented in their appointment letter or job description?\n2. Show me a recent example where production was stopped for a quality issue. What happened?\n3. Can a quality engineer or operator stop production, or only the QA Manager?\n4. Who is responsible for communicating with customers when a quality issue is detected?\n5. Is this stop-production authority known and practiced on the shopfloor — ask an operator.'
  },
  // ── CLAUSE 6 ──────────────────────────────────────────────────────────────
  {
    clause_no:'6.1.1', clause_title:'Actions to Address Risks and Opportunities',
    standard:'ISO', section:'PLANNING', section_no:'6',
    simple_meaning:'Proactively identify risks that could prevent QMS goals, and opportunities for improvement.',
    procedures:'• Risk & Opportunity Management Procedure',
    documents_required:'• Risk & Opportunity Register\n• Action plans for top risks\n• Review records',
    applicable_process:'MR\nQA\nAll HODs',
    original_requirement:'When planning for the QMS, the organization shall consider the issues and requirements from 4.1 and 4.2 and determine the risks and opportunities that need to be addressed. (ISO 9001:2015 Cl. 6.1.1)',
    audit_questions:'1. Show me the Risk & Opportunity Register — how many risks are identified and rated?\n2. How are risks from the context analysis (4.1) and interested parties (4.2) linked to this register?\n3. Pick the top 3 risks — what actions are planned and what is the current status?\n4. When was the register last reviewed? Who reviews it?\n5. Show me an opportunity that was identified and implemented — what was the result?'
  },
  {
    clause_no:'6.1.2.3', clause_title:'Contingency Plans',
    standard:'IATF', section:'PLANNING', section_no:'6',
    simple_meaning:'AUTOMOTIVE CRITICAL: Must have documented contingency plans for ALL disruptions — equipment breakdown, supplier failure, utility loss, IT failure, natural disaster.',
    procedures:'• Business Continuity / Contingency Plan Procedure',
    documents_required:'• Contingency plan documents\n• Annual test records\n• Employee training evidence',
    applicable_process:'Top Management\nMR\nAll HODs\nMaintenance',
    original_requirement:'The organization shall prepare contingency plans to satisfy customer requirements in the event of an emergency such as utility interruptions, equipment failure, labour shortage, and field returns. (IATF 16949:2016 Cl. 6.1.2.3)',
    audit_questions:'1. Show me the contingency plan. Does it cover: key machine breakdown, main supplier failure, power/utility cut, IT/ERP failure, labour shortage, natural disaster?\n2. When was the contingency plan last tested or simulated? Show me the test record.\n3. How are employees trained on the contingency plan? Show training records.\n4. Has any contingency plan been activated in the last 2 years? What happened?\n5. Is the customer notified during contingency activation? Show the communication procedure.'
  },
  {
    clause_no:'6.2.1', clause_title:'Quality Objectives',
    standard:'ISO', section:'PLANNING', section_no:'6',
    simple_meaning:'Set measurable quality targets at relevant levels linked to the Quality Policy.',
    procedures:'• Quality Objectives Procedure',
    documents_required:'• Quality Objectives document\n• KPI dashboard\n• Review records',
    applicable_process:'All Departments',
    original_requirement:'The organization shall establish quality objectives at relevant functions, levels, and processes needed for the QMS. Quality objectives shall be measurable, monitored, communicated, and updated as appropriate. (ISO 9001:2015 Cl. 6.2.1)',
    audit_questions:'1. Show me the quality objectives — are they SMART (Specific, Measurable, Achievable, Relevant, Time-bound)?\n2. Are objectives set at plant level AND department level?\n3. How do objectives link to the Quality Policy commitments?\n4. Ask a department head: What is your quality objective for this year and what is the current status?\n5. When were objectives last reviewed — are they on track?'
  },
  // ── CLAUSE 7 ──────────────────────────────────────────────────────────────
  {
    clause_no:'7.1.3', clause_title:'Infrastructure',
    standard:'ISO', section:'SUPPORT', section_no:'7',
    simple_meaning:'Provide and maintain all buildings, equipment, utilities, IT systems needed for production.',
    procedures:'• Infrastructure Management Procedure\n• TPM Procedure',
    documents_required:'• Equipment list\n• Maintenance records (PM, breakdown)\n• OEE reports',
    applicable_process:'Maintenance\nProduction',
    original_requirement:'The organization shall determine, provide, and maintain the infrastructure necessary for the operation of its processes and to achieve conformity of products and services. (ISO 9001:2015 Cl. 7.1.3)',
    audit_questions:'1. Show me the equipment master list — is it complete and current?\n2. Pick any critical machine — show me its PM schedule and last 3 maintenance records.\n3. What is the current OEE for top 3 critical machines? Show me the trend.\n4. How are breakdown incidents recorded and analysed?\n5. How is production capacity versus customer demand monitored?'
  },
  {
    clause_no:'7.1.5.1.1', clause_title:'Measurement System Analysis (MSA)',
    standard:'IATF', section:'SUPPORT', section_no:'7',
    simple_meaning:'AUTOMOTIVE: MSA (Gauge R&R) must be done on all gauges referenced in the Control Plan. GRR must be ≤10% acceptable, ≤30% conditionally acceptable.',
    procedures:'• MSA Study Procedure',
    documents_required:'• MSA study results per gauge\n• GRR acceptance criteria\n• Customer approval for borderline gauges',
    applicable_process:'QA',
    original_requirement:'Statistical studies shall be conducted to analyse the variation present in the results of each type of measurement and test equipment system used in the control plan. (IATF 16949:2016 Cl. 7.1.5.1.1)',
    audit_questions:'1. Show me the MSA study plan — does it cover all gauges referenced in the Control Plan?\n2. Pick any critical gauge — show me the GRR study result. What is the %GRR?\n3. Are any gauges with GRR between 10–30% approved by the customer?\n4. When were MSA studies last performed? Are they within the review period?\n5. Show me what happens when a gauge fails MSA — how is the gauge handled?'
  },
  {
    clause_no:'7.1.5.3.1', clause_title:'Internal Laboratory',
    standard:'IATF', section:'SUPPORT', section_no:'7',
    simple_meaning:'AUTOMOTIVE: Internal lab must have a documented scope, qualified personnel, and controlled environment.',
    procedures:'• Internal Lab Scope Procedure',
    documents_required:'• Internal lab scope list\n• Test method documentation\n• Technician training records',
    applicable_process:'QA',
    original_requirement:'The organization\'s internal laboratory shall have a defined scope that includes its capability to perform required inspection, test, or calibration services. (IATF 16949:2016 Cl. 7.1.5.3.1)',
    audit_questions:'1. Show me the documented lab scope — does it match the tests referenced in the Control Plan?\n2. Pick any test method — show me the documented test procedure. Is it current?\n3. Show me the technician qualification records for the people performing lab tests.\n4. How is the lab environment (temperature, humidity, vibration) controlled and recorded?\n5. How are reference standards used in the lab calibrated and traceable?'
  },
  {
    clause_no:'7.2.3', clause_title:'Internal Auditor Competency',
    standard:'IATF', section:'SUPPORT', section_no:'7',
    simple_meaning:'AUTOMOTIVE: Internal auditors must be trained and qualified. Qualification records must be maintained.',
    procedures:'• Internal Auditor Qualification Procedure',
    documents_required:'• Auditor training certificates\n• Auditor qualification matrix\n• CQI-19/ISO 19011 training evidence',
    applicable_process:'QA\nHR',
    original_requirement:'The organization shall have a process to verify that internal auditors are competent to audit the QMS and manufacturing processes. (IATF 16949:2016 Cl. 7.2.3)',
    audit_questions:'1. Show me the internal auditor qualification matrix — who is qualified to audit what?\n2. Pick one auditor — show me their training certificate and audit history.\n3. Are auditors trained in IATF 16949 standard, process auditing, and product auditing separately?\n4. How do you ensure auditors do NOT audit their own work area?\n5. When were auditor qualifications last reviewed?'
  },
  {
    clause_no:'7.3', clause_title:'Awareness',
    standard:'ISO', section:'SUPPORT', section_no:'7',
    simple_meaning:'All employees must understand the Quality Policy, their role, and consequences of poor quality.',
    procedures:'• Employee Awareness Procedure',
    documents_required:'• Awareness training records\n• Quality policy acknowledgement\n• Induction records',
    applicable_process:'HR\nAll Employees',
    original_requirement:'The organization shall ensure that persons doing work under the organization\'s control are aware of the quality policy, quality objectives, their contribution to QMS effectiveness, and implications of not conforming to QMS requirements. (ISO 9001:2015 Cl. 7.3)',
    audit_questions:'1. Ask 3 shopfloor operators: What is the quality policy? What happens if they ship a defective part?\n2. Show me awareness training records — when was the last training?\n3. How are new employees made aware during induction?\n4. How are contract and temporary workers included in awareness programs?\n5. Is awareness effectiveness verified — test scores or refresher training?'
  },
  {
    clause_no:'7.3.2', clause_title:'Employee Motivation and Empowerment',
    standard:'IATF', section:'SUPPORT', section_no:'7',
    simple_meaning:'AUTOMOTIVE: Employees must be empowered to stop production and raise quality concerns without fear.',
    procedures:'• Employee Motivation Procedure\n• Stop Production Authority Procedure',
    documents_required:'• Employee satisfaction survey\n• Stop-call escalation records\n• Quality suggestion scheme records',
    applicable_process:'HR\nProduction\nTop Management',
    original_requirement:'The organization shall have a process to motivate employees to achieve quality objectives, to make continual improvements, and to create an environment that promotes innovation. Employees shall feel empowered to stop production to resolve quality issues. (IATF 16949:2016 Cl. 7.3.2)',
    audit_questions:'1. Ask an operator: If you see a quality problem, can you stop the line? Have you ever done it?\n2. Show me the stop-production log — how many times was production stopped by operators in the last 6 months?\n3. Is there a quality suggestion scheme? Show me suggestions received and actioned.\n4. Show me employee satisfaction survey results — what do they show about quality culture?\n5. Are operators recognized or rewarded for catching quality issues?'
  },
  {
    clause_no:'7.5.3.1', clause_title:'Control at Point of Use',
    standard:'IATF', section:'SUPPORT', section_no:'7',
    simple_meaning:'AUTOMOTIVE: Documents at point of use must be the correct revision. Engineering specifications must be reviewed within 10 working days.',
    procedures:'• Engineering Specification Review Procedure',
    documents_required:'• Point-of-use document control evidence\n• Engineering spec review log\n• 10-day review compliance records',
    applicable_process:'Engineering\nQA\nProduction',
    original_requirement:'The organization shall have a documented process to control documents at the point of use, including engineering specifications which shall be reviewed within 10 working days of receipt. (IATF 16949:2016 Cl. 7.5.3.1)',
    audit_questions:'1. Go to any workstation — is the Work Instruction at the correct revision? Match it against the document master list.\n2. Show me the engineering specification log — when was the last customer spec received and when was it reviewed?\n3. Is the 10-working-day review requirement being met? Show me compliance records.\n4. How are obsolete documents removed from workstations when a revision is issued?\n5. Who is responsible for updating point-of-use documents?'
  },
  // ── CLAUSE 8 ──────────────────────────────────────────────────────────────
  {
    clause_no:'8.1', clause_title:'Operational Planning and Control',
    standard:'ISO', section:'OPERATIONS', section_no:'8',
    simple_meaning:'Plan, implement, and control the processes needed to meet product requirements.',
    procedures:'• Operational Planning Procedure\n• Process Control Procedure',
    documents_required:'• Production plan\n• Process flow chart\n• Control Plan',
    applicable_process:'Production\nQA\nEngineering',
    original_requirement:'The organization shall plan, implement, control, maintain, and review the processes needed to meet the requirements for the provision of products and services. (ISO 9001:2015 Cl. 8.1)',
    audit_questions:'1. Show me how production planning is done — is it linked to customer orders and capacity?\n2. Pick any product — show me the complete Process Flow Chart.\n3. How are process controls defined — where are they documented?\n4. How do you verify that planned controls are actually being followed on the shopfloor?\n5. What happens when a production plan changes — how are downstream processes notified?'
  },
  {
    clause_no:'8.3.4.4', clause_title:'Product Approval Process (PPAP)',
    standard:'IATF', section:'OPERATIONS', section_no:'8',
    simple_meaning:'AUTOMOTIVE: PPAP must be completed and customer-approved before mass production.',
    procedures:'• PPAP Procedure (AIAG)',
    documents_required:'• PPAP package\n• PSW (Part Submission Warrant)\n• Customer approval notification',
    applicable_process:'QA\nEngineering',
    original_requirement:'The organization shall have a process for product approval that conforms to customer requirements. This shall include PPAP or equivalent as required by the customer. (IATF 16949:2016 Cl. 8.3.4.4)',
    audit_questions:'1. Pick any current production part — show me the approved PPAP package. Is the PSW customer-signed?\n2. What PPAP level does your customer require? Show me how you determined this.\n3. For a new part launched in the last 12 months — walk me through the PPAP process followed.\n4. How are PPAP records stored and controlled — are they retrievable?\n5. What happens if PPAP approval lapses or a significant change requires re-PPAP?'
  },
  {
    clause_no:'8.4.2.4', clause_title:'Supplier Monitoring',
    standard:'IATF', section:'OPERATIONS', section_no:'8',
    simple_meaning:'AUTOMOTIVE: Monitor supplier performance continuously — PPM, delivery, audit score, warranty data.',
    procedures:'• Supplier Performance Monitoring Procedure',
    documents_required:'• Supplier scorecard (PPM, OTD, audit score)\n• Monthly performance reports\n• Escalation records',
    applicable_process:'Supplier Quality\nPurchase',
    original_requirement:'The organization shall monitor the performance of external providers. This shall include delivery performance, customer disruptions (including field returns) and quality performance. (IATF 16949:2016 Cl. 8.4.2.4)',
    audit_questions:'1. Show me the supplier scorecard for your top 5 suppliers — PPM, OTD, audit score trends.\n2. Which supplier has the worst performance in the last 6 months? What action was taken?\n3. How is warranty data used to monitor supplier quality?\n4. Show me a supplier escalation record — what triggered it and how was it resolved?\n5. How often is the scorecard shared with suppliers?'
  },
  {
    clause_no:'8.5.1.1', clause_title:'Control Plan',
    standard:'IATF', section:'OPERATIONS', section_no:'8',
    simple_meaning:'AUTOMOTIVE: A Control Plan is mandatory for every product — documenting control method, sample size, frequency, and reaction plan.',
    procedures:'• Control Plan Development Procedure (AIAG)',
    documents_required:'• Control Plan (current revision)\n• PFMEA linkage\n• Customer approval (if required)',
    applicable_process:'QA\nProduction\nEngineering',
    original_requirement:'The organization shall develop, maintain, and implement control plans at the system, subsystem, component, and material level. Control plans shall be updated when any change occurs. (IATF 16949:2016 Cl. 8.5.1.1)',
    audit_questions:'1. Show me the Control Plan for a current production part — is it the latest revision?\n2. Does the Control Plan include: product characteristic, process parameter, control method, sample plan, reaction plan?\n3. Go to the shopfloor — is the operator following exactly what the Control Plan says (sample frequency, method)?\n4. How is the Control Plan linked to the PFMEA — do special characteristics match?\n5. When was this Control Plan last updated — was it updated after the last process change?'
  },
  {
    clause_no:'8.5.1.2', clause_title:'Standardised Work — Operator Instructions',
    standard:'IATF', section:'OPERATIONS', section_no:'8',
    simple_meaning:'AUTOMOTIVE: Work instructions must be posted at the workstation in the operator\'s language with visual standards.',
    procedures:'• Standardised Work Procedure\n• Work Instruction Development Procedure',
    documents_required:'• Work instructions at workstation\n• Visual aids\n• Operator sign-off records',
    applicable_process:'Production\nQA\nEngineering',
    original_requirement:'The organization shall develop and maintain operator instructions that are documented, available at the workstation, and understood by the operator. (IATF 16949:2016 Cl. 8.5.1.2)',
    audit_questions:'1. Go to any workstation — is the Work Instruction available, current, and in the operator\'s language?\n2. Ask the operator to demonstrate the operation — does it match the WI exactly?\n3. Are visual aids (photos, drawings, limit samples) available at the workstation?\n4. Show me operator sign-off records — has the operator acknowledged understanding the WI?\n5. How are WIs updated when the process changes — who is responsible and how quickly?'
  },
  {
    clause_no:'8.5.1.3', clause_title:'Verification of Job Setups',
    standard:'IATF', section:'OPERATIONS', section_no:'8',
    simple_meaning:'AUTOMOTIVE: First-off inspection must be completed and recorded every time a new setup or lot starts.',
    procedures:'• Job Setup Verification Procedure',
    documents_required:'• Setup verification records\n• First-off inspection records\n• Last-off inspection records',
    applicable_process:'Production\nQA',
    original_requirement:'The organization shall verify job setups when performed, such as an initial run of a job, material changeover, or job change. First article inspection records shall be maintained. (IATF 16949:2016 Cl. 8.5.1.3)',
    audit_questions:'1. Show me first-off inspection records for the last 5 setups — are they complete and signed?\n2. Who performs the first-off inspection — operator, QA, or both?\n3. Is last-off inspection done when a production run ends? Show me records.\n4. What happens if the first-off part is found nonconforming — is production stopped?\n5. Are setup instructions documented separately from WIs?'
  },
  {
    clause_no:'8.5.1.5', clause_title:'Total Productive Maintenance (TPM)',
    standard:'IATF', section:'OPERATIONS', section_no:'8',
    simple_meaning:'AUTOMOTIVE: A documented TPM system must exist — PM schedules, OEE, predictive maintenance, spare parts management.',
    procedures:'• TPM Procedure',
    documents_required:'• TPM master plan\n• PM schedules and completion records\n• OEE data\n• Spare parts register',
    applicable_process:'Maintenance\nProduction',
    original_requirement:'The organization shall develop, implement, and maintain a documented Total Productive Maintenance system. Performance objectives shall be defined including OEE. (IATF 16949:2016 Cl. 8.5.1.5)',
    audit_questions:'1. Show me the TPM master plan — does it cover all critical equipment?\n2. Pick the most critical machine — show me its PM schedule compliance for the last 3 months.\n3. What is the current OEE for this machine? What are the top losses (availability, performance, quality)?\n4. Is there a predictive maintenance program? Show me examples (vibration analysis, oil analysis).\n5. Show me the critical spare parts list — are spares stocked for key machines?'
  },
  {
    clause_no:'8.5.2', clause_title:'Identification and Traceability',
    standard:'ISO', section:'OPERATIONS', section_no:'8',
    simple_meaning:'Products and their status must be identifiable and traceable at all stages of production.',
    procedures:'• Identification & Traceability Procedure',
    documents_required:'• Traceability records\n• Lot/batch control records\n• Product labelling standards',
    applicable_process:'Production\nStores\nQA',
    original_requirement:'The organization shall use suitable means to identify outputs when it is necessary to ensure the conformity of products and services. The organization shall identify the status of outputs with respect to monitoring and measurement requirements throughout production. (ISO 9001:2015 Cl. 8.5.2)',
    audit_questions:'1. Pick any part on the shopfloor — can you trace it back to its raw material lot, supplier, and production date?\n2. How is inspection status identified — pass, fail, hold — on the shop floor?\n3. Show me how batches are tracked from incoming material through finished goods.\n4. What identification method is used — labels, stamps, travellers, barcodes?\n5. In case of a customer recall, how quickly could you identify and quarantine affected product?'
  },
  {
    clause_no:'8.5.6', clause_title:'Control of Changes',
    standard:'ISO', section:'OPERATIONS', section_no:'8',
    simple_meaning:'Review and control all changes to production processes to ensure quality is not affected.',
    procedures:'• Process Change Management Procedure',
    documents_required:'• Change request records\n• Impact assessment\n• Approval records\n• Re-validation evidence',
    applicable_process:'Engineering\nQA\nProduction',
    original_requirement:'The organization shall review and control changes for production or service provision, to the extent necessary to ensure continuing conformity with requirements. (ISO 9001:2015 Cl. 8.5.6)',
    audit_questions:'1. Show me the change management log for the last 6 months — what changes were made?\n2. Pick one change — show me the impact assessment and approval before implementation.\n3. After a process change, is re-validation (capability study, first-off, PPAP) done? Show an example.\n4. How are customer notifications handled for significant changes?\n5. What is the definition of a "significant" change in your process — is it documented?'
  },
  {
    clause_no:'8.6.4', clause_title:'Verification of Externally Provided Products',
    standard:'IATF', section:'OPERATIONS', section_no:'8',
    simple_meaning:'AUTOMOTIVE: Incoming inspection of supplier materials must be performed based on risk and Control Plan.',
    procedures:'• Incoming Inspection Procedure',
    documents_required:'• Incoming inspection records\n• Supplier PPAP records\n• Incoming NCR records',
    applicable_process:'Incoming Quality\nStores\nQA',
    original_requirement:'The organization shall have a process for incoming product verification. The type and extent of control shall be based on supplier performance and the impact of the external product on the quality of the final product. (IATF 16949:2016 Cl. 8.6.4)',
    audit_questions:'1. Show me the incoming inspection plan — which materials are inspected, at what frequency, and using what method?\n2. Go to the incoming area — is incoming material clearly segregated (inspected vs. not inspected vs. rejected)?\n3. Pick any incoming material — show me the last 5 incoming inspection records.\n4. How is PPAP approval used to reduce incoming inspection frequency?\n5. Show me the last incoming NCR — how was it handled and was the supplier notified?'
  },
  {
    clause_no:'8.7.1', clause_title:'Control of Nonconforming Outputs',
    standard:'ISO', section:'OPERATIONS', section_no:'8',
    simple_meaning:'Identify and control nonconforming products to prevent unintended use or delivery.',
    procedures:'• Nonconformance Control Procedure',
    documents_required:'• NCR records\n• Segregation evidence\n• Disposition records',
    applicable_process:'QA\nProduction',
    original_requirement:'The organization shall ensure that outputs that do not conform to their requirements are identified and controlled to prevent their unintended use or delivery. (ISO 9001:2015 Cl. 8.7.1)',
    audit_questions:'1. Go to the rejection/hold area — is it clearly marked and physically segregated from good stock?\n2. Show me NCR records for the last month — are all nonconforming parts recorded?\n3. Pick one NCR — what was the disposition (scrap, rework, return to supplier, use-as-is)? Who authorised it?\n4. How is scrap rendered unusable — show me the scrap destruction process.\n5. How is reworked material re-inspected before being returned to production?'
  },
  {
    clause_no:'8.7.1.1', clause_title:'Customer Authorization for Concession',
    standard:'IATF', section:'OPERATIONS', section_no:'8',
    simple_meaning:'AUTOMOTIVE: Using nonconforming product requires written customer authorization. Quantities must not be exceeded.',
    procedures:'• Concession Management Procedure',
    documents_required:'• Customer deviation authorization\n• Concession quantity tracking\n• Part marking for concession parts',
    applicable_process:'QA\nCustomer Quality',
    original_requirement:'Parts that deviate from customer specifications and are submitted for customer authorization to use shall be clearly identified on all shipping documentation. (IATF 16949:2016 Cl. 8.7.1.1)',
    audit_questions:'1. Show me any active customer deviations — is the customer authorization document on file?\n2. Are concession quantities being tracked? Have any exceeded the authorized quantity?\n3. How are concession parts marked so they can be identified through shipping?\n4. Is the deviation reference number shown on all shipping documentation?\n5. What is the process when a concession expires — who is responsible for follow-up?'
  },
  // ── CLAUSE 9 ──────────────────────────────────────────────────────────────
  {
    clause_no:'9.1.1.1', clause_title:'Monitoring of Manufacturing Processes',
    standard:'IATF', section:'PERFORMANCE EVALUATION', section_no:'9',
    simple_meaning:'AUTOMOTIVE: All manufacturing processes must be monitored with KPIs. SPC must be applied to critical characteristics.',
    procedures:'• Manufacturing Process Monitoring Procedure\n• SPC Procedure',
    documents_required:'• SPC charts for critical characteristics\n• Process capability studies (Cp, Cpk)\n• OEE records',
    applicable_process:'Production\nQA',
    original_requirement:'Manufacturing process monitoring shall include analysis of process data and determination of process capability. Statistical methods shall be used for process control. (IATF 16949:2016 Cl. 9.1.1.1)',
    audit_questions:'1. Show me SPC charts for the top 3 critical characteristics — are they in statistical control?\n2. What is the Cpk for your most critical dimension? Is it ≥1.67 for special characteristics?\n3. Who reviews SPC charts and how frequently — do they react to out-of-control signals?\n4. Show me a case where an SPC chart triggered corrective action — what happened?\n5. Are SPC charts maintained at the workstation and updated by operators in real time?'
  },
  {
    clause_no:'9.1.2', clause_title:'Customer Satisfaction',
    standard:'ISO', section:'PERFORMANCE EVALUATION', section_no:'9',
    simple_meaning:'Monitor customer perceptions — surveys, scorecard data, complaints, warranty, delivery performance.',
    procedures:'• Customer Satisfaction Monitoring Procedure',
    documents_required:'• Customer satisfaction survey results\n• Customer scorecard trend\n• Complaint trend analysis',
    applicable_process:'Customer Quality\nQA',
    original_requirement:'The organization shall monitor customers\' perceptions of the degree to which their needs and expectations have been fulfilled. (ISO 9001:2015 Cl. 9.1.2)',
    audit_questions:'1. Show me the latest customer satisfaction data — scorecard, survey, PPM trend for each customer.\n2. Which customer is giving the lowest rating? What corrective actions are in place?\n3. How is customer satisfaction data presented at Management Review?\n4. Is there a formal customer satisfaction survey process — when was the last survey done?\n5. Show me customer warranty data — what is the trend and what actions have been taken?'
  },
  {
    clause_no:'9.2.1', clause_title:'Internal Audit',
    standard:'ISO', section:'PERFORMANCE EVALUATION', section_no:'9',
    simple_meaning:'Conduct internal audits at planned intervals. Plan based on process importance and previous results.',
    procedures:'• Internal Audit Procedure',
    documents_required:'• Annual audit plan\n• Audit reports\n• NC records from audits\n• CAPA from audit findings',
    applicable_process:'QA\nInternal Auditors',
    original_requirement:'The organization shall conduct internal audits at planned intervals to provide information on whether the QMS conforms to the organization\'s own requirements and the requirements of the standard, and is effectively implemented and maintained. (ISO 9001:2015 Cl. 9.2.1)',
    audit_questions:'1. Show me the annual internal audit plan — does it cover all clauses, all processes, and all shifts?\n2. Was the audit plan completed as scheduled — any overdue audits?\n3. Pick any audit report — show me the findings and CAPA raised. Are CAPAs closed?\n4. How are high-risk areas given higher audit frequency?\n5. Are auditors independent (not auditing their own area)?'
  },
  {
    clause_no:'9.2.2.3', clause_title:'Manufacturing Process Audit',
    standard:'IATF', section:'PERFORMANCE EVALUATION', section_no:'9',
    simple_meaning:'AUTOMOTIVE: Each manufacturing process must be audited against PFMEA, Control Plan, and WI at least once per year.',
    procedures:'• Process Audit Procedure',
    documents_required:'• Process audit checklist\n• Process audit report\n• Process audit findings and CARs',
    applicable_process:'QA\nInternal Auditors\nProduction',
    original_requirement:'The organization shall audit all manufacturing processes to determine their effectiveness. The audit approach shall be based on the manufacturing processes from the process flow chart. (IATF 16949:2016 Cl. 9.2.2.3)',
    audit_questions:'1. Show me the process audit schedule — has every manufacturing process been audited this year?\n2. Pick any process audit report — how was the checklist derived (PFMEA, Control Plan, WI)?\n3. What findings were raised? Are all CARs closed?\n4. Is the process audit done by a qualified auditor who understands the process?\n5. How are process audit results linked back to PFMEA review?'
  },
  {
    clause_no:'9.2.2.4', clause_title:'Product Audit',
    standard:'IATF', section:'PERFORMANCE EVALUATION', section_no:'9',
    simple_meaning:'AUTOMOTIVE: Finished product audited against customer drawings and specifications at defined frequency.',
    procedures:'• Product Audit Procedure',
    documents_required:'• Product audit plan\n• Product audit results\n• Action taken on failures',
    applicable_process:'QA',
    original_requirement:'The organization shall audit products at appropriate stages of production and delivery to verify conformance to all specified requirements. (IATF 16949:2016 Cl. 9.2.2.4)',
    audit_questions:'1. Show me the product audit plan — which products are audited, at what frequency, and by whom?\n2. Pull out the last 3 product audit results — are any failures recorded?\n3. How are product audit failures handled — are they treated as nonconforming product?\n4. Is the product audit against the customer drawing or only internal specifications?\n5. How are product audit results trended and presented at Management Review?'
  },
  {
    clause_no:'9.3.1', clause_title:'Management Review — General',
    standard:'ISO', section:'PERFORMANCE EVALUATION', section_no:'9',
    simple_meaning:'Top management must review the QMS at planned intervals to ensure it remains suitable, adequate, and effective.',
    procedures:'• Management Review Procedure',
    documents_required:'• Management review agenda\n• Management review minutes\n• Action plans from MRM',
    applicable_process:'Top Management\nMR\nAll HODs',
    original_requirement:'Top management shall review the organization\'s QMS, at planned intervals, to ensure its continuing suitability, adequacy, effectiveness, and alignment with the strategic direction of the organization. (ISO 9001:2015 Cl. 9.3.1)',
    audit_questions:'1. Show me Management Review minutes for the last 12 months — how many were conducted?\n2. Who attended? Did top management actually attend or just sign off?\n3. Are all mandatory inputs covered — audit results, customer satisfaction, NC trends, objectives status?\n4. Show me action items from the last review — are they all closed or on track?\n5. What major decisions or resource commitments came from the last Management Review?'
  },
  // ── CLAUSE 10 ─────────────────────────────────────────────────────────────
  {
    clause_no:'10.2.3', clause_title:'Problem Solving',
    standard:'IATF', section:'IMPROVEMENT', section_no:'10',
    simple_meaning:'AUTOMOTIVE: A disciplined problem-solving methodology (8D, DMAIC, A3) must be used for all customer complaints and major NCs.',
    procedures:'• 8D Problem Solving Procedure',
    documents_required:'• 8D reports\n• Problem-solving method training records\n• CAPA database',
    applicable_process:'QA\nAll Departments',
    original_requirement:'The organization shall have a documented process for problem solving including all customer complaints and cases of customer-notified nonconformities. The use of a disciplined, multi-step problem solving method shall be the standard approach. (IATF 16949:2016 Cl. 10.2.3)',
    audit_questions:'1. Show me 3 recent 8D reports — are they complete through D8 (lessons learned)?\n2. Is the root cause identified at the systemic level — not just the immediate defect?\n3. Are permanent corrective actions verified for effectiveness? Show evidence.\n4. Are lessons learned documented and shared to prevent recurrence on similar products?\n5. Who has been trained in 8D or similar problem-solving methods? Show training records.'
  },
  {
    clause_no:'10.2.4', clause_title:'Error-Proofing',
    standard:'IATF', section:'IMPROVEMENT', section_no:'10',
    simple_meaning:'AUTOMOTIVE: Poka-yoke devices must be used wherever possible and tested at defined frequency.',
    procedures:'• Error-Proofing Procedure',
    documents_required:'• Poka-yoke register\n• Error-proofing test records\n• PFMEA linkage to poka-yoke',
    applicable_process:'Production\nEngineering\nQA',
    original_requirement:'The organization shall have a documented process for determining the use of error-proofing methodologies. Details of the method used shall be documented in the process documentation. (IATF 16949:2016 Cl. 10.2.4)',
    audit_questions:'1. Show me the poka-yoke/error-proofing register — how many devices are in use?\n2. Go to the shopfloor — deliberately trip one poka-yoke device. Does it stop the process as intended?\n3. At what frequency are error-proofing devices tested? Show me the last test records.\n4. How are poka-yoke failures handled — is there a reaction plan?\n5. Is poka-yoke linked to PFMEA as a detection control?'
  },
  {
    clause_no:'10.2.5', clause_title:'Warranty Management System',
    standard:'IATF', section:'IMPROVEMENT', section_no:'10',
    simple_meaning:'AUTOMOTIVE: Warranty claims must be analysed including NTF (No Trouble Found) parts. Data must feed back to FMEA.',
    procedures:'• Warranty Management Procedure',
    documents_required:'• Warranty claim records\n• NTF analysis records\n• Warranty trend data\n• FMEA update records',
    applicable_process:'Customer Quality\nQA\nEngineering',
    original_requirement:'The organization shall implement a warranty management process. The organization shall conduct warranty part analysis including NTF (No Trouble Found). Results shall be used to update the FMEA. (IATF 16949:2016 Cl. 10.2.5)',
    audit_questions:'1. Show me warranty data for the last 12 months — what is the trend by customer and failure mode?\n2. How are NTF (No Trouble Found) parts analysed — is a special NTF process in place?\n3. Have FMEA documents been updated based on warranty findings? Show me an example.\n4. Is warranty data presented at Management Review?\n5. Is there a warranty cost tracking system — what is the cost trend?'
  },
  {
    clause_no:'10.3', clause_title:'Continual Improvement',
    standard:'ISO', section:'IMPROVEMENT', section_no:'10',
    simple_meaning:'Continually improve the QMS using audit results, data analysis, corrective actions, and management review.',
    procedures:'• Continual Improvement Programme Procedure',
    documents_required:'• Improvement project register\n• Kaizen records\n• Year-on-year KPI improvement data',
    applicable_process:'All Departments',
    original_requirement:'The organization shall continually improve the suitability, adequacy, and effectiveness of the QMS. The organization shall consider the results of analysis and evaluation, and management review, to determine areas of underperformance or opportunities that shall be addressed as part of continual improvement. (ISO 9001:2015 Cl. 10.3)',
    audit_questions:'1. Show me the continual improvement project register — what projects are active and completed?\n2. Pick one completed improvement — what was the before/after measurement? What was the gain?\n3. How are Kaizen events organized and tracked?\n4. Is improvement performance trending positively year-on-year — show me KPI trend over 3 years.\n5. How do lessons learned from one product or plant get shared across the organization?'
  },
];

export async function POST() {
  try {
    const db = getDB();
    const existing = (db.prepare('SELECT COUNT(*) as c FROM audit_clauses').get() as { c: number }).c;
    if (existing > 0) {
      return NextResponse.json({ message: `Already seeded — ${existing} clauses. Call DELETE first to re-seed.`, count: existing });
    }
    const insert = db.prepare(`
      INSERT INTO audit_clauses
        (clause_no,clause_title,standard,section,section_no,simple_meaning,procedures,documents_required,applicable_process,audit_questions,original_requirement)
      VALUES (?,?,?,?,?,?,?,?,?,?,?)
    `);
    let count = 0;
    for (const c of CLAUSES) {
      insert.run(c.clause_no,c.clause_title,c.standard,c.section,c.section_no,
        c.simple_meaning,c.procedures,c.documents_required,c.applicable_process,
        c.audit_questions,c.original_requirement);
      count++;
    }

    // Bulk-assign applicable_process for any clause (existing or new) with empty value
    // Covers Excel-imported clauses that had no process mapping
    const sectionProcessMap: Record<string,string> = {
      '4':  'Top Management\nMR\nQA\nAll HODs',
      '5':  'Top Management\nMR\nQA',
      '6':  'Top Management\nMR\nQA\nAll HODs',
      '7':  'QA\nHR\nMaintenance\nEngineering\nTop Management',
      '8':  'Production\nQA\nEngineering\nPurchase\nPlanning\nSupplier Quality',
      '9':  'QA\nTop Management\nMR\nAll HODs',
      '10': 'QA\nTop Management\nAll HODs',
    };
    const updateProc = db.prepare(
      `UPDATE audit_clauses SET applicable_process = ? WHERE section_no = ? AND (applicable_process = '' OR applicable_process IS NULL)`
    );
    for (const [sec, procs] of Object.entries(sectionProcessMap)) {
      updateProc.run(procs, sec);
    }

    return NextResponse.json({ message: `Seeded ${count} IATF/ISO clauses with audit questions`, count });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const db = getDB();
    db.prepare('DELETE FROM audit_clauses').run();
    return NextResponse.json({ message: 'Clause library cleared — ready to re-seed' });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
