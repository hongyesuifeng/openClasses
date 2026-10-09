import re
src = open("decode_task.py","r",encoding="utf-8",errors="replace").read()
m = re.search(r's = "(.*?)"', src, re.S)
raw = m.group(1)
# undo python string escapes
raw = raw.encode("utf-8").decode("unicode_escape")
for enc in ["latin1","utf-8"]:
    try:
        out = raw.encode(enc).decode("gbk")
        print("=== via", enc, "-> gbk ===")
        print(out)
        break
    except Exception as e:
        print("fail", enc, e)
