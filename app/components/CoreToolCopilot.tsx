'use client';
import { usePathname } from 'next/navigation';
import CopilotWidget from './CopilotWidget';
import type { CopilotWidgetProps } from './CopilotWidget';

const TOOL_MAP: Record<string, CopilotWidgetProps['tool']> = {
  '/apqp': 'apqp',
  '/ppap': 'ppap',
  '/pfmea': 'pfmea',
  '/control-plan': 'control-plan',
  '/spc': 'spc',
  '/msa': 'msa',
};

export default function CoreToolCopilot() {
  const pathname = usePathname();
  const tool = TOOL_MAP[pathname];
  if (!tool) return null;
  return <CopilotWidget tool={tool} />;
}
