interface Feature { label: string; desc: string }
interface ModulePlaceholderProps {
  icon: string;
  title: string;
  subtitle: string;
  color: string;       // Tailwind border color e.g. 'border-blue-600'
  textColor: string;   // e.g. 'text-blue-700'
  bgColor: string;     // e.g. 'bg-blue-50'
  standards: string[];
  features: Feature[];
}

export default function ModulePlaceholder({ icon, title, subtitle, color, textColor, bgColor, standards, features }: ModulePlaceholderProps) {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className={`bg-blue-900 text-white px-6 py-3 shadow-lg`}>
        <h1 className="text-lg font-bold">{icon} {title}</h1>
        <p className="text-blue-300 text-xs">{subtitle}</p>
      </header>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className={`${bgColor} border-l-4 ${color} rounded-xl p-6 mb-8`}>
          <div className="flex items-center gap-3 mb-2">
            <span className="text-3xl">{icon}</span>
            <div>
              <h2 className={`text-xl font-bold ${textColor}`}>{title}</h2>
              <p className="text-gray-500 text-sm">{subtitle}</p>
            </div>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <span className="bg-yellow-100 text-yellow-800 text-xs font-bold px-3 py-1 rounded-full">🔨 Module Under Development</span>
            <span className="text-gray-400 text-xs">Coming in next build</span>
          </div>
        </div>

        {/* Standards */}
        <div className="bg-white rounded-xl shadow-sm p-5 mb-6">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Applicable Standards & Clauses</h3>
          <div className="flex flex-wrap gap-2">
            {standards.map(s => (
              <span key={s} className="bg-blue-50 text-blue-800 text-xs font-semibold px-3 py-1 rounded-full border border-blue-100">{s}</span>
            ))}
          </div>
        </div>

        {/* Planned Features */}
        <div className="bg-white rounded-xl shadow-sm p-5">
          <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4">Planned Features</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {features.map(f => (
              <div key={f.label} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <span className="text-gray-300 mt-0.5 flex-shrink-0">○</span>
                <div>
                  <p className="text-sm font-semibold text-gray-700">{f.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
