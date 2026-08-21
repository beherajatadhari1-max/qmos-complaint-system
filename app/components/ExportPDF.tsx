'use client';
import { useRef } from 'react';

// -- ExportPDF ------------------------------------------------------------------
// Zero-dependency PDF export via window.print() + @media print CSS.
// Usage:
//   <ExportPDF targetId="my-report-div" filename="scorecard-report" />
//   Wrap printable content in: <div id="my-report-div" className="print-section">
// ------------------------------------------------------------------------------

interface ExportPDFProps {
  targetId: string;       // id of the div to isolate for printing
  label?: string;         // button label (default: Export PDF)
  filename?: string;      // suggested filename shown in browser print dialog title
  color?: string;         // button accent colour (default: #1e40af)
  size?: 'sm' | 'md';
}

export default function ExportPDF({
  targetId,
  label = 'Export PDF',
  filename,
  color = '#1e40af',
  size = 'md',
}: ExportPDFProps) {
  const styleRef = useRef<HTMLStyleElement | null>(null);

  const handlePrint = () => {
    // Inject a <style> that hides everything except the target section
    const css = `
      @media print {
        body > * { display: none !important; }
        #${targetId} { display: block !important; }
        #${targetId} * { visibility: visible !important; }
        #${targetId} { position: fixed; top: 0; left: 0; width: 100%; }

        /* Hide buttons, tabs, copilot inside the print section */
        #${targetId} button,
        #${targetId} [data-no-print],
        #${targetId} .no-print { display: none !important; }

        /* Page setup */
        @page {
          size: A4;
          margin: 15mm 12mm 15mm 12mm;
        }

        /* Typography resets for print */
        body { background: white !important; color: black !important; font-size: 11pt; }

        /* Force white backgrounds on dark cards */
        #${targetId} .bg-gray-900,
        #${targetId} .bg-gray-800,
        #${targetId} .bg-gray-950,
        #${targetId} [class*="bg-gray-"] {
          background-color: white !important;
          border: 1px solid #d1d5db !important;
        }

        /* Force dark text */
        #${targetId} [class*="text-gray-2"],
        #${targetId} [class*="text-gray-3"],
        #${targetId} [class*="text-gray-4"] {
          color: #374151 !important;
        }
        #${targetId} [class*="text-white"] { color: #111827 !important; }
        #${targetId} [class*="text-gray-1"] { color: #6b7280 !important; }

        /* Prevent page breaks inside cards */
        #${targetId} .print-no-break { page-break-inside: avoid; }

        /* Print header */
        .print-header-inject { display: block !important; }
      }

      /* Hide the print-only header in normal view */
      .print-header-inject { display: none; }
    `;

    // Remove existing injected style if any
    if (styleRef.current) styleRef.current.remove();
    const style = document.createElement('style');
    style.textContent = css;
    document.head.appendChild(style);
    styleRef.current = style;

    // Set document title so browser shows it in print dialog / PDF filename
    const prevTitle = document.title;
    if (filename) document.title = filename;

    window.print();

    // Restore title after a tick
    setTimeout(() => {
      document.title = prevTitle;
    }, 500);
  };

  const pad = size === 'sm' ? 'px-3 py-1.5 text-xs' : 'px-4 py-2 text-sm';

  return (
    <button
      onClick={handlePrint}
      className={`${pad} rounded-lg font-medium flex items-center gap-2 transition-all hover:brightness-110 active:scale-95 no-print`}
      style={{ background: color, color: 'white' }}
      title="Export this report as PDF"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
        <line x1="12" y1="12" x2="12" y2="18"/>
        <polyline points="9 15 12 18 15 15"/>
      </svg>
      {label}
    </button>
  );
}
