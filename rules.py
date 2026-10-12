# Datasheet / ka'tah rules resolver. Twin of the resolver in damage.js.
import json
RULES=json.load(open('data/datasheet_rules.json'))['items']
RANK={'none':0,'ones':1,'failed':2}
def _tgt_ok(c,t,own_T):
    kw={x.lower() for x in t.get('kw',[])}; mv=bool(kw&{'monster','vehicle'})
    return {'any':True,'non-mv':not mv,'mv':mv,'infantry':'infantry' in kw,'t-gt-own':t['T']>own_T}[c]
def resolve(unit_key,own_T,w,t,tog=(),def_key=None):
    """returns (m_add, t_out, applied) for one weapon profile. tog: set of active toggles."""
    m={}; to=dict(t); applied=[]
    def add(k,v):
        if k in('rrh','rrw'): m[k]=v if RANK[v]>RANK.get(m.get(k,'none'),0) else m[k]
        elif k in('ap','sus','addA','wound'): m[k]=m.get(k,0)+v
        elif k=='lethal': m['lethal']=True
        elif k=='lim': m['lim']={'h':1,'w':1,'d':1}
        elif k=='ignmods': m['ignmods']=True
    maps={'ap':'addAP','sus':'sus','addA':'addA','wound':'wound'}
    atk=list(RULES['units'].get(unit_key,[]))+list(RULES['katah'])
    if 'aura' in tog: atk.append(RULES['aura'])
    for r in atk:
        if r['side']!='atk': continue
        if r['wt'] not in('*',w['t']): continue
        if not _tgt_ok(r['tgt'],t,own_T): continue
        if r.get('tog') and r['tog'] not in tog: continue
        fx=r['fx']
        if fx.get('only') and fx['only']!=w['name']: continue
        for k,v in fx.items():
            if k=='only': continue
            if k in maps: add(k,v)
            else: add(k,v)
        applied.append(r['n'])
    if def_key is not None:
        dl=list(RULES['units'].get(def_key,[]))+list(RULES['katah'])
        for r in dl:
            if r['side']!='def': continue
            if r['wt'] not in('*',w['t']): continue
            if r.get('tog') and r['tog'] not in tog: continue
            fx=r['fx']
            if 'dr' in fx: to['dr']=to.get('dr',0)+fx['dr']
            if 'wS' in fx: to['wS']=fx['wS']
            if 'apd' in fx: to['apd']=fx['apd']
            if 'hm' in fx: to['hm']=to.get('hm',0)+fx['hm']
            if 'inv' in fx: to['Inv']=min([x for x in (to.get('Inv',0),fx['inv']) if x] or [fx['inv']])
            applied.append(r['n'])
    # normalise names used by engine
    mm={}
    for k,v in m.items(): mm[{'ap':'addAP'}.get(k,k)]=v
    return mm,to,applied
