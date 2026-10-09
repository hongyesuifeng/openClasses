import re
s = open('decode_task.py','r',encoding='utf-8').read()
m = re.search(r's = "(.*?)"', s, re.S)
txt = m.group(1) if m else ''
recovered = txt.encode('utf-8').decode('gbk', errors='ignore')
print(recovered)
