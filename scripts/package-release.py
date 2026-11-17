"""Build per-machine public engineering archives and the SHA-256 manifest."""
import argparse
import hashlib
from pathlib import Path
from zipfile import ZipFile, ZIP_DEFLATED

ROOT=Path(__file__).resolve().parents[1]
DIRECTORIES={
    'TE-01':(ROOT/'docs/engineering',ROOT/'docs/science'),
    'RE-01':(ROOT/'engineering/re01',ROOT/'data/re01',ROOT/'public/models/re01'),
    'ME-01':(ROOT/'engineering/me01',ROOT/'data/me01',ROOT/'public/models/me01'),
}

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('output',type=Path)
    output=parser.parse_args().output
    output.mkdir(parents=True,exist_ok=True)
    resulting=[]
    for machine,directories in DIRECTORIES.items():
        target=output/f'{machine}-Engineering-Package.zip'
        paths=[ROOT/'LICENSE',ROOT/'CITATION.cff',ROOT/'engineering/REFERENCES.md',ROOT/'engineering/INTERCHANGEABILITY.md']
        for directory in directories:
            paths.extend(f for f in directory.rglob('*') if f.is_file())
        if machine=='TE-01':
            paths.extend(path for path in (ROOT/'public/models').iterdir() if path.is_file() and path.name!='parity.json')
            paths.extend(ROOT/'data'/name for name in ('parts.json','assemblies.json','connections.json','model-layout.json','service.json','simulations.json','te01-envelopes.json'))
        with ZipFile(target,'w',ZIP_DEFLATED,compresslevel=5) as archive:
            for path in sorted(set(paths)):
                if path.name.startswith('.') or path.suffix.lower() in {'.fcbak','.pyc'}:
                    continue
                archive.write(path,path.relative_to(ROOT))
        with ZipFile(target) as archive:
            if archive.testzip() is not None: raise IOError(f'Archive integrity failure: {machine}')
        resulting.append(target)
    with (output/'SHA256SUMS.txt').open('w') as manifest:
        for path in resulting:
            with path.open('rb') as stream:
                digest=hashlib.file_digest(stream,'sha256').hexdigest()
            manifest.write(f'{digest}  {path.name}\n')
    for path in resulting: print(path.name,path.stat().st_size)

if __name__=='__main__':
    main()
