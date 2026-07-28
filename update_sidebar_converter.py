import sys
path = 'app/components/Sidebar.tsx'
try:
    content = open(path, encoding='utf-8').read()
except:
    content = open(path, encoding='cp1252').read()

old = "{ href: '/pfmea', icon: '⚠️', label: 'PFMEA Generator' },"
new = """{ href: '/pfmea', icon: '⚠️', label: 'PFMEA Generator' },
      { href: '/pfmea-converter', icon: '🔄', label: 'FMEA Converter', badge: 'NEW' },"""

if "pfmea-converter" in content:
    print("Already added"); sys.exit(0)
if old not in content:
    print("ERROR: PFMEA Generator entry not found"); sys.exit(1)

open(path, 'w', encoding='utf-8').write(content.replace(old, new, 1))
print("Sidebar updated — FMEA Converter added")
print("Done")
