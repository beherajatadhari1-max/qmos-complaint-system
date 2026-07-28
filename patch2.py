content = open('app/components/Sidebar.tsx', encoding='utf-8').read()
content = content.replace("import { useState } from 'react'", "import React, { useState, useEffect } from 'react'")
open('app/components/Sidebar.tsx', 'w', encoding='utf-8').write(content)
print('Done!')
