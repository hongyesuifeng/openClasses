import subprocess
r = subprocess.run(['git','log','-12','--date=short','--pretty=format:%h|%ad|%s'], capture_output=True)
print('RC', r.returncode)
try:
    txt = r.stdout.decode('gbk')
except Exception as e:
    txt = r.stdout.decode('utf-8','replace')
print(txt)
