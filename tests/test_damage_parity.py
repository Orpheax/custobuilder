"""dmg.py and damage.js must agree: same random cases through both engines."""
import json,random,subprocess,sys,os,shutil,pytest
sys.path.insert(0,os.getcwd())
from dmg import prep,eval_
@pytest.mark.skipif(shutil.which('node') is None,reason='node missing')
def test_parity(tmp_path):
    d=json.load(open('data/datasheet_stats.json'))['items']
    ws=[dict(w,t=('R' if i<len(u['ranged']) else 'M')) for u in d.values() for i,w in enumerate(u['ranged']+u['melee'])]
    random.seed(2); C=[]
    for _ in range(200):
        w=random.choice(ws); t={'T':random.randint(2,14),'Sv':random.randint(2,7),'Inv':random.choice([0,3,4,5]),'Fnp':random.choice([0,5]),'W':random.choice([1,3,10,22]),'dr':random.choice([0,1]),'kw':random.sample(['INFANTRY','MONSTER','VEHICLE','PSYKER'],2)}
        m={'half':random.random()<.4,'hit':random.choice([-1,0,1]),'rrh':random.choice(['none','ones','failed']),'ch':random.choice([6,5]),'sus':random.choice([0,1]),'lethal':random.random()<.3,'dev':random.random()<.3,'cover':random.random()<.4}
        C.append((w,t,m))
    (tmp_path/'c.json').write_text(json.dumps(C))
    js=open('damage.js').read(); a=js.index('function clamp'); b=js.index('window.__dmg')
    (tmp_path/'h.js').write_text("const fs=require('fs');"+js[a:b]+"const C=JSON.parse(fs.readFileSync(%r));console.log(JSON.stringify(C.map(c=>ev(prep(c[0],c[1],c[2])))))"%str(tmp_path/'c.json'))
    out=json.loads(subprocess.check_output(['node',str(tmp_path/'h.js')]))
    for (w,t,m),o in zip(C,out): assert abs(eval_(prep(w,t,m))[0]-o[0])<1e-9
