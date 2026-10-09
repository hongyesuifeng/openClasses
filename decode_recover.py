import re
src = open('decode_task.py','r',encoding='utf-8').read()
m = re.search(r's = "(.*?)"', src, re.S)
s = m.group(1)
out = open('decoded_out.txt','w',encoding='utf-8')
cands = []
cands.append(('gbk->utf8 (correct)', s.encode('gbk','replace').decode('utf-8','replace')))
cands.append(('gb18030->utf8', s.encode('gb18030','replace').decode('utf-8','replace')))
for name, txt in cands:
    cjk = sum(1 for ch in txt if '\u4e00'<=ch<='\u9fff')
    out.write('==== %s | cjk=%d ====\n' % (name, cjk))
    out.write(txt)
    out.write('\n')
out.close()
print('done')
