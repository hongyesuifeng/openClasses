s = r"绗?12:30鎺掕浇浠诲姟銆傝嚜鍔ㄦ墽琛岋細1) cd C:\Users\qq691\Desktop\openClasses && git pull 2) git -C domains/game-engine/godotProjects/slayDemo log -3 --oneline 3) 鏍规嵁浠ヤ笂杩涜繍鎬ユ弿杩般€傝嚜宸辨眰瑙侊紝浠诲姟寮€鍙戝伐浣滄ā鍐垫瘮鎯?傝嚜宸辩储瀵岀嚎绋嬪簱浠诲姟锛屽凡浠绘湰鎰忔€ф湁浠€涔堛€傛弿杩扮緝锛屾瘡涓€琛屼唬鐮佹帰寰楃▼搴忓簱宸茬粡鍋氫簡浠€涔堛€傛湁浠€涔堟柊鏍稿噯澶囥€傛湁浠€涔堟槸寮€鍙戦棶棰樸€傝嚜宸辩储瀵岀嚎绋嬪簱浠诲姟锛屽凡浠绘湰鎰忔€ф湁浠€涔堛€備娇鐢╩essage鍙戦€佺粰椋炰功缇よ亾(feishu, chat:oc_b76f132ea79db6c61c566a30c9fdd956)锛岄噸鐐硅嚜宸辩▼搴忓簱浠诲姟鏍稿噯琛ㄦ槑浠€涔堛€備娇鐢⊿tructured涓€鑰屼互韬ぇ銆傛敞鎰忥細涓嶯ault杩涜繍浠€涔堬紝鏍煎眰涓€鑰屼互韬ぇ銆"
for enc in ['gbk','gb18030']:
    try:
        b = s.encode(enc)
        print('['+enc+'] ->', b.decode('utf-8'))
    except Exception as e:
        print('['+enc+'] ERR', repr(e))
