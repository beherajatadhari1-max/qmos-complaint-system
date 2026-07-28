'use client';
import Link from 'next/link';

export default function AccessDenied() {
  return (
    <div className="min-h-screen bg-blue-950 flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="text-6xl mb-6">🔒</div>
        <h1 className="text-2xl font-bold text-white mb-2">Access Denied</h1>
        <p className="text-blue-400 mb-6">
          You do not have permission to access this page.
          Please contact your Quality Head or Administrator.
        </p>
        <Link href="/"
          className="inline-block bg-blue-600 hover:bg-blue-500 text-white font-semibold px-6 py-3 rounded-xl transition">
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
