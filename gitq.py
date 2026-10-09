import subprocess
def run(args, cwd=None):
    r = subprocess.run(args, cwd=cwd, capture_output=True)
    return (r.stdout+r.stderr).decode('utf-8','replace')
print('=== MAIN REPO log -8 ===')
print(run(['git','log','--date=short','--pretty=format:%h|%ad|%s','-8']))
print()
print('=== slayDemo GODOT log -5 ===')
print(run(['git','log','--date=short','--pretty=format:%h|%ad|%s','-5'], cwd='domains/game-engine/godotProjects/slayDemo'))
print()
print('=== slayDemo COCOS log -5 ===')
print(run(['git','log','--date=short','--pretty=format:%h|%ad|%s','-5'], cwd='domains/game-engine/cocosProjects/slayDemo'))
