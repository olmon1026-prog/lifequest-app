#!/usr/bin/env python3
"""يكتب رقم الـ commit في sw.js بدل __BUILD__ (D-011، بلا sed)."""
import re
import subprocess
import sys

def main():
    try:
        sha = subprocess.run(['git', 'rev-parse', '--short', 'HEAD'],
                             capture_output=True, text=True, check=True).stdout.strip()
    except Exception:
        sha = 'dev'
    path = 'sw.js'
    with open(path, encoding='utf-8') as f:
        s = f.read()
    s2 = re.sub(r"'__BUILD__'|'(lq-)?[0-9a-f]{7,40}'(?=;\s*$)", f"'{sha}'", s, count=1, flags=re.M)
    # أبسط وأأمن: استبدال الثابت المعروف فقط
    s2 = s.replace("const BUILD = '__BUILD__';", f"const BUILD = '{sha}';")
    s2 = re.sub(r"const BUILD = '[0-9a-f]{7,40}';", f"const BUILD = '{sha}';", s2)
    with open(path, 'w', encoding='utf-8') as f:
        f.write(s2)
    print(f'sw.js BUILD={sha}')

if __name__ == '__main__':
    sys.exit(main())
