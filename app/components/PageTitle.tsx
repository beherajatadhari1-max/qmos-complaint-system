'use client';
import { useEffect } from 'react';

export default function PageTitle({ title }: { title: string }) {
  useEffect(() => {
    document.title = `${title} | QMOS`;
    return () => { document.title = 'QMOS'; };
  }, [title]);
  return null;
}
