#!/usr/bin/env python3
"""Validate data/*.json : envelope, required fields, unique ids, cross references, forbidden wording."""
import json,re,sys,glob,datetime
errs=[]
def err(m): errs.append(m)
L=lambda f:json.load(open('data/%s.json'%f))
env={}
for fp in sorted(glob.glob('data/*.json')):
    d=json.load(open(fp)); env[fp]=d
    for k in ('schema','dataset','edition','source','last_verified','items'):
        if k not in d: err('%s: missing envelope field %s'%(fp,k))
    try: datetime.date.fromisoformat(d.get('last_verified',''))
    except Exception: err('%s: last_verified is not an ISO date'%fp)
    if d.get('schema')!='custodes-data/1': err('%s: unknown schema'%fp)
    txt=json.dumps(d,ensure_ascii=False).lower()
    for bad in ('illegible','in the photo','you provided','the table you','lorem'):
        if bad in txt: err('%s: forbidden wording "%s"'%(fp,bad))
dets=L('detachments')['items']; enh=L('enhancements')['items']; units=L('units')['items']; cats=L('categories')['items']
wg=L('wargear')['items']; kt=L('katah')['items']; dsd=L('datasheet_stats')['items']
wr=L('winrates')['items']
def uniq(name,ids):
    seen=set()
    for i in ids:
        if i in seen: err('%s: duplicate id %s'%(name,i))
        seen.add(i)
    return seen
did=uniq('detachments',[d['id'] for d in dets]); eid=uniq('enhancements',[e['id'] for e in enh]); uid=uniq('units',[u['id'] for u in units])
cid={c[0] for c in cats}
for d in dets:
    for k in ('id','name','fd','dp','rule','strats'):
        if k not in d: err('detachment %s: missing %s'%(d.get('id'),k))
    if not isinstance(d.get('dp'),int) or d['dp']<1: err('detachment %s: dp must be a positive integer'%d['id'])
    if not {'n','t'}<=set(d.get('rule',{})): err('detachment %s: rule needs n and t'%d['id'])
    for s in d.get('strats',[]):
        if not(isinstance(s,list) and len(s)==4 and isinstance(s[1],int) and all(isinstance(x,str) for x in (s[0],s[2],s[3]))): err('detachment %s: bad stratagem %r'%(d['id'],s[:1]))
for e in enh:
    for k in ('id','det','k','name','p','req','t'):
        if k not in e: err('enhancement %s: missing %s'%(e.get('id'),k))
    if e.get('det') not in did: err('enhancement %s: unknown detachment %s'%(e['id'],e.get('det')))
    if not isinstance(e.get('p'),int): err('enhancement %s: p must be an integer'%e['id'])
for u in units:
    for k in ('id','name','cat','kw','st','opts'):
        if k not in u: err('unit %s: missing %s'%(u.get('id'),k))
    if u.get('cat') not in cid: err('unit %s: unknown category %s'%(u['id'],u.get('cat')))
    if not u.get('opts'): err('unit %s: no options'%u['id'])
    for o in u.get('opts',[]):
        if 'l' not in o or 'p' not in o: err('unit %s: option needs l and p'%u['id'])
        elif o['p'] is not None and (not isinstance(o['p'],int) or o['p']<=0): err('unit %s: bad points %r'%(u['id'],o['p']))
    for n,v in (u.get('ups') or {}).items():
        if not str(n).isdigit() or int(n)<2 or not isinstance(v,int): err('unit %s: bad surcharge %s:%s'%(u['id'],n,v))
for k in wg:
    if k not in uid: err('wargear: unknown unit %s'%k)
sheet_ids=set(dsd)
for u in units:
    if u.get('nods'): continue
    need=['aquilon_g','aquilon_t'] if u['id']=='aquilon' else [u['id']]
    for s in need:
        if s not in sheet_ids: err('datasheet missing for unit %s'%u['id'])
for s in sheet_ids:
    if s not in uid and s not in('aquilon_g','aquilon_t'): err('datasheet %s has no unit'%s)
for k in kt:
    if k['d'] not in did: err('ka’tah %s: unknown detachment %s'%(k['n'],k['d']))
for m in wr['matchups']:
    if m['wr'] is not None and not (0<=m['wr']<=100): err('winrate out of range: %s'%m['f'])
if wr['overall']['games']<=0: err('winrates: no games')
rl=L('datasheet_rules')['items']
for k,rs in rl['units'].items():
    if k not in dsd: err('rules: unknown datasheet %s'%k)
    for r in rs:
        o=r['fx'].get('only')
        if o and o not in [w['name'] for w in dsd[k]['ranged']+dsd[k]['melee']]: err('rules: %s: weapon %s not found'%(k,o))
for c in L('core_stratagems')['items']:
    for k in ('n','cp','w','t','s','ph'):
        if k not in c: err('core stratagem %s: missing %s'%(c.get('n'),k))
sc=L('damage_scoring'); 
for k,r in sc['items'].items():
    if k not in dsd: err('damage_scoring: unknown datasheet %s'%k)
    for t,vals in r.items():
        if len(vals)!=len(sc['profiles']): err('damage_scoring: %s %s has %d values'%(k,t,len(vals)))
        if any((not isinstance(x,(int,float))) or x<0 for x in vals): err('damage_scoring: %s %s bad value'%(k,t))
if errs:
    print('FAIL: %d problem(s)'%len(errs)); [print(' -',e) for e in errs]; sys.exit(1)
print('OK: %d detachments, %d enhancements, %d units, %d datasheets, %d files'%(len(dets),len(enh),len(units),len(dsd),len(env)))
