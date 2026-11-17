"""Check release candidates without printing any matched sensitive value."""
import argparse
from pathlib import Path
import re
import subprocess
from zipfile import ZipFile

ROOT=Path(__file__).resolve().parents[1]
PATTERNS={
 'credential signature':re.compile(rb'(?:gh[pousr]_[a-zA-Z0-9]{28,}|github_pat_[A-Za-z0-9_]{45,}|AKIA[A-Z0-9]{16}|-----BEGIN (?:[A-Z]+ )*PRIVATE KEY-----)'),
 'local user path':re.compile(rb'(?:/Users/[A-Za-z0-9_.-]+/|/home/[A-Za-z0-9_.-]+/(?:Documents|Desktop|Downloads)/|[A-Z]:\\Users\\[^\\[:space:]]+\\)'),
}
TEXT={'.css','.ts','.tsx','.js','.mjs','.md','.yml','.yaml','.json','.cff','.xml','.csv','.html','.txt','.svg','.py','.step','.sh'}
BLOCKED={'.env','.npmrc','.pypirc','id_rsa','id_ed25519'}

def items(tree=None):
    if tree:
        names=subprocess.check_output(['git','ls-tree','-rz','--name-only',tree],cwd=ROOT).split(b'\0')
    else:
        names=subprocess.check_output(['git','ls-files','-z'],cwd=ROOT).split(b'\0')
    return [x.decode() for x in names if x]

def matches(path,data):
    return [f'{path}: {name}' for name,pattern in PATTERNS.items() if pattern.search(data)]

def check(tree=None):
    problems=[]
    for name in items(tree):
        file=Path(name)
        if file.name in BLOCKED or file.name.startswith('.env.') or file.suffix in {'.pem','.key','.p12'}:
            problems.append(f'{name}: private configuration filename')
        if file.suffix.lower() not in TEXT | {'.fcstd'} or name=='scripts/audit-publication.py':
            continue
        if tree:
            data=subprocess.check_output(['git','show',f'{tree}:{name}'],cwd=ROOT)
        else:
            data=(ROOT/file).read_bytes()
        if file.suffix.lower()=='.fcstd':
            from io import BytesIO
            with ZipFile(BytesIO(data)) as archive:
                for entry in archive.namelist():
                    if entry.endswith('.xml'):
                        problems.extend(matches(f'{name}:{entry}',archive.read(entry)))
        else:
            problems.extend(matches(name,data))
    return problems

if __name__=='__main__':
    parser=argparse.ArgumentParser()
    parser.add_argument('--history',action='store_true')
    args=parser.parse_args()
    revisions=subprocess.check_output(['git','rev-list','--all'],cwd=ROOT,text=True).splitlines() if args.history else []
    findings=check()
    for revision in revisions:
        findings.extend(f'{revision[:8]} {entry}' for entry in check(revision))
    if findings:
        raise SystemExit('\n'.join(sorted(set(findings))))
    print(f'Publication check passed ({len(revisions)} historical revisions checked).')
