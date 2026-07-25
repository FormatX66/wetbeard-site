#!/usr/bin/env python3
import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
manifest = json.loads((ROOT / 'workflow-test-platform/site.json').read_text(encoding='utf-8'))
source = ROOT / manifest['source_dir']

errors = []

def require(cond, msg):
    if not cond:
        errors.append(msg)

require(source.is_dir(), f"missing source dir: {source}")
index = source / 'index.html'
require(index.is_file(), 'missing index.html')
if index.is_file():
    html = index.read_text(encoding='utf-8')
    for marker in manifest.get('health_markers', []):
        require(marker in html, f'missing marker: {marker}')

require((source / 'assets/calibration-target.svg').is_file(), 'missing calibration SVG')
require(manifest['target_path'] == 'public_html/workflow-test-lab', 'target path changed')
require(manifest['release_root'] == 'public_html/workflow-test-lab-releases', 'release root changed')
require(manifest['backup_root'] == 'public_html/workflow-test-lab-backups', 'backup root changed')

for value in (manifest['target_path'], manifest['release_root'], manifest['backup_root']):
    lower = value.lower()
    require('uber' not in lower, f'unsafe target contains uber: {value}')
    require('wetbeard' not in lower, f'unsafe target contains wetbeard: {value}')
    require(value != 'public_html', f'unsafe document-root target: {value}')

for path in source.rglob('*'):
    if path.is_file() and path.suffix.lower() in {'.html', '.css', '.js', '.php', '.json'}:
        text = path.read_text(encoding='utf-8', errors='ignore').lower()
        require('public_html/uber' not in text, f'production path reference in {path.relative_to(ROOT)}')

if errors:
    print('\n'.join(f'ERROR: {e}' for e in errors), file=sys.stderr)
    raise SystemExit(1)
print('Workflow Test Lab validation passed')
