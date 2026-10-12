# Bundle data/*.json (validated) into data.js : window.DATA = {DETS:..., U:..., ...}
import json,sys
FILES={'DETS':'detachments','ENH':'enhancements','CATS':'categories','U':'units','WG':'wargear','NOTES':'notes','WR':'winrates','KT':'katah','DSD':'datasheet_stats'}
out={k:json.load(open('data/%s.json'%f))['items'] for k,f in FILES.items()}
open('data.js','w').write('/* generated from data/*.json by mkdata.py : do not edit */\nwindow.DATA='+json.dumps(out,ensure_ascii=False,separators=(',',':'))+';\n')
print('data.js',len(open('data.js').read()))
