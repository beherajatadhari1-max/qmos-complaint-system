content = open('app/components/Sidebar.tsx', encoding='utf-8').read()

# Find the corrupted logo section and replace with clean version
import re

clean_logo = """      {/* Logo */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-blue-800 flex-shrink-0">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <svg width="36" height="36" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect width="56" height="56" rx="10" fill="#042c53"/>
              <text x="28" y="26" textAnchor="middle" fill="#378add" fontSize="18" fontWeight="700" fontFamily="Arial">Q</text>
              <rect x="10" y="30" width="36" height="1" fill="#185fa5"/>
              <text x="28" y="42" textAnchor="middle" fill="#b5d4f4" fontSize="7" fontFamily="Arial">QUALITY OS</text>
            </svg>
            <div>
              <p className="text-sm font-bold tracking-tight">QMOS</p>
              <BranchBadge />
            </div>
          </div>
        )}
        <button"""

content = re.sub(r'\{/\* Logo \*/\}.*?<button', clean_logo, content, flags=re.DOTALL, count=1)
open('app/components/Sidebar.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
