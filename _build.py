import base64, os
parts_dir = r'C:\Users\beher\AppData\Roaming\Claude\local-agent-mode-sessions\a02653e6-0b4a-46f5-ac5f-ff88ad126ed2\5aa4157d-f11e-4e0e-aa7a-c3d1057876c8\local_bda2a538-3fb5-49a2-9412-47f71235d310\outputs'
b64 = ''
for i in range(1,6):
    with open(os.path.join(parts_dir, f'conv_p{i}.txt'),'r') as f:
        b64 += f.read().strip()
b64 += '=' * (-len(b64) % 4)
with open('app/pfmea-converter/page.tsx','wb') as f: f.write(base64.b64decode(b64))
lines=open('app/pfmea-converter/page.tsx').readlines()
print(f"Written: {len(lines)} lines")
print("Done")
