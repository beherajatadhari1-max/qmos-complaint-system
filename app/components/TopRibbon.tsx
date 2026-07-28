'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function TopRibbon() {
  const [search, setSearch] = useState('');
  const [loggingOut, setLoggingOut] = useState(false);
  const router = useRouter();

  async function handleLogout() {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good Morning' : now.getHours() < 17 ? 'Good Afternoon' : 'Good Evening';
  const dateStr = now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <header className="bg-white border-b border-gray-200 h-14 flex items-center px-5 gap-4 flex-shrink-0 shadow-sm z-20">
      {/* Greeting */}
      <div className="hidden lg:block flex-shrink-0">
        <p className="text-xs font-semibold text-blue-900">{greeting}, Quality Head</p>
        <p className="text-xs text-gray-400">{dateStr}</p>
      </div>

      <div className="w-px h-6 bg-gray-200 hidden lg:block flex-shrink-0"></div>

      {/* Global Search */}
      <div className="flex-1 max-w-2xl">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">🔍</span>
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search complaints, suppliers, parts, audits, documents..."
            className="w-full pl-9 pr-4 py-1.5 text-sm border border-gray-200 rounded-lg bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
          />
        </div>
      </div>

      {/* Right Actions */}
      <div className="flex items-center gap-1 ml-auto flex-shrink-0">
        {/* Plant Selector */}
        <select className="hidden md:block text-xs border border-gray-200 rounded-lg px-2 py-1.5 text-gray-600 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option>🏭 Plant 1</option>
          <option>🏭 Plant 2</option>
          <option>🏭 All Plants</option>
        </select>

        <div className="w-px h-6 bg-gray-200 mx-1 hidden md:block"></div>

        {/* Calendar */}
        <button className="p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition text-base" title="Calendar">
          📅
        </button>

        {/* Notifications */}
        <button className="relative p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition text-base" title="Notifications">
          🔔
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-white"></span>
        </button>

        {/* Tasks */}
        <button className="p-2 text-gray-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition text-base" title="Tasks">
          ✅
        </button>

        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        {/* User Profile */}
        <div className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-gray-50 cursor-pointer transition">
          <div className="w-8 h-8 rounded-full bg-blue-900 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">QH</div>
          <div className="hidden sm:block">
            <p className="text-xs font-semibold text-gray-800 leading-tight">Quality Head</p>
            <p className="text-xs text-gray-400 leading-tight">Administrator</p>
          </div>
        </div>

        <div className="w-px h-6 bg-gray-200 mx-1"></div>

        {/* Logout */}
        <button
          onClick={handleLogout}
          disabled={loggingOut}
          title="Sign Out"
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-lg transition disabled:opacity-50"
        >
          {loggingOut ? '...' : '🚪 Logout'}
        </button>
      </div>
    </header>
  );
}
