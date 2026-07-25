#!/usr/bin/env python3
import json
import pathlib
import re
import sys
from urllib.parse import urlparse


def fail(msg: str) -> None:
    print(f"ERROR: {msg}", file=sys.stderr)
    raise SystemExit(1)


def main() -> int:
    if len(sys.argv) != 2:
        fail("usage: check-site.py <site-name>")

    site = sys.argv[1]
    root = pathlib.Path(__file__).resolve().parents[2]
    manifest_path = root / "deploy-platform" / "sites" / f"{site}.json"
    if not manifest_path.exists():
        fail(f"unknown site '{site}'")

    config = json.loads(manifest_path.read_text(encoding="utf-8"))
    source = root / config["source_dir"]
    if not source.exists():
        fail(f"source directory missing: {source}")

    html_files = list(source.rglob("*.html")) + list(source.rglob("*.php"))
    if not html_files:
        fail("no HTML/PHP entry files found")

    problems = []
    for path in html_files:
        text = path.read_text(encoding="utf-8", errors="replace")
        if "<html" not in text.lower() and path.suffix.lower() == ".html":
            problems.append(f"{path.relative_to(root)}: missing <html>")
        for match in re.finditer(r'''(?:src|href)=["']([^"']+)["']''', text, flags=re.I):
            ref = match.group(1)
            if ref.startswith(("http://", "https://", "mailto:", "tel:", "#", "data:", "javascript:")):
                continue
            parsed = urlparse(ref)
            local_ref = parsed.path
            if not local_ref or local_ref.startswith("/"):
                continue
            target = (path.parent / local_ref).resolve()
            try:
                target.relative_to(source.resolve())
            except ValueError:
                continue
            if not target.exists():
                problems.append(f"{path.relative_to(root)}: missing local asset {ref}")

    if problems:
        for p in problems:
            print(f"ERROR: {p}", file=sys.stderr)
        return 1

    print(f"OK: {site} local source check passed ({len(html_files)} HTML/PHP files scanned)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
