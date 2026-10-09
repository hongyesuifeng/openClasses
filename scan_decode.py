import subprocess

def decode_mojibake(s):
    try:
        return s.encode('latin-1').decode('utf-8')
    except Exception:
        try:
            return s.encode('cp1252').decode('utf-8')
        except Exception:
            return s

def log(repo, n=8):
    try:
        out = subprocess.check_output(['git','-C',repo,'log',f'-{n}','--format=%h|%ci|%s'], stderr=subprocess.STDOUT)
        txt = out.decode('utf-8', 'replace')
    except Exception as e:
        return f'[ERR {e}]'
    out_lines=[]
    for ln in txt.splitlines():
        if '|' in ln:
            h,ci,s = ln.split('|',2)
            out_lines.append(f'{h}  {ci[:16]}  {decode_mojibake(s)}')
    return chr(10).join(out_lines)

print('=== MAIN REPO ===')
print(log('.', 8))
print()
print('=== COCOS slayDemo ===')
print(log('domains/game-engine/cocosProjects/slayDemo', 5))
print()
print('=== GODOT slayDemo (main repo) ===')
print(log('domains/game-engine/godotProjects/slayDemo', 5))
