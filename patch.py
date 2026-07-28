content = open('app/components/Sidebar.tsx', encoding='utf-8').read()

badge = '''function BranchBadge() {
  const [branch, setBranch] = React.useState('');
  React.useEffect(() => {
    fetch('/api/branch').then(r => r.json()).then(d => setBranch(d.branch));
  }, []);
  if (!branch) return null;
  const isMain = branch === 'main';
  return (
    <span style={{
      fontSize: '9px', fontWeight: 700, padding: '1px 6px', borderRadius: '4px',
      background: isMain ? '#1e40af' : '#166534',
      color: isMain ? '#93c5fd' : '#86efac',
      textTransform: 'uppercase', letterSpacing: '0.05em'
    }}>{branch}</span>
  );
}

export default'''

content = content.replace('export default', badge, 1)
open('app/components/Sidebar.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
