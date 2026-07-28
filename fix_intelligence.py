c = open('app/components/Sidebar.tsx','r',encoding='utf-8').read()
c = c.replace(
    "{ href: '/ai-generator', icon: '🧬', label: 'AI Generator', badge: 'NEW' },",
    "{ href: '/ai-generator', icon: '🧬', label: 'AI Generator', badge: 'NEW' },\n        { href: '/pfd', icon: '📋', label: 'PFD' },\n        { href: '/8d', icon: '🔍', label: '8D Report' },"
)
open('app/components/Sidebar.tsx','w',encoding='utf-8').write(c)
print('Done')
