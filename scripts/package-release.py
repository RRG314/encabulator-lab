"""Build per-machine public engineering archives and the SHA-256 manifest."""
import argparse
import fnmatch
import hashlib
from pathlib import Path
import subprocess
from zipfile import ZipFile

ROOT=Path(__file__).resolve().parents[1]
COMMON=(
    'LICENSE','CITATION.cff','engineering/REFERENCES.md',
    'engineering/INTERCHANGEABILITY.md','public/models/parity.json',
)
MACHINE_PATHS={
    'TE-01':('docs/engineering','docs/science','cad/models/te01',
        *(f'data/{name}.json' for name in (
            'parts','assemblies','connections','model-layout','service','simulations','te01-envelopes',
        ))),
    'RE-01':('engineering/re01','data/re01','public/models/re01','cad/models/re01'),
    'ME-01':('engineering/me01','data/me01','public/models/me01','cad/models/me01'),
}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('output',type=Path)
    parser.add_argument('--ref',default='HEAD',help='Git commit or ref to archive')
    args=parser.parse_args()
    output=args.output.resolve()
    output.mkdir(parents=True,exist_ok=True)
    commit=subprocess.check_output(
        ['git','rev-parse','--verify','--end-of-options',f'{args.ref}^{{commit}}'],
        cwd=ROOT,text=True,
    ).strip()
    model_files=subprocess.check_output(
        ['git','ls-tree','--name-only','-z',f'{commit}:public/models'],cwd=ROOT,text=True,
    ).split('\0')
    te01_assets=tuple(f'public/models/{name}' for name in model_files
        if fnmatch.fnmatchcase(name,'te01*') or name in (
            'validation.json','numerical-validation.json','dgs-travel-study.json',
        ))
    resulting=[]
    for machine,paths in MACHINE_PATHS.items():
        target=output/f'{machine}-Engineering-Package.zip'
        temporary=target.with_suffix('.zip.tmp')
        assets=te01_assets if machine=='TE-01' else ()
        try:
            subprocess.run(
                ['git','archive','--format=zip','-5',f'--output={temporary}',commit,
                 '--',*COMMON,*paths,*assets],
                cwd=ROOT,check=True,
            )
            with ZipFile(temporary) as archive:
                invalid=archive.testzip()
                if invalid is not None:
                    raise IOError(f'Archive integrity failure: {machine}/{invalid}')
            temporary.replace(target)
        finally:
            temporary.unlink(missing_ok=True)
        resulting.append(target)
    with (output/'SHA256SUMS.txt').open('w') as manifest:
        for path in resulting:
            digest=hashlib.sha256(path.read_bytes()).hexdigest()
            manifest.write(f'{digest}  {path.name}\n')
    for path in resulting: print(path.name,path.stat().st_size)

if __name__=='__main__':
    main()
