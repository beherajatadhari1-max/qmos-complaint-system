export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from 'next/server'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PFDStepTemplate {
  stepNo: string
  processName: string
  machineEquipment: string
  opType: 'operation' | 'inspection' | 'transport' | 'storage' | 'delay' | 'rework'
  productChars: string
  processChars: string
  specialCharClass: string
  incomingMaterial: string
  comments: string
}

interface GenerateRequest {
  processType: string   // e.g. "CNC Machining", "Assembly", "Welding"
  partName?: string
  steps?: number        // desired number of steps
}

// ─── Process Templates ────────────────────────────────────────────────────────

const PROCESS_TEMPLATES: Record<string, PFDStepTemplate[]> = {
  'cnc machining': [
    { stepNo: '10', processName: 'Receive Raw Material', machineEquipment: 'Incoming Dock', opType: 'storage', productChars: 'Material grade, dimensions', processChars: '', specialCharClass: '', incomingMaterial: 'Raw bar stock / billet', comments: 'Verify material cert' },
    { stepNo: '20', processName: 'Material Inspection', machineEquipment: 'Vernier caliper, Material cert', opType: 'inspection', productChars: 'Dimensions, surface condition', processChars: '', specialCharClass: 'CC – Critical Characteristic', incomingMaterial: 'Raw bar stock', comments: 'Check against drawing' },
    { stepNo: '30', processName: 'Setup & Fixturing', machineEquipment: 'CNC Machining Center', opType: 'operation', productChars: '', processChars: 'Fixture clamping force, datum alignment', specialCharClass: '', incomingMaterial: 'Inspected raw stock', comments: 'Setup sheet reference' },
    { stepNo: '40', processName: 'Rough Machining', machineEquipment: 'CNC Machining Center', opType: 'operation', productChars: 'Overall dimensions', processChars: 'Feed rate, RPM, depth of cut', specialCharClass: '', incomingMaterial: '', comments: 'Leave 0.5mm stock for finish' },
    { stepNo: '50', processName: 'Finish Machining', machineEquipment: 'CNC Machining Center', opType: 'operation', productChars: 'Final dimensions, surface finish Ra', processChars: 'Feed rate, coolant pressure', specialCharClass: 'CC – Critical Characteristic', incomingMaterial: '', comments: 'Critical tolerances per drawing' },
    { stepNo: '60', processName: 'Deburring & Cleaning', machineEquipment: 'Deburring tool, Parts washer', opType: 'operation', productChars: 'Edge condition, cleanliness', processChars: '', specialCharClass: '', incomingMaterial: '', comments: '' },
    { stepNo: '70', processName: 'First-off Inspection', machineEquipment: 'CMM, Gauges', opType: 'inspection', productChars: 'All critical dimensions', processChars: '', specialCharClass: 'CC – Critical Characteristic', incomingMaterial: '', comments: '100% on first-off, then SPC' },
    { stepNo: '80', processName: 'In-Process Inspection', machineEquipment: 'Go/No-Go gauges, Micrometers', opType: 'inspection', productChars: 'Critical dims, Ra surface', processChars: '', specialCharClass: 'KPC – Key Product Char', incomingMaterial: '', comments: 'Per Control Plan frequency' },
    { stepNo: '90', processName: 'Part Marking', machineEquipment: 'Laser marker / Dot peen', opType: 'operation', productChars: 'Part number, date code', processChars: '', specialCharClass: '', incomingMaterial: '', comments: 'As per customer requirement' },
    { stepNo: '100', processName: 'Final Inspection', machineEquipment: 'CMM, Visual inspection station', opType: 'inspection', productChars: 'All drawing dimensions, cosmetics', processChars: '', specialCharClass: 'CC – Critical Characteristic', incomingMaterial: '', comments: 'Full dimensional layout per PPAP' },
    { stepNo: '110', processName: 'Pack & Label', machineEquipment: 'Packing station', opType: 'operation', productChars: 'Packaging, label accuracy', processChars: '', specialCharClass: '', incomingMaterial: '', comments: 'Customer packaging std.' },
    { stepNo: '120', processName: 'Finished Goods Storage', machineEquipment: 'Warehouse / FG Store', opType: 'storage', productChars: '', processChars: 'FIFO, storage conditions', specialCharClass: '', incomingMaterial: '', comments: '' },
    { stepNo: '130', processName: 'Dispatch / Shipping', machineEquipment: 'Loading dock', opType: 'transport', productChars: 'Correct part, qty, label', processChars: '', specialCharClass: '', incomingMaterial: '', comments: 'ASN to customer' },
  ],
  'welding': [
    { stepNo: '10', processName: 'Component Incoming Inspection', machineEquipment: 'Vernier, Go/No-Go gauge', opType: 'inspection', productChars: 'Dimensions, material grade', processChars: '', specialCharClass: 'CC – Critical Characteristic', incomingMaterial: 'Weld components / sub-parts', comments: '' },
    { stepNo: '20', processName: 'Pre-Weld Cleaning', machineEquipment: 'Grinder, wire brush, solvent', opType: 'operation', productChars: 'Surface cleanliness', processChars: '', specialCharClass: '', incomingMaterial: '', comments: 'Remove oil, rust, scale' },
    { stepNo: '30', processName: 'Fixture Setup & Tack Weld', machineEquipment: 'Welding fixture, MIG/TIG', opType: 'operation', productChars: 'Fit-up gap, joint geometry', processChars: 'Fixture clamping, tack position', specialCharClass: '', incomingMaterial: '', comments: 'Check datum alignment' },
    { stepNo: '40', processName: 'Full Welding', machineEquipment: 'MIG / TIG / Spot Welder', opType: 'operation', productChars: 'Weld bead size, penetration', processChars: 'Voltage, wire feed, travel speed, gas flow', specialCharClass: '★ Safety Critical', incomingMaterial: '', comments: 'WPS / WPQ reference' },
    { stepNo: '50', processName: 'Weld Visual Inspection', machineEquipment: 'Visual inspection station, torch', opType: 'inspection', productChars: 'Weld profile, cracks, porosity, spatter', processChars: '', specialCharClass: '★ Safety Critical', incomingMaterial: '', comments: 'Per AWS D1.1 or customer std.' },
    { stepNo: '60', processName: 'Post-Weld Treatment', machineEquipment: 'Grinder, heat gun', opType: 'operation', productChars: 'Surface finish, stress relief', processChars: 'PWHT temp, time if required', specialCharClass: '', incomingMaterial: '', comments: '' },
    { stepNo: '70', processName: 'Dimensional Inspection', machineEquipment: 'CMM / 3D scanner, fixtures', opType: 'inspection', productChars: 'Critical assembly dimensions', processChars: '', specialCharClass: 'CC – Critical Characteristic', incomingMaterial: '', comments: '' },
    { stepNo: '80', processName: 'Pack & Dispatch', machineEquipment: 'Packing station', opType: 'operation', productChars: 'Packaging condition', processChars: '', specialCharClass: '', incomingMaterial: '', comments: '' },
  ],
  'assembly': [
    { stepNo: '10', processName: 'Component Incoming Inspection', machineEquipment: 'Inspection table, gauges', opType: 'inspection', productChars: 'All mating dimensions, surface condition', processChars: '', specialCharClass: 'CC – Critical Characteristic', incomingMaterial: 'All sub-components & fasteners', comments: 'Check against BOM' },
    { stepNo: '20', processName: 'Sub-Assembly 1', machineEquipment: 'Assembly jig, torque wrench', opType: 'operation', productChars: 'Fit, fastener torque', processChars: 'Torque value, assembly sequence', specialCharClass: 'KCC – Key Control Char', incomingMaterial: '', comments: 'Torque per drawing spec' },
    { stepNo: '30', processName: 'Sub-Assembly 2', machineEquipment: 'Press, fixtures', opType: 'operation', productChars: 'Press-fit interference, position', processChars: 'Press force, speed', specialCharClass: 'CC – Critical Characteristic', incomingMaterial: '', comments: 'Force-displacement monitoring' },
    { stepNo: '40', processName: 'In-Process Check', machineEquipment: 'Go/No-Go gauge, torque checker', opType: 'inspection', productChars: 'Assembly dimensions, torque', processChars: '', specialCharClass: 'KPC – Key Product Char', incomingMaterial: '', comments: '' },
    { stepNo: '50', processName: 'Final Assembly', machineEquipment: 'Assembly bench, torque tools', opType: 'operation', productChars: 'Complete assembly geometry', processChars: 'Sequence, torque, locking method', specialCharClass: '', incomingMaterial: '', comments: '' },
    { stepNo: '60', processName: 'Functional Test', machineEquipment: 'Test rig / EOL tester', opType: 'inspection', productChars: 'Performance parameters', processChars: 'Test pressure, load, cycles', specialCharClass: '★ Safety Critical', incomingMaterial: '', comments: '100% test' },
    { stepNo: '70', processName: 'Final Inspection & Sign-off', machineEquipment: 'Visual station, CMM', opType: 'inspection', productChars: 'All critical dims, cosmetics', processChars: '', specialCharClass: 'CC – Critical Characteristic', incomingMaterial: '', comments: '' },
    { stepNo: '80', processName: 'Labelling & Packing', machineEquipment: 'Label printer, packing station', opType: 'operation', productChars: 'Label correctness, packaging', processChars: '', specialCharClass: '', incomingMaterial: '', comments: '' },
    { stepNo: '90', processName: 'Finished Goods Storage', machineEquipment: 'FG Store', opType: 'storage', productChars: '', processChars: 'FIFO, temperature, humidity', specialCharClass: '', incomingMaterial: '', comments: '' },
    { stepNo: '100', processName: 'Despatch', machineEquipment: 'Loading dock', opType: 'transport', productChars: 'Correct part, qty', processChars: '', specialCharClass: '', incomingMaterial: '', comments: 'ASN / delivery note' },
  ],
  'stamping': [
    { stepNo: '10', processName: 'Coil / Sheet Incoming', machineEquipment: 'Incoming dock, thickness gauge', opType: 'inspection', productChars: 'Material thickness, hardness, surface', processChars: '', specialCharClass: 'CC – Critical Characteristic', incomingMaterial: 'Steel coil / sheet', comments: 'Verify material cert' },
    { stepNo: '20', processName: 'Blanking', machineEquipment: 'Blanking press, die', opType: 'operation', productChars: 'Blank dimensions, burr height', processChars: 'Press tonnage, die clearance, stroke rate', specialCharClass: '', incomingMaterial: '', comments: '' },
    { stepNo: '30', processName: 'Forming / Drawing', machineEquipment: 'Progressive / Transfer press', opType: 'operation', productChars: 'Form dimensions, spring-back', processChars: 'Blank holder force, punch speed, lubrication', specialCharClass: 'CC – Critical Characteristic', incomingMaterial: '', comments: 'Die cushion setting critical' },
    { stepNo: '40', processName: 'Trimming & Piercing', machineEquipment: 'Trimming die', opType: 'operation', productChars: 'Trim edge, hole position & size', processChars: 'Die clearance', specialCharClass: '', incomingMaterial: '', comments: '' },
    { stepNo: '50', processName: 'In-Process Inspection', machineEquipment: 'Checking fixture, CMM', opType: 'inspection', productChars: 'All critical dimensions, flatness', processChars: '', specialCharClass: 'CC – Critical Characteristic', incomingMaterial: '', comments: 'First-off & periodic' },
    { stepNo: '60', processName: 'Deburring / Cleaning', machineEquipment: 'Vibratory deburring, parts washer', opType: 'operation', productChars: 'Burr height, cleanliness', processChars: '', specialCharClass: '', incomingMaterial: '', comments: '' },
    { stepNo: '70', processName: 'Surface Treatment', machineEquipment: 'Plating / E-coat / Powder coat line', opType: 'operation', productChars: 'Coating thickness, adhesion', processChars: 'Bath chemistry, temperature, time', specialCharClass: 'SC – Significant Characteristic', incomingMaterial: '', comments: 'Corrosion spec per drawing' },
    { stepNo: '80', processName: 'Final Inspection', machineEquipment: 'CMM, Checking fixture, Visual station', opType: 'inspection', productChars: 'All drawing dims, cosmetics, coating', processChars: '', specialCharClass: 'CC – Critical Characteristic', incomingMaterial: '', comments: '' },
    { stepNo: '90', processName: 'Pack & Ship', machineEquipment: 'Packing station', opType: 'operation', productChars: 'Packaging, label', processChars: '', specialCharClass: '', incomingMaterial: '', comments: '' },
  ],
}

// ─── Helper: normalize process type key ──────────────────────────────────────

function matchTemplate(processType: string): PFDStepTemplate[] | null {
  const norm = processType.toLowerCase().trim()
  for (const [key, steps] of Object.entries(PROCESS_TEMPLATES)) {
    if (norm.includes(key) || key.includes(norm)) return steps
  }
  // Partial keyword match
  const keywords = norm.split(/\s+/)
  for (const [key, steps] of Object.entries(PROCESS_TEMPLATES)) {
    if (keywords.some(kw => key.includes(kw))) return steps
  }
  return null
}

// ─── GET: available process types ────────────────────────────────────────────

export async function GET() {
  return NextResponse.json({
    available: Object.keys(PROCESS_TEMPLATES),
    message: 'Send POST with { processType, partName?, steps? } to generate a PFD template.',
  })
}

// ─── POST: generate PFD steps ────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  try {
    const body: GenerateRequest = await req.json()
    const { processType, partName, steps: requestedSteps } = body

    if (!processType) {
      return NextResponse.json({ error: 'processType is required' }, { status: 400 })
    }

    const template = matchTemplate(processType)

    if (!template) {
      return NextResponse.json(
        {
          error: `No template found for "${processType}".`,
          available: Object.keys(PROCESS_TEMPLATES),
          hint: 'Use one of the available process types, or request a generic template.',
        },
        { status: 404 },
      )
    }

    // Optionally slice to requested step count
    const resultSteps = requestedSteps && requestedSteps > 0
      ? template.slice(0, requestedSteps)
      : template

    return NextResponse.json({
      processType,
      partName: partName || '',
      stepsGenerated: resultSteps.length,
      steps: resultSteps,
      note: 'This is a starting template. Customize steps, machines, and characteristics to match your actual process.',
    })
  } catch (err) {
    return NextResponse.json({ error: `Invalid request: ${err}` }, { status: 400 })
  }
}
