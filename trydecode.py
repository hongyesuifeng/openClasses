import re
s = open('decode_task.py','r',encoding='utf-8').read()
m = re.search(r's = "(.*?)"', s, re.S)
txt = m.group(1) if m else ''
print('LEN', len(txt))
for enc in ['gb18030','gbk','big5','cp936']:
    try:
        print('===', enc, '===')
        print(txt.encode('utf-8').decode(enc))
    except Exception as e:
        print('ERR', enc, repr(e)[:80])
