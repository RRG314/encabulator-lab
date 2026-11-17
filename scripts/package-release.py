"""Build per-machine public engineering archives and the SHA-256 manifest."""
import argparse
import fnmatch
import hashlib
import json
from pathlib import Path
import subprocess
from zipfile import ZipFile

ROOT=Path(__file__).resolve().parents[1]
COMMON=(
    'LICENSE','CITATION.cff','engineering/REFERENCES.md',
    'engineering/TECHNICAL_EVIDENCE.md','engineering/INTERCHANGEABILITY.md','public/models/parity.json',
)
MACHINE_PATHS={
    'TE-01':('docs/engineering','docs/science','cad/models/te01',
        *(f'data/{name}.json' for name in (
            'parts','assemblies','connections','model-layout','service','simulations','te01-envelopes',
        ))),
    'RE-01':('engineering/re01','data/re01','public/models/re01','cad/models/re01'),
    'ME-01':('engineering/me01','data/me01','public/models/me01','cad/models/me01'),
}


def check_archive(path):
    with ZipFile(path) as archive:
        invalid=archive.testzip()
    if invalid is not None:
        raise IOError(f'Archive integrity failure: {path.name}/{invalid}')


def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('output',type=Path)
    parser.add_argument('--ref',default='HEAD',help='Git commit or ref to archive')
    parser.add_argument('--archive-only',action='store_true',help='Export the historical CAD packages only')
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
    project_paths={} if args.archive_only else MACHINE_PATHS
    for machine,paths in project_paths.items():
        target=output/f'{machine}-Engineering-Package.zip'
        temporary=target.with_suffix('.zip.tmp')
        assets=te01_assets if machine=='TE-01' else ()
        try:
            subprocess.run(
                ['git','archive','--format=zip','-5',f'--output={temporary}',commit,
                 '--',*COMMON,*paths,*assets],
                cwd=ROOT,check=True,
            )
            check_archive(temporary)
            temporary.replace(target)
        finally:
            temporary.unlink(missing_ok=True)
        resulting.append(target)

    index='data/archive/cad.json'
    if subprocess.check_output(['git','ls-tree','-r','--name-only',commit,'--',index],cwd=ROOT):
        configurations=json.loads(subprocess.check_output(['git','show',f'{commit}:{index}'],cwd=ROOT))
        for model in sorted(configurations.values(),key=lambda entry:entry['code']):
            asset=next(file['path'] for file in model['assets'] if file['path'].endswith('/engineering-package.zip'))
            target=output/f"{model['code']}-Engineering-Package.zip"
            temporary=target.with_suffix('.zip.tmp')
            try:
                with temporary.open('wb') as stream:
                    subprocess.run(['git','show',f'{commit}:public/{asset}'],cwd=ROOT,stdout=stream,check=True)
                check_archive(temporary)
                temporary.replace(target)
            finally:
                temporary.unlink(missing_ok=True)
            resulting.append(target)

    if not resulting:
        parser.error('The selected revision contains no historical CAD packages')

    with (output/'SHA256SUMS.txt').open('w') as manifest:
        for path in sorted(resulting):
            digest=hashlib.sha256(path.read_bytes()).hexdigest()
            manifest.write(f'{digest}  {path.name}\n')
    for path in resulting: print(path.name,path.stat().st_size)

if __name__=='__main__':
    main()
