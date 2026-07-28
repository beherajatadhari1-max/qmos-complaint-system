import re, subprocess
content = open('app/components/Sidebar.tsx', encoding='utf-8').read()
try:
    branch = subprocess.check_output(['git','branch','--show-current'], cwd='.').decode().strip()
except:
    branch = 'main'
color = '#86efac' if branch == 'dev' else '#93c5fd'
badge = f'<span style={{{{fontSize:"9px",fontWeight:700,padding:"1px 6px",borderRadius:"4px",background:"#1e3a5f",color:"{color}"}}}}>{branch.upper()}</span>'
content = content.replace('<p className="text-blue-400 text-xs">Quality OS</p>', f'<p className="text-blue-400 text-xs">Quality OS &nbsp;{badge}</p>')
open('app/components/Sidebar.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
