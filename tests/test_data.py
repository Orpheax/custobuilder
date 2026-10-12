import json,glob,subprocess,sys
def test_schema():
    assert subprocess.run([sys.executable,'validate.py']).returncode==0
def test_envelopes():
    for f in glob.glob('data/*.json'):
        d=json.load(open(f)); assert d['schema']=='custodes-data/1' and d['items']
