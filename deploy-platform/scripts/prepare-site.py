#!/usr/bin/env python3
import json
import os
import shutil
import sys
from pathlib import Path


def fail(msg: str) -> None:
    print(msg, file=sys.stderr)
    raise SystemExit(1)


def main() -> None:
    if len(sys.argv) != 4:
        fail('usage: prepare-site.py <manifest.json> <environment> <output_dir>')

    manifest_path = Path(sys.argv[1])
    environment = sys.argv[2]
    output_dir = Path(sys.argv[3])

    data = json.loads(manifest_path.read_text(encoding='utf-8'))
    if environment not in data:
        fail(f'environment {environment!r} not defined in {manifest_path}')
    env = data[environment]
    if environment == 'production' and env.get('locked') and os.environ.get('ALLOW_PRODUCTION_BUILD') != '1':
        fail('production is locked in the site manifest; ALLOW_PRODUCTION_BUILD=1 is required')

    source = Path(data['source_dir'])
    if not source.is_dir():
        fail(f'source directory does not exist: {source}')

    if output_dir.exists():
        shutil.rmtree(output_dir)
    shutil.copytree(source, output_dir)

    source_base = data.get('production', {}).get('base_path', '/')
    target_base = env.get('base_path', source_base)

    # Rewrite absolute site-root references only in text web files. Source remains untouched.
    if source_base != target_base:
        for path in output_dir.rglob('*'):
            if path.is_file() and path.suffix.lower() in {'.html', '.htm', '.php', '.css', '.js', '.json', '.xml', '.txt'}:
                try:
                    text = path.read_text(encoding='utf-8')
                except UnicodeDecodeError:
                    continue
                updated = text.replace(source_base, target_base)
                if updated != text:
                    path.write_text(updated, encoding='utf-8')

    marker = {
        'site': data['id'],
        'environment': environment,
        'source_dir': data['source_dir'],
        'target_path': env['target_path'],
        'public_url': env['public_url'],
    }
    (output_dir / 'deployment-platform.json').write_text(json.dumps(marker, indent=2) + '\n', encoding='utf-8')
    print(json.dumps(marker))


if __name__ == '__main__':
    main()
