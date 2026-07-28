import base64, os
with open('_b64.txt','r') as f:
    b64 = f.read().strip()
print(f"b64 length: {len(b64)}, mod4: {len(b64)%4}")
data = base64.b64decode(b64)
os.makedirs('app/pfmea-converter', exist_ok=True)
with open('app/pfmea-converter/page.tsx','wb') as f:
    f.write(data)
print(f"Written: {len(data)} bytes")
