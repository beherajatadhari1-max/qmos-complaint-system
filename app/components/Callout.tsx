import React from 'react';

type CalloutType = 'tip' | 'warn' | 'iatf' | 'info';

const CONFIG: Record<CalloutType, { icon: string; label: string }> = {
  tip:  { icon: '💡', label: 'Best Practice' },
  warn: { icon: '⚠️', label: 'Warning'       },
  iatf: { icon: '📋', label: 'IATF Clause'   },
  info: { icon: 'ℹ️',  label: 'Note'          },
};

interface CalloutProps {
  type?: CalloutType;
  title?: string;
  children: React.ReactNode;
}

export default function Callout({ type = 'tip', title, children }: CalloutProps) {
  const { icon, label } = CONFIG[type];
  return (
    <div className={`q-callout q-callout-${type}`}>
      <div className="q-callout-title">
        <span>{icon}</span>
        <span>{title ?? label}</span>
      </div>
      <div className="q-callout-body">{children}</div>
    </div>
  );
}
