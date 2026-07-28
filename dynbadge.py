content = open('app/components/Sidebar.tsx', encoding='utf-8').read()

old = 'export default function Sidebar()'

new = '''function BranchBadge() {
  const [branch, setBranch] = React.useState('');
  React.useEffect(() => {
    fetch('/api/branch').then(r => r.json()).then(d => setBranch(d.branch)).catch(() => {});
  }, []);
  if (!branch) return null;
  const isMain = branch === 'main';
  return <span style={{fontSize:'9px',fontWeight:700,padding:'1px 6px',borderRadius:'4px',background:'#1e3a5f',color:isMain?'#93c5fd':'#86efac'}}>{branch.toUpperCase()}</span>;
}

export default function Sidebar()'''

import re
content = re.sub(r'<span style=\{\{fontSize.*?</span>', '<BranchBadge />', content)
content = content.replace(old, new)
open('app/components/Sidebar.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
