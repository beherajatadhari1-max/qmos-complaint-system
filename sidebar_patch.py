content = open('app/components/Sidebar.tsx', encoding='utf-8').read()
content = content.replace("import { useState } from 'react'","import { useState, useEffect } from 'react'")
badge = "\nfunction BranchBadge() {\n  const [branch, setBranch] = useState('');\n  useEffect(() => { fetch('/api/branch').then(r=>r.json()).then(d=>setBranch(d.branch)).catch(()=>{}); }, []);\n  if (!branch) return null;\n  const isMain = branch === 'main';\n  return <span style={{fontSize:'9px',fontWeight:700,padding:'1px 6px',borderRadius:'4px',background:isMain?'#1e3a5f':'#14532d',color:isMain?'#93c5fd':'#86efac',marginLeft:'4px'}}>{branch.toUpperCase()}</span>;\n}\n\n"
content = content.replace('export default function Sidebar()', badge + 'export default function Sidebar()')
content = content.replace('<p className="text-blue-400 text-xs">Quality OS</p>', '<p className="text-blue-400 text-xs">Quality OS<BranchBadge /></p>')
open('app/components/Sidebar.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
