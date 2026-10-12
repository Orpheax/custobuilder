# Expected-damage model v2 (averages). Twin of damage.js: change both together; tests/test_damage_parity.py checks they agree.
import re
def clamp(x,a,b): return max(a,min(b,x))
def dist(d):
    m=re.fullmatch(r'D(3|6)(?:\+(\d+))?',str(d))
    if m:
        n=int(m.group(1)); k=int(m.group(2) or 0); return [k+i for i in range(1,n+1)]
    return [int(d)]
def p_need_wound(S,T):
    if S>=2*T: return 2
    if S>T: return 3
    if S==T: return 4
    if S*2<=T: return 6
    return 5
def roll(need,mod,crit,rr):
    """one D6 roll. need: target number; mod: clamped -1..+1; crit: unmodified value that is a critical success; rr: none|ones|failed.
    returns (p_crit, p_success_not_crit, p_fail)"""
    pc=ps=pf=0.0
    for f in range(1,7):
        if f>=crit: pc+=1/6
        elif f!=1 and f+mod>=need: ps+=1/6
        else: pf+=1/6
    if rr=='failed': return (pc+pf*pc, ps+pf*ps, pf*pf)
    if rr=='ones':
        return (pc+pc/6, ps+ps/6, pf-1/6+pf/6)
    return (pc,ps,pf)
def cond_ok(c,kw):
    c=(c or '').strip().lower()
    if not c: return True
    k={x.lower() for x in kw}; mv=bool(k&{'monster','vehicle'})
    if c=='non-monster/vehicle': return not mv
    if c=='monster/vehicle': return mv
    return c in k
def parse_kw(kws):
    o={}
    for k in kws:
        base,_,c=k.partition(':'); base=base.strip(); c=c.strip()
        if base.startswith('ANTI-'):
            m=re.fullmatch(r'ANTI-([A-Z]+) (\d)\+',base)
            if m: o['anti']=(m.group(1).lower(),int(m.group(2)))
        elif base.startswith('SUSTAINED HITS'): o['sus']=(int(base.split()[-1]),c)
        elif base.startswith('RAPID FIRE'): o['rf']=int(base.split()[-1])
        elif base.startswith('MELTA'): o['melta']=int(base.split()[-1])
        elif base=='LETHAL HITS': o['lethal']=c
        elif base=='DEVASTATING WOUNDS': o['dev']=c
        elif base=='TWIN-LINKED': o['twin']=True
        elif base=='TORRENT': o['torrent']=True
        elif base=='LANCE': o['lance']=True
    return o
DEF=dict(half=False,charge=False,hit=0,wound=0,rrh='none',rrw='none',ch=6,cw=6,addA=0,addS=0,addAP=0,addD=0,sus=0,lethal=False,dev=False,cover=False,ignCover=False,thit=0,twound=0)
def prep(w,t,m=None):
    m={**DEF,**(m or {})}; kw=t.get('kw',[]); k=parse_kw(w['kw'])
    A=float(w['A'])+m['addA']+(k.get('rf',0) if m['half'] else 0)
    skill=w.get('BS') or w.get('WS'); tor=bool(k.get('torrent')) or skill=='-'
    need_h=0 if tor else int(skill[0])
    mh=clamp(m['hit']+m['thit'],-1,1)
    if tor: hc,hs,hf=0.0,1.0,0.0
    else: hc,hs,hf=roll(need_h,mh,m['ch'],m['rrh'])
    sus=m['sus']+(k['sus'][0] if 'sus' in k and cond_ok(k['sus'][1],kw) else 0)
    lethal=m['lethal'] or ('lethal' in k and cond_ok(k['lethal'],kw))
    dev=m['dev'] or ('dev' in k and cond_ok(k['dev'],kw))
    S=int(w['S'])+m['addS']; need_w=p_need_wound(S,t['T'])
    mw=clamp(m['wound']+m['twound']+(1 if (m['charge'] and k.get('lance')) else 0),-1,1)
    cw=m['cw']
    if 'anti' in k and k['anti'][0] in {x.lower() for x in kw}: cw=min(cw,k['anti'][1])
    rrw='failed' if (k.get('twin') or m['rrw']=='failed') else m['rrw']
    wc,ws,wf=roll(need_w,mw,cw,rrw)
    apabs=-int(w['AP'])+m['addAP']
    need_s=t['Sv']+apabs
    if m['cover'] and not m['ignCover'] and w.get('t','R')=='R' and not (apabs==0 and t['Sv']<=3): need_s-=1
    pas=clamp((7-need_s)/6,0,5/6)
    if t.get('Inv'): pas=max(pas,clamp((7-t['Inv'])/6,0,5/6))
    melta=k.get('melta',0) if m['half'] else 0
    ds=[x+m['addD']+melta for x in dist(w['D'])]
    return dict(A=A,hc=hc,hs=hs,sus=sus,lethal=lethal,dev=dev,wc=wc,ws=ws,pas=pas,ds=ds,W=t['W'],dr=t.get('dr',0),fnp=t.get('Fnp',0))
def eval_(p):
    N=p['A']; crit=N*p['hc']; norm=N*p['hs']
    rolled=norm+crit*p['sus']+(0 if p['lethal'] else crit); auto=crit if p['lethal'] else 0.0
    pw=p['wc']+p['ws']; wounds=auto+rolled*pw; devc=rolled*p['wc'] if p['dev'] else 0.0
    W=p['W']; dr=p['dr']; fn=1-(7-p['fnp'])/6 if p['fnp'] else 1.0
    dn=sum(min(max(1,d-dr),W) for d in p['ds'])/len(p['ds'])
    dm=sum(min(d,W) for d in p['ds'])/len(p['ds'])
    dmg=((wounds-devc)*(1-p['pas'])*dn+devc*dm)*fn
    return dmg, dmg/W
def expect(w,t,half=False,charge=False,m=None):
    mm={**(m or {}),'half':half,'charge':charge}
    return eval_(prep(w,t,mm))
