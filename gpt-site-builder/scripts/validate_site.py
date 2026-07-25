#!/usr/bin/env python3
import json,re,sys
from pathlib import Path

FORBIDDEN=('public_html/uber','public_html/wetbeard','public_html/dev-platform','madmorrigan.com/uber','madmorrigan.com/wetbeard')

def fail(msg):
    print(msg,file=sys.stderr); raise SystemExit(1)

if len(sys.argv)!=2: fail('usage: validate_site.py <spec.json>')
spec_path=Path(sys.argv[1]); spec=json.loads(spec_path.read_text(encoding='utf-8'))
site_id=spec.get('id','')
if not re.fullmatch(r'[a-z0-9][a-z0-9-]{1,48}',site_id): fail('invalid site id')
source=Path(spec.get('source_dir',''))
if source != Path('builder-sites')/site_id: fail('source_dir must equal builder-sites/<site-id>')
target=spec.get('target_path','')
if target != f'public_html/gpt-builder-preview/{site_id}': fail('target outside isolated preview namespace')
release_root=spec.get('release_root','')
backup_root=spec.get('backup_root','')
if release_root != f'public_html/gpt-builder-system/releases/{site_id}': fail('invalid release root')
if backup_root != f'public_html/gpt-builder-system/backups/{site_id}': fail('invalid backup root')
url=spec.get('public_url','')
if not url.endswith(f'/gpt-builder-preview/{site_id}/'): fail('public_url does not match site id')
if spec.get('host') not in {'bluehost','ocdsoft'}: fail('unsupported host')
if not source.is_dir() or not (source/'index.html').is_file(): fail('site source/index.html missing')
for path in source.rglob('*'):
    if not path.is_file(): continue
    if path.suffix.lower() not in {'.html','.htm','.css','.js','.json','.svg','.xml','.txt','.php'}: continue
    try: text=path.read_text(encoding='utf-8')
    except UnicodeDecodeError: continue
    low=text.lower()
    for forbidden in FORBIDDEN:
        if forbidden.lower() in low: fail(f'forbidden production reference in {path}: {forbidden}')
html=(source/'index.html').read_text(encoding='utf-8')
for marker in spec.get('health_markers',[]):
    if marker not in html: fail(f'missing health marker: {marker}')
print(json.dumps({'ok':True,'site':site_id,'target':target,'url':url}))
